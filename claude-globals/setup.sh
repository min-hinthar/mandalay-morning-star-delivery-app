#!/bin/bash
# Claude Code Global Configuration Setup Script
# Copies configs, hooks, learnings, and scripts to their correct locations.
#
# Usage:
#   bash setup.sh              # Install everything
#   bash setup.sh --dry-run    # Preview changes without modifying files
#
# Handles Windows (MINGW64/Git Bash) and Unix paths.

set -e

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false
COPIED=0
SKIPPED=0
BACKED_UP=0

# Parse args
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    --help|-h)
      echo "Usage: bash setup.sh [--dry-run]"
      echo ""
      echo "  --dry-run    Preview changes without modifying files"
      echo "  --help       Show this help message"
      exit 0
      ;;
  esac
done

# --- Detect home directory (Windows-aware) ---
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "mingw"* || "$OSTYPE" == "cygwin" ]]; then
  # Windows Git Bash / MINGW64
  if [ -n "$USERPROFILE" ]; then
    HOME_DIR="$(cygpath -u "$USERPROFILE" 2>/dev/null || echo "$HOME")"
  else
    HOME_DIR="$HOME"
  fi
  IS_WINDOWS=true
  echo "Detected: Windows (MINGW64/Git Bash)"
else
  HOME_DIR="$HOME"
  IS_WINDOWS=false
  echo "Detected: Unix/macOS"
fi

CLAUDE_DIR="${HOME_DIR}/.claude"
echo "Claude directory: ${CLAUDE_DIR}"
echo ""

# --- Helper functions ---

ensure_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    if [ "$DRY_RUN" = true ]; then
      echo "  [DRY-RUN] Would create directory: $dir"
    else
      mkdir -p "$dir"
      echo "  Created directory: $dir"
    fi
  fi
}

copy_file() {
  local src="$1"
  local dst="$2"
  local desc="$3"

  if [ ! -f "$src" ]; then
    echo "  WARNING: Source file not found: $src"
    return
  fi

  if [ -f "$dst" ]; then
    # Check if files are identical
    if diff -q "$src" "$dst" > /dev/null 2>&1; then
      echo "  SKIP (identical): $desc"
      ((SKIPPED++))
      return
    fi

    # Backup existing file
    if [ "$DRY_RUN" = true ]; then
      echo "  [DRY-RUN] Would backup: $dst -> ${dst}.bak"
      echo "  [DRY-RUN] Would copy: $desc"
    else
      cp "$dst" "${dst}.bak"
      echo "  BACKUP: ${dst}.bak"
      ((BACKED_UP++))
      cp "$src" "$dst"
      echo "  COPIED: $desc"
    fi
  else
    if [ "$DRY_RUN" = true ]; then
      echo "  [DRY-RUN] Would copy: $desc"
    else
      cp "$src" "$dst"
      echo "  COPIED: $desc"
    fi
  fi
  ((COPIED++))
}

copy_file_no_overwrite() {
  local src="$1"
  local dst="$2"
  local desc="$3"

  if [ ! -f "$src" ]; then
    echo "  WARNING: Source file not found: $src"
    return
  fi

  if [ -f "$dst" ]; then
    echo "  SKIP (exists, won't overwrite): $desc"
    ((SKIPPED++))
    return
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "  [DRY-RUN] Would copy: $desc"
  else
    cp "$src" "$dst"
    echo "  COPIED: $desc"
  fi
  ((COPIED++))
}

make_executable() {
  local file="$1"
  if [ "$DRY_RUN" = true ]; then
    echo "  [DRY-RUN] Would make executable: $file"
  else
    chmod +x "$file" 2>/dev/null || true
  fi
}

# --- Banner ---
echo "=============================================="
echo "  Claude Code Global Configuration Setup"
echo "=============================================="
if [ "$DRY_RUN" = true ]; then
  echo "  MODE: DRY RUN (no changes will be made)"
fi
echo ""

# --- Step 1: Create directories ---
echo "[1/6] Creating directories..."
ensure_dir "${CLAUDE_DIR}"
ensure_dir "${CLAUDE_DIR}/hooks"
ensure_dir "${CLAUDE_DIR}/cache"
ensure_dir "${CLAUDE_DIR}/scripts"
ensure_dir "${CLAUDE_DIR}/learnings"
echo ""

# --- Step 2: Copy global configs ---
echo "[2/6] Copying global configurations..."
copy_file "${SCRIPT_DIR}/configs/settings.json" "${CLAUDE_DIR}/settings.json" "settings.json -> ~/.claude/settings.json"
copy_file "${SCRIPT_DIR}/configs/CLAUDE.md" "${CLAUDE_DIR}/CLAUDE.md" "CLAUDE.md -> ~/.claude/CLAUDE.md"
copy_file "${SCRIPT_DIR}/configs/package.json" "${CLAUDE_DIR}/package.json" "package.json -> ~/.claude/package.json"
echo ""

# --- Step 3: Copy .env template (never overwrite existing) ---
echo "[3/6] Setting up environment variables..."
copy_file_no_overwrite "${SCRIPT_DIR}/configs/.env.template" "${CLAUDE_DIR}/.env" ".env.template -> ~/.claude/.env (will not overwrite existing)"
echo ""

# --- Step 4: Copy hooks ---
echo "[4/6] Copying hook scripts..."
for hook_file in "${SCRIPT_DIR}/hooks/"*.js; do
  if [ -f "$hook_file" ]; then
    filename=$(basename "$hook_file")
    copy_file "$hook_file" "${CLAUDE_DIR}/hooks/${filename}" "hooks/${filename}"
    make_executable "${CLAUDE_DIR}/hooks/${filename}"
  fi
done
echo ""

# --- Step 5: Copy learnings ---
echo "[5/7] Copying learnings knowledge base..."
ensure_dir "${CLAUDE_DIR}/learnings"
for learning_file in "${SCRIPT_DIR}/learnings/"*.md; do
  if [ -f "$learning_file" ]; then
    filename=$(basename "$learning_file")
    copy_file "$learning_file" "${CLAUDE_DIR}/learnings/${filename}" "learnings/${filename}"
  fi
done
echo ""

# --- Step 6: Copy scripts ---
echo "[6/7] Copying utility scripts..."
for script_file in "${SCRIPT_DIR}/scripts/"*.sh; do
  if [ -f "$script_file" ]; then
    filename=$(basename "$script_file")
    copy_file "$script_file" "${CLAUDE_DIR}/scripts/${filename}" "scripts/${filename}"
    make_executable "${CLAUDE_DIR}/scripts/${filename}"
  fi
done
echo ""

# --- Step 7: Post-install notes ---
echo "[7/7] Post-installation notes..."
echo ""

if [ "$IS_WINDOWS" = true ]; then
  WIN_USER=$(basename "$HOME_DIR")
  echo "  IMPORTANT (Windows): Hook paths in settings.json use absolute paths."
  echo "  Verify these paths match your username:"
  echo "    C:/Users/${WIN_USER}/.claude/hooks/pre-session-cleanup.js"
  echo "    C:/Users/${WIN_USER}/.claude/hooks/gsd-check-update.js"
  echo ""
  echo "  If your username differs, update paths in:"
  echo "    ${CLAUDE_DIR}/settings.json"
  echo ""
fi

if [ -f "${CLAUDE_DIR}/.env" ]; then
  # Check if .env has empty values
  if grep -q '=""' "${CLAUDE_DIR}/.env" 2>/dev/null; then
    echo "  ACTION REQUIRED: Fill in your API tokens in ${CLAUDE_DIR}/.env"
    echo "    - GH_TOKEN (GitHub): run 'gh auth token' or create at https://github.com/settings/tokens"
    echo "    - SENTRY_AUTH_TOKEN: create at https://sentry.io/settings/auth-tokens/"
    echo "    - SUPABASE_SERVICE_ROLE_KEY: from Supabase dashboard Settings -> API"
    echo ""
  fi
fi

# --- Summary ---
echo "=============================================="
echo "  Setup Complete"
echo "=============================================="
if [ "$DRY_RUN" = true ]; then
  echo "  Mode:      DRY RUN (no changes made)"
fi
echo "  Copied:    ${COPIED} files"
echo "  Skipped:   ${SKIPPED} files"
echo "  Backed up: ${BACKED_UP} files"
echo ""
echo "  Next steps:"
echo "    1. Fill in ~/.claude/.env with your API tokens"
echo "    2. Run 'bash claude-globals/scripts/system-health-check.sh' to verify"
echo "    3. Start Claude Code and verify hooks load correctly"
echo "=============================================="
