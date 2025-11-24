// src/app/api/admin/fix-locked-accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/database/mongodb";
import { UserSecurityModel } from "@/database/schemas/user-security";
import { connectDB } from "@/database/mongodb";

/**
 * This utility endpoint fixes UserSecurity records that have missing or invalid userIds
 * It attempts to look up the correct userId from the Better-Auth user collection
 */
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

    // Find all locked accounts
    const lockedAccounts = await UserSecurityModel.find({ accountLocked: true }).lean();

    const fixedRecords = [];
    const failedRecords = [];
    const skippedRecords = [];

    for (const account of lockedAccounts) {
      let userId = account.userId;

      // Skip if userId looks valid (UUID pattern - long string without @ or special prefixes)
      if (userId && userId.length > 20 && !userId.includes('@') && !userId.includes(':')) {
        skippedRecords.push({
          id: account._id.toString(),
          userId,
          reason: "userId looks valid",
        });
        continue;
      }

      // Extract email from various patterns
      let emailToLookup = null;
      
      if (!userId || userId.trim() === "") {
        failedRecords.push({
          id: account._id.toString(),
          userId: "null/undefined",
          reason: "userId is missing",
        });
        continue;
      }

      // Handle "email:" prefix pattern
      if (userId.startsWith("email:")) {
        emailToLookup = userId.substring(6); // Remove "email:" prefix
      } 
      // Handle plain email pattern
      else if (userId.includes('@')) {
        emailToLookup = userId;
      }
      // Handle other invalid formats
      else {
        failedRecords.push({
          id: account._id.toString(),
          userId,
          reason: "userId format not recognized",
        });
        continue;
      }

      // Try to find the user by email
      if (emailToLookup) {
        try {
          const userCollection = db.collection("user");
          const user = await userCollection.findOne({ email: emailToLookup });

          if (user) {
            // Get userId - Better-Auth might store it as 'id' or use MongoDB '_id'
            const correctUserId = user.id || user._id?.toString();
            
            if (correctUserId) {
              // Update the UserSecurity record with the correct userId
              await UserSecurityModel.updateOne(
                { _id: account._id },
                { $set: { userId: correctUserId } }
              );

              fixedRecords.push({
                id: account._id.toString(),
                oldUserId: userId,
                newUserId: correctUserId,
                email: emailToLookup,
              });
            } else {
              failedRecords.push({
                id: account._id.toString(),
                userId,
                reason: `User found but has no ID field: ${emailToLookup}`,
              });
            }
          } else {
            failedRecords.push({
              id: account._id.toString(),
              userId,
              reason: `No user found with email: ${emailToLookup}`,
            });
          }
        } catch (error) {
          console.error(`Error fixing record ${account._id}:`, error);
          failedRecords.push({
            id: account._id.toString(),
            userId,
            reason: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Fix operation completed",
      data: {
        total: lockedAccounts.length,
        fixed: fixedRecords.length,
        failed: failedRecords.length,
        skipped: skippedRecords.length,
        fixedRecords,
        failedRecords,
        skippedRecords,
      },
    });

  } catch (error) {
    console.error("Fix locked accounts error:", error);
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

