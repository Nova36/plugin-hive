# Meta Team Optimization Charter

> This charter is READ-ONLY during cycle execution. The Meta Team operates within
> these constraints but never modifies them. Only humans edit the charter between cycles.

## Mission

Continuously improve Hive's effectiveness by analyzing system performance, researching
AI trends, and applying targeted, non-destructive optimizations.

## Objectives

1. **Improve consistency and quality** of Hive agent outputs
2. **Reduce friction** in Hive workflows (fewer failed steps, faster completion)
3. **Stay current** with agentic AI methodologies and apply relevant patterns
4. **Reinforce what works well** — not just fix what's broken

## Constraints

1. **No destructive operations** — see Destructiveness Threshold below. Changes that
   remove >50% of a file's content or delete files entirely are prohibited.

2. **Sandbox validation required** — all changes are tested in an isolated git worktree
   before promotion to main. No change reaches main without passing structural validation,
   destructiveness checks, and heuristic analysis.

3. **Independent evaluation** — the proposing agent (architect) never evaluates its own
   change. The reviewer sees tester metrics and the diff, not the architect's rationale,
   to prevent anchoring bias.

4. **5-hour nightly budget** — the cycle exits cleanly if the budget is exceeded. If
   fewer than 90 minutes remain at any phase boundary, the cycle skips directly to the
   close phase. No partial work is left in-flight.

5. **Subjective improvements deferred** — changes involving design philosophy, style
   preferences, or aesthetic judgment are tagged `needs-user-review` and never
   auto-promoted. They appear in the morning summary for human decision.

## Scope

All Hive artifacts are in scope for optimization:

- Agent personas (`hive/agents/*.md`)
- Skill prompts (`hive/skills/`, plugin skills)
- Workflows and step files (`hive/workflows/`, `hive/workflows/steps/`)
- Quality gate policies (`hive/gate-policies/`, `hive/references/quality-gates.md`)
- Team configurations (`state/teams/`)
- Reference documents (`hive/references/`)

**Can create** new artifacts (new skills, new reference docs, new team configs).
**Cannot delete** existing artifacts. Deletion is always destructive.

## Destructiveness Threshold

A change is **destructive** if it meets either condition:

1. Removes **>50% of content** (by line count) from a single file
2. **Deletes a file** entirely

Enforcement is per-file granularity. A change that adds 100 lines and removes 10 from
the same file is non-destructive even if a different file in the same proposal loses 60%.

| Allowed | Not Allowed |
|---------|-------------|
| Edit a persona to sharpen instructions | Delete a persona file |
| Remove a redundant line from a workflow | Gut a workflow to rewrite from scratch |
| Add a new skill or team config | Clear all content from a reference file |
| Restructure a section for clarity | Remove an entire section without replacement |

## Budget Parameters

- **Window:** 5 hours (300 minutes) from cycle start
- **Phase-skip threshold:** <90 minutes remaining at any phase boundary triggers skip to close
- **Proposals per cycle:** 1-3, adjusted by remaining budget after analysis
- **Cron schedule:** `3 3 * * *` (3:03 AM CST nightly)
- **Cron mode:** durable (persists to `.claude/scheduled_tasks.json`)
- **Re-registration:** on each interactive session start to mitigate 7-day expiry

## Evaluation Rules

- **Pipeline:** researcher -> architect -> developer -> tester -> reviewer
- **Proposer != evaluator:** the architect proposes, the reviewer evaluates independently
- **Three verdicts:** keep (promote to main), discard (revert worktree), defer (needs-user-review)
- **Auto-rollback trigger:** if any objective metric drops >10% from baseline in the next
  cycle's boot phase, the most recent promotion is automatically reverted and re-queued
- **Rollback granularity:** per-commit (individual promotions can be reverted independently)

## Agent Pipeline

| Phase | Agent | Responsibility |
|-------|-------|----------------|
| 1. Boot | Orchestrator | Load state, acquire lock, prune caches, create baseline tag |
| 2. Analysis | Researcher | Scan internals + external sources + memory ecosystem |
| 3. Proposal | Architect | Read queue, produce structured proposals (1-3 per cycle) |
| 4. Implementation | Developer | Apply proposals in isolated worktrees |
| 5. Testing | Tester | Run sandbox validation suite per worktree |
| 6. Evaluation | Reviewer | Independent keep/discard/defer verdict per proposal |
| 7. Promotion | Orchestrator | Cherry-pick kept changes, save deferred patches, clean up |
| 8. Close | Orchestrator | Write ledger, update queue, generate summary, release lock |
