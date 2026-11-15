import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('the current API foundations ZIP runs real JSON and loopback HTTP with isolated stdlib Python', () => {
  const result = spawnSync('python3', ['-B', 'tools/check-api-package.py'], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /12 exact bounded entries/);
  assert.match(result.stdout, /Ran 12 tests/);
  assert.match(result.stdout, /four JSON and eleven real loopback-HTTP cases/);
});
