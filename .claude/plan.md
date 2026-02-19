# Enriched Discuss Phase: Agent Team Scout Research

## Goal

Before the Q&A loop in discuss-phase, create an agent team of 3 scouts that explore the codebase, learnings, and prior phases **in parallel with inter-agent coordination**. Scouts share discoveries via SendMessage — e.g., codebase scout finds a risky file pattern → messages learnings scout → learnings scout checks if there's a known bug for it. Findings are synthesized into CONTEXT.md for downstream agents.

## Why Agent Teams (not Task subagents)

| Feature | Task subagents | Agent Teams |
|---------|---------------|-------------|
| Context | Shares parent context | Fresh 200k each |
| Coordination | None — isolated | Shared task list + messaging |
| Discovery sharing | Not possible | Scout A messages Scout B mid-research |
| Overhead | Lower | Higher (team setup, messaging) |
| Value for research | Moderate | High — scouts challenge/enrich each other |

The key unlock: **cross-pollination**. When the codebase scout finds files matching a pattern, it can message the learnings scout "check if there are known issues with `revalidatePath` in route handlers" — and get a targeted answer instead of generic scanning.

## Architecture

```
discuss-phase orchestrator
├── initialize
├── check_existing
├── [NEW] scout_research
│   ├── TeamCreate("discuss-scouts-{PHASE}")
│   ├── TaskCreate × 3 (one per scout dimension)
│   ├── Task(team_name) × 3 → spawn scout teammates
│   │   ├── codebase-scout: claims task, explores code, shares findings via SendMessage
│   │   ├── learnings-scout: claims task, reads learnings, responds to codebase-scout queries
│   │   └── context-scout: claims task, reads prior phases, shares integration points
│   ├── Scouts coordinate via SendMessage (cross-pollination)
│   ├── Each scout writes findings to ${phase_dir}/.scouts/{name}.md
│   ├── SendMessage(shutdown_request) × 3
│   ├── TeamDelete
│   └── Orchestrator reads files → synthesizes RESEARCH_CONTEXT
├── analyze_phase ← informed by RESEARCH_CONTEXT
├── present_gray_areas ← gray areas reference codebase findings
├── discuss_areas (unchanged)
├── write_context ← CONTEXT.md gains <codebase_context> section
└── auto_advance (unchanged)
```

## Config Gate

Reuse existing `agent_teams.research: true`. If false → skip entirely, zero degradation.

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `~/.claude/get-shit-done/workflows/discuss-phase.md` | Insert `<step name="scout_research">` between `check_existing` and `analyze_phase`. Modify `analyze_phase` to use RESEARCH_CONTEXT. Modify `write_context` to include `<codebase_context>`. |
| 2 | `~/.claude/get-shit-done/templates/context.md` | Add `<codebase_context>` section with conditional inclusion note |
| 3 | `~/.claude/commands/gsd/discuss-phase.md` | Update `<process>` summary + add `TeamCreate`, `SendMessage`, `TaskCreate`, `TaskUpdate`, `TaskList` to `allowed-tools` |

## Change 1: New `scout_research` Step

Insert after `</step>` of `check_existing` (line 167), before `<step name="analyze_phase">` (line 169):

```markdown
<step name="scout_research">
Create an agent team of parallel scouts to explore the codebase before gray area identification. Scouts coordinate via messaging — sharing discoveries so each scout can refine its search based on what others find.

**1. Check config gate:**

```bash
SCOUT_ENABLED=$(node ~/.claude/get-shit-done/bin/gsd-tools.cjs config-get agent_teams.research 2>/dev/null || echo "false")
```

**If SCOUT_ENABLED is not "true":** Set RESEARCH_CONTEXT="" and skip to analyze_phase.

**If SCOUT_ENABLED is "true":**

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SCOUTING CODEBASE (AGENT TEAM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Creating scout team...
  → Codebase patterns & files
  → Learnings & error history
  → Prior phase context & integrations
```

**2. Create scout output directory and team:**

```bash
mkdir -p "${phase_dir}/.scouts"
```

```
TeamCreate(
  team_name="discuss-scouts-${PHASE}",
  description="Scout team for Phase ${PHASE}: ${PHASE_NAME}"
)
```

**3. Create tasks for each scout dimension:**

```
TaskCreate(
  subject="Scout codebase for Phase ${PHASE}",
  description="Explore code relevant to Phase ${PHASE}: ${PHASE_NAME}. Find files that will be modified, existing patterns to follow, dependencies, and reference implementations. Write findings to ${phase_dir}/.scouts/codebase.md. Max 100 lines.",
  activeForm="Scouting codebase patterns"
)

TaskCreate(
  subject="Scout learnings for Phase ${PHASE}",
  description="Read .claude/learnings/INDEX.md, topic files, and .claude/ERROR_HISTORY.md. Extract risk flags, 'always/never' rules, and past bugs relevant to Phase ${PHASE}: ${PHASE_NAME}. Write findings to ${phase_dir}/.scouts/learnings.md. Max 80 lines.",
  activeForm="Scouting learnings & pitfalls"
)

TaskCreate(
  subject="Scout prior context for Phase ${PHASE}",
  description="Read REQUIREMENTS.md, PROJECT.md, ROADMAP.md, and recent phase SUMMARYs. Find requirement IDs, integration points, and constraints for Phase ${PHASE}: ${PHASE_NAME}. Write findings to ${phase_dir}/.scouts/context.md. Max 80 lines.",
  activeForm="Scouting prior phase context"
)
```

**4. Spawn 3 scout teammates:**

All scouts use `model="sonnet"` (read-only exploration work).

```
Task(
  subagent_type="general-purpose",
  model="sonnet",
  team_name="discuss-scouts-${PHASE}",
  name="codebase-scout",
  prompt="
    You are the codebase scout on the discuss-scouts team for Phase ${PHASE}: ${PHASE_NAME}.

    <phase_goal>${phase_description_from_roadmap}</phase_goal>

    <instructions>
    1. Check TaskList and claim the 'Scout codebase' task
    2. Explore the codebase for this phase's domain:
       - Files that will likely be modified or extended
       - Patterns this phase should follow (component, API, styling patterns)
       - Dependencies and imports similar features use
       - Reference implementations of similar features
    3. When you find something notable (risky pattern, unusual structure, key dependency):
       - Message learnings-scout: 'Check if there are known issues with [pattern/file]'
       - Message context-scout: 'Found [component] — does any prior phase provide/depend on this?'
    4. Write findings to ${phase_dir}/.scouts/codebase.md
    5. Mark task completed
    </instructions>

    <output_format>
    ## Relevant Files
    [Files likely modified, 1-line descriptions]

    ## Existing Patterns
    [Patterns to follow, with file path examples]

    ## Dependencies
    [Libraries and internal modules to use]

    ## Reference Implementations
    [Similar features already built, key file paths]
    </output_format>

    <coordination>
    You are part of a 3-scout team. Share discoveries that might be relevant to:
    - learnings-scout: risky patterns, unusual code structures
    - context-scout: features that connect to prior phases
    Respond to messages from other scouts with targeted findings.
    </coordination>
  ",
  description="Codebase scout"
)

Task(
  subagent_type="general-purpose",
  model="sonnet",
  team_name="discuss-scouts-${PHASE}",
  name="learnings-scout",
  prompt="
    You are the learnings scout on the discuss-scouts team for Phase ${PHASE}: ${PHASE_NAME}.

    <phase_goal>${phase_description_from_roadmap}</phase_goal>

    <instructions>
    1. Check TaskList and claim the 'Scout learnings' task
    2. Read project memory files:
       - .claude/learnings/INDEX.md → identify relevant topic files
       - Read matched topic files from .claude/learnings/
       - .claude/ERROR_HISTORY.md → related bugs
    3. Extract: patterns that apply, past bugs that could recur,
       known workarounds, 'always/never' rules
    4. Respond to messages from codebase-scout about specific patterns —
       check if learnings mention those patterns and report back
    5. If you find critical risk flags, message codebase-scout:
       'Known issue: [description] — check if [file pattern] has this problem'
    6. Write findings to ${phase_dir}/.scouts/learnings.md
    7. Mark task completed
    </instructions>

    <output_format>
    ## Risk Flags
    [Known pitfalls from error history + learnings]

    ## Patterns to Follow
    ['Always do X' rules relevant to this domain]

    ## Patterns to Avoid
    ['Never do Y' — things that caused bugs before]
    </output_format>

    <coordination>
    You are part of a 3-scout team. When codebase-scout asks about a pattern,
    check your learnings files and respond with specific findings.
    Proactively share critical risk flags with codebase-scout.
    </coordination>
  ",
  description="Learnings scout"
)

Task(
  subagent_type="general-purpose",
  model="sonnet",
  team_name="discuss-scouts-${PHASE}",
  name="context-scout",
  prompt="
    You are the context scout on the discuss-scouts team for Phase ${PHASE}: ${PHASE_NAME}.

    <phase_goal>${phase_description_from_roadmap}</phase_goal>

    <instructions>
    1. Check TaskList and claim the 'Scout prior context' task
    2. Read project context files:
       - .planning/REQUIREMENTS.md → requirement IDs for this phase
       - .planning/PROJECT.md → constraints and core values
       - .planning/ROADMAP.md → this phase description + adjacent phases
       - SUMMARY files from 3-5 most recent completed phases
    3. Extract: what was built, key files created, patterns established,
       integration points this phase depends on
    4. Respond to messages from codebase-scout about features —
       check if any prior phase provides or depends on them
    5. If you find critical integration points, message codebase-scout:
       'Phase X built [feature] at [path] — this phase should integrate with it'
    6. Write findings to ${phase_dir}/.scouts/context.md
    7. Mark task completed
    </instructions>

    <output_format>
    ## Phase Requirements
    [Requirement IDs from REQUIREMENTS.md]

    ## Integration Points
    [What prior phases built that this phase connects to]

    ## Prior Phase Provides
    [Key 'provides:' entries from SUMMARYs]

    ## Project Constraints
    [Constraints from PROJECT.md affecting this phase]
    </output_format>

    <coordination>
    You are part of a 3-scout team. When codebase-scout asks about a feature,
    check prior phase SUMMARYs and respond with specific integration info.
    Proactively share critical integration points with codebase-scout.
    </coordination>
  ",
  description="Context scout"
)
```

**5. Wait for all 3 scouts to complete their tasks.**

Monitor via TaskList. When all 3 tasks show `completed`, proceed.

**6. Shutdown team:**

```
SendMessage(type="shutdown_request", recipient="codebase-scout", content="Scouting complete")
SendMessage(type="shutdown_request", recipient="learnings-scout", content="Scouting complete")
SendMessage(type="shutdown_request", recipient="context-scout", content="Scouting complete")
```

After all scouts shut down:
```
TeamDelete()
```

**7. Read and synthesize findings:**

Read each scout output file. If a file is missing or empty, skip that section.

Construct `RESEARCH_CONTEXT`:

```markdown
RESEARCH_CONTEXT = """
### Relevant Files
${from codebase.md: Relevant Files section}

### Existing Patterns
${from codebase.md: Existing Patterns section}

### Risk Flags
${from learnings.md: Risk Flags + Patterns to Avoid sections}

### Integration Points
${from context.md: Integration Points + Prior Phase Provides sections}

### Requirements
${from context.md: Phase Requirements section}
"""
```

If ALL scout files are empty/missing: set `RESEARCH_CONTEXT=""`.

**8. Cleanup and report:**
```bash
rm -rf "${phase_dir}/.scouts" 2>/dev/null
```

```
◆ Scouting complete.
  → {N} relevant files identified
  → {M} risk flags from learnings
  → {K} integration points from prior phases
```

**Error handling:**
- classifyHandoffIfNeeded: If scout reports "failed" with that error, check if output file exists on disk with >5 lines. If yes, use it.
- Scout hangs: Timeout after 2 minutes, proceed with whatever files exist.
- All scouts fail: Set RESEARCH_CONTEXT="", continue without degradation.
</step>
```

## Change 2: Enrich `analyze_phase` Step

Add to the end of the existing `analyze_phase` step (after line 191, before `</step>`):

```markdown
**If RESEARCH_CONTEXT is non-empty**, use it to generate codebase-specific gray areas:

1. **Files identified** → know which parts of the codebase this touches
2. **Existing patterns** → know what conventions to follow (or intentionally break)
3. **Risk flags** → surface as potential discussion topics if they involve user-facing decisions
4. **Integration points** → identify areas where phase connects to existing features

Gray areas should reference specific codebase findings when it makes the question more concrete.

**Example enrichment:**
- Without scouts: "Layout style — Cards vs list vs timeline?"
- With scouts: "Layout style — existing DriverDashboard uses card grid (`src/app/(driver)/dashboard/page.tsx`). Match that pattern, or different for this page?"
- Risk-informed: "Learnings show HEIC upload failed silently before — worth discussing image fallback behavior?"
```

## Change 3: Add `<codebase_context>` to `write_context` Step

In the CONTEXT.md template within `write_context` (after `</deferred>`, before the `---` footer):

```markdown
<!-- Only include when RESEARCH_CONTEXT is non-empty -->
<codebase_context>
## Codebase Analysis

### Relevant Files
[From scout: Files that will likely be modified]

### Existing Patterns
[From scout: Patterns this phase should follow]

### Risk Flags
[From scout: Known pitfalls in this domain]

### Integration Points
[From scout: What prior phases built that this connects to]

### Requirements
[From scout: Requirement IDs this phase must address]
</codebase_context>
```

If `RESEARCH_CONTEXT` is empty: omit `<codebase_context>` entirely.

## Change 4: Update Template

Add `<codebase_context>` section to `~/.claude/get-shit-done/templates/context.md` after `</deferred>`:

```markdown
<!-- CONDITIONAL: Only include if scout research was performed (agent_teams.research=true) -->
<codebase_context>
## Codebase Analysis

### Relevant Files
[Files identified by codebase scout that this phase will modify or extend]

### Existing Patterns
[Codebase patterns this phase should follow, with file path references]

### Risk Flags
[Known pitfalls from project learnings and error history relevant to this domain]

### Integration Points
[What prior phases built that this phase depends on or extends]

### Requirements
[Requirement IDs from REQUIREMENTS.md that map to this phase]

[If scout research not performed: omit this entire section]
</codebase_context>
```

## Change 5: Update Commands File

In `~/.claude/commands/gsd/discuss-phase.md`:

**Add to `allowed-tools`:**
```yaml
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
  - TeamCreate
  - TeamDelete
  - SendMessage
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
```

**Update `<process>` steps:**
```
1. Validate phase number (error if missing or not in roadmap)
2. Check if CONTEXT.md exists (offer update/view/skip if yes)
2.5 **Scout codebase (agent team)** — If agent_teams.research enabled, create scout team: 3 agents explore codebase, learnings, and prior phases with cross-pollination via messaging
3. **Analyze phase** — Identify domain and generate phase-specific gray areas (enriched by scout findings)
4-7. (unchanged)
```

## Implementation Order

1. Edit `discuss-phase.md` — insert scout_research step, modify analyze_phase, modify write_context
2. Edit `templates/context.md` — add codebase_context section
3. Edit `commands/gsd/discuss-phase.md` — add team tools to allowed-tools, update process summary
4. Run `save-local-patches.js` + `generate-manifest.js`

## Design Decisions

- **Agent teams over Task subagents** — scouts coordinate via SendMessage, enabling cross-pollination (codebase scout asks learnings scout about specific patterns)
- **general-purpose agents** — need Write tool to save findings files (Explore agents can't write)
- **Sonnet model** — scouts do mechanical search with light coordination, not deep reasoning
- **File-based output + messaging coordination** — findings go to disk for orchestrator, real-time queries go through SendMessage
- **No new config keys** — reuses `agent_teams.research`
- **Zero degradation** — if disabled or scouts fail, discuss works exactly as before
- **Team cleanup** — shutdown_request + TeamDelete ensures no orphaned agents
