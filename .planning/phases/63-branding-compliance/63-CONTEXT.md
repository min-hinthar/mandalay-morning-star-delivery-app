# Phase 63: Branding & Compliance - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Homepage communicates app purpose clearly and links to required legal pages for Google OAuth brand verification. Update privacy policy and terms of service to comprehensively cover all data practices. Create a full footer for public pages. Prepare for Google OAuth verification submission.

</domain>

<decisions>
## Implementation Decisions

### Homepage Messaging
- Tone: Professional + warm & personal — blend of credibility and family-run charm
- Emphasize all three: meal subscription service, authentic Burmese cuisine, local LA delivery
- Full business name: "Mandalay Morning Star Burmese Kitchen"
- Show physical address on homepage (address already in codebase — Claude finds it)
- Business has a physical location (not delivery-only)
- Existing brand assets (logo, colors, images) — no new assets needed
- Testimonials/social proof already on homepage — keep as-is
- Food photos/menu preview already on homepage — keep as-is
- Claude drafts all homepage copy
- Claude decides: whether to add "about" section, CTA, how-it-works steps, business detail level (delivery days/pricing), Google Sign-in mention, contact info display

### Legal Page Content
- Both /privacy and /terms pages already exist — update content comprehensively
- Full branded pages — match app's design system (header, footer, proper layout)
- Update content to cover all data practices:
  - **Google OAuth:** Explicitly mention Google account data accessed (name, email, profile photo) and how it's used
  - **Sentry:** Disclose error monitoring, session replays, and data captured
  - **Vercel Speed Insights:** Mention web analytics and performance monitoring
  - **Stripe:** Mention Stripe processes all payments, defer to Stripe's terms
  - **Resend:** Transactional email service
- Data sharing: Only service providers (Stripe, Resend, Sentry, Vercel) — no selling or external sharing
- Effective date: Current date (2026-02-14)
- Contact email: Use existing email from codebase
- Governing law: California (business is in Los Angeles)
- Food allergy/liability disclaimer: Include in Terms of Service
- Claude decides: CCPA/CPRA applicability, age restrictions policy, refund/cancellation policy placement, cookie policy coverage

### Footer/Nav Link Placement
- Homepage already has a footer
- Full footer: legal links, contact info, business listings, hours, copyright, attribution
- Business listings: Yelp, Google Maps, Uber Eats, DoorDash, GrubHub (Claude searches for URLs during implementation)
- Business hours: Already in codebase — display in footer
- Copyright: "© 2026 Mandalay Morning Star Burmese Kitchen"
- Attribution tagline: "Cooked with Love ❤️ for the Burmese 🇲🇲 Community of Los Angeles 🐻" (Myanmar flag SVG, California bear/flag SVG)
- Footer scope: Public pages only (homepage, /menu, /privacy, /terms) — not in the logged-in app
- Login page: Add "By signing in you agree to our Privacy Policy and Terms" with links
- Match existing app design language
- Claude decides: footer layout (columns vs stacked), responsive mobile behavior

### OAuth Verification Submission
- App is already published (not in testing mode) — may show 'unverified app' warning
- Only email + profile scopes expected (Claude confirms from codebase)
- No demo video available
- Developer/support email: Use existing from codebase
- Claude checks: consent screen configuration, logo upload status, current warning behavior
- Claude decides: whether to provide console update guidance vs code-only, checklist format

### Claude's Discretion
- Homepage "about" section presence and content
- CTA design and placement
- "How it works" steps section
- Level of business detail (delivery days, pricing)
- Google Sign-in mention in copy
- Contact info display approach
- CCPA/CPRA inclusion
- Age restriction policy
- Refund/cancellation placement
- Cookie policy in privacy page
- Footer column layout and responsive behavior
- OAuth console guidance format
- Whether consent screen checklist is needed

</decisions>

<specifics>
## Specific Ideas

- Footer attribution: "Cooked with Love ❤️ for the Burmese 🇲🇲 Community of Los Angeles" — with heart emoji, Myanmar flag SVG, and California flag/bear SVG
- Business listings in footer: Yelp, Google Maps, Uber Eats, DoorDash, GrubHub (not traditional social media)
- Login page must include privacy/terms agreement text with links
- Privacy policy should explicitly name Google, Sentry, Vercel, Stripe, Resend as data processors

</specifics>

<deferred>
## Deferred Ideas

- Cookie consent banner — new UI capability, should be its own implementation task (possibly added to Phase 66 backlog)

</deferred>

---

*Phase: 63-branding-compliance*
*Context gathered: 2026-02-14*
