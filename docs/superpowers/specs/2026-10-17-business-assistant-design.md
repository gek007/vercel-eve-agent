# Pro business data assistant

Date: 2026-10-17
Status: Proposed written specification; the user approved the conversational design.

## Purpose and agreed scope

Build a Next.js application where individual users with an active Clerk Pro plan
can ask an Eve agent questions about seeded customers, orders, and revenue in
Convex. The initial application is a demonstration using synthetic business data.
Success means a Pro user can explore the data and obtain grounded answers, while
signed-out users, free users, and users requesting another user's conversations
cannot access the agent or its protected resources.

The user selected a business data assistant and approved dashboard, customer/order
exploration, chat, billing, read-only tools, repeatable seeding, and the access
verification described below.

## Architecture and alternatives

Use Next.js App Router with TypeScript and Eve's `withEve()` integration. Next.js
serves the application; Eve runs the durable agent runtime with same-origin
browser routes. Deploy these together as a Vercel project. Convex remains the
business-data backend. Clerk owns user identity and billing entitlements.

A separately deployed Eve service adds deployment and credential-routing work.
A custom chat transport adds session and streaming implementation work. Neither
is necessary for this first version.

Use the installed Clerk and Vercel CLIs and the Convex CLI, available through
`npx convex`, for their respective setup and deployment operations. Consult
Context7 for library documentation and the installed Eve package's bundled docs
before implementing version-specific APIs. Use relevant skills and MCP tools;
unrelated integrations are outside this application's scope.

## User experience

- Public entry page explains the assistant and offers Clerk sign-in/sign-up.
- Clerk billing page presents configured individual user plans and checkout.
- Signed-in free users receive an upgrade prompt when attempting Pro features.
- Pro users see a dashboard with revenue, order, and customer summaries.
- Customer and order explorers support bounded pagination, search, and filters.
- Chat supports new conversations, history, streaming replies, and reopening a
  conversation owned by the current user.
- Sign-out, loading, empty, unavailable-service, and failed-request states have
  explicit UI feedback. Layout supports desktop and mobile widths and keyboard
  navigation.

## Identity, billing, and ownership

The initial subscription model is B2C: the individual user subscribes. The paid
plan slug is `pro`. Plan price is configuration in Clerk and is not hard-coded
into application authorization. Development uses Clerk's test billing flow;
production payment setup is separate from local implementation.

Before accepting an agent request, verify a genuine Clerk session and the user's
Pro entitlement. Implement this at Eve's HTTP channel boundary because its
runtime is separate from Next.js. A hidden chat widget or a protected Next.js
page is insufficient. Do not enable anonymous, local-development, or alternate
authenticator fallbacks that bypass these checks.

Apply protection to session creation, sending messages, streaming/replay, and
session controls. Scope conversation access to the verified stable user
identity; a session identifier is never proof of ownership. The implementation
must confirm Eve's ownership semantics against its installed documentation and
add an application ownership check wherever the runtime does not provide one.

Do not accept user IDs, plan membership, or ownership from browser input or model
arguments. Recheck entitlement on each new protected HTTP request. An accepted
turn may finish if the subscription changes while it is running; later requests
must be denied once the entitlement change is visible to Clerk's supported
authorization mechanism.

All business-data access is authenticated and scoped to the requesting user's
dataset. Agent tools also require Pro access. Enforce authorization at callable
backend boundaries so directly calling Convex functions cannot bypass the UI or
Eve gate. Choose the supported Clerk/Convex entitlement enforcement mechanism
during implementation from current documentation; no client-writable billing
flag may authorize access. If required auth configuration is missing, fail
closed with setup guidance.

## Convex data and seeding

Keep a synthetic dataset per user, identified by a server-derived Clerk owner
ID. This permits identical demo fixtures without exposing another user's data.
Create the following records for a seeded demo user:

| Collection | Approximate count | Principal fields |
| --- | ---: | --- |
| Customers | 250 | owner, fixture key, name, company, region, created date |
| Products | 40 | owner, fixture key, name, category, price in cents |
| Orders | 2,000 | owner, fixture key, customer, date, status, total in cents |
| Order items | 6,000 | owner, fixture key, order, product, quantity, unit price |

Use integer cents and USD for the demo. Revenue means completed order totals;
exclude pending and cancelled orders. Use UTC date boundaries in queries and
label displayed dates clearly. Include multiple months, regions, categories,
repeat purchasers, and order statuses so questions produce varied results.

Seeding is deterministic, idempotent, and performed through a CLI-invoked
internal operation. Seed records in bounded batches and record progress so
rerunning an interrupted seed avoids duplicates. Do not expose an unrestricted
public seed/reset mutation. A CLI seed command targets an explicit development
deployment and user. No automatic production seeding or deletion.

Index owner-scoped lookups, customer/order relationships, fixture keys, and date
filters as needed. Validate relationship ownership when creating seed records.
Store seed version/completion metadata per owner.

## Agent behavior and tools

Define the Eve agent through conventional instruction and tool files. Offer
bounded, read-only tools to search customers, inspect orders, summarize revenue
by date/product/customer, and retrieve comparative metrics for trend analysis.
Prefer structured queries and summaries over sending the entire database to the
model. No arbitrary SQL, database mutation, or external business actions.

Derive the data scope from verified execution identity. Tool arguments contain
only business filters, identifiers, date ranges, and pagination controls. Treat
record text as data rather than instructions. Do not permit model-supplied owner
IDs to broaden access. Validate date ranges and cap result sizes.

Ground numerical statements in tool results. State the relevant date range,
currency, revenue definition, and comparison period when useful. Ask for missing
filters when necessary, report no matching data honestly, and never invent
records or totals. An unavailable data service produces a recoverable error,
not a fabricated answer. Prompts and examples identify the data as synthetic.

## Persistence and configuration

Eve owns durable conversation execution and transcript replay. Convex owns the
business records, seed metadata, and any application conversation index needed
for the history UI; avoid maintaining a second independent transcript store.
An index entry must refer to its owner and authoritative Eve session.

Pin installed versions in the lockfile and pin experimental Clerk billing SDK
versions explicitly. Document environment variable names without secrets in an
example file. Keep credentials in ignored local environment files and provider
configuration. Never expose provider secret keys to the browser or model.

The Vercel CLI previously reported an invalid token. Reauthentication through
`vercel login` is required before deployment. Clerk CLI is authenticated but no
application is linked. Convex deployment authentication/linking remains to be
verified. These setup facts do not constitute verified deployment readiness.

## Acceptance and verification

1. The project passes its TypeScript, lint, production build, and relevant Eve
   compilation checks with documented required configuration.
2. Signed-out requests cannot create, read, stream, modify, or cancel agent
   sessions. Signed-in free users cannot invoke the agent or its tools.
3. A Pro user can create a conversation, send a question, receive a streamed
   answer grounded in Convex data, and reopen their conversation.
4. A second Pro user cannot read or control the first user's session, transcript,
   conversation index, or private business records, including through direct
   HTTP and Convex calls.
5. Loss of Pro entitlement denies subsequent protected requests according to
   Clerk's supported entitlement refresh semantics.
6. The seed produces the intended record counts and valid relationships; a
   second run creates no duplicates. Interrupted runs can resume.
7. Revenue summaries match independently calculated fixture totals, including
   date boundaries, cancellation exclusions, and product/customer breakdowns.
8. The interface exposes sign-in and billing flows, upgrade prompts, useful
   service errors, and responsive, keyboard-accessible primary controls.

Automated tests should focus on authorization boundaries, ownership, seed
idempotency, and aggregation correctness. Also run a browser smoke test for the
primary user journey when development credentials are available. Report any
unverified provider-dependent behavior explicitly.

## Explicit exclusions

This version does not include organization subscriptions, live customer data,
data import, arbitrary data editing, scheduled reports, additional communication
channels, or production payment-provider activation. It does not create real
charges or assign paid access through a fabricated local entitlement.

## Documentation consulted

- https://vercel.com/eve
- https://eve.dev/docs/getting-started
- https://eve.dev/docs/guides/frontend/nextjs
- https://eve.dev/docs/guides/auth-and-route-protection
- https://eve.dev/docs/patterns/multi-tenant-auth
- Context7: `/vercel/eve`, `/clerk/clerk-docs`,
  `/llmstxt/convex_dev_llms-full_txt`, and `/vercel/next.js`.

Implementation must read the documentation bundled with the installed Eve
version before writing agent code.
