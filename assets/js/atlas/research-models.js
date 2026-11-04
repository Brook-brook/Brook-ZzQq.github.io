export const RESEARCH_MAX_BYTES = 50_000;
export const RESEARCH_MAX_ENTRIES = 200;

export class ResearchInputError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ResearchInputError';
    this.code = code;
  }
}

export function normalizeResearchUrl(value, { removeTracking = true } = {}) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ResearchInputError('missing_url', '缺少条目链接。');
  }
  const text = value.trim();
  const hasControl = [...text].some((character) => {
    const code = character.codePointAt(0);
    return code < 32 || code === 127;
  });
  if (text.length > 2048 || hasControl) {
    throw new ResearchInputError('invalid_url', '链接过长或包含控制字符。');
  }
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new ResearchInputError('invalid_url', '需要完整的绝对链接。');
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new ResearchInputError('unsupported_url', '只接受 http 或 https 链接。');
  }
  if (url.username || url.password) {
    throw new ResearchInputError('url_credentials', '不接受含用户名或密码的链接。');
  }
  url.hash = '';
  if (removeTracking) {
    const segments = url.search.slice(1).split('&');
    const kept = segments.filter((segment) => {
      let key;
      try {
        key = decodeURIComponent(segment.split('=', 1)[0].replace(/\+/g, ' ')).toLowerCase();
      } catch {
        return true;
      }
      return !key.startsWith('utm_') && key !== 'fbclid' && key !== 'gclid';
    });
    // Filter only tracker segments: URLSearchParams would reserialize every
    // retained parameter, changing %20/+, escape case and bare query values.
    if (kept.length !== segments.length) {
      url.search = kept.length ? `?${kept.join('&')}` : '';
    }
  }
  return url.href;
}

export function analyzeResearchEntries(entries, options = {}) {
  if (!Array.isArray(entries) || entries.length > RESEARCH_MAX_ENTRIES) {
    throw new ResearchInputError('entry_limit', '每次最多处理 200 条记录。');
  }
  const removeTracking = options.removeTracking !== false;
  const sourceFormat = options.sourceFormat === 'atom' ? 'atom' : 'rss';
  const seen = new Map();
  const records = [];
  const rows = entries.map((entry, index) => {
    const title = typeof entry?.title === 'string' ? entry.title.trim() : '';
    const original = typeof entry?.url === 'string' ? entry.url : '';
    const row = {
      index: index + 1,
      title: title || '未命名条目',
      original_url: original,
      canonical_url: null,
      status: 'invalid',
      reason: '',
      duplicate_of: null
    };
    try {
      if (!title) {
        throw new ResearchInputError('missing_title', '缺少标题，暂不保留。');
      }
      const canonical = normalizeResearchUrl(original, { removeTracking });
      row.canonical_url = canonical;
      if (seen.has(canonical)) {
        row.status = 'duplicate';
        row.duplicate_of = seen.get(canonical);
        row.reason = `规范化链接与第 ${row.duplicate_of} 条相同，保留首次出现。`;
      } else {
        seen.set(canonical, row.index);
        row.status = 'kept';
        row.reason = canonical === original.trim()
          ? '链接有效且首次出现，保留为待复核记录。'
          : '规范化链接后首次出现，保留为待复核记录。';
        records.push({
          title,
          url: canonical,
          source: 'local-input',
          summary: null,
          score: null,
          review_status: 'needs_review'
        });
      }
    } catch (error) {
      if (!(error instanceof ResearchInputError)) throw error;
      row.reason = error.message;
    }
    return row;
  });
  return {
    rows,
    counts: {
      input: entries.length,
      kept: records.length,
      duplicate: rows.filter((row) => row.status === 'duplicate').length,
      invalid: rows.filter((row) => row.status === 'invalid').length
    },
    output: {
      schema_version: 1,
      source_format: sourceFormat,
      normalization: { remove_tracking_parameters: removeTracking },
      records
    }
  };
}
