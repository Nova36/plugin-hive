# Phase 2: Analysis

## MANDATORY EXECUTION RULES (READ FIRST)

- Do NOT modify any Hive files — analysis is read-only
- Do NOT re-queue targets that match recently discarded ledger entries (within 5 cycles)
- Do NOT exceed per-source time budgets (when external research is enabled)
- Check budget at phase start — skip to Phase 8 if <90 min remaining

## EXECUTION PROTOCOLS

**Mode:** autonomous

Scan Hive internals for optimization targets. The researcher identifies patterns,
inefficiencies, and improvement opportunities across the codebase.

## CONTEXT BOUNDARIES

**Inputs available:**
- state/meta-team/charter.md — objectives and scope definition
- state/meta-team/ledger.yaml — avoid re-attempting discarded targets
- state/meta-team/queue.yaml — avoid duplicating existing targets
- state/meta-team/analysis-cache.yaml — skip already-cached findings
- hive/agents/*.md — agent persona files
- hive/workflows/ — workflow and step files
- hive/references/ — reference documents
- hive/gate-policies/ — quality gate configurations

**Extension points (not in baseline cycle):**
- External research: Reddit, HN, AI blogs (S6)
- Memory targeting: feedback memories, trust scores, episodes (S7)

## YOUR TASK

Scan Hive's internal structure and identify optimization targets. Output prioritized
targets in queue schema format.

## TASK SEQUENCE

### Internal Analysis (baseline cycle)

1. **Scan agent personas** (`hive/agents/*.md`)
   - Look for: unclear instructions, missing scope boundaries, redundant sections,
     outdated patterns, missing time budgets
   - Cross-reference with charter objectives

2. **Scan skills and workflows** (`hive/workflows/`, step files)
   - Look for: friction points, missing steps, unclear agent handoffs,
     inconsistent patterns across workflows
   - Check step files for completeness and clarity

3. **Scan reference documents** (`hive/references/`)
   - Look for: outdated guidance, missing topics, inconsistencies with actual patterns

4. **Scan gate policies** (`hive/gate-policies/`, `hive/references/quality-gates.md`)
   - Look for: overly strict or lenient gates, missing evaluation criteria,
     gates that don't match current workflow needs

5. **Deduplicate against ledger**
   - For each potential target: check ledger for discarded entries on the same target
     within the last 5 cycles
   - If match found: skip (don't re-queue recently failed targets)
   - Also check queue.yaml: skip targets already queued

6. **Prioritize and output targets**
   - Priority scoring:
     - Internal-recurring (pattern across multiple files/agents): priority 1
     - Internal-one-off (single file improvement): priority 2
     - External-sourced (from S6): priority 3-4
   - Each target must include all queue schema fields:
     - id, target, type, priority, description, source, source_attribution,
       source_evidence, status: "queued", created, attempted_count: 0

7. **Cache findings**
   - Write all findings to analysis-cache.yaml with 3-day TTL (internal)
   - Set `converted_to_target: true` for findings that became queue entries

### External Research Extension (S6 — not in baseline)

- Multi-pass web scanning with per-source time budgets
- Applicability scoring (>= 0.5 threshold)
- Source attribution (URLs, dates)

### Memory Targeting Extension (S7 — not in baseline)

- Feedback memory pattern detection (2+ occurrences)
- Trust score trend analysis
- Episode performance analysis

## PHASE TRANSITION

On success: write targets to queue.yaml, update analysis-cache.yaml, advance to Phase 3.
In baseline cycle: Phases 3-7 are stubbed, advance directly to Phase 8 (close).

## OUTPUT FORMAT

```yaml
# Each target the researcher identifies:
- id: "target-{date}-{seq}"
  target: "hive/agents/researcher.md"
  type: "persona-edit"
  priority: 2
  description: "Tighten scope discipline — 3 feedback memories mention sprawl"
  source: "internal-analysis"
  source_attribution: "hive/agents/researcher.md — scope section lacks time budget"
  source_evidence: "Persona has no explicit time constraint for research phases"
  status: "queued"
  created: "{now}"
  attempted_count: 0
```
