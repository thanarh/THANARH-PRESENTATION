import assert from "node:assert/strict";
import test from "node:test";
import { notifyQiroxMessage } from "./waNotify";

test("rejects a QIROX API failure even when returned with HTTP 200", async () => {
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.QIROX_PROJECT_API_TOKEN;
  const previousProjectId = process.env.QIROX_PROJECT_ID;
  process.env.QIROX_PROJECT_API_TOKEN = "test-token";
  process.env.QIROX_PROJECT_ID = "test-project";
  globalThis.fetch = async () => new Response(
    JSON.stringify({ success: false, error: "delivery failed" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

  try {
    await assert.rejects(
      notifyQiroxMessage("+12025550123", "A test notification", "Test recipient"),
      /rejected the message/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.QIROX_PROJECT_API_TOKEN;
    else process.env.QIROX_PROJECT_API_TOKEN = previousToken;
    if (previousProjectId === undefined) delete process.env.QIROX_PROJECT_ID;
    else process.env.QIROX_PROJECT_ID = previousProjectId;
  }
});
