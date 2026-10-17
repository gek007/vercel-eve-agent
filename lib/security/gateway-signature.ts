import { z } from "zod";
const envelopeSchema = z
  .object({
    version: z.literal(1),
    ownerId: z.string().min(1).max(200),
    issuedAt: z.number().int().nonnegative(),
    operation: z.enum([
      "business",
      "session.claim",
      "session.assert",
      "session.list",
    ]),
    input: z.unknown(),
  })
  .strict();
export type GatewayEnvelope = z.infer<typeof envelopeSchema>;
const encoder = new TextEncoder();
async function key(secret: string, usage: KeyUsage[]) {
  if (secret.length < 32) throw new Error("Gateway is not configured.");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage,
  );
}
export async function signEnvelope(body: string, secret: string) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await key(secret, ["sign"]),
    encoder.encode(body),
  );
  return Array.from(new Uint8Array(signature), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function verifyEnvelope(
  body: string,
  signature: string,
  secret: string,
  now = Date.now(),
): Promise<GatewayEnvelope> {
  if (body.length > 65536 || !/^[a-f0-9]{64}$/.test(signature))
    throw new Error("Invalid request.");
  const bytes = Uint8Array.from(signature.match(/../g)!, (x) =>
    parseInt(x, 16),
  );
  if (
    !(await crypto.subtle.verify(
      "HMAC",
      await key(secret, ["verify"]),
      bytes,
      encoder.encode(body),
    ))
  )
    throw new Error("Invalid signature.");
  const envelope = envelopeSchema.parse(JSON.parse(body));
  if (Math.abs(now - envelope.issuedAt) > 60000)
    throw new Error("Request expired.");
  return envelope;
}
