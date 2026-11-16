import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createVectorRun, fitVectorIndex, validateVectorRegistry, vectorCounts, vectorEvidence, vectorReport } from '../assets/js/atlas/vector-models.js';

const corpus = JSON.parse(await readFile(new URL('../_data/retrieval_samples.json', import.meta.url), 'utf8'));
const registry = JSON.parse(await readFile(new URL('../_data/vector_terms.json', import.meta.url), 'utf8'));
const defaults = { query: '保留 空间', weighting: 'tfidf', version: 'all', k: 2 };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} vs ${b}`);
function small() {
  const data = { schema_version: 1, corpus_id: 'tiny-original', title: 'z', disclosure: 'Original synthetic counts, not real observations',
    documents: [{ id: 'tiny-doc', title: 'z', version: 'v1' }],
    fragments: ['aa b', 'b', 'z'].map((text, i) => ({ id: `row-${i}`, document_id: 'tiny-doc', section: 'z', text })),
    tasks: [{ id: 'free', title: 'z', question: 'z', query: 'a b', relevant_ids: null, annotation_reason: 'No annotation' }] };
  return { data, terms: { ...registry, corpus_id: data.corpus_id, vocabulary: ['a', 'b'] } };
}

test('an independent three-row count matrix reproduces smoothed IDF and exact L2/dot arithmetic', () => {
  const { data, terms } = small();
  const run = createVectorRun(data, terms, { ...defaults, query: 'a b' });
  assert.deepEqual(run.index.rows.map((row) => row.counts), [[2, 1], [0, 1], [0, 0]]);
  assert.deepEqual(run.index.document_frequency, [1, 2]);
  const a = Math.log(2) + 1, b = Math.log(4 / 3) + 1;
  close(run.index.inverse_document_frequency[0], a); close(run.index.inverse_document_frequency[1], b);
  const q = Math.sqrt(a * a + b * b), d = Math.sqrt(4 * a * a + b * b);
  close(run.scores[0].cosine, (2 * a * a + b * b) / (q * d));
  close(run.scores[1].cosine, b / q);
  assert.equal(run.scores[2].cosine, null); assert.equal(run.index.rows[2].unit_vector, null);
  close(run.index.rows[0].unit_vector.reduce((sum, value) => sum + value * value, 0), 1);
});

test('count mode applies unity weights and defined orthogonality differs from a zero vector', () => {
  const { data, terms } = small();
  const run = createVectorRun(data, terms, { ...defaults, query: 'a', weighting: 'count' });
  assert.deepEqual(run.index.applied_idf, [1, 1]);
  close(run.scores[0].cosine, 2 / Math.sqrt(5));
  assert.equal(run.scores[1].cosine, 0); assert.equal(run.scores[2].cosine, null);
  assert.deepEqual(run.ranked_ids, ['row-0']);
  const empty = createVectorRun(data, terms, { ...defaults, query: 'unknown' });
  assert.equal(empty.query.norm, 0); assert.equal(empty.query.unit_vector, null);
  assert.ok(empty.scores.every((row) => row.cosine === null)); assert.deepEqual(empty.ranked_ids, []);
});

test('literal counters are non-overlapping within a feature, permit cross-feature overlap and normalize the same way', () => {
  assert.deepEqual(vectorCounts('AAAA', ['a', 'aa']), [4, 2]);
  assert.deepEqual(vectorCounts('Ａa e\u0301 🪻🪻', ['a', 'é', '🪻']), [2, 1, 2]);
  for (const words of [[], [''], ['a', 'a'], ['Ａ'], ['a b'], Array(33).fill('a')]) assert.throws(() => vectorCounts('a', words));
  assert.throws(() => vectorCounts(null, ['a'])); assert.throws(() => vectorCounts('\ud800', ['a']));
});

test('version selection and query changes never refit the source snapshot', () => {
  const all = createVectorRun(corpus, registry, defaults), v2 = createVectorRun(corpus, registry, { ...defaults, version: 'v2' });
  const different = createVectorRun(corpus, registry, { ...defaults, query: '预算 调用' });
  assert.deepEqual(v2.index, all.index); assert.deepEqual(different.index, all.index);
  assert.equal(all.index.document_count, 8); assert.equal(v2.scores.filter((row) => row.included).length, 7);
  assert.ok(v2.ranked_ids.every((id) => id !== 'a-retention-old'));
  assert.equal(all.scores.find((row) => row.id === 'b-retention-trial').cosine, v2.scores.find((row) => row.id === 'b-retention-trial').cosine);
  const changedLabels = structuredClone(corpus); changedLabels.tasks[0].relevant_ids = ['a-retention-old'];
  const ungraded = createVectorRun(changedLabels, registry, defaults);
  assert.deepEqual(ungraded.index, all.index); assert.deepEqual(ungraded.ranked_ids, all.ranked_ids, 'authored relevance does not enter vector fitting or ranking');
});

test('reweighting one query feature can rank the actual old version first without making it applicable', () => {
  const initial = createVectorRun(corpus, registry, defaults);
  const repeat = createVectorRun(corpus, registry, { ...defaults, query: '保留 保留 空间' });
  assert.equal(initial.ranked_ids[0], 'b-retention-trial');
  assert.equal(repeat.ranked_ids[0], 'a-retention-old');
  assert.equal(repeat.scores.find((row) => row.id === repeat.ranked_ids[0]).version, 'v1');
  assert.deepEqual(repeat.literal_baseline, initial.literal_baseline, 'distinct-term baseline ignores multiplicity while the actual vector direction changes');
});

test('a term outside the registry can match the original literal retriever without gaining vector coverage', () => {
  const run = createVectorRun(corpus, registry, { ...defaults, query: '7天' });
  assert.deepEqual(run.ranked_ids, []); assert.equal(run.query.unit_vector, null);
  assert.ok(run.literal_baseline.candidate_count > 0);
  const empty = createVectorRun(corpus, registry, { ...defaults, query: '' });
  assert.equal(empty.literal_baseline.candidate_count, 0); assert.equal(empty.query.unit_vector, null);
});

test('score ties follow ASCII fragment IDs and requested k can exceed positive candidates', () => {
  const { data, terms } = small();
  data.fragments = [{ ...data.fragments[0], id: 'z-row', text: 'a' }, { ...data.fragments[1], id: 'a-row', text: 'a' }];
  const run = createVectorRun(data, terms, { ...defaults, query: 'a', k: 8 });
  assert.deepEqual(run.ranked_ids, ['a-row', 'z-row']); assert.equal(run.candidate_count, 2);
  assert.equal(run.index.document_frequency[1], 0);
  close(run.index.inverse_document_frequency[1], Math.log(3) + 1);
});

test('the current vocabulary and complete per-feature contributions are inspectable without changing the run', () => {
  const run = createVectorRun(corpus, registry, defaults), before = vectorReport(run);
  assert.equal(registry.vocabulary.length, 14); assert.equal(run.index.rows.length, 8);
  for (const row of run.scores) {
    const evidence = vectorEvidence(run, row.id);
    close(evidence.terms.reduce((sum, term) => sum + term.contribution, 0), row.cosine);
  }
  assert.deepEqual(vectorReport(run), before);
  assert.ok(Object.isFrozen(run) && Object.isFrozen(run.index.rows[0].weighted));
  assert.throws(() => { run.query.weighted[0] = 100; }, TypeError);
  assert.throws(() => vectorEvidence(run, 'missing'));
});

test('malformed settings/registries and altered numerical records cannot become exported evidence', () => {
  for (const draft of [{ ...defaults, k: true }, { ...defaults, k: 0 }, { ...defaults, k: 9 }, { ...defaults, version: 'v3' }, { ...defaults, weighting: 'semantic' }, { ...defaults, query: 'a'.repeat(201) }, { ...defaults, query: 'a b c d e f g' }, { ...defaults, private_note: 'not a public input' }]) assert.throws(() => createVectorRun(corpus, registry, draft));
  for (const bad of [{ ...registry, corpus_id: 'other' }, { ...registry, private_note: 'no' }, { ...registry, vocabulary: ['same', 'same'] }, { ...registry, source_kind: 'neural_embedding' }]) assert.throws(() => validateVectorRegistry(bad, corpus));
  assert.throws(() => fitVectorIndex(corpus, registry, 'bad'));
  const tampered = structuredClone(createVectorRun(corpus, registry, defaults)); tampered.scores[0].cosine = 99;
  assert.throws(() => vectorReport(tampered)); assert.throws(() => vectorEvidence(tampered, tampered.scores[0].id));
  const report = vectorReport(createVectorRun(corpus, registry, defaults));
  assert.equal(report.model_called, false); assert.equal(report.kind, 'brook-lexical-vector-search');
  assert.equal(report.snapshot.registry.id, 'brook-lexical-vectors-v1');
  assert.ok(!Object.hasOwn(report.snapshot, 'selected_id'));
});

test('nonfinite replacements cannot masquerade as the null result of an undefined cosine', () => {
  const original = createVectorRun(corpus, registry, { ...defaults, query: '7天' });
  for (const invalid of [NaN, Infinity, undefined, false, 0]) {
    const run = structuredClone(original); run.scores[0].cosine = invalid;
    assert.throws(() => vectorReport(run), 'a JSON-stringification null equivalence is not record validation');
  }
  const run = structuredClone(original); run.query.unit_vector = NaN;
  assert.throws(() => vectorEvidence(run, 'a-retention-old'));
});
