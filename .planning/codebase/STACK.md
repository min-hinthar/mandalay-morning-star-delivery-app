# Technology Stack

**Analysis Date:** 2026-03-14

## Languages

**Primary:**
- TypeScript 5 (strict mode) - All application code (`src/`, `scripts/`, config files)
  - `tsconfig.json`: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
  - Target: ES2017, Module: ESNext, Module Resolution: bundler
  - Path alias: `@/*` maps to `./src/*`

**Secondary:**
- SQL (PostgreSQL) - Database migrations in `supabase/migrations/` (58+ migration files)
- JavaScript - Build scripts (`scripts/build-sw.mjs`, `scripts/rls-isolation-test.mjs`), config files (`lighthouserc.js`, `chromatic.config.js`)
- CSS - Tailwind CSS v4 with `@theme inline` directives

## Runtime

**Environment:**
- Node.js 22 (per CI workflow in `.github/workflows/ci.yml`)
- No `.nvmrc` at project root

**Package Manager:**
- pnpm 10 (per CI `pnpm/action-setup@v4` with `version: 10`)
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- Next.js 16.1.2 (`next`) - App Router, React Server Components, Server Actions
  - React Compiler enabled (`reactCompiler: true` in `next.config.ts`)
  - React Strict Mode enabled
  - Server Actions with 2MB body size limit
  - Image optimization: AVIF/WebP, remote patterns for Supabase and Google Drive
  - CSP headers with Sentry reporting
  - Bundle analyzer via `@next/bundle-analyzer`
- React 19.2.3 (`react`, `react-dom`) - Auto-memoized via React Compiler (no manual useMemo/useCallback needed)

**State Management:**
- Zustand 5.0.10 (`zustand`) - Client-side stores in `src/lib/stores/`
  - `cart-store.ts` - Shopping cart state
  - `checkout-store.ts` - Checkout flow state
  - `driver-store.ts` - Driver dashboard state
  - `cart-animation-store.ts` - Cart animation triggers
- TanStack React Query 5.90.1 (`@tanstack/react-query`) - Server state, caching, mutations

**Forms & Validation:**
- React Hook Form 7.71.1 (`react-hook-form`) - Form state management
- `@hookform/resolvers` 5.2.2 - Zod integration bridge
- Zod 4.3.5 (`zod`) - Schema validation (forms, API inputs, env vars)

**Testing:**
- Vitest 4.0.17 (`vitest`) - Unit testing, jsdom environment
  - Config: `vitest.config.ts`
  - Setup file: `src/test/setup.ts`
  - 10s test timeout, 10s hook timeout
- Playwright 1.57.0 (`@playwright/test`) - E2E testing
  - Config: `playwright.config.ts`
  - Browsers: Chromium (Desktop Chrome + Mobile Chrome/Pixel 5)
  - Visual regression: screenshot comparison, snapshot matching
- Testing Library (`@testing-library/react` 16.3.1, `@testing-library/jest-dom` 6.9.1)
- `fake-indexeddb` 6.2.5 - IndexedDB mocking for offline store tests

**Build/Dev:**
- esbuild 0.27.2 - Service worker compilation (`scripts/build-sw.mjs`)
- tsx 4.19.2 - TypeScript script runner for seed/verify scripts
- sharp 0.34.5 - Server-side image processing (WebP conversion, 4:3 crop)

## UI Framework

**Component Library:**
- Radix UI (8 primitives) - AlertDialog, Checkbox, Dialog, Label, Progress, RadioGroup, ScrollArea, Select, Slot
- shadcn/ui pattern - Components in `src/components/ui/` using CVA + Radix
- Tailwind CSS v4 (`tailwindcss` ^4) via `@tailwindcss/postcss`
  - `tailwind.config.ts` contains design token definitions (colors, spacing, shadows, animations)
  - **IMPORTANT:** `@theme inline` in CSS is source of truth; `tailwind.config.ts` content extends tokens only
  - `tailwindcss-animate` for animation utilities
- class-variance-authority 0.7.1 (`cva`) - Variant-based component styling
- clsx 2.1.1 + tailwind-merge 3.4.0 - Class name utilities (via `cn()` in `src/lib/utils/cn.ts`)

**Icons:**
- lucide-react 0.562.0 - Icon library with modular imports (`transform: lucide-react/dist/esm/icons/{{ kebabCase member }}`)

**Animation:**
- Framer Motion 12.26.1 (`framer-motion`) - React animations, gestures, layout transitions
- GSAP 3.14.2 (`gsap`, `@gsap/react`) - Complex timeline animations
- Motion tokens in `src/lib/motion-tokens/` and `src/lib/micro-interactions/`

**Rich Text:**
- TipTap 3.19.0 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`) - Rich text editor for admin email compose
  - Extensions: `@tiptap/extension-link`, `@tiptap/extension-placeholder`

**Charts:**
- Recharts 3.6.0 - Admin analytics charts

**Maps:**
- `@react-google-maps/api` 2.20.8 - Google Maps React components (admin route maps, delivery tracking, homepage map)
- Leaflet 1.9.4 + react-leaflet 5.0.0 - Alternative map rendering

**Search:**
- Fuse.js 7.1.0 - Client-side fuzzy search for menu items (`src/lib/search/`)
- cmdk 1.1.1 - Command palette UI

**Other UI:**
- next-themes 0.4.6 - Dark/light theme switching
- react-easy-crop 5.5.6 - Image cropping UI
- browser-image-compression 2.0.2 - Client-side image optimization
- `@fontsource-variable/inter`, `@fontsource-variable/playfair-display` - Self-hosted fonts

## Key Dependencies

**Critical (breaks core functionality):**
- `@supabase/supabase-js` 2.90.1 + `@supabase/ssr` 0.8.0 - Database, auth, storage, realtime
- `stripe` 20.1.2 - Payment processing (server-side SDK)
- `resend` 6.9.1 - Transactional email delivery
- `zod` 4.3.5 - Validation across all layers (forms, APIs, env vars)

**Infrastructure:**
- `@sentry/nextjs` 10.38.0 - Error tracking, performance monitoring, session replay
- `@serwist/next` 9.5.4 + `serwist` 9.5.4 - PWA service worker framework
- `@upstash/ratelimit` 2.0.8 + `@upstash/redis` 1.36.2 - Rate limiting (currently disabled, in-memory fallback active)
- `@vercel/analytics` 1.6.1 + `@vercel/speed-insights` 1.3.1 - Vercel performance analytics
- `svix` 1.86.0 - Webhook signature verification (Resend webhooks)
- `web-vitals` 5.1.0 - Core Web Vitals monitoring

**Utilities:**
- `date-fns` 4.1.0 - Date manipulation (delivery scheduling, time windows)
- `uuid` 13.0.0 - UUID generation
- `yaml` 2.8.2 - Menu seed data parsing
- `idb-keyval` 6.2.2 - IndexedDB key-value store for offline data

## Dev Tooling

**Linting:**
- ESLint 9 (`eslint`) with flat config (`eslint.config.mjs`)
  - Extends: `next/core-web-vitals`, `next/typescript`, `prettier`
  - `eslint-plugin-import-x` - Circular dependency detection (`import-x/no-cycle`, maxDepth: 10)
  - `eslint-plugin-storybook` - Storybook best practices
  - 62+ design token enforcement rules via `no-restricted-syntax`
  - Consolidation guards via `no-restricted-imports` (prevents imports from deprecated directories)
  - File size limit: 400 lines (`max-lines` warning, excludes `src/types/**`, test files, stories)
- Stylelint 17.0.0 (`stylelint`) with `stylelint-config-standard`
- Prettier 3.7.4 (`prettier`)

**Pre-commit:**
- Husky 9.1.7 (`husky`) - Git hooks
- lint-staged 16.2.7 (`lint-staged`)
  - `src/**/*.{ts,tsx}`: ESLint with `--max-warnings=0`
  - `src/**/*.css`: Stylelint

**Code Quality:**
- knip 5.82.1 - Dead code / unused dependency detection

**Visual Testing:**
- Storybook 10.1.11 (`storybook`, `@storybook/nextjs-vite`)
  - Addons: a11y, docs, onboarding, vitest
  - Port: 6006
- Chromatic 5.0.0 (`@chromatic-com/storybook`) - Visual regression testing
  - Config: `chromatic.config.js`
  - TurboSnap enabled, 5 viewport breakpoints (375, 640, 768, 1024, 1280)
  - Chrome browser only

**Performance:**
- Lighthouse CI (`@lhci/cli` 0.15.1) - Performance regression gate
  - Config: `lighthouserc.js`
  - Mobile-first: 3 runs per URL, 5 public routes
  - CI thresholds: LCP < 10s, CLS < 0.15, Perf > 0.3, A11y > 0.9
- `@next/bundle-analyzer` - Bundle size analysis (`ANALYZE=true next build`)

## Configuration

**Environment:**
- `.env.local` for local development (git-ignored)
- `.env.example` documents all required/optional vars
- Env validation via Zod in `src/lib/health/env.ts`
- Critical vars (block production_ready): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`
- Important vars (warn only): `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `GOOGLE_SITE_VERIFICATION`

**Build:**
- `next.config.ts` - Central build config with Sentry and bundle analyzer wrappers
- `postcss.config.mjs` - Tailwind CSS v4 PostCSS plugin
- `tsconfig.json` - TypeScript strict configuration
- `vitest.config.ts` - Test runner config
- `playwright.config.ts` - E2E test config
- `vercel.json` - Cron job schedules

**Build Pipeline:**
1. `next build` - Compiles Next.js app with React Compiler
2. `node scripts/build-sw.mjs` - Builds service worker with esbuild + `@serwist/build` manifest
3. Sentry source map upload (via `@sentry/nextjs` build plugin)

## Platform Requirements

**Development:**
- Node.js 22+
- pnpm 10+
- Supabase project (URL + anon key minimum)
- Stripe test keys for payment flows
- Google Maps API key for geocoding/maps

**Production:**
- Vercel (deployment target)
- Supabase Cloud (Postgres + Auth + Storage + Realtime)
- Stripe account (live keys)
- Resend account (email delivery)
- Sentry account (error tracking)
- Google Cloud (Maps APIs)
- Domain: `mandalaymorningstar.com`

## CI/CD

**GitHub Actions:** `.github/workflows/ci.yml`
- Trigger: push to main, PRs to main
- Jobs (parallel): Lint & Format, Type Check, Unit Tests
- Jobs (sequential): Build (after lint/typecheck/test pass)
- Jobs (conditional): Lighthouse CI (PRs only, when `src/` changes detected)
- Artifacts: Next.js build output uploaded for Lighthouse job

---

*Stack analysis: 2026-03-14*
