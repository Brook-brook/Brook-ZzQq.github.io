import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { interfaceCaseInputs, validateInterfaceCase } from '../tools/interface-case.mjs';

const original = JSON.parse(await readFile('assets/examples/agent-interface-case.json', 'utf8'));
const expected = await interfaceCaseInputs();
test('saved actual-CLI case stays tied to public source ZIPs/catalog/generator and an independent distance reference', () => {
  assert.equal(validateInterfaceCase(original, expected), original);
});
test('stale sources, private fields, invented model/permission evidence and consistently wrong numeric results are rejected', () => {
  for (const edit of [
    (value) => value.archive_sources[0].sha256 = '0'.repeat(64),
    (value) => value.generator_sha256 = '0'.repeat(64),
    (value) => value.data_license.license_url = 'https://example.invalid/removed-license',
    (value) => value.private_note = 'SYNTHETIC_PRIVATE_FIELD',
    (value) => value.generated_at = '2026-02-31T10:00:00Z',
    (value) => value.cases[0].model_called = true,
    (value) => value.cases[1].provider_call_id = 'invented_wire_id',
    (value) => value.cases[2].counts.server_executions = 1,
    (value) => value.cases.forEach((row) => row.selected_result.result.distance_m = 999)
  ]) {
    const value = structuredClone(original); edit(value);
    assert.throws(() => validateInterfaceCase(value, expected));
  }
  assert.equal(original.cases[0].model_called, false);
});
