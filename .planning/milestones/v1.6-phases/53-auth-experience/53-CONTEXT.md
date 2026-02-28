# Phase 53: Auth Experience - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Auth pages feel premium and trustworthy — branded design, social login (Google + Apple OAuth), magic link passwordless auth, and delightful animations. Purely passwordless (no password fields anywhere). Single "Sign in" page replaces separate login/signup. Forgot-password/reset-password routes removed entirely.

</domain>

<decisions>
## Implementation Decisions

### Auth Page Visual Identity

- **Mood:** Warm & inviting — soft gradients, warm tones, gentle floating food
- **Layout:** Centered card on desktop over animated background; full-width card on mobile
- **Floating food:** Medium density (10-15 generic food emojis), varied sizes for depth, keep on mobile too
- **Background gradient:** Slow animated shift between warm tones (amber → soft coral → cream)
- **Card style:** Slide up + fade entrance animation
- **Card accent:** Gradient top bar in brand colors (thin strip at top of card)
- **Logo:** Full logo + tagline at top of card
- **Heading:** Warm personalized heading — "Welcome back" / "Sign in" style
- **Theme:** Respects user's dark/light theme preference
- **Food component:** Reuse existing FloatingFoodEmojis from Phase 49

### Auth Method — Purely Passwordless

- **Magic Link:** Email field sends magic link — no password field
- **Google OAuth:** via Supabase OAuth
- **Apple OAuth:** via Supabase OAuth (required, not optional)
- **Single page:** One "Sign in" page at /login — no separate signup page (magic link auto-creates accounts for new users)
- **Removed routes:** Forgot-password and reset-password pages removed entirely

### Form Interaction & Flow

- **Email field focus:** Floating label lift + subtle warm border glow (both combined)
- **Validation:** Animated shake on invalid submit + inline error text below field
- **Submit button:** Progress animation (gradient fill) while waiting for magic link to send
- **Social proof:** Static placeholder counter ("Trusted by local families") — ready to swap with Google Places API data later
- **Legal links:** "By continuing, you agree to our Terms and Privacy Policy" at card bottom — create placeholder /terms and /privacy pages

### Social Login Presentation

- **Order:** Email magic link first → "or continue with" divider → social buttons below
- **Section label:** "Quick sign in" label above social buttons
- **Button layout:** Icon-only rounded rectangles, Google and Apple side by side
- **Button order:** Google first (left), Apple second (right)
- **Google button style:** Claude's discretion (balance Google guidelines with app style)
- **Apple button style:** Claude's discretion (balance Apple HIG with visual harmony)
- **Hover effect:** Scale up + shadow + border glow on hover
- **Tooltips:** Show provider name tooltip on hover/long-press
- **OAuth loading:** Full page overlay with "Redirecting to Google/Apple..." on button click
- **OAuth error:** Toast notification (non-intrusive, auto-dismiss)

### Magic Link Confirmation

- **Transition:** In-place card transformation (no page change)
- **Email display:** Show user's email ("We sent a link to john@example.com")
- **Envelope animation:** Multi-stage — envelope floats in, pulses/glows while waiting, opens with sparkle when link is clicked
- **Resend:** Immediately available button with 60-second countdown timer between sends
- **Back option:** "Use a different email" link with animated transition back to form
- **Spam hint:** "Don't see it? Check your spam folder" appears after 15-20 second delay
- **Expired link:** Friendly error page with one-tap "Send a new link" button

### Login Success Ceremony

- **Transition:** Logo-to-layout morph — logo icon transforms/morphs into app header logo position
- **Duration:** Medium (2-3 seconds)
- **Personalization:** Shows user's name and Google avatar if available ("Welcome, John!")
- **Consistency:** Same logo morph for both OAuth and magic link flows
- **New vs returning:** Same experience for all users

### Branded Magic Link Email

- Custom branded email template via Supabase (Morning Star branding, warm colors, logo)
- Not using Supabase default email

### Claude's Discretion

- Card surface treatment (frosted glass vs solid — optimize for readability)
- Google/Apple button styling within brand guidelines
- Exact animation curves and timing
- Loading state micro-interactions
- Error state handling details
- Social proof counter exact wording

</decisions>

<specifics>
## Specific Ideas

- "Warm & inviting — feels like coming home" as the guiding aesthetic
- Use `/frontend-design` skill for all UI implementation
- Envelope animation is multi-stage (float → pulse → open+sparkle) not a single animation
- Logo morph is the premium touch — logo icon position-morphs into the app header
- Social buttons are compact icon-only pills side by side, not full-width stacked buttons

</specifics>

<deferred>
## Deferred Ideas

- **Google Places API for social proof counter** — query actual reviews/count from Google Places API. Currently using static placeholder. Add as a future phase.
- **Onboarding flow for new users** — brief "Here's how it works" splash after first sign-in. Not in this phase.

</deferred>

---

_Phase: 53-auth-experience_
_Context gathered: 2026-02-09_
