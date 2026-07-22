import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDb = async () => {
  console.log("MongoUri",env.mongoUri)
  try {
    await mongoose.connect(env.mongoUri);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("connected", () => {
    console.log("✓ Database connection active");
  });

  mongoose.connection.on("error", (err) => {
    console.error("✗ Database error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("✗ Database disconnected");
  });

  return mongoose.connection;
};
