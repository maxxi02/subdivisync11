// src/app/api/create-payment/verify-payment/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const KEY = process.env.PAYMONGO_SECRET_API_KEY;

async function generateAndSaveReceipt(data: {
  requestId: string;
  paymentIntentId: string;
  amount: number;
  description: string;
}): Promise<string> {
  const receiptsCollection = db.collection("receipts");

  const receipt = {
    type: "service_payment",
    amount: data.amount,
    requestId: data.requestId,
    transactionId: data.paymentIntentId,
    paidDate: new Date().toISOString(),
    description: data.description,
    created_at: new Date().toISOString(),
  };

  const result = await receiptsCollection.insertOne(receipt);
  return result.insertedId.toString();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { paymentIntentId, requestId } = await request.json();

    if (!paymentIntentId || !requestId) {
      return NextResponse.json(
        { success: false, error: "Missing payment intent ID or request ID" },
        { status: 400 }
      );
    }

    console.log("Verifying payment:", { paymentIntentId, requestId });

    // Get PayMongo API key from environment variables
    const KEY = process.env.PAYMONGO_SECRET_API_KEY;
    if (!KEY) {
      console.error("Missing PayMongo API key");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Check payment intent status from PayMongo
    const paymongoResponse = await fetch(
      `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`,
        },
      }
    );

    const paymongoData = await paymongoResponse.json();

    console.log("PayMongo response:", {
      status: paymongoResponse.status,
      paymentStatus: paymongoData.data?.attributes?.status,
    });

    if (!paymongoResponse.ok) {
      console.error("PayMongo API error:", paymongoData);
      return NextResponse.json(
        { success: false, error: "Failed to verify payment" },
        { status: paymongoResponse.status }
      );
    }

    const paymentStatus = paymongoData.data.attributes.status;
    const payments = paymongoData.data.attributes.payments || [];

    console.log("Payment intent details:", {
      status: paymentStatus,
      paymentsCount: payments.length,
    });

    // Check if there are successful payments attached
    let hasSuccessfulPayment = false;
    if (payments.length > 0) {
      for (const payment of payments) {
        try {
          const paymentResponse = await fetch(
            `https://api.paymongo.com/v1/payments/${payment.id}`,
            {
              method: "GET",
              headers: {
                accept: "application/json",
                authorization: `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`,
              },
            }
          );

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            const pStatus = paymentData.data?.attributes?.status;
            console.log(`Payment ${payment.id} status:`, pStatus);

            if (pStatus === "paid" || pStatus === "succeeded") {
              hasSuccessfulPayment = true;
              console.log("✓ Found successful payment!");
              break;
            }
          }
        } catch (err) {
          console.error(`Error checking payment:`, err);
        }
      }
    }

    // Connect to MongoDB
    await connectDB();
    const serviceRequestsCollection = db.collection("service-requests");

    // Verify the service request exists
    const serviceRequest = await serviceRequestsCollection.findOne({
      _id: new ObjectId(requestId),
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    console.log("Service request found:", {
      id: serviceRequest._id,
      status: serviceRequest.status,
      payment_status: serviceRequest.payment_status,
      checkout_session_id: serviceRequest.checkout_session_id || "none",
    });

    // Try to retrieve checkout session if we have the ID
    if (!hasSuccessfulPayment && serviceRequest.checkout_session_id) {
      try {
        console.log("Retrieving checkout session:", serviceRequest.checkout_session_id);

        const sessionResponse = await fetch(
          `https://api.paymongo.com/v1/checkout_sessions/${serviceRequest.checkout_session_id}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              authorization: `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`,
            },
          }
        );

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          const sessionStatus = sessionData.data?.attributes?.status;
          const sessionPayments = sessionData.data?.attributes?.payments || [];

          console.log("Checkout session retrieved:", {
            status: sessionStatus,
            paymentsCount: sessionPayments.length,
          });

          // Check session status
          if (sessionStatus === "paid" || sessionStatus === "succeeded" || sessionStatus === "completed") {
            hasSuccessfulPayment = true;
            console.log("✓ Checkout session shows payment completed!");
          }

          // Check payments in session
          if (!hasSuccessfulPayment && sessionPayments.length > 0) {
            for (const payment of sessionPayments) {
              const paymentId = typeof payment === 'string' ? payment : payment.id;
              try {
                const pResponse = await fetch(
                  `https://api.paymongo.com/v1/payments/${paymentId}`,
                  {
                    method: "GET",
                    headers: {
                      accept: "application/json",
                      authorization: `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`,
                    },
                  }
                );

                if (pResponse.ok) {
                  const pData = await pResponse.json();
                  const pStatus = pData.data?.attributes?.status;
                  console.log(`Session payment ${paymentId} status:`, pStatus);

                  if (pStatus === "paid" || pStatus === "succeeded") {
                    hasSuccessfulPayment = true;
                    console.log("✓ Found successful payment in checkout session!");
                    break;
                  }
                }
              } catch (err) {
                console.error("Error checking session payment:", err);
              }
            }
          }
        } else {
          console.log("Could not retrieve checkout session, status:", sessionResponse.status);
        }
      } catch (err) {
        console.error("Error retrieving checkout session:", err);
      }
    }

    // Update local payment status based on PayMongo status
    let localStatus: "pending" | "paid" | "failed" = "pending";

    if (paymentStatus === "succeeded" || hasSuccessfulPayment) {
      localStatus = "paid";
    } else if (
      paymentStatus === "awaiting_payment_method" ||
      paymentStatus === "awaiting_next_action" ||
      paymentStatus === "processing"
    ) {
      localStatus = "pending";
    } else {
      localStatus = "failed";
    }

    console.log("Determined local status:", localStatus);

    const updateData: Record<string, unknown> = {
      payment_status: localStatus,
      updated_at: new Date(),
    };

    if (localStatus === "paid") {
      updateData.payment_id = paymentIntentId;
      updateData.paid_at = new Date();

      // Generate receipt
      try {
        const receiptId = await generateAndSaveReceipt({
          requestId: requestId,
          paymentIntentId: paymentIntentId,
          amount: serviceRequest?.final_cost || serviceRequest?.estimated_cost || 0,
          description: `Payment for ${serviceRequest?.category || "service"} service`,
        });

        // Fix: Get the correct base URL
        const baseUrl = process.env.NEXT_PUBLIC_URL || 
                        process.env.BETTER_AUTH_URL || 
                        `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;

        updateData.receipt_url = `${baseUrl}/receipts/${receiptId}`;
        console.log("Receipt generated with URL:", updateData.receipt_url);
      } catch (receiptError) {
        console.error("Error generating receipt:", receiptError);
        // Continue without receipt if there's an error
      }
    }

    const result = await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateData }
    );

    console.log("Database update result:", {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });

    if (result.matchedCount === 0) {
      console.error("Service request not found for update:", requestId);
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus,
      localStatus: localStatus,
      receiptUrl: updateData.receipt_url,
      amount: serviceRequest?.final_cost || serviceRequest?.estimated_cost || 0,
      description: `Payment for ${serviceRequest?.category || "service"} service`,
    });

  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}