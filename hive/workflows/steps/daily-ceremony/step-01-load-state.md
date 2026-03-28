# Step 1: Load State

## MANDATORY EXECUTION RULES (READ FIRST)

- Read this entire step file before taking any action
- Do NOT skip any state source — episodes, cycle state, and task tracker are ALL required for accurate reconstruction
- Do NOT assume state from memory or prior conversation — this is a fresh session, read from disk
- Do NOT proceed to standup presentation until all state sources have been read
- If a state directory does not exist, record it as empty — do NOT treat missing directories as errors

## EXECUTION PROTOCOLS

**Mode:** autonomous

Execute all reads in order. Compile findings into a state reconstruction report. No user interaction required.

## CONTEXT BOUNDARIES

**Inputs available:**
- `state/episodes/` — status marker YAML files organized by epic/story/step
- `state/cycle-state/` — accumulated decisions, blocked items, Linear ticket mappings
- `hive.config.yaml` — task_tracking.adapter field determines if external tracker is configured
- Active epic IDs from `state/epics/` directory listing

**NOT available:**
- Agent memories (loaded in step 2)
- Cross-cutting concerns (loaded in step 2)
- User input (not needed until step 4)

## YOUR TASK

Reconstruct the orchestrator's working context from all persistent state sources so the standup can present an accurate picture of where things stand.

## TASK SEQUENCE

### 1. Identify active epics
List directories under `state/epics/`. For each epic directory, read `epic.yaml` to get the epic ID, title, and story list. Record which epics have active (non-completed) stories.

### 2. Read episode status markers
For each active epic, read all status marker files under `state/episodes/{epic-id}/`. Follow the episode schema:
- Each marker has `step_id`, `story_id`, `epic_id`, `agent`, `status`, `timestamp`
- Status values: `completed`, `in_progress`, `failed`, `skipped`
- Group markers by story to determine each story's current phase and status
- Pay special attention to `failed` and `in_progress` markers — these indicate work that needs continuation or retry

### 3. Read cycle state
For each active epic, read `state/cycle-state/{epic-id}.yaml`. Extract:
- `decisions` — accumulated decisions with phase, key, value, rationale
- Story-level status overrides (blocked, failed)
- `linear` ticket mappings (if present)
- `constraints` and `scope_boundaries` (if present)

### 4. Check task tracker configuration
Read `hive.config.yaml` and check `task_tracking.adapter`:
- If `null` or missing: local mode only, skip external tracker queries
- If `linear`: note that Linear integration is active, record any ticket IDs from cycle state for cross-reference

### 5. Identify failed and blocked stories
Cross-reference episodes and cycle state to build a list of:
- **Failed stories:** have a `failed` episode marker, need retry or user decision
- **Blocked stories:** marked `blocked` in cycle state, need dependency resolution or user input
- **In-progress stories:** have `in_progress` markers but no completion, may need continuation

### 6. Compile state reconstruction report
Produce a structured report with the following sections:

```
## State Reconstruction Report

### Active Epics
- {epic-id}: {title} — {N} stories ({M} completed, {K} remaining)

### Story Status Summary
| Story ID | Epic | Status | Current Phase | Last Updated |
|----------|------|--------|---------------|--------------|
| {id}     | {ep} | {status} | {phase}     | {timestamp}  |

### Failed Stories (need attention)
- {story-id}: {failure reason from episode conclusions}

### Blocked Stories (need resolution)
- {story-id}: {blocker description from cycle state}

### In-Progress Stories (may need continuation)
- {story-id}: {last completed step, next expected step}

### Cycle State Decisions (recent)
- [{phase}] {key}: {value} — {rationale}

### Task Tracker Mode
- Mode: {local | linear}
- Ticket IDs loaded: {count or N/A}
```

## SUCCESS METRICS

- [ ] All directories under `state/epics/` scanned for active epics
- [ ] All episode markers under `state/episodes/` read for active epics
- [ ] All cycle state files under `state/cycle-state/` read for active epics
- [ ] Task tracker adapter checked in `hive.config.yaml`
- [ ] Failed, blocked, and in-progress stories identified and listed
- [ ] State reconstruction report produced with all sections populated

## FAILURE MODES

- Skipping episode reads for an active epic — leads to incomplete standup, user misses failed/blocked work
- Assuming state from a prior conversation instead of reading from disk — this is a fresh session, stale assumptions cause incorrect status reporting
- Treating a missing `state/episodes/` directory as a fatal error — new projects have no episodes yet, report empty state
- Not cross-referencing cycle state with episodes — a story may show `completed` in episodes but `blocked` in cycle state due to a later regression

## NEXT STEP

**Gating:** State reconstruction report is complete with all sections.
**Next:** Load `workflows/steps/daily-ceremony/step-02-load-memories.md`
**If gating fails:** Report which state sources could not be read and why. Do not proceed until resolved.
