#!/bin/bash
# System Health Check for Claude Code Development Environment
# Comprehensive diagnostics for Git, Node.js, SSH, Claude Code, and related tools.
#
# Usage: bash system-health-check.sh
#
# Color-coded output:
#   GREEN  = OK
#   YELLOW = Warning (non-blocking)
#   RED    = Failure (needs attention)

set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# --- Counters ---
PASS=0
WARN=0
FAIL=0

# --- Helpers ---
ok() {
  echo -e "  ${GREEN}[OK]${NC} $1"
  ((PASS++))
}

warn() {
  echo -e "  ${YELLOW}[WARN]${NC} $1"
  ((WARN++))
}

fail() {
  echo -e "  ${RED}[FAIL]${NC} $1"
  ((FAIL++))
}

info() {
  echo -e "  ${DIM}[INFO]${NC} $1"
}

section() {
  echo ""
  echo -e "${BOLD}${BLUE}=== $1 ===${NC}"
}

# --- Detect OS ---
IS_WINDOWS=false
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "mingw"* || "$OSTYPE" == "cygwin" ]]; then
  IS_WINDOWS=true
fi

# =============================================================================
echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   System Health Check — Claude Code Environment  ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════╝${NC}"
echo -e "${DIM}  Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${DIM}  OS:   $(uname -s) $(uname -r)${NC}"
echo -e "${DIM}  Shell: $SHELL${NC}"

# =============================================================================
section "1. Git"
# =============================================================================

# Git version
if command -v git &>/dev/null; then
  GIT_VERSION=$(git --version 2>/dev/null | head -1)
  ok "Git installed: ${GIT_VERSION}"
else
  fail "Git not found in PATH"
fi

# Git config — user
GIT_USER=$(git config --global user.name 2>/dev/null || echo "")
GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")
if [ -n "$GIT_USER" ] && [ -n "$GIT_EMAIL" ]; then
  ok "Git user: ${GIT_USER} <${GIT_EMAIL}>"
else
  warn "Git user/email not configured globally"
fi

# Git config — credential helper
GIT_CRED=$(git config --global credential.helper 2>/dev/null || echo "")
if [ -n "$GIT_CRED" ]; then
  ok "Credential helper: ${GIT_CRED}"
else
  warn "No credential helper configured"
fi

# Git config — safe directory
GIT_SAFE=$(git config --global --get-all safe.directory 2>/dev/null || echo "")
if [ -n "$GIT_SAFE" ]; then
  info "Safe directories configured: $(echo "$GIT_SAFE" | wc -l | tr -d ' ') entries"
fi

# Git integrity (if in a repo)
if git rev-parse --is-inside-work-tree &>/dev/null; then
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
  info "Current repo: ${REPO_ROOT}"

  # Quick fsck (connectivity only, skip blobs for speed)
  if git fsck --connectivity-only --no-dangling 2>/dev/null | grep -q "error\|missing\|broken"; then
    fail "Git repository has integrity issues — run 'git fsck' for details"
  else
    ok "Git repository integrity: clean"
  fi

  # Check for lock files
  if [ -f "${REPO_ROOT}/.git/index.lock" ]; then
    fail "Git index.lock exists — stale lock from crashed process"
    info "Fix: rm ${REPO_ROOT}/.git/index.lock"
  else
    ok "No stale git lock files"
  fi

  # Check for worktrees
  WORKTREE_COUNT=$(git worktree list 2>/dev/null | wc -l | tr -d ' ')
  if [ "$WORKTREE_COUNT" -gt 1 ]; then
    info "Git worktrees: ${WORKTREE_COUNT} (including main)"
  fi
else
  info "Not inside a git repository"
fi

# =============================================================================
section "2. GitHub Authentication"
# =============================================================================

# SSH key check
if [ -f "$HOME/.ssh/id_ed25519" ] || [ -f "$HOME/.ssh/id_rsa" ]; then
  ok "SSH key found"

  # SSH agent
  if ssh-add -l &>/dev/null 2>&1; then
    KEY_COUNT=$(ssh-add -l 2>/dev/null | wc -l | tr -d ' ')
    ok "SSH agent running with ${KEY_COUNT} key(s)"
  else
    warn "SSH agent not running or no keys loaded"
    info "Fix: eval \$(ssh-agent -s) && ssh-add ~/.ssh/id_ed25519"
  fi

  # SSH connectivity to GitHub
  SSH_RESULT=$(ssh -T git@github.com 2>&1 || true)
  if echo "$SSH_RESULT" | grep -qi "successfully authenticated\|Hi "; then
    GH_SSH_USER=$(echo "$SSH_RESULT" | grep -oP 'Hi \K[^!]+' 2>/dev/null || echo "authenticated")
    ok "SSH to GitHub: ${GH_SSH_USER}"
  else
    warn "SSH to GitHub failed — may need 'ssh-add' or key registration"
  fi
else
  warn "No SSH key found at ~/.ssh/id_ed25519 or ~/.ssh/id_rsa"
  info "Generate: ssh-keygen -t ed25519 -C 'your-email@example.com'"
fi

# GitHub CLI
if command -v gh &>/dev/null; then
  GH_VERSION=$(gh --version 2>/dev/null | head -1)
  ok "GitHub CLI: ${GH_VERSION}"

  GH_AUTH=$(gh auth status 2>&1 || true)
  if echo "$GH_AUTH" | grep -qi "logged in\|active account"; then
    GH_USER=$(echo "$GH_AUTH" | grep -oP 'account \K\S+' 2>/dev/null || echo "authenticated")
    ok "GitHub CLI authenticated: ${GH_USER}"
  else
    warn "GitHub CLI not authenticated — run 'gh auth login'"
  fi
else
  warn "GitHub CLI (gh) not installed"
  info "Install: https://cli.github.com/"
fi

# =============================================================================
section "3. Node.js / Package Managers"
# =============================================================================

# Node.js
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version 2>/dev/null)
  NODE_MAJOR=$(echo "$NODE_VERSION" | grep -oP '\d+' | head -1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    ok "Node.js: ${NODE_VERSION}"
  else
    warn "Node.js ${NODE_VERSION} — recommend v18+ for Claude Code"
  fi
else
  fail "Node.js not found in PATH"
fi

# npm
if command -v npm &>/dev/null; then
  NPM_VERSION=$(npm --version 2>/dev/null)
  ok "npm: v${NPM_VERSION}"
else
  warn "npm not found"
fi

# pnpm
if command -v pnpm &>/dev/null; then
  PNPM_VERSION=$(pnpm --version 2>/dev/null)
  ok "pnpm: v${PNPM_VERSION}"
else
  info "pnpm not installed (optional)"
fi

# Check for multiple node installations
NODE_LOCATIONS=$(which -a node 2>/dev/null | sort -u | wc -l | tr -d ' ')
if [ "$NODE_LOCATIONS" -gt 1 ]; then
  warn "Multiple node installations found (${NODE_LOCATIONS})"
  which -a node 2>/dev/null | sort -u | while read -r loc; do
    info "  $loc: $(\"$loc\" --version 2>/dev/null || echo 'unknown')"
  done
fi

# =============================================================================
section "4. Claude Code"
# =============================================================================

# Claude CLI
if command -v claude &>/dev/null; then
  CLAUDE_VERSION=$(claude --version 2>/dev/null | head -1 || echo "unknown")
  ok "Claude Code CLI: ${CLAUDE_VERSION}"
  CLAUDE_PATH=$(which claude 2>/dev/null)
  info "Path: ${CLAUDE_PATH}"
else
  fail "Claude Code CLI not found"
  info "Install: npm install -g @anthropic-ai/claude-code"
fi

# Check for conflicting claude installations
CLAUDE_LOCATIONS=$(which -a claude 2>/dev/null | sort -u | wc -l | tr -d ' ')
if [ "$CLAUDE_LOCATIONS" -gt 1 ]; then
  warn "Multiple claude installations found (${CLAUDE_LOCATIONS})"
  which -a claude 2>/dev/null | sort -u | while read -r loc; do
    info "  $loc"
  done
fi

# Claude config directory
CLAUDE_DIR="$HOME/.claude"
if [ -d "$CLAUDE_DIR" ]; then
  ok "Claude config directory exists: ${CLAUDE_DIR}"

  # Check key files
  for f in settings.json CLAUDE.md package.json; do
    if [ -f "${CLAUDE_DIR}/${f}" ]; then
      ok "  ${f} present"
    else
      warn "  ${f} missing"
    fi
  done

  # Check hooks
  HOOK_COUNT=$(ls "${CLAUDE_DIR}/hooks/"*.js 2>/dev/null | wc -l | tr -d ' ')
  if [ "$HOOK_COUNT" -gt 0 ]; then
    ok "  Hooks: ${HOOK_COUNT} scripts"
  else
    warn "  No hooks installed"
  fi

  # Check .env
  if [ -f "${CLAUDE_DIR}/.env" ]; then
    EMPTY_TOKENS=$(grep -c '=""' "${CLAUDE_DIR}/.env" 2>/dev/null || echo "0")
    if [ "$EMPTY_TOKENS" -gt 0 ]; then
      warn "  .env has ${EMPTY_TOKENS} empty token(s) — fill in API keys"
    else
      ok "  .env configured"
    fi
  else
    warn "  .env not found — create from .env.template"
  fi
else
  fail "Claude config directory not found: ${CLAUDE_DIR}"
fi

# Claude credentials
if [ -f "$HOME/.claude/.credentials.json" ] || [ -f "$HOME/.claude/credentials.json" ]; then
  ok "Claude credentials file found"
else
  info "No Claude credentials file (may use env var ANTHROPIC_API_KEY)"
fi

# GSD framework
GSD_DIR="${CLAUDE_DIR}/get-shit-done"
if [ -d "$GSD_DIR" ]; then
  GSD_VERSION="unknown"
  if [ -f "${GSD_DIR}/VERSION" ]; then
    GSD_VERSION=$(cat "${GSD_DIR}/VERSION" 2>/dev/null || echo "unknown")
  fi
  ok "GSD framework installed: v${GSD_VERSION}"
else
  info "GSD framework not installed (optional)"
fi

# =============================================================================
section "5. Search Tools"
# =============================================================================

# ripgrep
if command -v rg &>/dev/null; then
  RG_VERSION=$(rg --version 2>/dev/null | head -1)
  ok "ripgrep: ${RG_VERSION}"
else
  warn "ripgrep (rg) not installed — Claude Code uses bundled version, but local rg is useful"
  info "Install: scoop install ripgrep (Windows) or brew install ripgrep (macOS)"
fi

# fd (optional)
if command -v fd &>/dev/null; then
  FD_VERSION=$(fd --version 2>/dev/null | head -1)
  ok "fd: ${FD_VERSION}"
else
  info "fd not installed (optional file finder)"
fi

# =============================================================================
section "6. System Resources"
# =============================================================================

# Disk space
if command -v df &>/dev/null; then
  if [ "$IS_WINDOWS" = true ]; then
    # On MINGW, df works but formatting varies
    DISK_AVAIL=$(df -h / 2>/dev/null | tail -1 | awk '{print $4}')
    DISK_USE=$(df -h / 2>/dev/null | tail -1 | awk '{print $5}')
    if [ -n "$DISK_AVAIL" ]; then
      # Extract numeric percentage
      DISK_PCT=$(echo "$DISK_USE" | tr -d '%')
      if [ -n "$DISK_PCT" ] && [ "$DISK_PCT" -gt 90 ] 2>/dev/null; then
        warn "Disk usage: ${DISK_USE} (${DISK_AVAIL} available) — low space"
      else
        ok "Disk space: ${DISK_AVAIL} available (${DISK_USE} used)"
      fi
    fi
  else
    DISK_AVAIL=$(df -h / 2>/dev/null | tail -1 | awk '{print $4}')
    DISK_USE=$(df -h / 2>/dev/null | tail -1 | awk '{print $5}')
    DISK_PCT=$(echo "$DISK_USE" | tr -d '%')
    if [ -n "$DISK_PCT" ] && [ "$DISK_PCT" -gt 90 ]; then
      warn "Disk usage: ${DISK_USE} (${DISK_AVAIL} available) — low space"
    else
      ok "Disk space: ${DISK_AVAIL} available (${DISK_USE} used)"
    fi
  fi
fi

# Process count (node/claude)
if [ "$IS_WINDOWS" = true ]; then
  NODE_PROCS=$(tasklist 2>/dev/null | grep -ic "node" || echo "0")
  CLAUDE_PROCS=$(tasklist 2>/dev/null | grep -ic "claude" || echo "0")
else
  NODE_PROCS=$(pgrep -c node 2>/dev/null || echo "0")
  CLAUDE_PROCS=$(pgrep -c claude 2>/dev/null || echo "0")
fi

if [ "$NODE_PROCS" -gt 15 ]; then
  warn "High node process count: ${NODE_PROCS} — may indicate orphaned processes"
  info "Run pre-session-cleanup.js or check with: tasklist | grep node"
elif [ "$NODE_PROCS" -gt 0 ]; then
  ok "Node processes: ${NODE_PROCS}"
else
  info "No node processes running"
fi

if [ "$CLAUDE_PROCS" -gt 0 ]; then
  info "Claude processes: ${CLAUDE_PROCS}"
fi

# System clock
CLOCK_OFFSET=""
if command -v ntpdate &>/dev/null; then
  CLOCK_OFFSET=$(ntpdate -q pool.ntp.org 2>/dev/null | tail -1 | grep -oP 'offset \K[-0-9.]+' || echo "")
fi
if [ -n "$CLOCK_OFFSET" ]; then
  # Check if offset is more than 5 seconds
  ABS_OFFSET=$(echo "$CLOCK_OFFSET" | tr -d '-')
  if [ "$(echo "$ABS_OFFSET > 5" | bc 2>/dev/null)" = "1" ] 2>/dev/null; then
    warn "System clock offset: ${CLOCK_OFFSET}s — may cause auth issues"
  else
    ok "System clock offset: ${CLOCK_OFFSET}s"
  fi
else
  info "System clock check skipped (ntpdate not available)"
fi

# =============================================================================
section "7. Environment Variables"
# =============================================================================

# Check key env vars
for var in ANTHROPIC_API_KEY GH_TOKEN SENTRY_AUTH_TOKEN; do
  VAL=$(printenv "$var" 2>/dev/null || echo "")
  if [ -n "$VAL" ]; then
    # Show first/last 4 chars only
    MASKED="${VAL:0:4}...${VAL: -4}"
    ok "${var}: set (${MASKED})"
  else
    if [ "$var" = "ANTHROPIC_API_KEY" ]; then
      info "${var}: not set (may use credentials file)"
    else
      info "${var}: not set"
    fi
  fi
done

# Claude-specific env vars
AGENT_TEAMS=$(printenv CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 2>/dev/null || echo "")
if [ -n "$AGENT_TEAMS" ]; then
  info "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=${AGENT_TEAMS}"
fi

# =============================================================================
section "8. Session Cleanup Recommendations"
# =============================================================================

# Check for stale todo files
TODOS_DIR="$HOME/.claude/todos"
if [ -d "$TODOS_DIR" ]; then
  TODO_COUNT=$(ls "$TODOS_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
  if [ "$TODO_COUNT" -gt 50 ]; then
    warn "Stale todo files: ${TODO_COUNT} — run pre-session-cleanup.js"
  elif [ "$TODO_COUNT" -gt 0 ]; then
    info "Todo files: ${TODO_COUNT}"
  fi
fi

# Check for stale task directories
TASKS_DIR="$HOME/.claude/tasks"
if [ -d "$TASKS_DIR" ]; then
  TASK_DIRS=$(ls -d "$TASKS_DIR"/*/ 2>/dev/null | wc -l | tr -d ' ')
  if [ "$TASK_DIRS" -gt 0 ]; then
    warn "Stale task directories: ${TASK_DIRS} — run pre-session-cleanup.js"
  fi
fi

# Check session count per project
PROJECTS_DIR="$HOME/.claude/projects"
if [ -d "$PROJECTS_DIR" ]; then
  for proj in "$PROJECTS_DIR"/*/; do
    if [ -d "$proj" ]; then
      PROJ_NAME=$(basename "$proj")
      SESSION_COUNT=$(ls -d "$proj"*/ 2>/dev/null | grep -v "memory" | wc -l | tr -d ' ')
      if [ "$SESSION_COUNT" -gt 25 ]; then
        warn "Project '${PROJ_NAME}': ${SESSION_COUNT} sessions — consider cleanup"
      fi
    fi
  done
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Summary${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed:${NC}   ${PASS}"
echo -e "  ${YELLOW}Warnings:${NC} ${WARN}"
echo -e "  ${RED}Failed:${NC}   ${FAIL}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}${BOLD}Action required:${NC} Fix the ${FAIL} failure(s) above before using Claude Code."
elif [ "$WARN" -gt 0 ]; then
  echo -e "  ${YELLOW}${BOLD}Mostly healthy:${NC} ${WARN} warning(s) to review, but not blocking."
else
  echo -e "  ${GREEN}${BOLD}All checks passed!${NC} Environment is ready."
fi
echo ""
