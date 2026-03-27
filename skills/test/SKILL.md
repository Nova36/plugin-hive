---
name: test
description: Run the test swarm — context gathering, test authoring, execution, bug triage, and reporting.
---

# Hive Test

Run the test swarm pipeline on a story, PR, or the current codebase.

**Input:** `$ARGUMENTS` optionally contains a story ID, PR number, or "all" for full suite.

**Instructions:** Read `hive/references/test-swarm-architecture.md` for the pipeline. Workflow at `hive/workflows/test-swarm.workflow.yaml`. Test agents at `hive/agents/test-*.md`.
