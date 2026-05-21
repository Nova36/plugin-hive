/**
 * Fixture test for github-issues-adapter.js
 *
 * Run:  node hive/lib/external/__tests__/github-issues-adapter.test.js
 *
 * Uses recorded gh CLI output via FIXTURE_MODE=1 (default).
 * Set FIXTURE_MODE=0 and SANDBOX_REPO=owner/name to run against a live sandbox.
 *
 * Sandbox prerequisites (live mode):
 *   gh auth status
 *   gh issue list --repo $SANDBOX_REPO   # must have access
 */

'use strict';

const assert = require('assert');
const cp = require('child_process');

const FIXTURE_MODE = process.env.FIXTURE_MODE !== '0';
const SANDBOX_REPO = process.env.SANDBOX_REPO || 'Nova36/plugin-hive';

// ---------------------------------------------------------------------------
// Fixture shim — replace execSync before requiring the adapter
// ---------------------------------------------------------------------------

// Maps a substring of the gh command to recorded output.
// Order matters: more-specific entries listed first.
const FIXTURES = [
  // multi-label edit: issue 98
  {
    match: 'issue edit 98',
    out: '',
  },
  {
    match: 'issue view 98 --json labels',
    out: JSON.stringify({ labels: [{ name: 'hive:ready' }, { name: 'hive:epic:test-epic' }] }),
  },
  // single-label edit: issue 99
  {
    match: 'issue edit 99',
    out: '',
  },
  {
    match: 'issue view 99 --json labels',
    out: JSON.stringify({ labels: [{ name: 'hive:ready' }] }),
  },
  // create story
  {
    match: 'issue create --title "Test Story"',
    out: JSON.stringify({ number: 42, url: 'https://github.com/Nova36/plugin-hive/issues/42' }),
  },
];

function fixtureExecSync(cmd) {
  // Auth-failure simulation: issue_number 401 in the command
  if (/issue\s+(edit|view)\s+401/.test(cmd)) {
    const err = new Error('mock auth error');
    err.stdout = 'HTTP 401: Bad credentials';
    throw err;
  }
  for (const f of FIXTURES) {
    if (cmd.includes(f.match)) return f.out;
  }
  throw new Error(`No fixture for command: ${cmd}`);
}

if (FIXTURE_MODE) {
  cp.execSync = fixtureExecSync;
}

// Re-require adapter AFTER patching.
delete require.cache[require.resolve('../github-issues-adapter')];
const {
  labelExistingIssue,
  createStory,
  publishStoriesToIssues,
} = require('../github-issues-adapter');

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

console.log('\ngithub-issues-adapter (fixture mode:', FIXTURE_MODE, ')\n');

test('labelExistingIssue returns {labeled:true, issue_number} on success', () => {
  const result = labelExistingIssue({
    issue_number: 99,
    labels: ['hive:ready'],
    repo: FIXTURE_MODE ? undefined : SANDBOX_REPO,
  });
  assert.strictEqual(result.labeled, true);
  assert.strictEqual(result.issue_number, 99);
});

test('labelExistingIssue is idempotent — no error on already-labeled issue', () => {
  const r1 = labelExistingIssue({ issue_number: 99, labels: ['hive:ready'] });
  const r2 = labelExistingIssue({ issue_number: 99, labels: ['hive:ready'] });
  assert.strictEqual(r1.labeled, true);
  assert.strictEqual(r2.labeled, true);
});

test('labelExistingIssue applies multiple labels', () => {
  const result = labelExistingIssue({
    issue_number: 98,
    labels: ['hive:ready', 'hive:epic:test-epic'],
  });
  assert.strictEqual(result.labeled, true);
  assert.strictEqual(result.issue_number, 98);
});

test('labelExistingIssue returns {labeled:false, reason:"auth"} on auth error', () => {
  if (!FIXTURE_MODE) {
    console.log('    (skipped in live mode)');
    passed++;
    return;
  }
  let result;
  try {
    result = labelExistingIssue({ issue_number: 401, labels: ['hive:ready'] });
  } catch (_) {
    result = { labeled: false, reason: 'uncaught' };
  }
  assert.strictEqual(result.labeled, false);
  assert.strictEqual(result.reason, 'auth');
});

test('labelExistingIssue throws on missing issue_number', () => {
  assert.throws(() => labelExistingIssue({ labels: ['hive:ready'] }), /issue_number/);
});

test('labelExistingIssue throws on empty labels array', () => {
  assert.throws(() => labelExistingIssue({ issue_number: 99, labels: [] }), /label/);
});

test('createStory returns {issue_number, url} on success', () => {
  const result = createStory({
    title: 'Test Story',
    labels: ['hive:ready'],
  });
  assert.strictEqual(result.issue_number, 42);
  assert.ok(result.url && result.url.includes('github.com'));
});

test('createStory returns {issue_number, url} with empty body', () => {
  const result = createStory({ title: 'Test Story' });
  assert.strictEqual(result.issue_number, 42);
});

test('publishStoriesToIssues skips stories that already have issue_number', () => {
  const stories = [{ id: 's1', title: 'Story 1', issue_number: 99, labels: ['hive:ready'] }];
  const { created, skipped, errors } = publishStoriesToIssues(stories, {});
  assert.strictEqual(created.length, 0);
  assert.strictEqual(skipped.length, 1);
  assert.strictEqual(errors.length, 0);
});

test('publishStoriesToIssues creates stories without issue_number', () => {
  const stories = [{ id: 's2', title: 'Test Story', labels: [] }];
  const { created, skipped, errors } = publishStoriesToIssues(stories, {
    extraLabels: ['hive:ready'],
  });
  assert.strictEqual(created.length, 1);
  assert.strictEqual(skipped.length, 0);
  assert.strictEqual(errors.length, 0);
  assert.strictEqual(created[0].issue_number, 42);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
