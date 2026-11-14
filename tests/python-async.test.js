import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('the current async ZIP runs six real stdlib contracts and both standalone entries', () => {
  const result = spawnSync('python3', ['tools/check-async-package.py'], { encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /6 exact bounded entries/);
  assert.match(result.stdout, /Ran 6 tests/);
  assert.match(result.stdout, /two CLI cases with isolated stdlib/);
});
