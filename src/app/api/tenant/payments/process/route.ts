// src/app/api/tenant/payments/process/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantEmail = session.user.email;
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    // Get payment details
    const payment = await monthlyPaymentsCollection.findOne({
      _id: new ObjectId(paymentId),
      tenantEmail: tenantEmail,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found or unauthorized" },
        { status: 404 }
      );
    }

    if (payment.status === "paid") {
      return NextResponse.json(
        { success: false, error: "Payment already completed" },
        { status: 400 }
      );
    }

    // Check if PayMongo keys are configured
    const secretKey = process.env.PAYMONGO_SECRET_API_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    console.log("Creating payment intent for:", {
      paymentId,
      amount: payment.amount,
      tenantEmail,
    });

    // Create PayMongo payment intent
    const paymongoResponse = await fetch(
      "https://api.paymongo.com/v1/payment_intents",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(payment.amount * 100), // Convert to centavos and ensure integer
              payment_method_allowed: [
                "card",
                "gcash",
                "paymaya",
                "grab_pay",
                "dob",
                "qrph",
                "billease",
              ],
              payment_method_options: {
                card: { request_three_d_secure: "any" },
              },
              currency: "PHP",
              capture_type: "automatic",
              description: `Property Payment - Month ${payment.monthNumber}`,
              metadata: {
                paymentId: payment._id.toString(),
                tenantEmail: tenantEmail,
                propertyId: payment.propertyId,
                monthNumber: payment.monthNumber.toString(),
                source: "tenant_portal",
              },
            },
          },
        }),
      }
    );

    const paymongoData = await paymongoResponse.json();

    console.log("PayMongo response status:", paymongoResponse.status);
    console.log("PayMongo response:", paymongoData);

    if (!paymongoResponse.ok) {
      console.error("PayMongo API error:", paymongoData);
      return NextResponse.json(
        {
          success: false,
          error:
            paymongoData?.errors?.[0]?.detail ||
            "Failed to create payment intent",
          details: paymongoData,
        },
        { status: 400 }
      );
    }

    // Update payment with PayMongo payment intent ID
    await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          paymentIntentId: paymongoData.data.id,
          updated_at: new Date().toISOString(),
        },
      }
    );

    // Create checkout session for hosted payment methods

    const checkoutResponse = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Basic ${Buffer.from(secretKey + ":").toString(
            "base64"
          )}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              // Required fields
              line_items: [
                {
                  currency: "PHP",
                  amount: Math.round(payment.amount * 100),
                  description: `Property Payment - Month ${payment.monthNumber}`,
                  name: `Monthly Payment - Month ${payment.monthNumber}`,
                  quantity: 1,
                },
              ],
              payment_method_types: [
                "gcash",
                "paymaya",
                "grab_pay",
                "card",
                "dob",
                "qrph",
              ],
              success_url: `${
                process.env.NODE_ENV === "production"
                  ? (process.env.NEXT_PUBLIC_URL || process.env.BETTER_AUTH_URL)
                  : (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_URL)
              }/payments/success?payment_id=${paymentId}`,
              cancel_url: `${
                process.env.NODE_ENV === "production"
                  ? (process.env.NEXT_PUBLIC_URL || process.env.BETTER_AUTH_URL)
                  : (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_URL)
              }/payments/cancel?payment_id=${paymentId}`,

              description: `Property Payment for Month ${payment.monthNumber}`,
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,

              metadata: {
                paymentId: payment._id.toString(),
                tenantEmail: tenantEmail,
                propertyId: payment.propertyId,
                monthNumber: payment.monthNumber.toString(),
              },
            },
          },
        }),
      }
    );

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error("PayMongo Checkout API error:", checkoutData);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create checkout session",
          details: checkoutData,
        },
        { status: 400 }
      );
    }

    if (!checkoutResponse.ok) {
      console.error("PayMongo Checkout API error:", checkoutData);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create checkout session",
          details: checkoutData,
        },
        { status: 400 }
      );
    }

    // Update payment with checkout session ID
    await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          checkoutSessionId: checkoutData.data.id,
          updated_at: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      paymentIntent: paymongoData.data,
      clientSecret: paymongoData.data.attributes.client_key,
      checkoutUrl: checkoutData.data.attributes.checkout_url,
      checkoutSession: checkoutData.data,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
