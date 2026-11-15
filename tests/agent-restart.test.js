import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { assertRestartCaseCurrent } from '../tools/agent-restart-case.mjs';

const root = process.cwd();
const semantic = (value) => {
  const copy = structuredClone(value); delete copy.injected_steps; delete copy.python; delete copy.sqlite; return copy;
};

test('the exact current restart ZIP executes real interrupted processes and SQLite transactions', () => {
  const result = spawnSync('python3', ['-B', 'tools/check-restart-package.py'], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /9 exact bounded entries/);
  assert.match(result.stdout, /Ran 8 tests/);
  assert.match(result.stdout, /six real child-process\/SQLite scenarios/);
  const saved = assertRestartCaseCurrent(root);
  const actual = result.stdout.split('\n').filter((line) => line.startsWith('{')).map((line) => JSON.parse(line));
  assert.equal(actual.length, 6);
  assert.deepEqual(actual.map(semantic), saved.cases.map(semantic), 'saved teaching observations match an actual current ZIP replay; runtime versions are separately declared');
});

test('saved restart evidence rejects fake success, altered histories, private fields and stale sources', () => {
  const original = assertRestartCaseCurrent(root);
  for (const edit of [
    (value) => value.private_note = 'SYNTHETIC_PRIVATE',
    (value) => value.archive.sha256 = '0'.repeat(64),
    (value) => value.generator.sha256 = '0'.repeat(64),
    (value) => value.captured_at = '2026-02-31T00:00:00Z',
    (value) => value.cases[1].python = '3.10.0',
    (value) => value.cases[0].model_called = true,
    (value) => value.cases[0].client_trace[0].http_status = 200,
    (value) => value.cases[0].client_trace[0].response = { status: 'applied', receipt: null },
    (value) => value.cases[1].teaching_observer[0].value = 2,
    (value) => value.cases[4].teaching_observer[1].value = 999,
    (value) => value.cases[5].client_trace[2].response.receipt.value_after = 3,
    (value) => value.cases[0].client_trace[1].response.receipt.id = 'r-2',
    (value) => value.cases[0].injected_steps[0].interrupt = 'none',
    (value) => value.scope += ' This proves distributed exactly-once.'
  ]) {
    const changed = structuredClone(original); edit(changed);
    assert.throws(() => assertRestartCaseCurrent(root, changed));
  }
});
