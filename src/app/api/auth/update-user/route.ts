import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
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

    await connectDB();

    const body = await request.json();
    const { name, image, address, gender, dateOfBirth, phoneNumber } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
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
          { success: false, error: "You must be at least 18 years old" },
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

    // Validate phone number if provided
    if (phoneNumber && phoneNumber.trim() !== "n/a") {
      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid phone number format. Use 09XXXXXXXXX or +639XXXXXXXXX",
          },
          { status: 400 }
        );
      }
    }

    // Get user from database using session user id
    const userId = session.user.id;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Build update object
    const updateFields: Record<string, unknown> = {
      name: name.trim(),
      updatedAt: new Date(),
    };

    if (image !== undefined) updateFields.image = image;
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

    // Update user
    const result = await db
      .collection("user")
      .updateOne({ _id: new ObjectId(userId) }, { $set: updateFields });

    if (result.matchedCount === 0) {
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
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
