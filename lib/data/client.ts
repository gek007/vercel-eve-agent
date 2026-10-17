import type { ProCaller } from '../auth/policy';
import { AccessError } from '../auth/policy';
import { signEnvelope, type GatewayEnvelope } from '../security/gateway-signature';
import { businessSchema, type BusinessRequest, type BusinessResult, type Conversation } from './contracts';
async function gateway<T>(caller: ProCaller, operation: GatewayEnvelope['operation'], input: unknown): Promise<T> {
  const url = process.env.CONVEX_SITE_URL; const secret = process.env.DATA_GATEWAY_SECRET;
  if (!url || !secret) throw new AccessError(503, 'The business database is not connected yet.');
  const body = JSON.stringify({ version: 1, ownerId: caller.userId, issuedAt: Date.now(), operation, input });
  const response = await fetch(`${url.replace(/\/$/, '')}/private/data`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ledger-signature': await signEnvelope(body, secret) }, body, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new AccessError(response.status === 403 ? 403 : 503, response.status === 403 ? 'This conversation is not available to your account.' : 'The database could not complete this request.');
  return response.json() as Promise<T>;
}
export function queryBusiness(caller: ProCaller, input: BusinessRequest): Promise<BusinessResult> { return gateway(caller, 'business', businessSchema.parse(input)); }
export const claimSession = (caller: ProCaller, sessionId: string, title: string) => gateway(caller, 'session.claim', { sessionId, title });
export const assertSessionOwner = (caller: ProCaller, sessionId: string) => gateway(caller, 'session.assert', { sessionId });
export const listConversations = (caller: ProCaller) => gateway<Conversation[]>(caller, 'session.list', {});
