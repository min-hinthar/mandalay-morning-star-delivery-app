# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- TypeScript 5 (strict) - All application code in `src/`, strict mode with `noUnusedLocals`, `noUnusedParameters`

**Secondary:**
- JavaScript (ESM) - Build scripts in `scripts/*.mjs`, config files
- CSS - Tailwind v4 utility classes + custom CSS in `src/`

## Runtime

**Environment:**
- Node.js (version inferred from `@types/node: ^20`)

**Package Manager:**
- pnpm (workspace-aware, `pnpm-workspace.yaml` present)
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- Next.js 16.1.2 (`next` package) - App Router, Server Components, Server Actions
- React 19.2.3 (`react`, `react-dom`) - Concurrent features enabled
- React Compiler (`babel-plugin-react-compiler: ^1.0.0`) - Auto-memoization, replaces manual useMemo/useCallback

**Styling:**
- Tailwind CSS v4 (`tailwindcss: ^4`) with `@tailwindcss/postcss` - `@theme inline` is source of truth, not `tailwind.config.ts`
- shadcn/ui pattern via `components.json` - Radix UI primitives with class-variance-authority
- Radix UI - 9 packages (`@radix-ui/react-*`) for accessible headless components
- tailwind-merge + clsx for conditional class merging

**Animation:**
- Framer Motion 12.26.1 - Page/component transitions
- GSAP 3.14.2 + `@gsap/react` - Complex scroll and timeline animations
- `tailwindcss-animate` - CSS animation utilities

**State:**
- Zustand 5.0.10 - Client state: `cart-store.ts`, `checkout-store.ts`, `driver-store.ts`, `cart-animation-store.ts`
- TanStack React Query 5.90.1 - Server state caching and synchronization

**Forms:**
- React Hook Form 7.71.1 + Zod 4.3.5 via `@hookform/resolvers`

**Testing:**
- Vitest 4.0.17 - Unit tests (`pnpm test`)
- Playwright 1.57.0 - E2E tests (`pnpm test:e2e`)
- Testing Library 16.3.1 - React component testing utilities
- Storybook 10.1.11 (`@storybook/nextjs-vite`) - Component development and visual testing

**Build/Dev:**
- Vite 7.3.1 - Used by Storybook and Vitest
- esbuild 0.27.2 - Fast compilation support
- tsx 4.19.2 - TypeScript script execution for seed/migration scripts

## Key Dependencies

**Critical:**
- `@supabase/ssr: ^0.8.0` - SSR-compatible Supabase client (cookie-based auth)
- `@supabase/supabase-js: ^2.90.1` - Supabase JS client
- `stripe: ^20.1.2` - Stripe server-side SDK
- `resend: ^6.9.1` - Email delivery
- `@react-email/components: ^1.0.7` + `@react-email/render: ^2.0.4` - React-based email templates
- `svix: ^1.86.0` - Webhook signature verification (used for Resend webhook HMAC)
- `@upstash/ratelimit: ^2.0.8` + `@upstash/redis: ^1.36.2` - Rate limiting packages (currently null/disabled, in-memory fallback active)
- `@sentry/nextjs: ^10.38.0` - Error monitoring
- `@serwist/next: ^9.5.4` - PWA service worker (built separately via `scripts/build-sw.mjs`)

**Maps & Geospatial:**
- `@react-google-maps/api: ^2.20.8` - Google Maps React integration (always `ssr: false`)
- `leaflet: ^1.9.4` + `react-leaflet: ^5.0.0` - Alternative map rendering

**Rich UI:**
- `@tiptap/react: ^3.19.0` + starter-kit + extensions - Rich text editor
- `@dnd-kit/core: ^6.3.1` + sortable + utilities - Drag-and-drop for route stop reordering
- `recharts: ^3.6.0` - Analytics charts in admin dashboard
- `fuse.js: ^7.1.0` - Client-side fuzzy search for menu
- `cmdk: ^1.1.1` - Command palette component

**Performance & PWA:**
- `idb-keyval: ^6.2.2` - IndexedDB key-value store for offline cart persistence
- `browser-image-compression: ^2.0.2` - Client-side image compression
- `sharp: ^0.34.5` - Server-side image processing for menu photo upload
- `react-easy-crop: ^5.5.6` - In-browser image cropping

**Infrastructure:**
- `date-fns: ^4.1.0` - Date manipulation
- `uuid: ^13.0.0` - UUID generation
- `yaml: ^2.8.2` - YAML parsing for menu seed data
- `web-vitals: ^5.1.0` - Core Web Vitals tracking
- `@vercel/analytics: ^1.6.1` + `@vercel/speed-insights: ^1.3.1` - Vercel platform analytics

## Configuration

**TypeScript:**
- Target: ES2017; strict mode; path alias `@/*` → `./src/*`
- Plugin: Next.js TS plugin for type inference
- Types: `@serwist/next/typings` for service worker types

**Next.js (`next.config.ts`):**
- React Compiler enabled (`reactCompiler: true`) — auto-memoizes all client components
- React Strict Mode enabled
- PPR disabled (commented out)
- `serverExternalPackages: ["@react-email/render"]` — prevents Turbopack bundling issues
- Modular imports for lucide-react (tree-shaking)
- `optimizePackageImports` list: lucide-react, framer-motion, all Radix UI, recharts, date-fns, @react-google-maps/api
- Server Actions bodySizeLimit: 2MB
- Images: AVIF + WebP, 30-day cache TTL, remote patterns for Supabase and Google Drive
- Console.log removal in production (keep error/warn)
- CSP headers: `unsafe-inline` + `unsafe-eval` required for Google Maps; Sentry tunnel at `/monitoring`

**ESLint:**
- Config at `eslint.config.mjs`; enforces 62+ design tokens (z-index, colors, spacing, shadows, blur)
- Max-lines warning at 400 lines per file
- `eslint-plugin-import-x` for import ordering

**Styling:**
- Prettier 3.7.4 for formatting
- Stylelint 17 + `stylelint-config-standard` for CSS

**Git Hooks:**
- husky + lint-staged: ESLint on `src/**/*.{ts,tsx}`, Stylelint on `src/**/*.css`

**PWA:**
- Service worker built via `scripts/build-sw.mjs` (Serwist) — runs after `next build`
- SW registration: `src/lib/hooks/useServiceWorker.ts`

**Environment:**
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Required: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Required: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`
- Required: `GOOGLE_MAPS_API_KEY`
- Optional: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_RELEASE`
- Optional: `NEXT_PUBLIC_APP_URL`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_ENV`
- Optional: `CHROMATIC_PROJECT_TOKEN`, `GOOGLE_SITE_VERIFICATION`

## Platform Requirements

**Development:**
- Node.js 20+
- pnpm workspace

**Production:**
- Vercel (deployment platform, `vercel.json` present with cron jobs)
- Cron jobs configured in `vercel.json`: delivery reminders (daily 15:00 UTC), admin digests (14:00 UTC morning, 06:00 UTC evening)

---

*Stack analysis: 2026-03-19*
