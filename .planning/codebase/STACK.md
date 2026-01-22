# Technology Stack

**Analysis Date:** 2026-01-21

## Languages

**Primary:**
- TypeScript 5.x - Full codebase type safety
- React 19.2.3 - UI framework
- JSX/TSX - Component templates

**Secondary:**
- JavaScript - Configuration files, Node.js scripts
- SQL - Supabase database queries and migrations in `supabase/migrations/`

## Runtime

**Environment:**
- Node.js (version specified in package.json, targets ES2017)
- Next.js 16.1.2 - Full-stack framework with App Router

**Package Manager:**
- pnpm - Lock file ensures deterministic installs
- Lockfile: pnpm-lock.yaml (present)

## Frameworks

**Core:**
- Next.js 16.1.2 - Full-stack React framework with file-based routing
  - App Router for new pages
  - Middleware for authentication (see `src/proxy.ts`)
  - Server Components and Client Components
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**State & Data:**
- Zustand 5.0.10 - Client-side state management (cart, UI state)
- TanStack React Query 5.90.1 - Server state, caching, synchronization
  - Configured in `src/lib/providers/query-provider.tsx`
  - 5-minute stale time, refetch disabled on window focus

**Forms & Validation:**
- React Hook Form 7.71.1 - Form state management
- Zod 4.3.5 - Schema validation and TypeScript inference
- conform-to/react 1.15.1 - Form composition library
- @hookform/resolvers 5.2.2 - Bridge between Hook Form and Zod

**UI Components:**
- Radix UI - Unstyled accessible components
  - Dialog, Alert Dialog, Checkbox, Label, Progress, Radio Group, Scroll Area, Toast, Slot
- Class Variance Authority 0.7.1 - Component style variants
- Tailwind CSS 4 - Utility-first CSS framework
  - Uses PostCSS plugin: @tailwindcss/postcss
  - Color tokens via CSS custom properties (Pepper aesthetic)
  - Dark mode support (class-based)
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.4.0 - Merge Tailwind classes without conflicts
- tailwindcss-animate 1.0.7 - Animation utilities

**Animation:**
- Framer Motion 12.26.1 - React animation library
- next-themes 0.4.6 - Theme persistence and switching

**Maps & Location:**
- @react-google-maps/api 2.20.8 - Google Maps React bindings
  - Used in `src/components/map/CoverageMap.tsx`
  - Used in `src/components/tracking/DeliveryMap.tsx`
- Google Maps APIs (Geocoding, Routes Optimization) - Server-side integration in `src/lib/services/`

**Charts & Analytics:**
- Recharts 3.6.0 - React charting library
- Web Vitals 5.1.0 - Core Web Vitals monitoring
- @sentry/nextjs 10.34.0 - Error tracking and performance monitoring

**Icons & Utilities:**
- Lucide React 0.562.0 - SVG icon library
- UUID 13.0.0 - Unique ID generation
- Date-fns 4.1.0 - Date manipulation
- YAML 2.8.2 - YAML parsing
- Vaul 1.1.2 - Drawer/sheet component

**Testing:**
- Vitest 4.0.17 - Unit test runner (Vite-native)
  - @vitest/browser-playwright 4.0.17 - Browser-based testing
  - @vitest/coverage-v8 4.0.17 - Code coverage
- @testing-library/react 16.3.1 - React component testing utilities
- @testing-library/jest-dom 6.9.1 - DOM matchers
- Playwright 1.57.0 - E2E testing framework
  - @axe-core/playwright 4.11.0 - Accessibility testing
- jsdom 27.4.0 - DOM implementation for Node.js

**Development:**
- ESLint 9 - Linting with flat config
  - eslint-config-next 15.5.9 - Next.js-specific rules
  - eslint-config-prettier 10.1.8 - Disable conflicting rules
  - eslint-plugin-storybook 10.1.11 - Storybook-specific rules
- Prettier 3.7.4 - Code formatter
- Stylelint 17.0.0 - CSS linting
  - stylelint-config-standard 40.0.0 - Standard CSS rules
- Storybook 10.1.11 - Component development environment
  - @storybook/addon-docs 10.1.11
  - @storybook/addon-a11y 10.1.11 - Accessibility addon
  - @storybook/addon-vitest 10.1.11 - Vitest integration
  - @chromatic-com/storybook 5.0.0 - Visual regression
  - @storybook/nextjs-vite 10.1.11 - Next.js + Vite integration
- Husky 9.1.7 - Git hooks
- lint-staged 16.2.7 - Run linters on staged files
- tsx 4.19.2 - TypeScript execution for scripts

**Build & Analysis:**
- Vite 7.3.1 - Build tool (used for Storybook)
- @vitejs/plugin-react 5.1.2 - React plugin for Vite
- @next/bundle-analyzer - Bundle size analysis (enabled via ANALYZE env var)

**Authentication:**
- @supabase/ssr 0.8.0 - Supabase server-side auth helpers
- @supabase/supabase-js 2.90.1 - Supabase client library

**Payments:**
- Stripe 20.1.2 - Server-side payment API
- @stripe/stripe-js 8.6.1 - Client-side Stripe library

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.90.1 - Database, auth, real-time subscriptions
- @supabase/ssr 0.8.0 - Server-side auth cookie management
- stripe 20.1.2 - Payment processing backend
- @stripe/stripe-js 8.6.1 - Payment processing frontend
- @sentry/nextjs 10.34.0 - Error tracking and monitoring
- @tanstack/react-query 5.90.1 - Server state management

**Infrastructure:**
- react-hook-form 7.71.1 - Form validation
- zod 4.3.5 - Type-safe schema validation
- @react-google-maps/api 2.20.8 - Maps integration
- recharts 3.6.0 - Data visualization
- framer-motion 12.26.1 - Animations

## Configuration

**Environment:**
- Required for development: `.env.local`
- Template provided: `.env.example` (includes all required variables)
- Key variables:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public API key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-only)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
  - `STRIPE_SECRET_KEY` - Stripe secret key
  - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
  - `GOOGLE_MAPS_API_KEY` - Google Maps API key
  - `RESEND_API_KEY` - Resend email service key
  - `FROM_EMAIL` - Sender email address
  - `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking DSN
  - `NEXT_PUBLIC_APP_URL` - Application URL
  - `SENTRY_AUTH_TOKEN` - Sentry source map upload token (CI/CD only)

**Build:**
- `tsconfig.json` - TypeScript compiler options (strict mode enabled)
- `next.config.ts` - Next.js configuration
  - Sentry integration via `withSentryConfig`
  - Bundle analyzer support
  - Image optimization (AVIF, WebP formats)
  - React strict mode enabled
  - Package import optimization for lucide-react, framer-motion, Radix UI, recharts, date-fns
  - Server Actions size limit: 2MB
  - Performance targets: FCP < 1.5s, LCP < 2.5s, CLS < 0.1, TBT < 200ms
- `tailwind.config.ts` - Tailwind CSS configuration
  - Color tokens via CSS variables
  - Dark mode support
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration
- `.eslintrc.mjs` - ESLint flat config
- `sentry.server.config.ts` - Sentry server configuration
- `sentry.edge.config.ts` - Sentry edge configuration

## Platform Requirements

**Development:**
- Node.js 18+ (targets ES2017 compatibility)
- pnpm 8+ (uses pnpm-lock.yaml)
- Git (Husky for pre-commit hooks)

**Production:**
- Vercel (implied by Next.js 16 App Router and Sentry integration)
- Supabase instance (PostgreSQL with RLS)
- Stripe account (production keys)
- Google Cloud project (Maps APIs enabled)
- Resend account (email delivery)
- Sentry project (error tracking)

---

*Stack analysis: 2026-01-21*
