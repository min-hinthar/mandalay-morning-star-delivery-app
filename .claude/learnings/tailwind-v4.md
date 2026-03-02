# Tailwind v4 Learnings

## `tailwind.config.ts` Is Dead Code

In Tailwind v4 + Turbopack, config file and `@config` directive are silently ignored. Only `@theme inline {}` in `globals.css` generates utilities. Self-referencing pattern: `--color-foo: var(--color-foo);`

**Verify:** Playwright `browser_evaluate` — computed style of `transparent` or `0px` = token not registered.

---

## `@source not` for Non-Source Dirs

Tailwind v4 auto-scans ALL files. Wildcards in docs generate invalid CSS. Add `@source not "../../docs"`, `@source not "../../.planning"`, etc.

---

## Z-Index Utilities

Custom `zIndex` theme extensions don't generate classes. Use `z-50` or `z-[60]`. CSS vars use `--z-index-modal`, utilities strip to `z-modal`.

---

## Mobile CSS Variable Resolution

`@theme inline` processes BEFORE `tokens.css`. Desktop masks with `backdrop-blur`, mobile doesn't. Use explicit Tailwind colors for mobile-critical backgrounds: `bg-white dark:bg-black md:bg-white/80 md:backdrop-blur-md`.
