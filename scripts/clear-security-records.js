// scripts/clear-security-records.js
// Run this script to clear all UserSecurity records from the database
// Usage: node scripts/clear-security-records.js

require('dotenv').config(); // Load .env file
const mongoose = require('mongoose');

// MongoDB Connection URI from .env file
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file');
  console.log('Please add MONGODB_URI to your .env file');
  process.exit(1);
}

const UserSecuritySchema = new mongoose.Schema({
  userId: String,
  failedLoginCount: Number,
  accountLocked: Boolean,
  lockedAt: Date,
  lockedBy: String,
  lockedReason: String,
  unlockedAt: Date,
  unlockedBy: String,
  unlockReason: String,
  lastLoginAttempt: Date,
  lastSuccessfulLogin: Date,
  ipAddress: String,
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

async function clearAllSecurityRecords() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const UserSecurity = mongoose.model('UserSecurity', UserSecuritySchema);

    // Count records before deletion
    const countBefore = await UserSecurity.countDocuments();
    console.log(`📊 Found ${countBefore} UserSecurity record(s)`);

    if (countBefore === 0) {
      console.log('✨ No records to delete. Database is already clean!');
      await mongoose.disconnect();
      return;
    }

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete all UserSecurity records!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete all records
    console.log('🗑️  Deleting all records...');
    const result = await UserSecurity.deleteMany({});

    console.log(`\n✅ Successfully deleted ${result.deletedCount} record(s)!`);
    console.log('🧹 Database cleaned!');

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
clearAllSecurityRecords();


