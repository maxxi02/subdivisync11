// src/app/api/payments/reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { getServerSession } from "@/better-auth/action";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, message } = body;

    if (!ObjectId.isValid(paymentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment ID" },
        { status: 400 }
      );
    }

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");
    const paymentPlansCollection = db.collection("payment_plans");

    // Get payment details
    const payment = await monthlyPaymentsCollection.findOne({
      _id: new ObjectId(paymentId),
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    // Get payment plan details for tenant info
    const paymentPlan = await paymentPlansCollection.findOne({
      _id: new ObjectId(payment.paymentPlanId),
    });

    if (!paymentPlan) {
      return NextResponse.json(
        { success: false, error: "Payment plan not found" },
        { status: 404 }
      );
    }

    // Here you would integrate with your email service
    // For example, using SendGrid, Resend, or any other email service
    console.log("Sending reminder to:", paymentPlan.tenant.email);
    console.log("Message:", message);
    console.log("Payment details:", {
      amount: payment.amount,
      dueDate: payment.dueDate,
      property: paymentPlan.propertyTitle,
    });

    // Update payment with reminder sent timestamp
    await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          lastReminderSent: new Date(),
          updated_at: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Payment reminder sent successfully",
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reminder" },
      { status: 500 }
    );
  }
}
