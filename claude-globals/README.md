# Claude Code Global Configuration

Portable backup of all Claude Code global and project-level configuration files, hooks, learnings, and scripts. Use this directory to replicate your Claude Code environment on a new device.

## Directory Structure

```
claude-globals/
  configs/           # Configuration files
    settings.json          # Global ~/.claude/settings.json
    CLAUDE.md              # Global ~/.claude/CLAUDE.md
    .env.template          # Environment variable template (tokens/keys)
    package.json           # ~/.claude/package.json (module type)
    project-settings.json  # Project .claude/settings.json (hooks config)
    project-settings-local.json  # Project .claude/settings.local.json (permissions)
    project-CLAUDE.md      # Project .claude/CLAUDE.md (project instructions template)

  hooks/              # Hook scripts (SessionStart, PostToolUse, SessionEnd, etc.)
    pre-session-cleanup.js    # Kills orphaned processes, trims sessions, cleans caches
    gsd-check-update.js       # Background check for GSD framework updates
    gsd-context-monitor.js    # PostToolUse: warns agent when context window is low
    gsd-statusline.js         # Statusline: model, task, context bar
    learning-context.js       # SessionStart: surfaces relevant learnings from git diff
    session-retro.js          # SessionEnd: extracts error patterns, writes session log
    task-model-tracker.js     # Tracks subagent model usage in cache

  learnings/          # Knowledge base (cross-project patterns & gotchas)
    INDEX.md               # Topic index with key patterns and dates
    browser-apis.md        # WAAPI, history API, pointerdown, focus(), audio autoplay
    claude-code-windows.md # StatusLine, execSync freezes, Cowork VM, WSL2, zombie cleanup
    css-3d-transforms.md   # backfaceVisibility, preserve-3d, overflow flattening, mobile
    gsd-workflow.md        # Agent teams, patches, worktrees, context efficiency, freezes
    nextjs-app-router.md   # Module-scope init, SSG layout chain, placeholder clients
    nextjs-csp.md          # Nonce vs hash CSP, Google Maps allowlisting, origin checklist
    npm-security-audit.md  # pnpm overrides, --prod audit, ignoreCves quirks
    pwa-viewport-meta.md   # viewport-fit=cover, safe-area-inset, Next.js dedup
    react-patterns.md      # Effect races, useReducer staleness, JSX Unicode, useState
    ui-polish-patterns.md  # font-myanmar, layoutId pill, transition-all, Stylelint
    ERROR_HISTORY.md       # 15+ documented bugs with root causes and fixes

  scripts/            # Utility scripts
    patch-gsd-agent-teams.sh  # Re-apply GSD agent teams customizations after update
    system-health-check.sh    # Comprehensive dev environment diagnostics

  skills/             # (Reserved for Claude Code skills)
  templates/          # (Reserved for templates)
  cowork/             # (Reserved for Cowork/multi-agent configs)

  setup.sh            # Installation script (copies everything into place)
```

## Setup on a New Device

### Prerequisites

- Git Bash or MINGW64 (Windows) / bash (macOS/Linux)
- Node.js 18+
- Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)

### Step-by-Step

1. **Clone or copy this directory** to your new machine.

2. **Review the setup script** to understand what it will do:
   ```bash
   bash setup.sh --dry-run
   ```

3. **Run the setup script** to install configs, hooks, and learnings:
   ```bash
   bash setup.sh
   ```

4. **Fill in environment variables** in `~/.claude/.env`:
   ```bash
   # Edit the generated .env file with your tokens
   nano ~/.claude/.env    # or use your preferred editor
   ```
   Required tokens:
   - `GH_TOKEN` - GitHub personal access token
   - `SENTRY_AUTH_TOKEN` - Sentry auth token (if using Sentry)
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (if using Supabase)

5. **Run the health check** to verify everything is working:
   ```bash
   bash claude-globals/scripts/system-health-check.sh
   ```

6. **For project-level setup**, copy project configs into your repo's `.claude/` directory:
   ```bash
   cp claude-globals/configs/project-settings.json .claude/settings.json
   cp claude-globals/configs/project-CLAUDE.md .claude/CLAUDE.md
   # Edit project-CLAUDE.md with your project's stack, commands, and paths
   ```

### What the Setup Script Does

- Copies `configs/settings.json` to `~/.claude/settings.json`
- Copies `configs/CLAUDE.md` to `~/.claude/CLAUDE.md`
- Copies `configs/package.json` to `~/.claude/package.json`
- Copies `configs/.env.template` to `~/.claude/.env` (only if not already present)
- Copies all `hooks/*.js` to `~/.claude/hooks/` and makes them executable
- Copies all `learnings/*.md` to `~/.claude/learnings/` (global knowledge base)
- Creates required directories (`~/.claude/cache/`, `~/.claude/hooks/`, etc.)

### Notes

- The setup script detects Windows (MINGW64) and adjusts paths accordingly.
- Existing files are backed up with `.bak` suffix before overwriting.
- Use `--dry-run` to preview changes without modifying anything.
- Hook paths in `settings.json` use absolute paths (`C:/Users/username/.claude/hooks/...`). You may need to update these for your username.
