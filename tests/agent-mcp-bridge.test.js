import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('the bridge ZIP matches explicit sources and its actual pure fixture/tool components run without SDKs', () => {
  const result = spawnSync('python3', ['tools/check-bridge-package.py'], { encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /16 exact bounded entries/);
  assert.match(result.stdout, /no SDK, protocol or model executed/);
});

test('bridge inputs reuse canonical tools, authored fixtures and the previous actual MCP server', async () => {
  const manifest = JSON.parse(await readFile('assets/examples/agent-mcp-bridge.manifest.json', 'utf8'));
  for (const [name, source, transform] of [
    ['campus_tools.py', 'assets/examples/agent_loop.py', 'campus-read-tools-v1'],
    ['provider_fixtures.py', '_includes/agent-starter/demo_offline.py', 'scripted-provider-fixtures-v1']
  ]) {
    const row = manifest.files.find((row) => row.name === name);
    assert.equal(row.source, source); assert.equal(row.transform, transform);
    assert.equal(row.source_sha256, createHash('sha256').update(await readFile(source)).digest('hex'));
  }
  assert.equal(manifest.files.find((row) => row.name === 'server.py').source, '_includes/mcp-starter/server.py');
  assert.equal(await readFile('_includes/agent-mcp-bridge/requirements.txt', 'utf8'), 'openai==3.50.0\nmcp==2.3.0\nhttpx2==2.16.0\n');
});
