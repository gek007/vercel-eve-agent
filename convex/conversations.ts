import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
export const claim = internalMutation({ args: { ownerId: v.string(), sessionId: v.string(), title: v.string() }, handler: async (ctx, args) => {
  const existing = await ctx.db.query('conversations').withIndex('by_session', q => q.eq('sessionId', args.sessionId)).unique();
  if (existing && existing.ownerId !== args.ownerId) throw new Error('Forbidden');
  if (!existing) await ctx.db.insert('conversations', { ...args, title: args.title.slice(0,100), createdAt: Date.now() });
  return { ok: true };
} });
export const assertOwner = internalQuery({ args: { ownerId: v.string(), sessionId: v.string() }, handler: async (ctx, args) => {
  const row = await ctx.db.query('conversations').withIndex('by_session', q => q.eq('sessionId', args.sessionId)).unique();
  return !!row && row.ownerId === args.ownerId;
} });
export const list = internalQuery({ args: { ownerId: v.string() }, handler: async (ctx, args) => {
  const rows = await ctx.db.query('conversations').withIndex('by_owner', q => q.eq('ownerId', args.ownerId)).order('desc').take(50);
  return rows.map(({ sessionId, title, createdAt }) => ({ sessionId, title, createdAt }));
} });
