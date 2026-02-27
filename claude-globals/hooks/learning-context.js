#!/usr/bin/env node
/**
 * Generic SessionStart hook: surfaces relevant learning topics based on recent git changes.
 * Runs `git diff --name-only HEAD~5` and maps file paths to learning topics.
 *
 * Topic mappings are generic — project-specific versions can override in project .claude/settings.json.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Generic topic map — covers common web dev patterns
const TOPIC_MAP = [
  { pattern: /tailwind|css|style/i, topic: "tailwind/css" },
  { pattern: /token|theme|color/i, topic: "design-tokens" },
  { pattern: /drawer|sheet|modal|scroll/i, topic: "mobile-ux" },
  { pattern: /motion|animation|gsap|framer/i, topic: "animation" },
  { pattern: /next|route|middleware|redirect/i, topic: "nextjs" },
  { pattern: /supabase|auth|rls/i, topic: "supabase-auth" },
  { pattern: /context|provider|portal|hydrat/i, topic: "react-patterns" },
  { pattern: /store|zustand|redux|state/i, topic: "state-management" },
  { pattern: /test|spec|e2e|playwright/i, topic: "testing" },
  { pattern: /eslint|config|lint/i, topic: "tooling" },
  { pattern: /lazy|intersect|performance|bundle/i, topic: "performance" },
];

function main() {
  const cwd = process.cwd();
  const learningsDir = path.join(cwd, ".claude", "learnings");

  if (!fs.existsSync(learningsDir)) {
    return;
  }

  let changedFiles;
  try {
    changedFiles = execSync("git diff --name-only HEAD~5 2>nul || git diff --name-only HEAD 2>nul", {
      cwd,
      encoding: "utf-8",
      timeout: 5000,
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    changedFiles = [];
  }

  if (changedFiles.length === 0) return;

  // Map to topics
  const matchedTopics = new Set();
  for (const file of changedFiles) {
    for (const { pattern, topic } of TOPIC_MAP) {
      if (pattern.test(file)) matchedTopics.add(topic);
    }
  }

  if (matchedTopics.size === 0) return;

  // Find matching topic files
  const topicFiles = fs.readdirSync(learningsDir).filter((f) => f.endsWith(".md") && f !== "INDEX.md");
  const relevant = [];
  for (const topic of matchedTopics) {
    const match = topicFiles.find((f) => f.includes(topic.split("/")[0]));
    if (match) relevant.push(`.claude/learnings/${match}`);
  }

  if (relevant.length === 0) return;

  const context = `Recent changes touch these learning areas. Scan before debugging:\n${relevant.map((f) => `- ${f}`).join("\n")}\n\nFull index: .claude/learnings/INDEX.md`;
  console.log(JSON.stringify({ additionalContext: context }));
}

try {
  main();
} catch {
  process.exit(0);
}
