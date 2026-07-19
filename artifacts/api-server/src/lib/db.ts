import mongoose from "mongoose";
import { logger } from "./logger";

let isConnected = false;

export async function connectDb(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE_NAME || "thanarah_presentation";

  if (!uri) {
    logger.error("MONGODB_URI is not set");
    throw new Error("MONGODB_URI environment variable is required");
  }

  try {
    await mongoose.connect(uri, { dbName });
    isConnected = true;
    logger.info({ dbName }, "Connected to MongoDB");
  } catch (err) {
    logger.error({ err }, "Failed to connect to MongoDB");
    throw err;
  }

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });
}
