---
name: plan
description: Decompose a requirement into an epic with dependency-tracked stories.
---

# Hive Plan

Decompose a requirement into an epic with dependency-tracked stories.

**Input:** `$ARGUMENTS` contains the requirement or feature description. Optionally a target codebase path.

## Process

### Phase A: Research

1. **Research the codebase.** Spawn the researcher to explore the target codebase — tech stack, architecture, existing patterns, relevant files. The researcher delivers raw findings (not a formatted brief). Use the researcher agent mindset — you need concrete file paths, not guesses.

2. **Produce research brief.** Spawn the technical writer with the research-brief skill to transform raw findings into a formatted brief. This brief feeds into the design discussion.

3. **Load cross-cutting concerns.** Check for `state/cross-cutting-concerns.yaml`. If found, load the concerns — they will be evaluated per-story later. See `hive/references/cross-cutting-concerns.md`.

### Phase B: Design Discussion (always runs)

4. **Produce design discussion.** Spawn the technical writer with the `design-discussion` skill (`skills/hive/skills/design-discussion/SKILL.md`). Input: the research brief + the original user request. Output: a ~200-line design discussion document covering goal, proposed approach, risks, dependencies, open questions, and a scale assessment.

5. **Present design discussion to user.** Show the full document. The user reads it and provides feedback:
   - Affirm or correct the understanding of the goal
   - Answer open questions (numbered for easy reference)
   - Flag any risks or approaches they disagree with
   - Confirm or override the scale assessment recommendation

6. **Evaluate scale.** Based on the design discussion's scale assessment AND user feedback, determine the planning depth:

   ```
   SCALE ASSESSMENT: [Small | Medium | Large]
   
   Small  → Proceed directly to stories (Phase C)
   Medium → Horizontal scan + Vertical slice plan, then stories (Phase B2 → C)
   Large  → H scan + V slice plan + Structured outline, then stories (Phase B2 → B3 → C)
   ```

   Present the recommendation and let the user confirm or override.

   **Routing rules:**
   - **Small** (~5-15 min, 1-3 files, single layer): design discussion is sufficient context → Phase C
   - **Medium** (multi-file, multiple layers, cross-stack): needs H/V planning to slice correctly → Phase B2
   - **Large** (multi-system, migration, long-horizon): needs full H/V + structured outline with elicitation → Phase B2 + B3

### Phase B2: Horizontal + Vertical Planning (medium and large scope)

7. **TPM plans the delivery.** Spawn the TPM agent (`hive/agents/tpm.md`) with the design discussion, user feedback, research brief, and any analyst/architect outputs. The TPM:
   a. Maps all architectural layers and cross-layer dependencies (horizontal thinking)
   b. Cuts vertical slices — minimum cross-stack increments that each produce a working state
   c. Directs the technical writer to produce both documents using the horizontal-plan and vertical-plan skills

   The TPM is the owner of this step. The analyst and architect have already contributed their perspective in earlier phases — the TPM now sequences their inputs into an executable delivery plan.

8. **Review H/V outputs.** The TPM reviews the writer's horizontal scan and vertical slice plan for correctness before presenting to the user.

9. **Present H/V plans to user.** Show both documents. The user reviews:
   - Are the layers correctly identified? (horizontal)
   - Are the slice boundaries logical? (vertical)
   - Is the first slice thin enough to be a real proof of concept?
   - Does each slice produce a genuinely working state?
   - Are deferred items acceptable?

   Incorporate feedback. If scale is medium → proceed to Phase C. If large → continue to B3.

### Phase B3: Structured Outline (large scope only)

10. **Produce structured outline.** Spawn the technical writer with the `structured-outline` skill (`skills/hive/skills/structured-outline/SKILL.md`). Input: H/V plans + design discussion + user feedback + research brief. Output: a ~1000-line structured outline with detailed approach, file manifest, risk registry, and elicitation questions. The outline now builds ON the vertical slice plan — each phase in the outline maps to a vertical slice.

11. **Present structured outline to user.** Show the full document. The elicitation section (Part 7) contains the agent team's own stress-test of the plan — the user reads the team's answers to evaluate whether the thinking is sound. The user then:
    - Flags any elicitation answers that seem weak or wrong
    - Responds to the decision points (Part 8) — numbered affirm/change items
    - Provides final sign-off or requests revisions

    Incorporate feedback into the planning context before proceeding.

### Phase C: Story Decomposition

12. **Decompose into stories.** Break the requirement into an **epic** containing multiple **stories**. Use all available planning context (design discussion, H/V plans if produced, structured outline if produced).

    **If vertical slice plan exists:** Stories map to vertical slices. Each slice becomes one or more stories. Stories within a slice can run in parallel, but slices execute sequentially (each depends_on the prior slice's stories). Every story's completion leaves the product in a working state — this is the vertical planning invariant.

    **If no vertical slice plan:** Decompose as before — independently implementable stories with dependency tracking.

13. **Requirements traceability check.** Before finalizing stories, verify every aspect of the original requirement is covered by at least one story:
    - Re-read the original requirement/PRD
    - List every distinct capability, feature, or behavior mentioned
    - Map each to at least one story
    - Flag any unmapped capabilities as **GAPS**
    - Present gaps to the user before proceeding

    ```
    TRACEABILITY:
      Mapped: 8 of 10 capabilities covered
      GAPS:
      - SMS/email invites to non-users — not covered by any story
      - Contact permission flow — not covered by any story
    ```

14. **Write detailed story files.** For each story, produce an individual YAML file in `state/epics/{epic-id}/stories/{story-id}.yaml`. Stories are the primary artifact — they're what agents read when executing. They must contain enough context for an agent to work autonomously without reading the full epic or other stories.

15. **Evaluate cross-cutting concerns per story.** For each story, evaluate each concern's `applies_when` condition. For applicable concerns, determine the specific action needed and add a `cross_cutting` section to the story YAML. See `hive/references/cross-cutting-concerns.md` for format and examples.

16. **Write the epic index.** Produce `state/epics/{epic-id}/epic.yaml` as a lightweight index referencing the stories.

17. **Detect UI stories.** After generating stories and before presenting for confirmation, scan each story for UI work indicators. See the UI Step Detection section below.

18. **Run agent-ready checklist.** Validate each story against the 9-point checklist in `hive/references/agent-ready-checklist.md` (including check #9: cross-cutting concerns). Flag stories that fail checks in the confirmation output.

19. **Present for confirmation.** Show the dependency graph, story summaries, traceability results, cross-cutting concerns applied, UI detection results, and checklist results. Ask for final confirmation before saving.

### Flow Summary

```
Small:   research → brief → design discussion → feedback → stories → confirm
Medium:  research → brief → design discussion → feedback → H scan → V slice plan → feedback → stories → confirm
Large:   research → brief → design discussion → feedback → H scan → V slice plan → feedback → structured outline → sign-off → stories → confirm
```

## UI Step Detection

After generating stories, scan each story's description and acceptance criteria for keywords indicating net-new UI work. If detected, the UI designer agent should be involved during planning to produce wireframes before execution begins.

**Detection keywords** (case-insensitive):
- Screen terms: "screen", "view", "page", "modal", "dialog", "sheet", "bottom sheet", "drawer"
- Component terms: "button", "form", "input", "component", "widget", "card", "list item"
- Design terms: "redesign", "layout", "visual", "UI", "UX", "mockup", "wireframe"
- Marketing terms: "marketing", "landing page", "ad creative", "banner", "promotional", "app store"

**When keywords match:**

1. Add a `ui-design` step to the story, after `research` and before `implement`:
   ```yaml
   - id: ui-design
     description: |
       Create wireframes for the UI components described in this story.
       Follow the wireframe workflow in agents/ui-designer.md and the
       approval protocol in references/wireframe-protocol.md.
     agent: ui-designer
     depends_on: [research]
   ```

2. Update the `implement` step to depend on `ui-design` and receive wireframe context:
   ```yaml
   - id: implement
     depends_on: [ui-design]
     inputs:
       - source: step_output
         step: ui-design
         key: wireframe_brief
   ```

3. In the plan confirmation output, mark UI stories:
   ```
   Stories:
     · cache-strategy — Design Redis Caching [3 steps]
     · event-detail — Redesign Event Detail View [4 steps, includes UI design]
   ```

4. **BLOCKING GATE:** Stories with `ui-design` steps MUST NOT proceed to execution until wireframes are approved. The planning phase blocks on the wireframe touchpoints (see `hive/references/wireframe-protocol.md`).

**Edge cases:**
- A story mentioning "button" in a backend context may false-positive. Acceptable — the user reviews and can remove the step.
- Purely visual stories may only need: research → ui-design → review (skip implement and test).

## Story File Format

See `hive/references/story-schema.md` if available, or use this template:

```yaml
id: story-id
epic: epic-id
title: One-line description
status: pending
complexity: low | medium | high
depends_on: []

description: |
  Detailed description of what needs to be built and why.

acceptance_criteria:
  - "Given [context], when [action], then [expected result]"

steps:
  - id: step-1
    description: What to do
    agent: researcher | developer | tester | reviewer

context:
  codebase: /path/to/target/codebase
  tech_stack: {}
  key_files: []

files_to_modify:
  - file: path/to/file
    change: What to change

code_examples:
  - title: Pattern to follow
    file: path/to/example

design_decisions:
  - decision: What was decided
    rationale: Why

cross_cutting:
  - concern: caching
    action: "Cache event list, 5min TTL, invalidate on mutation"

risks:
  - severity: high | medium | low
    description: What could go wrong
    mitigation: How to avoid it

references:
  - path/to/relevant/file
```

## Epic Index Format

```yaml
name: epic-id
title: Epic Title
description: What this epic accomplishes
target_codebase: /path/to/codebase

stories:
  - id: story-id
    title: Story Title
    complexity: medium
    depends_on: []
```

## Key References

- `hive/references/agent-ready-checklist.md` — 9-point story validation
- `hive/references/cross-cutting-concerns.md` — per-project concern evaluation
- `hive/references/wireframe-protocol.md` — UI wireframe approval touchpoints
- `hive/agents/analyst.md` — requirements analysis persona
- `hive/agents/architect.md` — system design persona
- `hive/agents/researcher.md` — raw data gathering
- `hive/agents/technical-writer.md` — document production (design discussion, structured outline, research brief)
- `skills/hive/skills/design-discussion/SKILL.md` — ~200-line brain dump format
- `skills/hive/skills/structured-outline/SKILL.md` — ~1000-line detailed plan with elicitation
