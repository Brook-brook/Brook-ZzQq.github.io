import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const paths = ['assets/examples/agent-starter.zip', 'assets/examples/mcp-starter.zip', 'assets/examples/agent-mcp-bridge.zip'];
export async function interfaceCaseInputs() {
  const catalogBytes = await readFile('_includes/agent-starter/catalog.json');
  return { catalog: JSON.parse(catalogBytes), catalogHash: hash(catalogBytes),
    generatorHash: hash(await readFile('tools/generate-agent-interface-case.py')),
    archives: await Promise.all(paths.map(async (path) => ({ path, sha256: hash(await readFile(path)) }))) };
}

function keys(value, names) {
  assert.ok(value && !Array.isArray(value) && typeof value === 'object');
  assert.deepEqual(Object.keys(value).sort(), names.slice().sort(), 'saved evidence fields changed');
}

export function validateInterfaceCase(value, expected) {
  keys(value, ['schema_version', 'kind', 'generated_at', 'python_version', 'dependencies', 'generator_sha256', 'archive_sources', 'catalog', 'catalog_sha256', 'data_license', 'cases', 'scope']);
  assert.equal(value.schema_version, 1); assert.equal(value.kind, 'brook-agent-interface-teaching-case');
  assert.match(value.generated_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  assert.ok(Number.isFinite(Date.parse(value.generated_at)));
  assert.equal(new Date(value.generated_at).toISOString(), value.generated_at.replace('Z', '.000Z'));
  assert.match(value.python_version, /^3\.(?:1[1-9]|[2-9]\d)\.\d+$/);
  assert.deepEqual(value.dependencies, { openai: '3.50.0', mcp: '2.3.0', httpx2: '2.16.0' });
  assert.equal(value.generator_sha256, expected.generatorHash, 'generator changed; actually replay before publishing');
  assert.equal(value.catalog_sha256, expected.catalogHash); assert.deepEqual(value.catalog, expected.catalog);
  assert.deepEqual(value.data_license, { license: 'ODbL-1.0', license_url: 'https://opendatacommons.org/licenses/odbl/1-0/',
    attribution: 'OpenStreetMap contributors', attribution_url: 'https://www.openstreetmap.org/copyright' });
  assert.deepEqual(value.archive_sources.map(({ path, sha256 }) => ({ path, sha256 })), expected.archives, 'source ZIPs changed; actually replay before publishing');
  assert.deepEqual(value.archive_sources.map((row) => row.profile), ['agent', 'mcp', 'bridge']);
  value.archive_sources.forEach((row) => keys(row, ['profile', 'path', 'sha256']));
  assert.ok(typeof value.scope === 'string' && value.scope.length <= 1000 && value.scope.includes('no live model'));
  assert.equal(value.cases.length, 3);
  assert.deepEqual(value.cases.map((row) => row.id), ['direct-function', 'mcp-client', 'host-mcp-bridge']);
  const counts = [{ provider_requests_attempted: 2, local_dispatch_attempts: 1, observations: 1 },
    { returned_public_cases: 3, returned_rejected_cases: 2 },
    { provider_requests_attempted: 2, mcp_call_attempts: 1, receipts_accepted: 1 }];
  for (const [i, row] of value.cases.entries()) {
    keys(row, ['id', 'scope', 'model_called', 'final_text_returned', 'answer_fact_checked', 'counts', 'provider_call_id', 'session', 'selected_result']);
    assert.ok(typeof row.scope === 'string' && row.scope.length <= 500);
    assert.equal(row.model_called, false); assert.deepEqual(row.counts, counts[i]);
    assert.equal(row.final_text_returned, i !== 1); assert.equal(row.answer_fact_checked, i === 1 ? null : false);
    assert.equal(row.provider_call_id, i === 1 ? null : 'distance_1');
    assert.deepEqual(row.selected_result, value.cases[0].selected_result);
  }
  assert.equal(value.cases[0].session, null);
  assert.deepEqual(value.cases[1].session, { protocol_version: '2026-07-28', discovery_received: true, self_reported_server: { name: 'Brook public campus read tools', version: '1.0.0-teaching' } });
  assert.deepEqual(value.cases[2].session, { protocol_version: '2026-07-28', discovery_received: true, allowed_tools: ['find_places', 'measure_distance', 'nearby_places'] });
  const result = value.cases[0].selected_result;
  keys(result, ['catalog_version', 'source_checked', 'coordinate_system', 'catalog_size', 'result']);
  assert.equal(result.catalog_version, expected.catalog.version); assert.equal(result.source_checked, expected.catalog.checked);
  assert.equal(result.coordinate_system, 'WGS84'); assert.equal(result.catalog_size, 6);
  keys(result.result, ['from', 'to', 'distance_m', 'earth_radius_m']);
  const points = ['main-library', 'medical-library'].map((id) => expected.catalog.places.find((row) => row.id === id));
  const snapshot = (row) => Object.fromEntries(['id', 'name', 'coordinates', 'osm', 'source'].map((key) => [key, row[key]]));
  assert.deepEqual(result.result.from, snapshot(points[0])); assert.deepEqual(result.result.to, snapshot(points[1]));
  const [[lon1, lat1], [lon2, lat2]] = points.map((row) => row.coordinates.map((n) => n * Math.PI / 180));
  const reference = 6371008.8 * Math.acos(Math.max(-1, Math.min(1, Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1))));
  assert.equal(result.result.earth_radius_m, 6371008.8);
  assert.ok(typeof result.result.distance_m === 'number' && Number.isFinite(result.result.distance_m) && Math.abs(result.result.distance_m - reference) < 0.001, 'independent numeric reference differs');
  return value;
}
