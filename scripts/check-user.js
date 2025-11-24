// scripts/check-user.js
// Check if a specific user exists and show their exact data
// Usage: node scripts/check-user.js johnrgrafe@gmail.com

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const email = process.argv[2] || 'johnrgrafe@gmail.com';

async function checkUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('user');

    console.log(`🔍 Searching for email: "${email}"\n`);

    // Try exact match
    const user = await usersCollection.findOne({ email: email });

    if (user) {
      console.log('✅ USER FOUND!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`ID: ${user.id}`);
      console.log(`Email (exact): "${user.email}"`);
      console.log(`Email length: ${user.email ? user.email.length : 0} chars`);
      console.log(`Name: ${user.name || 'N/A'}`);
      console.log(`Role: ${user.role || 'N/A'}`);
      console.log(`Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`Created At: ${user.createdAt || 'N/A'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('❌ User NOT found with exact match\n');
      
      // Try case-insensitive search
      console.log('🔍 Trying case-insensitive search...\n');
      const userInsensitive = await usersCollection.findOne({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') } 
      });

      if (userInsensitive) {
        console.log('✅ Found with case-insensitive search!');
        console.log(`Stored email: "${userInsensitive.email}"`);
        console.log(`You searched: "${email}"`);
        console.log('⚠️  Email case mismatch!\n');
      } else {
        console.log('❌ Not found even with case-insensitive search\n');
        
        // List all users
        console.log('📋 Listing ALL users in database:\n');
        const allUsers = await usersCollection.find({}).toArray();
        
        if (allUsers.length === 0) {
          console.log('📭 No users found in database!');
        } else {
          allUsers.forEach((u, i) => {
            console.log(`${i + 1}. "${u.email}" (ID: ${u.id})`);
          });
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkUser();

