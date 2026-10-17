import {
  internalMutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateFixtures } from "../lib/demo/fixtures";
import type {
  Customer,
  Product,
  Order,
  OrderItem,
} from "../lib/data/contracts";
type Row =
  | { table: "customers"; data: Customer }
  | { table: "products"; data: Product }
  | { table: "orders"; data: Order }
  | { table: "orderItems"; data: OrderItem };
type Progress = { nextCursor: number; complete: boolean };
export const batch = internalMutation({
  args: { ownerId: v.string(), version: v.number(), cursor: v.number() },
  handler: async (ctx, { ownerId, version, cursor }): Promise<Progress> => {
    if (
      version !== 1 ||
      (!ownerId.startsWith("user_") && ownerId !== "alice" && ownerId !== "bob")
    )
      throw new Error("Use a Clerk user ID and seed version 1.");
    const progress = await ctx.db
      .query("seedProgress")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .unique();
    if (progress && progress.version !== version)
      throw new Error("Seed version mismatch.");
    if (progress?.complete)
      return { nextCursor: progress.cursor, complete: true };
    const start = progress?.cursor ?? 0;
    if (cursor > start) throw new Error("Seed cursor cannot skip records.");
    const f = generateFixtures();
    const rows: Row[] = [
      ...f.customers.map((data) => ({ table: "customers" as const, data })),
      ...f.products.map((data) => ({ table: "products" as const, data })),
      ...f.orders.map((data) => ({ table: "orders" as const, data })),
      ...f.items.map((data) => ({ table: "orderItems" as const, data })),
    ];
    const end = Math.min(start + 100, rows.length);
    for (const row of rows.slice(start, end)) {
      const existing = await ctx.db
        .query(row.table)
        .withIndex("by_fixture", (q) =>
          q.eq("ownerId", ownerId).eq("fixtureKey", row.data.fixtureKey),
        )
        .unique();
      if (existing) continue;
      if (row.table === "orders") {
        const customer = await ctx.db
          .query("customers")
          .withIndex("by_fixture", (q) =>
            q.eq("ownerId", ownerId).eq("fixtureKey", row.data.customerId),
          )
          .unique();
        if (!customer) throw new Error("Missing owned customer.");
        await ctx.db.insert("orders", { ownerId, ...row.data });
      } else if (row.table === "orderItems") {
        const order = await ctx.db
          .query("orders")
          .withIndex("by_fixture", (q) =>
            q.eq("ownerId", ownerId).eq("fixtureKey", row.data.orderId),
          )
          .unique();
        const product = await ctx.db
          .query("products")
          .withIndex("by_fixture", (q) =>
            q.eq("ownerId", ownerId).eq("fixtureKey", row.data.productId),
          )
          .unique();
        if (!order || !product)
          throw new Error("Missing owned order or product.");
        await ctx.db.insert("orderItems", { ownerId, ...row.data });
      } else if (row.table === "customers")
        await ctx.db.insert("customers", { ownerId, ...row.data });
      else await ctx.db.insert("products", { ownerId, ...row.data });
    }
    const state = {
      ownerId,
      version,
      cursor: end,
      complete: end === rows.length,
    };
    if (progress) await ctx.db.patch(progress._id, state);
    else await ctx.db.insert("seedProgress", state);
    return { nextCursor: end, complete: state.complete };
  },
});
export const run = internalAction({
  args: { ownerId: v.string(), version: v.number() },
  handler: async (ctx, args): Promise<Progress> => {
    let result: Progress = { nextCursor: 0, complete: false };
    while (!result.complete)
      result = await ctx.runMutation(internal.seed.batch, {
        ...args,
        cursor: result.nextCursor,
      });
    return result;
  },
});
export const counts = internalQuery({
  args: { ownerId: v.string() },
  handler: async (ctx, { ownerId }) => ({
    customers: (
      await ctx.db
        .query("customers")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect()
    ).length,
    products: (
      await ctx.db
        .query("products")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect()
    ).length,
    orders: (
      await ctx.db
        .query("orders")
        .withIndex("by_owner_date", (q) => q.eq("ownerId", ownerId))
        .collect()
    ).length,
    orderItems: (
      await ctx.db
        .query("orderItems")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect()
    ).length,
  }),
});
