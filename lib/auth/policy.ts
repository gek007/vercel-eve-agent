export type AuthenticatedCaller = { userId: string; issuer: string };
export type ProCaller = AuthenticatedCaller;
export class AccessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AccessError";
  }
}
type Identity = {
  userId: string | null;
  has: (check: { plan: string }) => boolean;
} | null;
export function enforceAuthenticated(
  identity: Identity,
  issuer: string,
): AuthenticatedCaller {
  if (!identity?.userId) throw new AccessError(401, "Sign in to continue.");
  return { userId: identity.userId, issuer };
}
export function enforcePro(identity: Identity, issuer: string): ProCaller {
  const caller = enforceAuthenticated(identity, issuer);
  if (!identity!.has({ plan: "pro" }))
    throw new AccessError(403, "A Pro subscription is required.");
  return caller;
}
export function requireAuthConfig(
  env: Record<string, string | undefined> = process.env,
) {
  const publishableKey =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? env.CLERK_PUBLISHABLE_KEY;
  if (
    !publishableKey ||
    !env.CLERK_SECRET_KEY ||
    !env.APP_URL ||
    !env.CLERK_ISSUER_URL
  )
    throw new AccessError(
      503,
      "Authentication setup is incomplete. Configure Clerk and APP_URL.",
    );
  const origin = new URL(env.APP_URL);
  if (
    origin.origin !== env.APP_URL ||
    (env.NODE_ENV === "production" &&
      origin.protocol !== "https:" &&
      origin.hostname !== "localhost")
  )
    throw new AccessError(503, "APP_URL must be a trusted application origin.");
  const trustedOrigins = [origin.origin];
  if (env.VERCEL === "1")
    for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
      if (host && /^[a-zA-Z0-9.-]+\.vercel\.app$/.test(host))
        trustedOrigins.push(`https://${host}`);
    }
  return {
    publishableKey,
    secretKey: env.CLERK_SECRET_KEY,
    issuer: env.CLERK_ISSUER_URL,
    origin: origin.origin,
    trustedOrigins: [...new Set(trustedOrigins)],
  };
}
export function errorResponse(error: unknown) {
  if (error instanceof AccessError)
    return Response.json({ error: error.message }, { status: error.status });
  return Response.json(
    { error: "The service is unavailable. Please try again." },
    { status: 503 },
  );
}
