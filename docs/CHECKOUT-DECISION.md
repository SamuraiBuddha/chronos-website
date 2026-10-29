# Pro Checkout Flow -- Three Options for Jordan to Pick

## The funnel leak

The site currently has a clean trial flow (Free Trial card -> download MSI/DMG/AppImage from GitHub releases -> 14-day local trial). **The Pro upgrade flow leaks:** both `index.html` (final-cta section, "Contact Sales" button) and `pricing.html` (Pro and Enterprise "Get Started" buttons) route to:

```html
<a href="mailto:sales@chronos-timekeeping.com?subject=Pro%20Subscription">Get Started</a>
```

This is a manual flow. A user who has read everything, decided to buy, and clicked "Get Started" is then asked to compose an email, hit send, and wait for a human to reply with payment instructions. Two-step funnels at decision time lose ~50-70% of intent. The trial loop is solid; the upgrade loop is the bottleneck.

The advert-claw PRD calls out this fix as a **funnel-first** prerequisite to driving any outbound traffic. Three concrete options below; you pick, I implement in a follow-up PR.

## Option A -- Gumroad

**Setup time:** ~30 minutes. **Per-transaction cost:** 10% (5% Gumroad + ~5% processing) on the smallest plan; drops to 3.5% on Discover plan as volume grows.

**What it looks like:**

```html
<a href="https://YOUR_GUMROAD_HANDLE.gumroad.com/l/chronos-pro?wanted=true"
   class="btn-pricing"
   data-gumroad-single-product="true">Get Started</a>
<script src="https://gumroad.com/js/gumroad.js"></script>
```

(Includes a JS file that wires up the Gumroad overlay checkout -- buyer never leaves the page; modal opens; pays; license email arrives.)

**Pros:**
- Indie-friendly, ~30 min from signup to first sale possible
- Built-in license key delivery via webhook (you script the key issuance)
- Discover store can drive incremental traffic for free
- Subscription model supported natively (monthly + annual)
- Affiliate program out of the box (5-50% commissions, marketplace of affiliates)

**Cons:**
- 10% on small plans is steep at $9.99/mo -> ~$1.00 take per transaction
- US sales tax + EU VAT are YOUR responsibility (not merchant-of-record)
- Limited customization on checkout UI
- Brand-on-checkout: customers see "Gumroad" in the flow

**Best for:** fastest time to "stop leaking sales," with the cost-per-transaction acceptable while volume is low.

## Option B -- LemonSqueezy

**Setup time:** ~1-2 hours. **Per-transaction cost:** 5% + $0.50 flat. **They are your merchant-of-record** -- they handle VAT/GST/sales tax globally.

**What it looks like:**

```html
<a href="https://chronos-timekeeping.lemonsqueezy.com/buy/PRO_VARIANT_UUID?embed=1"
   class="btn-pricing lemonsqueezy-button">Get Started</a>
<script async src="https://app.lemonsqueezy.com/js/lemon.js"></script>
```

(Same overlay-checkout pattern as Gumroad: button click opens modal, buyer pays without leaving page, license key arrives via webhook.)

**Pros:**
- **Merchant-of-record** -- LS files and remits sales tax / VAT / GST in every jurisdiction. Solo founder doesn't deal with global tax compliance.
- Cleaner checkout UI than Gumroad
- Subscription handling + license keys + dunning + downgrade/upgrade flows built in
- Affiliate program with custom commission rules
- Free up to 200 sales/mo, then $19/mo platform fee for the "Plus" plan (still + per-transaction fees)
- Customer portal (cancel / update card / download invoices) is hosted for you

**Cons:**
- 5% + $0.50 means $0.99 take on a $9.99 sale (~10% effective rate) -- similar to Gumroad effective at this price point
- One more vendor to onboard (vs. Gumroad's "sign up and go")
- US-LLC ergonomics slightly worse than Stripe (1099 reporting, etc.)

**Best for:** if you don't want to think about sales tax for the rest of the product's life. The compliance offload alone is worth the 5%.

## Option C -- Stripe Checkout

**Setup time:** ~3-4 hours initial + ongoing tax / compliance work. **Per-transaction cost:** 2.9% + $0.30 (US). **You are the merchant.**

**What it looks like:**

```html
<form action="https://YOUR_CLOUD_FUNCTION/checkout" method="POST">
  <input type="hidden" name="price_id" value="price_1XXXX...">
  <button class="btn-pricing">Get Started</button>
</form>
```

(Form posts to a small serverless function that calls `stripe.checkout.sessions.create()` and redirects to Stripe-hosted Checkout. Webhook on `checkout.session.completed` issues the license key.)

**Pros:**
- **Lowest fees by far** -- 2.9% + $0.30 -> $0.59 take on a $9.99 sale (~6%)
- Best customer experience (Stripe Checkout has 1-click Apple Pay / Google Pay / Link)
- Full control over flow + UI + emails
- Customer Portal for self-service cancellations/upgrades
- Stripe Tax handles US sales tax for ~0.5% (still you-as-merchant but tax compliance simplified)

**Cons:**
- **You are the merchant of record** -- responsible for US sales tax in every state you have nexus, EU VAT registration if/when you cross threshold, GST in registered jurisdictions
- Most setup work of the three (serverless function, webhook handler, license key state machine)
- Stripe Tax adds ~0.5% but only handles US -- international VAT/GST is on you
- Compliance overhead grows with revenue; what's free at $1k MRR becomes a part-time job at $100k MRR

**Best for:** if you're already comfortable being a merchant-of-record (or willing to wire Stripe Tax + a service like TaxJar) and want to maximize unit economics. Best for high volume; overkill at <100 customers.

## Recommendation

**Pick Option B (LemonSqueezy)** for the Chronos launch.

Reasoning:
1. **The biggest current risk is tax compliance, not transaction fees.** Solo founder selling globally + privacy-positioned product (lawyers / consultants in many jurisdictions) means EU VAT is real. LS as merchant-of-record removes that risk for the same effective ~10% as Gumroad.
2. **Fees converge at this price point.** Gumroad 10%, LS ~10%, Stripe ~6% + tax tooling fees + your time. The Stripe arbitrage isn't worth the compliance overhead until MRR justifies it.
3. **Subscription mechanics are first-class on LS.** Chronos Pro is monthly/annual recurring; LS handles dunning, prorations, plan changes natively. Gumroad does too but with less polish.
4. **Switchable later.** All three options use a license-key webhook pattern. Moving from LS to Stripe later is "rewrite the webhook handler" -- not a customer-facing migration.

**Fallback if Option B is wrong for you:**
- If you anticipate >$10k MRR within 6 months and have appetite for tax-compliance work -> **Option C (Stripe)**
- If you want it live tomorrow with zero ongoing platform fees -> **Option A (Gumroad)**

## What flips when you pick

The mailto-driven Pro/Enterprise CTAs in the HTML are at these lines (master @ this writeup):

| File | Line | Current |
|---|---|---|
| `index.html` | ~546 (final-cta) | `<a href="mailto:sales@chronos-timekeeping.com" class="btn-secondary">Contact Sales</a>` |
| `pricing.html` | ~148 (Pro card) | `<a href="mailto:sales@chronos-timekeeping.com?subject=Pro%20Subscription" class="btn-pricing">Get Started</a>` |
| `pricing.html` | ~169 (Enterprise card) | `<a href="mailto:sales@chronos-timekeeping.com?subject=Enterprise%20Inquiry" class="btn-pricing">Contact Sales</a>` |
| `pricing.html` | ~213 (final-cta) | `<a href="mailto:sales@chronos-timekeeping.com" class="btn-primary">Get Started</a>` |

For Enterprise specifically, I recommend keeping the mailto -- enterprise sales benefit from a human first-touch. Only the Pro CTAs need to flip to checkout.

The Plausible custom event for tracking conversions:
```javascript
plausible('CTAClick', { props: { location: 'pricing-page' | 'hero' | 'final-cta', plan: 'pro' | 'enterprise' }})
```
That fires on click; the actual paid conversion fires on the checkout success page (Stripe/LS/Gumroad return URL) via a separate `plausible('PaidConversion', {...})` call.

## Open questions for Jordan

1. Which option above? (A / B / C / something else)
2. If LS or Stripe: do you want the annual plan ($99.99) and monthly plan ($9.99) as separate buttons, or a toggle on the pricing card?
3. License key delivery: simple email with a key the desktop app validates against a local check, or full online-license server (more work but supports remote revoke / device limits)?
4. Refund policy text to add to checkout: 14-day money-back? 30-day? None?
