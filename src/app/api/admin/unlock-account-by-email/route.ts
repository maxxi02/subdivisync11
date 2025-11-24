// src/app/api/admin/unlock-account-by-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/database/mongodb";
import { UserSecurityModel } from "@/database/schemas/user-security";
import { connectDB } from "@/database/mongodb";
import { z } from "zod";

// Validation schema for unlocking request
const UnlockByEmailSchema = z.object({
  email: z.string().email(),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { email, reason } = UnlockByEmailSchema.parse(body);

    // First, find the actual user by email
    const userCollection = db.collection("user");
    const user = await userCollection.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found with this email" },
        { status: 404 }
      );
    }

    // Get userId - Better-Auth might store it as 'id' or use MongoDB '_id'
    const correctUserId = user.id || user._id?.toString();

    if (!correctUserId) {
      return NextResponse.json(
        { success: false, message: "User found but has no ID field" },
        { status: 500 }
      );
    }

    // Try to find user security record by correct userId first
    let userSecurity = await UserSecurityModel.findOne({ userId: correctUserId });

    // If not found, search for records with email patterns
    if (!userSecurity) {
      const possiblePatterns = [
        email,
        `email:${email}`,
      ];

      for (const pattern of possiblePatterns) {
        userSecurity = await UserSecurityModel.findOne({ userId: pattern });
        if (userSecurity) {
          console.log(`Found security record with userId pattern: ${pattern}`);
          break;
        }
      }
    }

    if (!userSecurity) {
      return NextResponse.json(
        { success: false, message: "No security record found for this email" },
        { status: 404 }
      );
    }

    if (!userSecurity.accountLocked) {
      return NextResponse.json(
        { success: false, message: "Account is not locked" },
        { status: 400 }
      );
    }

    // Store previous state
    const previousLockedState = {
      lockedAt: userSecurity.lockedAt,
      lockedBy: userSecurity.lockedBy,
      lockedReason: userSecurity.lockedReason,
      failedLoginCount: userSecurity.failedLoginCount,
      oldUserId: userSecurity.userId,
    };

    // Unlock and fix the userId
    userSecurity.accountLocked = false;
    userSecurity.unlockedAt = new Date();
    userSecurity.unlockedBy = session.user.id;
    userSecurity.unlockReason = reason || "Unlocked by admin via email";
    userSecurity.failedLoginCount = 0;
    userSecurity.userId = correctUserId; // Fix the userId!
    
    // Clear the locked state
    userSecurity.lockedAt = undefined;
    userSecurity.lockedBy = undefined;
    userSecurity.lockedReason = undefined;

    await userSecurity.save();

    return NextResponse.json({
      success: true,
      message: "Account unlocked and userId corrected successfully",
      data: {
        email,
        correctedUserId: correctUserId,
        unlockedAt: userSecurity.unlockedAt,
        unlockedBy: session.user.id,
        unlockReason: userSecurity.unlockReason,
        previousState: previousLockedState,
        userIdWasFixed: previousLockedState.oldUserId !== correctUserId,
      },
    });

  } catch (error) {
    console.error("Unlock by email error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

