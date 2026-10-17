import { eveChannel } from "eve/channels/eve";
import { requireProRequest } from "../../lib/auth/clerk";
import { assertSessionOwner, claimSession } from "../../lib/data/client";
import { allowedEveRoute, guardEveRoute } from "../lib/session-ownership";
const channel = eveChannel({
  auth: async (request) => {
    const caller = await requireProRequest(request);
    return {
      authenticator: "clerk",
      issuer: caller.issuer,
      principalId: caller.userId,
      principalType: "user" as const,
      attributes: { plan: "pro" },
    };
  },
  uploadPolicy: "disabled",
  cors: false,
});
const protectedChannel: typeof channel = {
  ...channel,
  routes: channel.routes
    .filter((route) => allowedEveRoute(route.path))
    .map((route) =>
      route.transport === "websocket"
        ? route
        : {
            ...route,
            handler: guardEveRoute(route.path, route.handler, {
              authenticate: requireProRequest,
              assertOwner: assertSessionOwner,
              claim: claimSession,
            }),
          },
    ),
};

export default protectedChannel;
