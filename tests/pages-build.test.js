import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

test('Pages artifact guard rejects the raw Jekyll checkout that caused the plain page', () => {
  const check = spawnSync(process.execPath, [resolve('tools/check-pages-build.mjs'), resolve('.')], { encoding: 'utf8' });
  assert.notEqual(check.status, 0);
  assert.match(check.stderr, /Homepage must be rendered through the HTML layout/);
});
