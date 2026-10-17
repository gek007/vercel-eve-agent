# Ledger business assistant

A Next.js application with an Eve agent, private Convex demo datasets, and Clerk
B2C subscriptions. Only signed-in individual users on the `pro` plan can access
the dashboard, data explorers, agent tools, or conversations.

[Open the verified development preview](https://vercel-eve-agent-76v2tjcte-gek007s-projects.vercel.app). Vercel team sign-in is required by preview protection.

## Current services

- Clerk application: `vercel-eve-agent`, development billing, USD 20/month Pro.
- Convex project: `kostya-shilkrot/vercel-eve-agent`.
- Convex development deployment: `adventurous-deer-280`.
- Vercel project: `gek007s-projects/vercel-eve-agent`.
- Provider: direct OpenAI or Anthropic API key, selected server-side.

This is a development/test application. Clerk checkout uses its development
payment gateway. Real payment-provider activation is outside this setup.

## Run locally

Use Node.js 24.x and npm. Provider SDK versions and dependencies are locked.

```sh
npm ci
clerk link --app app_3KnYwZrfRDmhFDiDrJbe4xX983Y
clerk env pull --instance dev --file .env.local
```

Copy the non-secret settings in `.env.example` into `.env.local`. Set
`APP_URL=http://localhost:3000`,
`CLERK_ISSUER_URL=https://great-chipmunk-9427.clerk.accounts.dev`, and
`CONVEX_SITE_URL=https://adventurous-deer-280.convex.site` for the existing
services. Generate a random `DATA_GATEWAY_SECRET` (at least 32 characters) for a
new deployment and configure the same value on Convex and the app. Do not rotate
the existing service secret without updating every connected app.

Choose one direct model provider:

- OpenAI: set `MODEL_PROVIDER=openai` and `OPENAI_API_KEY`.
- Anthropic: set `MODEL_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`.

`OPENAI_MODEL` or `ANTHROPIC_MODEL` optionally overrides Eve's installed helper
default. With no explicit provider selection, OpenAI is selected when its key
exists, otherwise Anthropic. An explicitly selected provider never silently
falls back to another provider or AI Gateway. The model context window is capped
at 128,000 tokens for compaction; use models that support that context length.
Keys are read at runtime, never placed in a browser bundle or model-visible
principal attributes. No key is needed to compile or test access boundaries.

```sh
npm run dev
# http://localhost:3000
```

`withEve()` starts Eve alongside Next.js. To edit/push database functions, run
`npm run dev:db` in another terminal. Use the provider's test checkout through
`/pricing` to give a development user the actual Pro plan; no local plan bypass
exists. A newly subscribed user's demo dataset must be seeded using the CLI.

## Seed a private dataset

Find the development user's Clerk ID:

```sh
clerk users list --app app_3KnYwZrfRDmhFDiDrJbe4xX983Y --instance dev --query your-email --json
npm run seed -- --deployment dev --user user_REPLACE_WITH_VERIFIED_USER_ID
npx convex run seed:counts '{"ownerId":"user_REPLACE_WITH_VERIFIED_USER_ID"}' --deployment dev
```

The seed command refuses production selections. It invokes an internal action
through the authenticated Convex CLI, in atomic resumable batches. Rerunning it
keeps the same fixture keys and record counts. The dataset has:

- 250 customers, 40 products, 2,000 orders, 6,000 order items.
- Dates from January 1 through September 30, 2026, interpreted in UTC.
- USD amounts stored as integer cents.
- Completed-order revenue of **209,818,131 cents ($2,098,181.31)**, 1,641 completed
  orders. Pending/cancelled orders are excluded from revenue.

Two Clerk development users were created for checkout and isolation verification:
`ledger+clerk_test@example.com` and `ledger-isolation+clerk_test@example.com`.
Both have Pro test subscriptions; only the first is seeded. The seeded demo account’s credentials are saved locally in `.env.demo-login`,
which is ignored by Git and excluded from deployment. Test credentials are
not committed. Use your own sign-in, or the authenticated Clerk CLI to manage
these test accounts. Do not use them for production.

For a separate local Convex backend, follow `npx convex dev --help` and select a
local deployment. Set the app's `CONVEX_SITE_URL` to that backend's HTTP actions
URL and configure its secret separately.

## Access model

Next.js verifies Clerk sessions with `auth()` on protected pages and
`authenticateRequest()` on APIs. Eve's channel independently verifies the same
Clerk session and `has({ plan: 'pro' })`; Next.js middleware alone cannot protect
its separate runtime. Trusted browser origins come from `APP_URL` and Vercel's
own deployment/branch URL variables, never request headers.

A Convex ownership registry binds each Eve session to its creator. All follow-up,
stream/replay, and cancel/clear/compact/reset endpoints check ownership before
calling Eve. Creation claims ownership before returning the session ID. Unknown
sessions fail closed. Tools also verify the current caller matches the session
initiator. Eve's own transcript is the only transcript store.

Convex business functions are **internal**, not publicly callable queries. A
fixed HTTP gateway verifies an HMAC-SHA256 signature over exact request bytes,
including owner, operation, input, and timestamp. Only authenticated app/agent
servers hold the signing secret. Envelopes expire within 60 seconds; operation
and input allowlists reject additional ownership fields. Browsers and model
arguments cannot select an owner. The gateway never exposes seed/reset/admin
operations.

Eve's optional default tools and agent delegation tool are disabled. The model
has only four authored read-only business tools. Attachments, callbacks,
identity forwarding, and tool stubs are not exposed. A just-bash virtual
workspace satisfies Eve's required sandbox interface without native compute;
no shell/file tools are available to the model.

Clerk plan checks use its current session token. Subscription changes become
visible after Clerk refreshes that token. New HTTP requests are rechecked; an
already accepted turn may finish. The app does not mirror billing into a
client-writable database flag.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run build:eve
```

Tests cover Pro policy, signed gateway requests, date-range validation, fixture
relationships, seed resumption/idempotency, revenue arithmetic, and session
ownership routes. Convex tests use `convex-test`; actual CLI/cloud seed counts
were also checked twice. Browser checks exercised signed-out redirects, free
API denial, real Pro test checkout, dashboard/tables, session creation, and
cross-user denial across all six session operations. Desktop and mobile screens
were visually inspected.

The direct OpenAI connection was verified with `gpt-5.4`. A live Eve chat called
the revenue tool and answered $2,098,181.31 with 1,641 completed orders for
January through September 2026; reloading restored the transcript. The browser
regression also verifies that New conversation creates a distinct session.
Compile/test success alone does not prove future provider availability. Provider errors appear as recoverable chat
errors; no fabricated answer is returned.

The demo queries deliberately read a bounded small dataset (up to 251 customers,
41 products, 2,001 orders, 6,001 items per owner). This is not an import pipeline
or a large-scale warehouse. Increase these limits or add aggregate tables before
changing the fixture size.

## Deploy a preview

Use the installed Vercel CLI (64.5.0 or newer for this setup):

```sh
vercel link --yes --project vercel-eve-agent --scope gek007s-projects
# Configure app env names from .env.example in Preview through vercel env add.
# Mark CLERK_SECRET_KEY, DATA_GATEWAY_SECRET, and the provider API key sensitive.
vercel deploy --target=preview --yes
```

The first deployment of a new Vercel project is forced to production by Vercel,
even with a preview target. This project's initial build was cancelled; later
builds use Preview. Preview deployment protection remains enabled. Sign in to
the Vercel team to access the preview, or verify it with `vercel curl`.

Production Clerk keys, payment gateway activation, production Convex deployment,
and a production domain are separate work. Do not reuse test keys or seed data
as a production setup.
