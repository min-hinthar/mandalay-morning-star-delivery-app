#!/usr/bin/env node
// Pre-session cleanup: trims old conversations and warns about zombie processes
// Run manually or hook into SessionStart for periodic maintenance

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const KEEP_SESSIONS = 20;
const PROJECTS_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'projects');

// 1. Kill orphaned node.exe processes (MCP servers, subagents) from dead sessions
//    Safe for Cowork: protects all live Claude CLI sessions and their children
try {
  const wmicOutput = execSync(
    'wmic process where "name=\'node.exe\'" get ProcessId,ParentProcessId,CommandLine,CreationDate //FORMAT:CSV 2>NUL',
    { encoding: 'utf-8', timeout: 8000 }
  );

  const now = Date.now();
  const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

  const lines = wmicOutput.trim().split('\n').filter(l => l.includes(','));

  // First pass: find all live Claude CLI PIDs (these are sessions — including Cowork)
  const cliPids = new Set();
  cliPids.add(process.pid);
  cliPids.add(process.ppid);

  for (const line of lines) {
    const parts = line.trim().split(',');
    if (parts.length < 5) continue;
    const cmdLine = parts[1] || '';
    const pid = parseInt(parts[4], 10);
    if (isNaN(pid)) continue;

    if (cmdLine.includes('claude-code') || cmdLine.includes('cli.js')) {
      cliPids.add(pid);
    }
  }

  // Second pass: kill old node processes whose parent is NOT a live CLI session
  let killed = 0;
  for (const line of lines) {
    const parts = line.trim().split(',');
    if (parts.length < 5) continue;

    const creationDate = parts[2] || '';
    const parentPid = parseInt(parts[3], 10);
    const pid = parseInt(parts[4], 10);
    if (isNaN(pid)) continue;

    // Skip all Claude CLI processes themselves
    if (cliPids.has(pid)) continue;

    // Skip children of any live CLI session (their MCP servers, subagents)
    if (cliPids.has(parentPid)) continue;

    // Parse WMIC date: 20260226143022.123456+060
    const match = creationDate.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (!match) continue;

    const created = new Date(
      parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]),
      parseInt(match[4]), parseInt(match[5]), parseInt(match[6])
    ).getTime();

    if (now - created > MAX_AGE_MS) {
      try {
        execSync(`taskkill //F //PID ${pid} 2>NUL`, { timeout: 3000 });
        killed++;
      } catch {
        // process already gone or access denied
      }
    }
  }

  if (killed > 0) {
    console.log(`Killed ${killed} orphaned node.exe process${killed > 1 ? 'es' : ''} (>2h old, no live parent)`);
  }
} catch {
  // wmic/taskkill not available or timed out — skip
}

// 2. Clean stale todo files (subagent leftovers — accumulate to 400+ and cause statusline I/O storms)
const todosDir = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'todos');
try {
  if (fs.existsSync(todosDir)) {
    const files = fs.readdirSync(todosDir).filter(f => f.endsWith('.json'));
    if (files.length > 0) {
      for (const f of files) fs.unlinkSync(path.join(todosDir, f));
      console.log(`Cleaned ${files.length} stale todo files`);
    }
  }
} catch {
  // ignore cleanup errors
}

// 3. Clean stale subagent cache
try {
  const subagentCache = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'cache', 'active-subagent.json');
  if (fs.existsSync(subagentCache)) fs.unlinkSync(subagentCache);
} catch {
  // ignore
}

// 4. Clean stale task dirs
const tasksDir = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'tasks');
try {
  if (fs.existsSync(tasksDir)) {
    const entries = fs.readdirSync(tasksDir);
    for (const entry of entries) {
      const fullPath = path.join(tasksDir, entry);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
} catch {
  // ignore cleanup errors
}

// 5. Trim old conversations per project (keep newest KEEP_SESSIONS)
try {
  if (fs.existsSync(PROJECTS_DIR)) {
    const projects = fs.readdirSync(PROJECTS_DIR);
    for (const project of projects) {
      const projectDir = path.join(PROJECTS_DIR, project);
      if (!fs.statSync(projectDir).isDirectory()) continue;

      const subdirs = fs.readdirSync(projectDir)
        .filter(d => {
          const full = path.join(projectDir, d);
          return fs.statSync(full).isDirectory() && d !== 'memory';
        })
        .map(d => ({
          name: d,
          mtime: fs.statSync(path.join(projectDir, d)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime); // newest first

      if (subdirs.length > KEEP_SESSIONS) {
        const toDelete = subdirs.slice(KEEP_SESSIONS);
        for (const dir of toDelete) {
          fs.rmSync(path.join(projectDir, dir.name), { recursive: true, force: true });
        }
        if (toDelete.length > 0) {
          console.log(`Cleaned ${toDelete.length} old sessions from ${project}`);
        }
      }
    }
  }
} catch (err) {
  console.error('Session cleanup error:', err.message);
}
