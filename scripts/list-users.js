// scripts/list-users.js
// Run this to see what user accounts exist in your database
// Usage: node scripts/list-users.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function listUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('user');

    const users = await usersCollection.find({}).toArray();

    if (users.length === 0) {
      console.log('📭 No users found in the database!');
      console.log('   You need to register/create accounts first.\n');
    } else {
      console.log(`📊 Found ${users.length} user(s) in the database:\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt || 'N/A'}`);
        console.log('');
      });
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

listUsers();

