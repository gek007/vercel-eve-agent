import { expect, it, vi } from "vitest";
const data = vi.hoisted(() => ({ mutateShop: vi.fn(), queryShop: vi.fn() }));
vi.mock("../lib/shop/client", () => data);
import tool from "../agent/tools/update_cart";
import { requireToolCaller } from "../agent/lib/caller";
import { readFileSync, readdirSync } from "node:fs";
const principal = {
  authenticator: "clerk",
  principalType: "user",
  principalId: "alice",
  issuer: "issuer",
  attributes: { plan: "pro" },
};
it("scopes cart edits to verified Pro caller and derives replay key from runtime", async () => {
  const execute = tool.execute!;
  const ctx = {
    session: {
      id: "session",
      auth: { current: principal, initiator: principal },
    },
    callId: "call-1",
  } as unknown as Parameters<typeof execute>[1];
  data.mutateShop.mockResolvedValue({ kind: "cart", quantity: 1 });
  await execute({ action: "add", productId: "product", quantity: 1 }, ctx);
  expect(data.mutateShop).toHaveBeenCalledWith(
    { userId: "alice", issuer: "issuer" },
    {
      operation: "cart.add",
      productId: "product",
      quantity: 1,
      operationId: "session:call-1",
    },
  );
  const noAuth = {
    session: { auth: { current: null, initiator: null } },
  } as unknown as Parameters<typeof requireToolCaller>[0];
  expect(() => requireToolCaller(noAuth)).toThrow();
  const free = {
    session: {
      auth: {
        current: { ...principal, attributes: { plan: "free" } },
        initiator: principal,
      },
    },
  } as unknown as Parameters<typeof requireToolCaller>[0];
  expect(() => requireToolCaller(free)).toThrow();
});
it("exposes shopping tools without checkout, billing writes, or analytics capabilities", () => {
  expect(
    readdirSync("agent/tools")
      .filter((f) => f.endsWith(".ts"))
      .sort(),
  ).toEqual([
    "account_overview.ts",
    "inspect_orders.ts",
    "search_products.ts",
    "update_cart.ts",
    "view_cart.ts",
  ]);
  expect(readFileSync("agent/instructions.md", "utf8")).toContain("Scout");
});
