import { readFile, writeFile, mkdir, readdir, rename, lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateStreamIndex, validateStreamArchive, streamDay } from '../../assets/js/atlas/stream-models.js';

const MAX_XML = 2 * 1024 * 1024;
const userAgent = 'BrooksObservatory/1.0 (+https://github.com/Brook-brook/Brook-ZzQq.github.io)';
const iso = () => new Date().toISOString();
const digest = (value) => createHash('sha256').update(value).digest('hex');
const timestamp = (value) => {
  if (typeof value !== 'string' || !/(Z|GMT|UTC|[+-]\d{2}:?\d{2})$/.test(value.trim()) ||
      (/^\d{4}-\d{2}-\d{2}/.test(value) && !streamDay(value.slice(0, 10)))) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
};
const titleText = (value) => {
  const chars = [...String(value || '').replace(/\s+/g, ' ').trim()].filter((char) => char.codePointAt(0) >= 32);
  let output = '';
  for (const char of chars) { if ((output + char).length > 235) return output + '…'; output += char; }
  return output;
};

export function canonicalUrl(value, hosts) {
  const url = new URL(value);
  if (url.username || url.password || !hosts.includes(url.hostname) || !['http:', 'https:'].includes(url.protocol) ||
      url.port || value.length > 2048 || [...value].some((c) => c.codePointAt(0) < 32)) throw new Error('invalid_link');
  url.protocol = 'https:'; url.hash = '';
  const segments = url.search.slice(1).split('&');
  const kept = segments.filter((part) => {
    try { return !/^(utm_|fbclid$|gclid$)/i.test(decodeURIComponent(part.split('=')[0])); } catch { return true; }
  });
  if (kept.length !== segments.length) url.search = kept.length ? '?' + kept.join('&') : '';
  return url.href;
}

export function normalizeEntries(entries, source, now, limit = 50) {
  const seen = new Set(); const records = []; let invalid = 0;
  for (const entry of entries) {
    try {
      const url = canonicalUrl(entry.url, source.article_hosts);
      const title = titleText(entry.title);
      if (!title) throw new Error('empty_title');
      const id = 'n-' + digest(url);
      if (seen.has(id)) continue;
      seen.add(id);
      const publication = timestamp(Object.hasOwn(entry, 'published_iso') ? entry.published_iso : entry.published_raw);
      const future = publication && Date.parse(publication) > Date.parse(now) + 86400000;
      records.push({ id, source_id: source.id, title, url, topic: source.topic, publisher: source.publisher,
        published_at: future ? null : publication, updated_at: timestamp(Object.hasOwn(entry, 'updated_iso') ? entry.updated_iso : entry.updated_raw),
        published_raw: String(entry.published_raw || '').slice(0, 200), date_warning: future ? 'future' : publication ? null : 'unavailable',
        review_status: 'needs_review', caveat: source.caveat });
    } catch { invalid++; }
  }
  records.sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')));
  return { records: records.slice(0, limit), invalid, available: records.length, limited: records.length > limit };
}

export function mergeRecord(previous, incoming, now) {
  if (!previous) return { ...incoming, first_seen_at: now, changed_at: now, revision_count: 0, previous_versions: [] };
  const fields = ['title', 'url', 'published_at', 'updated_at'];
  if (fields.every((key) => previous[key] === incoming[key])) return previous;
  const snapshot = Object.fromEntries([...fields, 'changed_at'].map((key) => [key, previous[key]]));
  return { ...previous, ...incoming, changed_at: now, revision_count: previous.revision_count + 1,
    previous_versions: [...previous.previous_versions, snapshot].slice(-10) };
}

async function json(path, fallback) {
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16 * MAX_XML) throw new Error('invalid_data_file');
    return JSON.parse(await readFile(path, 'utf8'));
  }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
async function save(path, value) {
  const temp = path + '.tmp';
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n'); await rename(temp, path);
}

async function fetchFeed(source, previous) {
  const headers = { 'User-Agent': userAgent, Accept: 'application/rss+xml, application/atom+xml, text/xml, application/xml' };
  if (previous?.etag) headers['If-None-Match'] = previous.etag;
  if (previous?.last_modified) headers['If-Modified-Since'] = previous.last_modified;
  let url = source.url;
  for (let redirect = 0; redirect < 4; redirect++) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !source.feed_hosts.includes(parsed.hostname) || parsed.username || parsed.password || parsed.port) throw new Error('redirect_blocked');
    const response = await fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    if (response.status === 304) return { notModified: true };
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location'); await response.body?.cancel();
      if (!location) throw new Error('invalid_redirect');
      url = new URL(location, url).href; continue;
    }
    if (!response.ok) {
      const retry = response.headers.get('retry-after'); await response.body?.cancel();
      const error = new Error(`http_${response.status}`);
      if (response.status === 429 && retry) {
        const after = /^\d+$/.test(retry) ? Date.now() + Number(retry) * 1000 : Date.parse(retry);
        if (Number.isFinite(after)) error.retry_after = new Date(Math.min(Math.max(after, Date.now()), Date.now() + 86400000)).toISOString();
      }
      throw error;
    }
    const reader = response.body.getReader(); let size = 0; const chunks = [];
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_XML) { await reader.cancel(); throw new Error('too_large'); }
      chunks.push(Buffer.from(value));
    }
    const parsedFeed = spawnSync('python3', [fileURLToPath(new URL('./parse-feed.py', import.meta.url))], {
      input: Buffer.concat(chunks), encoding: 'utf8', maxBuffer: 4 * MAX_XML, timeout: 10000
    });
    if (parsedFeed.status !== 0) throw new Error('invalid_feed');
    const entries = JSON.parse(parsedFeed.stdout);
    return { entries, etag: (response.headers.get('etag') || '').slice(0, 250),
      last_modified: (response.headers.get('last-modified') || '').slice(0, 250) };
  }
  throw new Error('redirect_limit');
}

export async function collect({ output, manifest, force = false }) {
  const config = JSON.parse(await readFile(manifest, 'utf8'));
  if (config.schema_version !== 1 || !Array.isArray(config.sources) || !config.sources.length || config.sources.length > 12 ||
      !Number.isInteger(config.per_feed_limit) || config.per_feed_limit < 1 || config.per_feed_limit > 100 ||
      !Number.isInteger(config.interval_minutes) || config.interval_minutes < 60) throw new Error('invalid_manifest');
  const sourceIds = new Set();
  for (const source of config.sources) {
    const url = new URL(source.url);
    if (!/^[a-z][a-z0-9-]{0,99}$/.test(source.id) || sourceIds.has(source.id) ||
        !['ai', 'economy', 'politics'].includes(source.topic) ||
        !Array.isArray(source.feed_hosts) || !Array.isArray(source.article_hosts) || !source.article_hosts.length ||
        !source.feed_hosts.includes(url.hostname) || url.protocol !== 'https:' || url.username || url.password ||
        ![source.title, source.publisher, source.home, source.caveat].every((value) => typeof value === 'string' && value.trim())) throw new Error('invalid_source');
    sourceIds.add(source.id);
  }
  const root = resolve(output); const archives = join(root, 'archive'); const runs = join(root, 'runs');
  await mkdir(archives, { recursive: true }); await mkdir(runs, { recursive: true });
  for (const folder of [root, archives, runs]) {
    const stat = await lstat(folder);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('unsafe_output_path');
  }
  const before = await json(join(root, 'index.json'), null);
  if (before) validateStreamIndex(before);
  const now = iso();
  if (!force && before && Date.parse(now) - Date.parse(before.attempted_at) < 3600000) {
    process.stdout.write('Recent collection exists; no duplicate fetch.\n'); return { skipped: true };
  }
  const days = new Map(); const known = new Map();
  for (const file of await readdir(archives)) {
    if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(file)) continue;
    const day = file.slice(0, 10); const data = await json(join(archives, file));
    if (data.schema_version !== 1 || !Array.isArray(data.records)) throw new Error('invalid_archive');
    if (before) validateStreamArchive(data, before);
    days.set(day, data.records);
    for (const record of data.records) {
      if (known.has(record.id)) throw new Error('duplicate_archive_id');
      known.set(record.id, { day, record });
    }
  }
  const changedDays = new Set(); const states = []; let additions = 0; let revisions = 0;
  for (const source of config.sources) {
    const old = before?.sources?.find((entry) => entry.id === source.id);
    if (old?.retry_after && Date.parse(old.retry_after) > Date.parse(now)) {
      states.push({ ...old, status: 'deferred' }); continue;
    }
    try {
      const fetched = await fetchFeed(source, old);
      if (fetched.notModified) {
        if (!old?.last_success_at) throw new Error('unexpected_304');
        states.push({ ...old, status: 'not_modified', attempted_at: now, last_success_at: now, error: null }); continue;
      }
      const normalized = normalizeEntries(fetched.entries, source, now, config.per_feed_limit);
      if (fetched.entries.length && !normalized.records.length) throw new Error('no_valid_entries');
      for (const entry of normalized.records) {
        const found = known.get(entry.id); const record = mergeRecord(found?.record, entry, now);
        if (record === found?.record) continue;
        const day = found?.day || now.slice(0, 10);
        const rows = days.get(day) || [];
        if (found) { rows[rows.findIndex((row) => row.id === entry.id)] = record; revisions++; }
        else { rows.push(record); additions++; }
        days.set(day, rows); known.set(entry.id, { day, record }); changedDays.add(day);
      }
      states.push({ id: source.id, title: source.title, publisher: source.publisher, topic: source.topic,
        home: source.home, feed_url: source.url, article_hosts: source.article_hosts,
        status: 'ok', attempted_at: now, last_success_at: now,
        accepted: normalized.records.length, invalid: normalized.invalid, limited: normalized.limited,
        etag: fetched.etag, last_modified: fetched.last_modified, error: null, retry_after: null });
    } catch (error) {
      const code = /^(http_\d{3}|too_large|invalid_feed|redirect_blocked|redirect_limit|no_valid_entries|unexpected_304|invalid_redirect)$/.test(error.message)
        ? error.message : error.name === 'TimeoutError' ? 'timeout' : 'network_error';
      states.push({ id: source.id, title: source.title, publisher: source.publisher, topic: source.topic,
        home: source.home, feed_url: source.url, ...(old || {}), status: 'error', attempted_at: now, error: code,
        retry_after: error.retry_after || null, article_hosts: source.article_hosts });
    }
  }
  for (const day of changedDays) await save(join(archives, day + '.json'), { schema_version: 1, date: day, records: days.get(day) });
  const records = [...known.values()].map((entry) => entry.record).sort((a, b) => b.changed_at.localeCompare(a.changed_at) || a.id.localeCompare(b.id));
  const success = states.filter((entry) => ['ok', 'not_modified'].includes(entry.status)).length;
  const receipt = { at: now, status: success === states.length ? 'ok' : success ? 'partial' : 'error',
    sources_ok: success, sources_total: states.length, additions, revisions, total: records.length,
    failed_sources: states.filter((entry) => !['ok', 'not_modified'].includes(entry.status)).map((entry) => ({ id: entry.id, error: entry.error })) };
  const month = now.slice(0, 7); const history = await json(join(runs, month + '.json'), { schema_version: 1, runs: [] });
  history.runs.push(receipt); await save(join(runs, month + '.json'), history);
  const result = { schema_version: 1, attempted_at: now, interval_minutes: config.interval_minutes,
    last_complete_at: success === states.length ? now : before?.last_complete_at || null,
    total: records.length, sources: states, latest: records.slice(0, 60),
    archives: [...days].sort(([a], [b]) => b.localeCompare(a)).map(([date, rows]) => ({ date, count: rows.length, path: `archive/${date}.json` })),
    recent_runs: [...(before?.recent_runs || []), receipt].slice(-8) };
  await save(join(root, 'index.json'), result);
  await save(join(root, 'status.json'), { schema_version: 1, attempted_at: now,
    last_complete_at: result.last_complete_at, sources_ok: success, sources_total: states.length,
    total: result.total, digest: digest(JSON.stringify(result)), index_path: 'index.json' });
  process.stdout.write(JSON.stringify(receipt) + '\n');
  return receipt;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const get = (flag, fallback) => process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : fallback;
  const receipt = await collect({ output: get('--output', 'work/observatory/feed'),
    manifest: get('--manifest', '_data/observatory_feeds.json'), force: process.argv.includes('--force') });
  if (receipt.status === 'error') process.exitCode = 1;
}
