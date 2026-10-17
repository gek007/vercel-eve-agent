import type { SessionContext } from "eve/context";
import type { ProCaller } from "../../lib/auth/policy";
export function requireToolCaller(ctx: SessionContext): ProCaller {
  const current = ctx.session.auth.current;
  const initiator = ctx.session.auth.initiator;
  if (
    !current ||
    current.authenticator !== "clerk" ||
    current.principalType !== "user" ||
    current.attributes?.plan !== "pro" ||
    !current.issuer ||
    current.principalId !== initiator?.principalId ||
    current.issuer !== initiator?.issuer
  )
    throw new Error("Authenticated Pro session ownership required.");
  return { userId: current.principalId, issuer: current.issuer };
}
