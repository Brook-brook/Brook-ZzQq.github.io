import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('MCP teaching ZIP is current and its actual read functions execute with isolated standard-library Python', () => {
  // Python3 is already used by the repository's CI browser server. No MCP or
  // model SDK is installed or run by this website build check.
  const result = spawnSync('python3', ['tools/check-mcp-package.py'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /13 exact bounded entries/);
  assert.match(result.stdout, /isolated standard-library tools/);
});
test('the pure module records its canonical client source while the MCP package declares no model SDK', () => {
  const manifest = JSON.parse(readFileSync('assets/examples/mcp-starter.manifest.json', 'utf8'));
  const derived = manifest.files.find((row) => row.name === 'campus_tools.py');
  assert.equal(derived.source, 'assets/examples/agent_loop.py');
  assert.equal(derived.transform, 'campus-read-tools-v1');
  assert.equal(derived.source_sha256, createHash('sha256').update(readFileSync(derived.source)).digest('hex'));
  const requirements = readFileSync('_includes/mcp-starter/requirements.txt', 'utf8');
  assert.equal(requirements, 'mcp==2.3.0\nhttpx2==2.16.0\n');
});
