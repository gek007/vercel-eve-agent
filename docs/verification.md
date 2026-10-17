# Implementation verification

Date: 2026-10-17. Scope: development/test services and a protected Vercel preview.

## Observed checks

- 40 Vitest tests passed, covering Pro access, signed gateway envelopes,
  strict business filters, fixture arithmetic, seed resumption, ownership,
  provider selection, and encoded session paths.
- TypeScript and ESLint checks passed.
- Next.js production build and Eve compilation passed.
- A real Playwright chat regression passed: first tool-backed answer, new
  conversation with a distinct session, second answer, and transcript replay.
- Real Clerk development sign-in and USD 20/month test checkout succeeded.
- A free test account received 403 from business data and Eve creation APIs.
- After test checkout, a second Pro account received 403 for another member's
  message, replay, cancel, compact, clear, and reset operations; a copied chat
  page returned 404.
- Encoded static paths were denied at the live local HTTP boundary (403 or 404).
- The cloud seed was run twice; counts remained 250 customers, 40 products,
  2,000 orders, and 6,000 items.
- The direct OpenAI request succeeded. A live Eve answer used the revenue tool
  and returned $2,098,181.31 and 1,641 completed orders for January–September 2026. Reload restored that answer.
- Desktop and mobile pages were visually inspected.

The final protected preview was verified through the deployed browser: landing,
Clerk sign-in, Pro dashboard, a completed OpenAI/Convex answer, and transcript
replay. Its URL is https://vercel-eve-agent-76v2tjcte-gek007s-projects.vercel.app.
Unauthenticated business and Eve creation requests returned 401. Superseded test
previews were removed after the corrected preview was ready.

## Review and decisions

A separate reviewer inspected the implementation read-only. Its concrete P1
finding was a URL-normalization ownership bypass: the router accepted encoded
static path segments that a raw URL regex missed. The fix uses the router's
matched session ID, requires it on all session route templates, and fails closed.
Four new tests were observed failing before the fix and passing afterward.

A browser regression confirmed that client navigation back to the sessionless
chat could retain the first session's React store. New-conversation links now
intentionally perform a full document navigation. The regression passed after
that fix; the tradeoff is one full reload when starting a conversation.

Other implementation decisions:

- A managed feature worktree isolates source changes from the original checkout.
- Local Convex supported independent work while the user completed cloud login;
  the active app now uses the cloud development deployment.
- OpenAI is called directly with the user's supplied key rather than through
  AI Gateway, at the user's request. This uses the OpenAI provider's billing.
- The first Vercel build was cancelled because new projects force their first
  deployment to production. All subsequent app deployments target Preview.
- `vercel.json` explicitly declares Next.js: the manually created project's
  generic build otherwise published Eve services without the web functions.
- Secrets are ignored locally and marked sensitive on Vercel. Test browser
  state, passwords, provider keys, and bypass cookies are not committed.

No production Clerk instance, payment activation, or production Convex dataset
was configured. Preview deployment protection remains enabled.
