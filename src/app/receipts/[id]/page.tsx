// src/app/api/receipts/[id]/route.ts
import { connectDB, db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const receiptsCollection = db.collection("receipts");

    const resolvedParams = await params;
    const receiptId = resolvedParams.id;

    if (!ObjectId.isValid(receiptId)) {
      return NextResponse.json(
        { success: false, error: "Invalid receipt ID" },
        { status: 400 }
      );
    }

    const receipt = await receiptsCollection.findOne({
      _id: new ObjectId(receiptId),
    });

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: "Receipt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      receipt: {
        ...receipt,
        _id: receipt._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}
