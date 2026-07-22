import mongoose from "mongoose";
import { logger } from "./logger";

let isConnected = false;
let connectionPromise: Promise<void> | null = null;

export async function connectDb(): Promise<void> {
  if (isConnected) return;

  // Prevent parallel connection attempts
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE_NAME || "thanarah_presentation";

  if (!uri) {
    logger.error("MONGODB_URI is not set");
    throw new Error("MONGODB_URI environment variable is required");
  }

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri, {
        dbName,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      isConnected = true;
      logger.info({ dbName }, "Connected to MongoDB");
    } catch (err) {
      connectionPromise = null; // allow retry
      logger.error({ err }, "Failed to connect to MongoDB");
      throw err;
    }
  })();

  return connectionPromise;

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });
}
