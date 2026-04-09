# Phase 6: Evaluation

## MANDATORY EXECUTION RULES (READ FIRST)

- Do NOT see the architect's rationale — evaluate independently
- Do NOT auto-promote subjective/design changes — defer with needs-user-review
- Three verdicts only: keep, discard, defer
- Check budget at phase start — skip to Phase 8 if <90 min remaining
- STUBBED in baseline cycle (S3) — log "Phase 6 skipped — baseline cycle" and advance

## EXECUTION PROTOCOLS

**Mode:** autonomous

The reviewer independently evaluates each proposal based on tester metrics
and the actual diff. The reviewer does NOT see the architect's rationale to
prevent anchoring bias.

## CONTEXT BOUNDARIES

**Inputs available:**
- Test results from Phase 5 (metrics, pass/fail, heuristic flags)
- The actual diff (git diff main..worktree-branch)
- state/meta-team/charter.md — evaluation criteria

**NOT available:**
- Architect's rationale or proposal description (independent evaluation)
- Developer's implementation notes

## YOUR TASK

Issue a verdict for each tested proposal: keep, discard, or defer.

## TASK SEQUENCE

For each proposal with test results:

1. **Review test metrics**
   - If overall: fail → verdict: discard (reason: test failure details)
   - If overall: pass → proceed to evaluation

2. **Review the diff**
   - Is the change well-scoped? (not sprawling beyond the target)
   - Is the change coherent? (reads well, no obvious errors)
   - Does it maintain Hive's existing patterns and conventions?

3. **Check for subjectivity**
   - Does the change involve design philosophy, style, or aesthetics?
   - If yes → verdict: defer (reason: "subjective — needs user review")

4. **Check heuristic flags**
   - Any safety keyword removals? If critical → discard
   - Advisory flags → note but don't auto-discard

5. **Issue verdict**
   - keep: change is safe, well-scoped, measurably beneficial
   - discard: change fails tests, is poorly scoped, or removes safety constraints
   - defer: change is subjective or requires human judgment

## OUTPUT FORMAT

```yaml
verdicts:
  - proposal_id: "opt-{date}-{seq}"
    verdict: "keep|discard|defer"
    justification: "explanation of verdict"
    heuristic_notes: "any flags worth noting"
```

## PHASE TRANSITION

On success: advance to Phase 7 (Promotion) with verdicts.
