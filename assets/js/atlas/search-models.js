export const SEARCH_LIMIT = 512 * 1024;
export const SEARCH_KINDS = ['note', 'path', 'lab', 'project', 'page'];

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
  const terms = text.split(/\s+/).filter(Boolean);
  return entries.map((entry, index) => {
    const title = normalizeSearch(entry.title);
    const keywords = normalizeSearch(entry.keywords);
    const summary = normalizeSearch(entry.summary);
    const haystack = [title, keywords, summary, normalizeSearch(entry.detail)].join(' ');
    const match = (kind === 'all' || entry.kind === kind) && terms.every((term) => haystack.includes(term));
    const score = terms.length ? (title === text ? 100 : 0) + terms.reduce((sum, term) =>
      sum + (title.includes(term) ? 12 : 0) + (keywords.includes(term) ? 6 : 0) + (summary.includes(term) ? 2 : 0), 0)
      : Number(entry.featured);
    return { entry, index, score, match };
  }).filter((item) => item.match).sort((a, b) => b.score - a.score || a.index - b.index).map((item) => item.entry);
}
