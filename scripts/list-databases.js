// scripts/list-databases.js
// List all databases and collections
// Usage: node scripts/list-databases.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function listDatabases() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`Connection string: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}\n`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const connection = mongoose.connection;
    const dbName = connection.db.databaseName;
    
    console.log(`📊 Current Database: "${dbName}"\n`);

    // List all collections in current database
    const collections = await connection.db.listCollections().toArray();
    
    console.log(`📁 Collections in "${dbName}":`);
    if (collections.length === 0) {
      console.log('   (empty - no collections)\n');
    } else {
      for (const collection of collections) {
        const count = await connection.db.collection(collection.name).countDocuments();
        console.log(`   - ${collection.name} (${count} documents)`);
      }
      console.log('');
    }

    // Check specifically for user collection
    console.log('🔍 Checking "user" collection:');
    const userCollection = connection.db.collection('user');
    const userCount = await userCollection.countDocuments();
    console.log(`   Total users: ${userCount}`);
    
    if (userCount > 0) {
      console.log('   Sample users:');
      const users = await userCollection.find({}).limit(5).toArray();
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. Email: ${user.email}, Role: ${user.role || 'N/A'}, ID: ${user.id}`);
      });
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

listDatabases();

