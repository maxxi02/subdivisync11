// src/app/api/tenant/payments/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { getServerSession } from "@/better-auth/action";
import { ObjectId } from "mongodb";

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const monthlyPaymentsCollection = db.collection("monthly_payments");
    const paymentPlansCollection = db.collection("payment_plans");

    // Find the monthly payment record
    const monthlyPayment = await monthlyPaymentsCollection.findOne({
      _id: new ObjectId(paymentId),
      tenantEmail: session.user.email,
      status: "pending",
    });

    if (!monthlyPayment) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment record not found or already processed",
        },
        { status: 404 }
      );
    }

    // Get the payment plan details
    const paymentPlan = await paymentPlansCollection.findOne({
      _id: new ObjectId(monthlyPayment.paymentPlanId),
    });

    if (!paymentPlan) {
      return NextResponse.json(
        { success: false, error: "Payment plan not found" },
        { status: 404 }
      );
    }

    // Define allowed payment methods
    const allowedPaymentMethods = ["card", "gcash", "paymaya", "grab_pay"];

    // Create PayMongo payment intent for monthly payment
    const paymentIntentData = {
      data: {
        attributes: {
          amount: Math.round(monthlyPayment.amount * 100), // Convert to cents
          currency: "PHP",
          description: `Monthly Payment - ${paymentPlan.propertyTitle} (Month ${monthlyPayment.monthNumber})`,
          statement_descriptor: "Property Payment",
          payment_method_allowed: allowedPaymentMethods,
          metadata: {
            paymentId: paymentId,
            paymentPlanId: monthlyPayment.paymentPlanId,
            propertyId: monthlyPayment.propertyId,
            monthNumber: monthlyPayment.monthNumber.toString(),
            tenantEmail: monthlyPayment.tenantEmail,
            type: "monthly_payment",
          },
        },
      },
    };

    console.log(
      "Creating PayMongo payment intent for monthly payment:",
      JSON.stringify(paymentIntentData, null, 2)
    );

    const paymongoResponse = await fetch(
      "https://api.paymongo.com/v1/payment_intents",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            PAYMONGO_SECRET_KEY + ":"
          ).toString("base64")}`,
        },
        body: JSON.stringify(paymentIntentData),
      }
    );

    const paymongoData = await paymongoResponse.json();

    if (!paymongoResponse.ok) {
      console.error("PayMongo error:", JSON.stringify(paymongoData, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: paymongoData.errors || "Failed to create payment intent",
          details: paymongoData,
        },
        { status: 500 }
      );
    }

    // Update monthly payment with payment intent ID
    await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          paymentIntentId: paymongoData.data.id,
          updated_at: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      paymentIntent: paymongoData.data,
      clientSecret: paymongoData.data.attributes.client_key,
      paymentId: paymentId,
      amount: monthlyPayment.amount,
      monthNumber: monthlyPayment.monthNumber,
    });
  } catch (error) {
    console.error("Error processing monthly payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle payment confirmation/webhook
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { paymentId, paymentIntentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const monthlyPaymentsCollection = db.collection("monthly_payments");
    const paymentPlansCollection = db.collection("payment_plans");

    // Update the monthly payment status
    const updateResult = await monthlyPaymentsCollection.updateOne(
      {
        _id: new ObjectId(paymentId),
        tenantEmail: session.user.email,
      },
      {
        $set: {
          status: status,
          paidDate: status === "paid" ? new Date().toISOString() : undefined,
          paymentMethod: status === "paid" ? "PayMongo" : undefined,
          updated_at: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Payment record not found" },
        { status: 404 }
      );
    }

    // If payment is successful, update payment plan and create next payment
    if (status === "paid") {
      const monthlyPayment = await monthlyPaymentsCollection.findOne({
        _id: new ObjectId(paymentId),
      });

      if (monthlyPayment) {
        const paymentPlan = await paymentPlansCollection.findOne({
          _id: new ObjectId(monthlyPayment.paymentPlanId),
        });

        if (paymentPlan) {
          const newCurrentMonth = paymentPlan.currentMonth + 1;
          const newRemainingBalance = Math.max(
            0,
            paymentPlan.remainingBalance - monthlyPayment.amount
          );
          const isCompleted = newCurrentMonth >= paymentPlan.leaseDuration;

          // Calculate next payment date (1 month from now)
          const nextPaymentDate = new Date();
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

          // Update payment plan
          await paymentPlansCollection.updateOne(
            { _id: new ObjectId(monthlyPayment.paymentPlanId) },
            {
              $set: {
                currentMonth: newCurrentMonth,
                remainingBalance: newRemainingBalance,
                nextPaymentDate: nextPaymentDate.toISOString(),
                status: isCompleted ? "completed" : "active",
                updated_at: new Date(),
              },
            }
          );

          // Create next monthly payment record if not completed
          if (!isCompleted) {
            const nextMonthPayment = {
              paymentPlanId: monthlyPayment.paymentPlanId,
              propertyId: monthlyPayment.propertyId,
              tenantEmail: monthlyPayment.tenantEmail,
              monthNumber: newCurrentMonth + 1,
              amount: paymentPlan.monthlyPayment,
              dueDate: nextPaymentDate.toISOString(),
              status: "pending",
              created_at: new Date(),
            };

            await monthlyPaymentsCollection.insertOne(nextMonthPayment);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update payment status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    const payment = await monthlyPaymentsCollection.findOne({
      _id: new ObjectId(paymentId),
      tenantEmail: session.user.email,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: payment,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payment",
      },
      { status: 500 }
    );
  }
}
