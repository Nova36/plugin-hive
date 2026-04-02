# Insight Capture Protocol

During execution, if you encounter something non-obvious and reusable, write an insight to the staging area at `state/insights/{epic-id}/{story-id}/`.

Most steps produce zero insights. Only capture when you find:

- A repeatable pattern worth applying again → type: `pattern`
- A failure or mistake to avoid in the future → type: `pitfall`
- Something that contradicts prior understanding → type: `override`
- A non-obvious codebase convention or constraint → type: `codebase`
- Accumulated knowledge on a topic worth curating across sessions → type: `reference` (include `topic` and `sources` fields)

Format: see `references/agent-memory-schema.md`. Do NOT capture routine completions or expected behavior.
