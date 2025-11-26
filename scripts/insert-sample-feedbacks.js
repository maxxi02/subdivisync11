const { MongoClient } = require('mongodb');

async function insertSampleFeedbacks() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('subdivisync');
    const collection = db.collection('feedbacks');

    // Check if we already have feedbacks
    const count = await collection.countDocuments();
    console.log(`Current feedback count: ${count}`);

    if (count === 0) {
      // Sample data
      const sampleFeedbacks = [
        {
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          rating: 5,
          message: 'We love our new home in Lynville! The community is perfect for our family.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: 'user2',
          userName: 'Maria Santos',
          userEmail: 'maria@example.com',
          rating: 4,
          message: 'Great location and excellent amenities. The security gives us peace of mind.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: 'user3',
          userName: 'Robert Cruz',
          userEmail: 'robert@example.com',
          rating: 5,
          message: 'The property management team is very responsive. Highly recommended!',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: 'user4',
          userName: 'Sarah Garcia',
          userEmail: 'sarah@example.com',
          rating: 4,
          message: "We've been living here for a year and love the community atmosphere.",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: 'user5',
          userName: 'Michael Reyes',
          userEmail: 'michael@example.com',
          rating: 5,
          message: 'The house quality exceeded our expectations. Very satisfied with our purchase.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: 'user6',
          userName: 'Jennifer Tan',
          userEmail: 'jennifer@example.com',
          rating: 5,
          message: 'Excellent value for money and the location is perfect for commuting to work.',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = await collection.insertMany(sampleFeedbacks);
      console.log(`${result.insertedCount} sample feedbacks inserted`);
    } else {
      console.log('Feedbacks already exist, skipping sample data insertion');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

insertSampleFeedbacks().catch(console.error);
