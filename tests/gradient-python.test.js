import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { advanceGradientRun, createGradientRun, gradientReport } from '../assets/js/atlas/gradient-models.js';

const fixture = JSON.parse(await readFile('_data/gradient_samples.json', 'utf8'));
test('the exact public regression ZIP executes twelve stdlib checks and five actual CLI schedules', () => {
  const result = spawnSync('python3', ['-I', '-S', '-B', 'tools/check-regression-package.py', '--json'], { encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, /9 exact bounded entries/); assert.match(result.stderr, /Ran 12 tests/);
  const { cases } = JSON.parse(result.stdout);
  const schedules = {
    first: { rates: [0.05], initial: { w: 0, b: 0 } },
    stable: { rates: Array(120).fill(0.05), initial: { w: 0, b: 0 } },
    oscillating: { rates: Array(15).fill(0.2), initial: { w: 0, b: 0 } },
    guarded: { rates: Array(120).fill(0.5), initial: { w: 0, b: 0 } },
    mixed: { rates: [0.01, ...Array(10).fill(0.08)], initial: { w: -1, b: 2 } }
  };
  function compare(actual, expected, path = '') {
    if (typeof expected === 'number') assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)), `${path}: ${actual} != ${expected}`);
    else if (expected !== null && typeof expected === 'object') {
      assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), path);
      for (const key of Object.keys(expected)) compare(actual[key], expected[key], `${path}.${key}`);
    } else assert.equal(actual, expected, path);
  }
  assert.deepEqual(cases.map((row) => row.case), Object.keys(schedules));
  for (const actual of cases) {
    const { rates, initial } = schedules[actual.case]; let run = createGradientRun(fixture, initial);
    for (const rate of rates) { if (run.stop) break; run = advanceGradientRun(run, rate); }
    compare(actual.run, gradientReport(run).run, actual.case);
    assert.equal(actual.model_kind, 'single-feature-linear-regression'); assert.equal(actual.external_model_service, false);
  }
});
