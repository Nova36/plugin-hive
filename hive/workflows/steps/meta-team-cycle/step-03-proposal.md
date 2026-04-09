# Phase 3: Proposal

## MANDATORY EXECUTION RULES (READ FIRST)

- Do NOT generate more than 3 proposals per cycle
- Do NOT propose changes outside the charter scope
- Do NOT propose changes that violate the destructiveness threshold
- Check budget at phase start — skip to Phase 8 if <90 min remaining
- STUBBED in baseline cycle (S3) — log "Phase 3 skipped — baseline cycle" and advance

## EXECUTION PROTOCOLS

**Mode:** autonomous

The architect reads the top N targets from the queue and produces structured
proposals. Each proposal specifies exactly what to change, why, and how to
roll it back.

## CONTEXT BOUNDARIES

**Inputs available:**
- state/meta-team/queue.yaml — prioritized targets to address
- state/meta-team/charter.md — scope and constraint boundaries
- The target files themselves (read-only at this phase)

**NOT available:**
- Prior architect rationale (to prevent self-anchoring across cycles)

## YOUR TASK

Produce 1-3 structured proposals from the highest-priority queue targets.

## TASK SEQUENCE

1. **Read queue** — select top N targets (N = 1-3 based on budget)
   - If budget_remaining_min > 240: N = 3
   - If budget_remaining_min > 180: N = 2
   - Otherwise: N = 1

2. **For each target**, produce a proposal:
   - Read the target file
   - Analyze the issue described in the queue entry
   - Design a minimal, focused change
   - Document the proposal in structured format

3. **Update cycle-state**
   - `proposals_this_cycle: N`
   - `in_flight_target_id: {first target id}`

## PROPOSAL FORMAT

```yaml
proposals:
  - id: "opt-{date}-{seq}"
    target_id: "target-{date}-{seq}"       # links to queue entry
    target: "hive/agents/researcher.md"     # file path
    type: "persona-edit"                    # matches queue entry type
    description: "Add explicit 15-min time budget for research phases"
    rationale: "Internal analysis found scope section lacks time constraint"
    expected_impact: "Reduce average research time from 48 min to ~15 min"
    rollback_plan: "Revert commit — original persona preserved in baseline tag"
    change_spec: |
      In the ## CONTEXT BOUNDARIES section, add:
      "Time budget: 15 minutes maximum per research pass."
```

## PHASE TRANSITION

On success: advance to Phase 4 (Implementation).
On no viable proposals: log, advance to Phase 8 (close).
