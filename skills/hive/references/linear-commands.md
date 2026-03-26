# Linear Commands Quick Reference

Copy-paste commands for each ceremony phase. Team: HOM | Project: plugin-hive

## Standup — Query Board

```bash
# All issues
linearis issues search "" --project "plugin-hive" --team HOM --limit 50

# Blockers only
linearis issues search "label:human-intervention" --team HOM --status "Todo,In Progress" --limit 20

# Single issue details
linearis issues read HOM-{N}
```

## Planning — Create Tickets

```bash
# Epic parent
linearis issues create "Epic: {epic-id} — {title}" \
  --team HOM --project "plugin-hive" --labels "epic-parent" \
  -d "{description}"

# Story sub-issue
linearis issues create "{story title}" \
  --team HOM --project "plugin-hive" --labels "story" \
  --parent-ticket HOM-{epic-N} --status "Todo" \
  -d "{description}"
```

## Execution — Claim & Branch

```bash
# Check lock
linearis issues read HOM-{N}
# → if assignee is null, safe to claim

# Claim (assign + In Progress)
linearis issues update HOM-{N} --status "In Progress" \
  --assignee eb8b9543-48b6-4570-bc53-50c6b22b201a

# Create branch
git checkout -b hom-{N}-{slug}
```

## Commit — Reference Ticket

```bash
git commit -m "feat(hive): {description}

Refs: HOM-{N}"
```

## Test Handoff — Move to Review

```bash
linearis issues update HOM-{N} --status "In Review"
```

## Fix Loop — Bugs

```bash
# Create bug sub-issue
linearis issues create "Bug: {title}" \
  --team HOM --project "plugin-hive" --labels "bug" \
  --parent-ticket HOM-{story-N} --priority {1-4} \
  --status "In Progress" \
  -d "{expected vs actual, hypothesis}"

# Close fixed bug
linearis issues update HOM-{bug-N} --status "Done"

# Escalate terminal issue
linearis issues update HOM-{N} --labels "bug,human-intervention" --priority 1
linearis comments create HOM-{N} --body "BLOCKED: {context}"
```

## Push — Auto-Link

```bash
git push -u origin hom-{N}-{slug}
# Linear auto-links PR via branch name — no linearis command needed
# Merge auto-closes the ticket
```

## Session End — Release

```bash
# Release completed tickets
linearis issues update HOM-{N} --assignee ""

# Check for anomalies (still In Progress)
linearis issues search "" --project "plugin-hive" --team HOM --status "In Progress"

# Add resolution comment
linearis comments create HOM-{N} --body "{resolution notes}"
```
