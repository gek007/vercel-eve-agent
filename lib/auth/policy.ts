export type ProCaller = { userId: string; issuer: string };
export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'AccessError'; }
}
type Identity = { userId: string | null; has: (check: { plan: string }) => boolean } | null;
export function enforcePro(identity: Identity, issuer: string): ProCaller {
  if (!identity?.userId) throw new AccessError(401, 'Sign in to continue.');
  if (!identity.has({ plan: 'pro' })) throw new AccessError(403, 'A Pro subscription is required.');
  return { userId: identity.userId, issuer };
}
export function requireAuthConfig(env: Record<string, string | undefined> = process.env) {
  const publishableKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? env.CLERK_PUBLISHABLE_KEY;
  if (!publishableKey || !env.CLERK_SECRET_KEY || !env.APP_URL || !env.CLERK_ISSUER_URL)
    throw new AccessError(503, 'Authentication setup is incomplete. Configure Clerk and APP_URL.');
  const origin = new URL(env.APP_URL);
  if (origin.origin !== env.APP_URL || (env.NODE_ENV === 'production' && origin.protocol !== 'https:' && origin.hostname !== 'localhost'))
    throw new AccessError(503, 'APP_URL must be a trusted application origin.');
  return { publishableKey, secretKey: env.CLERK_SECRET_KEY, issuer: env.CLERK_ISSUER_URL, origin: origin.origin };
}
export function errorResponse(error: unknown) {
  if (error instanceof AccessError) return Response.json({ error: error.message }, { status: error.status });
  return Response.json({ error: 'The service is unavailable. Please try again.' }, { status: 503 });
}
