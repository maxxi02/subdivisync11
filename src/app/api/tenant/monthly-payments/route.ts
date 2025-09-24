// /api/tenant/monthly-payments/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantEmail = session.user.email;

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    const payments = await monthlyPaymentsCollection
      .find({ tenantEmail: tenantEmail })
      .sort({ dueDate: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      payments: payments,
    });
  } catch (error) {
    console.error("Error fetching tenant payments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
