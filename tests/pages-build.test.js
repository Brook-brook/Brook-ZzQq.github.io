import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { assertNoPythonCache } from '../tools/build-cache.mjs';

test('Pages artifact guard rejects the raw Jekyll checkout that caused the plain page', () => {
  const check = spawnSync(process.execPath, [resolve('tools/check-pages-build.mjs'), resolve('.')], { encoding: 'utf8' });
  assert.notEqual(check.status, 0);
  assert.match(check.stderr, /Homepage must be rendered through the HTML layout/);
});

test('public Python examples are allowed while generated caches and venvs are rejected', () => {
  const root = mkdtempSync(join(tmpdir(), 'atlas-artifact-'));
  try {
    mkdirSync(join(root, 'assets', 'examples'), { recursive: true });
    writeFileSync(join(root, 'assets', 'examples', 'ai_request.py'), 'print("original public example")');
    assert.doesNotThrow(() => assertNoPythonCache(root));
    for (const name of ['__pycache__', '.venv', 'example.pyc']) {
      const path = join(root, 'assets', 'examples', name);
      if (name.endsWith('.pyc')) writeFileSync(path, 'fixture bytecode'); else mkdirSync(path);
      assert.throws(() => assertNoPythonCache(root), /Generated Python development files must not be published/);
      rmSync(path, { recursive: true });
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
