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
    const { requestId, amount } = body;

    if (!requestId || !amount) {
      return NextResponse.json(
        { success: false, error: "Request ID and amount are required" },
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

    if (serviceRequest.status !== "completed") {
      return NextResponse.json(
        { success: false, error: "Can only pay for completed requests" },
        { status: 400 }
      );
    }

    // Update service request with pending_verification status
    const result = await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          payment_status: "pending_verification",
          final_cost: amount,
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update service request" },
        { status: 500 }
      );
    }

    // TODO: Send notification to admin
    // You can implement email or in-app notifications here

    return NextResponse.json({
      success: true,
      message: "Cash payment submitted for verification",
    });
  } catch (error) {
    console.error("Cash payment request error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process cash payment request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}