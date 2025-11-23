import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { requestId, checkoutSessionId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const serviceRequestsCollection = db.collection("service_requests");

    // Verify payment with PayMongo
    const secretKey = process.env.PAYMONGO_SECRET_API_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Retrieve checkout session from PayMongo
    const verifyResponse = await fetch(
      `https://api.paymongo.com/v1/checkout_sessions/${checkoutSessionId}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify payment",
        },
        { status: 400 }
      );
    }

    const paymentStatus =
      verifyData.data.attributes.payment_intent?.attributes?.status;

    if (paymentStatus !== "succeeded") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment not completed",
        },
        { status: 400 }
      );
    }

    // Get payment details for receipt
    const paymentIntent = verifyData.data.attributes.payment_intent;
    const receiptUrl = verifyData.data.attributes.checkout_url; // Or generate your own receipt

    // Update service request with paid status
    const updateResult = await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(requestId), user_email: session.user.email },
      {
        $set: {
          payment_status: "paid",
          paid_date: new Date().toISOString(),
          payment_method: "PayMongo",
          payment_intent_id: paymentIntent.id,
          receipt_url: receiptUrl,
          updated_at: new Date().toISOString(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and request updated",
      receiptUrl,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update payment status",
      },
      { status: 500 }
    );
  }
}
