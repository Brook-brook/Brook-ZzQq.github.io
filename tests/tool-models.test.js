import test from 'node:test';
import assert from 'node:assert/strict';
import { EARTH_RADIUS_M, MAX_CALL_CHARS, validateToolCatalog, parseToolCall,
  executeLocalTool, sphericalDistance, acceptToolObservation, createToolReport } from '../assets/js/atlas/tool-models.js';

// Synthetic model-test fixture, never published as campus data.
const fixture = {
  version: 1, checked: '2026-11-02', coordinateSystem: 'WGS84', license: 'ODbL-1.0',
  attribution: 'Synthetic fixture only', note: 'Not real campus records',
  places: [
    { id: 'a', name: '甲图书馆', english: 'Alpha Library', category: 'library', tags: ['library', 'study'], coordinates: [120.07, 30.30], source: 'https://mapcarta.com/W1', osm: 'way/1' },
    { id: 'b', name: '乙图书馆', english: 'Beta Library', category: 'library', tags: ['library', 'study'], coordinates: [120.071, 30.30], source: 'https://mapcarta.com/W2', osm: 'way/2' },
    { id: 'c', name: '教学楼', english: 'Building', category: 'teaching', tags: ['teaching'], coordinates: [120.07, 30.302], source: 'https://mapcarta.com/W3', osm: 'way/3' }
  ]
};
const distanceCall = { name: 'measure_distance', arguments: { from: 'a', to: 'b' } };
const nearby = (radius_m) => ({ name: 'nearby_places', arguments: { center: 'a', radius_m } });
const parse = (value) => parseToolCall(JSON.stringify(value), fixture);

test('spherical distance matches analytic arcs, symmetry and an independent cosine reference', () => {
  assert.equal(sphericalDistance([0, 0], [0, 0]), 0);
  assert.ok(Math.abs(sphericalDistance([0, 0], [1, 0]) - EARTH_RADIUS_M * Math.PI / 180) < 1e-8);
  assert.ok(Math.abs(sphericalDistance([0, 0], [180, 0]) - EARTH_RADIUS_M * Math.PI) < 1e-6);
  assert.ok(Math.abs(sphericalDistance([0, 0], [90, 0]) - EARTH_RADIUS_M * Math.PI / 2) < 1e-7);
  for (const from of fixture.places) for (const to of fixture.places) {
    const a = from.coordinates, b = to.coordinates, rad = (n) => n * Math.PI / 180;
    const cosine = Math.sin(rad(a[1])) * Math.sin(rad(b[1])) + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(a[0] - b[0]));
    const independent = EARTH_RADIUS_M * Math.acos(Math.min(1, Math.max(-1, cosine)));
    const actual = sphericalDistance(a, b);
    assert.ok(Math.abs(actual - independent) < .15, 'cosine reference loses precision near zero');
    assert.equal(actual, sphericalDistance(b, a));
  }
  for (const p of [[181, 0], [0, 91], [NaN, 0], ['1', 0], [Infinity, 0], [1], null])
    assert.throws(() => sphericalDistance(p, [0, 0]));
});

test('exact bounded call contracts reject unknown tools, prototype keys, types and extra fields', () => {
  assert.deepEqual(parse(distanceCall), distanceCall);
  assert.throws(() => parseToolCall('{invalid}', fixture), /JSON/);
  for (const v of [null, [], {}, { ...distanceCall, prompt: 'publish' },
    { name: 'publish_notes', arguments: {} }, { name: '__proto__', arguments: {} },
    { ...distanceCall, arguments: { from: 'a', to: 'missing' } },
    { ...distanceCall, arguments: { from: ['a'], to: 'b' } },
    { ...distanceCall, arguments: { from: 'a', to: 'b', command: 'run' } },
    nearby('200'), nearby(-1), nearby(3001),
    { name: 'find_places', arguments: { query: 'x', category: ['all'] } },
    { name: 'find_places', arguments: { query: 'x', category: '__proto__' } },
    { name: 'find_places', arguments: { query: 'x'.repeat(81), category: 'all' } },
    { name: 'find_places', arguments: { query: '  ', category: 'all' } }]) assert.throws(() => parse(v));
  assert.throws(() => parseToolCall('{"name":"nearby_places","arguments":{"center":"a","radius_m":1e400}}', fixture));
  assert.throws(() => parseToolCall('{"name":"find_places","arguments":{"query":"x","category":"all","__proto__":{}}}', fixture));
  assert.throws(() => parseToolCall(' '.repeat(MAX_CALL_CHARS + 1), fixture));
});

test('literal search has declared category/tag scope and does not execute result text', () => {
  const find = (query, category = 'all') => executeLocalTool(parse({ name: 'find_places', arguments: { query, category } }), fixture).result;
  assert.deepEqual(find('图书馆').places.map((p) => p.id), ['a', 'b']);
  assert.deepEqual(find('ＡＬＰＨＡ', 'study').places.map((p) => p.id), ['a']);
  assert.equal(find('图书馆', 'teaching').count, 0);
  assert.equal(find('图书馆', 'dining').count, 0);
  assert.equal(find('<img src=x onerror=publish_notes()>').count, 0);
  assert.equal(find('安静的自习空间').count, 0, 'no inferred semantic recommendation');
});

test('radius uses raw inclusive distance, excludes only the center, sorts and preserves the source', () => {
  const before = structuredClone(fixture);
  const threshold = sphericalDistance(fixture.places[0].coordinates, fixture.places[1].coordinates);
  assert.equal(executeLocalTool(nearby(0), fixture).result.count, 0);
  assert.equal(executeLocalTool(nearby(threshold - 1e-7), fixture).result.count, 0);
  assert.deepEqual(executeLocalTool(nearby(threshold), fixture).result.places.map((p) => p.id), ['b']);
  const all = executeLocalTool(nearby(3000), fixture).result;
  assert.deepEqual(all.places.map((p) => p.id), ['b', 'c']);
  assert.ok(all.places[0].distance_m < all.places[1].distance_m);
  const same = executeLocalTool({ name: 'measure_distance', arguments: { from: 'a', to: 'a' } }, fixture);
  assert.equal(same.result.distance_m, 0);
  const duplicate = structuredClone(fixture); duplicate.places[1].coordinates = [...duplicate.places[0].coordinates];
  assert.deepEqual(executeLocalTool(nearby(0), duplicate).result.places.map((p) => p.id), ['b'], 'distinct colocated IDs remain searchable');
  const output = executeLocalTool(distanceCall, fixture); output.result.from.coordinates[0] = 0;
  assert.deepEqual(fixture, before);
});

test('observation correlation and local recomputation reject mismatched, stale and altered outputs', () => {
  const output = executeLocalTool(distanceCall, fixture);
  const receipt = { call_id: 'call-1', tool: distanceCall.name, output };
  assert.deepEqual(acceptToolObservation('call-1', distanceCall, receipt, fixture), receipt);
  const shuffled = { ...receipt, output: Object.fromEntries(Object.entries(output).reverse()) };
  assert.deepEqual(acceptToolObservation('call-1', distanceCall, shuffled, fixture), shuffled, 'object key order is not data identity');
  for (const changed of [{ ...receipt, call_id: 'call-2' }, { ...receipt, tool: 'find_places' },
    { ...receipt, extra: true }, { ...receipt, output: { ...output, source_checked: '2099-01-01' } },
    { ...receipt, output: { ...output, result: { ...output.result, distance_m: 0 } } }])
    assert.throws(() => acceptToolObservation('call-1', distanceCall, changed, fixture));
  assert.throws(() => acceptToolObservation('call-1', { name: 'measure_distance', arguments: { from: 'a', to: 'c' } }, receipt, fixture));
});

test('explicit reports preserve complete catalog/provenance and honest template/model boundaries', () => {
  const receipt = { call_id: 'call-7', tool: distanceCall.name, output: executeLocalTool(distanceCall, fixture) };
  const report = createToolReport('call-7', distanceCall, receipt, fixture);
  assert.equal(report.model_called, false); assert.equal(report.source.places.length, 3);
  assert.equal(report.source.checked, '2026-11-02'); assert.equal(report.source.license, 'ODbL-1.0');
  assert.equal(report.explanation.kind, 'fixed-template');
  assert.deepEqual(executeLocalTool({ name: report.call.name, arguments: report.call.arguments }, report.source), report.observation.output);
  assert.match(report.explanation.text, /不是完整校园覆盖.*球面模型/);
  assert.ok(!JSON.stringify(report).includes('learning.v1'));
  receipt.output.result.distance_m = 0;
  assert.notEqual(report.observation.output.result.distance_m, 0, 'report is an independent checked snapshot');
});

test('catalog fails closed for invalid provenance, bad coordinates, large sets and unsafe IDs', () => {
  assert.equal(validateToolCatalog(fixture).length, 3);
  for (const change of [{ license: 'unknown' }, { coordinateSystem: 'GCJ02' }, { version: 2 }, { checked: 'yesterday' }, { checked: '2026-02-31' }, { note: null },
    { places: [{ ...fixture.places[0], id: '__proto__' }] },
    { places: [{ ...fixture.places[0], name: null }] },
    { places: [{ ...fixture.places[0], source: 'javascript:alert(1)' }] },
    { places: [...fixture.places, fixture.places[0]] }, { places: Array(101).fill(fixture.places[0]) }])
    assert.throws(() => validateToolCatalog({ ...fixture, ...change }));
});
