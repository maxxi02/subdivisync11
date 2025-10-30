import { getServerSession } from "@/better-auth/action";
import { NextRequest, NextResponse } from "next/server";
import { connectDB, db } from "@/database/mongodb";
import { hash } from "bcryptjs";

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
    const { email, password, name, status, address, gender, age, phoneNumber } =
      body;

    // Validate required fields
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

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
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

    // Check if user already exists
    const existingUser = await db
      .collection("user")
      .findOne({ email: email.trim() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate user ID
    const userId = crypto.randomUUID();

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user document
    const newUser = {
      id: userId,
      email: email.trim(),
      emailVerified: false,
      name: name.trim(),
      role: "tenant",
      status,
      address: address.trim(),
      gender,
      age: parseInt(age.toString()),
      phoneNumber: phoneNumber.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      banned: false,
      twoFactorEnabled: false,
    };

    // Insert user
    const userResult = await db.collection("user").insertOne(newUser);

    if (!userResult.insertedId) {
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create account record for password authentication
    await db.collection("account").insertOne({
      id: crypto.randomUUID(),
      userId: userId,
      accountId: email.trim(),
      providerId: "credential",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        user: newUser,
        message: "Tenant created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tenant" },
      { status: 500 }
    );
  }
}
