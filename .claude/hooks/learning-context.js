#!/usr/bin/env node
/**
 * SessionStart hook: surfaces relevant learning topics based on recent git changes.
 * Runs `git diff --name-only HEAD~5` and maps file paths to learning topics.
 * Outputs JSON with additionalContext for Claude to consume.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Map file path patterns to learning topic files
const TOPIC_MAP = [
  { pattern: /tokens\.css|globals\.css|tailwind/i, topic: "tailwind-v4", file: "tailwind-v4.md" },
  { pattern: /tokens|design.*token|color|theme/i, topic: "design-tokens", file: "design-tokens.md" },
  { pattern: /drawer|bottom.?sheet|scroll.?lock|swipe|touch/i, topic: "mobile-ux", file: "mobile-ux.md" },
  { pattern: /motion|animation|gsap|framer|animate/i, topic: "animation", file: "animation.md" },
  { pattern: /next\.config|route\.(ts|js)|middleware|redirect/i, topic: "nextjs", file: "nextjs.md" },
  { pattern: /supabase|auth|rls|invite|magic.?link/i, topic: "supabase-auth", file: "supabase-auth.md" },
  { pattern: /context|provider|portal|hydrat/i, topic: "react-patterns", file: "react-patterns.md" },
  { pattern: /cart|store|zustand|mutation|debounce/i, topic: "state-management", file: "state-management.md" },
  { pattern: /\.test\.|\.spec\.|e2e|playwright/i, topic: "testing", file: "testing.md" },
  { pattern: /eslint|\.config|barrel|index\.(ts|tsx)$/i, topic: "tooling", file: "tooling.md" },
  { pattern: /lazy|intersect|performance|optimize|bundle/i, topic: "performance", file: "performance.md" },
];

function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  const learningsDir = path.join(projectRoot, ".claude", "learnings");

  // Check if learnings directory exists
  if (!fs.existsSync(learningsDir)) {
    return;
  }

  // Get recently changed files
  let changedFiles;
  try {
    changedFiles = execSync("git diff --name-only HEAD~5 2>nul || git diff --name-only HEAD 2>nul", {
      cwd: projectRoot,
      encoding: "utf-8",
      timeout: 5000,
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    // No git or no commits — check for session logs instead
    changedFiles = [];
  }

  // Also check session logs for previous session context
  const sessionLogDir = path.join(projectRoot, ".claude", "session-logs");
  let lastSessionTopics = [];
  if (fs.existsSync(sessionLogDir)) {
    const logs = fs.readdirSync(sessionLogDir).sort().reverse();
    if (logs.length > 0) {
      try {
        const lastLog = fs.readFileSync(path.join(sessionLogDir, logs[0]), "utf-8");
        const topicMatch = lastLog.match(/\*\*Topics:\*\* (.+)/);
        if (topicMatch) {
          lastSessionTopics = topicMatch[1].split(", ").map((t) => t.trim());
        }
      } catch {
        // ignore
      }
    }
  }

  // Map changed files to topics
  const matchedTopics = new Map(); // topic -> file
  for (const changedFile of changedFiles) {
    for (const { pattern, topic, file } of TOPIC_MAP) {
      if (pattern.test(changedFile)) {
        matchedTopics.set(topic, file);
      }
    }
  }

  // Add last session's topics
  for (const topic of lastSessionTopics) {
    const mapping = TOPIC_MAP.find((m) => m.topic === topic);
    if (mapping) {
      matchedTopics.set(topic, mapping.file);
    }
  }

  if (matchedTopics.size === 0) {
    return;
  }

  // Build context message
  const topicList = [...matchedTopics.entries()]
    .map(([topic, file]) => `- ${topic}: .claude/learnings/${file}`)
    .join("\n");

  const context = `Recent changes and last session touch these learning areas. Scan relevant files before debugging:\n${topicList}\n\nFull index: .claude/learnings/INDEX.md`;

  // Output as additionalContext
  console.log(JSON.stringify({ additionalContext: context }));
}

try {
  main();
} catch {
  // Never fail the session start
  process.exit(0);
}
