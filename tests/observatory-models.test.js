import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyReadingList, validateReadingList, parseReadingList, toggleReading, addReadings,
  matchesSource, catalogAge, shanghaiDate, readingPlan, MAX_LIST_BYTES
} from '../assets/js/atlas/observatory-models.js';

const item = (id = 'paper') => ({
  id, title: '一份材料', url: 'https://example.org/paper/v1', topic: 'ai', item_type: 'briefing',
  version: 'v1 · 2026-11-10', checked_on: '2026-11-12', question: '如何核对对照与预算？', caveat: '未复现实验。'
});
const state = (saved = []) => ({ version: 1, saved });

test('only explicit selection creates a snapshot; toggle supports removal without mutating input', () => {
  const empty = emptyReadingList();
  const selected = toggleReading(empty, item());
  assert.deepEqual(empty, state());
  assert.deepEqual(selected, state([item()]));
  assert.deepEqual(toggleReading(selected, item()), state());
});

test('starter additions preserve existing materials and deduplicate repeated selection', () => {
  const before = state([item('existing')]);
  const added = addReadings(before, [item('one'), item('two')]);
  assert.deepEqual(added.saved.map((row) => row.id), ['existing', 'one', 'two']);
  assert.deepEqual(addReadings(added, [item('one'), item('two')]), added);
  assert.equal(before.saved.length, 1);
});

test('historical snapshots retain links, versions and reading hints after catalog changes', () => {
  const old = item('removed-from-current-catalog');
  assert.deepEqual(parseReadingList(JSON.stringify(state([old]))), state([old]));
  assert.equal(readingPlan(state([old])).includes(old.url), true);
  assert.equal(readingPlan(state([old])).includes(old.question), true);
});

test('rejects invalid JSON/schema/version, duplicate IDs and unsafe links as a whole', () => {
  for (const input of [null, [], { version: 2, saved: [] }, { version: 1, saved: [], score: 1 },
    state([item(), item()]), state([{ ...item(), url: 'javascript:alert(1)' }]),
    state([{ ...item(), url: 'https://user:password@example.org/' }]),
    state([{ ...item(), title: 'line\nbreak' }]), state([{ ...item(), topic: 'unknown' }]),
    state([{ ...item(), checked_on: '2026-02-30' }]), state([{ ...item(), question: '' }])]) {
    assert.throws(() => parseReadingList(JSON.stringify(input)));
  }
  assert.throws(() => parseReadingList('{broken'));
  assert.equal({}.polluted, undefined);
});

test('bounds record count, string length and total UTF-8 bytes', () => {
  assert.throws(() => validateReadingList(state(Array.from({ length: 61 }, (_, i) => item(`p-${i}`)))));
  assert.throws(() => validateReadingList(state([{ ...item(), title: 'x'.repeat(241) }])));
  assert.throws(() => parseReadingList('中'.repeat(MAX_LIST_BYTES)));
  const large = Array.from({ length: 60 }, (_, i) => ({ ...item(`p-${i}`), question: '中'.repeat(1200), caveat: '中'.repeat(1200) }));
  assert.throws(() => validateReadingList(state(large)), /过长/);
});

test('source filtering intersects topic, material type and normalized search', () => {
  const source = { topic: 'ai', kind: 'analysis', search: 'Stanford AI Index 技术表现' };
  assert.equal(matchesSource(source, { query: 'ＳＴＡＮＦＯＲＤ', topic: 'ai', kind: 'analysis' }), true);
  assert.equal(matchesSource(source, { query: '技术', topic: 'economy' }), false);
  assert.equal(matchesSource(source, { query: 'Stanford', kind: 'reporting' }), false);
  assert.equal(matchesSource(source, { query: '<img onerror=x>' }), false);
});

test('freshness uses the Shanghai calendar and does not turn future/invalid checks into freshness claims', () => {
  const now = new Date('2026-11-11T17:00:00Z');
  assert.equal(shanghaiDate(now), '2026-11-12');
  assert.equal(catalogAge('2026-11-12', now), 0);
  assert.equal(catalogAge('2026-10-01', now), 42);
  assert.equal(catalogAge('2026-11-13', now), null);
  assert.equal(catalogAge('2026-02-30', now), null);
});

test('Markdown export preserves source/version/hints and leaves the learner’s answers blank', () => {
  const material = { ...item(), title: '<img> [claim] #1' };
  const output = readingPlan(state([material]), new Date('2026-11-11T17:00:00Z'));
  assert.ok(output.includes('2026-11-12（北京时间）'));
  for (const text of [material.url, material.version, material.question, material.caveat, '我的解释：', '- [ ]']) assert.ok(output.includes(text));
  assert.equal(output.includes('- [x]'), false);
  assert.ok(output.includes('\\<img\\>'));
  assert.equal(output.includes('<img>'), false);
});
