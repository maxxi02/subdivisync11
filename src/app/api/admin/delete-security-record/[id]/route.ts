// src/app/api/admin/delete-security-record/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserSecurityModel } from "@/database/schemas/user-security";
import { connectDB } from "@/database/mongodb";

/**
 * DELETE endpoint to remove a UserSecurity record
 * This clears the locked account history for a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Await params in Next.js 15+
    const { id: recordId } = await params;
    if (!recordId) {
      return NextResponse.json(
        { success: false, message: "Record ID is required" },
        { status: 400 }
      );
    }

    // Find the record first to get details for logging
    const record = await UserSecurityModel.findById(recordId);

    if (!record) {
      return NextResponse.json(
        { success: false, message: "Security record not found" },
        { status: 404 }
      );
    }

    // Store details before deletion
    const deletedRecordInfo = {
      userId: record.userId,
      accountLocked: record.accountLocked,
      failedLoginCount: record.failedLoginCount,
      lockedAt: record.lockedAt,
      lockedReason: record.lockedReason,
    };

    // Delete the record
    await UserSecurityModel.findByIdAndDelete(recordId);

    console.log(`Admin ${session.user.id} deleted security record for userId: ${record.userId}`);

    return NextResponse.json({
      success: true,
      message: "Security record deleted successfully",
      data: {
        deletedRecord: deletedRecordInfo,
        deletedBy: session.user.id,
        deletedAt: new Date(),
      },
    });

  } catch (error) {
    console.error("Delete security record error:", error);
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

