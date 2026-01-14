# Task: V0-001 — Project Scaffold + Infrastructure

> **Priority**: P0 (Blocking)  
> **Milestone**: V0 — Skeleton  
> **Estimated**: 2-3 hours  
> **Branch**: `feat/scaffold-infrastructure`

---

## Objective

Set up the foundational project structure with Next.js 15, Tailwind, shadcn/ui, Supabase client, and CI pipeline. This unblocks all subsequent development.

---

## Acceptance Criteria

- [ ] Next.js 15 App Router project initialized with TypeScript strict mode
- [ ] Tailwind CSS configured with brand color tokens
- [ ] shadcn/ui installed with base components (Button, Card, Input, Dialog, Drawer, Badge)
- [ ] Framer Motion installed and configured
- [ ] Supabase client configured (browser + server)
- [ ] Environment variables structure in place
- [ ] ESLint + Prettier configured
- [ ] Vitest configured for unit tests
- [ ] GitHub Actions CI pipeline (lint, typecheck, test, build)
- [ ] Basic folder structure per PROJECT_SPEC.md
- [ ] PWA manifest + meta tags for mobile
- [ ] Homepage renders with brand logo

---

## Technical Specification

### 1. Initialize Project

```bash
pnpm create next-app@latest mandalay-morning-star --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd mandalay-morning-star
```

### 2. Install Dependencies

```bash
# Core
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add stripe @stripe/stripe-js
pnpm add framer-motion
pnpm add zustand
pnpm add zod
pnpm add date-fns

# UI
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input dialog drawer badge skeleton toast

# Dev
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
pnpm add -D husky lint-staged
pnpm add -D @types/node
```

### 3. Tailwind Config (Brand Tokens)

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from logo
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E8D48A",
          dark: "#B8960C",
        },
        brand: {
          red: "#8B1A1A",
          "red-light": "#A83232",
          "red-dark": "#5C1111",
          green: "#34A853",
        },
        // Semantic
        background: "#FDF8F0",
        foreground: "#2D2D2D",
        muted: {
          DEFAULT: "#6B6B6B",
          foreground: "#F5F5F5",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        burmese: ["Padauk", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 4. Folder Structure

```
src/
├── app/
│   ├── (public)/              # Public pages (no auth required)
│   │   ├── page.tsx           # Homepage with coverage check
│   │   └── menu/
│   │       └── page.tsx       # Menu browse
│   ├── (auth)/                # Auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (customer)/            # Authenticated customer pages
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   └── orders/
│   │       ├── page.tsx       # Order history
│   │       └── [id]/
│   │           └── page.tsx   # Order detail/tracking
│   ├── (admin)/               # Admin dashboard
│   │   └── admin/
│   │       ├── page.tsx       # Dashboard home
│   │       ├── orders/
│   │       │   └── page.tsx
│   │       └── menu/
│   │           └── page.tsx
│   ├── api/                   # API routes
│   │   ├── coverage/
│   │   │   └── check/
│   │   │       └── route.ts
│   │   ├── menu/
│   │   │   └── route.ts
│   │   ├── checkout/
│   │   │   └── session/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   ├── layout.tsx             # Root layout
│   ├── globals.css            # Global styles
│   └── not-found.tsx          # 404 page
├── components/
│   ├── ui/                    # shadcn components (auto-generated)
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── mobile-nav.tsx
│   ├── menu/                  # Menu-specific components
│   ├── cart/                  # Cart components
│   └── order/                 # Order components
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Auth middleware
│   ├── stripe/
│   │   └── client.ts
│   ├── maps/
│   │   └── client.ts
│   └── utils/
│       ├── cn.ts              # Class name utility
│       ├── format.ts          # Price/date formatters
│       └── constants.ts       # App constants
├── hooks/
│   └── use-cart.ts            # Cart hook (placeholder)
├── stores/
│   └── cart-store.ts          # Zustand cart store (placeholder)
├── types/
│   ├── database.ts            # Supabase generated types
│   ├── menu.ts                # Menu types
│   ├── order.ts               # Order types
│   └── api.ts                 # API request/response types
└── middleware.ts              # Next.js middleware (auth)
```

### 5. Supabase Client Setup

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  );
}
```

### 6. Environment Variables

Create `.env.local` (from `.env.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test --run
      - run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_placeholder
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: placeholder
          NEXT_PUBLIC_APP_URL: https://placeholder.vercel.app
```

### 8. PWA Manifest

```json
// public/manifest.json
{
  "name": "Mandalay Morning Star",
  "short_name": "Morning Star",
  "description": "Burmese food delivery for Saturday",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FDF8F0",
  "theme_color": "#8B1A1A",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 9. Homepage Placeholder

```tsx
// src/app/(public)/page.tsx
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Image
        src="/logo.png"
        alt="Mandalay Morning Star"
        width={200}
        height={200}
        priority
      />
      <h1 className="mt-6 text-3xl font-display text-brand-red">
        Mandalay Morning Star
      </h1>
      <p className="mt-2 text-muted text-center max-w-md">
        Authentic Burmese cuisine delivered to your door every Saturday.
      </p>
      <p className="mt-8 text-sm text-muted">
        🚧 Coming Soon — Check back for ordering!
      </p>
    </main>
  );
}
```

---

## Test Plan

### Unit Tests
```typescript
// src/lib/utils/__tests__/format.test.ts
import { describe, it, expect } from "vitest";
import { formatPrice } from "../format";

describe("formatPrice", () => {
  it("formats cents to dollars", () => {
    expect(formatPrice(1500)).toBe("$15.00");
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice(99)).toBe("$0.99");
  });
});
```

### Build Verification
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm build` completes successfully
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] Homepage renders with logo on mobile viewport

---

## Definition of Done

1. [ ] All acceptance criteria checked
2. [ ] CI pipeline passes
3. [ ] PR approved and merged to `main`
4. [ ] Vercel preview deployment works
5. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Use the exact folder structure specified
- Don't add features not in this task (no auth yet, no menu data)
- Keep placeholder pages minimal
- Ensure TypeScript strict mode is enabled in `tsconfig.json`
- Add the uploaded logo to `public/logo.png`

---

*Task created: 2026-01-12 | Ready for implementation*
