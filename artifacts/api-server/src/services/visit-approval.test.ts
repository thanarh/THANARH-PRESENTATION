import assert from "node:assert/strict";
import test from "node:test";
import { parseVisitDecisionText } from "./visit-approval";

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
