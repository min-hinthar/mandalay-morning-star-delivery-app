# Learnings Index

Consolidated knowledge from working on this codebase. Scan this file first, then read topic files as needed.

| Topic | File | Key Patterns | Last Updated |
|-------|------|-------------|--------------|
| Tailwind v4 | `tailwind-v4.md` | `@theme inline` is only source of truth; `tailwind.config.ts` dead code; `@source not` for docs; auto-content scanning | 2026-02-07 |
| React Patterns | `react-patterns.md` | Context memoization; hydration guards; event listeners in useEffect; portal escapes; Radix Slot fragments | 2026-01-30 |
| Mobile UX | `mobile-ux.md` | touchAction conflicts; scroll lock defer; bottom sheet fallbacks; backdrop blur mobile | 2026-01-29 |
| Animation | `animation.md` | Framer Motion direction refs; GSAP ScrollTrigger; 3D transform + scale flickering; skeleton structure | 2026-01-29 |
| Next.js | `nextjs.md` | Route groups not in URL; NEXT_REDIRECT uncatchable; Image aspect ratio; optimizePackageImports | 2026-01-29 |
| Design Tokens | `design-tokens.md` | Semantic token naming; contrast ratios; CSS vars for inline styles; fallback code auditing | 2026-02-07 |
| State Management | `state-management.md` | Single mutation owner; cart deduplication; store-level debounce | 2026-01-29 |
| Supabase Auth | `supabase-auth.md` | generateLink vs inviteUserByEmail; RLS JWT claims; metadata staleness; callback context | 2026-02-04 |
| Testing | `testing.md` | E2E DOM removal for AnimatePresence; cmdk state binding | 2026-01-25 |
| Tooling | `tooling.md` | Git case rename; barrel cleanup; ESLint guards; component organization | 2026-02-08 |
| Performance | `performance.md` | Lazy load below-fold; IntersectionObserver pause; willChange on interaction; tree-shaking | 2026-01-29 |

## Usage

- **Before debugging:** check relevant topic file + `ERROR_HISTORY.md`
- **After session:** `/retro` routes new learnings to correct topic file
- **Staleness:** `/retro` flags entries referencing deleted files or >90 days old
