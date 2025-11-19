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

    const tenantEmail = session.user.email;
    const { requestId, amount } = await request.json();

    if (!requestId || !amount) {
      return NextResponse.json(
        { success: false, error: "Payment ID and amount are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const monthlyPaymentsCollection = db.collection("monthly_payments");

    // Get payment details
    const payment = await monthlyPaymentsCollection.findOne({
      _id: new ObjectId(requestId),
      tenantEmail: tenantEmail,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if payment is already paid or pending verification
    if (
      payment.status === "paid" ||
      payment.status === "pending_verification"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment already processed or pending verification",
        },
        { status: 400 }
      );
    }

    // Update payment status to pending_verification
    const result = await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: "pending_verification",
          paymentMethod: "Cash",
          notes:
            "Cash payment submitted by tenant - awaiting admin verification",
          updated_at: new Date().toISOString(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update payment status" },
        { status: 500 }
      );
    }

    // Get updated payment
    const updatedPayment = await monthlyPaymentsCollection.findOne({
      _id: new ObjectId(requestId),
    });

    return NextResponse.json({
      success: true,
      message: "Cash payment submitted for verification",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Error processing cash payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process cash payment",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
