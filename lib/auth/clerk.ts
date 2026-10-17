import { createClerkClient } from "@clerk/backend";
import { AccessError, enforcePro, requireAuthConfig } from "./policy";
export async function requireProRequest(request: Request) {
  const config = requireAuthConfig();
  const origin = request.headers.get("origin");
  if (origin && !config.trustedOrigins.includes(origin))
    throw new AccessError(403, "Untrusted request origin.");
  const client = createClerkClient({
    secretKey: config.secretKey,
    publishableKey: config.publishableKey,
  });
  const state = await client.authenticateRequest(request, {
    authorizedParties: config.trustedOrigins,
    acceptsToken: "session_token",
  });
  const identity = state.toAuth();
  return enforcePro(identity, config.issuer);
}
