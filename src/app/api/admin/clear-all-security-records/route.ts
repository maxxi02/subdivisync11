// src/app/api/admin/clear-all-security-records/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserSecurityModel } from "@/database/schemas/user-security";
import { connectDB } from "@/database/mongodb";

/**
 * DELETE endpoint to remove ALL UserSecurity records
 * WARNING: This clears all locked account history
 */
export async function DELETE(request: NextRequest) {
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

    // Count records before deletion
    const countBefore = await UserSecurityModel.countDocuments();

    // Delete ALL UserSecurity records
    const result = await UserSecurityModel.deleteMany({});

    console.log(`Admin ${session.user.id} cleared all UserSecurity records. Deleted: ${result.deletedCount}`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all UserSecurity records`,
      data: {
        deletedCount: result.deletedCount,
        countBefore,
        deletedBy: session.user.id,
        deletedAt: new Date(),
      },
    });

  } catch (error) {
    console.error("Clear all security records error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}


