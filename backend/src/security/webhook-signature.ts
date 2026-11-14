import { createHmac, timingSafeEqual } from "node:crypto";

/** Verify a raw request body. Call before parsing JSON; reject missing/invalid signatures. */
export function verifyWebhookSignature(
  rawBody: Buffer,
  suppliedHex: string | undefined,
  secret: string,
): boolean {
  if (!suppliedHex || !/^[a-f0-9]{64}$/i.test(suppliedHex) || secret.length < 32) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const supplied = Buffer.from(suppliedHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}
