import { createClerkClient } from "@clerk/backend";
import { AccessError, enforceAuthenticated, enforcePro, requireAuthConfig } from "./policy";
async function requestIdentity(request: Request) {
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
  return {identity, issuer: config.issuer};
}

export async function requireAuthenticatedRequest(request: Request) {
 const {identity, issuer} = await requestIdentity(request);
 return enforceAuthenticated(identity, issuer);
}
export async function requireProRequest(request: Request) {
 const {identity, issuer} = await requestIdentity(request);
 return enforcePro(identity, issuer);
}
