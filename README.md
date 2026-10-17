# Circuit & Co.

A personal shopping demo built with Next.js, Convex, Clerk, and Vercel Eve.
Scout is the Pro shopping companion, using your direct OpenAI API key.

## Run locally

Use Node.js 24.x and npm in the checkout containing this README:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The development environment is already configured
in the attached implementation worktree. The temporary verification server uses
http://localhost:3001 with `APP_URL=http://localhost:3001`.

For a new checkout, use `.env.example` and the installed Clerk CLI to link/pull
keys. Configure `APP_URL` to exactly the browser origin, the Clerk issuer, the
Convex HTTP actions URL (`CONVEX_SITE_URL`), and a shared `DATA_GATEWAY_SECRET` of
at least 32 characters configured on both Convex and Next.js. Do not replace the
existing secret without updating all connected applications. Keep keys server-side.

OpenAI uses `MODEL_PROVIDER=openai`, `OPENAI_API_KEY`, and optionally
`OPENAI_MODEL` (verified with `gpt-5.4`). Anthropic can be explicitly selected with
`MODEL_PROVIDER=anthropic` and its corresponding key/model variables. No provider
secret is exposed to the browser or Scout. Eve starts alongside `next dev`.

## Shopping experience

- **Overview:** your personal cart count, order count, simulated spending, and
  recent orders.
- **Shop:** 40 curated tech and desk essentials with category/search/sort controls.
- **Cart:** private Convex persistence, quantity changes, removal, and totals.
- **Orders:** your simulated purchases with immutable item/price snapshots.
- **Billing:** individual Clerk Pro plan at **USD 20/month**, plus subscription
  management through Clerk's profile modal.
- **Agent:** Pro-only Scout chat, history, streaming, new conversations, and replay.

Every workspace page requires sign-in. Free users can shop and place demo orders;
Pro unlocks Scout. `/chat` redirects to `/agent`, including saved conversation URLs.
Legacy analytics records and conversations remain stored; the Customers screen
redirects to Overview. Old analytics tools are no longer exposed to the agent.

### Simulated checkout

Product checkout does **not** take a payment, fulfill goods, calculate tax, or
arrange shipping. “Place demo order” creates a completed order in your account,
saves product/price snapshots, and clears the cart in one atomic mutation.

Totals come from the server in integer USD cents. Quantities are bounded to 20
per product and 40 distinct cart lines. Checkout validates the displayed cart
revision and total; changed carts or prices require review. A per-tab retained checkout
key allows a lost response to be retried without creating a duplicate purchase.
If browser storage is unavailable, the current tab retains the retry key in memory.
New accounts start with an empty cart and no order history.

Clerk membership checkout is separate and uses **development test payments**.
Production Clerk, payment activation, and a public shopping deployment are not
part of this local implementation. The older Vercel preview still shows Ledger.

### Scout

Scout can search products and budgets, inspect your cart and orders, and update
cart quantities after an explicit request. A recommendation alone does not add
anything. Its five tools do not expose checkout, refunds, order cancellation,
subscription changes, analytics queries, files, shell, or external services.
Place orders through the Cart confirmation action. All product facts come from
tools; unavailable services produce errors rather than invented results.

## Convex development and demo data

The existing development deployment is `adventurous-deer-280`. Push/watch database
functions using the installed CLI:

```sh
npm run dev:db
# Or push once:
npx convex dev --once
```

Seed the shared catalog and 24 historical shopping orders for a verified demo
user. Run from a configured checkout; production selections are refused:

```sh
clerk users list --app app_3KnYwZrfRDmhFDiDrJbe4xX983Y --instance dev --query your-email --json
npm run seed:shop -- --deployment dev --user user_REPLACE_WITH_VERIFIED_USER_ID
npx convex run shopSeed:counts '{"ownerId":"user_REPLACE_WITH_VERIFIED_USER_ID"}' --deployment dev
```

Seeding is atomic and idempotent. It does not modify the original analytics
records. The existing demo login is saved in ignored `.env.demo-login` with local
file permissions; passwords are never committed. It has a Pro test subscription.
The original deterministic analytics seed remains available as `npm run seed`.

## Trust boundaries

Clerk verifies real session identity on every authenticated API call. Eve checks
both login and `has({plan: 'pro'})` on each protected request, independently of
Next.js page protection. Conversation IDs alone never authorize replay or controls;
all session operations verify the owner, including encoded route forms.

Shopping and analytics functions remain internal to Convex. A strict HMAC-signed,
timestamp-bounded gateway carries server-derived identity and allowlisted operations.
The browser/model cannot supply an owner or entitlement. Origin validation applies
to shopping writes. Cart operations and checkout keys are owner-scoped; Scout uses
its durable session/call ID to prevent duplicate cart increments after retries.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run build:eve
```

Real browser tests require an explicitly supplied, ignored Playwright state file
for a real Clerk Pro development user (no auth bypass). Point the URL at the
configured local server:

```sh
LEDGER_E2E_URL=http://localhost:3001 \
LEDGER_E2E_STATE=.superpowers/shop-browser.json \
npx playwright test --workers=1
```

Tests cover cart persistence, checkout recovery after a lost response, Scout cart
updates, new conversations, and replay. See `docs/verification.md` for actual
outcomes and limitations. Automated tests without real state explicitly skip
provider-dependent browser journeys rather than simulating successful login.

## Product photos

All 40 catalog items have a representative local WebP photograph, shared by the
shop, cart, and featured products. Content-hashed filenames prevent stale image
caches, and Next.js serves responsive, lazy-loaded sizes. Image sources, creators,
and available license details are listed at `/image-credits` and in
`lib/shop/product-photos.json`. Images illustrate fictional demo products and may
show other brands/models; source credits do not imply ownership or endorsement.
