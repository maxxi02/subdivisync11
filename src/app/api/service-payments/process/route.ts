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

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const serviceRequestsCollection = db.collection("service_requests");

    // Get service request details
    const serviceRequest = await serviceRequestsCollection.findOne({
      _id: new ObjectId(requestId),
      user_email: session.user.email,
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    if (serviceRequest.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Payment already completed" },
        { status: 400 }
      );
    }

    if (!serviceRequest.final_cost) {
      return NextResponse.json(
        { success: false, error: "No final cost set for this request" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYMONGO_SECRET_API_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Create checkout session
    const checkoutResponse = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
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
              line_items: [
                {
                  currency: "PHP",
                  amount: Math.round(serviceRequest.final_cost * 100),
                  description: `${serviceRequest.category} - Service Request`,
                  name: serviceRequest.category,
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
                  ? process.env.NEXT_PUBLIC_URL
                  : process.env.BETTER_AUTH_URL
              }/service-requests/payment/success?request_id=${requestId}`,
              cancel_url: `${
                process.env.NODE_ENV === "production"
                  ? process.env.NEXT_PUBLIC_URL
                  : process.env.BETTER_AUTH_URL
              }/service-requests/payment/cancel?request_id=${requestId}`,
              description: `Payment for ${serviceRequest.category} service`,
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              metadata: {
                requestId: serviceRequest._id.toString(),
                userEmail: session.user.email,
                category: serviceRequest.category,
                type: "service_request",
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

    // Update service request with checkout session ID
    await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          checkoutSessionId: checkoutData.data.id,
          payment_status: "processing",
          updated_at: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
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
