import mongoose from "mongoose";
import { env } from "./env.js";

const redactMongoUri = (uri) => {
  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname?.replace(/^\//, "") || "(default)";
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port || "27017"}/${dbName}`;
  } catch {
    return "(invalid mongo uri)";
  }
};

export const connectDb = async () => {
  console.log("MongoDB target:", redactMongoUri(env.mongoUri));
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
