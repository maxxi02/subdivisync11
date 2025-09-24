// src/app/api/monthly-payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { getServerSession } from "@/better-auth/action";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    const payments = await monthlyPaymentsCollection
      .find({})
      .sort({ dueDate: -1 })
      .toArray();

    // Update overdue payments
    const today = new Date();
    const updatedPayments = payments.map((payment) => {
      if (payment.status === "pending" && new Date(payment.dueDate) < today) {
        return { ...payment, status: "overdue" };
      }
      return payment;
    });

    return NextResponse.json({
      success: true,
      payments: updatedPayments,
    });
  } catch (error) {
    console.error("Error fetching monthly payments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch monthly payments" },
      { status: 500 }
    );
  }
}
