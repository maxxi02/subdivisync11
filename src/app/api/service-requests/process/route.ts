import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "@/better-auth/action";
import { connectDB, db } from "@/database/mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { requestId } = await request.json();

    console.log("=== Payment Process Debug ===");
    console.log("User Email:", session.user.email);
    console.log("Request ID received:", requestId);

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const serviceRequestsCollection = db.collection("service_requests");

    // Try multiple ID fields and formats
    let serviceRequest;

    // First try _id as ObjectId
    try {
      serviceRequest = await serviceRequestsCollection.findOne({
        _id: new ObjectId(requestId),
        user_email: session.user.email,
      });
      console.log("Found with _id as ObjectId:", !!serviceRequest);
    } catch (e) {
      console.log("ObjectId search failed");
    }

    // If not found, try _id as string
    if (!serviceRequest) {
      serviceRequest = await serviceRequestsCollection.findOne({
        _id: requestId,
        user_email: session.user.email,
      });
      console.log("Found with _id as string:", !!serviceRequest);
    }

    // If still not found, try the 'id' field
    if (!serviceRequest) {
      serviceRequest = await serviceRequestsCollection.findOne({
        id: requestId,
        user_email: session.user.email,
      });
      console.log("Found with id field:", !!serviceRequest);
    }

    console.log("Final service request found:", serviceRequest);

    if (!serviceRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Service request not found or access denied",
          debug: {
            requestId: requestId,
            sessionEmail: session.user.email,
            triedFormats: ["_id as ObjectId", "_id as string", "id field"],
          },
        },
        { status: 404 }
      );
    }

    // Rest of your payment processing code...
    if (serviceRequest.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Payment already completed" },
        { status: 400 }
      );
    }

    if (!serviceRequest.final_cost) {
      return NextResponse.json(
        { success: false, error: "No final cost set for this request" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYMONGO_SECRET_API_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Create checkout session (your existing PayMongo code)
    const checkoutResponse = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              line_items: [
                {
                  currency: "PHP",
                  amount: Math.round(serviceRequest.final_cost * 100),
                  description: `${serviceRequest.category} - Service Request`,
                  name: serviceRequest.category,
                  quantity: 1,
                },
              ],
              payment_method_types: [
                "gcash",
                "paymaya",
                "grab_pay",
                "card",
                "dob",
                "qrph",
              ],
              success_url: `${
                process.env.NODE_ENV === "production"
                  ? process.env.NEXT_PUBLIC_URL
                  : process.env.BETTER_AUTH_URL
              }/service-requests/payment/success?request_id=${serviceRequest._id || serviceRequest.id}`,
              cancel_url: `${
                process.env.NODE_ENV === "production"
                  ? process.env.NEXT_PUBLIC_URL
                  : process.env.BETTER_AUTH_URL
              }/service-requests/payment/cancel?request_id=${serviceRequest._id || serviceRequest.id}`,
              description: `Payment for ${serviceRequest.category} service`,
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              metadata: {
                requestId: (serviceRequest._id || serviceRequest.id).toString(),
                userEmail: session.user.email,
                category: serviceRequest.category,
                type: "service_request",
              },
            },
          },
        }),
      }
    );

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error("PayMongo Checkout API error:", checkoutData);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create checkout session",
          details: checkoutData,
        },
        { status: 400 }
      );
    }

    // Update service request with checkout session ID
    await serviceRequestsCollection.updateOne(
      {
        $or: [{ _id: serviceRequest._id }, { id: serviceRequest.id }],
      },
      {
        $set: {
          checkoutSessionId: checkoutData.data.id,
          payment_status: "processing",
          updated_at: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutData.data.attributes.checkout_url,
      checkoutSession: checkoutData.data,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
