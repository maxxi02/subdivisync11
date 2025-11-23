// app/api/service-payments/update/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY!;

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { requestId, checkoutSessionId } = await req.json();

    if (!requestId || !checkoutSessionId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Retrieve checkout session from PayMongo
    const response = await fetch(
      `https://api.paymongo.com/v1/checkout_sessions/${checkoutSessionId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to retrieve payment session" },
        { status: response.status }
      );
    }

    const sessionData = await response.json();
    const checkoutSession = sessionData.data;

    // Check payment status
    if (checkoutSession.attributes.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Get payment intent for receipt
    const paymentIntentId = checkoutSession.attributes.payments?.[0]?.id;
    let receiptUrl = null;

    if (paymentIntentId) {
      const paymentResponse = await fetch(
        `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
          },
        }
      );

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        const payment = paymentData.data;

        // PayMongo receipt URL (if available)
        receiptUrl =
          payment.attributes.payments?.[0]?.attributes?.receipt_url ||
          checkoutSession.attributes.receipt_url ||
          null;
      }
    }

    // Connect to database and update service request
    await connectDB();

    const updateResult = await db.collection("service_requests").updateOne(
      { _id: requestId, user_email: session.user.email },
      {
        $set: {
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: checkoutSession.attributes.payment_method_used,
          payment_intent_id: paymentIntentId,
          receipt_url: receiptUrl,
          updated_at: new Date().toISOString(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Service request not found or unauthorized" },
        { status: 404 }
      );
    }

    // Generate custom receipt if PayMongo receipt not available
    if (!receiptUrl) {
      try {
        const receiptResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-receipt`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requestId,
              paymentDetails: {
                amount: checkoutSession.attributes.line_items[0].amount / 100,
                paymentMethod: checkoutSession.attributes.payment_method_used,
                referenceNumber: checkoutSession.attributes.reference_number,
                paidAt: new Date().toISOString(),
              },
            }),
          }
        );

        if (receiptResponse.ok) {
          const receiptData = await receiptResponse.json();
          receiptUrl = receiptData.receiptUrl;

          // Update with custom receipt URL
          await db
            .collection("service_requests")
            .updateOne(
              { _id: requestId },
              { $set: { receipt_url: receiptUrl } }
            );
        }
      } catch (error) {
        console.error("Custom receipt generation failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      receiptUrl,
      paymentDetails: {
        amount: checkoutSession.attributes.line_items[0].amount / 100,
        paymentMethod: checkoutSession.attributes.payment_method_used,
        referenceNumber: checkoutSession.attributes.reference_number,
      },
    });
  } catch (error) {
    console.error("Payment update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
