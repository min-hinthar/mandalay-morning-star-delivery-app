#!/bin/bash
# Session retrospective pre-filter
# Extracts error patterns from transcript for prompt-based analysis

set -euo pipefail

# Read hook input JSON from stdin
input=$(cat)
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null || true)

# Exit if no transcript available
if [ -z "$transcript_path" ] || [ ! -f "$transcript_path" ]; then
  exit 0
fi

# Extract and count error patterns
patterns=$(grep -oiE '(TS[0-9]{4}|Cannot find module|PGRST[0-9]{3}|RLS|auth.*error|webhook.*fail|import.*error)' "$transcript_path" 2>/dev/null | sort | uniq -c | sort -rn | head -5 || true)

# Output patterns for prompt hook to consume
if [ -n "$patterns" ]; then
  echo '{"systemMessage": "Error patterns detected: '"$(echo "$patterns" | tr '\n' '; ')"'"}'
fi

exit 0
