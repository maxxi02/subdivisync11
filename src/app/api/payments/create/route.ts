// src/app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { getServerSession } from "@/better-auth/action";

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { amount, currency, description, customer, propertyId, paymentPlan } =
      body;

    if (
      !amount ||
      !currency ||
      !description ||
      !customer ||
      !propertyId ||
      !paymentPlan
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const paymentPlansCollection = db.collection("payment_plans");
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    // Create payment plan
    const paymentPlanData = {
      propertyId,
      propertyTitle: paymentPlan.propertyTitle || description,
      propertyPrice: paymentPlan.propertyPrice,
      downPayment: paymentPlan.downPayment,
      monthlyPayment: paymentPlan.monthlyPayment,
      interestRate: paymentPlan.interestRate,
      leaseDuration: paymentPlan.leaseDuration,
      totalAmount: paymentPlan.totalAmount,
      startDate: new Date().toISOString(),
      currentMonth: 0,
      remainingBalance: paymentPlan.totalAmount,
      nextPaymentDate: new Date().toISOString(),
      status: "active",
      tenant: {
        fullName: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      created_at: new Date(),
    };

    const paymentPlanResult = await paymentPlansCollection.insertOne(
      paymentPlanData
    );

    // Create first monthly payment record
    const dueDate = new Date();
    const monthlyPaymentData = {
      paymentPlanId: paymentPlanResult.insertedId.toString(),
      propertyId,
      tenantEmail: customer.email,
      monthNumber: 1,
      amount: paymentPlan.monthlyPayment,
      dueDate: dueDate.toISOString(),
      status: "pending",
      created_at: new Date(),
    };

    const monthlyPaymentResult = await monthlyPaymentsCollection.insertOne(
      monthlyPaymentData
    );

    // Define PayMongo payment methods - using only confirmed working methods
    // Based on API errors, many banking methods are not valid or require different naming
    const allowedPaymentMethods = [
      "card",
      "gcash",
      "paymaya",
      "grab_pay",
      // Temporarily removing banking methods that cause API errors
      // "billease", // May require special activation
      // "dob", // Generic direct online banking
      // Add banking methods back individually after testing each one
    ];

    // Create PayMongo payment intent
    const paymentIntentData = {
      data: {
        attributes: {
          amount: Math.round(amount), // Already in cents
          currency,
          description,
          statement_descriptor: "Property Payment",
          payment_method_allowed: allowedPaymentMethods,
          metadata: {
            paymentPlanId: paymentPlanResult.insertedId.toString(),
            propertyId,
            monthNumber: "1",
            tenantEmail: customer.email,
          },
        },
      },
    };

    console.log(
      "Creating PayMongo payment intent:",
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
      { _id: monthlyPaymentResult.insertedId },
      {
        $set: {
          paymentIntentId: paymongoData.data.id,
          updated_at: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      paymentPlanId: paymentPlanResult.insertedId.toString(),
      paymentIntent: paymongoData.data,
      clientSecret: paymongoData.data.attributes.client_key,
    });
  } catch (error) {
    console.error("Error creating payment plan:", error);

    // Provide more detailed error information
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorCode = (error as Error).message || "UNKNOWN";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create payment plan",
        details: {
          message: errorMessage,
          code: errorCode,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const tenantEmail = searchParams.get("tenantEmail");

    if (!propertyId || !tenantEmail) {
      return NextResponse.json(
        { success: false, error: "Missing propertyId or tenantEmail" },
        { status: 400 }
      );
    }

    const paymentPlansCollection = db.collection("payment_plans");

    const paymentPlan = await paymentPlansCollection.findOne({
      propertyId: propertyId,
      "tenant.email": tenantEmail,
    });

    if (!paymentPlan) {
      return NextResponse.json(
        { success: false, error: "Payment plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentPlan: paymentPlan,
    });
  } catch (error) {
    console.error("Error fetching payment plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment plan" },
      { status: 500 }
    );
  }
}
