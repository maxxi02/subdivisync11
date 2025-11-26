// src/app/api/webhooks/paymongo/route.ts
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import crypto from "crypto";

// Verify PayMongo webhook signature to prevent spoofed requests
function verifyPayMongoSignature(
  payload: string,
  signatureHeader: string | null,
  webhookSecret: string | undefined
): boolean {
  // If no webhook secret is configured, log warning but allow in development
  if (!webhookSecret) {
    console.warn("PAYMONGO_WEBHOOK_SECRET not configured - skipping signature verification");
    return process.env.NODE_ENV !== "production";
  }

  if (!signatureHeader) {
    console.error("Missing Paymongo-Signature header");
    return false;
  }

  try {
    // PayMongo signature format: t=timestamp,te=test_signature,li=live_signature
    const signatureParts = signatureHeader.split(",");
    const timestampPart = signatureParts.find((part) => part.startsWith("t="));
    const signaturePart = signatureParts.find(
      (part) => part.startsWith("li=") || part.startsWith("te=")
    );

    if (!timestampPart || !signaturePart) {
      console.error("Invalid signature format");
      return false;
    }

    const timestamp = timestampPart.split("=")[1];
    const signature = signaturePart.split("=")[1];

    // Verify timestamp is not too old (5 minutes tolerance)
    const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (timestampAge > 300) {
      console.error("Webhook timestamp too old:", timestampAge, "seconds");
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

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
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // Verify webhook signature to prevent spoofed payment confirmations
    const signatureHeader = request.headers.get("paymongo-signature");
    const isValidSignature = verifyPayMongoSignature(
      rawBody,
      signatureHeader,
      process.env.PAYMONGO_WEBHOOK_SECRET
    );

    if (!isValidSignature) {
      console.error("Invalid webhook signature - possible spoofed request");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }
    
    // Log full webhook payload for debugging
    console.log("=== PayMongo Webhook Received (Verified) ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Full webhook body:", JSON.stringify(body, null, 2));
    
    const event = body.data;
    const eventType = event?.attributes?.type;

    if (!event || !eventType) {
      console.error("Invalid webhook payload - missing event or event type:", {
        hasEvent: !!event,
        eventType,
        bodyKeys: Object.keys(body)
      });
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    console.log("Event type:", eventType);
    console.log("Event attributes:", JSON.stringify(event?.attributes, null, 2));

    await connectDB();

    // Handle different event types
    switch (eventType) {
      case "payment.paid":
        await handlePaymentPaid(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      case "checkout_session.payment.paid":
        await handleCheckoutSessionPaid(event);
        break;
      case "payment_intent.succeeded":
      case "payment_intent.payment_succeeded":
        await handlePaymentIntentSucceeded(event);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event);
        break;
      default:
        console.log("Unhandled event type:", eventType);
        console.log("Event data:", JSON.stringify(event, null, 2));
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
  console.log("=== Handling payment.paid event ===");
  console.log("Event structure:", JSON.stringify(event, null, 2));
  
  // PayMongo webhook structure might be different - let's check
  const attributes = event.attributes?.data?.attributes as PaymentAttributes;
  const metadata = attributes?.metadata;

  console.log("Payment attributes:", JSON.stringify(attributes, null, 2));
  console.log("Payment metadata:", metadata);

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
  console.log("=== Handling checkout_session.payment.paid event ===");
  console.log("Event structure:", JSON.stringify(event, null, 2));
  
  // PayMongo webhook structure might be different - let's check
  const attributes = event.attributes?.data?.attributes as CheckoutSessionAttributes;
  const metadata = attributes?.metadata;

  console.log("Checkout session attributes:", JSON.stringify(attributes, null, 2));
  console.log("Checkout session metadata:", metadata);

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
    transactionId: (attributes as any).id || attributes.payment_intent_id || "",
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
        paymentMethod: (attributes as any).payment_method_used || "PayMongo",
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
  try {
    const serviceRequestsCollection = db.collection("service-requests");

    console.log("Processing service request payment:", {
      requestId: metadata.request_id,
      amount: attributes.amount / 100,
      paymentIntentId: attributes.payment_intent_id
    });

    // Generate receipt URL
    const receiptUrl = await generateReceipt({
      type: "service_payment",
      amount: attributes.amount / 100,
      requestId: metadata.request_id,
      transactionId: (attributes as any).id || attributes.payment_intent_id || "",
      paidDate: new Date().toISOString(),
      description: "Service Request Payment",
    });

    // Update service request
    const updateResult = await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(metadata.request_id) },
      {
        $set: {
          payment_status: "paid",
          payment_date: new Date().toISOString(),
          payment_method: (attributes as any).payment_method_used || "PayMongo",
          payment_intent_id: attributes.payment_intent_id,
          receipt_url: receiptUrl,
          updated_at: new Date(),
        },
      }
    );

    console.log("Service request payment updated successfully:", {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount
    });
  } catch (error) {
    console.error("Error handling service request payment:", error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(event: PayMongoWebhookPayload["data"]) {
  console.log("=== Handling payment_intent.succeeded event ===");
  console.log("Event structure:", JSON.stringify(event, null, 2));
  
  // Get payment intent data from webhook
  const paymentIntentData = event.attributes?.data as any;
  const paymentIntentId = paymentIntentData?.id;
  const attributes = paymentIntentData?.attributes;
  const metadata = attributes?.metadata;

  console.log("Payment intent ID:", paymentIntentId);
  console.log("Payment intent attributes:", JSON.stringify(attributes, null, 2));
  console.log("Payment intent metadata:", metadata);

  if (metadata?.request_id) {
    await handleServiceRequestPaymentPaid(
      metadata,
      {
        amount: attributes?.amount || 0,
        id: paymentIntentId,
        payment_intent_id: paymentIntentId,
        payment_method_used: "PayMongo",
        metadata: metadata,
      } as PaymentAttributes
    );
  }
}

async function handlePaymentIntentFailed(event: PayMongoWebhookPayload["data"]) {
  console.log("=== Handling payment_intent.payment_failed event ===");
  console.log("Event structure:", JSON.stringify(event, null, 2));
  
  const paymentIntentData = event.attributes?.data as any;
  const paymentIntentId = paymentIntentData?.id;
  const attributes = paymentIntentData?.attributes;
  const metadata = attributes?.metadata;

  console.log("Payment intent failed:", {
    paymentIntentId,
    metadata,
  });

  if (metadata?.request_id) {
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
    console.log("Service request payment marked as failed");
  }
}

async function handlePaymentFailed(event: PayMongoWebhookPayload["data"]) {
  console.log("=== Handling payment.failed event ===");
  console.log("Event structure:", JSON.stringify(event, null, 2));
  
  const attributes = event.attributes?.data?.attributes as PaymentAttributes;
  const metadata = attributes?.metadata;

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
