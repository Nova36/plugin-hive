# Step 8: Session End

## MANDATORY EXECUTION RULES (READ FIRST)

- Read this entire step file before taking any action
- Do NOT promote insights without evaluating them against the keep/discard criteria in `references/agent-memory-schema.md`
- Do NOT delete staged insights before evaluation — read first, then promote or discard
- Do NOT skip the session summary — the user needs to know what happened today
- For borderline insights, present to the user for a keep/discard decision — do NOT auto-discard

## EXECUTION PROTOCOLS

**Mode:** interactive (for borderline insight decisions), otherwise autonomous

Evaluate staged insights, promote or discard, clean up staging, produce session summary.

## CONTEXT BOUNDARIES

**Inputs available:**
- `state/insights/` — staged insight files from execution phase
- `~/.claude/hive/memories/` — existing agent memories (to check for duplicates)
- `references/agent-memory-schema.md` — keep/discard criteria, memory file format
- Episode markers from step 7 (stories completed, failed, blocked)
- Cycle state from step 7 (updated decisions and statuses)

**NOT available:**
- Story specs (no longer needed — execution is complete)
- External tracker live data (final ticket updates already done in step 7)

## YOUR TASK

Evaluate staged insights for promotion to agent memories, clean up staging, and produce a session summary covering the day's work.

## TASK SEQUENCE

### 1. Scan for staged insights
List all files under `state/insights/`. Insights are organized by `{epic-id}/{story-id}/` and follow the staged insight format:
- `type` — pattern, pitfall, override, codebase, process
- `agent` — which agent produced this
- `summary` — one-line description
- `detail` — full insight content
- `source_step` — which workflow step produced it

### 2. Evaluate each insight
For each staged insight, apply the criteria from `references/agent-memory-schema.md`:

**Keep criteria (promote):**
- Repeatable pattern that applies beyond this specific story
- Pitfall warning that would save future agents from the same mistake
- Override that corrects a previously promoted memory
- Codebase-specific understanding (naming conventions, architecture patterns, API quirks)
- Process improvement that changes how a workflow step should be executed

**Discard criteria:**
- One-time fix that will not recur
- Story-specific detail with no broader applicability
- Already captured in an existing memory (check for duplicates)
- Vague observation without actionable guidance

### 3. Check for duplicates
For each insight marked for promotion, check `~/.claude/hive/memories/{agent}/` for existing memories with similar descriptions. If a duplicate exists:
- If the new insight is more specific or corrects the old one: promote as an `override` type, note the superseded memory
- If the new insight adds nothing: discard

### 4. Promote kept insights
For each insight that passes evaluation, write a memory file to `~/.claude/hive/memories/{agent}/{slug}.md`:

```yaml
---
name: {slug}
description: {one-line summary}
type: {pattern | pitfall | override | codebase | process}
agent: {agent-name}
timestamp: {ISO 8601}
source_epic: {epic-id}
---

{Full detail of the insight. Written as actionable guidance for future sessions.}
```

The slug should be a kebab-case version of the summary (e.g., `api-rate-limit-retry-pattern`).

### 4b. Promote team-level insights

For insights that capture collective team patterns (handoff conventions, tooling quirks, process adjustments), promote to the team memory directory instead of the agent memory:

Write to `state/team-memories/{team-name}/{slug}.md`:

```yaml
---
name: {slug}
description: {one-line summary}
type: {convention | handoff-pattern | tooling | process}
team: {team-name}
timestamp: {ISO 8601}
source_epic: {epic-id}
---

{Detail of the team-level pattern.}
```

**Decision rule:** If one agent could have learned this alone → agent memory at `~/.claude/hive/memories/`. If it required multiple agents coordinating → team memory at `state/team-memories/`.

### 4c. Append to reference memories

If a new insight matches an existing reference memory's `topic` (keyword match on `topic` field):
- Append a new entry to the reference memory's `## Entries` section
- Add any new external sources to `## Sources`
- Update `last_updated` in the frontmatter
- Do NOT create a duplicate standalone memory

### 5. Handle borderline cases
For insights that do not clearly match keep or discard criteria:
- Present them to the user with the insight summary and a recommendation
- Ask: "Keep (promote to memory) or Discard?"
- Apply the user's decision

### 6. Clean up staging
After all insights have been promoted or discarded:
- Delete the processed insight files from `state/insights/{epic-id}/{story-id}/`
- Remove empty staging directories
- Do NOT delete `state/insights/` itself — other epics may have staged insights

### 7. Produce session summary
Compile a final summary for the user:

```
## Session Summary

### Stories Completed
- [{story-id}] {title} — {final status}

### Stories Failed
- [{story-id}] {title} — {failure reason}
  Action for next session: {retry | redesign | user decision needed}

### Stories Blocked
- [{story-id}] {title} — {blocker}
  Blocked since: {date}

### Insights Promoted ({count})
- [{agent}] {memory-name}: {one-line summary}

### Insights Discarded ({count})
- {summary} — reason: {discard reason}

### Tomorrow's Agenda
- Unfinished stories: {list}
- Blocked items needing resolution: {list}
- New work flagged during execution: {list if any}

### Cycle State Updates
- Decisions recorded: {count}
- Status transitions: {list of story status changes}
```

## SUCCESS METRICS

- [ ] All staged insights under `state/insights/` scanned
- [ ] Each insight evaluated against keep/discard criteria from agent-memory-schema
- [ ] Duplicate check performed against existing memories
- [ ] Promoted insights written to `~/.claude/hive/memories/{agent}/` with correct format
- [ ] Borderline cases presented to user for decision
- [ ] Staging directories cleaned up
- [ ] Session summary produced with all sections

## FAILURE MODES

- Promoting all insights without evaluation — memory bloat, irrelevant memories loaded in future sessions
- Discarding all insights without evaluation — valuable learnings lost, agents repeat mistakes
- Not checking for duplicate memories — redundant memories waste context window in future sessions
- Skipping the session summary — user does not know what to expect tomorrow
- Deleting `state/insights/` root directory — other epics lose their staged insights

## NEXT STEP

**Gating:** All insights evaluated. Staging cleaned up. Session summary presented to user.
**Next:** Session complete. No further steps in the daily ceremony workflow.
**If gating fails:** If insight files cannot be read, report the error and proceed with the session summary using available data. Do not leave the session without a summary.
