import { expect, it } from "vitest";
import {
  signEnvelope,
  verifyEnvelope,
} from "../lib/security/gateway-signature";
const secret = "a".repeat(64);
const payload = {
  version: 1 as const,
  ownerId: "alice",
  issuedAt: 100000,
  operation: "business" as const,
  input: { operation: "revenue" },
};
it("verifies exact signed owner-scoped bytes", async () => {
  const body = JSON.stringify(payload);
  const signature = await signEnvelope(body, secret);
  expect(await verifyEnvelope(body, signature, secret, 100001)).toEqual(
    payload,
  );
});
it("rejects tampering and forged owner", async () => {
  const body = JSON.stringify(payload);
  const sig = await signEnvelope(body, secret);
  await expect(
    verifyEnvelope(body.replace("alice", "bob"), sig, secret, 100001),
  ).rejects.toThrow();
});
it.each(["", "abc", "00".repeat(32)])(
  "rejects missing/invalid signatures",
  async (sig) => {
    await expect(
      verifyEnvelope(JSON.stringify(payload), sig, secret, 100000),
    ).rejects.toThrow();
  },
);
it.each([160001, 39999])(
  "rejects expired or future timestamps",
  async (now) => {
    const body = JSON.stringify(payload);
    await expect(
      verifyEnvelope(body, await signEnvelope(body, secret), secret, now),
    ).rejects.toThrow();
  },
);
it("rejects unknown operations, extra fields and missing secret", async () => {
  for (const p of [
    { ...payload, operation: "seed" },
    { ...payload, admin: true },
  ]) {
    const body = JSON.stringify(p);
    await expect(
      verifyEnvelope(body, await signEnvelope(body, secret), secret, 100000),
    ).rejects.toThrow();
  }
  await expect(signEnvelope("{}", "")).rejects.toThrow();
});
