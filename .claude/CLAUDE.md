# Project Constellation: 2026 Token-Efficiency Protocol

## Operational Guardrails
- **Plan Mode First:** Enter Plan Mode (Shift+Tab x2) for all tasks affecting >2 files.
- **Zero-Waste Execution:** NEVER spawn sub-agents or write code until a plan is approved.
- **Compact & Clear:** Manually run `/compact` when context hits 50%. Use `/clear` between unrelated tasks to prevent context pollution.

## Model Tiering Strategy
- **Architect (Opus 4.5):** Use `/mod opus-4.5` for initial discovery, complex refactors, and multi-file logic validation.
- **Worker (Haiku 4.5):** Switch to `/mod haiku-4.5` for boilerplate, unit tests, lint fixes, and documentation.
- **Logic:** Haiku 4.5 is preferred for execution as it matches Sonnet-level coding (SWE-bench 73.3%) at 1/3 the cost.

## File Management
- **Strict Read:** Only read files explicitly @-mentioned or required by the current dependency tree. Avoid global codebase scans.
- **File Limits:** Keep source files <400 lines; use the `/compact` instruction "Focus on code samples and API usage" to prioritize logic over comments during summarization.

## Verification Rules
- Always provide a numbered checklist of changes before exiting Plan Mode.
- Use `/test` immediately after changes; if it fails, press **Escape** to stop execution and analyze the trace in Plan Mode.
