# Step 8: Integrate

## MANDATORY EXECUTION RULES (READ FIRST)

- Only run after review verdict is "passed" or "needs_optimization" (and optimization is done)
- NEVER integrate after "needs_revision" — that goes to fix loop
- Commit message must follow repository conventions
- Do NOT force-push or amend commits without user approval
- Verify all tests pass one final time before committing

## EXECUTION PROTOCOLS

**Mode:** autonomous

Final verification, commit, push. Report commit hash.

## CONTEXT BOUNDARIES

**Inputs available:**
- Implementation (from step 3 or step 7 if optimized)
- Review verdict (must be "passed" or "needs_optimization" post-fix)
- Story spec (for commit message context)

**NOT available:**
- New requirements or changes (scope is locked)

## YOUR TASK

Commit the implementation to the feature branch and verify CI.

## TASK SEQUENCE

### 1. Final test run
```bash
{project_test_command}
```
If tests fail: STOP. Do not commit broken code. Report regression.

### 2. Stage changed files
Stage ONLY the files that were modified during implementation.
Do NOT use `git add -A` — stage specific files to avoid committing unrelated changes.

### 3. Write commit message
Follow the repository's commit convention (check CLAUDE.md or recent git log).
Common formats:
- Conventional Commits: `feat(scope): description`
- Story reference: `[STORY-ID] description`

### 4. Commit
```bash
git commit -m "{commit message}"
```

### 5. Push to feature branch
```bash
git push origin {branch-name}
```
If branch doesn't exist remotely, use `git push -u origin {branch-name}`.

### 6. Verify CI (if available)
If the project has CI: check that the push triggers a build and it passes.
If no CI: note "no CI configured" in the report.

### 7. Produce integration report
```markdown
## Integration Complete
- Commit: {hash}
- Branch: {branch-name}
- Files committed: {count}
  - path/to/file1.ts
  - path/to/file2.ts
- CI: {passing | pending | no CI}
- Story: {story-id} — {title}
```

## SUCCESS METRICS

- [ ] Tests pass before commit
- [ ] Only story-related files committed (no stray files)
- [ ] Commit message follows repository convention
- [ ] Pushed to feature branch
- [ ] Integration report produced with commit hash

## FAILURE MODES

- **Committing with failing tests:** Never. Final test run is mandatory.
- **git add -A:** May commit unrelated or sensitive files. Stage explicitly.
- **Force push:** Can destroy upstream work. Never without user approval.
- **No commit message convention:** Check git log for recent patterns.

## NEXT STEP

This is the final step. Story execution is complete.
Produce episode record and report to orchestrator.
