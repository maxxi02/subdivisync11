import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId, Collection } from "mongodb";
import { ServiceRequest } from "@/database/schemas/service-requests";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, description, requestId } = body;

    if (!amount || !description || !requestId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();
    const serviceRequestsCollection: Collection<ServiceRequest> =
      db.collection("service-requests");

    // Verify request exists and belongs to user
    const serviceRequest = await serviceRequestsCollection.findOne({
      _id: new ObjectId(requestId),
      user_id: session.user.id,
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    if (serviceRequest.status !== "completed") {
      return NextResponse.json(
        { success: false, error: "Can only pay for completed requests" },
        { status: 400 }
      );
    }

    // Create PayMongo payment session
    const paymentSession = await createPayMongoCheckout({
      amount: Math.round(amount * 100), // Convert to centavos
      description,
      requestId,
    });

    // Update request with payment intent ID
    await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          payment_intent_id: paymentSession.id,
          updated_at: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      checkout_url: paymentSession.checkout_url,
      payment_intent_id: paymentSession.id,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}

async function createPayMongoCheckout(params: {
  amount: number;
  description: string;
  requestId: string;
}) {
  const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_API_KEY;
  const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_API_KEY;

  if (!PAYMONGO_SECRET_KEY || !PAYMONGO_PUBLIC_KEY) {
    throw new Error("PayMongo keys not configured");
  }

  // Create payment intent
  const paymentIntentResponse = await fetch(
    "https://api.paymongo.com/v1/payment_intents",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString(
          "base64"
        )}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: params.amount,
            payment_method_allowed: ["card", "gcash", "grab_pay"],
            payment_method_options: {
              card: { request_three_d_secure: "any" },
            },
            currency: "PHP",
            description: params.description,
            metadata: {
              request_id: params.requestId,
            },
          },
        },
      }),
    }
  );

  const paymentIntentData = await paymentIntentResponse.json();

  if (!paymentIntentResponse.ok) {
    throw new Error(
      paymentIntentData.errors?.[0]?.detail || "Failed to create payment intent"
    );
  }

  const paymentIntentId = paymentIntentData.data.id;

  // Create checkout session
  const checkoutResponse = await fetch(
    "https://api.paymongo.com/v1/checkout_sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString(
          "base64"
        )}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_intent_id: paymentIntentId,
            description: params.description,
            line_items: [
              {
                amount: params.amount,
                currency: "PHP",
                name: params.description,
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "gcash", "grab_pay"],
            success_url: `${
              process.env.NODE_ENV === "production"
                ? process.env.NEXT_PUBLIC_URL
                : process.env.BETTER_AUTH_URL
            }/services/success?payment_intent_id=${paymentIntentId}&request_id=${
              params.requestId
            }`,
            cancel_url: `${
              process.env.NODE_ENV === "production"
                ? process.env.NEXT_PUBLIC_URL
                : process.env.BETTER_AUTH_URL
            }/services/cancel?request_id=${params.requestId}`,
          },
        },
      }),
    }
  );

  const checkoutData = await checkoutResponse.json();

  if (!checkoutResponse.ok) {
    throw new Error(
      checkoutData.errors?.[0]?.detail || "Failed to create checkout session"
    );
  }

  return {
    id: paymentIntentId,
    checkout_url: checkoutData.data.attributes.checkout_url,
  };
}
