import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { canonicalUrl, normalizeEntries, mergeRecord } from '../tools/observatory/collect.mjs';

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
});
