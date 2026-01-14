# Change Log — Mandalay Morning Star

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Auth Fix - OTP Profile Trigger (2026-01-13)

**Fixed**
- Allow profile creation when OTP signups provide a null email
- Hardened auth trigger to ignore duplicate profile inserts

**Files Modified**
- `supabase/migrations/20260113000001_fix_profile_trigger.sql` - Nullable email + trigger fix
- `src/types/database.ts` - Updated profiles email nullability


### Auth Improvement - Magic Link Authentication (2026-01-13)

**Changed**
- Switched from password-based auth to magic link (OTP) authentication
- Login form now only requires email, sends magic link via email
- Signup form now only requires email, sends magic link to complete registration
- Simplified auth flow reduces user friction and improves security

**Added**
- `getAppUrl()` helper function for dynamic redirect URL resolution
- Success message display after magic link is sent
- Helper text explaining magic link flow to users
- Unit tests for login and signup forms
- Vitest globals types in tsconfig.json

**Removed**
- Password fields from login form
- Password and confirm password fields from signup form
- "Forgot password" link from login form (no longer needed with magic links)
- Immediate redirect after login (now shows success message)

**Files Modified**
- `src/components/auth/login-form.tsx` - Simplified to email-only magic link form
- `src/components/auth/signup-form.tsx` - Simplified to email-only magic link form
- `src/lib/supabase/actions.ts` - Uses `signInWithOtp` instead of password auth
- `tsconfig.json` - Added vitest/globals types

**Files Created**
- `src/components/auth/__tests__/login-form.test.tsx` - Login form unit tests
- `src/components/auth/__tests__/signup-form.test.tsx` - Signup form unit tests

**Rationale**
- Magic links are more secure (no passwords to leak/guess)
- Better UX with fewer form fields
- Users don't need to remember passwords
- Aligns with modern authentication best practices

---

### V0-007 - Menu Browse UI (2026-01-13)

**Added**
- Menu browse page at `/menu` with server-side rendering
- Category tabs component with horizontal scrolling
- Menu item card component with image, pricing, and allergen display
- Menu section component for grouped category display
- Menu skeleton component for loading states
- Menu query function for fetching categories with items

**Features**
- Sticky category tabs with scroll-spy activation
- Touch-friendly 44px minimum hit targets for mobile
- Auto-scroll tabs to keep active category visible
- Smooth scrolling to category sections on tab click
- Reduced motion support for accessibility
- Sold out overlay state on item cards
- Bilingual display (English + Burmese names)
- Allergen badges with semantic colors
- Image optimization with Next.js Image component
- Responsive grid layout (1-3 columns)
- Loading skeleton with pulse animation

**Files Created/Modified**
- `src/app/(public)/menu/page.tsx` - Menu browse page with SSR
- `src/components/menu/menu-content.tsx` - Main content orchestrator
- `src/components/menu/category-tabs.tsx` - Sticky category navigation
- `src/components/menu/menu-section.tsx` - Category section wrapper
- `src/components/menu/menu-item-card.tsx` - Individual item card
- `src/components/menu/menu-skeleton.tsx` - Loading state skeleton
- `src/components/menu/index.ts` - Barrel exports
- `src/lib/queries/menu.ts` - Supabase menu queries
- `src/lib/utils/format.ts` - Price formatting utility

**Mobile Responsive**
- Single column on small screens
- Two columns on medium screens (sm breakpoint)
- Three columns on large screens (lg breakpoint)
- Horizontally scrollable category tabs

---

### V0-006 - Menu Seed Import (2026-01-13)

**Added**
- Menu seed script (`scripts/seed-menu.ts`) for importing menu data from YAML
- Menu verify script (`scripts/verify-menu.ts`) for validating seeded data
- NPM scripts: `seed:menu` and `verify:menu`

**Features**
- Upsert logic for categories, menu items, modifier groups, and modifier options
- Unique slug generation for modifier options (`groupSlug__optionSlug`)
- Automatic linking of items to modifier groups via join table
- Verification step confirms data integrity after seeding
- Uses service role key to bypass RLS for admin operations

**Files Created/Modified**
- `scripts/seed-menu.ts` - Menu seeding script (389 lines)
- `scripts/verify-menu.ts` - Menu verification script (139 lines)
- `package.json` - Added `yaml` and `tsx` dependencies, npm scripts

**Data**
- 8 categories from `data/menul.seed.yaml`
- 47 menu items across all categories
- 7 modifier groups with multiple options
- Allergen and tag metadata preserved

**Usage**
```bash
npm run seed:menu    # Seed menu data to Supabase
npm run verify:menu  # Verify seeded data
```

**Dependencies**
- Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

---

### V0-005 - Coverage Checker (2026-01-13)

**Added**
- Coverage check API endpoint (`/api/coverage/check`)
- Coverage check UI component with address input form
- Google Maps client library for geocoding and distance matrix
- Zod validators for coverage request/response schemas
- Homepage integration with coverage checker component

**Features**
- Address geocoding via Google Maps Geocoding API
- Driving distance/duration calculation via Distance Matrix API
- Enforces 50mi distance and 90min drive time limits
- Clear feedback for deliverable/non-deliverable addresses
- Displays formatted address with distance and duration

**Files Created/Modified**
- `src/app/api/coverage/check/route.ts` - Coverage check API endpoint
- `src/components/coverage/coverage-check.tsx` - Coverage check UI component
- `src/components/coverage/index.ts` - Component barrel export
- `src/lib/maps/client.ts` - Google Maps API client
- `src/lib/validators/coverage.ts` - Zod schemas and types
- `src/app/(public)/page.tsx` - Homepage with coverage checker
- `.github/workflows/ci.yml` - Fixed test command

**Dependencies**
- Requires `GOOGLE_MAPS_API_KEY` environment variable
- Configurable via `KITCHEN_LAT`, `KITCHEN_LNG`, `MAX_DISTANCE_MILES`, `MAX_DURATION_MINUTES`

---

### V0-004 - RLS Policies (2026-01-13)

**Added**
- Row Level Security policies for all 10 database tables
- User-scoped policies for profiles, addresses, orders, order_items, order_item_modifiers
- Public read policies for menu tables (categories, items, modifier_groups, modifier_options, item_modifier_groups)
- Admin policies for viewing/updating orders and profiles
- Cross-user isolation test script (`scripts/rls-isolation-test.mjs`)

**Security**
- Users can only read/write their own data
- Menu data is publicly readable (active items only)
- Admins can view all orders and update order status
- Service role bypasses RLS for backend operations

**Files Created/Modified**
- `supabase/migrations/20260112000002_rls_policies.sql` - RLS policy definitions
- `scripts/rls-isolation-test.mjs` - Isolation test script
- `.github/workflows/ci.yml` - Added test script support

---

### V0-003 - Supabase Auth Integration (2026-01-13)

**Added**
- Login page at `/login` with email/password form
- Signup page at `/signup` with password confirmation
- Forgot password page at `/forgot-password`
- Password reset page at `/auth/reset-password`
- Auth callback route for email confirmation
- User menu component in header (sign in/out state)
- Protected route middleware (cart, checkout, orders)
- Server actions for all auth operations
- Form validation with error messages
- Loading states during auth operations

**Files Created/Modified**
- `src/lib/supabase/actions.ts` - Server actions (signUp, signIn, signOut, resetPassword, updatePassword)
- `src/app/auth/callback/route.ts` - Email confirmation handler
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/signup/page.tsx` - Signup page
- `src/app/(auth)/forgot-password/page.tsx` - Forgot password page
- `src/app/auth/reset-password/page.tsx` - Password reset page
- `src/components/auth/login-form.tsx` - Login form component
- `src/components/auth/signup-form.tsx` - Signup form component
- `src/components/auth/forgot-password-form.tsx` - Forgot password form
- `src/components/auth/reset-password-form.tsx` - Reset password form
- `src/components/auth/user-menu.tsx` - Header user menu
- `src/middleware.ts` - Protected routes + session refresh
- `src/components/layout/header.tsx` - Added user menu integration

---

## [0.0.1] - 2026-01-12

### Added
- **PROJECT_SPEC.md**: Complete product requirements and engineering design
- **architecture.md**: System diagrams and component architecture
- **change_log.md**: This file
- **project_status.md**: Progress tracking
- **CLAUDE.md**: Project memory for AI context

### Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project goal | Shipping MVP | Real business launch |
| Mobile strategy | PWA (not native) | Faster to ship; evaluate native for V2 |
| Tip feature | Deferred to V2 | Reduce V1 complexity |
| Tax handling | Fixed rate for V1 | Stripe Tax considered for V2 |

### Open Items
- [ ] Finalize cart storage approach (Zustand recommended)
- [ ] Confirm image hosting (Supabase Storage recommended)
- [ ] Set up development environment

---

## Future Releases

### [0.1.0] - V0: Skeleton (Target: Week 2)
- Project scaffold (Next.js, Tailwind, shadcn)
- Supabase Auth integration
- Coverage checker
- Menu browse UI

### [0.2.0] - V1: Ordering Core (Target: Week 5)
- Cart + modifiers
- Checkout flow
- Stripe integration
- Order confirmation

### [0.3.0] - V2: Ops-Ready (Target: Week 8)
- Admin dashboard
- Driver app
- Real-time tracking
- Refunds

---

## Version History

| Version | Date | Status | Description |
|---------|------|--------|-------------|
| 0.0.1 | 2026-01-12 | Planning | Initial spec complete |
| 0.1.0 | TBD | Planned | V0 Skeleton |
| 0.2.0 | TBD | Planned | V1 Ordering Core |
| 0.3.0 | TBD | Planned | V2 Ops-Ready |
