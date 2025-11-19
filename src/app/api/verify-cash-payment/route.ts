import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId, Collection } from "mongodb";
import { ServiceRequest } from "@/database/schemas/service-requests";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, verified } = body;

    if (!requestId || typeof verified !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Request ID and verified status are required",
        },
        { status: 400 }
      );
    }

    await connectDB();
    const serviceRequestsCollection: Collection<ServiceRequest> =
      db.collection("service-requests");

    // Verify request exists and has pending_verification status
    const serviceRequest = await serviceRequestsCollection.findOne({
      _id: new ObjectId(requestId),
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    if (serviceRequest.payment_status !== "pending_verification") {
      return NextResponse.json(
        { success: false, error: "Payment is not pending verification" },
        { status: 400 }
      );
    }

    const updateData: Partial<ServiceRequest> = {
      payment_status: verified ? "paid" : "failed",
      updated_at: new Date(),
    };

    if (verified) {
      updateData.paid_at = new Date();
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

    // TODO: Send notification to homeowner about payment verification result
    // You can implement email or in-app notifications here

    return NextResponse.json({
      success: true,
      message: verified
        ? "Cash payment verified successfully"
        : "Cash payment rejected",
    });
  } catch (error) {
    console.error("Cash payment verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify cash payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
