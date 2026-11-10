# Analytics

The site is wired for **Plausible Analytics** (privacy-first, no cookies, GDPR/CCPA-compliant by default, no banner required, ~50x lighter than Google Analytics on the wire).

## Why Plausible (not GA4)

Plausible aligns with the product's privacy pitch. Chronos's whole value prop is "we don't send your data anywhere"; pairing that with Google Analytics on the marketing site reads as inconsistent. Plausible:

- No cookies -> no consent banner required in EU/UK/CA
- No personal data collection -> no privacy policy update needed
- Open-source, optionally self-hostable (Plausible Community Edition)
- Public dashboard URL option (you can share traffic + conversions without giving access)
- ~1KB script vs. GA4's ~50KB

Cost: 30-day free trial on Plausible Cloud, then $9/mo for up to 10k pageviews; self-hosted is free if you have a Docker host.

## Setup (Plausible Cloud)

1. Sign up at https://plausible.io and create a site for `chronos-timekeeping.com`.
2. Verify the snippet is firing -- the script tag is already in `index.html` and `pricing.html` `<head>`:
   ```html
   <script defer data-domain="chronos-timekeeping.com"
           src="https://plausible.io/js/script.outbound-links.js"></script>
   ```
3. Wait for traffic. Dashboard at https://plausible.io/chronos-timekeeping.com.

## Custom events

The snippet variant we ship (`script.outbound-links.js`) auto-tracks outbound link clicks (every Download for X / Get Started / mailto). For richer funnel measurement, fire custom events from JS:

```html
<a href="..." onclick="plausible('Download', { props: { platform: 'windows' }})">Download for Windows</a>
```

Suggested events to add later:
- `Download` with `platform` prop (windows/macos/linux)
- `EmailCaptureSubmit` (when the Buttondown form below is wired)
- `CTAClick` with `location` prop (hero / final / pricing-page)
- `DemoPlay` (when the hero demo is added)

These map to Plausible "Goals" so you can see conversion rate per traffic source.

## Self-hosting (Plausible Community Edition)

If you want to skip the $9/mo: https://github.com/plausible/community-edition

Same snippet -- change the `src` to your self-hosted URL:
```html
<script defer data-domain="chronos-timekeeping.com"
        src="https://your-plausible-domain/js/script.outbound-links.js"></script>
```

## GA4 alternative (if you prefer it)

If you want Google Analytics 4 instead (richer integration with Search Console + Google Ads, but worse privacy story), replace the Plausible block with:

```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

You'll need:
- A GA4 property created at https://analytics.google.com
- A privacy policy update (cookies + data collection disclosure)
- A consent banner for EU/UK/CA traffic (`cookieyes`, `klaro`, or hand-rolled)

## What to track once analytics is live

Per the advert-claw measurement playbook, the metrics that matter (in priority order):
1. **Paid conversions** -- the only outcome that monetizes. Tag at the checkout success page once the flow is automated.
2. **Email signups** -- the leading indicator. The Buttondown form will fire this.
3. **Downloads** -- the trial activations (already wired via outbound-links).
4. **Source attribution** -- which channels (SEO, Reddit, X, LinkedIn) drive each of the above. Plausible's UTM and referrer panels handle this automatically.

UTM-tagged inbound links (`?utm_source=reddit&utm_medium=post&utm_campaign=chronos-v2`) show up automatically in Plausible's "Sources" view.
