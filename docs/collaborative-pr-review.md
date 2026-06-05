# Collaborative PR Review (cross-session)

> How Claude sessions co-develop this repo as a team of reviewers. The unit of
> work is a **reviewed PR**, and review state is **shared through GitHub**, not
> through any one session's memory. Every session picks this up automatically.

## Why

This repo is built across many short-lived Claude sessions (web/CI/desktop). A
session ends and its context is gone — but the PRs it opened keep living. So the
PR thread, its review comments, and the registry below are the durable shared
brain. Treat another session's PR exactly like a colleague's: review it, leave
precise findings, and pick up where they left off.

## The PR registry

[`docs/open-prs.md`](./open-prs.md) is the living index of every open PR — stack
order, owning branch, CI state, and outstanding review findings with severity.

- **Opening a PR?** Add a row.
- **Reviewing / fixing?** Update its findings + status.
- **Merged / closed?** Move it to the "Recently closed" section.

Keep it current in the same commit that changes the PR's state where practical;
otherwise update it as a tiny follow-up. It is the first thing a new session
reads to know what's in flight.

## Session-start protocol

At the start of any session that touches code, reconcile in-flight work:

1. **List open PRs** — `mcp__github__list_pull_requests` (or read `open-prs.md`).
2. **For each, check state** — CI via `pull_request_read(get_check_runs)`, and
   unresolved threads via `pull_request_read(get_review_comments)`.
3. **Subscribe** to any PR you'll watch — `subscribe_pr_activity`. This streams
   review comments, CI failures, and reviews back into the session.
4. **Reconcile the registry** — fix any drift in `open-prs.md`.

## Review protocol

For every non-trivial PR (and **always** for auth / payments / RLS / money /
migrations):

- **Read the diff against its real base** (mind the stack — PRs here often stack:
  base may be another `claude/*` branch, not `main`). Pull large diffs locally
  (`git fetch origin <branch>`) rather than truncating.
- **Adversarial pass** — spawn a review subagent or run `/code-review` /
  `/security-review`. Verify claims against the code (read the component, the
  token, the helper) instead of trusting the PR description.
- **Post findings as a PR review** — `pull_request_review_write` with
  `event: COMMENT` (non-blocking) so the author isn't gated. Tag each finding
  **High / Med / Low**, lead with what's solid, and end with a clear verdict
  (merge-safe vs. fix-first). Be specific enough to act on without scrollback.
- **Be frugal** — one structured review beats a stream of comments. Re-review
  only when the author pushes changes; confirm which findings are resolved.

## Tracking changes (closing the webhook gaps)

`subscribe_pr_activity` delivers **review comments, CI failures, and reviews**.
It does **not** deliver **CI success, new pushes, or merge-conflict
transitions**. So a subscription alone isn't enough:

- Re-check a watched PR's `get_check_runs` + `get` (head SHA / `mergeable_state`)
  on a timer. If `send_later` (claude-code-remote) is available, schedule a
  ~1-hour self check-in and re-arm it silently when nothing changed. If not,
  a persistent `Monitor` polling `git ls-remote` for tracked-branch SHA changes
  fills the "new push" gap within a session.
- A subscription is **done only when the PR is merged or closed** (or the user
  says stop → `unsubscribe_pr_activity`).

## Acting on findings (yours or a reviewer's)

- **Confident + small + in-scope** → push the fix to the PR branch, update
  `open-prs.md`, and note resolution. Don't narrate every round.
- **Ambiguous / architectural** → ask via `AskUserQuestion` before acting.
- **No action needed / duplicate** → skip silently.
- **CI red on a blocking job** is the task, not noise: diagnose from
  `get_job_logs`, fix, re-kick. Never merge around a red `verify` / `db-drift`.

## Handoff

When work spans sessions, the PR + its review thread + the registry row are the
handoff. Don't push competing commits to a branch another session owns
mid-iteration unless you're deliberately taking it over — say so in a comment.
