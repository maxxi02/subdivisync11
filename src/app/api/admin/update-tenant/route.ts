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
    const {
      userId,
      name,
      email,
      status,
      address,
      gender,
      dateOfBirth,
      phoneNumber,
    } = body;

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

    // Validate date of birth if provided
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (actualAge < 18) {
        return NextResponse.json(
          { success: false, error: "Tenant must be at least 18 years old" },
          { status: 400 }
        );
      }

      if (actualAge > 120) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid date of birth" },
          { status: 400 }
        );
      }
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
    if (phoneNumber !== undefined)
      updateFields.phoneNumber = phoneNumber.trim();

    // Handle date of birth and calculate age
    if (dateOfBirth !== undefined) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      updateFields.dateOfBirth = birthDate;
      updateFields.age = actualAge;
    }

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
