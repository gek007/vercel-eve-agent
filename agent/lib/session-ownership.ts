import {
  AccessError,
  errorResponse,
  type ProCaller,
} from "../../lib/auth/policy";
type Dependencies = {
  authenticate: (request: Request) => Promise<ProCaller>;
  assertOwner: (caller: ProCaller, sessionId: string) => Promise<unknown>;
  claim: (
    caller: ProCaller,
    sessionId: string,
    title: string,
  ) => Promise<unknown>;
};
export function allowedEveRoute(path: string) {
  return /^\/eve\/v1\/(health|info|session(?:\/:sessionId(?:\/(?:stream|cancel|compact|clear|reset))?)?)$/.test(
    path,
  );
}
export function guardEveRoute<T>(
  path: string,
  handler: (request: Request, args: T) => Response | Promise<Response>,
  deps: Dependencies,
) {
  return async (request: Request, args: T): Promise<Response> => {
    if (path === "/eve/v1/health") return handler(request, args);
    try {
      const caller = await deps.authenticate(request);
      const url = new URL(request.url);
      const match = url.pathname.match(/\/eve\/v1\/session\/([^/]+)(?:\/|$)/);
      if (match) await deps.assertOwner(caller, decodeURIComponent(match[1]));
      let title = "New conversation";
      if (request.method === "POST") {
        const raw = await request.clone().text();
        if (raw.length > 32768)
          return Response.json(
            { error: "Message is too large." },
            { status: 413 },
          );
        if (raw) {
          let body: Record<string, unknown>;
          try {
            body = JSON.parse(raw);
          } catch {
            return Response.json({ error: "Invalid JSON." }, { status: 400 });
          }
          if (!body || typeof body !== "object" || Array.isArray(body))
            return Response.json(
              { error: "Invalid request." },
              { status: 400 },
            );
          if (
            [
              "callback",
              "legacyRemoteAgentCaller",
              "forwardedPrincipal",
              "stubs",
              "continuationToken",
            ].some((k) => k in body)
          )
            return Response.json(
              { error: "Unsupported request option." },
              { status: 400 },
            );
          if (typeof body.message === "string")
            title = body.message.slice(0, 100);
        }
      }
      const response = await handler(request, args);
      if (
        path === "/eve/v1/session" &&
        request.method === "POST" &&
        response.ok
      ) {
        const data: unknown = await response.clone().json();
        if (
          !data ||
          typeof data !== "object" ||
          !("sessionId" in data) ||
          typeof data.sessionId !== "string"
        )
          throw new AccessError(503, "Session could not be initialized.");
        await deps.claim(caller, data.sessionId, title);
      }
      return response;
    } catch (error) {
      return errorResponse(error);
    }
  };
}
