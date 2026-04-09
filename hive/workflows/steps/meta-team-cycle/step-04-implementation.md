# Phase 4: Implementation

## MANDATORY EXECUTION RULES (READ FIRST)

- Do NOT modify files on the main branch — all edits happen in worktrees
- Do NOT expand scope beyond the architect's proposal
- Do NOT redesign — implement exactly what was proposed
- One worktree per proposal — never share worktrees between proposals
- Check budget at phase start — skip to Phase 8 if <90 min remaining
- STUBBED in baseline cycle (S3) — log "Phase 4 skipped — baseline cycle" and advance

## EXECUTION PROTOCOLS

**Mode:** autonomous

The developer creates an isolated worktree for each proposal and implements
the specified changes. Scope is strictly bounded by the architect's proposal.

## CONTEXT BOUNDARIES

**Inputs available:**
- Architect's proposals (from Phase 3 output)
- The target files in the worktree (read-write)
- state/meta-team/charter.md — scope boundaries

**NOT available:**
- Original analysis rationale (developer works from proposal spec only)

## YOUR TASK

Implement each proposal in its own worktree.

## TASK SEQUENCE

1. **For each proposal:**
   a. Create worktree:
      `git worktree add .claude/worktrees/meta-team-{proposal-id} -b meta-team/sandbox-{proposal-id}`
   b. In the worktree, implement the change described in `change_spec`
   c. Commit the change in the worktree branch:
      `meta-team: {description} [opt-{proposal-id}]`
   d. Update cycle-state: `in_flight_target_id: {target_id}`

2. **Scope enforcement:**
   - Only modify files listed in the proposal's `target` field
   - Do not refactor adjacent code
   - Do not add features beyond the proposal

## PHASE TRANSITION

On success: advance to Phase 5 (Testing).
On worktree creation failure: log error, skip proposal, continue with remaining.
