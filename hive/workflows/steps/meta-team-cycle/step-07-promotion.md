# Phase 7: Promotion

## MANDATORY EXECUTION RULES (READ FIRST)

- Do NOT promote changes that were discarded or deferred
- Do NOT leave orphaned worktrees — clean up ALL worktrees in every code path
- Create baseline tag before first promotion if not already created
- One commit per promoted change on main
- Check budget at phase start — skip to Phase 8 if <90 min remaining
- STUBBED in baseline cycle (S3) — log "Phase 7 skipped — baseline cycle" and advance

## EXECUTION PROTOCOLS

**Mode:** autonomous

The orchestrator cherry-picks kept changes to main, preserves deferred changes
as patch files, and cleans up all worktrees.

## CONTEXT BOUNDARIES

**Inputs available:**
- Verdicts from Phase 6 (keep/discard/defer per proposal)
- Worktrees from Phase 4 (with implemented changes)
- state/meta-team/cycle-state.yaml — baseline tag reference

**NOT available:**
- External state beyond the cycle's scope

## YOUR TASK

Promote kept changes, preserve deferred changes, discard rejected changes,
and clean up all worktrees.

## TASK SEQUENCE

1. **Ensure baseline tag exists**
   - If `baseline_tag` is null: `git tag meta-team/baseline-{today}`
   - Record in cycle-state.yaml

2. **Process kept changes (verdict: keep)**
   - For each kept proposal:
     a. Cherry-pick from worktree branch to main:
        `git cherry-pick {commit-sha}`
     b. Commit message format: `meta-team: {description} [opt-{id}]`
     c. Post-promotion verify: parse promoted files on main (structural check)
     d. On cherry-pick conflict: reject, log "merge conflict" in ledger, treat as discard

3. **Process deferred changes (verdict: defer)**
   - For each deferred proposal:
     a. Generate patch: `git diff main..meta-team/sandbox-{id} > state/meta-team/deferred/{id}.patch`
     b. Update queue entry: status → `needs-user-review`
     c. Clean up worktree

4. **Process discarded changes (verdict: discard)**
   - For each discarded proposal:
     a. Log discard reason in ledger
     b. Clean up worktree

5. **Clean up ALL worktrees**
   - For each worktree at `.claude/worktrees/meta-team-*`:
     a. `git worktree remove {path}`
     b. `git branch -D meta-team/sandbox-{id}`
   - Verify: no meta-team worktrees remain

## ROLLBACK PROTOCOL

If a promoted change needs rollback (detected in next cycle's boot):
- `git revert {specific-commit-sha}`
- Log revert in ledger with degradation evidence
- Re-queue target with `attempted_count` incremented
- Rollback is per-commit granularity (individual promotions revertible)

## PHASE TRANSITION

On success: advance to Phase 8 (Close).
On cleanup failure: log warning, advance to Phase 8 anyway (boot will retry cleanup).
