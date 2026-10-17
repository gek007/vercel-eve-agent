import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
const owned = { ownerId: v.string(), fixtureKey: v.string() };
export default defineSchema({
  customers: defineTable({ ...owned, name: v.string(), email: v.string(), company: v.string(), region: v.string(), createdAt: v.number() }).index('by_owner', ['ownerId']).index('by_fixture', ['ownerId','fixtureKey']),
  products: defineTable({ ...owned, name: v.string(), category: v.string(), priceCents: v.number() }).index('by_owner', ['ownerId']).index('by_fixture', ['ownerId','fixtureKey']),
  orders: defineTable({ ...owned, customerId: v.string(), createdAt: v.number(), status: v.union(v.literal('completed'),v.literal('pending'),v.literal('cancelled')), totalCents: v.number() }).index('by_owner_date', ['ownerId','createdAt']).index('by_fixture', ['ownerId','fixtureKey']),
  orderItems: defineTable({ ...owned, orderId: v.string(), productId: v.string(), quantity: v.number(), unitPriceCents: v.number() }).index('by_owner', ['ownerId']).index('by_fixture', ['ownerId','fixtureKey']),
  seedProgress: defineTable({ ownerId: v.string(), version: v.number(), cursor: v.number(), complete: v.boolean() }).index('by_owner', ['ownerId']),
  conversations: defineTable({ ownerId: v.string(), sessionId: v.string(), title: v.string(), createdAt: v.number() }).index('by_session', ['sessionId']).index('by_owner', ['ownerId','createdAt']),
});
