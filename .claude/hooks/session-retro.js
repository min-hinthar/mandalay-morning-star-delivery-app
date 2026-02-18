#!/usr/bin/env node
/**
 * SessionEnd hook: extracts error patterns from transcript and writes session summary.
 * Reads JSON from stdin: { session_id, transcript_path }
 * Writes to .claude/session-logs/YYYY-MM-DD.md
 */

const fs = require("fs");
const path = require("path");

const ERROR_PATTERNS = [
  /TS\d{4}/g, // TypeScript errors
  /Cannot find module/g,
  /PGRST\d{3}/g, // PostgREST errors
  /Module not found/g,
  /TypeError:/g,
  /ReferenceError:/g,
  /hydration/gi,
  /NEXT_REDIRECT/g,
  /permission denied/gi,
  /RLS/g,
];

async function main() {
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

  const transcriptPath = parsed.transcript_path;
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  let transcript;
  try {
    transcript = fs.readFileSync(transcriptPath, "utf-8");
  } catch {
    process.exit(0);
  }

  // Extract error patterns with counts
  const counts = new Map();
  for (const pattern of ERROR_PATTERNS) {
    const matches = transcript.match(pattern);
    if (matches) {
      for (const m of matches) {
        counts.set(m, (counts.get(m) || 0) + 1);
      }
    }
  }

  // Extract files touched (from tool calls mentioning file paths)
  const fileMatches = transcript.match(/src\/[^\s"'`,)}\]]+\.\w+/g);
  const uniqueFiles = fileMatches ? [...new Set(fileMatches)].slice(0, 20) : [];

  // Determine topics touched based on file paths
  const topicMap = {
    "tokens.css": "tailwind-v4, design-tokens",
    "globals.css": "tailwind-v4",
    tailwind: "tailwind-v4",
    "use-body-scroll": "mobile-ux",
    drawer: "mobile-ux",
    "bottom-sheet": "mobile-ux",
    modal: "react-patterns",
    portal: "react-patterns",
    context: "react-patterns",
    "framer-motion": "animation",
    motion: "animation",
    gsap: "animation",
    "next.config": "nextjs",
    "route.ts": "nextjs",
    supabase: "supabase-auth",
    auth: "supabase-auth",
    e2e: "testing",
    test: "testing",
    playwright: "testing",
    eslint: "tooling",
    "package.json": "tooling",
    cart: "state-management",
    store: "state-management",
    lazy: "performance",
    intersection: "performance",
  };

  const topicsHit = new Set();
  const allText = [...uniqueFiles, transcript.slice(0, 5000)].join(" ").toLowerCase();
  for (const [keyword, topic] of Object.entries(topicMap)) {
    if (allText.includes(keyword.toLowerCase())) {
      topic.split(", ").forEach((t) => topicsHit.add(t));
    }
  }

  // Skip if nothing interesting
  if (counts.size === 0 && uniqueFiles.length === 0) {
    process.exit(0);
  }

  // Write session log
  const projectRoot = path.resolve(__dirname, "..");
  const logDir = path.join(projectRoot, "session-logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const today = new Date().toISOString().slice(0, 10);
  const logFile = path.join(logDir, `${today}.md`);
  const sessionId = parsed.session_id || "unknown";

  const lines = [
    `## Session ${sessionId.slice(0, 8)} — ${new Date().toISOString().slice(11, 16)}`,
    "",
  ];

  if (counts.size > 0) {
    lines.push("### Errors");
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [pattern, count] of sorted.slice(0, 10)) {
      lines.push(`- ${pattern}: ${count}x`);
    }
    lines.push("");
  }

  if (topicsHit.size > 0) {
    lines.push(`**Topics:** ${[...topicsHit].join(", ")}`);
    lines.push("");
  }

  if (uniqueFiles.length > 0) {
    lines.push("### Files touched");
    for (const f of uniqueFiles.slice(0, 10)) {
      lines.push(`- ${f}`);
    }
    lines.push("");
  }

  lines.push("---\n");

  // Append to daily log
  fs.appendFileSync(logFile, lines.join("\n"), "utf-8");
}

main().catch(() => process.exit(0));
