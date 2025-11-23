// src/app/api/create-payment/verify-payment/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const KEY = process.env.PAYMONGO_SECRET_API_KEY;

async function generateAndSaveReceipt(data: {
  requestId: string;
  paymentIntentId: string;
  amount: number;
  description: string;
}): Promise<string> {
  const receiptsCollection = db.collection("receipts");

  const receipt = {
    type: "service_payment",
    amount: data.amount,
    requestId: data.requestId,
    transactionId: data.paymentIntentId,
    paidDate: new Date().toISOString(),
    description: data.description,
    created_at: new Date().toISOString(),
  };

  const result = await receiptsCollection.insertOne(receipt);
  return result.insertedId.toString();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { paymentIntentId, requestId } = await request.json();

    console.log("Verifying payment:", { paymentIntentId, requestId });

    if (!paymentIntentId || !requestId) {
      return NextResponse.json(
        { success: false, error: "Missing paymentIntentId or requestId" },
        { status: 400 }
      );
    }

    // Verify payment status with PayMongo
    if (!KEY) {
      console.error("PAYMONGO_SECRET_KEY is not defined");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const paymongoResponse = await fetch(
      `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`,
        },
      }
    );

    const paymongoData = await paymongoResponse.json();

    console.log("PayMongo response:", {
      status: paymongoResponse.status,
      paymentStatus: paymongoData.data?.attributes?.status,
    });

    if (!paymongoResponse.ok) {
      console.error("PayMongo API error:", paymongoData);
      return NextResponse.json(
        { success: false, error: "Failed to verify payment" },
        { status: paymongoResponse.status }
      );
    }

    const paymentStatus = paymongoData.data.attributes.status;

    // Connect to MongoDB
    await connectDB();
    const serviceRequestsCollection = db.collection("service-requests");

    // Verify the service request exists
    const serviceRequest = await serviceRequestsCollection.findOne({
      _id: new ObjectId(requestId),
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    console.log("Service request found:", {
      id: serviceRequest._id,
      status: serviceRequest.status,
      payment_status: serviceRequest.payment_status,
    });

    // Update local payment status based on PayMongo status
    let localStatus: "pending" | "paid" | "failed" = "pending";
    
    if (paymentStatus === "succeeded") {
      localStatus = "paid";
    } else if (
      paymentStatus === "awaiting_payment_method" ||
      paymentStatus === "awaiting_next_action" ||
      paymentStatus === "processing"
    ) {
      localStatus = "pending";
    } else {
      localStatus = "failed";
    }

    console.log("Determined local status:", localStatus);

    const updateData: Record<string, unknown> = {
      payment_status: localStatus,
      updated_at: new Date(),
    };

  if (localStatus === "paid") {
  updateData.payment_id = paymentIntentId;
  updateData.paid_at = new Date();

  // Generate receipt
  try {
    const receiptId = await generateAndSaveReceipt({
      requestId: requestId,
      paymentIntentId: paymentIntentId,
      amount: serviceRequest.final_cost || serviceRequest.estimated_cost || 0,
      description: `Payment for ${serviceRequest.category} service`,
    });

    // Fix: Get the correct base URL
    const baseUrl = process.env.NEXT_PUBLIC_URL || 
                    process.env.BETTER_AUTH_URL || 
                    `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;

    updateData.receipt_url = `${baseUrl}/receipts/${receiptId}`;
    console.log("Receipt generated with URL:", updateData.receipt_url);
  } catch (receiptError) {
    console.error("Error generating receipt:", receiptError);
    // Continue without receipt if there's an error
  }
}

    const result = await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateData }
    );

    console.log("Database update result:", {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });

    if (result.matchedCount === 0) {
      console.error("Service request not found for update:", requestId);
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus,
      localStatus: localStatus,
      receiptUrl: updateData.receipt_url,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}