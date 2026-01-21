#!/bin/bash
# Migration Conflict Validator for Stop hook
# Checks for import/export mismatches, casing issues, orphaned version prefixes
# Outputs JSON: { "systemMessage": "...", "decision": "block"|"allow" }

set -euo pipefail

cd "$(dirname "$0")/../.." || exit 0

ERRORS=""
WARNINGS=""
ERROR_COUNT=0
WARNING_COUNT=0

# Helper to add error
add_error() {
  ERROR_COUNT=$((ERROR_COUNT + 1))
  if [ -n "$ERRORS" ]; then
    ERRORS="$ERRORS; $1"
  else
    ERRORS="$1"
  fi
}

# Helper to add warning
add_warning() {
  WARNING_COUNT=$((WARNING_COUNT + 1))
  if [ -n "$WARNINGS" ]; then
    WARNINGS="$WARNINGS; $1"
  else
    WARNINGS="$1"
  fi
}

# 1. Check barrel import path casing mismatches
# Windows is case-insensitive, but Git and TypeScript are case-sensitive
check_import_casing() {
  local indexFile="$1"
  local dir
  dir=$(dirname "$indexFile")

  # Extract relative imports (from "./something") - get just the path part
  grep -oE 'from "\./[^"]+' "$indexFile" 2>/dev/null | sed 's/from "\.\/\(.*\)/\1/' | while read -r import; do
    # Skip if empty or still has 'from'
    [ -z "$import" ] && continue
    [[ "$import" == *"from"* ]] && continue

    # Try common extensions
    for ext in ".tsx" ".ts" ".js" ""; do
      local expected="${import}${ext}"

      # Check if something with this name exists (case-insensitive)
      local actual
      actual=$(ls -1 "$dir" 2>/dev/null | grep -i "^${expected}$" | head -1 || true)

      if [ -n "$actual" ]; then
        # Compare exact casing
        if [ "$actual" != "$expected" ]; then
          echo "CASING:$indexFile imports './$import' but file is '$actual'"
        fi
        break
      fi
    done
  done
}

# Run casing checks on all barrel files
for indexFile in $(find src -name "index.ts" -o -name "v7-index.ts" 2>/dev/null); do
  casing_issues=$(check_import_casing "$indexFile" 2>/dev/null || true)
  if [ -n "$casing_issues" ]; then
    while IFS= read -r issue; do
      [ -n "$issue" ] && add_error "$issue"
    done <<< "$casing_issues"
  fi
done

# 2. Check for orphaned version prefixes in exports (V4-V7 that aren't backward-compat aliases)
# Pattern: "export { FooV7 }" without "as" indicates orphan (should be "export { Foo as FooV7 }")
orphan_exports=$(grep -rn "export {[^}]*V[4-7][^}]*}" src/components --include="*.ts" 2>/dev/null | \
  grep -v " as " | \
  grep -v "// Backward" | \
  head -5 || true)

if [ -n "$orphan_exports" ]; then
  # Count unique files
  orphan_count=$(echo "$orphan_exports" | wc -l | tr -d ' ')
  add_warning "VERSION_PREFIX: Found $orphan_count exports with V4-V7 suffix that may need cleanup (use 'Foo as FooV7' pattern)"
fi

# 3. Check for deprecated token references (v4/v5 tokens should be migrated)
deprecated_v4v5=$(grep -rn "var(--[a-z]*-v[4-5]" src --include="*.css" --include="*.tsx" 2>/dev/null | head -3 || true)
if [ -n "$deprecated_v4v5" ]; then
  add_warning "DEPRECATED_TOKEN: Found v4/v5 token references that should be migrated"
fi

# 4. Check for hardcoded version prefixes in component file names
versioned_files=$(find src/components -name "*V[4-7].tsx" -o -name "*V[4-7].ts" 2>/dev/null | head -5 || true)
if [ -n "$versioned_files" ]; then
  file_count=$(echo "$versioned_files" | wc -l | tr -d ' ')
  add_warning "VERSIONED_FILES: Found $file_count component files with version suffix in filename"
fi

# Build output JSON
if [ $ERROR_COUNT -gt 0 ]; then
  # Escape quotes and newlines for JSON
  safe_errors=$(echo "$ERRORS" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"systemMessage\": \"MIGRATION ERRORS ($ERROR_COUNT): $safe_errors\", \"decision\": \"block\"}"
  exit 0
elif [ $WARNING_COUNT -gt 0 ]; then
  safe_warnings=$(echo "$WARNINGS" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"systemMessage\": \"Migration warnings ($WARNING_COUNT): $safe_warnings\"}"
  exit 0
fi

# No issues found - no output needed
exit 0
