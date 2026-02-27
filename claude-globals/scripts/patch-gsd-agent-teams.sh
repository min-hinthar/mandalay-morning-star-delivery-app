#!/bin/bash
# Patch GSD command files to use per-workflow agent_teams config
# Run after /gsd:update to re-apply customizations
#
# What this does:
# - Replaces env var check (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) with config.json check
# - Updates 4 command files: execute-phase, new-project, new-milestone, debug
# - Updates settings.md with per-workflow toggle
# - Updates model-profiles.md reference
# - Updates config.json template with agent_teams object
# - Works on both global (~/.claude) and local (./.claude) installations
#
# Usage: bash ~/.claude/scripts/patch-gsd-agent-teams.sh [--global|--local|--both]
#   --global: patch ~/.claude only (default)
#   --local:  patch ./.claude only
#   --both:   patch both locations

set -e

MODE="${1:---global}"
PATCHED=0
SKIPPED=0

patch_command_file() {
  local file="$1"
  local workflow_key="$2"  # research, execution, or debug

  if [ ! -f "$file" ]; then
    echo "  SKIP: $file (not found)"
    ((SKIPPED++))
    return
  fi

  # Check if already patched
  if grep -q "agent_teams\.${workflow_key}" "$file" 2>/dev/null; then
    echo "  SKIP: $file (already patched)"
    ((SKIPPED++))
    return
  fi

  # Check if it has the env var pattern to replace
  if ! grep -q 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS\|AGENT_TEAMS_ENABLED\|AGENT_TEAMS=' "$file" 2>/dev/null; then
    echo "  SKIP: $file (no agent teams pattern found)"
    ((SKIPPED++))
    return
  fi

  # Replace the bash check block
  sed -i 's|```bash\n.*AGENT_TEAMS_ENABLED.*\n```|Read `.planning/config.json` and check `agent_teams.'"${workflow_key}"'`:\n- If `agent_teams` is `false` (boolean) or missing → disabled\n- If `agent_teams` is an object → check `agent_teams.'"${workflow_key}"'` (default: `false`)|g' "$file"

  # Simpler sed: replace the specific lines
  # Replace env var check line
  sed -i "s|AGENT_TEAMS_ENABLED=\$(echo \$CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS)|Read \`.planning/config.json\` and check \`agent_teams.${workflow_key}\`:|g" "$file"
  sed -i "s|AGENT_TEAMS=\$(cat .planning/config.json.*agent_teams.*)|Read \`.planning/config.json\` and check \`agent_teams.${workflow_key}\`:|g" "$file"

  # Replace condition text
  sed -i "s|If agent teams enabled AND model_profile is \"quality\"|If agent_teams.${workflow_key} is true AND model_profile is \"quality\"|g" "$file"
  sed -i "s|If AGENT_TEAMS is \"true\" AND model_profile is \"quality\"|If agent_teams.${workflow_key} is true AND model_profile is \"quality\"|g" "$file"
  sed -i "s|If agent teams NOT enabled OR profile is not \"quality\"|If agent_teams.${workflow_key} is false OR profile is not \"quality\"|g" "$file"
  sed -i "s|If AGENT_TEAMS is \"false\" OR profile is not \"quality\"|If agent_teams.${workflow_key} is false OR profile is not \"quality\"|g" "$file"

  # Remove bash code block around the check if present
  sed -i '/```bash/,/```/{/AGENT_TEAMS/d}' "$file"

  echo "  DONE: $file"
  ((PATCHED++))
}

patch_config_template() {
  local file="$1"

  if [ ! -f "$file" ]; then
    echo "  SKIP: $file (not found)"
    ((SKIPPED++))
    return
  fi

  # Check if already has agent_teams object
  if grep -q '"agent_teams"' "$file" 2>/dev/null; then
    echo "  SKIP: $file (already has agent_teams)"
    ((SKIPPED++))
    return
  fi

  # Add agent_teams before workflow section
  sed -i '/"workflow":/i\  "agent_teams": {\n    "research": false,\n    "execution": false,\n    "debug": false\n  },' "$file"

  echo "  DONE: $file"
  ((PATCHED++))
}

patch_location() {
  local base="$1"
  local label="$2"

  echo ""
  echo "Patching ${label} (${base})..."
  echo "───────────────────────────────────────"

  # Command files
  patch_command_file "${base}/commands/gsd/execute-phase.md" "execution"
  patch_command_file "${base}/commands/gsd/new-project.md" "research"
  patch_command_file "${base}/commands/gsd/new-milestone.md" "research"
  patch_command_file "${base}/commands/gsd/debug.md" "debug"

  # Config template
  patch_config_template "${base}/get-shit-done/templates/config.json"
}

echo "╔═══════════════════════════════════════════════╗"
echo "║  GSD Agent Teams Patch                        ║"
echo "╚═══════════════════════════════════════════════╝"

case "$MODE" in
  --global)
    patch_location "$HOME/.claude" "GLOBAL"
    ;;
  --local)
    patch_location "./.claude" "LOCAL"
    ;;
  --both)
    patch_location "$HOME/.claude" "GLOBAL"
    patch_location "./.claude" "LOCAL"
    ;;
  *)
    echo "Usage: $0 [--global|--local|--both]"
    exit 1
    ;;
esac

echo ""
echo "───────────────────────────────────────"
echo "Patched: ${PATCHED} files"
echo "Skipped: ${SKIPPED} files (already patched or not found)"
echo ""
echo "Note: Each project also needs agent_teams in .planning/config.json:"
echo '  "agent_teams": { "research": true, "execution": false, "debug": true }'
