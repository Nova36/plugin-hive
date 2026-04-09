# Phase 1: Boot

## MANDATORY EXECUTION RULES (READ FIRST)

- Do NOT proceed to Phase 2 if cycle lock cannot be acquired
- Do NOT skip stale lock detection — crashed cycles leave orphaned locks
- Do NOT proceed if charter.md is missing or unreadable

## EXECUTION PROTOCOLS

**Mode:** autonomous

Run all boot steps sequentially. Gate on lock acquisition failure.

## CONTEXT BOUNDARIES

**Inputs available:**
- state/meta-team/cycle-state.yaml — current cycle state and lock
- state/meta-team/ledger.yaml — previous optimization outcomes
- state/meta-team/queue.yaml — existing optimization targets
- state/meta-team/analysis-cache.yaml — cached findings
- state/meta-team/charter.md — operating constraints

**NOT available:**
- External web sources (Phase 2 extension, S6)
- Memory ecosystem data (Phase 2 extension, S7)

## YOUR TASK

Initialize the nightly cycle: acquire the lock, load state, clean up stale data,
and create a baseline tag for rollback safety.

## TASK SEQUENCE

1. **Acquire cycle lock**
   - Read cycle-state.yaml
   - If `cycle_lock.locked_by` is not null:
     - Compute lock age: `now - cycle_lock.locked_at`
     - If lock age > 6 hours: override (stale lock from crashed cycle), log warning
     - If lock age <= 6 hours: abort — another cycle is running
   - Write lock: `locked_by: nightly-{today}`, `locked_at: {now}`

2. **Load all state files**
   - Read ledger.yaml, queue.yaml, analysis-cache.yaml
   - Validate YAML parsing succeeds for each file
   - If any file is corrupted: log error, attempt to continue with defaults

3. **Prune expired analysis-cache entries**
   - For each finding in analysis-cache.yaml:
     - If `ttl_expires < now`: remove the finding
   - Write updated analysis-cache.yaml

4. **Detect interrupted cycle**
   - If cycle-state phase is not "idle" and not "close":
     - Previous cycle was interrupted
     - Log: "Interrupted cycle detected: {cycle_id} at phase {phase}"
     - For baseline cycle (S3): start fresh (no resumption logic yet)
     - Clean up any stale worktrees at `.claude/worktrees/meta-team-*`

5. **Create baseline tag**
   - `git tag meta-team/baseline-{today}` (if tag doesn't already exist)
   - Record tag name in cycle-state.yaml

6. **Initialize cycle state**
   - `cycle_id: nightly-{today}`
   - `phase: boot`
   - `started_at: {now}`
   - `budget_remaining_min: 300`
   - `interrupted: false`
   - `proposals_this_cycle: 0`

7. **Post-promotion monitoring** (S5 extension point)
   - Compare current metrics against last cycle's baselines
   - If any metric drops >10%: auto-rollback most recent promotion
   - (Not implemented in baseline cycle — no promotions to check)

## PHASE TRANSITION

On success: advance to Phase 2 (Analysis).
On lock conflict: abort cycle, log "Cycle aborted — lock held by {locked_by}".
On critical error: set `interrupted: true`, release lock, exit.

## BUDGET CHECK

```
elapsed = now - started_at (in minutes)
budget_remaining_min = budget_total_min - elapsed
if budget_remaining_min < 90:
  log "Budget low ({budget_remaining_min} min). Skipping to Phase 8 (close)."
  jump to Phase 8
```
