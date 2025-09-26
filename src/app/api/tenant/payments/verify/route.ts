// src/app/api/tenant/payments/verify/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { paymentIntentId } = await request.json();

    // Verify payment status with PayMongo
    const paymongoResponse = await fetch(
      `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Basic ${Buffer.from(
            process.env.PAYMONGO_SECRET_KEY + ":"
          ).toString("base64")}`,
        },
      }
    );

    const paymongoData = await paymongoResponse.json();

    if (!paymongoResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to verify payment" },
        { status: 400 }
      );
    }

    const paymentStatus = paymongoData.data.attributes.status;
    const metadata = paymongoData.data.attributes.metadata;

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    // Update local payment status based on PayMongo status
    let localStatus = "pending";
    if (paymentStatus === "succeeded") {
      localStatus = "paid";
    } else if (paymentStatus === "requires_payment_method") {
      localStatus = "pending";
    }

    const updateData: Record<string, unknown> = {
      status: localStatus,
      updated_at: new Date().toISOString(),
    };

    if (localStatus === "paid") {
      updateData.paidDate = new Date().toISOString();
      updateData.paymentMethod = "PayMongo";
    }

    await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(metadata.paymentId) },
      { $set: updateData }
    );

    // Update payment plan if payment was successful
    if (localStatus === "paid") {
      await updatePaymentPlanProgress(
        metadata.propertyId,
        metadata.tenantEmail
      );
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus,
      localStatus: localStatus,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

async function updatePaymentPlanProgress(
  propertyId: string,
  tenantEmail: string
) {
  // Same function as in webhook route
  try {
    const paymentPlansCollection = db.collection("payment_plans");
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    const paymentPlan = await paymentPlansCollection.findOne({
      propertyId: propertyId,
      "tenant.email": tenantEmail,
    });

    if (!paymentPlan) return;

    const paidPayments = await monthlyPaymentsCollection.countDocuments({
      paymentPlanId: paymentPlan._id.toString(),
      status: "paid",
    });

    const remainingPayments = paymentPlan.leaseDuration - paidPayments;
    const remainingBalance = remainingPayments * paymentPlan.monthlyPayment;

    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    let status = "active";
    if (paidPayments >= paymentPlan.leaseDuration) {
      status = "completed";
    }

    await paymentPlansCollection.updateOne(
      { _id: paymentPlan._id },
      {
        $set: {
          currentMonth: paidPayments,
          remainingBalance: Math.max(0, remainingBalance),
          nextPaymentDate:
            status === "completed" ? null : nextPaymentDate.toISOString(),
          status: status,
          updated_at: new Date().toISOString(),
        },
      }
    );
  } catch (error) {
    console.error("Error updating payment plan progress:", error);
  }
}
