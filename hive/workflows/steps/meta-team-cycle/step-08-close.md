# Phase 8: Close

## MANDATORY EXECUTION RULES (READ FIRST)

- Do NOT skip ledger writes — every proposal must have a ledger entry
- Do NOT leave the cycle lock held — always release on exit
- Do NOT leave cycle-state in a non-idle phase
- This phase always runs, even on early budget exit

## EXECUTION PROTOCOLS

**Mode:** autonomous

Finalize the cycle: write all state, generate the morning summary, release
the lock, and exit cleanly.

## CONTEXT BOUNDARIES

**Inputs available:**
- All state/meta-team/ files
- Verdicts and metrics from Phases 5-7 (if they ran)
- Cycle timing data

**NOT available:**
- External state beyond this cycle's scope

## YOUR TASK

Persist all cycle results, generate the morning summary, and cleanly shut down.

## TASK SEQUENCE

1. **Write ledger entries**
   - For each proposal processed this cycle:
     - Write a complete ledger entry with all schema fields
     - Include metrics_before and metrics_after where available
     - Record verdict, promoted status, commit SHA (if promoted), reason (if discarded/deferred)
   - In baseline cycle (S3): no proposals → no ledger entries to write

2. **Update queue**
   - Mark completed targets as `status: completed`
   - Mark discarded targets as `status: discarded`
   - Mark deferred targets as `status: needs-user-review`
   - Remove stale entries (completed/discarded older than 10 cycles)

3. **Ledger pruning** (S5 extension)
   - If ledger entries span >30 cycles:
     - Archive old entries to `state/meta-team/archive/ledger-archive-{year-month}.yaml`
     - Keep only last 30 cycles in active ledger

4. **Generate morning summary** (S8 extension)
   - Write `state/meta-team/summary-{date}.md`
   - Sections: cycle summary, kept, discarded, deferred
   - In baseline cycle (S3): minimal summary (targets identified, zero modifications)

5. **Update cycle-state**
   - `phase: idle`
   - `interrupted: false`
   - `in_flight_target_id: null`
   - Update `budget_remaining_min` with final value

6. **Release cycle lock**
   - `cycle_lock.locked_by: null`
   - `cycle_lock.locked_at: null`

7. **Log completion**
   - "Cycle {cycle_id} complete. {N} targets identified. {K} kept, {D} discarded, {F} deferred."
   - In baseline cycle: "Baseline cycle complete. {N} targets identified. Zero modifications."

## PHASE TRANSITION

This is the final phase. Cycle is complete. Exit cleanly.

## ERROR HANDLING

If any close step fails:
- Continue with remaining steps (don't abort close on partial failure)
- Always release the lock (even if other steps fail)
- Set `interrupted: false` (close phase ran, even if imperfectly)
- Log the error for next cycle's boot to detect
