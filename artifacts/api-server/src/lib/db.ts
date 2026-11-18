import mongoose from "mongoose";
import { logger } from "./logger";
import User from "../models/user";

let isConnected = false;
let connectionPromise: Promise<void> | null = null;
let listenersRegistered = false;

async function ensureSparseEmailIndex(): Promise<void> {
  const collection = User.collection;
  let indexes: Array<{ name?: string; key?: Record<string, unknown>; unique?: boolean; sparse?: boolean }> = [];
  let collectionMissing = false;
  try {
    indexes = await collection.indexes();
  } catch (err: any) {
    if (err?.code !== 26 && err?.codeName !== "NamespaceNotFound") throw err;
    collectionMissing = true;
  }

  const emailIndex = indexes.find((index) => index.key?.email === 1);
  if (emailIndex?.unique && emailIndex.sparse) return;

  const duplicates = collectionMissing
    ? []
    : await collection.aggregate([
        { $match: { email: { $type: "string", $ne: "" } } },
        { $group: { _id: "$email", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $limit: 1 },
      ]).toArray();
  if (duplicates.length) {
    throw new Error("Cannot enable phone-only accounts: duplicate email addresses exist");
  }

  if (emailIndex?.name) await collection.dropIndex(emailIndex.name);
  try {
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true, name: "email_1" });
  } catch (err) {
    if (emailIndex?.name) {
      await collection.createIndex(
        { email: 1 },
        {
          unique: Boolean(emailIndex.unique),
          sparse: Boolean(emailIndex.sparse),
          name: emailIndex.name,
        },
      ).catch(() => {});
    }
    throw err;
  }
}

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
      await ensureSparseEmailIndex();
      isConnected = true;
      if (!listenersRegistered) {
        mongoose.connection.on("disconnected", () => {
          isConnected = false;
          logger.warn("MongoDB disconnected");
        });
        mongoose.connection.on("error", (err) => {
          logger.error({ err }, "MongoDB connection error");
        });
        listenersRegistered = true;
      }
      logger.info({ dbName }, "Connected to MongoDB");
    } catch (err) {
      connectionPromise = null; // allow retry
      logger.error({ err }, "Failed to connect to MongoDB");
      throw err;
    }
  })();

  return connectionPromise;
}
