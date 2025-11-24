// src/database/migrations/create-user-security-collection.ts
import { connectDB } from "@/database/mongodb";
import { UserSecurityModel } from "@/database/schemas/user-security";

/**
 * Migration script to create the UserSecurity collection
 * This ensures the collection exists and has proper indexes
 */
export async function createUserSecurityCollection() {
  try {
    console.log("🔄 Starting UserSecurity collection migration...");
    
    await connectDB();
    
    // Create indexes for better performance
    await UserSecurityModel.collection.createIndexes([
      { key: { userId: 1 }, unique: true },
      { key: { accountLocked: 1 } },
      { key: { lockedAt: -1 } },
      { key: { lastLoginAttempt: -1 } },
    ]);
    
    console.log("✅ UserSecurity collection migration completed successfully!");
    
    // Return collection info
    const count = await UserSecurityModel.countDocuments();
    console.log(`📊 Collection info:`, {
      documentCount: count,
      indexesCreated: true,
    });
    
    return {
      success: true,
      message: "UserSecurity collection created successfully",
      documentCount: count,
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw new Error(`Failed to create UserSecurity collection: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Allow running this script directly
if (require.main === module) {
  createUserSecurityCollection()
    .then((result) => {
      console.log("🎉 Migration completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}