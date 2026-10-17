/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "../convex/schema";
import { internal } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
it("atomically checks out once, snapshots prices, and protects revisions and owners", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.shopSeed.seed, { ownerId: "alice" });
  const p = await t.run(
    async (ctx) => (await ctx.db.query("shopProducts").first())!,
  );
  const write = (ownerId: string, input: unknown) =>
    t.mutation(internal.shopping.write, { ownerId, input });
  const cart = await write("alice", {
    operation: "cart.add",
    productId: p._id,
    quantity: 2,
    operationId: "add",
  });
  if (cart.kind !== "cart") throw Error("cart");
  const request = {
    operation: "checkout",
    checkoutKey: "check",
    revision: cart.revision,
    expectedTotalCents: cart.totalCents,
  };
  const order = await write("alice", request);
  expect(order.kind).toBe("checkout");
  expect(await write("alice", request)).toEqual(order);
  await expect(
    write("alice", { ...request, checkoutKey: "different" }),
  ).rejects.toThrow();
  await expect(write("bob", request)).rejects.toThrow();
  expect(
    await t.query(internal.shopping.read, {
      ownerId: "alice",
      input: { operation: "cart" },
    }),
  ).toMatchObject({ quantity: 0 });
  const all = await t.query(internal.shopping.read, {
    ownerId: "alice",
    input: { operation: "orders", limit: 40 },
  });
  expect(all).toMatchObject({ total: 25 });
  await t.run((ctx) => ctx.db.patch(p._id, { priceCents: 1 }));
  if (order.kind === "checkout") {
    const detail = await t.query(internal.shopping.read, {
      ownerId: "alice",
      input: { operation: "order", orderId: order.orderId },
    });
    expect(detail).toMatchObject({
      order: { totalCents: p.priceCents * 2 },
      lines: [{ unitPriceCents: p.priceCents }],
    });
  }
});
it("rejects changed carts, changed prices, inactive items, and empty checkout without partial orders", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.shopSeed.seed, { ownerId: "alice" });
  const p = await t.run(
    async (ctx) => (await ctx.db.query("shopProducts").first())!,
  );
  const write = (input: unknown) =>
    t.mutation(internal.shopping.write, { ownerId: "alice", input });
  await expect(
    write({
      operation: "checkout",
      checkoutKey: "empty",
      revision: 0,
      expectedTotalCents: 0,
    }),
  ).rejects.toThrow("empty");
  const cart = await write({
    operation: "cart.add",
    productId: p._id,
    quantity: 1,
    operationId: "a",
  });
  if (cart.kind !== "cart") throw Error("cart");
  const req = {
    operation: "checkout",
    checkoutKey: "x",
    revision: cart.revision,
    expectedTotalCents: cart.totalCents,
  };
  await t.run((ctx) => ctx.db.patch(p._id, { priceCents: p.priceCents + 1 }));
  await expect(write(req)).rejects.toThrow("changed");
  await t.run((ctx) =>
    ctx.db.patch(p._id, { priceCents: p.priceCents, active: false }),
  );
  await expect(write(req)).rejects.toThrow("available");
  await t.run((ctx) => ctx.db.patch(p._id, { active: true }));
  await write({
    operation: "cart.set",
    productId: p._id,
    quantity: 2,
    operationId: "b",
  });
  await expect(write(req)).rejects.toThrow("changed");
  expect(
    await t.query(internal.shopping.read, {
      ownerId: "alice",
      input: { operation: "cart" },
    }),
  ).toMatchObject({ quantity: 2 });
  expect(
    await t.query(internal.shopping.read, {
      ownerId: "alice",
      input: { operation: "orders" },
    }),
  ).toMatchObject({ total: 24 });
});
