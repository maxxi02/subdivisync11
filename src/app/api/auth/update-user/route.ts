import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
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

    await connectDB();

    const body = await request.json();
    const { name, image, address, gender, age, phoneNumber } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!address?.trim()) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    if (!gender) {
      return NextResponse.json(
        { success: false, error: "Gender is required" },
        { status: 400 }
      );
    }

    if (!age || age < 18 || age > 120) {
      return NextResponse.json(
        { success: false, error: "Valid age is required (18-120)" },
        { status: 400 }
      );
    }

    if (!phoneNumber?.trim()) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Update user in database
    const result = await db.collection("user").updateOne(
      { id: session.user.id },
      {
        $set: {
          name: name.trim(),
          image,
          address: address.trim(),
          gender,
          age: parseInt(age.toString()),
          phoneNumber: phoneNumber.trim(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
