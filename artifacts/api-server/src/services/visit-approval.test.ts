import assert from "node:assert/strict";
import test from "node:test";
import { parseVisitDecisionReply, parseVisitDecisionText } from "./visit-approval";

test("parses exact approval and rejection replies in Arabic and Western digits", () => {
  assert.equal(parseVisitDecisionText("1"), "approved");
  assert.equal(parseVisitDecisionText("٢"), "rejected");
  assert.equal(parseVisitDecisionText("۲"), "rejected");
  assert.equal(parseVisitDecisionText(" ١ "), "approved");
});

test("ignores replies that are not a single supported decision number", () => {
  assert.equal(parseVisitDecisionText("1 please"), null);
  assert.equal(parseVisitDecisionText("12"), null);
  assert.equal(parseVisitDecisionText("approve"), null);
});

test("supports a request suffix when an admin has multiple pending requests", () => {
  assert.deepEqual(parseVisitDecisionReply("1 ABC123"), {
    decision: "approved",
    requestSuffix: "abc123",
  });
  assert.deepEqual(parseVisitDecisionReply("٢ 1a2B3C"), {
    decision: "rejected",
    requestSuffix: "1a2b3c",
  });
  assert.equal(parseVisitDecisionReply("2 please"), null);
});
