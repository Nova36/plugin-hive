# Meta Team Full Nightly Cycle Reference

> Reference document for the complete 8-phase nightly cycle. Extends the baseline
> cycle (S3) with all 5 agents, CronCreate scheduling, budget enforcement, interrupted
> cycle recovery, and state cleanup.

## Scheduling

### CronCreate Configuration

```
Expression: "3 3 * * *"     # 3:03 AM CST nightly
Mode: durable                # persists to .claude/scheduled_tasks.json
Re-registration: on each interactive session start (mitigates 7-day expiry)
```

### Re-Registration Protocol

CronCreate registrations may expire after 7 days without session activity. To
mitigate, re-register on every interactive Hive session start:

1. Check `.claude/scheduled_tasks.json` for meta-team entry
2. If missing or expired: re-register with same expression and durable mode
3. Log: "Meta Team cron re-registered: 3 3 * * *"

### Manual Trigger

The cycle can be triggered manually for testing:
- Invoke the meta-team-cycle workflow directly
- Same 8-phase sequence, same budget enforcement
- Useful for debugging after changes to the pipeline

## Complete Phase Sequence

### Phase 1: Boot (orchestrator)

Extends S3 baseline boot with:

- **Post-promotion monitoring:** compare current metrics against last cycle's baselines.
  If any metric drops >10% from baseline → auto-rollback most recent promotion:
  1. `git revert {promotion-commit-sha}`
  2. Write ledger entry with rollback evidence
  3. Re-queue target with `attempted_count` incremented
  4. Log: "Auto-rollback: {target} — {metric} degraded {percentage}%"

- **Stale worktree cleanup:** remove any `.claude/worktrees/meta-team-*` from crashed cycles
  ```
  git worktree list | grep meta-team | while read wt; do
    git worktree remove "$wt" --force 2>/dev/null
  done
  git branch --list 'meta-team/sandbox-*' | xargs -r git branch -D
  ```

- **Interrupted cycle detection:** if cycle-state shows non-idle phase:
  - Log: "Interrupted cycle: {cycle_id} at {phase}"
  - Clean up stale worktrees
  - Start fresh (full resumption deferred to post-v1)

### Phase 2: Analysis (researcher)

Three analysis passes merged into a single prioritized queue:

1. **Internal analysis** (S3): scan Hive file structure for improvement opportunities
2. **Memory targeting** (S7): scan memory ecosystem for patterns and trends
3. **External research** (S6): scan web sources for applicable methodologies

All findings written to queue.yaml with source attribution and priority scoring:
- Internal-recurring: priority 1
- Internal-one-off: priority 2
- Memory-pattern: priority 3
- External-research: priority 4

### Phase 3: Proposal (architect)

The architect reads the top N targets from the queue:
- Budget > 240 min remaining: N = 3
- Budget > 180 min remaining: N = 2
- Otherwise: N = 1

Each proposal includes:
```yaml
- id: "opt-{date}-{seq}"
  target_id: "target-{date}-{seq}"
  target: "hive/agents/researcher.md"
  type: "persona-edit"
  description: "Add explicit 15-min time budget for research phases"
  rationale: "Internal analysis + memory pattern: scope section lacks time constraint"
  expected_impact: "Reduce average research time from 48 min to ~15 min"
  rollback_plan: "Revert commit — original persona in baseline tag"
  change_spec: |
    Specific edit instructions for the developer...
```

### Phase 4: Implementation (developer)

For each proposal:
1. Create worktree: `git worktree add .claude/worktrees/meta-team-{id} -b meta-team/sandbox-{id}`
2. Implement changes per the architect's change_spec
3. Commit in worktree: `meta-team: {description} [opt-{id}]`
4. Do NOT expand scope beyond the proposal

### Phase 5: Testing (tester)

Per-worktree validation suite (details in meta-team-sandbox.md):
1. Destructiveness check (>50% content removal → fail)
2. Structural validation (YAML/markdown parsing)
3. Heuristic analysis (advisory flags for safety keywords, charter contradictions)
4. Metrics collection (lines added/removed, files modified)

### Phase 6: Evaluation (reviewer)

Independent evaluation — reviewer sees:
- Tester's metrics and notes
- The actual diff (`git diff main..worktree-branch`)
- Charter constraints

Reviewer does NOT see:
- Architect's rationale (prevents anchoring bias)

Three verdicts:
- **keep:** safe, well-scoped, measurably beneficial → Phase 7 promotes
- **discard:** fails tests, poorly scoped, or removes safety constraints → clean up
- **defer:** subjective/design change → save patch, tag needs-user-review

### Phase 7: Promotion (orchestrator)

Process verdicts:
- **Keep:** cherry-pick to main → `meta-team: {description} [opt-{id}]`
- **Defer:** save patch to `state/meta-team/deferred/{id}.patch` → update queue status
- **Discard:** log in ledger → clean up worktree

All worktrees cleaned up after processing (kept, discarded, and deferred).

### Phase 8: Close (orchestrator)

1. Write complete ledger entries for all proposals
2. Update queue (mark completed, discarded, deferred)
3. Ledger pruning: archive entries >30 cycles old to `state/meta-team/archive/`
4. Generate morning summary: `state/meta-team/summary-{date}.md`
5. Release cycle lock
6. Log completion stats

## Budget Enforcement

At every phase boundary:
```
elapsed = now - started_at (in minutes)
budget_remaining_min = budget_total_min - elapsed

if budget_remaining_min < 90:
  log "Budget low ({budget_remaining_min} min). Skipping to Phase 8."
  → Phase 8 (close)
```

Budget enforcement is checked BEFORE each phase begins. If the cycle enters
Phase 3 with 89 minutes remaining, it skips directly to Phase 8.

## State Cleanup

### Ledger Pruning (Phase 8)

If ledger entries span >30 cycles:
1. Identify entries older than 30 cycles
2. Move to `state/meta-team/archive/ledger-archive-{year-month}.yaml`
3. Active ledger retains only last 30 cycles

### Queue Cleanup (Phase 8)

- Completed targets: removed after 5 cycles
- Discarded targets: removed after 10 cycles (allows 5-cycle dedup window)
- `needs-user-review` targets: retained until user acts

### Worktree Cleanup (Phase 1 + Phase 7)

- Phase 1 boot: remove stale worktrees from crashed cycles
- Phase 7 end: remove all cycle worktrees (even on budget exit)

### Analysis-Cache Pruning (Phase 1)

- Remove findings where `ttl_expires < now`
- Internal: 3-day TTL, External: 7-day TTL, Memory: 5-day TTL

## Cycle Lifecycle

```
                    ┌─────────────────────────────────────────────┐
                    │           Budget Check at Each Phase        │
                    │         <90 min remaining → Phase 8         │
                    └─────────────────────────────────────────────┘

    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐
    │ Phase 1  │───→│ Phase 2  │───→│ Phase 3  │───→│   Phase 4    │
    │  Boot    │    │ Analysis │    │ Proposal │    │Implementation│
    │(orchestr)│    │(research)│    │(architect)│    │ (developer)  │
    └──────────┘    └──────────┘    └──────────┘    └──────────────┘
                                                           │
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────┴───────┐
    │ Phase 8  │←───│ Phase 7  │←───│ Phase 6  │←───│   Phase 5    │
    │  Close   │    │Promotion │    │Evaluation│    │   Testing    │
    │(orchestr)│    │(orchestr)│    │(reviewer)│    │  (tester)    │
    └──────────┘    └──────────┘    └──────────┘    └──────────────┘
         │
         └──→ cycle_state.phase = "idle", lock released
```

## Error Handling

- **Lock conflict:** abort cycle, log, exit
- **State file corruption:** log error, attempt continue with defaults
- **Agent spawn failure:** skip phase, log, advance (don't hang)
- **Budget exceeded:** skip to Phase 8 immediately
- **Cherry-pick conflict:** discard proposal, log, continue with others
- **Network timeout (external research):** skip source, continue cycle
