// src/app/api/tenant/payment-plans/[id]/route.ts
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
    const planId = resolvedParams.id;
    const body = await request.json();

    if (body.updateType !== "payment_made" || !body.paymentAmount) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid update type or missing payment amount",
        },
        { status: 400 }
      );
    }

    await connectDB();
    const paymentPlansCollection = db.collection("payment_plans"); // Adjust collection name if different

    // First, verify the plan belongs to the tenant
    const plan = await paymentPlansCollection.findOne({
      _id: new ObjectId(planId),
      "tenant.email": tenantEmail, // Assuming tenant is nested as in your PaymentPlan interface
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Payment plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Calculate updates
    const newRemainingBalance = plan.remainingBalance - body.paymentAmount;
    const newCurrentMonth = plan.currentMonth + 1;
    const newStatus = newRemainingBalance <= 0 ? "completed" : plan.status;

    // Update nextPaymentDate: Add ~1 month (30 days) for simplicity; adjust logic if needed (e.g., based on due dates)
    const nextPaymentDate = new Date(plan.nextPaymentDate);
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

    // Update the plan
    const result = await paymentPlansCollection.updateOne(
      { _id: new ObjectId(planId) },
      {
        $set: {
          currentMonth: newCurrentMonth,
          remainingBalance: Math.max(newRemainingBalance, 0), // Prevent negative
          nextPaymentDate: nextPaymentDate.toISOString(),
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update payment plan" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment plan updated successfully",
    });
  } catch (error) {
    console.error("Error updating tenant payment plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payment plan" },
      { status: 500 }
    );
  }
}
