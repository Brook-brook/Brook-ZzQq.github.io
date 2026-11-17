import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createVectorRun, vectorReport } from '../assets/js/atlas/vector-models.js';

test('the exact vector ZIP runs ten real stdlib checks/five CLIs and matches complete JavaScript calculations within tolerance', async () => {
  const result = spawnSync('python3', ['-I', '-S', '-B', 'tools/check-vector-package.py', '--json'], { encoding: 'utf8', timeout: 60000, maxBuffer: 2 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Ran 10 tests/);
  const actual = JSON.parse(result.stdout).records;
  const corpus = JSON.parse(await readFile('_data/retrieval_samples.json', 'utf8'));
  const registry = JSON.parse(await readFile('_data/vector_terms.json', 'utf8'));
  function compare(expected, observed, path = 'record') {
    if (typeof expected === 'number') {
      assert.equal(typeof observed, 'number', path);
      assert.ok(Math.abs(expected - observed) <= 1e-12 * Math.max(1, Math.abs(expected)), `${path}: ${expected} vs ${observed}`);
    } else if (Array.isArray(expected)) {
      assert.ok(Array.isArray(observed), path); assert.equal(expected.length, observed.length, path);
      expected.forEach((row, i) => compare(row, observed[i], `${path}[${i}]`));
    } else if (expected && typeof expected === 'object') {
      assert.deepEqual(Object.keys(expected).sort(), Object.keys(observed).sort(), path);
      for (const key of Object.keys(expected)) compare(expected[key], observed[key], `${path}.${key}`);
    } else assert.equal(expected, observed, path);
  }
  assert.equal(actual.length, 5);
  for (const record of actual) compare(vectorReport(createVectorRun(corpus, registry, record.snapshot.settings)), record);
});
