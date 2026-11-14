import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute, sep } from 'node:path';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const safe = (value) => typeof value === 'string' && /^[A-Za-z0-9_-][A-Za-z0-9_./-]*$/.test(value) &&
  value.split('/').every((part) => part !== '' && part !== '.' && part !== '..' && !part.startsWith('.'));

// Verify a committed archive against every explicit public source, without a
// second implementation of its tools, ZIP format, Python runtime or SDK.
export function assertAgentStarterCurrent(directory) {
  const root = realpathSync(directory);
  const read = (path) => {
    assert.ok(safe(path), 'Starter inputs require safe explicit relative paths');
    const absolute = realpathSync(resolve(root, path)), part = relative(root, absolute);
    assert.ok(part !== '..' && !part.startsWith('..' + sep) && !isAbsolute(part), 'Starter source must stay inside the project');
    return readFileSync(absolute);
  };
  const config = JSON.parse(read('tools/agent-starter-inputs.json'));
  assert.deepEqual(Object.keys(config).sort(), ['files', 'root', 'schema_version']);
  assert.equal(config.schema_version, 1); assert.equal(config.root, 'brooks-agent-starter');
  assert.ok(Array.isArray(config.files) && config.files.length >= 1 && config.files.length <= 20);
  const names = new Set();
  const files = config.files.map((item) => {
    assert.deepEqual(Object.keys(item).sort(), ['name', 'source']);
    assert.ok(safe(item.name) && item.name !== 'MANIFEST.json' && !names.has(item.name), 'Starter entry names must be unique safe paths');
    names.add(item.name);
    const content = read(item.source);
    assert.ok(content.length > 0 && content.length <= 256 * 1024, 'Starter input must be bounded');
    return { name: item.name, source: item.source, sha256: hash(content), bytes: content.length };
  });
  const archive = read('assets/examples/agent-starter.zip');
  assert.ok(archive.length > 0 && archive.length <= 512 * 1024, 'Public starter archive must be bounded');
  const manifest = JSON.parse(read('assets/examples/agent-starter.manifest.json'));
  assert.deepEqual(manifest, { schema_version: 1, kind: 'brook-agent-starter', root: config.root, files,
    archive: { path: 'assets/examples/agent-starter.zip', sha256: hash(archive), bytes: archive.length } },
  'Starter archive or inputs changed: run python3 tools/build-agent-starter.py');
  return manifest;
}
