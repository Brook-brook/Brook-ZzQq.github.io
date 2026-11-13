import test from 'node:test';
import assert from 'node:assert/strict';
import { validateKnowledgeModel, knowledgeNeighborhood } from '../assets/js/atlas/knowledge-models.js';

const base = '/Brook-ZzQq.github.io';
const note = (id) => ({ id, title: `公开笔记 ${id}`, summary: '明确的公开摘要', category: '方法',
  url: `${base}/knowledge/${id}/`, lab_url: id === 'a' ? `${base}/playground/#geo` : null,
  practice: id === 'd' ? [{ id: 'explain', title: '解释', path_title: '既有路线', url: `${base}/study/practice/#explain` }] : [] });
const source = { schema_version: 1, ai_assisted: true, notes: ['a', 'b', 'c', 'd'].map(note), links: [
  { id: 'a-b', from: 'a', to: 'b', kind: 'prepare', reason: '先核对输入与单位。' },
  { id: 'b-c', from: 'b', to: 'c', kind: 'compare', reason: '对照两个不同边界。' }
] };

test('directed preparation and symmetric comparisons expose explicit original reasons without mutation', () => {
  validateKnowledgeModel(source, base);
  const before = structuredClone(source);
  const a = knowledgeNeighborhood(source, 'a');
  assert.equal(a.groups.after[0].note.id, 'b'); assert.equal(a.groups.before.length, 0);
  const b = knowledgeNeighborhood(source, 'b');
  assert.equal(b.groups.before[0].note.id, 'a'); assert.equal(b.groups.compare[0].note.id, 'c');
  assert.equal(knowledgeNeighborhood(source, 'c').groups.compare[0].note.id, 'b');
  assert.equal(b.groups.compare[0].link.reason, '对照两个不同边界。');
  assert.equal(knowledgeNeighborhood(source, 'b', 'prepare').count, 1);
  assert.equal(knowledgeNeighborhood(source, 'b', 'extend').count, 0);
  assert.deepEqual(source, before);
});

test('a genuinely unconnected note retains its actual practice and an empty neighborhood', () => {
  const view = knowledgeNeighborhood(source, 'd');
  assert.equal(view.count, 0); assert.equal(view.note.practice[0].id, 'explain');
  assert.deepEqual(view.groups, { before: [], after: [], compare: [] });
  assert.throws(() => knowledgeNeighborhood(source, 'unknown'));
  assert.throws(() => knowledgeNeighborhood(source, 'a', ['prepare']));
});

test('metadata URLs stay inside the exact root/project routes; bodies and learner fields are forbidden', () => {
  const root = structuredClone(source);
  for (const n of root.notes) {
    n.url = n.url.slice(base.length); if (n.lab_url) n.lab_url = n.lab_url.slice(base.length);
    for (const p of n.practice) p.url = p.url.slice(base.length);
  }
  assert.equal(validateKnowledgeModel(root).notes.length, 4);
  for (const url of ['https://evil.test/knowledge/a/', '//evil.test/', `${base}/../private`,
    `${base}/playground/%2fprivate`, `${base}/playground/\\private`, `${base}/playground/?note=PRIVATE`]) {
    const changed = structuredClone(source); changed.notes[0].lab_url = url;
    assert.throws(() => validateKnowledgeModel(changed, base));
  }
  for (const patch of [{ body: 'PRIVATE' }, { note: 'PRIVATE' }, { completed: true }, { summary: 'x'.repeat(601) }]) {
    const changed = structuredClone(source); Object.assign(changed.notes[0], patch);
    assert.throws(() => validateKnowledgeModel(changed, base));
  }
  const duplicated = structuredClone(source); duplicated.notes[0].practice = duplicated.notes[3].practice;
  assert.throws(() => validateKnowledgeModel(duplicated, base), 'public step IDs cannot silently point at different notes');
});

test('link IDs/endpoints/kinds/reasons are bounded, unique and never inferred from untrusted extra fields', () => {
  for (const patch of [{ to: 'missing' }, { to: 'a' }, { kind: 'verified-truth' },
    { reason: '' }, { reason: 'x'.repeat(401) }, { confidence: 1 }]) {
    const changed = structuredClone(source); Object.assign(changed.links[0], patch);
    assert.throws(() => validateKnowledgeModel(changed, base));
  }
  for (const extra of [source.links[0], { ...source.links[0], id: 'reverse', from: 'b', to: 'a', kind: 'compare' }]) {
    const changed = structuredClone(source); changed.links.push(extra);
    assert.throws(() => validateKnowledgeModel(changed, base));
  }
  for (const patch of [{ schema_version: 2 }, { ai_assisted: 'yes' }, { notes: [] }, { links: Array(257).fill(source.links[0]) },
    { notes: Array(201).fill(source.notes[0]) }, { history: [] }])
    assert.throws(() => validateKnowledgeModel({ ...source, ...patch }, base));
  for (const prefix of ['/', '//evil.test', '/x/../y', '/has space']) assert.throws(() => validateKnowledgeModel(source, prefix));
});
