import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "../src/security/webhook-signature.js";

test("accepts a valid HMAC-SHA256 signature", () => {
  const body = Buffer.from('{"event":"payment.confirmed"}');
  const secret = "s".repeat(40);
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyWebhookSignature(body, signature, secret), true);
});

test("rejects missing, malformed, short-secret and tampered signatures", () => {
  const body = Buffer.from('{"event":"payment.confirmed"}');
  assert.equal(verifyWebhookSignature(body, undefined, "s".repeat(40)), false);
  assert.equal(verifyWebhookSignature(body, "bad", "s".repeat(40)), false);
  assert.equal(verifyWebhookSignature(body, "0".repeat(64), "short"), false);
  assert.equal(verifyWebhookSignature(body, "0".repeat(64), "s".repeat(40)), false);
});
