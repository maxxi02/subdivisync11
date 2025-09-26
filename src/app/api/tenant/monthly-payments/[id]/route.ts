// src/app/api/tenant/monthly-payments/[id]/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantEmail = session.user.email;
    const resolvedParams = await params;
    const paymentId = resolvedParams.id;
    const body = await request.json();

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    // First, verify the payment belongs to the tenant
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

    // Update the payment
    const result = await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          ...body,
          updated_at: new Date().toISOString(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update payment" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully",
    });
  } catch (error) {
    console.error("Error updating tenant payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
