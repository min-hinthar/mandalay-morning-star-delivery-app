# Learnings Index

Consolidated knowledge from working on this codebase. Scan this file first, then read topic files as needed.

| Topic            | File                  | Key Patterns                                                                                                                                               | Last Updated |
| ---------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Tailwind v4      | `tailwind-v4.md`      | `@theme inline` is only source of truth; `tailwind.config.ts` dead code; `@source not` for docs; auto-content scanning                                     | 2026-02-07   |
| React Patterns   | `react-patterns.md`   | Context memoization; hydration guards; event listeners in useEffect; portal escapes; Radix Slot fragments; useRef vs callback ref for conditional elements | 2026-02-16   |
| Mobile UX        | `mobile-ux.md`        | touchAction conflicts; scroll lock defer; bottom sheet fallbacks; backdrop blur mobile                                                                     | 2026-01-29   |
| Animation        | `animation.md`        | Framer Motion direction refs; GSAP ScrollTrigger; 3D transform + scale flickering; skeleton structure; **`loading="lazy"` + opacity:0 animated containers = images never load** | 2026-03-02   |
| Next.js          | `nextjs.md`           | Route groups not in URL; NEXT_REDIRECT uncatchable; Image aspect ratio; revalidatePath defaults to "page" (use "layout" for context/nav data); **always `next/image` for external URLs in PWAs (proxy avoids opaque response caching)** | 2026-03-03   |
| Design Tokens    | `design-tokens.md`    | Semantic token naming; contrast ratios; CSS vars for inline styles; fallback code auditing; non-existent token → transparent                               | 2026-02-16   |
| State Management | `state-management.md` | Single mutation owner; cart deduplication; store-level debounce                                                                                            | 2026-01-29   |
| Supabase Auth    | `supabase-auth.md`    | generateLink vs inviteUserByEmail; RLS JWT claims; metadata staleness; NEVER use action_link; idempotent migration DROP+CREATE; initplan wrappers; storage.objects ownership | 2026-02-19   |
| Testing          | `testing.md`          | E2E DOM removal for AnimatePresence; cmdk state binding; **stale tests after validation rule changes**                                                      | 2026-03-03   |
| Tooling          | `tooling.md`          | Git case rename; barrel cleanup; ESLint guards; .prettierignore non-source dirs; CI format:check + --max-warnings 0; **OneDrive + multi-terminal freeze fix**; **GH Actions permissions allowlist** | 2026-02-28   |
| Performance      | `performance.md`      | Lazy load below-fold; IntersectionObserver pause; willChange on interaction; tree-shaking                                                                  | 2026-01-29   |
| Data Schema      | `data-schema.md`      | Allergen single source (contains_* removed Phase 90); Fuse.js tuning for menu dataset; **PostgREST ambiguous FK hints required for multi-FK tables**; **IMMUTABLE wrapper for timestamptz index expressions**; **modifier_options slug prefixed with group slug (`__` separator)** | 2026-03-03   |

## Usage

- **Before debugging:** check relevant topic file + `ERROR_HISTORY.md`
- **After session:** `/retro` routes new learnings to correct topic file
- **Staleness:** `/retro` flags entries referencing deleted files or >90 days old
