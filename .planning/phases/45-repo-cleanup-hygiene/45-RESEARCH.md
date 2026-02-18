# Phase 45: Repo Cleanup & Hygiene - Research

**Researched:** 2026-02-06
**Mode:** Ecosystem
**Confidence:** HIGH

---

## Executive Summary

Phase 45 is a low-risk housekeeping phase with well-established patterns. The scope includes:

1. Deleting 92 legacy design doc files (V0-V8) totaling ~17.5MB
2. Untracking storybook-static (14MB, 88 files currently tracked)
3. Archiving v1.0-v1.3 planning phases (34 phase directories)
4. Auditing .gitignore against Next.js/pnpm best practices
5. Updating README and creating PERFORMANCE.md

All operations use standard git commands (`git rm`, `git rm --cached`) with no history rewrite required. Files remain recoverable from git history.

---

## 1. Legacy Doc Deletion Scope

### Files to Delete

| Directory | Files  | Size        | Content                                 |
| --------- | ------ | ----------- | --------------------------------------- |
| docs/V0   | 16     | 264KB       | Original scaffold, PRD, task files      |
| docs/V1   | 13     | 228KB       | Sprint 1-2 task files                   |
| docs/V2   | 1      | 12KB        | Claude prompt file                      |
| docs/V3   | 28     | 3.8MB       | UI assets (PNG screenshots), UX specs   |
| docs/V4   | 11     | 112KB       | PRD, UX specs, sprint tasks             |
| docs/V5   | 10     | 128KB       | PRD, UX spec, sprint tasks              |
| docs/V6   | 1      | 20KB        | Pepper design doc                       |
| docs/V7   | 5      | 13MB        | Plan docs, UI assets (large PNGs, JSON) |
| docs/V8   | 1      | 8KB         | PRD_V8.md                               |
| **Total** | **92** | **~17.5MB** |                                         |

### v1-spec.md and v2-spec.md Status

Located at `docs/v1-spec.md` and `docs/v2-spec.md` (lowercase, outside V\* directories). Per CONTEXT.md decision "anything pre-v1.0 that isn't actively referenced goes" -- these should be deleted as they are pre-GSD v1.0 artifacts.

### Deletion Command

Single commit with all deletions:

```bash
git rm -r docs/V0 docs/V1 docs/V2 docs/V3 docs/V4 docs/V5 docs/V6 docs/V7 docs/V8 docs/v1-spec.md docs/v2-spec.md
```

**Recovery:** `git checkout <commit-hash> -- docs/V0` if ever needed.

---

## 2. Build Artifact Hygiene

### storybook-static (Currently Tracked)

**Status:** 88 files tracked in git
**Size:** 14MB
**Content:** Built Storybook site (HTML, JS, CSS, fonts, images)

**Untrack command:**

```bash
git rm -r --cached storybook-static
```

**.gitignore already contains:** `storybook-static` (line 59) but directory is tracked from before this was added.

### bash.exe.stackdump (Currently Tracked)

**Location:** Repository root
**Content:** Windows bash crash dump

**Untrack command:**

```bash
git rm --cached bash.exe.stackdump
```

**Add to .gitignore:** Already present (`*.stackdump` on line 55).

### No Other Tracked Artifacts Found

Verified clean:

- No tracked `.env` files
- No tracked `.next` directory
- No tracked `node_modules`
- No tracked build outputs
- No tracked coverage directories

---

## 3. .gitignore Audit

### Current .gitignore Assessment

| Category       | Current Status                                     | Best Practice          | Action       |
| -------------- | -------------------------------------------------- | ---------------------- | ------------ |
| Dependencies   | `/node_modules`                                    | OK                     | None         |
| pnpm specific  | `.pnpm-debug.log*`                                 | Missing `.pnpm-store/` | **Add**      |
| Build outputs  | `/.next/`, `/out/`, `/build`                       | OK                     | None         |
| Service worker | `/public/sw.js`, `/public/sw.js.map`               | OK                     | None         |
| Testing        | `/coverage`, `/test-results`, `/playwright-report` | OK                     | None         |
| Environment    | `.env*`                                            | OK                     | None         |
| TypeScript     | `*.tsbuildinfo`, `next-env.d.ts`                   | OK                     | None         |
| Vercel         | `.vercel`                                          | OK                     | None         |
| Misc           | `.DS_Store`, `*.pem`, `*.stackdump`                | Missing `Thumbs.db`    | **Add**      |
| Debug logs     | npm/yarn/pnpm debug logs                           | OK                     | None         |
| Storybook      | `storybook-static`                                 | OK (already present)   | None         |
| IDE            | Not present                                        | Consider adding        | **Optional** |

### Recommended Additions

```gitignore
# pnpm store (created in Docker environments)
.pnpm-store/

# Windows
Thumbs.db

# IDE (optional - user preference)
# .idea/
# .vscode/
# *.swp
# *.swo
```

**Note:** IDE files are often left to global gitignore (~/.gitignore_global). Optional for this project.

---

## 4. Planning Files Archival

### Phase Directory Analysis

**v1.0 MVP (Phases 1-8):** 8 directories - Archive
**v1.1 Tech Debt (Phases 9-14):** 6 directories - Archive
**v1.2 Playful UI (Phases 15-24):** 10 directories - Archive
**v1.3 Consolidation (Phases 25-34):** 10 directories - Archive
**v1.4 Mobile Excellence (Phases 35-39):** 8 directories - **KEEP** (per CONTEXT.md)
**v1.5 Performance (Phases 40-46):** 7 directories - **KEEP**

**Total to archive:** 34 phase directories (phases 01-34)

### Milestone Files to Archive

| File                    | Status                    |
| ----------------------- | ------------------------- |
| v1-ROADMAP.md           | Archive                   |
| v1-MILESTONE-AUDIT.md   | Archive                   |
| v1-REQUIREMENTS.md      | Archive                   |
| v1.1-ROADMAP.md         | Archive                   |
| v1.1-MILESTONE-AUDIT.md | Archive                   |
| v1.1-REQUIREMENTS.md    | Archive                   |
| v1.1-INTEGRATION.md     | Archive                   |
| v1.2-ROADMAP.md         | Archive                   |
| v1.2-MILESTONE-AUDIT.md | Archive                   |
| v1.2-REQUIREMENTS.md    | Archive                   |
| v1.3-ROADMAP.md         | Archive                   |
| v1.3-MILESTONE-AUDIT.md | Archive                   |
| v1.3-REQUIREMENTS.md    | Archive                   |
| v1.4-\* files           | **KEEP** (per CONTEXT.md) |
| v1.5-\* files           | **KEEP**                  |

### Recommended Archive Layout

**Option A: Grouped by milestone (Recommended)**

```
.planning/archive/
  v1.0/
    phases/
      01-foundation-token-system/
      02-overlay-infrastructure/
      ...
    milestones/
      v1-ROADMAP.md
      v1-MILESTONE-AUDIT.md
      v1-REQUIREMENTS.md
  v1.1/
    phases/
      09-analysis-component-creation/
      ...
    milestones/
      v1.1-ROADMAP.md
      ...
  v1.2/
    ...
  v1.3/
    ...
```

**Rationale:** Clear milestone boundaries, easy to navigate by version, consistent with how milestones are documented.

**Option B: Flat structure**

```
.planning/archive/
  phases/
    01-foundation-token-system/
    ...
    34-full-src-consolidation/
  milestones/
    v1-ROADMAP.md
    ...
    v1.3-REQUIREMENTS.md
```

**Archive command (Option A):**

```bash
mkdir -p .planning/archive/v1.0/{phases,milestones}
mv .planning/phases/{01,02,03,04,05,06,07,08}-* .planning/archive/v1.0/phases/
mv .planning/milestones/v1-* .planning/archive/v1.0/milestones/
# Repeat for v1.1, v1.2, v1.3
```

### Research Directory

**Current content:**

- ARCHITECTURE.md
- CONSOLIDATION.md
- FEATURES.md
- PITFALLS.md
- STACK.md
- STACK-mobile-optimization.md
- SUMMARY.md

Per CONTEXT.md: "Archive research directories alongside their phase dirs"

**Recommendation:** These are global research files, not phase-specific. Keep in `.planning/research/` as they inform ongoing work. Only archive research files that were phase-specific (none exist currently).

---

## 5. STATE.md and ROADMAP.md Trimming

### STATE.md Current Structure

- Project Reference section
- Current Position section
- Milestones summary table
- Accumulated Context (v1.5 key decisions, v1.4 key decisions)
- Tech Debt section
- Session Continuity section

**Trimming approach:**

1. Keep milestone summary table (shipped counts)
2. Remove v1.4 Key Decisions (not current milestone)
3. Keep v1.5 Key Decisions only
4. Update "Current Position" to reflect phase 45

### ROADMAP.md Current Structure

- Milestone list (v1.0-v1.5)
- Current Status section
- v1.5 phases with checkboxes
- `<details>` collapsed sections for v1.0-v1.4

**Trimming approach:**

1. Keep milestone list header
2. Keep v1.5 phase details expanded
3. Collapse v1.4 to single summary line (currently in `<details>`)
4. Remove v1.0-v1.3 `<details>` blocks entirely (refer to MILESTONES.md)
5. Keep Progress table

---

## 6. Documentation Updates

### README.md Current State

**Version info:**

- Current version: v1.4 (outdated - now v1.5)
- Status: "39 phases, 174 plans, 213 requirements" (outdated)
- Milestones table shows v1.5 as "TBD" (needs update)

**Updates needed:**

- Version: v1.5 Performance & Repo Health
- Phase count: 44 phases completed
- Plan count: 192 plans
- Requirement count: 214 requirements
- Add Performance section with LCP metrics

### Performance Section Content

From phase summaries, key metrics for PERFORMANCE.md:

| Metric                   | Before (v1.4)   | After (v1.5)     | Improvement |
| ------------------------ | --------------- | ---------------- | ----------- |
| LCP (Homepage)           | 19.9s           | 11.4s            | 43%         |
| LCP (Menu)               | 18.2s           | 9.8s             | 46%         |
| TBT (Homepage)           | 5.5s            | ~3.5s            | 36%         |
| TBT (Menu)               | 5.6s            | ~2.3s            | 59%         |
| CLS                      | 0               | 0                | Maintained  |
| Framer Motion bundle     | ~34KB/component | ~4.6KB/component | 86%         |
| motion.\* files migrated | 0               | 174              | -           |

**Additional optimizations to document:**

1. CardImage to Next.js Image conversion
2. Server Component wrapper pattern
3. LazyMotion with domMax
4. React Compiler enabled
5. Lighthouse CI regression gate

---

## 7. GitHub Workflows Audit

### Current Workflows

Only one workflow file exists: `.github/workflows/ci.yml`

**Jobs:**

- lint
- typecheck
- test (unit)
- build
- lighthouse (PR-only)

**Assessment:** Single, well-structured workflow. No stale workflows to remove.

**Recommendation:** No action needed on workflows.

---

## 8. Plan Recommendations

### Suggested Plan Structure

**Plan 45-01: Legacy Doc Deletion + Build Artifact Untracking**

- Delete docs/V0-V8 and v1-spec.md, v2-spec.md (92 files, ~17.5MB)
- Untrack storybook-static (88 files, 14MB)
- Untrack bash.exe.stackdump
- Single commit for all deletions
- Estimated: 15-30 minutes

**Plan 45-02: .gitignore Audit + Planning Files Archival**

- Add `.pnpm-store/` and `Thumbs.db` to .gitignore
- Create archive directory structure (milestone-grouped)
- Move phases 01-34 to archive
- Move v1.0-v1.3 milestone files to archive
- Trim STATE.md and ROADMAP.md
- Estimated: 30-45 minutes

**Plan 45-03: README Update + PERFORMANCE.md Creation**

- Full README refresh with v1.5 stats
- Add performance section with metrics
- Create PERFORMANCE.md with optimization journey (~3-4 pages)
- Document what worked, what didn't, takeaways
- Estimated: 1-2 hours

### Risk Assessment

| Task                     | Risk     | Mitigation           |
| ------------------------ | -------- | -------------------- |
| Legacy doc deletion      | Low      | Files in git history |
| storybook-static untrack | Low      | Standard operation   |
| Planning archival        | Low      | Just moving files    |
| .gitignore additions     | Very Low | Standard patterns    |
| README update            | Very Low | Documentation only   |
| PERFORMANCE.md           | Very Low | New file creation    |

---

## 9. Commands Reference

### File Deletion (Plan 45-01)

```bash
# Delete legacy docs
git rm -r docs/V0 docs/V1 docs/V2 docs/V3 docs/V4 docs/V5 docs/V6 docs/V7 docs/V8 docs/v1-spec.md docs/v2-spec.md

# Untrack build artifacts (already in .gitignore)
git rm -r --cached storybook-static
git rm --cached bash.exe.stackdump

# Commit
git commit -m "chore(45-01): delete legacy docs and untrack build artifacts"
```

### Archive Creation (Plan 45-02)

```bash
# Create archive structure
mkdir -p .planning/archive/v1.0/{phases,milestones}
mkdir -p .planning/archive/v1.1/{phases,milestones}
mkdir -p .planning/archive/v1.2/{phases,milestones}
mkdir -p .planning/archive/v1.3/{phases,milestones}

# Move v1.0 phases (01-08)
mv .planning/phases/0[1-8]-* .planning/archive/v1.0/phases/

# Move v1.1 phases (09-14)
mv .planning/phases/09-* .planning/phases/1[0-4]-* .planning/archive/v1.1/phases/

# Move v1.2 phases (15-24)
mv .planning/phases/1[5-9]-* .planning/phases/2[0-4]-* .planning/archive/v1.2/phases/

# Move v1.3 phases (25-34)
mv .planning/phases/2[5-9]-* .planning/phases/3[0-4]-* .planning/archive/v1.3/phases/

# Move milestone files
mv .planning/milestones/v1-* .planning/archive/v1.0/milestones/
mv .planning/milestones/v1.1-* .planning/archive/v1.1/milestones/
mv .planning/milestones/v1.2-* .planning/archive/v1.2/milestones/
mv .planning/milestones/v1.3-* .planning/archive/v1.3/milestones/
```

---

## 10. Sources

**Repository Analysis:**

- `.gitignore` - Current ignore patterns
- `docs/` directory listing - Legacy doc inventory
- `.planning/phases/` - Phase directory structure
- `.planning/milestones/` - Milestone file inventory
- `git ls-files --cached` - Tracked file verification

**Best Practices:**

- [GitHub Next.js .gitignore template](https://github.com/github/gitignore/blob/main/Nextjs.gitignore)
- [Next.js pnpm .gitignore best practices](https://github.com/vercel/next.js/pull/43366) - .pnpm-store addition

**Performance Data:**

- `.planning/phases/40-lcp-element-quick-wins/40-03-SUMMARY.md` - LCP metrics
- `.planning/phases/44-animation-optimization-monitoring/44-02-SUMMARY.md` - LazyMotion metrics
- `.planning/STATE.md` - Key decisions and tech debt tracking

---

## Confidence Assessment

| Area                      | Confidence | Reason                                  |
| ------------------------- | ---------- | --------------------------------------- |
| Legacy doc scope          | HIGH       | Direct file listing, clear directories  |
| Build artifact status     | HIGH       | `git ls-files --cached` verification    |
| .gitignore best practices | HIGH       | Official GitHub template + Next.js docs |
| Planning archival scope   | HIGH       | CONTEXT.md specifies v1.0-v1.3          |
| Performance metrics       | HIGH       | Phase summaries with exact numbers      |
| Archive layout            | MEDIUM     | Claude's discretion per CONTEXT.md      |

---

_Research complete. Ready for planning._
