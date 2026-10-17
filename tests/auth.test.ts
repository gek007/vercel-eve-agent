import { describe, expect, it } from "vitest";
import { AccessError, enforcePro, requireAuthConfig } from "../lib/auth/policy";
describe("Pro authorization", () => {
  it.each([null, { userId: null, has: () => false }])(
    "rejects missing or expired identity",
    (identity) => {
      expect(() => enforcePro(identity, "issuer")).toThrowError(
        expect.objectContaining({ status: 401 }),
      );
    },
  );
  it("denies signed-in free users", () => {
    expect(() =>
      enforcePro({ userId: "alice", has: () => false }, "issuer"),
    ).toThrowError(expect.objectContaining({ status: 403 }));
  });
  it("returns only the verified Pro identity", () => {
    expect(
      enforcePro(
        { userId: "alice", has: ({ plan }) => plan === "pro" },
        "issuer",
      ),
    ).toEqual({ userId: "alice", issuer: "issuer" });
  });
  it("checks again after entitlement loss", () => {
    let paid = true;
    const identity = { userId: "alice", has: () => paid };
    enforcePro(identity, "issuer");
    paid = false;
    expect(() => enforcePro(identity, "issuer")).toThrow(AccessError);
  });
  it("fails closed on missing config or insecure production origin", () => {
    expect(() => requireAuthConfig({})).toThrowError(
      expect.objectContaining({ status: 503 }),
    );
    expect(() =>
      requireAuthConfig({
        NODE_ENV: "production",
        APP_URL: "http://example.com",
        CLERK_SECRET_KEY: "x",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "x",
        CLERK_ISSUER_URL: "https://issuer",
      }),
    ).toThrow(AccessError);
  });
});
it("trusts only configured and platform-provided deployment origins", () => {
  const config = requireAuthConfig({
    NODE_ENV: "production",
    APP_URL: "https://ledger.example",
    CLERK_SECRET_KEY: "x",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "x",
    CLERK_ISSUER_URL: "https://issuer",
    VERCEL: "1",
    VERCEL_URL: "preview.vercel.app",
  });
  expect(config.trustedOrigins).toEqual([
    "https://ledger.example",
    "https://preview.vercel.app",
  ]);
});
it("allows a verified free shopper without granting Pro", async () => {
  const { enforceAuthenticated } = await import("../lib/auth/policy");
  expect(
    enforceAuthenticated({ userId: "free", has: () => false }, "issuer"),
  ).toEqual({ userId: "free", issuer: "issuer" });
  expect(() => enforceAuthenticated(null, "issuer")).toThrowError(
    expect.objectContaining({ status: 401 }),
  );
});
