import { expect, it, vi, beforeEach } from "vitest";
const auth = vi.hoisted(() => ({ requireAuthenticatedRequest: vi.fn() }));
const data = vi.hoisted(() => ({ queryShop: vi.fn(), mutateShop: vi.fn() }));
vi.mock("../lib/auth/clerk", () => auth);
vi.mock("../lib/shop/client", () => data);
import { GET, POST } from "../app/api/shop/route";
import { AccessError } from "../lib/auth/policy";
beforeEach(() => {
  vi.resetAllMocks();
  auth.requireAuthenticatedRequest.mockResolvedValue({
    userId: "free",
    issuer: "issuer",
  });
});
it("denies missing identity and untrusted origin before shop access", async () => {
  for (const status of [401, 403]) {
    auth.requireAuthenticatedRequest.mockRejectedValue(
      new AccessError(status, "Denied"),
    );
    expect(
      (
        await POST(
          new Request("http://localhost/api/shop", {
            method: "POST",
            body: "{}",
          }),
        )
      ).status,
    ).toBe(status);
    expect(data.mutateShop).not.toHaveBeenCalled();
  }
});
it("allows a free shopper and rejects browser-supplied owner IDs", async () => {
  data.queryShop.mockResolvedValue({ kind: "cart", lines: [], quantity: 0 });
  expect(
    (await GET(new Request("http://localhost/api/shop?operation=cart"))).status,
  ).toBe(200);
  expect(data.queryShop).toHaveBeenCalledWith(
    { userId: "free", issuer: "issuer" },
    { operation: "cart" },
  );
  expect(
    (
      await POST(
        new Request("http://localhost/api/shop", {
          method: "POST",
          body: JSON.stringify({
            operation: "cart.set",
            productId: "p",
            quantity: 1,
            operationId: "x",
            ownerId: "victim",
          }),
        }),
      )
    ).status,
  ).toBe(400);
});
it("preserves checkout conflicts and rejects malformed JSON", async () => {
  data.mutateShop.mockRejectedValue(new AccessError(409, "Cart changed"));
  const request = {
    operation: "checkout",
    checkoutKey: "x",
    revision: 1,
    expectedTotalCents: 100,
  };
  expect(
    (
      await POST(
        new Request("http://localhost/api/shop", {
          method: "POST",
          body: JSON.stringify(request),
        }),
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await POST(
        new Request("http://localhost/api/shop", { method: "POST", body: "{" }),
      )
    ).status,
  ).toBe(400);
});
