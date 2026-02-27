# Claude Code on Windows (MINGW64)

## StatusLine: PowerShell Too Slow — Use Node.js

**Context:** Custom `statusLine` command in `~/.claude/settings.json` pointed to a PowerShell `.ps1` script. Status line never displayed — no error, just blank.

**Learning:** PowerShell startup on Windows takes ~500ms (`-NoProfile` helps but not enough). Claude Code's statusLine has a tight execution timeout. The script never finishes in time, so nothing displays.

| Runner | Startup | With git ops | Result |
|--------|---------|-------------|--------|
| PowerShell | ~485ms | ~805ms | Times out, blank |
| Node.js (.mjs) | ~130ms | ~200ms | Works |
| Bash | ~150ms | ~250ms | Works |

**Fix:** Rewrote `statusline-command.ps1` as `statusline-command.mjs` (ES module with top-level await for stdin). Updated settings:
```json
"statusLine": {
  "type": "command",
  "command": "node C:/Users/minkk/.claude/statusline-command.mjs"
}
```

**Secondary issue:** PowerShell's `ConvertFrom-Json` chokes on Windows backslash paths (`\U`, `\G` are invalid JSON escapes). Node.js `JSON.parse` handles properly-escaped `\\` from Claude Code's `JSON.stringify` natively — no workarounds needed.

**Testing pitfall:** Piping JSON through MINGW64 bash (heredoc, printf, echo) mangles backslashes at multiple levels. To test statusLine scripts, generate JSON with Node.js (`node -e "process.stdout.write(JSON.stringify(...))"`) or use forward-slash paths.

**Apply when:** Setting up statusLine on Windows. Always use Node.js or bash, never PowerShell.

---

## StatusLine: execSync + Directory Scans Cause Freeze Storms

**Context:** Sessions froze repeatedly during parallel tool calls. 8 GB free RAM — not a memory issue. Root cause: statusline script ran on every tool call with expensive operations.

**Per-call cost (before fix):**
1. Spawn `node` (~100ms)
2. `execSync('git rev-parse --abbrev-ref HEAD')` (~92ms) — spawns shell subprocess
3. `execSync('git status --porcelain')` (~163ms) — spawns shell subprocess
4. `readdirSync` + `statSync` on `~/.claude/todos/` — **434 stat syscalls** from accumulated stale files

During 3 parallel tool calls: 3 node processes × (2 git subprocesses + 434 stat calls) = **12 processes + 1,302 stat syscalls** competing for I/O on MINGW.

**Fix applied (2026-02-25):**
- Replaced `execSync('git rev-parse')` with direct `.git/HEAD` file read (zero subprocess cost)
- Removed `execSync('git status --porcelain')` entirely (lost clean/dirty indicator, kept branch)
- Removed `readdirSync`/`statSync` todos scan entirely
- Result: ~188ms per call (node startup + file reads only), zero subprocesses

| | Before | After |
|---|---|---|
| Time per call | ~264ms | ~188ms |
| Subprocesses spawned | 2 (git) | 0 |
| Filesystem stat calls | 434+ | 1 (.git/HEAD) |
| During 3 parallel calls | ~12 processes | ~3 processes |

**Prevention — `~/.claude/todos/` accumulates forever:**
- Claude Code creates a JSON file per subagent session, never cleans them up
- After 260+ plans across 4 milestones: 434 files
- Periodic cleanup needed: `rm -f ~/.claude/todos/*.json`
- Also clean stale caches: `rm -f ~/.claude/cache/active-subagent.json`

**StatusLine design rules for MINGW64:**
1. **Never use `execSync`** — each spawns a full shell on Windows. Read files directly instead.
2. **Never scan directories** — `readdirSync` + `statSync` scales with accumulated file count.
3. **Keep total I/O to ≤3 file reads** — node startup is the floor (~100ms), every additional file read adds ~10-20ms.
4. **Test with parallel calls:** `for i in 1 2 3; do (echo '{}' | node statusline-command.mjs &); done`

**Apply when:** Statusline script changes or session freezes during rapid tool execution with RAM available.

**Supersedes:** Timing table in "StatusLine: PowerShell Too Slow" — Node.js entry updated from ~200ms to ~188ms after removing execSync.

---

## Node.js via npx Confirms Bun Stdio Deadlock (2026-02-25)

**Context:** After removing all local GSD patches and confirming freezes persist on clean install during plan mode/subagent spawning, tested `npx @anthropic-ai/claude-code` which runs on Node.js instead of Bun.

**Result:** Plan mode works without freezes on Node.js version. This definitively confirms the root cause is Bun's Windows child process stdio deadlock, not local patches, MCP servers, OneDrive, or RAM.

**Daily driver switch:** Using `npx @anthropic-ai/claude-code` via `cc` alias instead of native `claude` command. Trade-off: +300 MB RAM but eliminates stdio deadlock entirely.

**Apply when:** Any Windows freeze during subagent/Task tool use. Switch to npx Node.js version.

---

## Cowork: "sdk-daemon not connected" and "already running" Errors (2026-02-26)

**Context:** Claude Desktop Cowork sessions on Windows throw "sdk-daemon not connected" during plan mode, and "already running" on follow-up messages. These are **Cowork VM issues**, not Claude Code CLI bugs.

**Architecture:** Cowork runs Claude Code inside a lightweight Hyper-V VM. The "sdk-daemon" is the bridge process between the VM and the host Claude Desktop app, communicating over a socket. When the socket drops, the session loses its host connection.

**"sdk-daemon not connected" — three root causes:**
1. **Ghost NAT / wrong HNS network type** — VM creates ICS-type network instead of NAT, blocking WinNAT. **Fixed in Claude Desktop v1.1.4328** ([#28668](https://github.com/anthropics/claude-code/issues/28668))
2. **Race condition during MCP init** — Cowork connects ~15 SDK-type MCP servers simultaneously; sdk-daemon socket drops ~4 seconds after spawn ([#25876](https://github.com/anthropics/claude-code/issues/25876))
3. **DNS misconfiguration** — VM gets wrong DNS server, can route locally but not to `api.anthropic.com` ([#25308](https://github.com/anthropics/claude-code/issues/25308))

**"already running" — root cause:** Cowork's VM process manager thinks a named process (e.g. `"clever-keen-darwin"`) is still running from a previous task. Follow-up messages try to spawn with the same name → RPC rejection ([#25707](https://github.com/anthropics/claude-code/issues/25707))

**Fixes:**
1. Update Claude Desktop to v1.1.4328+ (fixes networking/ghost NAT)
2. Kill stale VMs: Task Manager → end `vmwp.exe` / `vmcompute` processes
3. Restart Claude Desktop (clears "already running" process registry)
4. Check Hyper-V health: `Get-VMSwitch` in admin PowerShell — remove leftover ICS-type switches

**Diagnostic commands:**
```powershell
tasklist /FI "IMAGENAME eq vmwp.exe"
Get-VMSwitch | Format-Table Name, SwitchType, NetAdapterInterfaceDescription
```

**If update doesn't fix sdk-daemon drops:** The MCP init race condition is still an open upstream bug. Workaround: restart the Cowork session entirely (not just a new message).

**Apply when:** Cowork sessions throw connection or process errors on Windows.

---

## WSL2/Vmmem Drains RAM Even Without Distros (2026-02-26)

**Context:** Claude CLI sessions freezing, `Vmmem` process consuming 1-2+ GB. System had 16 GB total, ~5 GB free. User had no Linux distros installed and didn't use WSL.

**Learning:** Enabling WSL2/VirtualMachinePlatform Windows features starts a Hyper-V lightweight VM (`vmmem`) even with zero distros installed. Three processes run for nothing:
- `vmmem` — 1-2+ GB and grows over time (no `.wslconfig` = up to 80% of RAM)
- `vmcompute.exe` — ~9 MB
- `wslservice.exe` — ~9 MB

**Diagnostic:** `tasklist | grep -i "vmmem\|vmcompute\|wsl"` + `wsl -l -v` (shows "no installed distributions")

**Fix (if not using WSL/Docker):** Disable features in Admin PowerShell, then restart:
```powershell
dism.exe /online /disable-feature /featurename:Microsoft-Windows-Subsystem-Linux /norestart
dism.exe /online /disable-feature /featurename:VirtualMachinePlatform /norestart
```

**Note:** Git Bash (MINGW64) is NOT WSL — it's a native Windows port. Claude CLI runs on Node.js via Git Bash, no Linux dependency.

**Apply when:** Windows system low on RAM, or `Vmmem` appears in Task Manager without active WSL/Docker use.

---

## Zombie Node Cleanup Must Be Cowork-Safe (2026-02-26)

**Context:** Pre-session cleanup hook killed Node processes by age alone (>2h). This would kill Cowork sessions running in other terminals.

**Learning:** A naive age-based kill of `node.exe` processes breaks Cowork. Use a two-pass approach:

1. **Pass 1 — Discover live CLI sessions:** Find all `node.exe` with `claude-code` or `cli.js` in command line → these are live sessions (including Cowork)
2. **Pass 2 — Kill only true orphans:** Skip CLI PIDs and any process whose `ParentProcessId` matches a live CLI PID. Only kill remaining processes older than threshold.

**Key WMIC query:** `wmic process where "name='node.exe'" get ProcessId,ParentProcessId,CommandLine,CreationDate /FORMAT:CSV`

**CSV column order:** Node, CommandLine, CreationDate, ParentProcessId, ProcessId (5 columns, 0-indexed)

**Apply when:** Writing cleanup hooks that kill Node processes on Windows where Cowork may be running.

---

## Cowork Prerequisites: WSL 2 + Docker Setup on Windows (2026-02-27)

**Context:** Setting up Claude Cowork on Windows 11 Home. Needed WSL 2 + Docker Desktop.

**Learning — Hyper-V feature name doesn't exist on Home/ARM editions:**
`dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V-All` fails with `Error: 0x800f080c Feature name Microsoft-Hyper-V-All is unknown`. This is expected on Windows 11 Home — the full Hyper-V management features are Pro/Enterprise only. **WSL 2 only needs `VirtualMachinePlatform`**, not Hyper-V.

**Check what's already enabled:**
```bash
systeminfo.exe | grep -i "Hyper-V"
# "A hypervisor has been detected" = VirtualMachinePlatform is active ✓
wsl --status  # Shows default version
wsl --list --verbose  # Shows installed distros
```

**Minimal setup (if VirtualMachinePlatform already active):**
1. `wsl --install -d Ubuntu` — downloads + provisions (~3-5 min)
2. Install Docker Desktop — enable "WSL 2 based engine" (default)
3. **Restart terminal** — Docker CLI not on PATH until new shell session

**Docker PATH gotcha:** Docker Desktop installs to `C:\Program Files\Docker\Docker\resources\bin\docker.exe` but doesn't update PATH for already-running terminals. Verify with direct path if `docker` not found:
```powershell
& 'C:\Program Files\Docker\Docker\resources\bin\docker.exe' --version
```

**Supersedes:** Partially updates "WSL2/Vmmem Drains RAM" entry — that covers the *disable* path; this covers the *enable* path for Cowork setup.

**Apply when:** Setting up Cowork on Windows for the first time, or helping with WSL/Docker prerequisites.
