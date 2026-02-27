#!/usr/bin/env node
/**
 * PreToolUse/PostToolUse hook for Task tool.
 * Tracks which model subagents are using so the statusline can display it.
 *
 * Usage:
 *   node task-model-tracker.js pre   — writes active subagent info to cache
 *   node task-model-tracker.js post  — decrements active count, clears when 0
 *
 * Cache file: ~/.claude/cache/active-subagent.json
 */

const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".claude",
  "cache",
  "active-subagent.json"
);

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return { count: 0, agents: [] };
  }
}

function writeCache(data) {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data), "utf-8");
}

async function main() {
  const phase = process.argv[2]; // "pre" or "post"

  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const toolInput = parsed.tool_input || {};
  const cache = readCache();

  if (phase === "pre") {
    const model = toolInput.model || "inherit";
    const agentType = toolInput.subagent_type || "unknown";
    const description = toolInput.description || "";

    cache.count = (cache.count || 0) + 1;
    cache.agents.push({ model, agentType, description, ts: Date.now() });

    // Keep only last 5 to prevent unbounded growth
    if (cache.agents.length > 5) {
      cache.agents = cache.agents.slice(-5);
    }

    writeCache(cache);
  } else if (phase === "post") {
    cache.count = Math.max(0, (cache.count || 0) - 1);

    if (cache.count === 0) {
      // All subagents done — clear
      try {
        fs.unlinkSync(CACHE_FILE);
      } catch {}
    } else {
      // Remove oldest entry
      cache.agents.shift();
      writeCache(cache);
    }
  }
}

main().catch(() => process.exit(0));
