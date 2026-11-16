import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('the public neural ZIP executes independent differences for all nine manual derivatives and two actual CLI records', () => {
  const result = spawnSync('python3', ['-I', '-S', '-B', 'tools/check-neural-package.py', '--json'], { encoding: 'utf8', timeout: 30000, maxBuffer: 128 * 1024 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, /8 exact bounded entries/); assert.match(result.stderr, /Ran 8 tests/);
  const { records } = JSON.parse(result.stdout);
  assert.deepEqual(records.map((row) => row.hidden_activation), ['tanh', 'identity']);
  for (const record of records) {
    assert.equal(record.parameters_updated, false); assert.equal(record.external_model_service, false);
    assert.deepEqual(record.architecture, [2, 2, 1]);
    assert.equal(record.rows.length, 4); assert.equal(Object.keys(record.mean_gradient).length, 9);
    assert.ok(Number.isFinite(record.mean_binary_cross_entropy));
    for (const row of record.rows) assert.ok(Math.abs(row.chain_w00.reduce((product, factor) => product * factor, 1) - row.mean_gradient_contribution.w00) < 1e-12);
  }
});
