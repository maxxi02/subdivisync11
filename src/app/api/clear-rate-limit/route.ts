import { db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    const collection = db.collection("rateLimit");

    await collection.deleteOne({ key });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rate limit clear error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
