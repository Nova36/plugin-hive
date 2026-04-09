# Meta Team External Research Reference

> Reference document for the researcher's external research loop in Phase 2.
> Defines scan sources, time budgets, multi-pass strategy, applicability scoring,
> network resilience, and cache integration.

## Overview

The external research loop extends Phase 2 analysis by scanning AI community
sources for methodologies and patterns applicable to Hive. External findings
complement internal analysis and memory targeting but rank lower in priority.

**Priority hierarchy:** internal-recurring > internal-one-off > memory-pattern > external-research

## Scan Sources and Time Budgets

| Source | Category | Time Budget | Focus |
|--------|----------|-------------|-------|
| r/LocalLLaMA | Reddit | 10 min | Agent architecture, local model patterns |
| r/ClaudeAI | Reddit | 10 min | Claude-specific prompt patterns, tool use |
| r/MachineLearning | Reddit | 10 min | Broader AI methodology trends |
| Hacker News | Community | 15 min | Novel tools, frameworks, approaches |
| Anthropic blog | AI blogs | 5 min | Claude capabilities, best practices |
| OpenAI blog | AI blogs | 5 min | General agentic patterns, benchmarks |
| MCP/plugin community | Community | 5 min | Plugin patterns, MCP integrations |

**Total external budget: ~60 minutes**

Per-source budgets prevent one slow source from starving others. If a source
exceeds its budget, the researcher moves to the next source immediately.

## Multi-Pass Researcher Strategy

The researcher persona has a per-pass question limit. External research uses
2-3 focused passes to cover all source categories:

### Pass 1: Reddit Agent Architecture (20 min)
- Scan r/LocalLLaMA and r/ClaudeAI
- Focus: agent architecture patterns, prompt engineering techniques, tool use patterns
- Questions: "What agent architecture patterns are gaining traction?" / "What prompt
  patterns improve Claude tool-use reliability?"

### Pass 2: Broader AI Trends (25 min)
- Scan r/MachineLearning and Hacker News
- Focus: new methodologies, evaluation frameworks, multi-agent coordination
- Questions: "What new evaluation methods are being used for AI agents?" / "What
  multi-agent coordination patterns are showing results?"

### Pass 3: Tooling and Community (15 min)
- Scan AI blogs and MCP/plugin community
- Focus: new tools, framework updates, Anthropic/OpenAI guidance
- Questions: "What new MCP patterns or plugin architectures are emerging?" / "What
  agent reliability improvements are recommended?"

## Applicability Evaluation

Every external finding is scored for applicability to Hive before queuing.

### Scoring Criteria

| Score | Meaning | Action |
|-------|---------|--------|
| 0.0 - 0.2 | Not applicable (different domain, unrelated pattern) | Cache only, don't queue |
| 0.3 - 0.4 | Marginally applicable (interesting but unclear how to apply) | Cache only, don't queue |
| 0.5 - 0.6 | Applicable (clear mapping to a Hive pattern exists) | Queue as target |
| 0.7 - 0.8 | Highly applicable (directly addresses a known Hive issue) | Queue with higher priority |
| 0.9 - 1.0 | Critical (addresses a current pain point with proven solution) | Queue with high priority |

**Threshold:** only findings with score >= 0.5 become queue targets.

### Applicability Questions

For each finding, the researcher evaluates:
1. **Does Hive have a matching pattern?** (e.g., finding about prompt chaining → Hive has skill prompts)
2. **Is the finding specific enough to implement?** (vague "use AI better" → not actionable)
3. **Does the finding conflict with the charter?** (e.g., "delete and rebuild" → violates non-destructive constraint)
4. **Is there evidence of effectiveness?** (benchmarks, user reports, adoption signals)

## Network Resilience

External research depends on network access, which may be unreliable in
cron-triggered sessions. The pipeline degrades gracefully.

### Timeout Rules

- **Per-request timeout:** 30 seconds
- **On timeout:** skip the source, log in analysis-cache:
  ```yaml
  - id: "finding-timeout-{source}"
    source: "external"
    finding: "Timeout scanning {source} — skipped"
    applicability_score: 0.0
    created: "{now}"
    ttl_expires: "{now + 1 day}"  # short TTL so we retry next cycle
    converted_to_target: false
  ```
- **On rate limiting (HTTP 429):** same as timeout — skip and log
- **Never retry** within the same cycle — move to next source

### MCP Tool Availability

Web scanning tools (WebSearch, WebFetch, Firecrawl) may not be available in
cron-triggered sessions. If tools are unavailable:
- Log: "External research skipped — web tools unavailable"
- Continue cycle with internal analysis and memory targeting only
- External research is additive, not required

## Analysis-Cache Integration

### Storing Findings

All findings (applicable or not) are cached to prevent redundant scanning:

```yaml
- id: "finding-ext-{seq}"
  source: "external"
  finding: "Chain-of-thought verification improves agent accuracy by 15%"
  applicability_score: 0.8
  source_url: "https://reddit.com/r/ClaudeAI/comments/..."
  source_date: "2026-04-07"
  created: "2026-04-08T01:30:00Z"
  ttl_expires: "2026-04-15T01:30:00Z"  # 7-day TTL for external
  converted_to_target: true
```

### Deduplication

Before scanning, the researcher checks the cache:
- **Cache key:** source type + finding content (fuzzy match on topic, not exact string)
- **If match exists and not expired:** skip scanning that topic
- **If match exists but expired:** re-scan (fresh information may be available)

### TTL

External findings use a 7-day TTL (longer than internal's 3-day TTL) because
external trends change more slowly than internal Hive state.

## Queue Integration

External-sourced targets include full source attribution:

```yaml
- id: "target-{date}-{seq}"
  target: "hive/references/quality-gates.md"
  type: "reference-edit"
  priority: 4                    # external = lower priority
  description: "Add CoT verification as quality gate evaluator type"
  source: "external-research"
  source_attribution: "https://reddit.com/r/ClaudeAI/comments/..."
  source_evidence: "Reddit post shows 15% accuracy improvement with CoT verification; 200+ upvotes, multiple confirmations in comments"
  status: "queued"
  created: "{now}"
  attempted_count: 0
```

### Priority Assignment

External targets always rank below internal targets:
- Internal-recurring: priority 1
- Internal-one-off: priority 2
- Memory-pattern: priority 3
- External-research: priority 4

Within external targets, rank by applicability_score (higher = lower priority number within the external band).
