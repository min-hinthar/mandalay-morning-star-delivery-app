# GSD Workflow

## classifyHandoffIfNeeded Bug — Agent "Failed" Status Is Misleading

**Context:** All Task tool agents report `status: failed` with `classifyHandoffIfNeeded is not defined`. 100% repro since Claude Code v2.1.27. Error fires AFTER agent work completes.

**Learning:** This is a Claude Code internal bug (function called but never defined in `cli.js` bundle), not a GSD issue. Agent work always completes successfully. GSD workflows patched with spot-check fallback: if agent reports this error, verify artifacts on disk (SUMMARY.md exists, git commits present) before treating as failure.

**Workaround applied to:** `execute-phase.md` (spot-check + failure_handling), `execute-plan.md` (segment aggregation), `quick.md` (executor return).

**GitHub:** [anthropics/claude-code#24181](https://github.com/anthropics/claude-code/issues/24181)

**Apply when:** Any Task tool agent reports "failed" — always spot-check before assuming real failure.

**Supersedes:** "Background Agent Failed Status Can Be Misleading" (same root cause, expanded with workaround details)

---

## Local Patches Removed (2026-02-25)

**Context:** Maintained 19 locally patched GSD files (core.cjs, state.cjs, phase.cjs, init.cjs, workflows, agents) with a custom backup/restore system. Removed because: (1) Task tool subagent spawning is broken on Windows anyway (Bun stdio deadlock), making most workflow patches moot, (2) patches required manual maintenance on every GSD update, (3) several patches were for bugs now fixed upstream or reported.

**Deleted:** `~/.claude/gsd-local-patches/`, `~/.claude/scripts/generate-manifest.js`, `~/.claude/scripts/save-local-patches.js`

**If patches are needed again:** File upstream issues instead. Key bugs already filed: #730 (state-snapshot nulls), #733 (commit message truncation), #757 (phase complete is_last_phase).

---

## Agent Teams vs Subagents

**Context:** Claude Code has two parallelization mechanisms. Choosing wrong one wastes tokens or loses coordination benefits.

**Learning:**

| | Subagents (Task tool) | Agent Teams |
|--|----------------------|-------------|
| Context | Own window, results return to caller | Fully independent sessions |
| Communication | Report back only | Shared mailbox + task list |
| Coordination | Parent manages | Self-coordinating |
| Token cost | Lower | Higher (each = full session) |
| Best for | Focused tasks | Research, debug, competing hypotheses |

Per-workflow control via `agent_teams` in `.planning/config.json`:
- `research: true` — researchers share findings, avoid redundant work (HIGH benefit)
- `debug: true` — agents challenge each other's root cause theories (HIGH benefit)
- `map_codebase: true` — mappers share code pattern discoveries (MODERATE benefit)
- `verify_work: true` — debug agents coordinate findings (MODERATE benefit)
- `execution: false` — file conflict risk, docs warn against parallel file edits (AVOID)

Enable globally: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `~/.claude/settings.json` env.

**Apply when:** Deciding whether a parallel workflow should use agent teams or standard subagents.

---

## Checkpoint Feedback Often Requires Multiple Fix Rounds

**Context:** Phase 9 checkpoint verification needed 3 rounds of user feedback before all issues were resolved. Each round revealed issues that weren't visible until prior fixes landed.

**Learning:** Budget for 2-3 feedback rounds during checkpoint verification. After each round:
1. Spawn parallel fix agents for independent issues
2. Run TypeScript check after all agents complete
3. Re-present checkpoint with cumulative fix list
4. Don't rush to phase verification until user confirms satisfaction

**Apply when:** Any GSD checkpoint with `autonomous: false` that presents work to the user.

---

## Subagent-Created Files Invisible to Git Add (OneDrive)

**Context:** During Phase 19 planning, subagents wrote 7 files (6 PLANs + RESEARCH.md) to `.planning/phases/19-tts-core-extraction/`. Files existed on disk (correct size, readable via `cat`/`Read`), but `git add` silently ignored them. Only CONTEXT.md (written by the main session) was staged. `git check-ignore` confirmed the files were NOT ignored. `git add -f` and `git update-index --add` also failed silently.

**Learning:** On Windows + OneDrive, files written by Claude Code subagent processes can have a stale Git index entry that makes `git add` treat them as already tracked (unchanged). The fix is to modify the file content (even appending a newline: `echo "" >> file.md`), which updates the filesystem metadata and forces Git to re-evaluate the file.

**Root cause hypothesis:** OneDrive's file virtualization or copy-on-write behavior may cause the inode/mtime to appear unchanged to Git's index even after the file is created. The main session's files go through a different code path (Write tool) that properly triggers filesystem metadata updates.

**Workaround:**
```bash
# After subagent creates files, touch/modify them before git add:
for f in .planning/phases/19-*/*-PLAN.md .planning/phases/19-*/19-RESEARCH.md; do
  echo "" >> "$f"
done
git add .planning/phases/19-*/
```

**Apply when:** Committing files written by subagents (Task tool) on Windows with OneDrive sync. If `git add` silently ignores files that exist on disk, modify them before staging.

---

## Parallel Executor Agents: lint-staged Cross-Contamination

**Context:** Phase 21 Wave 1 — agents 21-01 and 21-12 ran in parallel. Agent 21-12 committed first (PillTabBar), and lint-staged picked up 21-01's uncommitted working tree files because they shared a git working tree.

**Learning:** When parallel executor agents share a git working tree, lint-staged can pull in another agent's unstaged changes during `git add`. Commit attribution is wrong but work is correct.

**Fix:** See "Worktree Isolation Solves lint-staged Cross-Contamination" below — `parallelization.isolation: "worktree"` eliminates this entirely.

**Apply when:** Reviewing git history for parallel-executed plans without worktree isolation enabled.

---

## gsd-tools.cjs `commit` Subcommand Fails on Multi-Word Messages (PATCHED)

**Context:** `gsd-tools.cjs commit "docs(40): create phase plan" --files <path>` silently truncates the message to `"docs(40):"`. Root cause: `args[1]` only captures the first word when the shell strips quotes before passing to `process.argv`.

**Fix applied locally (2026-02-24):** Replace `args[1]` with positional arg collection up to the first flag:
```javascript
const endIndex = filesIndex !== -1 ? filesIndex : args.length;
const messageArgs = args.slice(1, endIndex).filter(a => !a.startsWith('--'));
const message = messageArgs.join(' ');
```
Handles both quoted (single arg) and unquoted (split args) cases. Verified with `--amend` flag.

**GitHub issue filed:** [gsd-build/get-shit-done#733](https://github.com/gsd-build/get-shit-done/issues/733)

**Supersedes:** Previous workaround (manual `git add` + HEREDOC commit) — proper fix is in the CLI router.

**Apply when:** If commit messages appear truncated after a GSD update, check if this patch was lost and reapply.

---

## INIT Tmpfile JSON Parsing on Windows (MINGW64)

**Context:** `gsd-tools.cjs init plan-phase` returns `@file:/path/to/json` when payload is large. Parsing this file on Windows MINGW64 has multiple pitfalls.

**Learning:**
1. `python3` is NOT available on Windows MINGW64 — use `node` for JSON processing
2. `node -e` with string interpolation breaks on Windows backslash paths — `C:\Users\...` gets mangled
3. `node -e` with `!` in strings: bash escapes `!` to `\!` which is invalid JS

**Workaround:** Use the Read tool directly to read the tmpfile instead of bash-based JSON parsing. The Read tool handles Windows paths correctly.

```bash
# DON'T: node -e "...readFileSync('$INIT_FILE')..." — paths get mangled
# DO: Use Read tool to read the file, or write a .js script file
```

**Apply when:** Orchestrating GSD workflows that need to parse large INIT payloads on Windows.

---

## Auto-Advance Chain: Plan Agent May Stop Before Execute

**Context:** Phase 28 `--auto` flow: discuss-phase → plan-phase agent completed research + planning + verification but did NOT auto-advance to execute. It returned PLANNING COMPLETE and recommended `/gsd:execute-phase 28` in a fresh context window.

**Learning:** This is correct behavior, not a bug. Large phases (9+ plans, 4+ waves) benefit from fresh context for execution. The plan-phase agent has discretion to stop the chain when execution would overload the context window. The discuss-phase orchestrator should handle PLANNING COMPLETE gracefully by showing the execute command.

**Key insight for orchestrator design:** When spawning plan-phase with `--auto`, always handle these returns:
- `PHASE COMPLETE` → Full chain succeeded
- `PLANNING COMPLETE` → Plans ready, recommend fresh window for execute
- `PLANNING INCONCLUSIVE` → Planning needs input
- `GAPS FOUND` → Gaps found during execution

**Apply when:** Running `--auto` workflow chains. Don't assume the chain always completes end-to-end.

---

## Adding Curated Auto-Mode to a GSD Workflow

**Context:** Added `--auto` to `new-milestone.md` (following the pattern from `discuss-phase.md`). The pattern reduces 5+ user interactions to exactly 2 by having agents do exploratory work, then presenting curated choices.

**Learning — The curated auto blueprint (checklist for any workflow):**

1. **Parse `--auto`** — Check `$ARGUMENTS` + `workflow.auto_advance` config. Persist if newly set.
2. **Skip confirmations** — Auto-accept defaults for version numbers, research decisions, etc.
3. **Agent exploration** — Spawn parallel Explore agents across orthogonal dimensions (e.g., User Need / Technical Leverage / Creative Vision). Each returns 2-3 proposals.
4. **Curated choice** — Orchestrator deduplicates, ranks, marks "(Recommended)". Present via AskUserQuestion (Interaction Point 1).
5. **Auto-derive downstream artifacts** — Use chosen direction to auto-generate requirements/specs without separate approval.
6. **Joint approval** — Bundle related artifacts (requirements + roadmap) into single AskUserQuestion (Interaction Point 2).
7. **Auto-advance** — Chain to next workflow via `Skill()` invocation with `--auto`.

**Key design decisions:**
- Use `Explore` subagent_type (read-only, fast, inherits Opus)
- 3 dimensions is the sweet spot — covers the space without redundancy
- Add `$HAS_DIRECTION` flag to skip exploration when user already specified goals (e.g., via discuss-milestone)
- Joint approval keeps interaction count minimal without hiding decisions

**Apply when:** Adding `--auto` to any GSD workflow that currently has 3+ user interaction points.

---

## Contributing to GSD Upstream: Path Portability

**Context:** Applied GSD improvements to the local installation (`~/.claude/get-shit-done/`), then needed to create a PR against `glittercowboy/get-shit-done`. Copying installed files into the cloned repo caused hundreds of unintended path changes — the installer replaces all `~/.claude/` with absolute paths like `C:/Users/minkk/.claude/`.

**Learning:** GSD's installer does path substitution during `npx get-shit-done-cc`. The source repo uses portable `~/.claude/` paths. When contributing upstream:

1. **Never copy installed files** — they contain absolute paths baked in by the installer
2. **Apply edits to the repo clone directly** — use the Edit tool on the cloned repo files, keeping `~/.claude/` portable paths
3. **If you accidentally copy installed files:** `git checkout -- <dirs>` to restore originals, then re-apply feature changes only

**Upstream repo:** `gsd-build/get-shit-done` (formerly `glittercowboy/get-shit-done`)
**npm package:** `get-shit-done-cc`

**Apply when:** Making changes to GSD workflow/agent files intended for upstream contribution.

---

## Worktree Isolation Solves lint-staged Cross-Contamination

**Context:** Previously documented lint-staged cross-contamination during parallel execution (Phase 21). The only mitigations were "accept it" or "go sequential." Now implemented `parallelization.isolation: "worktree"` config.

**Learning:** Claude Code's `isolation: "worktree"` Task parameter gives each agent an isolated git worktree. Combined with plan-checker file overlap guards (blocker severity), this eliminates parallel execution conflicts entirely. The solution requires:
- Config flag (`parallelization.isolation: "worktree"`)
- Plan-checker file overlap detection (same-wave plans can't share `files_modified`)
- Post-wave branch merge with conflict detection

**Supersedes:** "Parallel Executor Agents: lint-staged Cross-Contamination" mitigation section — worktree isolation is the proper fix.

**Apply when:** Projects experiencing lint-staged or pre-commit hook conflicts during parallel GSD execution.

---

## GSD State Snapshot Returns Nulls — Format Mismatch (PATCHED)

**Context:** `gsd-tools.cjs state-snapshot` returned all null fields. Root cause: `state.cjs` regex only matches `**Field:**` bold markdown, but STATE.md uses plain `Field:` format. Affects 8 functions across the file. `progress.md` has no null guard, so it freezes silently.

**Fix applied locally (2026-02-23):** Patched `state.cjs` with dual-format parsing (bold + plain) across all field extraction, replacement, snapshot, session, decisions, and blockers. Added null guard to `progress.md` routing step. GitHub issue: [gsd-build/get-shit-done#730](https://github.com/gsd-build/get-shit-done/issues/730).

**Patches saved via `save-local-patches.js`** — will survive `/gsd:update` with reapply.

**Apply when:** If state-snapshot returns nulls after a GSD update, check if the dual-format patch was lost and reapply.

---

## CLI Freezes on Windows — Consolidated Guide (Updated 2026-02-25, rev2)

**Context:** 15+ freezes across 2026-02-24/25. Persisted AFTER OneDrive migration, nuclear config, Playwright disabled, project moved off OneDrive, 7+ GB free. Freezes during gsd-discuss-phase AND built-in plan mode on non-OneDrive repo.

**Primary root cause (CONFIRMED): Bun runtime child process stdio deadlock on Windows**

**Key evidence (2026-02-25):**
1. System stays fully responsive — only Claude Code frozen → NOT RAM
2. Reproduces with ALL MCP plugins disabled → NOT MCP server hang
3. Reproduces on non-OneDrive local drive with 7+ GB free → NOT OneDrive/RAM
4. Debug log shows clean operation (file reads, API streaming) then **stops dead mid-stream** with no error, no crash, no timeout
5. Only affects Task tool (subagent spawning) — main session tools work fine
6. Multiple users confirm same symptoms on Windows: [#18109](https://github.com/anthropics/claude-code/issues/18109), [#28494](https://github.com/anthropics/claude-code/issues/28494)

The freeze occurs in the stdio pipe between parent and child (subagent) process. The Bun binary's Windows child process handling has a deadlock condition where the parent stops receiving output from the child mid-stream.

**Secondary contributing factor (earlier freezes):** RAM exhaustion from MCP duplication was real for low-RAM scenarios (3.6 GB free) but was never the primary cause.

**What changed:** Claude Code v2.1.50 changelog: *"Fixed bug where MCP tools not discovered when tool search enabled and prompt passed as launch argument."* Before this fix, subagents in certain launch scenarios (including GSD's Task tool spawns) **didn't discover or spawn MCP servers**. After the fix, every subagent properly discovers and spawns ALL enabled MCP servers.

**Version timeline:**
- **Pre-v2.1.50**: Subagents often ran without MCP servers (~200 MB each). GSD 3-agent chain: ~600 MB total.
- **v2.1.50**: MCP discovery fix landed. Subagents now spawn full MCP sets (+216 MB Playwright + ~196 MB Context7 each). GSD 3-agent chain: ~1,200-1,800 MB total.
- **v2.1.53**: Windows crash fixes ("Fixed crash when spawning many processes on Windows", "Fixed panic on corrupted value", "Fixed WebAssembly crash on x64"). Frozen session `3b3b83ca` was on this version.
- **v2.1.55**: Additional Windows stability fixes. Current version.
- **Upstream fix needed**: Per-subagent MCP scoping — see [#4380](https://github.com/anthropics/claude-code/issues/4380), [#4476](https://github.com/anthropics/claude-code/issues/4476), [#6915](https://github.com/anthropics/claude-code/issues/6915).

**Why it manifests as RAM exhaustion on this system (16 GB, ~3.6 GB free):**

System baseline (before any GSD work):
| Component | RAM |
|-----------|-----|
| Claude CLI + MCP servers (5x node.exe) | 757 MB |
| Claude Desktop app | 1,065 MB |
| Razer gaming software | 1,010 MB |
| Edge + Chrome browsers | 2,242 MB |
| Windows services + Defender | 1,673 MB |
| **Total used / Available** | **~12.6 GB / 3.6 GB free** |

The 5 node.exe processes:
1. Claude Code CLI: 343 MB
2. Playwright MCP npx launcher: 109 MB
3. Context7 MCP npx launcher: 109 MB
4. Playwright MCP server: 107 MB
5. Context7 MCP server: 87 MB

**Why GSD triggers freezes:** Post-v2.1.50, each subagent duplicates the full MCP server set (+200-400 MB). A 3-agent plan-phase (researcher → planner → checker) adds 600-1,200 MB. 3,600 MB available - 1,200 MB agents - 2,500 MB OS minimum = **paging storm → freeze**. Pre-v2.1.50, the same chain used ~600 MB total because subagents didn't spawn MCP servers.

**Contributing factors:**
- OneDrive file locking (fixed — project moved to `C:\Users\minkk\GitHub\civic-test-2025`)
- Session bloat (fixed — trimmed to 20 per project, `pre-session-cleanup.js`)
- `hooks: {}` only disables USER hooks — plugin hooks (SessionStart:clear, SessionStart:startup) still fire
- Shell CWD drift: Bash shell sometimes starts in `/c/Users/minkk/GitHub` (parent dir) → gsd-tools returns nulls → 8+ recovery commands waste time/tokens

**Fixes applied:**
1. Moved project off OneDrive → `C:\Users\minkk\GitHub\civic-test-2025`
2. Trimmed sessions from 382+268 → 20 per project (~700 MB freed)
3. Nuclear config: `"hooks": {}`, disabled non-essential plugins
4. **Disabled Playwright plugin** when not doing browser work (-216 MB per session, -216 MB per subagent)

**Workarounds (since fix requires upstream Bun/Claude Code change):**
1. **Avoid Task tool entirely** — do GSD discuss/plan/execute steps manually in the main session
2. **Try npm Claude fallback**: `npx @anthropic-ai/claude-code` uses Node.js instead of Bun. Trade-off: +300 MB RAM but may not have the stdio deadlock
3. **For GSD workflows**: Skip scout/researcher/planner agents. Read files directly, write PLAN.md manually. Execute-phase sequential agents may work better than parallel
4. **Close Claude Desktop app** (-1,065 MB) — if also RAM-constrained
5. **Run cleanup**: `node ~/.claude/hooks/pre-session-cleanup.js`

**Pre-GSD checklist (IMPORTANT):**
- [ ] Claude Desktop closed
- [ ] `tasklist //FI "IMAGENAME eq node.exe"` shows ≤3 processes
- [ ] Playwright plugin disabled (unless doing browser work)
- [ ] `pwd` returns `/c/Users/minkk/GitHub/civic-test-2025`

**Shell CWD Drift workaround:**
Bash shell intermittently starts in parent directory after project move. Symptoms: `git log` → "fatal: not a git repository", gsd-tools returns nulls. Fix: prefix commands with `cd /c/Users/minkk/GitHub/civic-test-2025 &&`.

**Critical rule for GSD sessions:** Never use `claude --resume` for plan-phase or execute-phase. These accumulate massive context from subagent reports. Start fresh + `/gsd:resume-work`.

**Preventive maintenance:**
```bash
node ~/.claude/hooks/pre-session-cleanup.js           # trims sessions, warns about zombies
rm -rf ~/.claude/tasks/*                              # stale team task dirs
rm -f ~/.claude/todos/*.json                          # stale subagent todo files (434+ after many plans)
rm -f ~/.claude/cache/active-subagent.json            # stale subagent counter cache
```

**Statusline freeze vector (2026-02-25):** Even with plenty of RAM, the statusline script's `execSync` git commands + `readdirSync`/`statSync` on `~/.claude/todos/` caused I/O storms during parallel tool calls on MINGW. Fixed by replacing all subprocess/directory operations with direct file reads. See `claude-code-windows.md` for full details.

**Built-in plan mode as freeze vector (2026-02-25, CONFIRMED):** Plan mode spawns Explore agents via Task tool, which triggers the Bun stdio deadlock. Not MCP, not OneDrive, not RAM — the Task tool itself is broken on Windows native binary. Same cause as GSD agent spawning.

Execute-phase is immune because: (1) custom agents have no MCP tools → 0 extra processes, (2) sequential wave execution → no parallel I/O, (3) targeted file reads → small I/O footprint.

**Workaround**: `~/.claude/agents/lightweight-explore.md` — same exploration capability (Read, Bash, Grep, Glob, WebSearch, WebFetch), zero MCP server spawning. Use `Task(subagent_type="lightweight-explore")` instead of `Task(subagent_type="Explore")`.

**Native Claude improvements (2026-02-25):** Switching from npm (`npx @anthropic-ai/claude-code`) to native Claude app eliminated `npx` launcher processes:
| Metric | npm Claude | Native Claude |
|---|---|---|
| node.exe processes | 5 | **3** |
| Baseline RAM | 757 MB | **465 MB** |
| npx launchers | 2 (218 MB total) | **0** |

**RAM budget for GSD workflows:**
- Baseline: 539 MB (CLI + Context7 only, Playwright disabled)
- Per subagent: +200-400 MB (MCP duplication)
- 3-agent plan-phase: ~1,200 MB total
- Safe threshold: keep ≥4 GB free before starting GSD

**Supersedes:** All prior CLI freeze entries. Prior claim "Restored ALL hooks, statusline, and 7 plugins" was premature — freezes continued.

**Apply when:** CLI freezes on Windows. Run pre-GSD checklist, then escalation ladder.

---

## GSD `general-purpose` Subagent Workaround Is Intentional (MCP Bug)

**Context:** Workflows spawn researchers/planners as `general-purpose` + "First, read agent file" instead of dedicated types (`gsd-phase-researcher`, `gsd-planner`, `gsd-project-researcher`). Looks like a bug, but it's a deliberate workaround.

**Learning:** Upstream Claude Code bug [anthropics/claude-code#13898](https://github.com/anthropics/claude-code/issues/13898) prevents custom subagents from accessing **project-scoped** MCP servers (`.mcp.json`). The `general-purpose` type has MCP access, so GSD uses it as a workaround. Issue [gsd-build/get-shit-done#500](https://github.com/gsd-build/get-shit-done/issues/500) documents this.

**Nuance for plugin-based MCP:** The bug targets project-scoped MCP. Plugin-provided MCP (like Context7 via `@claude-plugins-official`) may be inherited differently — dedicated types list `mcp__context7__*` in their tool sets. Switching to dedicated types works locally with plugin-based Context7 but may break for users with project-scoped MCP.

**Apply when:** Patching GSD workflow subagent types locally. Safe to switch if MCP is plugin-based; risky if project-scoped `.mcp.json` is used. Check upstream #13898 status before contributing a fix.

---

## Context Efficiency Patterns for GSD Workflows

**Context:** discuss-phase consumed ~22K tokens before the first question was asked (615-line workflow + 298-line template loaded upfront + scout file reads + full ROADMAP). Sessions exhausted context before completing discussion.

**Learning — three patterns that apply to any long-running interactive workflow:**

1. **Subagent offloading:** When a workflow step reads many files and results feed later steps, spawn a subagent (Explore or custom) that writes a compact summary to disk. Main context reads only the summary. Example: `gsd-discuss-scout` reads 5-10 source files, writes 60-line SCOUT-NOTES.md → saves ~8K tokens.

2. **Deferred template reads:** Templates used only at the end of a workflow shouldn't be loaded upfront. Replace inline templates with file references (`cat ~/.claude/.../template.md`) read during the relevant step. Example: 298-line context template deferred → saves ~3K tokens.

3. **Incremental persistence (crash journal):** In long interactive sessions, write partial results to disk after each logical unit completes (e.g., `DECISIONS-WIP.md` per area). Final step merges WIP with in-context state. Prevents decision loss on context compression.

**Also applied:** Targeted ROADMAP read via `gsd-tools.cjs roadmap get-phase` instead of full file read (~2K saved). Hard rule banning Read/Grep/Glob during interactive discussion step. Budget warnings at 12/20 questions per area.

**Net result:** Pre-discussion context ~22K → ~5.3K tokens (~17K freed for actual discussion).

**Apply when:** Any GSD workflow with interactive loops (discuss-phase, verify-work) or heavy upfront file reads.

---

## `phase complete` Reports `is_last_phase: true` When Future Phases Exist (PATCHED)

**Context:** After completing phase 40, `gsd-tools phase complete` returned `next_phase: null, is_last_phase: true` even though phases 41-47 are defined in ROADMAP.md. This caused the execute-phase workflow to announce "this is the last phase."

**Root cause:** `cmdPhaseComplete()` in `phase.cjs` (lines 781-802) only scans physical directories in `.planning/phases/` to find the next phase. Phases that haven't been planned yet have no directories, so the loop finds nothing and defaults to `is_last_phase: true`.

**Fix applied locally (2026-02-24):** Two additions to `phase.cjs`:

1. **ROADMAP.md fallback** (after directory scan `catch {}`): If `isLastPhase` is still true, parse ROADMAP.md phase headings using the same regex as `cmdRoadmapAnalyze`. Skip phases already marked `[x]` complete. First uncompleted phase after current becomes `nextPhaseNum`.

2. **Plan-level checkbox updater**: On phase complete, check off individual plan checkboxes (`- [ ] 40-01-PLAN.md` → `- [x]`). Previously only the top-level phase checkbox was updated.

**Why prior patches missed it:** The local patch system (`gsd-local-patches/backup-meta.json`) covered `core.cjs`, `init.cjs`, `state.cjs`, and workflow files — but `phase.cjs` was never patched before. Now included in backup-meta.json.

**Apply when:** If `phase complete` returns `is_last_phase: true` after a GSD update despite having future phases in ROADMAP, check if this patch was lost and reapply from `~/.claude/gsd-local-patches/get-shit-done/bin/lib/phase.cjs`.
