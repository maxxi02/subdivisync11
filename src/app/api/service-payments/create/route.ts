// app/api/service-payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";

import { connectDB, db } from "@/database/mongodb";
import { getServerSession } from "@/better-auth/action";
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Fetch service request
    const serviceRequest = await db
      .collection("service_requests")
      .findOne({ _id: requestId });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    // Verify user owns this request
    if (serviceRequest.user_email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to this request" },
        { status: 403 }
      );
    }

    // Check if request is completed and has final cost
    if (serviceRequest.status !== "completed" || !serviceRequest.final_cost) {
      return NextResponse.json(
        { success: false, error: "Request is not ready for payment" },
        { status: 400 }
      );
    }

    // Check if already paid
    if (serviceRequest.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "This request has already been paid" },
        { status: 400 }
      );
    }

    // Convert to centavos (PayMongo uses smallest currency unit)
    const amountInCentavos = Math.round(serviceRequest.final_cost * 100);

    // Create PayMongo checkout session
    const checkoutData = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: "PHP",
              amount: amountInCentavos,
              description: `Service Request - ${serviceRequest.category}`,
              name: serviceRequest.category,
              quantity: 1,
            },
          ],
          payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
          success_url: `${BASE_URL}/service-payment-success?request_id=${requestId}`,
          cancel_url: `${BASE_URL}/tenant-dashboard`,
          description: `Payment for service request: ${serviceRequest.description.substring(0, 100)}`,
          reference_number: `SR-${requestId}-${Date.now()}`,
          metadata: {
            request_id: requestId,
            user_email: session.user.email,
            category: serviceRequest.category,
          },
        },
      },
    };

    const response = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
        },
        body: JSON.stringify(checkoutData),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", responseData);
      return NextResponse.json(
        {
          success: false,
          error:
            responseData.errors?.[0]?.detail ||
            "Failed to create payment session",
        },
        { status: response.status }
      );
    }

    const checkoutSession = responseData.data;

    // Update service request with checkout session ID
    await db.collection("service_requests").updateOne(
      { _id: requestId },
      {
        $set: {
          payment_status: "pending",
          checkout_session_id: checkoutSession.id,
          payment_reference: checkoutSession.attributes.reference_number,
          updated_at: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.attributes.checkout_url,
      checkoutSessionId: checkoutSession.id,
      referenceNumber: checkoutSession.attributes.reference_number,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
