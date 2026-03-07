# Technology Stack

**Analysis Date:** 2026-03-06

## Languages

**Primary:**
- TypeScript 5 (strict mode) - All application code (`src/`, config files)

**Secondary:**
- JavaScript (ES Modules) - Build scripts (`scripts/build-sw.mjs`, `scripts/audit-tokens.js`)
- YAML - Menu seed data (`data/`)
- SQL - Database migrations (`supabase/migrations/`)
- CSS - Tailwind v4 styles (`src/app/globals.css`)

## Runtime

**Environment:**
- Node.js (no `.nvmrc` pinning detected)
- Next.js 16.1.2 runtime (server + edge)

**Package Manager:**
- pnpm (lockfile: `pnpm-lock.yaml`)

## Frameworks

**Core:**
- Next.js 16.1.2 - App Router, React Server Components, Server Actions
- React 19.2.3 - UI rendering, React Compiler enabled (`reactCompiler: true` in `next.config.ts`)
- React DOM 19.2.3 - DOM rendering

**Styling:**
- Tailwind CSS v4 - Utility-first CSS (`@tailwindcss/postcss` v4)
- PostCSS - CSS processing (`postcss.config.mjs`)
- `tailwindcss-animate` 1.0.7 - Animation utilities
- `class-variance-authority` 0.7.1 - Component variant styling
- `clsx` 2.1.1 + `tailwind-merge` 3.4.0 - Class name composition

**UI Components:**
- Radix UI - Headless primitives (dialog, checkbox, select, radio-group, alert-dialog, label, progress, scroll-area, slot)
- shadcn/ui - Component system built on Radix (70+ components in `src/components/ui/`)
- Lucide React 0.562.0 - Icon system (modularized imports via `next.config.ts`)
- cmdk 1.1.1 - Command palette

**Animation:**
- Framer Motion 12.26.1 - React animation library
- GSAP 3.14.2 + `@gsap/react` 2.1.2 - Advanced animations

**Rich Text:**
- TipTap 3.19.0 - Rich text editor (starter-kit, link extension, placeholder extension)

**Maps:**
- `@react-google-maps/api` 2.20.8 - Google Maps React wrapper (client-side)
- Leaflet 1.9.4 + `react-leaflet` 5.0.0 - Alternative map rendering

**Charts:**
- Recharts 3.6.0 - Admin analytics charts

**Testing:**
- Vitest 4.0.17 - Unit test runner (config: `vitest.config.ts`)
- `@testing-library/react` 16.3.1 - Component testing
- `@testing-library/jest-dom` 6.9.1 - DOM assertions
- Playwright 1.57.0 - E2E tests (config: `playwright.config.ts`)
- `@axe-core/playwright` 4.11.0 - Accessibility testing
- jsdom 27.4.0 - Test DOM environment
- `fake-indexeddb` 6.2.5 - IndexedDB mocking

**Build/Dev:**
- esbuild 0.27.2 - Service worker bundling
- Vite 7.3.1 - Vitest backend
- `@next/bundle-analyzer` 16.1.3 - Bundle size analysis
- tsx 4.19.2 - TypeScript script runner

**Code Quality:**
- ESLint 9 - Linting (`eslint.config.mjs`)
- `eslint-config-next` 15.5.9 - Next.js ESLint rules
- `eslint-config-prettier` 10.1.8 - Prettier conflict resolution
- `eslint-plugin-import-x` 4.16.1 - Import ordering
- Prettier 3.7.4 - Code formatting
- Stylelint 17.0.0 - CSS linting
- Husky 9.1.7 - Git hooks
- lint-staged 16.2.7 - Pre-commit linting
- knip 5.82.1 - Dead code detection
- `babel-plugin-react-compiler` 1.0.0 - React Compiler babel plugin

**Documentation/Visual:**
- Storybook 10.1.11 - Component documentation (`@storybook/nextjs-vite`)
- Chromatic - Visual regression testing

**Performance:**
- Lighthouse CI (`@lhci/cli` 0.15.1) - Performance auditing

## Key Dependencies

**Critical (Revenue Path):**
- `stripe` 20.1.2 - Payment processing (server-side SDK)
- `@supabase/supabase-js` 2.90.1 + `@supabase/ssr` 0.8.0 - Database, auth, storage
- `resend` 6.9.1 - Transactional email delivery
- `@react-email/components` 1.0.7 + `@react-email/render` 2.0.4 - Email template rendering

**Infrastructure:**
- `@sentry/nextjs` 10.38.0 - Error tracking, performance monitoring
- `@upstash/ratelimit` 2.0.8 + `@upstash/redis` 1.36.2 - Rate limiting
- `@vercel/analytics` 1.6.1 - Usage analytics
- `@vercel/speed-insights` 1.3.1 - Performance metrics
- `svix` 1.86.0 - Webhook signature verification (Resend webhooks)
- `web-vitals` 5.1.0 - Core Web Vitals reporting

**Data/Validation:**
- `zod` 4.3.5 - Schema validation
- `react-hook-form` 7.71.1 + `@hookform/resolvers` 5.2.2 - Form management
- `zustand` 5.0.10 - Client state management (4 stores in `src/lib/stores/`)
- `@tanstack/react-query` 5.90.1 - Server state/caching

**Utilities:**
- `date-fns` 4.1.0 - Date manipulation
- `fuse.js` 7.1.0 - Fuzzy search
- `uuid` 13.0.0 - UUID generation
- `sharp` 0.34.5 - Image optimization (server-side)
- `browser-image-compression` 2.0.2 - Client-side image compression
- `react-easy-crop` 5.5.6 - Image cropping UI
- `yaml` 2.8.2 - YAML parsing (menu seed data)
- `idb-keyval` 6.2.2 - IndexedDB key-value store (offline support)

**PWA:**
- `@serwist/next` 9.5.4 + `serwist` 9.5.4 - Service worker / PWA (built separately via `scripts/build-sw.mjs`)
- `next-themes` 0.4.6 - Dark/light mode

**Fonts:**
- `@fontsource-variable/inter` 5.2.8 - Body font (self-hosted, loaded locally)
- `@fontsource-variable/playfair-display` 5.2.8 - Heading font (self-hosted, loaded locally)

## Configuration

**TypeScript:**
- `tsconfig.json` - strict mode, target ES2017, bundler moduleResolution
- Path alias: `@/*` maps to `./src/*`

**Build:**
- `next.config.ts` - React Compiler, image optimization, CSP headers, Sentry integration, modularized imports
- `postcss.config.mjs` - Tailwind CSS v4 via `@tailwindcss/postcss`
- `tailwind.config.ts` - Present but dead code (Tailwind v4 uses `@theme inline` in CSS)

**Sentry:**
- `sentry.server.config.ts` - Server-side Sentry init (20% trace sampling in prod)
- `sentry.edge.config.ts` - Edge runtime Sentry init (20% trace sampling in prod)
- Tunnel route: `/monitoring` (bypasses ad blockers)

**Vercel:**
- `vercel.json` - Cron job: `/api/cron/delivery-reminders` daily at 3 PM UTC

**Environment:**
- `.env.example` - Template with all required variables documented
- `.env.local` - Local environment (gitignored)

**Linting/Formatting:**
- `eslint.config.mjs` - ESLint 9 flat config
- Prettier 3.7.4 (config location not specified, likely `package.json` or `.prettierrc`)
- Stylelint 17.0.0 (`stylelint-config-standard`)

**Git Hooks:**
- Husky + lint-staged: ESLint on `src/**/*.{ts,tsx}`, Stylelint on `src/**/*.css`

## Platform Requirements

**Development:**
- Node.js (ES Module support required)
- pnpm package manager
- Stripe CLI (for local webhook testing)

**Production:**
- Vercel (deployment target)
- Supabase hosted instance (Postgres + Auth + Storage)
- Upstash Redis (rate limiting)
- Stripe account (payments)
- Resend account (transactional email)
- Google Cloud (Maps, Geocoding, Routes APIs)
- Sentry project (error tracking)

---

*Stack analysis: 2026-03-06*
