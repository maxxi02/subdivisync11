import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb";

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
    const { paymentId, verified } = body;

    if (!paymentId || typeof verified !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment ID and verified status are required",
        },
        { status: 400 }
      );
    }

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    // Verify payment exists and has pending_verification status
    const payment = await monthlyPaymentsCollection.findOne({
      _id: new ObjectId(paymentId),
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.status !== "pending_verification") {
      return NextResponse.json(
        { success: false, error: "Payment is not pending verification" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: verified ? "paid" : "pending",
      updated_at: new Date().toISOString(),
    };

    if (verified) {
      updateData.paidDate = new Date().toISOString();
      updateData.paymentMethod = "Cash";
      updateData.notes = "Cash payment verified by admin";
    } else {
      updateData.notes = "Cash payment rejected by admin";
    }

    const result = await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(paymentId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update payment status" },
        { status: 500 }
      );
    }

    // If verified, update the payment plan progress
    if (verified) {
      const paymentPlansCollection = db.collection("payment_plans");
      const paymentPlan = await paymentPlansCollection.findOne({
        _id: new ObjectId(payment.paymentPlanId),
      });

      if (paymentPlan) {
        const newCurrentMonth = paymentPlan.currentMonth + 1;
        const newRemainingBalance =
          paymentPlan.remainingBalance - payment.amount;

        // Calculate next payment date (add 1 month to current nextPaymentDate)
        const currentNextPaymentDate = new Date(paymentPlan.nextPaymentDate);
        const newNextPaymentDate = new Date(currentNextPaymentDate);
        newNextPaymentDate.setMonth(newNextPaymentDate.getMonth() + 1);

        const updatePlanData: Record<string, unknown> = {
          currentMonth: newCurrentMonth,
          remainingBalance: newRemainingBalance,
          nextPaymentDate: newNextPaymentDate.toISOString(),
          updated_at: new Date().toISOString(),
        };

        // If all payments are completed, mark plan as completed
        if (newCurrentMonth >= paymentPlan.leaseDuration) {
          updatePlanData.status = "completed";
        }

        await paymentPlansCollection.updateOne(
          { _id: new ObjectId(payment.paymentPlanId) },
          { $set: updatePlanData }
        );
      }
    }

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
