# Model Profiles

Model profiles control which Claude model each GSD agent uses. This allows balancing quality vs token spend.

## Profile Definitions

| Agent | `quality` | `balanced` | `budget` |
|-------|-----------|------------|----------|
| gsd-planner | opus | opus | sonnet |
| gsd-roadmapper | opus | sonnet | sonnet |
| gsd-executor | opus | sonnet | sonnet |
| gsd-phase-researcher | opus | sonnet | haiku |
| gsd-project-researcher | opus | sonnet | haiku |
| gsd-research-synthesizer | sonnet | sonnet | haiku |
| gsd-debugger | opus | sonnet | sonnet |
| gsd-codebase-mapper | sonnet | haiku | haiku |
| gsd-verifier | sonnet | sonnet | haiku |
| gsd-plan-checker | sonnet | sonnet | haiku |
| gsd-integration-checker | sonnet | sonnet | haiku |

## Profile Philosophy

**quality** - Maximum reasoning power
- Opus for all decision-making agents
- Sonnet for read-only verification
- Use when: quota available, critical architecture work

**balanced** (default) - Smart allocation
- Opus only for planning (where architecture decisions happen)
- Sonnet for execution and research (follows explicit instructions)
- Sonnet for verification (needs reasoning, not just pattern matching)
- Use when: normal development, good balance of quality and cost

**budget** - Minimal Opus usage
- Sonnet for anything that writes code
- Haiku for research and verification
- Use when: conserving quota, high-volume work, less critical phases

## Resolution Logic

Orchestrators resolve model before spawning:

```
1. Read .planning/config.json
2. Get model_profile (default: "balanced")
3. Look up agent in table above
4. Pass model parameter to Task call
```

## Switching Profiles

Runtime: `/gsd:set-profile <profile>`

Per-project default: Set in `.planning/config.json`:
```json
{
  "model_profile": "balanced"
}
```

## Agent Teams (Experimental)

When `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set in global settings, opus-profile orchestrators use agent teams instead of parallel Task() subagents for workloads that benefit from inter-agent coordination.

**Agent teams vs subagents:**
- Subagents: report results back to caller only, no cross-communication
- Agent teams: teammates message each other, share task lists, self-coordinate

**When GSD uses agent teams (quality profile + feature enabled):**

| Workflow | Subagent Default | Agent Team Upgrade | Benefit |
|----------|------------------|--------------------|---------|
| `new-project` Phase 6 | 4 parallel Task() researchers | Team of 4 researcher teammates | Researchers challenge/build on each other's findings |
| `new-milestone` research | 4 parallel Task() researchers | Team of 4 researcher teammates | Same as above |
| `execute-phase` wave execution | Parallel Task() executors per wave | Team of executor teammates per wave | Executors coordinate on shared dependencies |
| `debug` investigation | Single debugger subagent | Team of hypothesis investigators | Competing theories, adversarial debate |

**When GSD still uses subagents (no agent team upgrade):**
- Single-agent spawns (planner, verifier, plan-checker, roadmapper)
- Sequential execution (one plan at a time)
- Budget/balanced profiles (overhead not justified)

**Fallback:** If agent teams fail to spawn or feature is disabled, all orchestrators fall back to standard Task() subagent calls.

## Design Rationale

**Why Opus for gsd-planner?**
Planning involves architecture decisions, goal decomposition, and task design. This is where model quality has the highest impact.

**Why Sonnet for gsd-executor?**
Executors follow explicit PLAN.md instructions. The plan already contains the reasoning; execution is implementation.

**Why Sonnet (not Haiku) for verifiers in balanced?**
Verification requires goal-backward reasoning - checking if code *delivers* what the phase promised, not just pattern matching. Sonnet handles this well; Haiku may miss subtle gaps.

**Why Haiku for gsd-codebase-mapper?**
Read-only exploration and pattern extraction. No reasoning required, just structured output from file contents.
