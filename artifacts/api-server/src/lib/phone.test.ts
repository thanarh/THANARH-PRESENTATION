import assert from "node:assert/strict";
import test from "node:test";
import { normalizePhoneE164, phoneLookupValues } from "./phone";

test("normalizes Saudi national and international formats to E.164", () => {
  assert.equal(normalizePhoneE164("050 123 4567"), "+966501234567");
  assert.equal(normalizePhoneE164("501234567"), "+966501234567");
  assert.equal(normalizePhoneE164("00966 50 123 4567"), "+966501234567");
  assert.equal(normalizePhoneE164("+966 (50) 123-4567"), "+966501234567");
  assert.equal(normalizePhoneE164("٠٥٠١٢٣٤٥٦٧"), "+966501234567");
});

test("normalizes other international numbers without changing their country code", () => {
  assert.equal(normalizePhoneE164("+1 (202) 555-0123"), "+12025550123");
  assert.equal(normalizePhoneE164("12025550123"), "+12025550123");
});

test("rejects incomplete or malformed phone numbers", () => {
  assert.equal(normalizePhoneE164(""), null);
  assert.equal(normalizePhoneE164("12345"), null);
  assert.equal(normalizePhoneE164("+966+501234567"), null);
});

test("provides exact compatibility values for older phone records", () => {
  assert.deepEqual(phoneLookupValues("+966501234567"), [
    "+966501234567",
    "966501234567",
    "00966501234567",
    "0501234567",
    "501234567",
  ]);
});
