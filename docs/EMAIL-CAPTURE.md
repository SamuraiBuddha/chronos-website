# Email Capture

The site has a "not-ready-to-buy" email capture form between the FAQ and final CTA sections, wired to **Buttondown** (free tier: up to 1,000 subscribers, no card required).

## Why Buttondown

- **Free tier is real** -- 1k subscribers, no daily limit, no Buttondown branding on emails
- **Solo-founder ergonomics** -- no team/agency overhead, no learning curve
- **Built-in API + webhook** -- can fire into the OutcomeLedger later for attribution
- **No tracking pixels by default** -- consistent with Chronos's privacy posture
- **Markdown-native** -- write updates the same way you write code

Alternatives if Buttondown doesn't fit:
- **Resend** -- transactional + lists, generous free tier (3k/mo, no subscribers cap), better for product emails than newsletter
- **EmailOctopus** -- 2.5k subscribers free, more traditional newsletter UI
- **ConvertKit** -- 10k subscribers free with paid creator network features

## Setup

1. Sign up at https://buttondown.com (free plan).
2. Pick a username. Suggested: `chronos-timekeeping` (matches the domain). Note: this is your **public** URL slug (`buttondown.com/chronos-timekeeping`), not a private identifier.
3. Find-replace `YOUR_BUTTONDOWN_USERNAME` -> your-chosen-username in `index.html`:
   - The `action="..."` URL on the form (line ~545)
   - The `onsubmit` `window.open(...)` URL (same block)
4. Verify the form: visit the deployed site, submit a test email, check Buttondown's "Subscribers" tab.
5. Optional: set up a welcome email in Buttondown -> Automations.

That's it. The form is `<form method="post">` with no JavaScript dependency for the submit -- works even if Plausible / other scripts fail.

## What gets sent to Plausible

When the form is submitted, the `onsubmit` handler fires a Plausible custom event:
```javascript
plausible('EmailCaptureSubmit', { props: { location: 'newsletter-section' } })
```
This appears in the Plausible dashboard under "Goals" once you configure the goal (Plausible settings -> Goals -> Add `EmailCaptureSubmit`).

## CSS

The form's styles are inlined in a `<style>` block inside the section in `index.html`. Theme colors (indigo `#6366f1`) match the existing brand. Move to `assets/css/styles.css` if you prefer centralizing styles -- nothing else depends on the inline block.

## Adding more capture points

Future placements worth A/B testing (via Plausible Goals):
- **Hero section** -- subtle "get notified when X" line under the primary CTA, captures top-of-funnel
- **Pricing page** -- for visitors who hit pricing but bounce without downloading or contacting sales
- **Footer** -- always-visible small form, captures back-of-page scrollers

Each capture point should pass a distinct `location` prop to Plausible so you can see which one converts best.

## Reading the metric

In Plausible:
1. Settings -> Goals -> Add "EmailCaptureSubmit" as a custom event goal
2. Dashboard now shows "EmailCaptureSubmit" rate next to pageviews
3. Filter by source (Reddit / X / Direct) to see which channels actually deliver subscribers

In Buttondown:
- "Analytics" tab shows subscriber growth, open rates per send, click rates
- "Subscribers" tab shows the email list (exportable CSV anytime)

## Privacy / TOS notes

The form collects an email address only -- nothing else. No first/last name, no company, no source. Buttondown is the data processor; their privacy policy covers GDPR/CCPA. Update the site's privacy policy to mention "we use Buttondown to send occasional product updates; see https://buttondown.com/legal/privacy" before promoting traffic.
