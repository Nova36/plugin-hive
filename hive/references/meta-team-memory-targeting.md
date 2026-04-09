# Meta Team Memory-Driven Targeting Reference

> Reference document for the researcher's memory ecosystem scanning in Phase 2.
> Defines memory sources, pattern detection rules, trust score analysis, episode
> performance analysis, and evidence-linked queue integration.

## Overview

Memory-driven targeting reads Hive's full memory ecosystem to identify optimization
targets through pattern detection. Memory-sourced targets represent real user friction
and historical patterns, making them the highest-value signal for optimization.

**Memory sources are READ-ONLY.** The Meta Team never writes to Hive's memory system.
Memory is input for optimization targets, not an output to be modified.

## Memory Sources

### 1. Feedback Memories (`~/.claude/hive/memories/*/`)

Agent-specific feedback corrections stored per-agent. These represent direct user
corrections to agent behavior — the strongest signal for optimization.

**Scanning procedure:**
- Read all files in `~/.claude/hive/memories/{agent-name}/`
- Extract theme keywords from file names and content (e.g., "sprawl", "permission", "context")
- Group by theme across all agents
- Count occurrences per theme

**Pattern detection rule:**
- Themes with **2+ occurrences across different agents** = optimization target
- Single-agent themes with 3+ corrections = also an optimization target

**Example:**
```
feedback_research_sprawl.md found in:
  - ~/.claude/hive/memories/researcher/
  - ~/.claude/hive/memories/orchestrator/
  - ~/.claude/hive/memories/tpm/
→ Theme "research_sprawl" has 3 occurrences across 3 agents → high-priority target
```

### 2. Project Memories (`~/.claude/projects/*/memory/`)

Claude Code auto-memories per project. These contain context constraints like completed
work, ongoing work, and things to avoid.

**Usage: negative filter, NOT target source.**
- Extract constraints: completed epics, active work, known pitfalls
- These inform proposals (what NOT to propose) rather than generate targets
- Example: "step file migration complete" → don't propose conflicting step file changes

**Scanning procedure:**
- Read MEMORY.md files in project memory directories
- Identify entries tagged with status (COMPLETE, paused, active)
- Build a constraint set for the proposal phase

### 3. Insight History (`state/insights/`)

Staged, promoted, and discarded insights from Hive sessions. Patterns here reveal
areas of active learning and systemic issues.

**Scanning procedure:**
- Read insight files in `state/insights/`
- Group by topic/area
- Detect accumulation: many insights in one area = active optimization area
- Detect discard patterns: recurring discards in same area = systemic issue

**Pattern detection rules:**
- Topics with **5+ insights** = area of active concern → optimization target
- Topics with **3+ discarded insights** = systemic issue → high-priority target

### 4. Trust Score Trends (`~/.claude/hive/memories/*/trust-scores.yaml`)

Per-agent-pair trust scores tracking relationship health between agents.
Declining trust signals coordination issues that optimization can address.

**Scanning procedure:**
- Read trust-scores.yaml for each agent
- For each agent pair, extract recent interaction scores
- Compute trend over last N interactions (N >= 5)

**Pattern detection rule:**
- If trust score drops **>0.1 over 5+ interactions** → investigation target
- Target the lower-trust agent's persona for review

**Algorithm:**
```
For each agent pair in trust-scores.yaml:
  scores = last N interactions (N >= 5 required)
  if len(scores) < 5:
    skip — insufficient data for trend analysis
  trend = scores[first] - scores[last]
  if trend > 0.1:  # declining (first was higher than last)
    queue target:
      target: lower-trust agent's persona
      type: persona-edit
      description: "Investigate declining trust: {agent_a} → {agent_b}"
      source_evidence: "Trust dropped from {scores[first]} to {scores[last]} over {N} interactions"
```

**Sparse data handling:** if fewer than 5 interactions exist for a pair, skip trend
analysis entirely. Do not fabricate trends from insufficient data.

### 5. Episode Performance (`state/episodes/`)

Episode records from Hive workflow executions. Available data includes step status
distribution and inter-step timestamps (NOT explicit duration fields).

**Scanning procedure:**
- Read episode directories in `state/episodes/`
- For each episode, extract step statuses and timestamps
- Aggregate across episodes to identify patterns

**Analysis (working with available fields):**
- **Status distribution:** count complete/failed/blocked per workflow phase
- **Inter-step timing:** compute time between step start timestamps (approximate)
- **Failure patterns:** which steps fail most frequently?
- **Bottleneck detection:** which phases have the longest inter-step gaps?

**Pattern detection rules:**
- Steps with **>20% failure rate** across recent episodes → optimization target
- Phases with consistently longest gaps → performance optimization target
- Increasing failure trends → escalated priority

**Important:** No explicit duration field exists in episode data. Use step timestamps
and status counts for analysis. Do not assume duration fields are available.

### 6. Team Memories (`state/team-memories/`)

Collective knowledge accumulated across team sessions. Patterns here represent
systemic observations across multiple workflows and sessions.

**Scanning procedure:**
- Read files in `state/team-memories/`
- Identify recurring themes and cross-session patterns
- Look for observations that span multiple workflows or agent combinations

### 7. Gate Policies (`hive/gate-policies/`, `hive/references/quality-gates.md`)

Quality gate configurations and their evaluation criteria. Cross-referencing with
insight and episode history reveals gate effectiveness.

**Scanning procedure:**
- Read gate policy files
- Cross-reference with insight history: which gates generate the most insights?
- Cross-reference with episodes: which gates are most frequently the blocking step?
- Identify gates with apparent high false-positive or false-negative rates

## Pattern Aggregation

After scanning all sources, merge and deduplicate findings:

### Deduplication

1. Check against `state/meta-team/queue.yaml` — don't re-queue existing targets
2. Check against `state/meta-team/ledger.yaml` — don't re-queue recently discarded
   targets (within 5 cycles)
3. Fuzzy match on target file + theme — combine evidence from multiple sources

### Evidence-Based Ranking

Targets confirmed by multiple memory sources rank higher:

| Evidence Sources | Priority Boost |
|-----------------|---------------|
| Single source, single occurrence | Base priority |
| Single source, 3+ occurrences | Priority +1 |
| 2 sources confirming | Priority +1 |
| 3+ sources confirming | Priority +2 |

### Multi-Source Target Example

```yaml
- id: "target-2026-04-08-003"
  target: "hive/agents/researcher.md"
  type: "persona-edit"
  priority: 1                    # internal-recurring = highest
  description: "Add explicit time budgets and scope constraints to researcher persona"
  source: "memory-pattern"
  source_attribution:
    - "~/.claude/hive/memories/researcher/feedback_research_sprawl.md"
    - "~/.claude/hive/memories/orchestrator/feedback_research_sprawl.md"
    - "~/.claude/hive/memories/tpm/feedback_research_sprawl.md"
    - "state/episodes/hive-phase6/ — researcher step shows longest gaps"
  source_evidence: "3 agents have feedback memories about research sprawl; episode data confirms researcher phase is the bottleneck"
  status: "queued"
  created: "2026-04-08T01:25:00Z"
  attempted_count: 0
```

## Integration with Phase 2

Memory targeting runs as additional passes within Phase 2, after internal analysis:

1. **Internal analysis** (S3) — scan Hive file structure
2. **Memory targeting** (S7) — scan memory ecosystem (this reference)
3. **External research** (S6) — scan web sources

Findings from all three are merged in queue.yaml with appropriate priority scoring.

## Constraints

- All memory sources are read-only
- Pattern detection uses configurable thresholds (documented above)
- Sparse data is handled gracefully (skip, don't fabricate)
- Project memories serve as constraints, not targets
- Episode analysis works with available fields (no assumed duration)
