import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyLearningState, parseLearningBackup, validateLearningState, updateLearningEntry,
  mergeLearningStates, nextLearningStep, MAX_BACKUP_BYTES
} from '../assets/js/atlas/learning-models.js';
const ids = new Set(['a', 'b', 'c']);
const record = (completed, note = '') => ({ completed, note });
const snapshot = (entries = {}) => ({ version: 1, entries });

test('starts empty, changes only explicit manual records and supports undo', () => {
  const before = emptyLearningState();
  const done = updateLearningEntry(before, 'a', { completed: true }, ids);
  assert.deepEqual(before, snapshot());
  assert.deepEqual(done.entries.a, record(true));
  assert.deepEqual(updateLearningEntry(done, 'a', { completed: false }, ids), snapshot());
  const noted = updateLearningEntry(done, 'a', { note: '我的疑问' }, ids);
  assert.deepEqual(updateLearningEntry(noted, 'a', { completed: false }, ids).entries.a, record(false, '我的疑问'));
});

test('JSON backup round trip keeps Unicode and literal markup as data', () => {
  const state = snapshot({ a: record(false, '<img onerror="x"> 空间与坐标 🌱\n') });
  assert.deepEqual(parseLearningBackup(JSON.stringify(state), ids), state);
  assert.equal({}.polluted, undefined);
});

test('bad JSON, unsupported versions, extra fields and unknown IDs fail, never partially restore', () => {
  for (const value of [null, [], 1, { version: 2, entries: {} }, { version: 1, entries: [] },
    { version: 1, entries: {}, other: 'ignored?' }, snapshot({ unknown: record(true) }),
    snapshot({ a: record('true') }), snapshot({ a: { completed: true } }),
    snapshot({ a: { ...record(true), score: 100 } })]) {
    assert.throws(() => parseLearningBackup(JSON.stringify(value), ids));
  }
  assert.throws(() => parseLearningBackup('{', ids), /JSON/);
  assert.throws(() => parseLearningBackup('{"version":1,"entries":{"__proto__":{"completed":true,"note":"x"}}}', ids));
  assert.equal({}.polluted, undefined);
});

test('bounded notes and UTF-8 file size reject excess input', () => {
  assert.throws(() => updateLearningEntry(snapshot(), 'a', { note: 'x'.repeat(2001) }, ids), /2000/);
  assert.throws(() => updateLearningEntry(snapshot(), 'outside', { completed: true }, ids), /未知/);
  assert.throws(() => parseLearningBackup('中'.repeat(MAX_BACKUP_BYTES), ids), /256 KB/);
});

test('maximum current twelve-step backup round trips even escaped control characters', () => {
  const twelve = new Set(Array.from({ length: 12 }, (_, i) => `step-${i}`));
  const state = snapshot(Object.fromEntries([...twelve].map((id) => [id, record(true, '\u0000'.repeat(2000))])));
  const text = JSON.stringify(state);
  assert.ok(new TextEncoder().encode(text).byteLength < MAX_BACKUP_BYTES);
  assert.deepEqual(parseLearningBackup(text, twelve), state);
});

test('import merges new records, preserves all occupied local records and does not mutate inputs', () => {
  const local = snapshot({ a: record(false, 'local thought') });
  const incoming = snapshot({ a: record(true, 'older copy'), b: record(true, 'new') });
  const merged = mergeLearningStates(local, incoming, ids);
  assert.deepEqual(merged.entries.a, local.entries.a);
  assert.deepEqual(merged.entries.b, incoming.entries.b);
  assert.deepEqual(local, snapshot({ a: record(false, 'local thought') }));
  assert.deepEqual(incoming.entries.a, record(true, 'older copy'));
});

test('blank imported records do not block useful restoration', () => {
  assert.deepEqual(validateLearningState(snapshot({ a: record(false) }), ids), snapshot());
  assert.deepEqual(mergeLearningStates(snapshot({ a: record(false) }), snapshot({ a: record(true) }), ids).entries.a, record(true));
});

test('continuation prioritizes an active unfinished path, not a fabricated ability score', () => {
  const paths = [['a', 'b'], ['c']];
  assert.equal(nextLearningStep(paths, snapshot()), 'a');
  assert.equal(nextLearningStep(paths, snapshot({ c: record(false, 'try later') })), 'c');
  assert.equal(nextLearningStep(paths, snapshot({ a: record(true) })), 'b');
  assert.equal(nextLearningStep(paths, snapshot({ a: record(true), b: record(true) })), 'c');
  assert.equal(nextLearningStep(paths, snapshot({ a: record(true), b: record(true), c: record(true) })), null);
});
