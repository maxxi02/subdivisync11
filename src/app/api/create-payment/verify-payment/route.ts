// src/app/api/create-payment/verify-payment/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { ServiceRequest } from "@/database/schemas/service-requests";


const KEY = process.env.PAYMONGO_SECRET_API_KEY;

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
          authorization: `Basic ${Buffer.from(
            `${KEY}:`
          ).toString("base64")}`,
        },
      }
    );

    const paymongoData = await paymongoResponse.json();

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

    // Update local payment status based on PayMongo status
    let localStatus = "pending";
    if (paymentStatus === "succeeded") {
      localStatus = "paid";
    } else if (
      paymentStatus === "awaiting_payment_method" ||
      paymentStatus === "awaiting_next_action"
    ) {
      localStatus = "pending";
    } else {
      localStatus = "failed";
    }

    const updateData: Partial<ServiceRequest> = {
      payment_status: localStatus as "pending" | "paid" | "failed",
      updated_at: new Date(),
    };

    if (localStatus === "paid") {
      updateData.payment_id = paymentIntentId;
      updateData.paid_at = new Date();
    }

    const result = await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      console.error("Failed to update service request:", requestId);
      return NextResponse.json(
        { success: false, error: "Failed to update service request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus,
      localStatus: localStatus,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
