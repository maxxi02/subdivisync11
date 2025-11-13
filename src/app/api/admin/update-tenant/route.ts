import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { ObjectId } from "mongodb"; // Import ObjectId

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { userId, name, email, status, address, gender, age, phoneNumber } =
      body;

    console.log("Update request received:", { userId, name, email });

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }
    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }
    if (age && (age < 0 || age > 120)) {
      return NextResponse.json(
        { success: false, error: "Valid age is required (0-120)" },
        { status: 400 }
      );
    }

    // Use _id with ObjectId
    const existingUser = await db
      .collection("user")
      .findOne({ _id: new ObjectId(userId) });

    console.log("Existing user found:", existingUser ? "Yes" : "No");

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email.trim() !== existingUser.email) {
      const emailExists = await db.collection("user").findOne({
        email: email.trim(),
        _id: { $ne: new ObjectId(userId) },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateFields: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      updatedAt: new Date(),
    };

    // Add optional fields
    if (status !== undefined) updateFields.status = status;
    if (address !== undefined) updateFields.address = address.trim();
    if (gender !== undefined) updateFields.gender = gender;
    if (age !== undefined) updateFields.age = parseInt(age.toString()) || 0;
    if (phoneNumber !== undefined)
      updateFields.phoneNumber = phoneNumber.trim();

    console.log("Updating user with id:", userId);

    // Update user using _id with ObjectId
    const result = await db
      .collection("user")
      .updateOne({ _id: new ObjectId(userId) }, { $set: updateFields });

    console.log("Update result:", {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found during update" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Tenant updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tenant" },
      { status: 500 }
    );
  }
}
