// src/app/api/webhooks/paymongo/route.ts
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// Type definitions
interface PayMongoWebhookPayload {
  data: {
    attributes: {
      type: string;
      data: {
        attributes: PaymentAttributes | CheckoutSessionAttributes;
      };
    };
  };
}

interface PaymentAttributes {
  amount: number;
  id?: string;
  payment_intent_id?: string;
  payment_method_used?: string;
  metadata: PaymentMetadata;
}

interface CheckoutSessionAttributes {
  amount: number;
  id?: string;
  payment_intent_id?: string;
  payment_method_used?: string;
  metadata: PaymentMetadata;
}

interface PaymentMetadata {
  paymentId?: string;
  request_id?: string;
  monthNumber?: number;
}

interface ReceiptData {
  type: string;
  amount: number;
  paymentId?: string;
  requestId?: string;
  transactionId: string;
  paidDate: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PayMongoWebhookPayload = await request.json();
    const event = body.data;

    console.log("PayMongo Webhook received:", event.attributes.type);

    await connectDB();

    // Handle different event types
    switch (event.attributes.type) {
      case "payment.paid":
        await handlePaymentPaid(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      case "checkout_session.payment.paid":
        await handleCheckoutSessionPaid(event);
        break;
      default:
        console.log("Unhandled event type:", event.attributes.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentPaid(event: PayMongoWebhookPayload["data"]) {
  const attributes = event.attributes.data.attributes as PaymentAttributes;
  const metadata = attributes.metadata;

  console.log("Payment paid:", metadata);

  // Check if it's a monthly payment or service request payment
  if (metadata.paymentId) {
    // Monthly lease payment
    await handleMonthlyPaymentPaid(metadata, attributes);
  } else if (metadata.request_id) {
    // Service request payment
    await handleServiceRequestPaymentPaid(metadata, attributes);
  }
}

async function handleCheckoutSessionPaid(
  event: PayMongoWebhookPayload["data"]
) {
  const attributes = event.attributes.data
    .attributes as CheckoutSessionAttributes;
  const metadata = attributes.metadata;

  console.log("Checkout session paid:", metadata);

  if (metadata.paymentId) {
    await handleMonthlyPaymentPaid(metadata, attributes);
  } else if (metadata.request_id) {
    await handleServiceRequestPaymentPaid(metadata, attributes);
  }
}

async function handleMonthlyPaymentPaid(
  metadata: PaymentMetadata,
  attributes: PaymentAttributes | CheckoutSessionAttributes
) {
  const monthlyPaymentsCollection = db.collection("monthly_payments");
  const paymentPlansCollection = db.collection("payment_plans");

  // Generate receipt URL
  const receiptUrl = await generateReceipt({
    type: "monthly_payment",
    amount: attributes.amount / 100,
    paymentId: metadata.paymentId,
    transactionId: attributes.id || attributes.payment_intent_id || "",
    paidDate: new Date().toISOString(),
    description: `Monthly Payment - Month ${metadata.monthNumber}`,
  });

  // Update monthly payment
  await monthlyPaymentsCollection.updateOne(
    { _id: new ObjectId(metadata.paymentId) },
    {
      $set: {
        status: "paid",
        paidDate: new Date().toISOString(),
        paymentMethod: attributes.payment_method_used || "PayMongo",
        paymentIntentId: attributes.payment_intent_id,
        receiptUrl: receiptUrl,
        updated_at: new Date().toISOString(),
      },
    }
  );

  // Update payment plan progress
  const payment = await monthlyPaymentsCollection.findOne({
    _id: new ObjectId(metadata.paymentId),
  });

  if (payment) {
    const plan = await paymentPlansCollection.findOne({
      _id: new ObjectId(payment.paymentPlanId),
    });

    if (plan) {
      const newRemainingBalance = plan.remainingBalance - payment.amount;
      const newCurrentMonth = plan.currentMonth + 1;
      const newStatus = newRemainingBalance <= 0 ? "completed" : plan.status;

      const nextPaymentDate = new Date(plan.nextPaymentDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      await paymentPlansCollection.updateOne(
        { _id: new ObjectId(payment.paymentPlanId) },
        {
          $set: {
            currentMonth: newCurrentMonth,
            remainingBalance: Math.max(newRemainingBalance, 0),
            nextPaymentDate: nextPaymentDate.toISOString(),
            status: newStatus,
            updated_at: new Date().toISOString(),
          },
        }
      );
    }
  }

  console.log("Monthly payment updated successfully");
}

async function handleServiceRequestPaymentPaid(
  metadata: PaymentMetadata,
  attributes: PaymentAttributes | CheckoutSessionAttributes
) {
  const serviceRequestsCollection = db.collection("service-requests");

  // Generate receipt URL
  const receiptUrl = await generateReceipt({
    type: "service_payment",
    amount: attributes.amount / 100,
    requestId: metadata.request_id,
    transactionId: attributes.id || attributes.payment_intent_id || "",
    paidDate: new Date().toISOString(),
    description: "Service Request Payment",
  });

  // Update service request
  await serviceRequestsCollection.updateOne(
    { _id: new ObjectId(metadata.request_id) },
    {
      $set: {
        payment_status: "paid",
        payment_date: new Date().toISOString(),
        payment_method: attributes.payment_method_used || "PayMongo",
        payment_intent_id: attributes.payment_intent_id,
        receipt_url: receiptUrl,
        updated_at: new Date(),
      },
    }
  );

  console.log("Service request payment updated successfully");
}

async function handlePaymentFailed(event: PayMongoWebhookPayload["data"]) {
  const attributes = event.attributes.data.attributes as PaymentAttributes;
  const metadata = attributes.metadata;

  console.log("Payment failed:", metadata);

  if (metadata.paymentId) {
    // Monthly payment failed
    const monthlyPaymentsCollection = db.collection("monthly_payments");
    await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(metadata.paymentId) },
      {
        $set: {
          status: "failed",
          updated_at: new Date().toISOString(),
        },
      }
    );
  } else if (metadata.request_id) {
    // Service request payment failed
    const serviceRequestsCollection = db.collection("service-requests");
    await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(metadata.request_id) },
      {
        $set: {
          payment_status: "failed",
          updated_at: new Date(),
        },
      }
    );
  }
}

async function generateReceipt(data: ReceiptData): Promise<string> {
  // Store receipt data in database
  const receiptsCollection = db.collection("receipts");

  const receipt = {
    type: data.type,
    amount: data.amount,
    paymentId: data.paymentId,
    requestId: data.requestId,
    transactionId: data.transactionId,
    paidDate: data.paidDate,
    description: data.description,
    created_at: new Date().toISOString(),
  };

  const result = await receiptsCollection.insertOne(receipt);

  // Return URL to view receipt
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_URL
      : process.env.BETTER_AUTH_URL;

  return `${baseUrl}/receipts/${result.insertedId}`;
}
