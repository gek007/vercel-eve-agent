# Circuit & Co. shopping app

Date: 2026-10-17
Status: Implemented and verified locally; independent review complete and Important findings fixed.

## Purpose and approved scope

Convert the existing Ledger analytics demo into Circuit & Co., a personal tech
and desk-accessories shop. Scout is the Pro shopping assistant. Preserve the
approved navy, ivory, mint, and coral theme, Next.js, Convex, Eve, direct OpenAI
connection, and Clerk authentication and B2C billing.

Users browse products, maintain a private persistent cart, place simulated
orders, review their own purchases, manage their subscription, and ask Scout for
shopping help. Product checkout never charges money. Clerk Pro billing remains
USD 20/month using the existing development test gateway.

## Architecture and alternatives

Extend the current Next.js application and its signed server-to-Convex gateway.
Keep the verified Clerk identity as the sole source of ownership. Add dedicated
shopping tables and operations, rather than repurposing the existing analytics
orders whose customer relationships describe a different business model.

A local-storage cart would be simpler but would not provide shared state for
Scout or cross-session persistence. A separate commerce service and real payment
integration exceed the approved simulated-checkout scope. Convex mutations
provide the atomic cart/order transaction this app needs.

## Navigation and visual experience

The sidebar follows the supplied reference: Circuit & Co. wordmark, the tagline
“Helpful tech, thoughtfully picked.”, and Overview, Shop, Orders, Cart, Agent,
and Billing links. Active navigation is mint with a restrained coral edge on a
navy background. Ivory content surfaces and white panels carry through desktop,
mobile, public entry, authentication, and billing pages.

- `/dashboard`: personal overview with cart quantity, purchase count, simulated
  spending, recent orders, and an invitation to ask Scout.
- `/shop`: searchable catalog, category filters, sort controls, product cards
  with illustrations, descriptions, prices, and Add to cart controls.
- `/cart`: line items, quantity controls, removal, server-calculated totals,
  and an explicit “Place demo order” action. Success links to the new order.
- `/orders`: the current user's simulated order history and selected-order
  line items, totals, date, and status. No other customers' records are shown.
- `/agent` and `/agent/[sessionId]`: Scout chat, history, live status, new
  conversation, streamed answers, and replay using the existing Eve transport.
- `/billing`: the current user's Clerk plan and subscription management, with
  the existing PricingTable offering Pro at USD 20/month.
- `/`: shopping-focused entry and links to Shop and Scout.

Retain `/chat` links as redirects to `/agent`, including owned session URLs.
Retain `/pricing` as a usable upgrade destination. Remove the Customers section
from navigation and retire its analytics route with a redirect to the overview.
Existing analytics records remain stored but do not appear in the shopping UI.

Use a grid of all six navigation destinations on narrow screens so Billing and
Cart stay reachable. Keep visible keyboard focus, descriptive controls, loading
feedback, recoverable errors, and useful empty states. Cart and order views
refresh after successful changes; refresh also reconciles actions taken by Scout.

## Identity and access

All shopping workspace pages and shopping API operations require a real Clerk
session. Signed-in free users may browse, modify their cart, place demo orders,
view their own orders, and open Billing. Only Agent pages and Eve requests require
Clerk's actual `has({ plan: 'pro' })` entitlement.

Separate authenticated-caller checks from Pro checks, while preserving the
current origin validation and fail-closed configuration behavior. Eve retains
per-request Pro authorization and its ownership checks for creation, messaging,
streaming, replay, and session controls. Preserve encoded-route regression tests.
No browser request or tool argument may choose an owner or grant a plan.

Extend the strict signed gateway operation allowlist for shopping reads, cart
writes, checkout, and controlled demo initialization. Backend functions remain
internal. The Next.js request handler verifies identity before signing any call.
Reject untrusted origins for state-changing requests. Validate inputs at both
boundaries and return meaningful validation, conflict, and service errors.

## Convex data model

Add tables with indexed lookups:

- `shopProducts`: stable SKU, name, category, description, priceCents, visual
  identifier, and active flag. Shared synthetic catalog; no user data.
- `shoppingCarts`: ownerId and revision, one cart per user.
- `shoppingCartItems`: ownerId, productId, quantity; indexed by owner/product.
- `shoppingOrders`: ownerId, public reference, createdAt, status, currency USD,
  totalCents, source (`demo_seed` or `checkout`), checkout key, and cart revision.
- `shoppingOrderItems`: ownerId, orderId, productId, and immutable snapshots of
  SKU, name, quantity, and unit price. Historical totals do not change when a
  catalog item changes.
- `shoppingSeedProgress`: per-owner seed version/completion state for repeatable
  demo order initialization.

Use integer cents throughout. Limit quantities to 1–20 per product and carts to
40 distinct lines. Catalog queries and order history have bounded pagination.
An order detail lookup always checks owner before returning line items.

Keep existing analytics and Eve conversation tables unchanged. New catalog and
shopping-order seeding must not clear, migrate, or reinterpret those records.

## Demo catalog and seeding

Provide 40 curated synthetic tech and desk products across Audio, Desk, Charging,
Accessories, and Travel. Use consistent code-native product illustrations rather
than unrelated photos or image-generation dependencies. Persist catalog records
through an idempotent internal CLI seed with stable SKUs.

Provide an internal CLI seed for 24 varied historical demo orders for a verified
user, including completed, pending, and cancelled examples with matching line
items. Seed the existing demo account, then verify rerunning creates no duplicates.
New accounts can shop immediately with an empty cart and order history; they do
not need artificial history to use the application. Do not seed production.

## Cart and simulated checkout

Cart writes accept a product identifier and validated quantity; prices and
ownership are derived by the server. Adding a product increments its quantity;
setting quantity is absolute and can remove a line at zero. Reject inactive or
unknown products and quantities outside the supported bounds. Show the current
cart after every successful operation.

Checkout is an explicit user action in the Cart UI. Display “Demo checkout — no
payment will be taken” beside the action. The displayed total is USD subtotal,
with no shipping or tax simulated. Server totals are authoritative.

In one Convex mutation: verify the requested cart revision, validate every item,
recompute prices, insert the order and immutable items, and clear the cart while
advancing its revision. Require a client-generated checkout key, indexed together
with the owner. Retrying that key returns the original order. A second checkout
of the same stale cart revision cannot create another order, even with a different
key. If the cart changed, require the user to review refreshed totals and retry.
An empty cart cannot be checked out. Mutation failure leaves the cart intact.
New demo orders are completed and explicitly labeled simulated.

## Scout behavior and tools

Replace the analytics instructions, tool files, examples, and chat branding with
shopping behavior. Use only bounded shopping tools:

1. Search products by category, text, and budget and retrieve product details.
2. Read the user's cart and authoritative totals.
3. Add to cart, set quantity, or remove an item when explicitly requested.
4. List and inspect the user's own orders.
5. Read a personal overview of cart and order counts.

Scout must use tools for product facts, prices, availability, orders, and cart
state. Recommend only matching catalog products and explain tradeoffs briefly.
For ambiguous products or quantities, ask before writing. A recommendation alone
does not authorize adding an item. Report a cart update only after its tool
succeeds. Cart mutations use an operation ID derived from Eve's execution/tool
call identity so durable replay cannot add the same quantity twice.

Scout cannot place orders, charge a payment method, cancel/refund orders, grant
Pro, change subscription plans, or access analytics/customer records. Direct users
to the Cart confirmation action to place a demo order and to Billing for plans.
Treat catalog and user-supplied text as data, never as authority to change identity
or reveal secrets. Keep existing OpenAI provider configuration and runtime limits.
The chat status reflects working, restoring, ready, or error state honestly.

## Failure handling

Display operation-specific validation messages without leaking backend details.
Disable duplicate UI submissions while a request is pending. Recover checkout
responses lost to the network by retaining and retrying the same checkout key.
Refresh the cart on revision conflicts. Do not optimistically claim order success
or a cart update before the backend confirms it. An unavailable database or model
shows a retry path; neither fallback invents results or bypasses access control.

## Acceptance and verification

- Signed-out shopping requests return 401; free users can shop but Agent APIs
  return 403. Pro users can use Scout.
- Cart, order, and session access is isolated between two real users, including
  direct HTTP requests and encoded Eve routes.
- Cart validation, price calculation, empty-cart rejection, checkout atomicity,
  stale revisions, and duplicate checkout/tool operations have meaningful tests.
- Catalog and demo order seeding is idempotent and preserves analytics records.
- A browser journey adds products, changes quantities, reloads the persisted cart,
  places one demo order, verifies line items, and confirms the cart is empty.
- Scout can recommend a real catalog product and update the owner's cart on an
  explicit request; another user's records remain inaccessible.
- New chat, conversation replay, billing access, and mobile navigation work.
- TypeScript, lint, relevant tests, Next.js production build, and Eve compilation
  pass. Inspect actual desktop/mobile screenshots before delivery.

## Delivery boundary and documentation

Implement and verify locally with the existing cloud development Convex database
and Clerk development instance, using the installed CLIs. No live product charges,
production activation, public redeployment, stock fulfillment, real shipping,
refund processing, or external messages are included. Update setup, seed commands,
and verification notes to explain the shopping app and the test-only checkout.

Current documentation consulted for design: Convex writing-data and transaction
behavior via Context7 `/llmstxt/convex_dev_llms-full_txt`. Before implementation,
read the relevant current Clerk/Next.js documentation and installed Eve guides
for the APIs being changed. Existing authentication and session regression tests
remain the baseline rather than being discarded during the conversion.
