# Technology Stack

**Analysis Date:** 2026-01-30

## Languages

**Primary:**
- TypeScript 5.x - All application code, strict mode enabled
- CSS 3 - Styling via Tailwind utilities and custom CSS

**Secondary:**
- JavaScript (ESM) - Configuration files (`*.config.mjs`, `*.config.js`)
- SQL - Database migrations and tests in `supabase/migrations/`

## Runtime

**Environment:**
- Node.js 25.2.1 (ES2017 target)
- Next.js 16.1.2 (App Router)

**Package Manager:**
- pnpm 10.28.0
- Lockfile: `pnpm-lock.yaml` present
- Workspace: `pnpm-workspace.yaml` configured

## Frameworks

**Core:**
- Next.js 16.1.2 - React framework with App Router
- React 19.2.3 - UI library
- React DOM 19.2.3 - React rendering

**Testing:**
- Vitest 4.0.17 - Unit test runner (jsdom environment)
- Playwright 1.57.0 - E2E testing (Chromium, Mobile Chrome)
- @testing-library/react 16.3.1 - Component testing utilities
- @axe-core/playwright 4.11.0 - Accessibility testing

**Build/Dev:**
- Vite 7.3.1 - Build tool for Vitest
- tsx 4.19.2 - TypeScript execution for scripts
- Husky 9.1.7 - Git hooks
- lint-staged 16.2.7 - Pre-commit linting

**Linting/Formatting:**
- ESLint 9 - JavaScript/TypeScript linting (flat config)
- Prettier 3.7.4 - Code formatting
- Stylelint 17.0.0 - CSS linting

**UI Component Libraries:**
- Radix UI - Accessible component primitives (Dialog, Checkbox, Toast, ScrollArea, etc.)
- Vaul 1.1.2 - Mobile drawer component
- cmdk 1.1.1 - Command palette

**Animation:**
- Framer Motion 12.26.1 - React animation library
- GSAP 3.14.2 - High-performance animations
- @gsap/react 2.1.2 - GSAP React integration

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- @tailwindcss/postcss 4 - PostCSS integration
- tailwindcss-animate 1.0.7 - Animation utilities
- tailwind-merge 3.4.0 - Class name merging
- class-variance-authority 0.7.1 - Variant styling

**Design System:**
- Storybook 10.1.11 - Component development environment
- Chromatic (via chromatic.config.js) - Visual regression testing

## Key Dependencies

**Critical:**
- @supabase/ssr 0.8.0 - Supabase SSR support for Next.js
- @supabase/supabase-js 2.90.1 - Supabase client library
- stripe 20.1.2 - Stripe server SDK
- @stripe/stripe-js 8.6.1 - Stripe client SDK
- @react-google-maps/api 2.20.8 - Google Maps React integration

**State Management:**
- Zustand 5.0.10 - Lightweight state management
- @tanstack/react-query 5.90.1 - Server state management

**Form Handling:**
- react-hook-form 7.71.1 - Form state management
- @conform-to/react 1.15.1 - Form validation library
- @conform-to/zod 1.15.1 - Zod integration for Conform
- @hookform/resolvers 5.2.2 - Validation resolvers
- Zod 4.3.5 - Schema validation

**Monitoring:**
- @sentry/nextjs 10.34.0 - Error tracking and performance monitoring
- @vercel/analytics 1.6.1 - Web analytics
- web-vitals 5.1.0 - Core Web Vitals tracking

**Data Visualization:**
- recharts 3.6.0 - Charting library

**Utilities:**
- date-fns 4.1.0 - Date manipulation
- uuid 13.0.0 - UUID generation
- lucide-react 0.562.0 - Icon library
- clsx 2.1.1 - Conditional class names
- next-themes 0.4.6 - Theme management
- yaml 2.8.2 - YAML parsing

## Configuration

**Environment:**
- Environment variables via `.env`, `.env.local`, `.env.example`
- Required: Supabase URL/keys, Stripe keys, Google Maps API key, Sentry DSN, Resend API key
- `.envrc` for direnv integration

**Build:**
- `next.config.ts` - Next.js configuration with Sentry integration and bundle analyzer
- `tsconfig.json` - TypeScript configuration (strict mode, path aliases: `@/*` → `./src/*`)
- `tailwind.config.ts` - Extensive design system with custom colors, shadows, animations
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration
- `eslint.config.mjs` - ESLint flat config with Next.js, TypeScript, Prettier presets
- `.prettierrc` - Prettier configuration (double quotes, semicolons, 100 char width)
- `.stylelintrc.json` - Stylelint configuration
- `postcss.config.mjs` - PostCSS with Tailwind plugin

**Instrumentation:**
- `instrumentation.ts` - Server instrumentation
- `instrumentation-client.ts` - Client instrumentation
- `sentry.server.config.ts` - Sentry server config
- `sentry.edge.config.ts` - Sentry edge config

## Platform Requirements

**Development:**
- Node.js 25.2.1+
- pnpm 10.28.0+
- Git with Husky hooks

**Production:**
- Vercel (inferred from @vercel/analytics and Next.js optimizations)
- Supabase hosted database
- Stripe for payments
- Sentry for error tracking

---

*Stack analysis: 2026-01-30*
