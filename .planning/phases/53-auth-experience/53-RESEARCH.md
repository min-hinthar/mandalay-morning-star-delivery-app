# Phase 53: Auth Experience - Research

**Researched:** 2026-02-09
**Domain:** Auth UX, Supabase OAuth, Framer Motion animations, branded email
**Confidence:** HIGH

## Summary

Phase 53 transforms the existing functional auth pages into a premium, purely passwordless experience. The codebase already has magic link auth working via `signInWithOtp` in `src/lib/supabase/actions.ts`, an auth callback at `/auth/callback`, and basic form components. The main work is: (1) consolidate login/signup into a single `/login` page, (2) add Google + Apple OAuth via `signInWithOAuth`, (3) build animated UI with warm gradient background and floating food, (4) implement envelope confirmation animation, (5) create logo-to-header morph on login success, and (6) remove password-related pages/actions.

The existing `FloatingFoodEmojis` component from error pages can be adapted for the auth background. Framer Motion's `layoutId` enables the logo morph transition. Supabase's `signInWithOAuth` with PKCE flow handles social login, redirecting through the existing `/auth/callback` route. The `@supabase/ssr` package already manages PKCE cookies automatically. Custom email templates are configured in Supabase Dashboard under Authentication > Email Templates using Go template variables.

**Primary recommendation:** Use Framer Motion `layoutId` for logo morph, `signInWithOAuth` with PKCE for social login, CSS keyframe animations for background gradient, and adapt the existing `FloatingFoodEmojis` component for auth pages.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Mood:** Warm & inviting -- soft gradients, warm tones, gentle floating food
- **Layout:** Centered card on desktop over animated background; full-width card on mobile
- **Floating food:** Medium density (10-15 generic food emojis), varied sizes for depth, keep on mobile too
- **Background gradient:** Slow animated shift between warm tones (amber -> soft coral -> cream)
- **Card style:** Slide up + fade entrance animation
- **Card accent:** Gradient top bar in brand colors (thin strip at top of card)
- **Logo:** Full logo + tagline at top of card
- **Heading:** Warm personalized heading -- "Welcome back" / "Sign in" style
- **Theme:** Respects user's dark/light theme preference
- **Food component:** Reuse existing FloatingFoodEmojis from Phase 49
- **Magic Link:** Email field sends magic link -- no password field
- **Google OAuth:** via Supabase OAuth
- **Apple OAuth:** via Supabase OAuth (required, not optional)
- **Single page:** One "Sign in" page at /login -- no separate signup page
- **Removed routes:** Forgot-password and reset-password pages removed entirely
- **Email field focus:** Floating label lift + subtle warm border glow (both combined)
- **Validation:** Animated shake on invalid submit + inline error text below field
- **Submit button:** Progress animation (gradient fill) while waiting for magic link to send
- **Social proof:** Static placeholder counter ("Trusted by local families")
- **Legal links:** "By continuing, you agree to our Terms and Privacy Policy" -- create placeholder /terms and /privacy pages
- **Order:** Email magic link first -> "or continue with" divider -> social buttons below
- **Section label:** "Quick sign in" label above social buttons
- **Button layout:** Icon-only rounded rectangles, Google and Apple side by side
- **Button order:** Google first (left), Apple second (right)
- **Hover effect:** Scale up + shadow + border glow on hover
- **Tooltips:** Show provider name tooltip on hover/long-press
- **OAuth loading:** Full page overlay with "Redirecting to Google/Apple..." on button click
- **OAuth error:** Toast notification (non-intrusive, auto-dismiss)
- **Transition:** In-place card transformation for magic link confirmation (no page change)
- **Email display:** Show user's email ("We sent a link to john@example.com")
- **Envelope animation:** Multi-stage -- envelope floats in, pulses/glows while waiting, opens with sparkle when link is clicked
- **Resend:** Immediately available button with 60-second countdown timer between sends
- **Back option:** "Use a different email" link with animated transition back to form
- **Spam hint:** "Don't see it? Check your spam folder" appears after 15-20 second delay
- **Expired link:** Friendly error page with one-tap "Send a new link" button
- **Login success transition:** Logo-to-layout morph -- logo icon transforms/morphs into app header logo position
- **Duration:** Medium (2-3 seconds)
- **Personalization:** Shows user's name and Google avatar if available ("Welcome, John!")
- **Consistency:** Same logo morph for both OAuth and magic link flows
- **New vs returning:** Same experience for all users
- **Branded email:** Custom branded email template via Supabase (Morning Star branding, warm colors, logo)

### Claude's Discretion
- Card surface treatment (frosted glass vs solid -- optimize for readability)
- Google/Apple button styling within brand guidelines
- Exact animation curves and timing
- Loading state micro-interactions
- Error state handling details
- Social proof counter exact wording

### Deferred Ideas (OUT OF SCOPE)
- **Google Places API for social proof counter** -- currently using static placeholder
- **Onboarding flow for new users** -- not in this phase
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | ^0.8.0 | Server-side auth with PKCE | Already in use, manages cookies automatically |
| `@supabase/supabase-js` | ^2.90.1 | Auth client (`signInWithOAuth`, `signInWithOtp`) | Already in use for magic link |
| `framer-motion` | ^12.26.1 | Layout animations, `layoutId` morph, `AnimatePresence` | Already in use throughout app |
| `next-themes` | ^0.4.6 | Dark/light theme detection | Already in use |
| `lucide-react` | ^0.562.0 | Icons (Mail, ArrowLeft, etc.) | Already in use |
| `zod` | ^4.3.5 | Email validation schema | Already in use |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hook-form` | ^7.71.1 | Form state management | Email input with validation |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for RHF | Schema validation integration |
| `clsx` + `tailwind-merge` | latest | Conditional class names | All component styling |

### No New Dependencies Required
All functionality can be built with the existing stack. No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Single sign-in page (server component)
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts             # Existing OAuth/magic link callback (update)
│   │   └── expired/
│   │       └── page.tsx             # Expired link page with resend
│   ├── (public)/
│   │   ├── terms/
│   │   │   └── page.tsx             # Placeholder Terms page
│   │   └── privacy/
│   │       └── page.tsx             # Placeholder Privacy page
├── components/
│   └── ui/
│       └── auth/
│           ├── index.ts             # Barrel exports (update)
│           ├── AuthCard.tsx          # Main auth card container with animations
│           ├── AuthBackground.tsx    # Animated gradient + floating food
│           ├── MagicLinkForm.tsx     # Email input with floating label
│           ├── MagicLinkConfirmation.tsx  # Envelope animation + resend
│           ├── SocialLoginButtons.tsx     # Google + Apple OAuth buttons
│           ├── LoginSuccessCeremony.tsx   # Logo morph + welcome message
│           ├── OAuthLoadingOverlay.tsx    # Full-page redirect overlay
│           ├── AuthFloatingFood.tsx       # Adapted FloatingFoodEmojis for auth
│           ├── UserMenu.tsx          # Keep existing
│           └── AuthHandler.tsx       # Keep existing
│           # REMOVE: LoginForm.tsx, SignupForm.tsx, ForgotPasswordForm.tsx, ResetPasswordForm.tsx
├── lib/
│   └── supabase/
│       └── actions.ts               # Update: remove password actions, add OAuth action
```

### Pattern 1: Single Auth Page with State Machine
**What:** One `/login` page manages all auth states: form, confirmation, success
**When to use:** Purely passwordless auth with in-place transitions

```typescript
// Source: CONTEXT.md locked decision
type AuthState = 'form' | 'confirmation' | 'success' | 'error';

function AuthCard() {
  const [state, setState] = useState<AuthState>('form');
  const [email, setEmail] = useState('');

  return (
    <AnimatePresence mode="wait">
      {state === 'form' && (
        <m.div key="form" {...slideUpFade}>
          <MagicLinkForm onSubmit={(email) => { setEmail(email); setState('confirmation'); }} />
          <SocialLoginButtons />
        </m.div>
      )}
      {state === 'confirmation' && (
        <m.div key="confirm" {...slideUpFade}>
          <MagicLinkConfirmation email={email} onBack={() => setState('form')} />
        </m.div>
      )}
      {state === 'success' && (
        <m.div key="success" {...fadeIn}>
          <LoginSuccessCeremony />
        </m.div>
      )}
    </AnimatePresence>
  );
}
```

### Pattern 2: OAuth with PKCE via Server Action
**What:** Initiate OAuth from client, exchange code in callback route
**When to use:** Google and Apple social login

```typescript
// Source: Context7 /supabase/supabase-js
// Client-side: initiate OAuth
'use client';
import { createClient } from '@/lib/supabase/client';

async function handleOAuthLogin(provider: 'google' | 'apple') {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: provider === 'google' ? {
        access_type: 'offline',
        prompt: 'consent',
      } : undefined,
    },
  });
  // Supabase handles redirect automatically
  if (error) {
    // Show toast notification
  }
}
```

### Pattern 3: Logo Morph with layoutId
**What:** Logo in auth card morphs to header logo position on login success
**When to use:** Login success ceremony

```tsx
// Source: Context7 /websites/motion_dev - layout animations
// Auth page logo
<m.div layoutId="app-logo">
  <Image src="/logo.png" alt="Mandalay Morning Star" width={96} height={96} />
</m.div>

// Header logo (needs matching layoutId when auth page exits)
// The header must conditionally render a layoutId-tagged logo
// during the login transition
```

### Pattern 4: Unified signIn Server Action
**What:** Single `signIn` action using `signInWithOtp` with `shouldCreateUser: true`
**When to use:** Magic link for both new and existing users

```typescript
// Source: existing actions.ts + Context7
export async function signIn(formData: FormData): Promise<ActionResult | void> {
  const email = formData.get("email") as string;
  // shouldCreateUser: true makes this work for both login AND signup
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      shouldCreateUser: true, // key: auto-creates new accounts
    },
  });
}
```

### Anti-Patterns to Avoid
- **AnimatePresence with input mount/unmount:** Do NOT unmount the email input during transitions. Animate opacity instead. Remounting loses input state and focus.
- **OAuth on server side:** `signInWithOAuth` must be called from client (needs browser redirect). Don't try to call it from a server action.
- **Backdrop-blur on mobile:** Causes Safari crashes. Use solid backgrounds on mobile, glassmorphism on `sm:` breakpoint only (existing pattern in codebase).
- **Password fields anywhere:** Phase decision is purely passwordless. No password inputs, no `updatePassword` action.
- **Separate login/signup pages:** Single `/login` page handles both via `shouldCreateUser: true`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow | Custom OAuth token handling | `supabase.auth.signInWithOAuth()` | PKCE flow handles CSRF, token exchange automatically |
| Email validation | Regex patterns | `zod.string().email()` + `react-hook-form` | Edge cases (internationalized domains, plus addressing) |
| Session management | Cookie parsing | `@supabase/ssr` `createClient()` | Handles refresh tokens, cookie chunking, PKCE verifier |
| Rate limiting | New rate limiter | Existing `checkRateLimit()` in `src/lib/utils/rate-limit.ts` | Already built and used in auth actions |
| Toast notifications | Custom toast for OAuth errors | Existing `useToast()` hook + `ToastProvider` | Already integrated app-wide |
| Theme detection | Manual theme check | `next-themes` `useTheme()` | Already integrated via `ThemeProvider` |
| Animation preferences | Manual reduced-motion check | `useAnimationPreference()` hook | Already handles full/reduced/none with spring helpers |

**Key insight:** The codebase already has comprehensive infrastructure for auth (Supabase), animations (Framer Motion + motion tokens), theming (next-themes), and toasts. This phase is primarily UI/UX work, not infrastructure.

## Common Pitfalls

### Pitfall 1: OAuth Redirect URL Mismatch
**What goes wrong:** OAuth login fails with "redirect_uri_mismatch" error
**Why it happens:** Google/Apple OAuth requires exact redirect URL match in provider console
**How to avoid:** Register `https://[project-ref].supabase.co/auth/v1/callback` in Google Cloud Console and Apple Developer Portal. Also register `http://localhost:54321/auth/v1/callback` for local dev. The Supabase-level callback is different from the app-level `/auth/callback` route.
**Warning signs:** Works in dev but fails in production, or vice versa

### Pitfall 2: Apple OAuth Requires Backend Configuration
**What goes wrong:** Apple Sign In fails silently or returns no user info
**Why it happens:** Apple requires Services ID, web redirect URL, and domain verification
**How to avoid:** Configure in Apple Developer Portal: Services ID with Sign In with Apple enabled, add domain + return URL. Configure client ID and secret in Supabase Dashboard > Auth > Providers > Apple.
**Warning signs:** Google works but Apple doesn't

### Pitfall 3: PKCE Verifier Cookie Not Set
**What goes wrong:** `exchangeCodeForSession` fails with "PKCE verifier not found"
**Why it happens:** Cookie is set during `signInWithOAuth` call but lost before callback
**How to avoid:** Ensure `@supabase/ssr` middleware or server client properly handles cookies. The existing `server.ts` already configures `getAll`/`setAll` correctly. Don't use `supabase-js` vanilla client for OAuth initiation -- use `@supabase/ssr` browser client.
**Warning signs:** Intermittent failures, especially on mobile Safari

### Pitfall 4: layoutId Conflicts Across Routes
**What goes wrong:** Logo morph animation doesn't work or causes layout jumps
**Why it happens:** `layoutId` requires both elements to be in the same `LayoutGroup` or page tree
**How to avoid:** The login page and app header are in different route groups. Solution: use a shared layout component or `LayoutGroup` at the root level. Alternatively, use GSAP `Flip` plugin for cross-page morphs, or implement via View Transition API.
**Warning signs:** Logo jumps instead of morphing, or morph doesn't trigger

### Pitfall 5: Floating Label Focus Management
**What goes wrong:** Floating label doesn't animate correctly, or input loses focus
**Why it happens:** Label position depends on both `:focus` and `:not(:placeholder-shown)` states
**How to avoid:** Use CSS `peer` pattern: `<input class="peer" /> <label class="peer-focus:...">`. Don't rely on JS focus state alone -- CSS pseudo-classes are more reliable and accessible.
**Warning signs:** Label overlaps input text, label doesn't float back down when empty

### Pitfall 6: Envelope Animation Performance
**What goes wrong:** Multi-stage animation stutters or skips stages
**Why it happens:** Chaining Framer Motion `animate` sequences incorrectly
**How to avoid:** Use `useAnimate` hook or `animate` prop with keyframes array for multi-stage sequences. Each stage (float in -> pulse -> open with sparkle) should be a keyframe step, not separate state changes.
**Warning signs:** Abrupt transitions between animation stages

### Pitfall 7: Email Template Variables in Supabase
**What goes wrong:** Custom email template shows raw `{{ .ConfirmationURL }}` or broken links
**Why it happens:** Supabase uses Go Templates syntax, not Handlebars
**How to avoid:** Use `{{ .ConfirmationURL }}` for the magic link URL. Test templates in Supabase Dashboard preview. Use `{{ .SiteURL }}` for logo image URLs.
**Warning signs:** Email displays raw template code or 404 images

## Code Examples

### OAuth Login with Supabase (Client-Side)
```typescript
// Source: Context7 /supabase/supabase-js
'use client';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/hooks/useToast';

function useSocialLogin() {
  const { toast } = useToast();

  async function loginWithProvider(provider: 'google' | 'apple') {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Google-specific: request offline access for refresh token
        ...(provider === 'google' && {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }),
      },
    });

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    // If no error, Supabase handles redirect automatically
  }

  return { loginWithProvider };
}
```

### Unified Magic Link Action
```typescript
// Source: existing actions.ts pattern + Context7
'use server';
export async function signInWithMagicLink(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  if (!email) return { error: 'Email is required' };

  const rateCheck = checkRateLimit(email, 'signIn');
  if (!rateCheck.allowed) {
    return { error: `Too many attempts. Try again in ${rateCheck.retryAfterSeconds}s.` };
  }

  const appUrl = await getAppUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      shouldCreateUser: true, // handles both new + existing users
    },
  });

  if (error) return { error: error.message };
  return { success: `Magic link sent to ${email}` };
}
```

### Animated Background Gradient (CSS)
```css
/* Warm auth background gradient */
@keyframes auth-gradient-shift {
  0% { background-position: 0% 50%; }
  33% { background-position: 50% 100%; }
  66% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.auth-gradient {
  background: linear-gradient(
    135deg,
    /* amber */   hsl(35, 90%, 65%),
    /* soft coral */ hsl(15, 80%, 70%),
    /* cream */   hsl(40, 60%, 85%),
    /* amber */   hsl(35, 90%, 65%)
  );
  background-size: 400% 400%;
  animation: auth-gradient-shift 20s ease infinite;
}

.dark .auth-gradient {
  background: linear-gradient(
    135deg,
    hsl(35, 70%, 25%),
    hsl(15, 60%, 30%),
    hsl(40, 40%, 20%),
    hsl(35, 70%, 25%)
  );
  background-size: 400% 400%;
  animation: auth-gradient-shift 20s ease infinite;
}
```

### Floating Label Input Pattern
```tsx
// CSS peer pattern for floating label
<div className="relative">
  <input
    id="email"
    type="email"
    placeholder=" " // important: space placeholder for :not(:placeholder-shown)
    className="peer w-full px-4 pt-6 pb-2 border rounded-xl
               focus:border-primary focus:ring-2 focus:ring-primary/20
               transition-all duration-200"
  />
  <label
    htmlFor="email"
    className="absolute left-4 top-4 text-muted-foreground text-sm
               transition-all duration-200
               peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary
               peer-[:not(:placeholder-shown)]:top-2
               peer-[:not(:placeholder-shown)]:text-xs"
  >
    Email address
  </label>
</div>
```

### Multi-Stage Envelope Animation
```tsx
// Source: Framer Motion keyframes
import { m, useAnimate } from 'framer-motion';

function EnvelopeAnimation() {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const sequence = async () => {
      // Stage 1: Float in from below
      await animate('#envelope', { y: [50, 0], opacity: [0, 1] }, { duration: 0.6 });
      // Stage 2: Pulse/glow while waiting
      await animate('#envelope', { scale: [1, 1.05, 1] }, {
        duration: 2, repeat: Infinity, ease: 'easeInOut'
      });
    };
    sequence();
  }, [animate]);

  return (
    <div ref={scope}>
      <m.div id="envelope" className="text-6xl text-center">
        {/* Envelope emoji or SVG */}
      </m.div>
    </div>
  );
}
```

### Logo Morph with layoutId
```tsx
// Auth card logo (source)
<m.div layoutId="app-logo" transition={spring.gentle}>
  <Image src="/logo.png" width={96} height={96} alt="Logo" />
</m.div>

// App header logo (target) - conditionally tagged during transition
<m.div layoutId={isTransitioning ? "app-logo" : undefined} transition={spring.gentle}>
  <Image src="/logo.png" width={48} height={48} alt="Logo" />
</m.div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Implicit OAuth flow | PKCE flow (default in `@supabase/ssr`) | 2024 | More secure, no tokens in URL fragment |
| Separate login/signup | Single page with `shouldCreateUser` | Current best practice | Simpler UX, fewer routes |
| Password-based auth | Passwordless (magic link + social) | Industry trend 2024-2025 | Higher conversion, no password management |
| CSS transitions for page morphs | Framer Motion `layoutId` | FM v10+ | Automatic FLIP calculations, smooth morphs |
| Custom OAuth implementation | `signInWithOAuth` + PKCE | Supabase SSR v0.4+ | Automatic cookie management, CSRF protection |

**Deprecated/outdated:**
- `signUp` with password: Not used in this phase (purely passwordless)
- `resetPasswordForEmail` / `updatePassword`: Removed entirely
- Implicit OAuth flow: PKCE is default and more secure
- Separate `ForgotPasswordForm` and `ResetPasswordForm`: Being deleted

## Open Questions

1. **Logo Morph Across Route Groups**
   - What we know: `layoutId` works within the same React tree. The login page is in `(auth)` route group, the header is in root layout.
   - What's unclear: Whether `layoutId` will work across these boundaries since root layout wraps both.
   - Recommendation: Test with a simple prototype first. Root layout includes `<Providers>` with `<LazyMotion>`, so both routes share the same motion context. If `layoutId` doesn't work cross-route, fall back to GSAP Flip or View Transition API. The root layout wraps `(auth)` so it should work, but verify.

2. **Apple OAuth Configuration Status**
   - What we know: Apple OAuth requires Apple Developer Program membership, Services ID configuration, domain verification, and key generation.
   - What's unclear: Whether the project has an Apple Developer account set up, and whether the Supabase project has Apple OAuth configured.
   - Recommendation: Flag as ops prerequisite. The code can be built to support Apple OAuth, but it won't work until the provider is configured in both Apple Developer Portal and Supabase Dashboard. Consider a feature flag to hide Apple button until configured.

3. **Custom Email Template Hosting for Logo Image**
   - What we know: Supabase email templates support HTML. Logo image needs a publicly accessible URL.
   - What's unclear: Whether `{{ .SiteURL }}/logo.png` will resolve correctly, or if a CDN URL is needed.
   - Recommendation: Use the app's public URL (`NEXT_PUBLIC_APP_URL` or `{{ .SiteURL }}`) for logo image source in the email template. Test with Supabase's email preview.

4. **Callback Route Changes for OAuth**
   - What we know: The existing `/auth/callback` route handles `exchangeCodeForSession` and driver invite flow.
   - What's unclear: Whether OAuth callbacks include the `code` parameter in the same way as magic links via PKCE.
   - Recommendation: OAuth with PKCE also uses the `code` parameter. The existing callback should work for OAuth without changes. The `inviteId` logic only triggers when that param is present, so it won't interfere.

## Codebase Inventory: Files to Modify/Delete

### Files to DELETE
| File | Reason |
|------|--------|
| `src/app/(auth)/signup/page.tsx` | Single page replaces separate signup |
| `src/app/(auth)/forgot-password/page.tsx` | No password = no forgot password |
| `src/app/auth/reset-password/page.tsx` | No password = no reset password |
| `src/components/ui/auth/SignupForm.tsx` | Replaced by unified auth card |
| `src/components/ui/auth/ForgotPasswordForm.tsx` | Removed |
| `src/components/ui/auth/ResetPasswordForm.tsx` | Removed |
| `src/components/ui/auth/LoginForm.tsx` | Replaced by new MagicLinkForm |

### Files to MODIFY
| File | Changes |
|------|---------|
| `src/app/(auth)/login/page.tsx` | Complete rewrite: new premium UI |
| `src/lib/supabase/actions.ts` | Remove `signUp`, `resetPassword`, `updatePassword`. Keep `signIn` (rename to `signInWithMagicLink`). Keep `signOut`. Ensure `shouldCreateUser: true`. |
| `src/components/ui/auth/index.ts` | Update barrel exports |
| `src/components/ui/auth/UserMenu.tsx` | Remove "Sign Up" button, keep "Sign In" only for unauthenticated state |
| `src/components/ui/layout/AppHeader/DesktopHeader.tsx` | Add `layoutId` to logo for morph animation |
| `src/components/ui/layout/AppHeader/MobileHeader.tsx` | Add `layoutId` to logo for morph animation |

### Files to CREATE
| File | Purpose |
|------|---------|
| `src/components/ui/auth/AuthCard.tsx` | Main card with state machine (form/confirmation/success) |
| `src/components/ui/auth/AuthBackground.tsx` | Animated gradient + floating food background |
| `src/components/ui/auth/MagicLinkForm.tsx` | Email input with floating label + validation |
| `src/components/ui/auth/MagicLinkConfirmation.tsx` | Envelope animation + resend + spam hint |
| `src/components/ui/auth/SocialLoginButtons.tsx` | Google + Apple icon buttons |
| `src/components/ui/auth/LoginSuccessCeremony.tsx` | Logo morph + welcome message |
| `src/components/ui/auth/OAuthLoadingOverlay.tsx` | Full-page "Redirecting to..." overlay |
| `src/components/ui/auth/AuthFloatingFood.tsx` | Adapted FloatingFoodEmojis for auth context |
| `src/app/(public)/terms/page.tsx` | Placeholder Terms of Service page |
| `src/app/(public)/privacy/page.tsx` | Placeholder Privacy Policy page |

### Tests to Update
| File | Changes |
|------|---------|
| `src/components/ui/auth/__tests__/login-form.test.tsx` | Rewrite for new MagicLinkForm component |
| `src/components/ui/auth/__tests__/signup-form.test.tsx` | DELETE (no more signup form) |

## Supabase Dashboard Configuration Required

### Email Templates (Dashboard > Auth > Templates)
- **Magic Link template:** Custom HTML with Morning Star branding
  - Logo image: `{{ .SiteURL }}/logo.png`
  - Brand colors: `#A41034` (primary red), `#EBCD00` (golden yellow)
  - CTA button: "Sign in to Mandalay Morning Star"
  - Template variables: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`

### Auth Providers (Dashboard > Auth > Providers)
- **Google:** Enable, configure Client ID + Client Secret from Google Cloud Console
- **Apple:** Enable, configure Services ID + Key from Apple Developer Portal

### Auth Settings (Dashboard > Auth > Settings)
- **Site URL:** Production app URL
- **Redirect URLs:** Add `http://localhost:3000/auth/callback` and production callback URL

## Sources

### Primary (HIGH confidence)
- Context7 `/supabase/supabase-js` - OAuth signInWithOAuth API, magic link signInWithOtp, PKCE flow
- Context7 `/websites/motion_dev` - layoutId shared layout animations, AnimatePresence
- Existing codebase: `src/lib/supabase/actions.ts`, `src/components/ui/auth/`, `src/app/auth/callback/route.ts`

### Secondary (MEDIUM confidence)
- [Supabase Email Templates docs](https://supabase.com/docs/guides/auth/auth-email-templates) - Go template variables, SMTP config
- [Apple Sign In Usage Guidelines](https://developer.apple.com/sign-in-with-apple/usage-guidelines-for-websites-and-other-platforms/) - Button requirements
- [Supabase Google OAuth docs](https://supabase.com/docs/guides/auth/social-login/auth-google) - Provider setup
- [Supabase Apple OAuth docs](https://supabase.com/docs/guides/auth/social-login/auth-apple) - Provider setup

### Tertiary (LOW confidence)
- Logo morph across route groups: needs prototype validation (see Open Question 1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- Architecture: HIGH - patterns verified against existing codebase and Context7
- Pitfalls: HIGH - common issues documented in Supabase/Framer Motion docs and project learnings
- OAuth setup: MEDIUM - code patterns verified, but provider console configuration is ops-dependent
- Logo morph: MEDIUM - layoutId confirmed in docs, but cross-route-group behavior needs testing

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (stable tech, 30-day validity)
