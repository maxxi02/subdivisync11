import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId, Collection } from "mongodb";
import { ServiceRequest } from "@/database/schemas/service-requests";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, paymentIntentId } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const serviceRequestsCollection: Collection<ServiceRequest> =
      db.collection("service-requests");

    // Verify request exists and belongs to user
    const serviceRequest = await serviceRequestsCollection.findOne({
      _id: new ObjectId(requestId),
      user_id: session.user.id,
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    // Update payment status to paid
    const updateData: Record<string, unknown> = {
      payment_status: "paid",
      paid_at: new Date(),
      updated_at: new Date(),
    };

    if (paymentIntentId) {
      updateData.payment_intent_id = paymentIntentId;
    }

    const result = await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update payment status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update payment status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
