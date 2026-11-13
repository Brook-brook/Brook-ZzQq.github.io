import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { retrievalDefaults, literalTerms, validateRetrievalCorpus, createRetrievalRun, evaluateRetrieval,
  toggleRetrievalFragment, formatRetrievalContext, retrievalContextSize, createRetrievalReport } from '../assets/js/atlas/retrieval-models.js';
const corpus = JSON.parse(readFileSync(new URL('../_data/retrieval_samples.json', import.meta.url), 'utf8'));
const defaults = () => createRetrievalRun(retrievalDefaults, corpus);

test('original fixture preserves exact provenance, versioned scope and explicit task annotations', () => {
  assert.equal(corpus.documents.length, 4); assert.equal(corpus.fragments.length, 8); assert.equal(corpus.tasks.length, 4);
  assert.match(corpus.disclosure, /原创.*虚构|原创AI辅助教学/);
  assert.deepEqual(corpus.tasks[0].relevant_ids, ['b-retention-trial', 'c-retention-full']);
  assert.equal(validateRetrievalCorpus(corpus), corpus);
});
test('literal OR ranking counts distinct terms, uses all three public fields and stable ASCII tie order', () => {
  const run = defaults();
  assert.deepEqual(run.ranked.map((f) => [f.id, f.score]), [['a-retention-old', 2], ['b-retention-trial', 2]]);
  assert.equal(run.metrics.precision_at_k, .5); assert.equal(run.metrics.recall_at_k, .5); assert.equal(run.metrics.reciprocal_rank_at_k, .5);
  const duplicate = createRetrievalRun({ ...retrievalDefaults, query: '保留 保留 空间' }, corpus);
  assert.deepEqual(duplicate.ranked, run.ranked);
  assert.deepEqual(literalTerms(' ＡＰＩ\tapi　预算 '), ['api', '预算']);
  const shuffled = structuredClone(corpus); shuffled.fragments.reverse();
  assert.deepEqual(createRetrievalRun(retrievalDefaults, shuffled).ranked, run.ranked);
});
test('version filtering fixes the candidate scope without replacing the full relevance denominator', () => {
  const current = createRetrievalRun({ ...retrievalDefaults, version: 'v2' }, corpus);
  assert.deepEqual(current.ranked.map((f) => f.id), ['b-retention-trial', 'c-retention-full']);
  assert.deepEqual(current.metrics, { requested_k: 2, returned: 2, hits: 2, relevant_total: 2, precision_at_k: 1, recall_at_k: 1, reciprocal_rank_at_k: 1 });
  const old = createRetrievalRun({ ...retrievalDefaults, version: 'v1' }, corpus);
  assert.equal(old.metrics.returned, 1); assert.equal(old.metrics.relevant_total, 2); assert.equal(old.metrics.recall_at_k, 0);
});
test('P at requested k counts missing slots, recall and single-task RR have independent handwritten oracles', () => {
  const rows = [{ id: 'irrelevant' }, { id: 'relevant-b' }, { id: 'relevant-a' }];
  const m = evaluateRetrieval(rows, ['relevant-a', 'relevant-b', 'not-returned', 'also-missing'], 5);
  assert.equal(m.precision_at_k, 2 / 5); assert.equal(m.recall_at_k, 2 / 4); assert.equal(m.reciprocal_rank_at_k, 1 / 2);
  assert.equal(evaluateRetrieval([], ['positive'], 3).precision_at_k, 0);
  assert.equal(evaluateRetrieval([], ['positive'], 3).recall_at_k, 0);
  assert.equal(evaluateRetrieval([], ['positive'], 3).reciprocal_rank_at_k, 0);
  assert.equal(evaluateRetrieval(rows, null, 5), null);
  assert.equal(evaluateRetrieval([], [], 3).recall_at_k, null);
  assert.equal(evaluateRetrieval([], [], 3).reciprocal_rank_at_k, null);
});
test('metric inputs reject repeated IDs, overflow rows, unknown types and absent k', () => {
  for (const f of [() => evaluateRetrieval([{ id: 'a' }, { id: 'a' }], ['a'], 2), () => evaluateRetrieval([{ id: 'a' }], ['a', 'a'], 2),
    () => evaluateRetrieval([{ id: 'a' }, { id: 'b' }], ['a'], 1), () => evaluateRetrieval([], [], 0), () => evaluateRetrieval([], {}, 2)]) assert.throws(f);
});
test('free and empty searches do not infer annotations, model similarity or reality absence', () => {
  const free = createRetrievalRun({ ...retrievalDefaults, task: 'free', query: '备份' }, corpus);
  assert.equal(free.metrics, null); assert.ok(free.ranked.some((r) => r.id === 'd-retention-backup'));
  const empty = createRetrievalRun({ ...retrievalDefaults, query: '' }, corpus);
  assert.deepEqual(empty.ranked, []); assert.deepEqual(empty.terms, []); assert.equal(empty.metrics.recall_at_k, 0);
  const miss = createRetrievalRun({ ...retrievalDefaults, query: '不在语料中的独特词' }, corpus); assert.equal(miss.candidate_count, 0);
});
test('whole-fragment context retains exact section/version/conditions and selection order', () => {
  let run = createRetrievalRun({ ...retrievalDefaults, version: 'v2' }, corpus);
  const first = run; run = toggleRetrievalFragment(run, 'c-retention-full'); run = toggleRetrievalFragment(run, 'b-retention-trial');
  assert.deepEqual(first.selected_ids, []); assert.deepEqual(run.selected_ids, ['c-retention-full', 'b-retention-trial']);
  const context = formatRetrievalContext(run);
  assert.ok(context.indexOf('c-retention-full') < context.indexOf('b-retention-trial'));
  assert.match(context, /v2 \| 第2节：正式空间/); assert.match(context, /只适用于正式空间/); assert.match(context, /只适用于试用空间/);
  assert.equal(retrievalContextSize(run), 167);
  assert.deepEqual(toggleRetrievalFragment(run, 'c-retention-full').selected_ids, ['b-retention-trial']);
});
test('exact boundary allows a complete fragment, rejects one-character overflow without mutation or truncation', () => {
  const seed = defaults(), selected = toggleRetrievalFragment(seed, seed.ranked[0].id), size = retrievalContextSize(selected);
  const exact = createRetrievalRun({ ...retrievalDefaults, context_budget: size }, corpus);
  assert.equal(retrievalContextSize(toggleRetrievalFragment(exact, exact.ranked[0].id)), size);
  const short = createRetrievalRun({ ...retrievalDefaults, context_budget: size - 1 }, corpus);
  assert.throws(() => toggleRetrievalFragment(short, short.ranked[0].id), /没有加入或截断/);
  assert.deepEqual(short.selected_ids, []); assert.throws(() => toggleRetrievalFragment(seed, 'c-retention-full'), /本次返回/);
});
test('Unicode code points including citation separators are not counted as UTF16 units or tokens', () => {
  const own = structuredClone(corpus); own.fragments[0].text += '🪻';
  const a = toggleRetrievalFragment(defaults(), 'a-retention-old');
  const b = toggleRetrievalFragment(createRetrievalRun(retrievalDefaults, own), 'a-retention-old');
  assert.equal(retrievalContextSize(b), retrievalContextSize(a) + 1);
  assert.equal(formatRetrievalContext(b).length, formatRetrievalContext(a).length + 2);
});
test('budget and context selection do not retroactively change retrieval metrics', () => {
  const run = defaults(), selected = toggleRetrievalFragment(run, run.ranked[0].id);
  assert.deepEqual(selected.metrics, run.metrics);
  const large = createRetrievalRun({ ...retrievalDefaults, context_budget: 1000 }, corpus); assert.deepEqual(large.metrics, run.metrics);
});
test('all public source and annotation snapshots are owned and reproducible in the explicit complete report', () => {
  const own = structuredClone(corpus), run = createRetrievalRun(retrievalDefaults, own); own.fragments[0].text = 'MUTATED OUTSIDE';
  const report = createRetrievalReport(toggleRetrievalFragment(run, 'a-retention-old'));
  assert.equal(report.model_called, false); assert.ok(!JSON.stringify(report).includes('MUTATED OUTSIDE'));
  assert.equal(report.snapshot.corpus.fragments.length, 8); assert.ok(report.rules.precision.includes('requested k'));
  let replay = createRetrievalRun(report.snapshot.settings, report.snapshot.corpus);
  for (const id of report.snapshot.selected_ids) replay = toggleRetrievalFragment(replay, id);
  assert.equal(formatRetrievalContext(replay), report.context); assert.equal(retrievalContextSize(replay), report.context_characters);
  assert.deepEqual(replay.metrics, report.snapshot.metrics);
  const duplicate = structuredClone(run); duplicate.selected_ids = ['a-retention-old', 'a-retention-old']; assert.throws(() => createRetrievalReport(duplicate));
});
test('invalid bounds and malformed source/reference identities fail before computing a run', () => {
  for (const change of [{ k: 0 }, { k: 9 }, { context_budget: 39 }, { context_budget: 1001 }, { task: 'invented' }, { version: 'v3' }, { query: 'x'.repeat(201) }, { query: 'a b c d e f g' }]) assert.throws(() => createRetrievalRun({ ...retrievalDefaults, ...change }, corpus));
  for (const mutate of [d => d.fragments.push(d.fragments[0]), d => d.tasks[0].relevant_ids.push('invented'), d => d.fragments[0].document_id = 'missing', d => d.fragments[0].url = 'https://unused.test']) {
    const bad = structuredClone(corpus); mutate(bad); assert.throws(() => validateRetrievalCorpus(bad));
  }
});
