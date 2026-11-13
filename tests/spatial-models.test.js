import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSpatialDataset, validateSpatialParameters, predictKnn, compareSpatialValidation, exportSpatialValidation } from '../assets/js/atlas/spatial-models.js';
const raw = JSON.parse(await readFile(new URL('../_data/spatial_samples.json', import.meta.url), 'utf8'));

test('uniform Euclidean neighbors have hand-computable votes and stable distance ties', () => {
  const rows = [{ id: 'B', x: 0, y: 2, label: 1 }, { id: 'A', x: 2, y: 0, label: 0 }, { id: 'C', x: 0, y: 3, label: 1 }];
  assert.deepEqual(predictKnn(rows, { x: 0, y: 0 }, 1).neighbors, [{ id: 'A', label: 0, distance: 2 }]);
  const result = predictKnn(rows, { x: 0, y: 0 }, 3);
  assert.equal(result.positiveVotes, 2); assert.equal(result.score, 2 / 3 * 100); assert.equal(result.predicted, 1);
});
test('prediction never reads the query label, and rejects malformed training input', () => {
  const query = { x: 0, y: 0, get label() { throw new Error('held-out label read'); }, get labels() { throw new Error('held-out labels read'); } };
  assert.equal(predictKnn([{ id: 'a', x: 3, y: 4, label: 1 }], query, 1).neighbors[0].distance, 5);
  for (const training of [[], [{ id: 'a', x: NaN, y: 1, label: 1 }], [{ id: 'a', x: 1, y: 1, label: 2 }], [{ id: 'a', x: 1, y: 1, label: 0 }, { id: 'a', x: 2, y: 2, label: 1 }]]) assert.throws(() => predictKnn(training, query, 1));
  assert.throws(() => predictKnn([{ id: 'a', x: 0, y: 0, label: 0 }], query, 3));
});
test('default published result agrees with independent Python distance and split oracle', () => {
  const result = compareSpatialValidation(raw);
  const random = result.protocols.random, spatial = result.protocols.spatial;
  assert.equal(random.evaluation.actualPositive, 9); assert.equal(random.evaluation.accuracy, .9);
  assert.equal(spatial.evaluation.actualPositive, 20); assert.equal(spatial.evaluation.accuracy, 0);
  assert.equal(random.mean_nearest_training_distance.toFixed(3), '74.358');
  assert.equal(spatial.mean_nearest_training_distance.toFixed(3), '183.540');
  assert.equal(random.predictions[0].id, 'S03');
  assert.deepEqual(random.predictions[0].neighbors.map((p) => p.id), ['S11', 'S04', 'S02']);
  assert.deepEqual(spatial.predictions[0].neighbors.map((p) => p.id), ['S05', 'S41', 'S42']);
});
test('diagonal counterexample preserves undefined recall and defeats universal method ranking', () => {
  const result = compareSpatialValidation(raw, { pattern: 'diagonal' });
  assert.equal(result.protocols.random.evaluation.accuracy, .9);
  assert.equal(result.protocols.spatial.evaluation.accuracy, 1);
  assert.equal(result.protocols.spatial.evaluation.actualPositive, 0);
  assert.equal(result.protocols.spatial.evaluation.recall, null);
});
test('all split choices conserve 80 disjoint samples and neighbors only use training IDs', () => {
  const before = JSON.stringify(raw);
  for (const block of [0, 1, 2, 3]) for (const seed of [0, 42, 9999]) for (const k of [1, 3, 5, 7]) {
    const result = compareSpatialValidation(raw, { seed, k, block });
    for (const group of Object.values(result.protocols)) {
      const train = new Set(group.train_ids), testIds = new Set(group.test_ids);
      assert.equal(train.size, 60); assert.equal(testIds.size, 20);
      assert.ok(group.test_ids.every((id) => !train.has(id)));
      assert.equal(new Set([...train, ...testIds]).size, 80);
      assert.ok(group.predictions.every((p) => p.neighbors.length === k && p.neighbors.every((n) => train.has(n.id))));
    }
  }
  assert.equal(JSON.stringify(raw), before);
  const first = compareSpatialValidation(raw, { seed: 0, block: 0 });
  const next = compareSpatialValidation(raw, { seed: 99, block: 1 });
  assert.notDeepEqual(first.protocols.random.test_ids, next.protocols.random.test_ids);
  assert.deepEqual(first.protocols.random.test_ids, compareSpatialValidation(raw, { seed: 0, block: 3 }).protocols.random.test_ids);
});
test('changing held-out labels changes scoring, never the corresponding predictions', () => {
  const changed = structuredClone(raw);
  changed.points.filter((p) => p.block === 0).forEach((p) => { p.labels.zones = 1 - p.labels.zones; });
  const first = compareSpatialValidation(raw).protocols.spatial;
  const next = compareSpatialValidation(changed).protocols.spatial;
  assert.deepEqual(first.predictions, next.predictions);
  assert.notDeepEqual(first.evaluation.count, next.evaluation.count);
});
test('bounded source/parameter validation rejects bad geometry, duplicated IDs and schema', () => {
  for (const mutation of [(d) => { d.schema_version = 2; }, (d) => { d.unit = 'EPSG:4326'; }, (d) => { d.points[0].x = 900; }, (d) => { d.points[1].id = d.points[0].id; }, (d) => { d.points[0].block = 3; }, (d) => { d.points[0].labels.zones = 2; }]) {
    const changed = structuredClone(raw); mutation(changed); assert.throws(() => validateSpatialDataset(changed));
  }
  for (const parameters of [{ seed: -1 }, { seed: 1.5 }, { seed: 10000 }, { seed: NaN }, { block: 4 }, { k: 2 }, { pattern: 'real' }]) assert.throws(() => validateSpatialParameters(parameters));
});
test('explicit report includes original data and both reproducible protocols, without mutations', () => {
  const report = JSON.parse(JSON.stringify(exportSpatialValidation(raw, { pattern: 'diagonal', block: 3, seed: 0, k: 7 })));
  assert.equal(report.synthetic, true); assert.equal(report.source.points.length, 80);
  assert.deepEqual(compareSpatialValidation(report.source, report.parameters).protocols, report.protocols);
  assert.deepEqual(report.source, validateSpatialDataset(raw));
});
