# Learnings Index

| Topic | File | Last Updated |
|-------|------|-------------|
| CSS Transforms & Animation Conflicts | `css-3d-transforms.md` | 2026-02-17 |
| UI Polish Patterns | `ui-polish-patterns.md` | 2026-02-21 |
| GSD Workflow | `gsd-workflow.md` | classifyHandoffIfNeeded workaround; patch persistence; agent teams vs subagents; checkpoint feedback rounds; subagent files invisible to git on OneDrive; parallel agent lint-staged cross-contamination; **gsd-tools commit fix (patched + #733)**; Windows tmpfile JSON parsing; auto-advance chain stops; curated auto-mode blueprint; upstream path portability; worktree isolation fix; **CLI freeze consolidated guide (hooks+statusline+plugins = remove, don't optimize)**; **general-purpose subagent workaround is intentional (MCP bug #13898)**; **phase complete ROADMAP fallback + plan checkboxes (patched)**; **context efficiency patterns (subagent offload, deferred templates, incremental persistence)** | 2026-02-25 |
| Browser APIs | `browser-apis.md` | WAAPI mirror/spring patterns; focus() preventScroll; mobile autoplay unlock pool; history API guard for Safari rate limit; React Router v7 state corruption | 2026-02-22 |
| Next.js CSP | `nextjs-csp.md` | 2026-02-21 |
| Next.js App Router Build | `nextjs-app-router.md` | 2026-02-24 |
| PWA & Viewport Meta | `pwa-viewport-meta.md` | 2026-02-14 |
| React Patterns & Gotchas | `react-patterns.md` | 2026-02-21 |
| npm/pnpm Security Audit | `npm-security-audit.md` | pnpm overrides break transitive consumers; use --prod audit in CI; ignoreCves multi-path quirk | 2026-02-19 |
| Claude Code on Windows | `claude-code-windows.md` | PowerShell too slow for statusLine (~500ms startup); use Node.js (.mjs) instead (~130ms); MINGW64 bash mangles backslashes in JSON test pipes; **execSync + todos dir scan causes freeze storms — use file reads only, clean todos periodically**; **Cowork sdk-daemon + "already running" errors — VM socket bridge, ghost NAT fix in v1.1.4328, MCP init race condition**; **WSL2/Vmmem drains 1-2GB even without distros — disable if unused**; **zombie Node cleanup must be Cowork-safe (two-pass: discover CLI PIDs, then kill orphans only)**; **Cowork setup: Hyper-V-All feature unknown on Home — VirtualMachinePlatform is what WSL2 needs; Docker PATH requires terminal restart** | 2026-02-27 |
