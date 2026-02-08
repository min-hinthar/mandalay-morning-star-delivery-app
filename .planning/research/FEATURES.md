# Feature Research: v1.6 Production Polish

**Domain:** Premium food delivery PWA -- final production polish before public launch
**Researched:** 2026-02-07
**Confidence:** HIGH (verified against codebase + competitive analysis)

## Current State Assessment

Before defining new features, here is what already exists:

| Area | Current State | Polish Level |
|------|---------------|-------------|
| Auth (login/signup) | Magic link only, plain Card layout, no branding/animation | Bare functional |
| Account/Settings | Tabs: Profile (name/phone), Orders (history), Addresses (CRUD), Payment (placeholder) | Functional, no settings |
| Email notifications | Webhook calls `send-order-confirmation` Edge Function (likely stub/unimplemented) | Stub only |
| Cart validation | Server-side `validateCartItems` checks `is_active`, `is_sold_out`, modifier availability | Backend done, no client-side UX |
| 404 page | 3 lines: heading + text, no branding, no navigation | Bare minimum |
| Error page | Card with AlertTriangle, Retry/Home buttons, Sentry integration | Functional, generic |
| Search/Command Palette | cmdk-based, fuzzy matching, recent searches, popular items, spring animations | 80% complete |
| Admin pages | Functional tables/forms, basic `animate-pulse` loading, no micro-interactions | Functional, unpolished |
| Driver pages | Skeleton loading, Suspense boundaries, route tracking, high-contrast mode | Mostly polished |

---

## Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unprofessional at launch.

### 1. Branded Auth Experience

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| Brand logo/mascot on login/signup | Every premium app has branded auth; current plain text feels like a prototype | LOW | Existing `BrandMascot` component |
| Social login (Google + Apple) | DoorDash, Uber Eats, Deliveroo all offer social login; 60%+ users prefer it | MEDIUM | Supabase Auth Google/Apple providers |
| Animated form transitions | Current static forms clash with app's "over-the-top animated" philosophy | LOW | Existing Framer Motion setup |
| "Check your email" magic link confirmation screen | Users need clear feedback after magic link send; current success message is easy to miss | LOW | None |
| Forgot password flow polish | Page exists but likely matches the bare login/signup style | LOW | Existing `/forgot-password` route |

**Competitive baseline (HIGH confidence):**
- **DoorDash:** Email/password + Google + Apple + Facebook login. Clean branded screen with logo.
- **Uber Eats:** Phone number primary + Google + Apple. Full-bleed hero image behind auth form.
- **Deliveroo:** Email + Google + Apple + Facebook. Animated onboarding carousel before auth.
- All three use single sign-on (SSO) for frictionless signup -- Google One Tap is particularly effective.

**Supabase supports Google and Apple social login natively.** Configuration requires:
- Google: OAuth credentials from Google Cloud Console
- Apple: App ID + Services ID from Apple Developer Portal
- Both use `signInWithOAuth` from `@supabase/supabase-js`

### 2. Order Confirmation Email

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| Branded order confirmation email | Every food delivery app sends this; highest-opened email type (>70% open rate) | MEDIUM | Resend + React Email |
| Order details in email (items, totals, delivery window) | Users reference this email to know when food arrives | LOW | Order data already in DB |
| Delivery address in email | Confirms correct delivery location | LOW | Address data in order |
| Order number for reference | Support reference, reorder | LOW | Order ID exists |

**Competitive baseline (HIGH confidence):**
- Order confirmation emails are the #1 transactional email by open rate (>70%)
- Must arrive within seconds of payment
- Must include: order number, item list with quantities, pricing breakdown, delivery window, delivery address, support contact
- Premium apps add: estimated delivery countdown, "track your order" CTA button, brand-consistent design

**Implementation path (HIGH confidence):**
- Stripe webhook already calls `sendOrderConfirmationEmail(orderId)` via Supabase Edge Function
- Use **Resend + React Email** for templated transactional emails
- Supabase has official Resend integration via Auth send-email hooks
- React Email provides component-based templates (no table-layout HTML)
- Resend free tier: 3,000 emails/month (sufficient for launch)

### 3. Cart Validation UX (Client-Side)

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| Show validation errors in cart/checkout UI | Server validates but errors return as generic API errors; user sees cryptic message | MEDIUM | Existing `CheckoutErrorCode` types |
| Sold-out item visual indicator in cart | User should see which specific item is problematic, not just "something is wrong" | LOW | Cart store + menu data |
| Stale price warning | If price changed since item was added, user should be informed before paying | MEDIUM | Compare cart `basePriceCents` vs current DB price |
| Remove/replace unavailable items inline | User should be able to fix cart issues without leaving checkout flow | LOW | Cart store `removeItem` exists |

**Competitive baseline (HIGH confidence):**
- **DoorDash:** Shows inline "Item unavailable" badge, grays out item, suggests removal
- **Uber Eats:** Real-time menu sync, items marked "Currently unavailable" before adding
- **Instacart (grocery model):** Replacement preferences for out-of-stock items
- All apps validate cart at checkout time and show item-specific error messages

**Current codebase advantage:** Server-side validation already handles `ITEM_UNAVAILABLE`, `ITEM_SOLD_OUT`, `MODIFIER_UNAVAILABLE` with item-level `itemIndex`. The gap is purely client-side UX -- translating these structured errors into user-friendly inline feedback.

### 4. Branded 404 Page

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| Brand-consistent 404 with mascot | Current 404 is 3 lines of text; feels broken, not branded | LOW | `BrandMascot` component |
| Helpful navigation (home, menu, orders) | Users hitting 404 need escape routes | LOW | None |
| Search suggestion or menu link | Convert lost users into active users | LOW | Existing search/menu routes |

**Competitive baseline (MEDIUM confidence):**
- Premium apps use branded illustrations, playful copy, and clear CTAs
- Wendy's: Built an entire branded game into their 404 page
- Food delivery apps typically show food-related illustration + "Let's get you back on track"
- Best practice: match brand tone (playful for MMS) + provide 2-3 navigation options

### 5. Customer Settings/Preferences

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| Notification preferences toggle | Users expect control over push/email notifications | MEDIUM | Push notification system (if exists) |
| Dietary restrictions/allergies profile | Food apps should know about allergies; safety and personalization | MEDIUM | New DB field on `profiles` |
| Default delivery address | Save time on repeat orders | LOW | Already exists (addresses with `is_default`) |
| Delivery instructions default | "Leave at door" etc. -- users set once, applies to all orders | LOW | New DB field on `profiles` |
| Language preference (English/Burmese) | Burmese cuisine app with bilingual menu data (`name_en`/`name_my`) | MEDIUM | Menu already has bilingual fields |

**Competitive baseline (HIGH confidence):**
- **DoorDash:** Notification settings (push + email + SMS), dietary preferences, default tip, delivery instructions
- **Uber Eats:** Privacy controls (data sharing with delivery), notification preferences, communication preferences
- **All apps:** Saved addresses with default, saved payment methods, order history with reorder

**Current gap:** Account page has Profile (name/phone), Orders, Addresses, Payment (placeholder). No settings tab for preferences, notifications, or dietary needs.

---

## Differentiators (Competitive Advantage)

Features that set the product apart. Not required for launch, but elevate the "over-the-top animated" brand identity.

### 1. Premium Auth Animations

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Animated background on auth pages (floating food illustrations) | Unique brand moment; most competitors have static backgrounds | MEDIUM | Use Framer Motion `m.div` with gentle float animations |
| Logo morph animation on successful login | Delightful transition from auth to app; memorable first impression | MEDIUM | AnimatePresence exit + page transition |
| Social proof counter ("Join 500+ families") | Builds trust for new signups; subscription model benefits from community feel | LOW | Static or dynamic counter from DB |
| Animated "magic link sent" confirmation with envelope animation | Current success message is plain text; animation makes it feel premium | LOW | Lottie or Framer Motion sequence |

### 2. Polished Admin/Driver Page Details

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Skeleton shimmer loading (replace `animate-pulse`) | Shimmer > pulse for premium feel; current admin pages use basic pulse | LOW | CSS shimmer gradient animation |
| Animated status badge transitions | When order status changes, badge should animate (scale + color morph) | LOW | Framer Motion `layoutId` on badges |
| Hover micro-interactions on table rows | Subtle lift/glow on hover for admin tables | LOW | CSS `hover:translate-y-[-1px] hover:shadow-md` |
| Animated number counters on dashboard stats | Numbers count up from 0 on mount; standard premium dashboard pattern | LOW | Framer Motion `useMotionValue` + `useTransform` |
| Toast notifications with slide-in animation | Consistent notification pattern across admin/driver | LOW | Likely already exists via toast system |
| Empty state illustrations | "No orders yet" with branded illustration vs plain text | MEDIUM | Custom SVG or Lottie illustrations |

### 3. Enhanced Search Experience

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Fuzzy matching with typo tolerance | Current search uses `.includes()` -- "mohiga" won't find "Mohinga" | MEDIUM | Use Fuse.js or similar fuzzy library |
| Category-scoped search results | Group results by category (Soups, Rice, Snacks) | LOW | Category data exists in menu |
| Keyboard shortcut hint in search trigger | "Cmd+K" badge on search icon; power-user signal | LOW | CSS badge component |
| Search result image thumbnails | Show food photo in results; current results may be text-only | LOW | `imageUrl` exists on MenuItem |
| "Did you mean..." suggestions for zero results | Convert zero-result searches into discoveries | MEDIUM | Levenshtein distance on menu item names |

### 4. Error Page with Personality

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Animated mascot expression (confused/sad) on error pages | Brand mascot with contextual expressions; `BrandMascot` already supports `MascotExpression` | LOW | `BrandMascot` has expression prop |
| Animated background on error (subtle, non-distracting) | Warm gradient animation matching brand; prevents "dead page" feeling | LOW | CSS gradient animation |
| Contextual error messaging | "We dropped the plate" for 404 vs "Kitchen fire" for 500 | LOW | Copy only |
| Animated transition back to safety | Smooth page transition when clicking "Go Home" | LOW | Existing page transition system |

### 5. Cancellation + Refund Notification Emails

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cancellation confirmation email | Users need written confirmation when order is cancelled | MEDIUM | Hook into order status webhook |
| Refund processed email | Users need confirmation when refund hits their account | MEDIUM | Hook into `charge.refunded` webhook |
| Delivery scheduled reminder email | "Your order arrives tomorrow" reminder for weekly subscribers | MEDIUM | Cron job or scheduled function |

---

## Anti-Features (Deliberately NOT Building for v1.6)

Features that seem good but create problems at this stage.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time cart price sync (WebSocket) | Keeps cart always current | Massive complexity for weekly menu model; prices rarely change mid-week | Validate at checkout time (already built); show inline error if stale |
| OAuth with Facebook/Twitter | More social login options | Declining usage, privacy concerns, complex setup, Facebook API instability | Google + Apple covers 90%+ of social login demand |
| Full notification preferences system | Granular control over every notification type | No push notification system exists yet; building preferences UI before the notification system is backward | Ship with email-only notifications; add preferences when push notifications are built |
| Multi-language UI (i18n framework) | Burmese-speaking users | Full i18n is a v2.0 concern; menu items already bilingual; UI chrome in English is fine for LA market | Bilingual menu display (already built); defer full i18n to v2.0 |
| Password-based auth | Some users prefer passwords | Magic link + social login is more secure; passwords create support burden (resets, breaches); Supabase magic link is proven | Keep magic link + add Google/Apple social; passwordless is the 2025+ trend |
| Chat support widget | Users expect support | Third-party widget (Intercom, Crisp) adds 200KB+ JS, hurts LCP; small operation doesn't need real-time chat | Support email link in footer; FAQ page; error pages with contact info |
| Animated onboarding carousel | Premium first-run experience | Scope creep for v1.6; users on meal subscription already know what they're signing up for | Branded auth pages + clear value prop copy is sufficient |
| Payment methods management in account | Users expect to manage cards | Stripe Checkout handles payment; saved cards are managed by Stripe, not by us | Link to Stripe Customer Portal for card management |
| Admin real-time order notifications (WebSocket) | Admin wants instant alerts | WebSocket infrastructure is complex; polling or Supabase Realtime subscription is simpler | Use Supabase Realtime subscription (already available) or polling with manual refresh (already built) |

---

## Feature Dependencies

```
Social Login (Google/Apple)
    requires -> Supabase Auth provider config (env vars, OAuth setup)
    requires -> Callback URL handler

Order Confirmation Email
    requires -> Resend account + API key
    requires -> React Email template components
    requires -> Supabase Edge Function (send-order-confirmation)
    enhances -> Stripe webhook (already calls sendOrderConfirmationEmail)

Cart Validation UX
    requires -> Existing validateCartItems error codes (already done)
    requires -> Checkout error display component (new)
    enhances -> Checkout flow (existing)

Customer Settings
    requires -> Profile DB schema additions (dietary, delivery_instructions)
    requires -> New "Settings" tab in AccountClient
    enhances -> Account page (existing)

Branded 404
    requires -> BrandMascot component (already exists)
    independent -- no other dependencies

Auth Page Polish
    requires -> BrandMascot component (already exists)
    requires -> Framer Motion (already installed)
    independent -- no other dependencies

Admin/Driver Polish
    independent -- pure UI enhancement
    enhances -> All admin/driver pages (existing)

Search Enhancements
    requires -> Fuse.js or similar (new dependency)
    enhances -> CommandPalette (existing)

Email Templates (cancellation, refund)
    requires -> Order Confirmation Email (template system must exist first)
    requires -> Webhook handlers (already exist for charge.refunded, checkout.session.expired)
```

### Dependency Notes

- **Order Confirmation Email requires Resend setup first:** All email features depend on establishing the Resend + React Email pipeline. Do this before cancellation/refund emails.
- **Social Login requires external provider setup:** Google Cloud Console + Apple Developer Portal configuration needed before code changes.
- **Cart Validation UX is pure frontend:** Backend validation already complete; this is UI work only.
- **Customer Settings requires DB migration:** New columns on `profiles` table for dietary restrictions and delivery instructions.

---

## v1.6 Launch Priorities

### P1: Must Ship (Production Blockers)

- [ ] **Branded auth pages** -- Current auth looks like a prototype; first impression matters
- [ ] **Order confirmation email** -- Users expect email confirmation after payment; highest-opened email type
- [ ] **Cart validation UX** -- Backend validates but user sees cryptic errors; checkout confidence issue
- [ ] **Branded 404/error pages** -- Current 404 is 3 lines of text; breaks premium illusion
- [ ] **Social login (Google + Apple)** -- 60%+ users prefer social login; reduces signup friction

### P2: Should Ship (Polish That Matters)

- [ ] **Customer settings tab** -- Dietary restrictions + delivery defaults for repeat order experience
- [ ] **Admin/driver skeleton shimmer** -- Replace `animate-pulse` with shimmer for premium feel
- [ ] **Search fuzzy matching** -- Current `.includes()` misses typos; Burmese dish names are hard to spell
- [ ] **Auth page animations** -- Floating food illustrations, mascot, animated transitions
- [ ] **Error page personality** -- Mascot expressions, playful copy, animated recovery

### P3: Nice to Have (Post-Launch)

- [ ] **Cancellation/refund emails** -- Important but not blocking launch
- [ ] **Animated number counters on dashboards** -- Polish detail
- [ ] **"Did you mean..." search suggestions** -- Edge case improvement
- [ ] **Delivery reminder emails** -- Requires scheduling infrastructure
- [ ] **Empty state illustrations** -- Custom SVG work needed

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Order confirmation email | HIGH | MEDIUM | P1 |
| Social login (Google + Apple) | HIGH | MEDIUM | P1 |
| Branded auth pages | HIGH | LOW | P1 |
| Cart validation UX | HIGH | MEDIUM | P1 |
| Branded 404/error pages | MEDIUM | LOW | P1 |
| Customer settings tab | MEDIUM | MEDIUM | P2 |
| Search fuzzy matching | MEDIUM | LOW | P2 |
| Admin skeleton shimmer | LOW | LOW | P2 |
| Auth animations (premium) | MEDIUM | MEDIUM | P2 |
| Error page personality | LOW | LOW | P2 |
| Cancellation/refund emails | MEDIUM | MEDIUM | P3 |
| Dashboard number animations | LOW | LOW | P3 |
| Search "Did you mean..." | LOW | MEDIUM | P3 |
| Delivery reminder emails | MEDIUM | HIGH | P3 |

## Competitor Feature Analysis

| Feature | DoorDash | Uber Eats | Deliveroo | Morning Star (Current) | Morning Star (v1.6 Target) |
|---------|----------|-----------|-----------|----------------------|---------------------------|
| Social login | Google, Apple, Facebook | Google, Apple | Google, Apple, Facebook | None | Google + Apple |
| Auth branding | Logo + clean layout | Full-bleed image | Animated carousel | Plain text heading | Mascot + animations |
| Order confirmation email | Rich HTML, tracking link | Rich HTML, ETA | Rich HTML, map | Stub/none | Branded React Email |
| Cart validation | Inline badges, gray-out | Real-time sync | Inline warnings | Server errors only | Inline error display |
| 404 page | Branded illustration | Branded illustration | Branded illustration | 3 lines of text | Mascot + navigation |
| Settings | Notifications, dietary, defaults | Privacy, notifications | Notifications, dietary | Name + phone only | Dietary, defaults, notifications |
| Search | Fuzzy, categories, images | AI-powered, trending | Fuzzy, filters | cmdk + includes() | Fuse.js fuzzy + categories |
| Admin polish | N/A (merchant portal) | N/A (merchant portal) | N/A (merchant portal) | Basic pulse loading | Shimmer + micro-interactions |

## Sources

### Auth & Social Login
- [Supabase Social Login Docs](https://supabase.com/docs/guides/auth/social-login) -- HIGH confidence
- [Supabase Google Login](https://supabase.com/docs/guides/auth/social-login/auth-google) -- HIGH confidence
- [Supabase Apple Login](https://supabase.com/docs/guides/auth/social-login/auth-apple) -- HIGH confidence
- [Passwordless Authentication Ecommerce 2026](https://www.nopaccelerate.com/passwordless-authentication-ecommerce-2026/) -- MEDIUM confidence

### Email Notifications
- [Supabase + Resend Auth Email Hook](https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend) -- HIGH confidence
- [Resend Supabase Integration](https://resend.com/supabase) -- HIGH confidence
- [Order Confirmation Email Best Practices - Klaviyo](https://www.klaviyo.com/blog/order-confirmation-email-tips-examples) -- MEDIUM confidence
- [Transactional Email Best Practices 2026 - Moosend](https://moosend.com/blog/transactional-email-best-practices/) -- MEDIUM confidence
- [Order Confirmation Emails 2026 - Moosend](https://moosend.com/blog/order-confirmation-emails/) -- MEDIUM confidence

### Cart Validation & Checkout UX
- [Ecommerce Checkout UX Best Practices 2026 - Design Studio](https://www.designstudiouiux.com/blog/ecommerce-checkout-ux-best-practices/) -- MEDIUM confidence
- [Baymard Food Delivery UX Research](https://baymard.com/blog/food-delivery-takeout-launch) -- HIGH confidence
- [DoorDash Item Unavailable Help](https://help.doordash.com/dashers/s/article/Item-has-run-out-is-unavailable) -- HIGH confidence

### 404 & Error Pages
- [Best 404 Pages - Digital Silk](https://www.digitalsilk.com/digital-trends/best-404-pages/) -- MEDIUM confidence
- [404 Pages E-commerce - Amasty](https://amasty.com/blog/best-404-page-examples-in-e-commerce/) -- MEDIUM confidence

### Search UX
- [Search UX Best Practices 2026 - Design Monks](https://www.designmonks.co/blog/search-ux-best-practices) -- MEDIUM confidence
- [Food Delivery App UX Design 2025 - Medium](https://medium.com/@prajapatisuketu/food-delivery-app-ui-ux-design-in-2025-trends-principles-best-practices-4eddc91ebaee) -- LOW confidence

### Settings & Preferences
- [Food Delivery App Features 2025 - HashStudioz](https://www.hashstudioz.com/blog/top-10-features-that-every-food-delivery-app-must-have/) -- MEDIUM confidence
- [Uber Eats Account Settings](https://help.uber.com/ubereats/restaurants/section/account-settings) -- HIGH confidence

---
*Feature research for: v1.6 Production Polish*
*Researched: 2026-02-07*
