import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { assertAgentStarterCurrent } from '../tools/agent-starter-manifest.mjs';
const config = JSON.parse(readFileSync('tools/agent-starter-inputs.json'));
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'brook-starter-manifest-'));
  try {
    for (const path of ['tools/agent-starter-inputs.json', 'assets/examples/agent-starter.zip', 'assets/examples/agent-starter.manifest.json', ...config.files.map((row) => row.source)]) {
      mkdirSync(dirname(join(root, path)), { recursive: true }); copyFileSync(path, join(root, path));
    }
    run(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('public Agent starter hash covers the exact reused client, catalog, teaching files and licenses', () => {
  const actual = assertAgentStarterCurrent('.');
  assert.equal(actual.files.length, 10);
  assert.equal(actual.files.find((file) => file.name === 'agent_loop.py').source, 'assets/examples/agent_loop.py');
  assert.ok(actual.files.some((file) => file.name === 'catalog.json'));
});
test('editing the reused client without regenerating the public starter is rejected', () => fixture((root) => {
  writeFileSync(join(root, 'assets/examples/agent_loop.py'), '# changed public source\n');
  assert.throws(() => assertAgentStarterCurrent(root), /Starter archive or inputs changed/);
}));
test('a changed archive never passes with an earlier public hash', () => fixture((root) => {
  writeFileSync(join(root, 'assets/examples/agent-starter.zip'), 'different archive bytes');
  assert.throws(() => assertAgentStarterCurrent(root), /Starter archive or inputs changed/);
}));
test('unsafe and duplicate input paths are rejected rather than reading another file', () => {
  for (const patch of [{ name: '../private.txt' }, { source: '../private.txt' }, { name: 'C:/private.txt' }, { name: config.files[0].name }]) fixture((root) => {
    const changed = structuredClone(config); Object.assign(changed.files[1], patch);
    writeFileSync(join(root, 'tools/agent-starter-inputs.json'), JSON.stringify(changed));
    assert.throws(() => assertAgentStarterCurrent(root), /safe|unique/);
  });
});
