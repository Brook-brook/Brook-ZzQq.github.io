export const SEARCH_LIMIT = 512 * 1024;
export const SEARCH_KINDS = ['note', 'path', 'lab', 'project', 'page'];

// Explicit alternative spellings, not topic inference or fuzzy corrections.
const ALIASES = [
  ['c++', 'cpp', 'cplusplus'], ['gis', '地理信息系统'], ['ai', '人工智能'],
  ['js', 'javascript'], ['mercator', '墨卡托'], ['nash', '纳什'],
  ['深拷贝', '深复制'], ['浅拷贝', '浅复制']
];
const aliasFor = new Map(ALIASES.flatMap((group) => group.map((term) => [term, group])));
const latinWord = (char = '') => /[a-z0-9_]/i.test(char);
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh', { granularity: 'grapheme' }) : null;

function termsFor(query) {
  return [...new Set(normalizeSearch(query.slice(0, 120)).split(/\s+/).filter(Boolean))]
    .map((term) => aliasFor.get(term) || [term]);
}

function occurrences(text, term, firstOnly = false) {
  const ranges = [];
  const bounded = term === 'c++' || (/^[a-z]+$/.test(term) && (term.length <= 3 || aliasFor.has(term)));
  let offset = 0;
  while (offset <= text.length - term.length) {
    const start = text.indexOf(term, offset);
    if (start < 0) break;
    const end = start + term.length;
    if (!bounded || (!latinWord(text[start - 1]) && (!/[a-z]$/.test(term) || !latinWord(text[end])))) {
      ranges.push([start, end]);
      if (firstOnly) break;
    }
    offset = end;
  }
  return ranges;
}

export function searchAliasHint(query) {
  const groups = [...new Set(termsFor(query).filter((terms) => terms.length > 1))];
  return groups.map((group) => group.map((term) => /^[a-z+]+$/.test(term) ? term.toUpperCase() : term).join(' / ')).join('；');
}

export function highlightSearch(text, query) {
  const original = String(text);
  if (!original) return [];
  const terms = termsFor(query).flat();
  if (!terms.length) return [{ text: original, matched: false }];
  const normalized = original.normalize('NFKC').toLocaleLowerCase();
  const offsets = [];
  const segments = segmenter
    ? segmenter.segment(original)
    : Array.from(original, (segment) => ({ segment }));
  let cursor = 0;
  for (const { segment } of segments) {
    const end = cursor + segment.length;
    for (let i = 0; i < segment.normalize('NFKC').toLocaleLowerCase().length; i++) offsets.push([cursor, end]);
    cursor = end;
  }
  const ranges = terms.flatMap((term) => occurrences(normalized, term))
    .map(([start, end]) => [offsets[start]?.[0], offsets[end - 1]?.[1]])
    .filter(([start, end]) => start !== undefined && end !== undefined)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  const result = [];
  cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) result.push({ text: original.slice(cursor, start), matched: false });
    result.push({ text: original.slice(start, end), matched: true });
    cursor = end;
  }
  if (cursor < original.length) result.push({ text: original.slice(cursor), matched: false });
  return result;
}

export function keywordContext(text, query) {
  const parts = highlightSearch(text, query);
  const first = parts.findIndex((part) => part.matched);
  if (first < 0) return '';
  const before = Array.from(parts.slice(0, first).map((part) => part.text).join(''));
  const after = Array.from(parts.slice(first).map((part) => part.text).join(''));
  return (before.length > 32 ? '…' : '') + before.slice(-32).join('') + after.slice(0, 128).join('') + (after.length > 128 ? '…' : '');
}

export function normalizeSearch(value) {
  return String(value).normalize('NFKC').toLocaleLowerCase().trim();
}

export function validateSearchIndex(data, base = '') {
  if (data?.schema_version !== 1 || !Array.isArray(data.entries) || data.entries.length > 1000)
    throw new Error('搜索索引格式不兼容。');
  const ids = new Set();
  return data.entries.map((entry) => {
    if (!entry || !SEARCH_KINDS.includes(entry.kind) ||
      !new RegExp(`^${entry.kind}-[a-f0-9]{16}$`).test(entry.id) || ids.has(entry.id) ||
      typeof entry.featured !== 'boolean') throw new Error('搜索条目无效。');
    for (const [key, limit] of [['title', 240], ['summary', 600], ['keywords', 2000], ['detail', 240], ['url', 2048]]) {
      if (typeof entry[key] !== 'string' || entry[key].length > limit || (key !== 'keywords' && !entry[key].trim()))
        throw new Error('搜索条目超出范围。');
    }
    const href = entry.url;
    if (!href.startsWith('/') || href.startsWith('//') || [...href].some((char) => char.charCodeAt(0) <= 32) || /\\|%2f|%5c|%2e/i.test(href))
      throw new Error('搜索链接无效。');
    const parsed = new URL(href, 'https://search.invalid');
    if (parsed.origin !== 'https://search.invalid' || parsed.pathname.split('/').includes('..') ||
      (base && parsed.pathname !== base && !parsed.pathname.startsWith(base + '/')) ||
      parsed.pathname !== href.split(/[?#]/)[0]) throw new Error('搜索链接超出本站范围。');
    ids.add(entry.id);
    return { ...entry };
  });
}

export function searchEntries(entries, query = '', kind = 'all') {
  const text = normalizeSearch(query.slice(0, 120));
  const terms = termsFor(query);
  return entries.map((entry, index) => {
    const title = normalizeSearch(entry.title);
    const keywords = normalizeSearch(entry.keywords);
    const summary = normalizeSearch(entry.summary);
    const haystack = [title, keywords, summary, normalizeSearch(entry.detail)].join(' ');
    const match = (kind === 'all' || entry.kind === kind) && terms.every((options) => options.some((term) => occurrences(haystack, term, true).length));
    const score = terms.length ? (title === text ? 100 : 0) + terms.reduce((sum, options) =>
      sum + Math.max(...options.map((term) => (occurrences(title, term, true).length ? 12 : 0) +
        (occurrences(keywords, term, true).length ? 6 : 0) + (occurrences(summary, term, true).length ? 2 : 0))), 0)
      : Number(entry.featured);
    return { entry, index, score, match };
  }).filter((item) => item.match).sort((a, b) => b.score - a.score || a.index - b.index).map((item) => item.entry);
}
