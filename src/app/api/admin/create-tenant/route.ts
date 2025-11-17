import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { auth } from "@/lib/auth"; // Import the server-side auth instance

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { email, password, name, status, address, gender, dateOfBirth, phoneNumber } =
      body;

    // Validate required fields
    if (!email?.trim() || !password || !name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (!gender) {
      return NextResponse.json(
        { success: false, error: "Gender is required" },
        { status: 400 }
      );
    }

    // Validate date of birth
    if (!dateOfBirth) {
      return NextResponse.json(
        { success: false, error: "Date of birth is required" },
        { status: 400 }
      );
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;

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

    // Check if user already exists
    const existingUser = await db.collection("user").findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Use Better-Auth server API to create user
    const newUser = await auth.api.signUpEmail({
      body: {
        email: email.trim(),
        password: password,
        name: name.trim(),
      },
    });

    if (!newUser) {
      return NextResponse.json(
        { success: false, error: "Failed to create user account" },
        { status: 500 }
      );
    }

    console.log("New user created:", newUser.user);

    // Find the user by email (since Better-Auth doesn't store the 'id' field properly)
    const createdUser = await db.collection("user").findOne({
      email: email.trim().toLowerCase(),
    });

    if (!createdUser) {
      console.error("Could not find user with email:", email.trim());
      return NextResponse.json(
        { success: false, error: "Failed to retrieve created user" },
        { status: 500 }
      );
    }

    // Update the user with additional fields
    await db.collection("user").updateOne(
      { _id: createdUser._id }, // Use MongoDB _id
      {
        $set: {
          role: "tenant",
          status: status || "Active",
          address: address?.trim() || "n/a",
          gender,
          dateOfBirth: birthDate, // Store as Date object
          age: actualAge, // Store calculated age
          phoneNumber: phoneNumber?.trim() || "n/a",
          updatedAt: new Date(),
        },
      }
    );
    
    const completeUser = await db
      .collection("user")
      .findOne({ _id: createdUser._id });

    if (!completeUser) {
      return NextResponse.json(
        { success: false, error: "Failed to retrieve updated user" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Tenant created successfully",
        user: {
          id: completeUser._id.toString(), // Convert ObjectId to string
          name: completeUser.name,
          email: completeUser.email,
          status: completeUser.status,
          address: completeUser.address,
          gender: completeUser.gender,
          dateOfBirth: completeUser.dateOfBirth,
          age: completeUser.age,
          phoneNumber: completeUser.phoneNumber,
          createdAt: completeUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create tenant",
      },
      { status: 500 }
    );
  }
}