import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
const owned = { ownerId: v.string(), fixtureKey: v.string() };
export default defineSchema({
  shopProducts: defineTable({
    sku: v.string(),
    name: v.string(),
    category: v.string(),
    description: v.string(),
    priceCents: v.number(),
    visual: v.string(),
    active: v.boolean(),
  }).index("by_sku", ["sku"]),
  shoppingCarts: defineTable({
    ownerId: v.string(),
    revision: v.number(),
  }).index("by_owner", ["ownerId"]),
  shoppingCartItems: defineTable({
    ownerId: v.string(),
    productId: v.id("shopProducts"),
    quantity: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_product", ["ownerId", "productId"]),
  shoppingOrders: defineTable({
    ownerId: v.string(),
    reference: v.string(),
    createdAt: v.number(),
    status: v.union(
      v.literal("completed"),
      v.literal("pending"),
      v.literal("cancelled"),
    ),
    currency: v.literal("USD"),
    totalCents: v.number(),
    source: v.union(v.literal("demo_seed"), v.literal("checkout")),
    checkoutKey: v.string(),
    cartRevision: v.number(),
  })
    .index("by_owner_date", ["ownerId", "createdAt"])
    .index("by_owner_checkout", ["ownerId", "checkoutKey"])
    .index("by_owner_revision", ["ownerId", "cartRevision"]),
  shoppingOrderItems: defineTable({
    ownerId: v.string(),
    orderId: v.id("shoppingOrders"),
    productId: v.id("shopProducts"),
    sku: v.string(),
    name: v.string(),
    quantity: v.number(),
    unitPriceCents: v.number(),
  }).index("by_owner_order", ["ownerId", "orderId"]),
  shoppingSeedProgress: defineTable({
    ownerId: v.string(),
    version: v.number(),
    complete: v.boolean(),
  }).index("by_owner", ["ownerId"]),
  shoppingOperations: defineTable({
    ownerId: v.string(),
    operationId: v.string(),
    fingerprint: v.string(),
  }).index("by_owner_operation", ["ownerId", "operationId"]),
  customers: defineTable({
    ...owned,
    name: v.string(),
    email: v.string(),
    company: v.string(),
    region: v.string(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_fixture", ["ownerId", "fixtureKey"]),
  products: defineTable({
    ...owned,
    name: v.string(),
    category: v.string(),
    priceCents: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_fixture", ["ownerId", "fixtureKey"]),
  orders: defineTable({
    ...owned,
    customerId: v.string(),
    createdAt: v.number(),
    status: v.union(
      v.literal("completed"),
      v.literal("pending"),
      v.literal("cancelled"),
    ),
    totalCents: v.number(),
  })
    .index("by_owner_date", ["ownerId", "createdAt"])
    .index("by_fixture", ["ownerId", "fixtureKey"]),
  orderItems: defineTable({
    ...owned,
    orderId: v.string(),
    productId: v.string(),
    quantity: v.number(),
    unitPriceCents: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_fixture", ["ownerId", "fixtureKey"]),
  seedProgress: defineTable({
    ownerId: v.string(),
    version: v.number(),
    cursor: v.number(),
    complete: v.boolean(),
  }).index("by_owner", ["ownerId"]),
  conversations: defineTable({
    ownerId: v.string(),
    sessionId: v.string(),
    title: v.string(),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_owner", ["ownerId", "createdAt"]),
});
