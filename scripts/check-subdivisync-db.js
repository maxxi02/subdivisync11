// scripts/check-subdivisync-db.js
// Check the "subdivisync" database specifically
// Usage: node scripts/check-subdivisync-db.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // Connect to the subdivisync database
    const db = client.db("subdivisync");
    console.log('📊 Database: "subdivisync"\n');

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`   - ${coll.name} (${count} documents)`);
    }
    console.log('');

    // Check user collection
    const userCollection = db.collection('user');
    const userCount = await userCollection.countDocuments();
    
    console.log(`👥 Users in "user" collection: ${userCount}`);
    
    if (userCount > 0) {
      console.log('\n📋 User list:');
      const users = await userCollection.find({}).toArray();
      users.forEach((user, i) => {
        console.log(`\n${i + 1}. Name: ${user.name || 'N/A'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Created: ${user.createdAt || 'N/A'}`);
      });
    }

    // Check if johnrgrafe exists
    console.log('\n\n🔍 Searching for johnrgrafe@gmail.com:');
    const johnGrafe = await userCollection.findOne({ email: 'johnrgrafe@gmail.com' });
    if (johnGrafe) {
      console.log('✅ FOUND!');
      console.log(`   ID: ${johnGrafe.id}`);
      console.log(`   Name: ${johnGrafe.name}`);
      console.log(`   Role: ${johnGrafe.role}`);
    } else {
      console.log('❌ Not found');
    }

    await client.close();
    console.log('\n👋 Disconnected');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.close();
    process.exit(1);
  }
}

checkDatabase();

