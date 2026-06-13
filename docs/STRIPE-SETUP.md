# Stripe Checkout Setup

How the Chronos Pro subscription flow is wired, and the steps left to make it
live. Modeled on the working Stripe system in `blackie-entertainment` (adapted
from one-time payments to **subscriptions**).

> **Note:** the site never used Gumroad. The Pro/Enterprise buttons previously
> pointed at `mailto:sales@...`. This setup replaces the Pro buttons with Stripe.

## Architecture (three layers)

| Layer | Where | Status |
|---|---|---|
| 1. Checkout | this repo (static site) | **Done in code** -- needs live Payment Link URLs pasted in |
| 2. Fulfillment | `chronos-license-webhook` (Vercel) | **Built** -- needs deploy + Stripe/Resend/Upstash keys |
| 3. Enforcement | `chronos-timekeeping` desktop app | **Not started** -- app validates the key |

The marketing site stays a static GitHub Pages site. Stripe-hosted Payment Links
handle checkout (no backend here); a separate small Vercel function issues and
validates license keys.

## Provisioned resources (TEST MODE)

Created on the ChronosTimekeeping Stripe account. These are **test-mode** — do
not paste the test Payment Links onto the live site; recreate them in live mode
before launch (same commands, live keys).

| Resource | ID / URL |
|---|---|
| Product | `prod_UhMcM7booJPkrK` |
| Price — Pro Monthly ($9.99/mo) | `price_1ThxtDRXcnT9KWE4oAsX4x7Q` |
| Price — Pro Annual ($99.99/yr) | `price_1ThxtDRXcnT9KWE40NcEyF4X` |
| Payment Link — Monthly | `https://buy.stripe.com/test_4gMeVf6a6bh67qo3lpao800` |
| Payment Link — Annual | `https://buy.stripe.com/test_3cI6oJ6a65WMfWU2hlao801` |

The two `price_...` IDs are the `PRICE_PRO_MONTHLY` / `PRICE_PRO_ANNUAL` env vars
for the webhook. Upstash Redis is already provisioned (Stripe Projects, free tier).

## Layer 1 -- Checkout (this repo)

Already wired:
- `pricing.html` Pro card has two buttons (`data-stripe="proMonthly"` /
  `"proAnnual"`). Until you paste live URLs they fall back to the sales mailto,
  so the live site never shows a dead button.
- `assets/js/main.js` has a `STRIPE_LINKS` config block. Paste the Payment Link
  URLs there; the script rewrites the button hrefs on load.
- `success.html` is the post-checkout thank-you page.

### Steps

1. **Create the product + prices in Stripe** (Dashboard -> Product catalog):
   - Product: *Chronos Pro*.
   - Price 1: $9.99 / month (recurring) -> note the `price_...` id.
   - Price 2: $99.99 / year (recurring) -> note the `price_...` id.
2. **Create two Payment Links** (Dashboard -> Payment Links), one per price:
   - Set each link's **after-payment redirect** to
     `https://chronos-timekeeping.com/success.html`.
   - Enable "Let customers adjust quantity" = off; collect email (default on).
3. **Paste the two `https://buy.stripe.com/...` URLs** into `STRIPE_LINKS` in
   `assets/js/main.js`:
   ```js
   var STRIPE_LINKS = {
       proMonthly: 'https://buy.stripe.com/...',
       proAnnual:  'https://buy.stripe.com/...'
   };
   ```
4. Commit + push. GitHub Pages redeploys; the Pro buttons now go to Stripe.

Enterprise stays **Contact Sales** -- per-seat volume pricing doesn't fit a fixed
Payment Link. Wire it later as a separate link or quote flow if desired.

## Layer 2 -- Fulfillment (`chronos-license-webhook`)

A standalone Vercel project (sibling repo) that turns a completed subscription
into a license key. See its `README.md`. Summary:

1. `npm install`, deploy with `vercel`, connect an Upstash/KV store.
2. Set env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `PRICE_PRO_MONTHLY`, `PRICE_PRO_ANNUAL`, `RESEND_API_KEY`).
   The two `PRICE_*` values are the `price_...` ids from Layer 1 step 1.
3. Add a Stripe webhook endpoint -> `.../api/stripe-webhook`, subscribed to
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Put its signing secret in
   `STRIPE_WEBHOOK_SECRET`.
4. Verify a custom sending domain at resend.com/domains (optional but
   recommended so emails come from `@chronos-timekeeping.com`).

On a completed subscription the webhook mints `CHRONOS-XXXX-XXXX-XXXX-XXXX`,
stores it, and emails it. Cancellations flip the stored status to `canceled`.

## Layer 3 -- Enforcement (desktop app)

Not built yet. The app should, on launch / periodically:
1. Read the saved license key from Settings -> License.
2. `GET https://<webhook-deploy>/api/validate?key=<KEY>` -> `{ valid, status, plan }`.
3. Unlock Pro features while `valid === true`.
4. **Cache the result with a ~7-day offline grace period** so a network outage
   never locks out a paying user. Re-check on the next successful connection.

## Test mode first

Do the entire flow with Stripe **test mode** keys (`sk_test_`, test Payment
Links, card `4242 4242 4242 4242`) before switching to live keys. Use the Stripe
CLI to replay webhook events locally:
`stripe listen --forward-to localhost:3000/api/stripe-webhook`.
