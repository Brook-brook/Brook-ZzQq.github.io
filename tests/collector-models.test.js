import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalUrl, normalizeEntries, mergeRecord, collect } from '../tools/observatory/collect.mjs';
import { streamLocalDay, validateStreamIndex, validateStreamArchive } from '../assets/js/atlas/stream-models.js';

const source = { id: 'synthetic-source', topic: 'ai', publisher: 'Synthetic fixture', caveat: 'Unreviewed metadata', article_hosts: ['example.org'] };
const now = '2026-11-12T00:00:00.000Z';
const entry = (patch = {}) => ({ title: 'Original title', url: 'https://example.org/paper?id=1&utm_source=rss#top', published_raw: 'Wed, 11 Nov 2026 10:00:00 GMT', updated_raw: '', ...patch });
function parse(xml) { return spawnSync('python3', ['tools/observatory/parse-feed.py'], { input: xml, encoding: 'utf8' }); }

test('RSS and Atom extract only bibliographic fields, never descriptions or article bodies', () => {
  const rss = parse('<rss><channel><item><title>Title &amp; detail</title><link>https://example.org/a</link><pubDate>Wed, 11 Nov 2026 10:00:00 GMT</pubDate><description>DO NOT COPY THE BODY</description></item></channel></rss>');
  assert.equal(rss.status, 0); const rows = JSON.parse(rss.stdout);
  assert.equal(rows[0].title, 'Title & detail'); assert.equal(rss.stdout.includes('DO NOT COPY'), false);
  const atom = parse('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Atom</title><link rel="self" href="https://example.org/feed"/><link rel="alternate" type="text/html" href="https://example.org/paper"/><published>2026-11-10T00:00:00Z</published></entry></feed>');
  assert.equal(JSON.parse(atom.stdout)[0].url, 'https://example.org/paper');
});

test('rejects DTD/entity declarations, UTF-16, malformed XML and excessive input', () => {
  for (const xml of ['<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><rss>&e;</rss>', '<rss>', '<html/>', Buffer.from('<rss/>', 'utf16le'), 'x'.repeat(2 * 1024 * 1024 + 1)]) assert.notEqual(parse(xml).status, 0);
});

test('canonical link validation preserves identifying query bytes and blocks off-source/unsafe links', () => {
  assert.equal(canonicalUrl(entry().url, source.article_hosts), 'https://example.org/paper?id=1');
  assert.equal(canonicalUrl('http://example.org/a?x=%2f&id=2', source.article_hosts), 'https://example.org/a?x=%2f&id=2');
  for (const url of ['javascript:alert(1)', 'https://user:password@example.org/a', 'https://untrusted.test/a', 'https://example.org:8443/a']) assert.throws(() => canonicalUrl(url, source.article_hosts));
});

test('deduplicates deterministically, bounds collection and keeps invalid/future dates explicit', () => {
  const result = normalizeEntries([entry(), entry(), entry({ url: 'https://example.org/other', published_raw: 'bad date' }), entry({ url: 'https://example.org/future', published_raw: '2030-01-01T00:00:00Z' })], source, now, 2);
  assert.equal(result.records.length, 2); assert.equal(result.limited, true);
  assert.equal(result.records[0].review_status, 'needs_review');
  const future = normalizeEntries([entry({ published_raw: '2030-01-01T00:00:00Z' })], source, now).records[0];
  assert.equal(future.published_at, null); assert.equal(future.date_warning, 'future');
  assert.equal(normalizeEntries([entry({ url: 'https://untrusted.test/' })], source, now).invalid, 1);
});

test('archive history retains first observation and previous metadata, unchanged polls do not rewrite records', () => {
  const incoming = normalizeEntries([entry()], source, now).records[0];
  const first = mergeRecord(null, incoming, now);
  assert.equal(mergeRecord(first, incoming, '2026-11-12T02:00:00Z'), first);
  const updated = mergeRecord(first, { ...incoming, title: 'Corrected title' }, '2026-11-12T04:00:00Z');
  assert.equal(updated.first_seen_at, now); assert.equal(updated.previous_versions[0].title, 'Original title');
  assert.equal(updated.revision_count, 1); assert.equal(first.title, 'Original title');
  const dateCorrection = mergeRecord(first, { ...incoming, published_raw: 'Source corrected its date spelling' }, '2026-11-12T04:00:00Z');
  assert.equal(dateCorrection.revision_count, 1, 'raw source date corrections are archived even with unchanged parsed time');
  assert.equal(dateCorrection.previous_versions[0].published_raw, incoming.published_raw);
});

test('archive days follow Shanghai midnight rather than UTC midnight', () => {
  assert.equal(streamLocalDay('2026-11-11T16:00:00Z'), '2026-11-12');
  assert.equal(streamLocalDay('2026-11-11T15:59:59Z'), '2026-11-11');
});

test('real parser/collector pipeline retains archives on partial failures, 304 and rate limits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'brook-feed-test-'));
  const originalFetch = globalThis.fetch; const calls = []; let phase = 0;
  const config = { schema_version: 1, per_feed_limit: 50, interval_minutes: 120, sources: [1, 2].map((n) => ({
    ...source, id: `fixture-${n}`, title: `Synthetic ${n}`, home: 'https://example.org/',
    url: `https://example.org/feed-${n}`, feed_hosts: ['example.org']
  })) };
  const manifest = join(root, 'sources.json'); const output = join(root, 'feed');
  await writeFile(manifest, JSON.stringify(config));
  globalThis.fetch = async (url, options) => {
    calls.push({ url, headers: options.headers });
    if (url.endsWith('feed-2')) return new Response(null, { status: phase ? 429 : 403, headers: { 'retry-after': '86400' } });
    if (phase === 1) return new Response(null, { status: 304 });
    if (phase === 2) return new Response(null, { status: 503 });
    return new Response('<rss><channel><item><title>Fixture only</title><link>https://example.org/paper</link></item></channel></rss>', { headers: { etag: 'fixture-v1' } });
  };
  const index = async () => validateStreamIndex(JSON.parse(await readFile(join(output, 'index.json'), 'utf8')));
  try {
    const first = await collect({ output, manifest, force: true });
    assert.equal(first.status, 'partial'); assert.equal(first.total, 1);
    const initial = await index();
    const archive = await readFile(join(output, initial.archives[0].path), 'utf8');
    validateStreamArchive(JSON.parse(archive), initial);
    assert.equal((await collect({ output, manifest })).skipped, true);
    assert.equal(calls.length, 2, 'lease prevents duplicate requests');
    phase = 1; const second = await collect({ output, manifest, force: true });
    assert.equal(second.additions, 0); assert.equal(second.revisions, 0);
    const after304 = await index(); assert.equal(after304.sources[0].status, 'not_modified');
    assert.equal(calls[2].headers['If-None-Match'], 'fixture-v1');
    phase = 2; const third = await collect({ output, manifest, force: true });
    assert.equal(third.status, 'error'); assert.equal(third.total, 1);
    assert.equal((await index()).sources[1].status, 'deferred');
    assert.equal(calls.length, 5, 'Retry-After prevents another request to the limited source');
    assert.equal(await readFile(join(output, initial.archives[0].path), 'utf8'), archive, 'failed polls never rewrite prior records');
  } finally { globalThis.fetch = originalFetch; await rm(root, { recursive: true, force: true }); }
});
