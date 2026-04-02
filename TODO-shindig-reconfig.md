# TODO: Re-add Shindig Project Configuration

After the portability audit, all Shindig-specific references were removed from the plugin.
These need to be re-added as project-level configuration IN the Shindig project:

## What to re-create

1. **Cross-cutting concerns** — copy `hive/references/examples/cross-cutting-concerns.mobile-app.yaml` to the Shindig project's `state/cross-cutting-concerns.yaml` and customize with Shindig-specific details (KMP, Firebase UID vs MongoDB ObjectId, Maestro UDID, etc.)

2. **Team config** — create `state/teams/fullstack-team.yaml` with Shindig-specific tech stack (React Native/Expo, Go/Chi, PostgreSQL), domain restrictions matching the actual directory structure, and team composition.

3. **Example codebases** — add Shindig project path to `hive.config.yaml` → `example_codebases`

4. **Linear integration** — set `hive.config.yaml` → `task_tracking` values: `linear_team: HOM`, `linear_project: Shindig`, `linear_user_id: {your-id}`, `branch_prefix: hom`

5. **Cycle state** — will be regenerated on next `/hive:kickoff` or `/hive:plan`
