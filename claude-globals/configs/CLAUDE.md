# Global Instructions

## Model Selection for Subagents
- **Opus (inherit parent)** → Explore, Plan, Research, general-purpose, and any agent doing reasoning, analysis, or architecture work. Omit `model` parameter so they inherit the parent model.
- **Sonnet** → straightforward mechanical tasks only: running tests, verifications, linting, formatting checks, simple file searches. Use `model: "sonnet"` for these.
- Only use Haiku if the user explicitly requests it.
- GSD agents follow their own model profile system in `.planning/config.json` — do not override those.
