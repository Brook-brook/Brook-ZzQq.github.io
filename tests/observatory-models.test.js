import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyReadingList, validateReadingList, parseReadingList, toggleReading, addReadings,
  matchesSource, catalogAge, shanghaiDate, readingPlan, MAX_LIST_BYTES, recordReflection, mergeReadings
} from '../assets/js/atlas/observatory-models.js';

const item = (id = 'paper') => ({
  id, title: '一份材料', url: 'https://example.org/paper/v1', topic: 'ai', item_type: 'briefing',
  version: 'v1 · 2026-11-10', checked_on: '2026-11-12', question: '如何核对对照与预算？', caveat: '未复现实验。', reflection: ''
});
const state = (saved = []) => ({ version: 2, saved });

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
  for (const input of [null, [], { version: 3, saved: [] }, { version: 2, saved: [], score: 1 },
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
  assert.equal(validateReadingList(state(large)).saved.length, 60, 'bounded notes now have a 2 MiB backup budget');
  assert.throws(() => recordReflection(state([item()]), 'paper', 'x'.repeat(2001)));
  assert.throws(() => recordReflection(state([item()]), 'paper', '\u0000'));
});

test('v1 snapshots migrate in memory with blank notes and keep immutable historical metadata', () => {
  const legacy = { ...item('historical') }; delete legacy.reflection;
  const raw = JSON.stringify({ version: 1, saved: [legacy] });
  const recovered = parseReadingList(raw);
  assert.deepEqual(recovered, state([{ ...legacy, reflection: '' }]));
  const annotated = recordReflection(recovered, 'historical', '主张\n证据：表 2\n仍不确定 <script>');
  assert.equal(recovered.saved[0].reflection, '');
  assert.equal(annotated.saved[0].url, legacy.url);
  assert.match(readingPlan(annotated), /\\<script\\>/);
});

test('backup merging keeps local notes, fills matching blanks and rejects overflow without partial writes', () => {
  const local = state([{ ...item('keep'), reflection: 'local thought' }, item('fill'), item('changed')]);
  const backup = state([{ ...item('keep'), reflection: 'incoming thought' }, { ...item('fill'), reflection: 'restored' },
    { ...item('changed'), url: 'https://example.org/new', reflection: 'different document' }, item('new')]);
  const result = mergeReadings(local, backup);
  assert.deepEqual([result.added, result.filled, result.kept], [1, 1, 2]);
  assert.deepEqual(result.state.saved.map((item) => item.reflection), ['local thought', 'restored', '', '']);
  assert.equal(local.saved.length, 3); assert.equal(local.saved[1].reflection, '');
  const full = state(Array.from({ length: 60 }, (_, i) => item(`p-${i}`)));
  assert.throws(() => mergeReadings(full, state([item('overflow')])));
  assert.equal(full.saved.length, 60);
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
