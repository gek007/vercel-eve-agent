import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { z } from "zod";
import { verifyEnvelope } from "../lib/security/gateway-signature";
import { businessSchema } from "../lib/data/contracts";
const sessionInput = z
  .object({ sessionId: z.string().min(1).max(200) })
  .strict();
const http = httpRouter();
http.route({
  path: "/private/data",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let envelope;
    try {
      envelope = await verifyEnvelope(
        await req.text(),
        req.headers.get("x-ledger-signature") ?? "",
        process.env.DATA_GATEWAY_SECRET ?? "",
      );
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { ownerId, operation, input } = envelope;
    try {
      switch (operation) {
        case "business":
          return Response.json(
            await ctx.runQuery(internal.business.read, {
              ownerId,
              input: businessSchema.parse(input),
            }),
          );
        case "session.claim": {
          const parsed = sessionInput
            .extend({ title: z.string().max(100) })
            .parse(input);
          return Response.json(
            await ctx.runMutation(internal.conversations.claim, {
              ownerId,
              ...parsed,
            }),
          );
        }
        case "session.assert": {
          const parsed = sessionInput.parse(input);
          const owned = await ctx.runQuery(internal.conversations.assertOwner, {
            ownerId,
            ...parsed,
          });
          return Response.json({ ok: owned }, { status: owned ? 200 : 403 });
        }
        case "session.list":
          z.object({}).strict().parse(input);
          return Response.json(
            await ctx.runQuery(internal.conversations.list, { ownerId }),
          );
      }
    } catch (error) {
      if (error instanceof z.ZodError)
        return Response.json({ error: "Invalid input" }, { status: 400 });
      return Response.json(
        { error: "Request could not be completed" },
        { status: 503 },
      );
    }
  }),
});
export default http;
