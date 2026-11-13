import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateBinary, validateEvaluationDataset, negativeBaseline, exportEvaluation } from '../assets/js/atlas/evaluation-models.js';

const raw = JSON.parse(await readFile(new URL('../_data/evaluation_samples.json', import.meta.url), 'utf8'));
const dataset = validateEvaluationDataset(raw);
const sample = (id, label, score) => ({ id, label, score });

test('hand-computed reference distinguishes precision, recall and F1', () => {
  const result = evaluateBinary([sample('a', 0, 10), sample('b', 1, 90), sample('c', 0, 20), sample('d', 1, 30)], 50);
  assert.deepEqual(result.count, { TP: 1, FP: 0, FN: 1, TN: 2 });
  assert.equal(result.accuracy, .75); assert.equal(result.precision, 1);
  assert.equal(result.recall, .5); assert.equal(result.f1, 2 / 3);
});
test('published default example is exactly auditable against the original fixture', () => {
  const result = evaluateBinary(dataset.scenarios.rare, 50);
  assert.deepEqual(result.count, { TP: 1, FP: 9, FN: 1, TN: 9 });
  assert.equal(result.precision, .1); assert.equal(result.recall, .5);
  assert.equal(result.f1, 1 / 6); assert.equal(result.accuracy, .5);
  const baseline = negativeBaseline(dataset.scenarios.rare);
  assert.equal(baseline.accuracy, .9); assert.equal(baseline.recall, 0); assert.equal(baseline.precision, null);
});
test('inclusive threshold, endpoints and undefined denominators stay distinct from zero', () => {
  const tie = evaluateBinary([sample('a', 1, 50), sample('b', 0, 49)], 50);
  assert.equal(tie.count.TP, 1); assert.equal(tie.count.TN, 1);
  const nonePredicted = evaluateBinary(dataset.scenarios.rare, 100);
  assert.equal(nonePredicted.precision, null); assert.equal(nonePredicted.recall, 0); assert.equal(nonePredicted.f1, 0);
  const noPositives = evaluateBinary(dataset.scenarios.none, 100);
  assert.equal(noPositives.accuracy, 1);
  for (const key of ['precision', 'recall', 'f1']) assert.equal(noPositives[key], null);
  const falsePositives = evaluateBinary(dataset.scenarios.none, 0);
  assert.equal(falsePositives.precision, 0); assert.equal(falsePositives.recall, null); assert.equal(falsePositives.f1, 0);
});
test('all thresholds conserve counts, do not mutate source and recall is monotone', () => {
  const before = JSON.stringify(raw);
  for (const rows of Object.values(dataset.scenarios)) {
    let lastPositive = Infinity, lastRecall = Infinity;
    for (let threshold = 0; threshold <= 100; threshold++) {
      const result = evaluateBinary(rows, threshold);
      assert.equal(Object.values(result.count).reduce((a, b) => a + b), rows.length);
      assert.equal(result.rows.length, rows.length);
      assert.ok(result.predictedPositive <= lastPositive);
      if (result.recall !== null) { assert.ok(result.recall <= lastRecall); lastRecall = result.recall; }
      for (const key of ['accuracy', 'precision', 'recall', 'f1']) assert.ok(result[key] === null || result[key] >= 0 && result[key] <= 1);
      lastPositive = result.predictedPositive;
    }
    negativeBaseline(rows);
  }
  assert.equal(JSON.stringify(raw), before);
  assert.ok(evaluateBinary(dataset.scenarios.rare, 39).precision > evaluateBinary(dataset.scenarios.rare, 40).precision);
  assert.ok(evaluateBinary(dataset.scenarios.rare, 40).precision < evaluateBinary(dataset.scenarios.rare, 50).precision);
});
test('bad data is rejected before evaluation rather than silently dropping records', () => {
  for (const rows of [[], [sample('a', 2, 50)], [sample('a', 1, NaN)], [sample('a', 1, -1)], [sample('a', 1, 101)], [sample('<script>', 1, 50)], [sample('a', 1, 50), sample('a', 0, 20)], Array(501).fill(sample('a', 1, 50))]) assert.throws(() => evaluateBinary(rows));
  for (const threshold of [-1, 101, Infinity, NaN, '50']) assert.throws(() => evaluateBinary(dataset.scenarios.rare, threshold));
  assert.throws(() => validateEvaluationDataset({ ...raw, schema_version: 2 }));
  const wrongRatio = structuredClone(raw); wrongRatio.samples[0].labels.rare = 0;
  assert.throws(() => validateEvaluationDataset(wrongRatio));
});
test('explicit export contains original samples and reproducible parameters only', () => {
  const record = JSON.parse(JSON.stringify(exportEvaluation(dataset, 'balanced', 60)));
  assert.equal(record.synthetic, true); assert.equal(record.evaluation.rows.length, 20);
  assert.deepEqual(evaluateBinary(record.evaluation.rows, record.evaluation.threshold).count, record.evaluation.count);
  assert.equal(record.baseline.strategy, 'always predict 0');
  assert.deepEqual(record.evaluation.rows.map(({ id, label, score }) => ({ id, label, score })), dataset.scenarios.balanced);
  assert.throws(() => exportEvaluation(dataset, 'unknown', 50));
});
