# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- TypeScript 5 (strict) - all source files under `src/`, build scripts, config files
- SQL - Supabase migrations under `supabase/migrations/`

**Secondary:**
- JavaScript (ESM) - build scripts under `scripts/` (`.mjs`, `.js`)
- CSS - global styles at `src/app/globals.css`, component-level styles

## Runtime

**Environment:**
- Node.js 22 (pinned in `.github/workflows/ci.yml`)
- TypeScript target: ES2017 (`tsconfig.json`)
- Service worker target: Chrome 90 / Firefox 90 / Safari 15 (`scripts/build-sw.mjs`)

**Package Manager:**
- pnpm 10 (pinned in CI via `pnpm/action-setup@v4`)
- Lockfile: `pnpm-lock.yaml` present, `--frozen-lockfile` enforced in CI
- Workspace: `pnpm-workspace.yaml` (single-package workspace)

## Frameworks

**Core:**
- Next.js 16.1.2 - App Router, React Server Components, Server Actions
- React 19.2.3 with React Compiler enabled (`reactCompiler: true` in `next.config.ts`)
- React DOM 19.2.3

**UI / Styling:**
- Tailwind CSS v4 (`tailwindcss ^4`) - `@theme inline` in `src/app/globals.css` is source of truth; `tailwind.config.ts` is supplemental for shadcn/Radix compatibility
- `@tailwindcss/postcss ^4` - PostCSS plugin (`postcss.config.mjs`)
- shadcn/ui (style: "new-york", configured in `components.json`) - component primitives built on Radix UI
- Radix UI primitives: `react-alert-dialog`, `react-checkbox`, `react-dialog`, `react-label`, `react-progress`, `react-radio-group`, `react-scroll-area`, `react-select`, `react-slot`
- `tailwind-merge ^3.4.0` - class merging
- `tailwindcss-animate ^1.0.7` - animation keyframe plugin
- `class-variance-authority ^0.7.1` - component variant generation
- `clsx ^2.1.1` - conditional class utility

**Animation:**
- Framer Motion 12.26.1 - React declarative animations (import optimized in `next.config.ts`)
- GSAP 3.14.2 + `@gsap/react ^2.1.2` - imperative animations with React hooks

**State Management:**
- Zustand 5.0.10 - client-side stores (`src/lib/stores/`: cart-store, checkout-store, driver-store, cart-animation-store)
- TanStack React Query 5.90.1 - server state, caching, background sync (`src/lib/providers/query-provider.tsx`)

**Forms & Validation:**
- React Hook Form 7.71.1
- `@hookform/resolvers ^5.2.2` - Zod adapter
- Zod 4.3.5 - schema validation (`src/lib/validations/`, `src/lib/validators/`)

**Rich Text:**
- Tiptap 3.19.0 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/pm`)

**Maps:**
- `@react-google-maps/api ^2.20.8` - Google Maps React wrapper (always `ssr: false` dynamic import - crashes SSR)
- `leaflet ^1.9.4` + `react-leaflet ^5.0.0` + `@types/leaflet ^1.9.21` - Leaflet maps (delivery zone visualization)

**Charts:**
- Recharts 3.6.0 - admin analytics charts

**Search:**
- `fuse.js ^7.1.0` - fuzzy search (menu search, `src/lib/search/`)
- `cmdk ^1.1.1` - command palette component

**Image Processing:**
- `sharp ^0.34.5` - server-side image processing (WebP conversion, 4:3 crop) used in `/api/admin/photos/process`
- `browser-image-compression ^2.0.2` - client-side compression
- `react-easy-crop ^5.5.6` - image cropping UI

**Offline / PWA:**
- `serwist ^9.5.4` + `@serwist/next ^9.5.4` + `@serwist/build ^9.5.6`
- Service worker built separately via `scripts/build-sw.mjs` (esbuild + `@serwist/build getManifest`)
- SW source: `src/app/sw.ts` → compiled to `public/sw.js` (excluded from tsconfig)
- Registration hook: `src/lib/hooks/useServiceWorker.ts`
- Precached routes: `/`, `/menu`, `/cart`, `/offline`
- `idb-keyval ^6.2.2` - IndexedDB wrapper for offline cart persistence (`src/lib/services/cart-idb-storage.ts`)

**Data Utilities:**
- `date-fns ^4.1.0` - date formatting and manipulation
- `uuid ^13.0.0` - UUID generation
- `yaml ^2.8.2` - YAML parsing for menu seed data (`data/`)

**Drag & Drop:**
- `@dnd-kit/core ^6.3.1` + `@dnd-kit/sortable ^10.0.0` + `@dnd-kit/utilities ^3.2.2` - admin menu/route ordering

**Icons:**
- `lucide-react ^0.562.0` - icon library (modularized in `next.config.ts` via `modularizeImports`)

**Fonts:**
- `@fontsource-variable/inter ^5.2.8` - Inter variable font
- `@fontsource-variable/playfair-display ^5.2.8` - Playfair Display variable font
- Nunito (display/body) and Padauk (Burmese script) registered in Tailwind theme

**Theming:**
- `next-themes ^0.4.6` - dark/light mode toggle

**Rate Limiting:**
- `@upstash/ratelimit ^2.0.8` - rate limiter (all limiters currently null; in-memory fallback active at 15 req/min)
- `@upstash/redis ^1.36.2` - Redis client (not connected; requires Upstash REST endpoint)

**Webhook Verification:**
- `svix ^1.86.0` - HMAC signature verification for Resend webhooks (`src/app/api/webhooks/resend/route.ts`)

## Build Configuration

**`next.config.ts`:**
- `reactCompiler: true` - auto-memoizes all client components
- `reactStrictMode: true`
- `compress: true`
- `removeConsole` in production (preserves `error`, `warn`)
- Image optimization: avif + webp, qualities [70, 85], 30-day cache TTL
- `serverExternalPackages: ["@react-email/render"]` - prevents Turbopack bundling issues
- `optimizePackageImports` for lucide-react, framer-motion, all Radix UI, recharts, date-fns, @react-google-maps/api
- `modularizeImports` for lucide-react (ESM icon paths)
- Server Actions `bodySizeLimit: "2mb"`
- CSP headers with Sentry report-uri, Google Maps domains, Supabase domains
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, Permissions-Policy
- Remote image patterns: `**.supabase.co`, `drive.google.com`, `**.googleusercontent.com`
- Wrapped by: `withSentryConfig` then `withBundleAnalyzer`

**Sentry config:**
- `sentry.client.config.ts` - session replay (10% sessions, 100% on error), traces 20% in prod
- `sentry.server.config.ts` - extra error data depth 5
- `sentry.edge.config.ts` - edge runtime support
- Tunnel route: `/monitoring` (ad-blocker bypass)
- Org: `mandalay-morning-star`, Project: `mandalay-morning-star-delivery-app`

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js + Sentry + bundle analyzer |
| `tsconfig.json` | TypeScript strict config, `@/*` alias |
| `eslint.config.mjs` | ESLint flat config (design token enforcement, circular deps, max-lines 400) |
| `vitest.config.ts` | Vitest unit tests (jsdom, setupFiles, `@` alias) |
| `playwright.config.ts` | E2E config (chromium + Pixel 5 mobile, visual regression) |
| `tailwind.config.ts` | Tailwind theme extension for shadcn compat + design tokens |
| `postcss.config.mjs` | PostCSS with Tailwind v4 plugin |
| `sentry.client.config.ts` | Sentry browser: replay integration |
| `sentry.server.config.ts` | Sentry server: extra error data |
| `sentry.edge.config.ts` | Sentry edge runtime |
| `instrumentation.ts` | Next.js instrumentation hook (loads Sentry per runtime) |
| `instrumentation-client.ts` | Client-side instrumentation |
| `vercel.json` | Vercel cron jobs (3 crons: delivery-reminders 15:00, admin-digest 14:00+06:00 UTC) |
| `components.json` | shadcn/ui config (new-york style, lucide icons) |
| `chromatic.config.js` | Chromatic visual regression (5 breakpoints, TurboSnap enabled) |
| `lighthouserc.js` | Lighthouse CI (5 public URLs, mobile profile, LCP/CLS error gates) |
| `knip.json` | Dead code detection |
| `supabase/config.toml` | Supabase local dev (Postgres 15, port 54321, pgTAP, plpgsql_check) |

## Dev Tooling

**Code Quality:**
- ESLint 9 (flat config) - extends `next/core-web-vitals`, `next/typescript`, `prettier`
- `eslint-plugin-import-x ^4.16.1` - circular dependency detection (`no-cycle`, maxDepth: 10)
- `eslint-plugin-storybook ^10.1.11` - Storybook-specific linting
- Prettier 3.7.4 - code formatting
- Stylelint 17 + `stylelint-config-standard ^40.0.0` - CSS linting
- `eslint-config-prettier ^10.1.8` - disables formatting conflicts

**Design Token Enforcement (ESLint):**
- Hardcoded hex colors in Tailwind classes → error
- Hardcoded `text-white`, `bg-white`, `text-black`, `bg-black` → error (use semantic tokens)
- Arbitrary font sizes `text-[Npx]` → error
- Arbitrary spacing/padding/gap `p-[Npx]`, `m-[Npx]` → error
- Hardcoded `boxShadow`, `backdropFilter blur(Npx)`, `transitionDuration` → error (use CSS vars)
- Arbitrary duration `duration-[Nms]` → error
- Inline `zIndex: 50` → error (use zIndex tokens)
- File max-lines: 400 (warning, excluding `src/types/**`, test files, stories)

**Pre-commit:**
- Husky 9.1.7 (`.husky/pre-commit`) + lint-staged 16.2.7
- Staged `.ts/.tsx`: ESLint `--max-warnings=0`
- Staged `.css`: Stylelint

**Dead Code:**
- Knip 5.82.1 (`knip.json`)

**Bundle Analysis:**
- `@next/bundle-analyzer ^16.1.3` - activated via `ANALYZE=true pnpm build`
- `pnpm analyze:server` / `pnpm analyze:browser` for split analysis

**Performance:**
- `@lhci/cli ^0.15.1` - Lighthouse CI (mobile-only, 3 runs per URL)

**Visual Regression:**
- Storybook 10.1.11 (`@storybook/nextjs-vite`) at port 6006
- Chromatic (`@chromatic-com/storybook ^5.0.0`) - visual regression CI
- Storybook addons: a11y, docs, onboarding, vitest

**Testing Utilities:**
- `@testing-library/react ^16.3.1` + `@testing-library/jest-dom ^6.9.1`
- `@axe-core/playwright ^4.11.0` - accessibility checks in E2E
- `fake-indexeddb ^6.2.5` - IndexedDB mock for Vitest
- `jsdom ^27.4.0` - DOM environment

**Build Utilities:**
- `tsx ^4.19.2` - TypeScript script runner (`pnpm seed:menu`, `pnpm launch:check`)
- `esbuild ^0.27.2` - service worker bundling in `scripts/build-sw.mjs`
- `vite ^7.3.1` + `@vitejs/plugin-react ^5.1.2` - Vitest/Storybook build

**React Compiler:**
- `babel-plugin-react-compiler ^1.0.0` - Babel plugin integration

## Platform Requirements

**Development:**
- Node.js 22, pnpm 10
- Supabase CLI for local DB (API: 54321, DB: 54322, Studio: 54323)
- Supabase extensions: pgTAP 1.3.1 (DB tests), plpgsql_check 1.2.3 (PL/pgSQL lint)

**Production:**
- Vercel (inferred from `vercel.json`, `@vercel/analytics`, `@vercel/speed-insights`, `VERCEL_ENV`/`VERCEL_GIT_COMMIT_SHA` env vars)
- Sentry tunnel route `/monitoring` for ad-blocker bypass

## CI/CD

**Pipeline:** GitHub Actions (`.github/workflows/ci.yml`)

| Job | Trigger | Dependencies | Notes |
|-----|---------|-------------|-------|
| `changes` | push/PR to main | none | dorny/paths-filter detects src changes |
| `lint` | push/PR to main | none | ESLint + Stylelint + Prettier |
| `typecheck` | push/PR to main | none | tsc --noEmit |
| `test` | push/PR to main | none | Vitest, 5min timeout with hang workaround |
| `build` | push/PR to main | lint, typecheck, test | Produces `.next` artifact |
| `lighthouse` | PR only, src changed | build | treosh/lighthouse-ci-action@v12 |

---

*Stack analysis: 2026-03-18*
