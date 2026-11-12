export const MAX_STREAM_BYTES = 8 * 1024 * 1024;
const topics = ['ai', 'economy', 'politics'];
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const count = (value) => Number.isSafeInteger(value) && value >= 0;
export const streamTime = (value) => typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
export const streamDay = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const safeUrl = (value, hosts) => {
  try { const url = new URL(value); return text(value, 2048) && url.protocol === 'https:' && !url.username && !url.password &&
    !url.port && (!hosts || hosts.includes(url.hostname)); } catch { return false; }
};
function requireValue(condition) { if (!condition) throw new Error('自动快照格式或来源无效；已保留此前可读内容。'); }

export function parseStreamJson(raw) {
  requireValue(typeof raw === 'string' && new TextEncoder().encode(raw).byteLength <= MAX_STREAM_BYTES);
  try { return JSON.parse(raw); } catch { throw new Error('自动快照不是有效 JSON；已保留此前内容。'); }
}

export function validateStreamStatus(data) {
  requireValue(object(data) && data.schema_version === 1 && streamTime(data.attempted_at) && count(data.total) &&
    count(data.sources_ok) && count(data.sources_total) && data.sources_total > 0 && data.sources_total <= 12 &&
    data.sources_ok <= data.sources_total && /^[a-f0-9]{64}$/.test(data.digest) && data.index_path === 'index.json' &&
    (data.last_complete_at === null || streamTime(data.last_complete_at)));
  return data;
}

function validateRecord(record, sourceMap) {
  const source = object(record) && sourceMap.get(record.source_id);
  requireValue(source && /^n-[a-f0-9]{64}$/.test(record.id) && text(record.title, 240) &&
    record.topic === source.topic && record.publisher === source.publisher && safeUrl(record.url, source.article_hosts) &&
    text(record.caveat, 1200) && record.review_status === 'needs_review' && streamTime(record.first_seen_at) && streamTime(record.changed_at) &&
    Date.parse(record.changed_at) >= Date.parse(record.first_seen_at) && count(record.revision_count) &&
    [null, 'future', 'unavailable'].includes(record.date_warning) &&
    (record.published_at === null || streamTime(record.published_at)) &&
    (record.updated_at === null || streamTime(record.updated_at)) && typeof record.published_raw === 'string' && record.published_raw.length <= 200 &&
    Array.isArray(record.previous_versions) && record.previous_versions.length <= 10 && record.previous_versions.length <= record.revision_count);
  for (const old of record.previous_versions) requireValue(object(old) && text(old.title, 240) && safeUrl(old.url, source.article_hosts) &&
    streamTime(old.changed_at) && (old.published_at === null || streamTime(old.published_at)) &&
    (old.updated_at === null || streamTime(old.updated_at)));
  return record;
}

export function validateStreamIndex(data) {
  requireValue(object(data) && data.schema_version === 1 && streamTime(data.attempted_at) && count(data.total) &&
    Number.isInteger(data.interval_minutes) && data.interval_minutes >= 60 &&
    (data.last_complete_at === null || streamTime(data.last_complete_at)) &&
    Array.isArray(data.sources) && data.sources.length > 0 && data.sources.length <= 12 &&
    Array.isArray(data.latest) && data.latest.length <= 120 && data.latest.length <= data.total &&
    Array.isArray(data.archives) && data.archives.length <= 10000 &&
    Array.isArray(data.recent_runs) && data.recent_runs.length <= 8);
  const sourceMap = new Map();
  for (const source of data.sources) {
    requireValue(object(source) && /^[a-z][a-z0-9-]{0,99}$/.test(source.id) && !sourceMap.has(source.id) &&
      text(source.title, 240) && text(source.publisher, 240) && topics.includes(source.topic) &&
      ['ok', 'not_modified', 'error', 'deferred'].includes(source.status) && streamTime(source.attempted_at) &&
      (!source.last_success_at || streamTime(source.last_success_at)) &&
      safeUrl(source.home) && safeUrl(source.feed_url) && Array.isArray(source.article_hosts) && source.article_hosts.length > 0 &&
      source.article_hosts.length <= 10 && source.article_hosts.every((host) => typeof host === 'string' && /^[a-z0-9.-]+$/.test(host)));
    sourceMap.set(source.id, source);
  }
  const ids = new Set();
  for (const record of data.latest) {
    validateRecord(record, sourceMap); requireValue(!ids.has(record.id)); ids.add(record.id);
  }
  const days = new Set(); let total = 0;
  for (const day of data.archives) {
    requireValue(object(day) && streamDay(day.date) && !days.has(day.date) && count(day.count) && day.path === `archive/${day.date}.json`);
    days.add(day.date); total += day.count;
  }
  requireValue(total === data.total);
  for (const run of data.recent_runs) requireValue(object(run) && streamTime(run.at) && ['ok', 'partial', 'error'].includes(run.status) &&
    count(run.sources_ok) && count(run.sources_total) && run.sources_ok <= run.sources_total && count(run.additions) && count(run.revisions) && count(run.total));
  return data;
}

export function validateStreamArchive(data, index) {
  requireValue(object(data) && data.schema_version === 1 && streamDay(data.date) && Array.isArray(data.records) && data.records.length <= 10000);
  const sources = new Map(index.sources.map((source) => [source.id, source])); const ids = new Set();
  for (const record of data.records) {
    validateRecord(record, sources); requireValue(record.first_seen_at.slice(0, 10) === data.date && !ids.has(record.id)); ids.add(record.id);
  }
  const summary = index.archives.find((day) => day.date === data.date);
  requireValue(summary && summary.count === data.records.length);
  return data;
}

export function filterStream(records, { topic = 'all', source = 'all', query = '' } = {}) {
  const normalized = query.normalize('NFKC').toLowerCase().trim().slice(0, 120);
  return records.filter((item) => (topic === 'all' || item.topic === topic) && (source === 'all' || item.source_id === source) &&
    `${item.title} ${item.publisher}`.normalize('NFKC').toLowerCase().includes(normalized));
}

export function streamSnapshot(item) {
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(item.first_seen_at));
  return { id: item.id, title: item.title, url: item.url, topic: item.topic, item_type: 'update',
    version: `自动采集元信息 · ${item.published_at ? item.published_at.slice(0, 10) + ' 源站发布' : '发布时间待核对'}`,
    checked_on: day, caveat: `自动收集标题，尚未逐条核实。${item.caveat}`,
    question: '原文究竟主张什么？请记录证据位置、材料版本与尚不能确认的问题。' };
}
