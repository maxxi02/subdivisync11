import { MongoClient, Db } from "mongodb";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

let isConnected = false;

export async function connectDB() {
  if (isConnected || !MONGODB_URI) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

// Create client and db - use empty string fallback for build time
// At runtime, MONGODB_URI will always be available from environment
const client = MONGODB_URI ? new MongoClient(MONGODB_URI) : (null as unknown as MongoClient);
const db = MONGODB_URI ? client.db("subdivisync") : (null as unknown as Db);

export { client, db };
