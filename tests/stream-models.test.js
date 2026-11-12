import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  parseStreamJson, validateStreamIndex, validateStreamStatus, validateStreamArchive, filterStream,
  streamSnapshot, streamTime, streamLocalDay, MAX_STREAM_BYTES
} from '../assets/js/atlas/stream-models.js';
import { toggleReading, emptyReadingList } from '../assets/js/atlas/observatory-models.js';

const actual = JSON.parse(await readFile('_data/observatory_stream.json', 'utf8'));
const copy = () => structuredClone(actual);

test('bundled metadata is an actual bounded snapshot with separate source health and needs_review records', () => {
  assert.equal(validateStreamIndex(copy()).latest.length, actual.latest.length);
  assert.ok(actual.sources.some((source) => source.status === 'error'), 'the initial unavailable publisher is disclosed');
  assert.ok(actual.latest.every((item) => item.review_status === 'needs_review'));
  assert.ok(actual.latest.every((item) => !Object.hasOwn(item, 'body') && !Object.hasOwn(item, 'summary')));
});

test('rejects unsafe source links, malformed dates, duplicate IDs and archive path/count corruption', () => {
  for (const mutate of [
    (x) => { x.latest[0].url = 'javascript:alert(1)'; },
    (x) => { x.latest[0].url = 'https://off-source.test/paper'; },
    (x) => { x.latest[0].url = 'https://secret:password@openai.com/paper'; },
    (x) => { x.latest.push(x.latest[0]); },
    (x) => { x.latest[0].first_seen_at = '2026-02-30T00:00:00Z'; },
    (x) => { x.archives[0].path = '../index.json'; },
    (x) => { x.archives[0].count++; },
    (x) => { x.sources[0].retry_after = 'invalid'; }
  ]) { const value = copy(); mutate(value); assert.throws(() => validateStreamIndex(value)); }
  assert.equal(streamTime('2026-11-12T12:30:10+08:00'), true);
  assert.equal(streamTime('2026-11-12T24:30:10Z'), false);
});

test('daily archive lookup validates day, uniqueness and the full record count', () => {
  const index = copy(); index.total = index.latest.length;
  index.archives = [{ date: streamLocalDay(index.latest[0].first_seen_at), count: index.latest.length, path: `archive/${streamLocalDay(index.latest[0].first_seen_at)}.json` }];
  const archive = { schema_version: 1, date: index.archives[0].date, records: index.latest };
  assert.equal(validateStreamArchive(archive, validateStreamIndex(index)), archive);
  assert.throws(() => validateStreamArchive({ ...archive, date: '2026-11-11' }, index));
  assert.throws(() => validateStreamArchive({ ...archive, records: archive.records.slice(1) }, index));
});

test('filters metadata without fetching and snapshots retain first collection, source publication and review limits', () => {
  const first = actual.latest[0];
  assert.ok(filterStream(actual.latest, { source: first.source_id, query: first.title.slice(0, 8), topic: first.topic }).some((item) => item.id === first.id));
  assert.equal(filterStream(actual.latest, { query: '<script>' }).length, 0);
  const record = { ...first, first_seen_at: '2026-11-11T16:05:00Z', published_at: '2026-11-10T18:00:00Z' };
  const snapshot = streamSnapshot(record);
  assert.equal(snapshot.checked_on, '2026-11-12'); assert.match(snapshot.version, /2026-11-11 源站发布/);
  assert.equal(snapshot.item_type, 'update'); assert.match(snapshot.caveat, /尚未逐条核实/);
  assert.equal(toggleReading(emptyReadingList(), snapshot).saved[0].reflection, '');
});

test('status and JSON validation reject malformed or excessive input without accepting arbitrary index paths', () => {
  assert.throws(() => parseStreamJson('x'.repeat(MAX_STREAM_BYTES + 1)));
  assert.throws(() => parseStreamJson('{broken'));
  assert.throws(() => validateStreamStatus({ schema_version: 1, index_path: 'https://other.test/index.json' }));
});
