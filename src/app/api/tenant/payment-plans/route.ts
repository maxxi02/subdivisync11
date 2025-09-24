import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";

// /api/tenant/payment-plans/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantEmail = session.user.email; // Get from authenticated session

    await connectDB();
    const paymentPlansCollection = db.collection("payment_plans");

    const paymentPlans = await paymentPlansCollection
      .find({ "tenant.email": tenantEmail })
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      paymentPlans: paymentPlans,
    });
  } catch (error) {
    console.error("Error fetching tenant payment plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment plans" },
      { status: 500 }
    );
  }
}
