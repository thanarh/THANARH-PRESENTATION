import app from "./app";
import { logger } from "./lib/logger";
import { connectDb } from "./lib/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Start HTTP server immediately — don't block on MongoDB.
// Each route calls connectDb() which retries lazily.
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Thanarah API Server listening");
});

// Attempt initial DB connection in the background; log but don't crash.
connectDb().catch((err) => {
  logger.warn({ err }, "Initial MongoDB connection failed — will retry on first request");
});
