import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { getServerSession } from "@/better-auth/action";
import { ObjectId } from "mongodb";

// Define the expected shape of the request body
interface UpdatePaymentRequest {
  status: "pending" | "paid" | "overdue";
  paidDate?: string;
  paymentMethod?: string;
  paymentIntentId?: string;
}

// Define the MonthlyPayment type to match TransactionPage.tsx
interface MonthlyPayment {
  _id: ObjectId;
  paymentPlanId: string;
  propertyId: string;
  tenantEmail: string;
  monthNumber: number;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paymentIntentId?: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  receiptUrl?: string;
  created_at: string;
  updated_at: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session and validate
    const session = await getServerSession();
    if (!session || !session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantEmail = session.user.email;

    // Connect to database
    await connectDB();
    const monthlyPaymentsCollection =
      db.collection<MonthlyPayment>("monthly_payments");

    // Parse and validate request body
    const body = (await request.json()) as UpdatePaymentRequest;
    const { status, paidDate, paymentMethod, paymentIntentId } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status value
    if (!["pending", "paid", "overdue"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Find the payment to verify ownership
    const paymentId = (await params).id;
    if (!ObjectId.isValid(paymentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment ID" },
        { status: 400 }
      );
    }

    const payment = await monthlyPaymentsCollection.findOne({
      _id: new ObjectId(paymentId),
    });

    if (!payment || payment.tenantEmail !== tenantEmail) {
      return NextResponse.json(
        { success: false, error: "Payment not found or unauthorized" },
        { status: 404 }
      );
    }

    // Prepare update fields
    const updateFields: Partial<MonthlyPayment> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (paidDate) updateFields.paidDate = paidDate;
    if (paymentMethod) updateFields.paymentMethod = paymentMethod;
    if (paymentIntentId) updateFields.paymentIntentId = paymentIntentId;

    // Perform update
    const result = await monthlyPaymentsCollection.updateOne(
      { _id: new ObjectId(paymentId) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to update payment" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
