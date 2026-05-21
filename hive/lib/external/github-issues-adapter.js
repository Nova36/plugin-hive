/**
 * GitHub Issues Adapter
 *
 * Wraps `gh` CLI calls for Hive GitHub integration.
 * Requires: gh CLI authenticated, GITHUB_REPO env var or --repo flag.
 *
 * All functions accept {repo} option (owner/name). If omitted, gh uses the
 * current git remote. Functions that mutate labels are idempotent — applying
 * an already-present label is a no-op at the API level.
 */

'use strict';

const { execSync } = require('child_process');

/**
 * Run a gh CLI command and return parsed JSON output.
 * Returns null on auth failure; throws on other errors.
 */
function runGh(args, { repo } = {}) {
  const repoFlag = repo ? `--repo ${repo}` : '';
  const cmd = `gh ${args} ${repoFlag} 2>&1`;
  try {
    const out = execSync(cmd, { encoding: 'utf8' });
    return out.trim();
  } catch (err) {
    const msg = err.stdout || err.message || '';
    if (/auth|credentials|login|401|403/.test(msg)) {
      return { __authError: true, message: msg.trim() };
    }
    throw err;
  }
}

/**
 * labelExistingIssue — apply labels to an existing GH issue.
 *
 * @param {object} args
 * @param {number|string} args.issue_number
 * @param {string[]}      args.labels       Labels to apply (e.g. ['hive:ready', 'hive:epic:my-epic'])
 * @param {string}        [args.repo]       owner/name — defaults to current remote
 * @returns {{labeled: true, issue_number: number}
 *          |{labeled: false, reason: string}}
 */
function labelExistingIssue({ issue_number, labels = [], repo } = {}) {
  if (!issue_number) throw new Error('issue_number required');
  if (!labels.length) throw new Error('at least one label required');

  // Ensure labels exist before applying (gh creates them if missing via --force).
  const labelArgs = labels.map((l) => `--label ${JSON.stringify(l)}`).join(' ');
  const result = runGh(
    `issue edit ${issue_number} ${labelArgs}`,
    { repo }
  );

  if (result && result.__authError) {
    return { labeled: false, reason: 'auth' };
  }

  // Verify by reading current labels — idempotency check.
  const viewOut = runGh(
    `issue view ${issue_number} --json labels`,
    { repo }
  );

  if (viewOut && viewOut.__authError) {
    return { labeled: false, reason: 'auth' };
  }

  let currentLabels = [];
  try {
    const parsed = JSON.parse(viewOut);
    currentLabels = (parsed.labels || []).map((l) => l.name);
  } catch (_) {
    // non-JSON means something unexpected; treat as success since edit didn't throw
  }

  const allApplied = labels.every((l) => currentLabels.includes(l));
  if (!allApplied) {
    return { labeled: false, reason: 'labels_not_confirmed' };
  }

  return { labeled: true, issue_number: Number(issue_number) };
}

/**
 * createStory — publish one local story spec as a GitHub issue.
 *
 * @param {object} story  Story spec (title, description/body, labels)
 * @param {string} [repo] owner/name
 * @returns {{issue_number: number, url: string}|{error: string}}
 */
function createStory({ title, body = '', labels = [], repo } = {}) {
  if (!title) throw new Error('title required');

  const labelArgs = labels.length
    ? labels.map((l) => `--label ${JSON.stringify(l)}`).join(' ')
    : '';
  const bodyFlag = body ? `--body ${JSON.stringify(body)}` : '--body ""';

  const result = runGh(
    `issue create --title ${JSON.stringify(title)} ${bodyFlag} ${labelArgs} --json number,url`,
    { repo }
  );

  if (result && result.__authError) {
    return { error: 'auth' };
  }

  try {
    const parsed = JSON.parse(result);
    return { issue_number: parsed.number, url: parsed.url };
  } catch (_) {
    return { error: `unexpected_output: ${result}` };
  }
}

/**
 * publishStoriesToIssues — bulk-publish an array of story specs as GH issues.
 *
 * Idempotent at the story level: if a story already has an `issue_number` field
 * set, it is skipped (labels are applied via labelExistingIssue instead).
 *
 * @param {object[]} stories  Array of story spec objects
 * @param {string[]} [extraLabels]  Labels added to every published issue
 * @param {string}   [repo]
 * @returns {{ created: object[], skipped: object[], errors: object[] }}
 */
function publishStoriesToIssues(stories = [], { extraLabels = [], repo } = {}) {
  const created = [];
  const skipped = [];
  const errors = [];

  for (const story of stories) {
    if (story.issue_number) {
      // Already published — just ensure labels are up to date.
      const allLabels = [...(story.labels || []), ...extraLabels];
      if (allLabels.length) {
        const r = labelExistingIssue({ issue_number: story.issue_number, labels: allLabels, repo });
        if (!r.labeled) {
          errors.push({ story_id: story.id, issue_number: story.issue_number, reason: r.reason });
        } else {
          skipped.push({ story_id: story.id, issue_number: story.issue_number });
        }
      } else {
        skipped.push({ story_id: story.id, issue_number: story.issue_number });
      }
      continue;
    }

    const allLabels = [...(story.labels || []), ...extraLabels];
    const result = createStory({
      title: story.title,
      body: story.description || story.body || '',
      labels: allLabels,
      repo,
    });

    if (result.error) {
      errors.push({ story_id: story.id, error: result.error });
    } else {
      created.push({ story_id: story.id, issue_number: result.issue_number, url: result.url });
    }
  }

  return { created, skipped, errors };
}

module.exports = { labelExistingIssue, createStory, publishStoriesToIssues };
