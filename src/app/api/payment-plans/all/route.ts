// src/app/api/payment-plans/all/route.ts
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
    const paymentPlansCollection = db.collection("payment_plans");

    const paymentPlans = await paymentPlansCollection
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      paymentPlans: paymentPlans,
    });
  } catch (error) {
    console.error("Error fetching payment plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment plans" },
      { status: 500 }
    );
  }
}
