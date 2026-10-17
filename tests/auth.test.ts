import { describe, expect, it } from 'vitest';
import { AccessError, enforcePro, requireAuthConfig } from '../lib/auth/policy';
describe('Pro authorization', () => {
  it.each([null, { userId: null, has: () => false }])('rejects missing or expired identity', (identity) => {
    expect(() => enforcePro(identity, 'issuer')).toThrowError(expect.objectContaining({ status: 401 }));
  });
  it('denies signed-in free users', () => {
    expect(() => enforcePro({ userId: 'alice', has: () => false }, 'issuer')).toThrowError(expect.objectContaining({ status: 403 }));
  });
  it('returns only the verified Pro identity', () => {
    expect(enforcePro({ userId: 'alice', has: ({ plan }) => plan === 'pro' }, 'issuer')).toEqual({ userId: 'alice', issuer: 'issuer' });
  });
  it('checks again after entitlement loss', () => {
    let paid = true;
    const identity = { userId: 'alice', has: () => paid };
    enforcePro(identity, 'issuer'); paid = false;
    expect(() => enforcePro(identity, 'issuer')).toThrow(AccessError);
  });
  it('fails closed on missing config or insecure production origin', () => {
    expect(() => requireAuthConfig({})).toThrowError(expect.objectContaining({ status: 503 }));
    expect(() => requireAuthConfig({ NODE_ENV: 'production', APP_URL: 'http://example.com', CLERK_SECRET_KEY: 'x', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'x', CLERK_ISSUER_URL: 'https://issuer' })).toThrow(AccessError);
  });
});
