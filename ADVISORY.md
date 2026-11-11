# ADVISORY -- needs Jordan

Product and marketing decisions found during the 2026-11-10 site review. None of
these were changed on the page: each is yours to call. Line numbers are against
branch `fix/review-2026-11-10`. App references are chronos-timekeeping-v2 at
v1.2.0 (read-only); backend references are chronos-license-webhook (read-only).

(ADVISORY.md is excluded from the Pages build by `_config.yml`, so this file is
not published.)

---

### D1 -- Tier contents disagree between the site and the app

- **Ask:** For each row below, which side is the truth: change the site, or
  change the app's tier gating?
- **Why it needs you:** it is pricing and packaging. Changing the site to match the
  app takes features off the $9.99 plan that buyers are being shown today;
  changing the app gives Pro buyers Enterprise features.
- **What I found:**

  | Claim on the site | Site says | App says (file) |
  |---|---|---|
  | Pro retention | pricing.html:153 `<li>Unlimited data retention</li>` | `src/main/config/stripe-config.js` professional: `'90-day data retention'`, `dataRetentionDays: 90`. Unlimited (`-1`) is the **enterprise** tier. |
  | Pro Turbo Mode | index.html:487 `Turbo Mode &amp; Vision AI classification`; pricing.html:142 `Turbo Mode (parallel detection)` | stripe-config.js feature map: `'turbo_mode': 'enterprise'`; `license-manager.js` `hasFeature()`: `enterpriseOnly = ['turbo_mode', 'vision_ai', 'cloud_backup', 'api_access']` -> true only when `e.tier === 'enterprise'`. |
  | Pro Vision AI | pricing.html:143 `<li>Vision AI classification</li>` | same list: enterprise-only. |
  | Pro REST API | index.html:492 and pricing.html:151 `<li>REST API access</li>` | same list: `api_access` enterprise-only. |
  | Enterprise team management | index.html:508 `Multi-user team management`; pricing.html:195 same | stripe-config.js `TIERS.enterprise` lists: Turbo Mode, Vision AI, Cloud backup, REST API access, Priority support, Unlimited data retention, Custom integrations. No multi-user feature. The `team_management` / `multi_user` keys exist in the feature map but nothing in the tier lists them. |
  | Enterprise admin approvals | index.html:509 `Admin dashboard with approval workflows`; pricing.html:196 | Only in the commented-out block starting `/* Future: Server/Team Edition` (`adminDashboard: true, approvalWorkflow: true`). Not shipped. |
  | Enterprise sync | index.html:511 `Bidirectional sync (LAN or WAN)`; pricing.html:198 | Not defined in any live tier (same commented-out block mentions multi-user aggregation only). |
  | Trial scope | index.html:445 and pricing.html:98 `All three detection methods`; trial card lists `Up to 3 projects` | `TIERS.trial.features`: `'Window title detection'`, `Up to 3 projects`, retention 30 days, CSV only. But `license-manager.js` resolves an active trial to `tier: 'professional'`, so a trial user actually gets the Pro set minus nothing the code gates. The two files in the app disagree with each other too. |
  | Plan comparison | pricing.html:81 `Every feature included in Pro`; pricing.html:232 `Every detection and tracking feature is identical between plans.` | contradicted by the enterprise-only gates above. |

- **If you say "the app is the truth":** I move Turbo Mode, Vision AI, REST API,
  "Unlimited retention" (-> "90-day retention") off Pro and onto Enterprise on
  index.html and pricing.html, drop or relabel the three team features as
  "coming soon / Team Edition", fix the plan-comparison sentences, and word the
  trial as "Pro features for 7 days".
- **If you say "the site is the truth":** the change is in the app, not here:
  move those four features out of the `enterpriseOnly` list and set Pro
  `dataRetentionDays: -1`; the team features then need building or removing from
  Enterprise. Tell me which and I will do the site side.

---

### D2 -- "QuickBooks and FreshBooks integration (Elite tier)"

- **Ask:** Remove the QuickBooks claim and the "Elite tier" wording, or keep them
  as a roadmap item with an honest label?
- **Why it needs you:** it is a roadmap/positioning call.
- **What I found:**
  - index.html:380 `<li>QuickBooks and FreshBooks integration (Elite tier)</li>`;
    index.html:512 and pricing.html:199 `QuickBooks &amp; FreshBooks integration`
    (Enterprise card); pricing.html:232 `accounting integrations (QuickBooks, FreshBooks)`.
  - No tier called Elite exists in the live app (`TIERS` = trial / professional /
    enterprise). `COMMERCE_USAGE_EXAMPLES.md` in the app repo has a banner saying to
    read `elite` as enterprise.
  - `git grep -i quickbooks` in the app: **no code** (only docs/marketing/roadmap files).
    The app's own `docs/STATUS.md` says "QuickBooks / Clio integration: NOT IMPLEMENTED".
  - FreshBooks **is** implemented: `src/main/freshbooks/freshbooks-api.js` (projects and
    time entries). Whether it is gated to Enterprise: the feature map has `invoicing`
    as enterprise; the FreshBooks client itself I did not trace to a gate.
- **If "remove":** delete QuickBooks everywhere, change index.html:380 to
  "FreshBooks integration" and put it on whichever tier you confirm.
- **If "keep as roadmap":** I relabel to "QuickBooks integration (planned)".

---

### D3 -- Compliance claims with no backing

- **Ask:** What wording are you willing to stand behind for legal and healthcare buyers?
- **Why it needs you:** these are legal/compliance representations; wrong wording is
  an exposure, and only you (or counsel) can accept the risk.
- **What I found:**
  - index.html:423 `Attorney-client privilege protected. HIPAA compliant by design.`
    index.html:138 and :562 JSON-LD/FAQ `Designed for attorney-client privilege and HIPAA
    compliance`; index.html:154 and :529 `attorney-client privilege fully protected`.
  - The app repo's `docs/compliance/HIPAA-Gap-Analysis.md` says **"Overall Compliance
    Status: ~51%"**. Nothing in the repos certifies HIPAA or privilege.
  - Encryption copy (index.html:289 `AES-256 encrypted local database`, :417 `Every
    database entry encrypted`, :418 `HMAC authentication detects tampering`, :493/:562
    `AES-256-GCM encrypted local database`, pricing.html:152): the app's own
    `docs/STATUS.md` "Encryption" section says **"WORKING, but opt-in and OFF by default"**:
    the live DB path reads `process.env.ENCRYPTION_KEY`; unset means
    `encrypt()/decrypt()` pass data through unchanged; the keystore-backed key manager
    is "built but not wired into the running app"; and it is GCM's auth tag, "not a
    separate HMAC construction, despite some docs saying 'HMAC authentication'".
  - legal/privacy.md:19 and :88 state local Time Data is encrypted with AES-256-GCM;
    those policy sentences have the same exposure.
- **Recommended wording (if you accept it):**
  - "Compliance Ready" card: "Built to support confidential work: your tracked data
    stays on your device and is never uploaded. Chronos is not a HIPAA-certified
    product; talk to your compliance officer about your obligations."
  - Legal-professional copy: "Designed so case-file names and time entries stay on your
    device" (drop "protected" / "fully protects").
  - Encryption: either turn it on by default in the app and keep the claim, or say
    "optional AES-256-GCM database encryption" until it is.
- **If you want it left as is:** nothing changes, and I would still flag the encryption
  claim as the one that is contradicted by the product's own status doc.

---

### D4 -- Are the buy.stripe.com links live-mode?

- **Ask:** Open the Stripe dashboard (Payment Links, **Live** mode) and confirm these two
  links exist there and charge $9.99/mo and $99.99/yr.
- **Why it needs you:** it cannot be told from outside the dashboard, and it decides
  whether customers pay real money or hit a test page.
- **What I found:**
  - assets/js/main.js:198 `proMonthly: 'https://buy.stripe.com/4gMeVf6a6bh67qo3lpao800', // Pro $9.99/mo (live)`
    and :199 `proAnnual: 'https://buy.stripe.com/3cI6oJ6a65WMfWU2hlao801' // ... (live)`.
  - docs/STRIPE-SETUP.md:33-34 list the **test** links as
    `https://buy.stripe.com/test_4gMeVf6a6bh67qo3lpao800` and
    `.../test_3cI6oJ6a65WMfWU2hlao801`: the same ids with a `test_` prefix. The doc says
    "do not paste the test Payment Links onto the live site; recreate them in live mode".
  - Identical ids after the prefix is unusual (live and test Payment Links normally get
    different ids), so either the comment "(live)" is wrong and the test prefix was
    stripped by hand, or the doc is stale. I could not distinguish these.
- **If they are test links:** replace them with the live ones (I will do the edit if you
  paste them) and add a `LIVE` guard test.
- **If they are live:** correct docs/STRIPE-SETUP.md so it stops listing them as test.

---

### D5 -- Named applications vs detectors that exist

- **Ask:** Keep the app names on the site, or re-word to "any application that opens a file"?
- **Why it needs you:** it is a positioning claim; the technical truth is nuanced.
- **What I found** (app `src/main/detectors/*`, `DETECTION_CAPABILITIES.md`):

  | Named on the site | Dedicated app profile in `turbo-detector.js` | What else exists |
  |---|---|---|
  | Revit (index.html:307, :533) | **Yes** (`appDetectors.set('revit', ...)`) | `.rvt/.rfa/.rte`, process `revit.exe` |
  | AutoCAD (index.html:307, :533) | **No** | process `acad.exe` allowlisted; `.dwg/.dxf/.dwf` extensions; generic handle enumeration |
  | Navisworks (index.html:533) | **No** | process `roamer.exe` allowlisted; `.nwd/.nwf/.nwc`; generic handle enumeration |
  | VS Code (index.html:307) | **Yes** (`vscode`) | `code.exe` |
  | Adobe (index.html:252 "Baker.pdf in Adobe") | **Yes** (`adobe`) | `.pdf` etc. |
  | Ollama (index.html:336) | n/a (AI backend, not a detector) | `docs/STATUS.md` has an Ollama section |

  So AutoCAD and Navisworks work through generic detection (file handles / extensions),
  not a tuned profile. The "95-98%" accuracy figure is Windows handle enumeration in
  general; I did not find a per-application measurement behind it.
- **Also found:** the site's docs/DETECTION_CAPABILITIES.md is a stale copy of the app's
  (a diff against the app's file is 15 insertions / 67 deletions). It is now excluded
  from publishing by `_config.yml`, so it no longer misleads anyone, but it should be
  deleted from this repo or synced; I left it because deleting a doc is your call.
- **If you want it softened:** "Revit, VS Code, Adobe and browsers get dedicated
  detectors; AutoCAD, Navisworks and everything else are tracked through file handles."

---

### D6 -- "30-day money-back guarantee" style claims

- **Ask:** None of the claim exists on the site; decide whether you *want* a refund policy.
- **Why it needs you:** refund policy is a business decision, and the backend would
  have to implement it.
- **What I found:**
  - `git grep -i -E "money-back|refund|guarantee"` over all HTML and legal files: **no
    money-back claim on the site.** The only hits are legal/terms.md:166 `No refunds.
    ... all fees are non-refundable` (terms.html:133) and unrelated "no guarantee of
    accuracy" disclaimers, plus the CSS class name `privacy-guarantee`. So the
    premise of D6 is refuted: the site promises no refunds.
  - Backend: `api/stripe-webhook.ts` handles `checkout.session.completed`,
    `customer.subscription.updated`, `customer.subscription.deleted` only. A refund or
    chargeback does not revoke a license; the backend's own ADVISORY.md (F4) already
    records this.
- **If you keep "no refunds":** nothing to do on the site; consider handling
  `charge.refunded` / `charge.dispute.created` anyway so goodwill refunds do not leave
  an active key.
- **If you want a guarantee:** tell me the terms, and I will add the copy and amend
  the "No refunds" clause (legal/terms.md:166) in the same change.
