import { test } from "node:test";
import assert from "node:assert/strict";
import { readRegistrationSession, storeRegistrationSession, secondsUntil } from "../src/features/auth/lib/registration-session.ts";

function storage() {
  const map = new Map<string, string>();
  return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key), map };
}
const now = Date.parse("2026-10-02T00:00:00Z");
const challenge = { verificationSession: "s".repeat(64), email: "student@example.invalid",
  expiresAt: "2026-10-02T00:10:00Z", resendAvailableAt: "2026-10-02T00:01:00Z", sessionExpiresAt: "2026-10-02T01:00:00Z" };

test("registration survives reload in the same tab without storing password or OTP", () => {
  const source = storage();
  storeRegistrationSession(challenge, source);
  assert.deepEqual(readRegistrationSession(source, now), challenge);
  const raw = [...source.map.values()][0];
  assert.equal(raw.includes("password"), false);
  assert.equal(raw.includes('"code"'), false);
  storeRegistrationSession(null, source);
  assert.equal(readRegistrationSession(source, now), null);
});

test("expired registration session is discarded but expired OTP allows resend", () => {
  const source = storage();
  storeRegistrationSession(challenge, source);
  assert.deepEqual(readRegistrationSession(source, now + 10 * 60_000), challenge);
  assert.equal(readRegistrationSession(source, now + 60 * 60_000), null);
  assert.equal(source.map.size, 0);
});

test("malformed stored values and unavailable storage cannot break registration", () => {
  const source = storage();
  for (const value of ["{", "null", JSON.stringify({ ...challenge, verificationSession: "wrong" }), JSON.stringify({ ...challenge, expiresAt: "invalid" })]) {
    source.map.set("olympic-registration-session", value);
    assert.equal(readRegistrationSession(source, now), null);
  }
  const denied = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); }, removeItem() { throw new Error("denied"); } };
  assert.equal(readRegistrationSession(denied, now), null);
  assert.doesNotThrow(() => storeRegistrationSession(challenge, denied));
  assert.doesNotThrow(() => storeRegistrationSession(null, denied));
});

test("countdown rounds up and reaches zero exactly at the server deadline", () => {
  assert.equal(secondsUntil(challenge.resendAvailableAt, now), 60);
  assert.equal(secondsUntil(challenge.resendAvailableAt, now + 59_999), 1);
  assert.equal(secondsUntil(challenge.resendAvailableAt, now + 60_000), 0);
  assert.equal(secondsUntil(challenge.resendAvailableAt, now + 60_001), 0);
});
