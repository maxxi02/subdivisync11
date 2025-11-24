// src/app/api/admin/unlock-account/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserSecurityModel } from "@/database/schemas/user-security";
import { connectDB } from "@/database/mongodb";
import { z } from "zod";

// Validation schema for unlocking request
const UnlockAccountSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Await params in Next.js 15+
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason } = UnlockAccountSchema.parse(body);

    // Find the user security record
    const userSecurity = await UserSecurityModel.findOne({ userId });

    if (!userSecurity) {
      return NextResponse.json(
        { success: false, message: "User security record not found" },
        { status: 404 }
      );
    }

    if (!userSecurity.accountLocked) {
      return NextResponse.json(
        { success: false, message: "Account is not locked" },
        { status: 400 }
      );
    }

    // Unlock the account and reset failed login count
    const previousLockedState = {
      lockedAt: userSecurity.lockedAt,
      lockedBy: userSecurity.lockedBy,
      lockedReason: userSecurity.lockedReason,
      failedLoginCount: userSecurity.failedLoginCount,
    };

    userSecurity.accountLocked = false;
    userSecurity.unlockedAt = new Date();
    userSecurity.unlockedBy = session.user.id;
    userSecurity.unlockReason = reason || "Manually unlocked by admin";
    userSecurity.failedLoginCount = 0;
    
    // Clear the locked state
    userSecurity.lockedAt = undefined;
    userSecurity.lockedBy = undefined;
    userSecurity.lockedReason = undefined;

    await userSecurity.save();

    return NextResponse.json({
      success: true,
      message: "Account unlocked successfully",
      data: {
        userId,
        unlockedAt: userSecurity.unlockedAt,
        unlockedBy: session.user.id,
        unlockReason: userSecurity.unlockReason,
        previousState: previousLockedState,
        resetLoginCount: true,
      },
    });

  } catch (error) {
    console.error("Unlock account error:", error);
    
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

// GET endpoint to get current account status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Await params in Next.js 15+
    const { userId } = await params;
    const userSecurity = await UserSecurityModel.findOne({ userId }).lean();

    if (!userSecurity) {
      return NextResponse.json({
        success: true,
        data: {
          userId,
          accountLocked: false,
          failedLoginCount: 0,
          attemptsRemaining: 3,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        accountLocked: userSecurity.accountLocked,
        failedLoginCount: userSecurity.failedLoginCount,
        attemptsRemaining: Math.max(0, 3 - userSecurity.failedLoginCount),
        lockedAt: userSecurity.lockedAt,
        lockedBy: userSecurity.lockedBy,
        lockedReason: userSecurity.lockedReason,
        lastLoginAttempt: userSecurity.lastLoginAttempt,
        lastSuccessfulLogin: userSecurity.lastSuccessfulLogin,
      },
    });

  } catch (error) {
    console.error("Get account status error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}