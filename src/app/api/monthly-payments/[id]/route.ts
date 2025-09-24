// src/app/api/monthly-payments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { getServerSession } from "@/better-auth/action";
import { ObjectId } from "mongodb";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status, paidDate, paymentMethod, notes, receiptUrl } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment ID" },
        { status: 400 }
      );
    }

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (paidDate) updateData.paidDate = paidDate;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (notes) updateData.notes = notes;
    if (receiptUrl) updateData.receiptUrl = receiptUrl;

    const result = await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    // If payment is marked as paid, update the payment plan
    if (status === "paid") {
      const payment = await monthlyPaymentsCollection.findOne({
        _id: new ObjectId(id),
      });

      if (payment) {
        const paymentPlansCollection = db.collection("payment_plans");
        const paymentPlan = await paymentPlansCollection.findOne({
          _id: new ObjectId(payment.paymentPlanId),
        });

        if (paymentPlan) {
          const newRemainingBalance =
            paymentPlan.remainingBalance - payment.amount;
          const nextMonth = paymentPlan.currentMonth + 1;

          // Calculate next payment date
          const nextPaymentDate = new Date(paymentPlan.nextPaymentDate);
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

          await paymentPlansCollection.updateOne(
            { _id: new ObjectId(payment.paymentPlanId) },
            {
              $set: {
                currentMonth: nextMonth,
                remainingBalance: Math.max(0, newRemainingBalance),
                nextPaymentDate:
                  nextMonth <= paymentPlan.leaseDuration
                    ? nextPaymentDate.toISOString()
                    : paymentPlan.nextPaymentDate,
                status: newRemainingBalance <= 0 ? "completed" : "active",
                updated_at: new Date(),
              },
            }
          );

          // Create next month's payment record if not completed
          if (
            nextMonth <= paymentPlan.leaseDuration &&
            newRemainingBalance > 0
          ) {
            const nextDueDate = new Date(nextPaymentDate);

            await monthlyPaymentsCollection.insertOne({
              paymentPlanId: payment.paymentPlanId,
              propertyId: payment.propertyId,
              tenantEmail: payment.tenantEmail,
              monthNumber: nextMonth,
              amount: paymentPlan.monthlyPayment,
              dueDate: nextDueDate.toISOString(),
              status: "pending",
              created_at: new Date(),
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
