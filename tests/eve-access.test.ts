import { describe, expect, it, vi } from "vitest";
import { guardEveRoute, allowedEveRoute } from "../agent/lib/session-ownership";
import { AccessError } from "../lib/auth/policy";
const caller = { userId: "alice", issuer: "issuer" };
const dependencies = () => ({
  authenticate: vi.fn(async () => caller),
  assertOwner: vi.fn(async () => {}),
  claim: vi.fn(async () => {}),
});
describe("Eve session protection", () => {
  it.each(["", "/stream", "/cancel", "/compact", "/clear", "/reset"])(
    "checks ownership before %s",
    async (suffix) => {
      const deps = dependencies();
      deps.assertOwner.mockRejectedValue(new AccessError(403, "Forbidden"));
      const inner = vi.fn(async () => Response.json({ secret: "data" }));
      const path = "/eve/v1/session/:sessionId" + suffix;
      const guarded = guardEveRoute(path, inner, deps);
      const response = await guarded(
        new Request("http://localhost/eve/v1/session/stolen" + suffix, {
          method: suffix === "/stream" ? "GET" : "POST",
        }),
        {},
      );
      expect(response.status).toBe(403);
      expect(inner).not.toHaveBeenCalled();
    },
  );
  it.each([401, 403])(
    "rejects signed-out or free requests before create (%s)",
    async (status) => {
      const deps = dependencies();
      deps.authenticate.mockRejectedValue(new AccessError(status, "Denied"));
      const inner = vi.fn();
      expect(
        (
          await guardEveRoute(
            "/eve/v1/session",
            inner,
            deps,
          )(
            new Request("http://localhost/eve/v1/session", { method: "POST" }),
            {},
          )
        ).status,
      ).toBe(status);
      expect(inner).not.toHaveBeenCalled();
    },
  );
  it("claims accepted session before returning its ID", async () => {
    const deps = dependencies();
    const inner = vi.fn(async () =>
      Response.json({ sessionId: "new-session" }, { status: 202 }),
    );
    const result = await guardEveRoute(
      "/eve/v1/session",
      inner,
      deps,
    )(
      new Request("http://localhost/eve/v1/session", {
        method: "POST",
        body: JSON.stringify({ message: "Revenue?" }),
      }),
      {},
    );
    expect(result.status).toBe(202);
    expect(deps.claim).toHaveBeenCalledWith(caller, "new-session", "Revenue?");
  });
  it("does not expose an unclaimed session if persistence fails", async () => {
    const deps = dependencies();
    deps.claim.mockRejectedValue(new Error("offline"));
    const response = await guardEveRoute(
      "/eve/v1/session",
      async () => Response.json({ sessionId: "new-session" }, { status: 202 }),
      deps,
    )(new Request("http://localhost/eve/v1/session", { method: "POST" }), {});
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("new-session");
  });
  it("rejects callback exfiltration and hidden transport routes", async () => {
    const deps = dependencies();
    const inner = vi.fn();
    const response = await guardEveRoute(
      "/eve/v1/session",
      inner,
      deps,
    )(
      new Request("http://localhost/eve/v1/session", {
        method: "POST",
        body: JSON.stringify({ callback: { url: "https://attacker.example" } }),
      }),
      {},
    );
    expect(response.status).toBe(400);
    expect(inner).not.toHaveBeenCalled();
    expect(allowedEveRoute("/eve/v1/session/:sessionId/stream")).toBe(true);
    expect(allowedEveRoute("/eve/v1/callback/:token")).toBe(false);
    expect(allowedEveRoute("/eve/v1/session/:sessionId/stubs")).toBe(false);
  });
});
