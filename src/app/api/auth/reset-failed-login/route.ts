// src/app/api/auth/reset-failed-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/mongodb";
import { UserSecurityModel } from "@/database/schemas/user-security";
import { connectDB } from "@/database/mongodb";
import { z } from "zod";

// Validation schema
const ResetFailedLoginSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email(),
});

// Helper function to get userId from email
async function getUserIdFromEmail(email: string): Promise<string | null> {
  try {
    const collection = db.collection("user");
    const user = await collection.findOne({ email: email });
    // Better-Auth might store ID as 'id' or use MongoDB '_id'
    return user?.id || user?._id?.toString() || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * POST endpoint to reset failed login count on successful login
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, email } = ResetFailedLoginSchema.parse(body);

    // Get userId if not provided
    let targetUserId = userId;
    if (!targetUserId && email) {
      targetUserId = (await getUserIdFromEmail(email)) ?? undefined;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: "User identification failed" },
        { status: 400 }
      );
    }
    
    // Find user security record
    const userSecurity = await UserSecurityModel.findOne({ userId: targetUserId });
    
    if (!userSecurity) {
      // No security record exists, nothing to reset
      return NextResponse.json({
        success: true,
        message: "No security record found, nothing to reset",
        data: {
          failedLoginCount: 0,
          accountLocked: false,
        },
      });
    }

    // Only reset if there were failed attempts
    if (userSecurity.failedLoginCount > 0 || userSecurity.accountLocked) {
      const previousCount = userSecurity.failedLoginCount;
      const wasLocked = userSecurity.accountLocked;

      // Reset failed login count and unlock if necessary
      userSecurity.failedLoginCount = 0;
      userSecurity.accountLocked = false;
      userSecurity.lastSuccessfulLogin = new Date();
      
      // Clear lock-related fields
      userSecurity.lockedAt = undefined;
      userSecurity.lockedBy = undefined;
      userSecurity.lockedReason = undefined;

      await userSecurity.save();

      console.log(`Reset failed login count for userId: ${targetUserId} (was ${previousCount}, locked: ${wasLocked})`);

      return NextResponse.json({
        success: true,
        message: "Failed login count reset successfully",
        data: {
          userId: targetUserId,
          previousFailedLoginCount: previousCount,
          wasLocked,
          resetAt: new Date(),
        },
      });
    }

    // No reset needed
    return NextResponse.json({
      success: true,
      message: "No reset needed",
      data: {
        failedLoginCount: 0,
        accountLocked: false,
      },
    });

  } catch (error) {
    console.error("Reset failed login error:", error);
    
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

