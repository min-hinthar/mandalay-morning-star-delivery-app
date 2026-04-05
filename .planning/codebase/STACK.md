# Technology Stack

**Analysis Date:** 2026-04-04

## Languages

**Primary:**
- TypeScript 5 (strict) - All source files in `src/`, `scripts/`, config files
- SQL - Supabase migrations in `supabase/migrations/` (65 migration files)

**Secondary:**
- JavaScript (ESM) - Build scripts in `scripts/build-sw.mjs`, `scripts/rls-isolation-test.mjs`
- CSS - Tailwind v4 source in `src/app/globals.css` and component stylesheets

## Runtime

**Environment:**
- Node.js v24.14.0 (no `.nvmrc`; engine pinned implicitly by Vercel)

**Package Manager:**
- pnpm (lockfile: `pnpm-lock.yaml` present)

## Frameworks

**Core:**
- Next.js 16.1.2 (App Router) - Full-stack framework; `src/app/` with route groups
- React 19.2.3 - UI rendering; React Compiler enabled (`reactCompiler: true` in `next.config.ts`)

**CSS/UI:**
- Tailwind CSS v4 (`@tailwindcss/postcss` v4) - `@theme inline` is source of truth; `tailwind.config.ts` is dead code
- shadcn/ui pattern (components at `src/components/ui/`, 70+ components)
- Radix UI primitives (alert-dialog, checkbox, dialog, label, progress, radio-group, scroll-area, select, slot)
- Framer Motion v12 - Page transitions, layout animations
- GSAP 3.14 + `@gsap/react` - Fly-to-cart and hero animations; presets in `src/lib/gsap/`
- Lucide React v0.562 - Icons (tree-shaken via `modularizeImports`)

**State Management:**
- Zustand v5 - Client stores in `src/lib/stores/` (cart-store, checkout-store, driver-store, cart-animation-store)
- TanStack React Query v5 - Server state, cache management

**Forms & Validation:**
- React Hook Form v7 + Zod v4 - All forms; `@hookform/resolvers` bridges the two

**Testing:**
- Vitest 4.0.17 - Unit tests; jsdom environment; config in `vitest.config.ts`
- Playwright v1.57 - E2E tests; config in `playwright.config.ts`; Chromium + Mobile Chrome
- @testing-library/react v16 + @testing-library/jest-dom v6 - Assertion helpers
- Storybook v10 - Component development; `@storybook/nextjs-vite`
- Chromatic - Visual regression via `chromatic.config.js`
- Lighthouse CI (`@lhci/cli`) - Performance budget enforcement

**Build/Dev:**
- esbuild v0.27 - Compiles `src/app/sw.ts` → `public/sw.js` via `scripts/build-sw.mjs`
- `@next/bundle-analyzer` - Bundle analysis via `ANALYZE=true pnpm build`
- Husky v9 + lint-staged v16 - Pre-commit hooks (ESLint + Stylelint on staged files)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` v2.90 + `@supabase/ssr` v0.8 - Database client; three client variants in `src/lib/supabase/`
- `stripe` v20 - Payment processing; lazy singleton in `src/lib/stripe/server.ts`
- `resend` v6.9 - Transactional email; singleton in `src/lib/email/client.ts`
- `@sentry/nextjs` v10 - Error tracking + session replay; wraps `next.config.ts`
- `@serwist/next` v9.5 + `serwist` v9.5 - PWA service worker; built separately via esbuild
- `@upstash/ratelimit` v2 + `@upstash/redis` v1.36 - Rate limiting; 13 limiters in `src/lib/rate-limit/client.ts`

**Infrastructure:**
- `zod` v4 - Schema validation for API routes and form inputs
- `date-fns` v4 - Date manipulation (delivery timezone logic)
- `idb-keyval` v6 - IndexedDB for offline cart persistence
- `svix` v1.86 - Resend webhook signature verification in `src/app/api/webhooks/resend/route.ts`
- `sharp` v0.34 - Server-side image processing for menu photos (`/api/admin/photos/process`)
- `browser-image-compression` v2 - Client-side image compression
- `react-easy-crop` v5 - Image cropping UI
- `@dnd-kit/core` v6 + `@dnd-kit/sortable` v10 - Drag-and-drop for admin menu ordering
- `recharts` v3 - Admin analytics charts
- `leaflet` v1.9 + `react-leaflet` v5 - Map rendering (driver interface)
- `@react-google-maps/api` v2.20 - Google Maps for customer address autocomplete; always `ssr: false`
- `fuse.js` v7 - Fuzzy search for order history
- `cmdk` v1.1 - Command palette
- `@tiptap/react` v3 + extensions - Rich text editor for admin emails
- `framer-motion` v12 - Animations
- `next-themes` v0.4 - Dark mode support
- `uuid` v13 - UUID generation
- `yaml` v2.8 - Menu seed parsing in `scripts/seed-menu.ts`
- `@vercel/analytics` v1.6 + `@vercel/speed-insights` v1.3 - Web analytics

**Dev-only:**
- `knip` v5 - Dead code detection
- `stylelint` v17 + `stylelint-config-standard` v40 - CSS linting
- ESLint v9 + `eslint-config-next` v15.5 + `eslint-plugin-import-x` - Linting with 62+ design token rules
- `prettier` v3.7 - Formatting
- `tsx` v4.19 - TypeScript script runner for seed scripts
- `fake-indexeddb` v6 - IndexedDB mock for tests
- `jsdom` v27 - DOM environment for Vitest
- `babel-plugin-react-compiler` v1 - React Compiler Babel transform

## Configuration

**Environment:**
- `.env.example` documents all required vars; `.env.local` for local dev (not committed)
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_API_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`
- Optional: `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, `SENTRY_AUTH_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_OPERATOR_PHONE`, `GOOGLE_SITE_VERIFICATION`
- App version injected at build: `NEXT_PUBLIC_APP_VERSION` (read from `package.json` in `next.config.ts`)

**Build:**
- `next.config.ts` - Main Next.js config; wraps `withSentryConfig` + `withBundleAnalyzer`
- `postcss.config.mjs` - PostCSS with `@tailwindcss/postcss`
- `tsconfig.json` - Strict TS; `@/*` path alias → `./src/*`; target ES2017
- `scripts/build-sw.mjs` - esbuild pipeline for service worker; run after `next build`
- `vercel.json` - Cron schedules (3 jobs)
- CSP headers configured inline in `next.config.ts`; tunnels Sentry via `/monitoring`

## Platform Requirements

**Development:**
- Node.js 24+ (inferred from runtime)
- pnpm (required; no npm/yarn scripts)
- Supabase CLI for local DB (`supabase/config.toml`; local port 54321)
- Stripe CLI for local webhook testing (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)

**Production:**
- Vercel (inferred from `@vercel/analytics`, `vercel.json` crons, `NEXT_PUBLIC_VERCEL_ENV` in Sentry config)
- Supabase hosted (Postgres 15 + Auth + Storage + RLS)
- Upstash Redis REST (rate limiting; falls back to in-memory 15 req/min when unconfigured)

---

*Stack analysis: 2026-04-04*
