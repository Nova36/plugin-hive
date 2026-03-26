# Task Tracking Adapter

Interface for external task tracking tools. Items requiring human intervention are pushed to the tracker. The orchestrator surfaces pending items during standup as blockers.

**Active implementation:** Linear via `linearis` CLI.

## Adapter Interface

| Operation | Description |
|-----------|-------------|
| `createItem(item)` | Push a new item to the tracker |
| `updateStatus(id, status)` | Update an item's status |
| `listPending()` | List all items with non-terminal status |
| `markResolved(id, resolution)` | Mark an item as resolved with a comment |

## Item Schema

```yaml
id: auto-generated (e.g., HOM-5)
title: "[Hive] Review wireframe for event detail screen"
description: |
  **Source:** epic/hive-phase7 → story/event-detail → step/ui-design
  **Agent:** ui-designer
  **Severity:** medium

  The UI designer produced a wireframe that needs human approval.
  See: state/wireframes/hive-phase7/event-detail/v1.png
priority: 3               # 1=urgent, 2=high, 3=medium, 4=low
status: Backlog            # Linear status: Backlog, Todo, In Progress, Done, Canceled
```

## When Items Are Created

Agents don't push items directly — the orchestrator or team lead creates them when:

- A quality gate escalates to human (low-confidence output)
- A touchpoint requires user approval (wireframes, plan confirmation)
- An agent identifies a blocker it can't resolve autonomously
- A story fails after retry exhaustion
- A terminal issue is encountered during the fix loop

## Standup Integration

During the daily standup ceremony, the orchestrator runs `listPending()` to surface:
- Items waiting for human input (blockers)
- Items recently resolved (unblocked work)

---

## Linear Implementation (via linearis CLI)

**Prerequisites:**
- `linearis` installed (`pnpm add -g linearis`)
- Authenticated via `LINEAR_API_TOKEN` env var or `~/.linear_api_token` file

**Team:** `HOM` (Homelab12804)

### Create Item

```bash
linearis issues create "[Hive] {title}" \
  -d "{description with source context}" \
  --team HOM \
  --priority {1-4}
```

Priority mapping:
| Hive Severity | Linear Priority | Value |
|---------------|----------------|-------|
| critical | Urgent | 1 |
| high | High | 2 |
| medium | Medium | 3 |
| low | Low | 4 |

### List Pending

```bash
linearis issues list --limit 50
```

Filter in the orchestrator for items with `[Hive]` prefix and non-terminal status (not "Done" or "Canceled").

### Update Status

```bash
# Move to In Progress
linearis issues update HOM-{N} -s "In Progress"

# Mark as Done
linearis issues update HOM-{N} -s "Done"

# Add resolution comment
linearis comments create HOM-{N} --body "Resolved: {resolution notes}"
```

### Read Item

```bash
linearis issues read HOM-{N}
```

### Linear Status Flow

```
Backlog → Todo → In Progress → Done
                             → Canceled
```

## Orchestrator Usage Examples

**Creating a blocker during fix loop:**
```bash
linearis issues create "[Hive] BLOCKED: Payment API returns 500 — needs API key rotation" \
  -d "**Source:** epic/shindig-v2 → story/payment-flow → step/test-execution\n**Agent:** test-worker\n**Severity:** high\n\nPayment API consistently returns 500. Attempted: retry, different endpoints, mock fallback. Root cause: API key expired. Human needs to rotate the key in production config." \
  --team HOM \
  --priority 2
```

**Listing blockers during standup:**
```bash
linearis issues list --limit 50
# Orchestrator filters for [Hive] prefix + status != Done/Canceled
```

**Resolving after human action:**
```bash
linearis comments create HOM-12 --body "API key rotated. Payment endpoint responding. Dev team can retry."
linearis issues update HOM-12 -s "Done"
```

## Configuration

In `hive.config.yaml`:
```yaml
task_tracking:
  adapter: linear
  queue_name: "Hive — Human Intervention"
  auto_expire_days: 7
  linear_team: HOM
  linear_prefix: "[Hive]"
```
