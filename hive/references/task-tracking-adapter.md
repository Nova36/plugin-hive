# Task Tracking Adapter — Full Lifecycle

Linear is the project board for Hive workflows. Every ceremony phase interacts with Linear: planning creates tickets, execution claims them, testing transitions them, and push auto-closes them.

**Tool:** `linearis` CLI | **Team:** HOM | **Project:** plugin-hive

## Board Design

### Status Flow

```
Backlog → Todo → In Progress → In Review → Done
                                          → Canceled
```

| Linear Status | Hive Meaning |
|---|---|
| Backlog | Story defined but not scheduled |
| Todo | Scheduled for current cycle, not started |
| In Progress | Agent claimed and executing (locked via assignee) |
| In Review | Test swarm running or awaiting human review |
| Done | Merged and closed (auto via GitHub integration) |
| Canceled | Abandoned or descoped |

### Labels

| Label | Purpose |
|-------|---------|
| `epic-parent` | Marks an issue as the parent for a Hive epic |
| `story` | Normal development story |
| `bug` | Filed by test swarm during fix loop |
| `human-intervention` | Blocker needing human action |

### Hierarchy

```
plugin-hive (Linear Project)
  └── Epic Parent Issue (label: epic-parent)
        ├── Story Sub-Issue (label: story)
        │     └── Bug Sub-Issue (label: bug)
        └── Story Sub-Issue (label: story)
```

### Branch Naming Convention

Pattern: `hom-{N}-{slug}`

Example: `hom-42-fix-payment-flow`

Linear's native GitHub integration detects `HOM-42` in the branch name and auto-links PRs. The orchestrator **must** create branches matching this pattern.

## Adapter Operations

### createEpicParent(title, description)

Create the parent issue for a Hive epic.

```bash
linearis issues create "Epic: {epic-id} — {title}" \
  --team HOM \
  --project "plugin-hive" \
  --labels "epic-parent" \
  -d "{description}"
```

Returns: issue ID (e.g., `HOM-40`). Store in cycle state as `linear.epic_issue_id`.

### createStoryIssue(title, description, parentId)

Create a story as a sub-issue under the epic parent.

```bash
linearis issues create "{story title}" \
  --team HOM \
  --project "plugin-hive" \
  --labels "story" \
  --parent-ticket {parentId} \
  --status "Todo" \
  -d "{description with acceptance criteria}"
```

Returns: issue ID. Store in cycle state as `linear.stories.{id}.issue_id`.

### createBugIssue(title, description, parentStoryId, priority)

Create a bug as a sub-issue under the story where the test failed.

```bash
linearis issues create "Bug: {title}" \
  --team HOM \
  --project "plugin-hive" \
  --labels "bug" \
  --parent-ticket {parentStoryId} \
  --priority {1-4} \
  --status "In Progress" \
  -d "{description with expected/actual/hypothesis}"
```

Priority mapping: 1=urgent, 2=high, 3=medium, 4=low.

### claimIssue(issueId, userId)

Assignment-based locking. Check assignee before claiming.

```bash
# Step 1: Check if locked
linearis issues read {issueId}
# If assignee is not null → LOCKED, skip or wait

# Step 2: Claim (assign + move to In Progress)
linearis issues update {issueId} \
  --status "In Progress" \
  --assignee {userId}
```

Update cycle state: `linear.stories.{id}.assignee = userId`, `linear.stories.{id}.status = "In Progress"`.

### releaseIssue(issueId)

Clear assignment lock. Status depends on outcome.

```bash
# Release after completion
linearis issues update {issueId} --assignee ""

# Status updated separately based on outcome:
# Done → auto via GitHub merge
# Backlog → deferred to future session
```

Update cycle state: `linear.stories.{id}.assignee = null`.

### updateStatus(issueId, status)

Transition a ticket's status.

```bash
linearis issues update {issueId} --status "{status}"
```

Valid statuses: Backlog, Todo, In Progress, In Review, Done, Canceled.

### queryBoard(project)

Get all issues grouped by status for the standup board view.

```bash
# All issues in the project
linearis issues search "" --project "plugin-hive" --team HOM --limit 50

# Blockers only
linearis issues search "" --project "plugin-hive" --team HOM --status "Todo,In Progress" --limit 50
# Filter results for label: human-intervention
```

Note: `linearis issues search` returns JSON with status, assignee, labels, and priority. The orchestrator filters and groups client-side.

### readIssue(issueId)

Get full details on a single issue.

```bash
linearis issues read {issueId}
```

### addComment(issueId, body)

Add context or resolution notes to a ticket.

```bash
linearis comments create {issueId} --body "{comment text}"
```

## Assignment-Based Locking Protocol

```
CLAIM(issue_id):
  1. issue = linearis issues read {issue_id}
  2. IF issue.assignee != null → LOCKED — do not claim
  3. linearis issues update {issue_id} --assignee {USER_ID} --status "In Progress"
  4. Update cycle state: stories.{id}.assignee = USER_ID

RELEASE(issue_id):
  1. linearis issues update {issue_id} --assignee ""
  2. Update cycle state: stories.{id}.assignee = null
  3. Status updated separately (Done via GitHub, or Backlog if deferred)
```

The user ID is resolved at session start from `hive.config.yaml` (`task_tracking.linear_user_id`) or by running `linearis users list --active`.

## When Items Are Created

| Trigger | Operation | Label |
|---------|-----------|-------|
| `/hive:plan` creates stories | createEpicParent + createStoryIssue per story | epic-parent, story |
| Quality gate escalates to human | createStoryIssue with human-intervention label | human-intervention |
| Terminal issue during fix loop | createBugIssue with high priority | bug, human-intervention |
| Test swarm files a bug | createBugIssue under the story | bug |
| Agent can't resolve a blocker | createStoryIssue with human-intervention | human-intervention |

## Configuration

In `hive.config.yaml`:
```yaml
task_tracking:
  adapter: linear
  queue_name: "Hive — Human Intervention"
  auto_expire_days: 7
  linear_team: HOM
  linear_prefix: "[Hive]"
  linear_project: "plugin-hive"
  linear_user_id: "eb8b9543-48b6-4570-bc53-50c6b22b201a"
  branch_prefix: "hom"
```
