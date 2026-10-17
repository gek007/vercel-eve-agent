/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "../convex/schema";
import { internal } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
it("resumes an interrupted seed and repeating it does not duplicate records", async () => {
  const t = convexTest(schema, modules);
  const first = await t.mutation(internal.seed.batch, {
    ownerId: "alice",
    version: 1,
    cursor: 0,
  });
  expect(first.complete).toBe(false);
  let progress = await t.mutation(internal.seed.batch, {
    ownerId: "alice",
    version: 1,
    cursor: 0,
  });
  while (!progress.complete)
    progress = await t.mutation(internal.seed.batch, {
      ownerId: "alice",
      version: 1,
      cursor: progress.nextCursor,
    });
  const counts = () =>
    t.run(async (ctx) =>
      Promise.all(
        ["customers", "products", "orders", "orderItems"].map(
          async (name) =>
            (await ctx.db.query(name as "customers").collect()).length,
        ),
      ),
    );
  expect(await counts()).toEqual([250, 40, 2000, 6000]);
  await t.mutation(internal.seed.batch, {
    ownerId: "alice",
    version: 1,
    cursor: 0,
  });
  expect(await counts()).toEqual([250, 40, 2000, 6000]);
  const revenue = await t.query(internal.business.read, {
    ownerId: "alice",
    input: { operation: "revenue", groupBy: "month" },
  });
  expect(revenue).toMatchObject({ seeded: true });
  if (revenue.kind === "revenue")
    expect(revenue.groups.reduce((sum, g) => sum + g.revenueCents, 0)).toBe(
      revenue.revenueCents,
    );
  const products = await t.query(internal.business.read, {
    ownerId: "alice",
    input: { operation: "revenue", groupBy: "product" },
  });
  if (products.kind === "revenue" && revenue.kind === "revenue")
    expect(products.groups.reduce((sum, g) => sum + g.revenueCents, 0)).toBe(
      revenue.revenueCents,
    );
  expect(
    await t.query(internal.business.read, {
      ownerId: "bob",
      input: { operation: "orders", customerId: "CUS-0001" },
    }),
  ).toMatchObject({ total: 0, rows: [] });
}, 30000);
