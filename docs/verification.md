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

## Shopping conversion — 2026-10-17

Implemented on `feat/shopping-app` in the attached worktree. Local verification
URL: http://localhost:3001. This does not replace the old Vercel Ledger preview.

- 51 Vitest tests pass (13 files), including new shopper access, catalog/order
  seeding, ownership, cart receipts, atomic checkout/retry, stale revisions,
  changed prices, inactive items, API validation, and Scout capabilities.
- TypeScript, ESLint, and standalone Eve compilation pass.
- Real Clerk Pro browser shopping test passes: add, quantity update, reload,
  lost checkout response, retry, exactly one order, saved details, empty cart.
- Real OpenAI Scout browser test passes: catalog lookup, explicitly requested
  cart edit, database verification, fresh conversation, and persisted replay.
- A newly created Clerk free test user can open Shop/Billing and access its cart
  (200), cannot invoke Eve (403), and cannot read a Pro user's order (404).
  Signed-out shopping API access returns 401; free Agent page redirects to pricing.
- Development cloud seed run twice yields exactly 40 products and 24 historical
  orders for the seeded account. Subsequent verification purchases add orders as
  expected. Existing analytics records remain preserved.
- Desktop and 390px mobile screenshots inspected for Shop, Cart, Orders,
  Overview, Billing, and Agent. Shop/Cart/Agent have no page-level horizontal
  overflow. All six mobile destinations remain reachable.
- Clerk Pro description updated for Scout; price remains USD 20/month, B2C only,
  development/test payments. No real product checkout or fulfillment exists.

Next.js production build passed with all shopping routes compiled. Independent
final review found no Critical issues and two Important client recovery issues.
Both were reproduced with failing browser tests and fixed: cross-tab recovery
keys are isolated in sessionStorage, and storage exceptions no longer leave
checkout stuck. Both regression tests pass. Browser states and generated test-user credentials
are ignored.


### Review decisions and remaining limits

- Catalog deletion recovery is not provided because no deletion workflow exists;
  inactive-product checkout handling is tested. Future deletion needs a cart repair path.
- Reads remain bounded to 200 catalog records and 1,000 personal orders for this
  seeded demo. A larger deployment needs backend pagination to avoid truncated totals.
- Checkout reviews aggregate expectedTotalCents. Offsetting unit-price changes
  at the same total are not separately rejected; a stricter line-price review
  contract would be needed if the catalog becomes a live commerce system.
- Production deployment, payment processing, and fulfillment are excluded and
  unverified; a production launch needs separate setup and verification.
- Deferred minor: the HTTP GET catalog endpoint does not coerce maxPriceCents
  from query text, so that optional HTTP filter returns 400. Scout's direct budget
  search works; no browser budget input is exposed. Text/category/sort UI works.

Real browser checkout regressions also cover a stale second tab deleting another
attempt's key and browser storage quota failure. Each failed before its fix and
passed afterward. No additional reviewer pass was used.

Final verification after fixes: 51/51 unit tests, all four real Pro browser tests,
TypeScript, ESLint, and the final Next.js production build pass. The free-user
shopping browser journey also passed separately. Standalone Eve build passed.
The native final reviewer reported no Critical findings; both Important findings
were fixed in commit `58507db`. The deferred minor and four scope rulings are
listed above. Source is on `feat/shopping-app`; no public deployment or merge has
been performed for the shopping conversion.
