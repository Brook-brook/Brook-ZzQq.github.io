export const READING_KEY = 'brooks-universe.observatory.v1';
export const MAX_LIST_BYTES = 2 * 1024 * 1024;
export const MAX_REFLECTION = 2000;
const fields = ['id', 'title', 'url', 'topic', 'item_type', 'version', 'checked_on', 'question', 'caveat'];
const topics = ['ai', 'economy', 'politics'];
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const keysEqual = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const short = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max && [...value].every((char) => char.codePointAt(0) >= 32);
const validReflection = (value) => typeof value === 'string' && value.length <= MAX_REFLECTION && [...value].every((char) => {
  const code = char.codePointAt(0); return code !== 127 && (code >= 32 || [9, 10, 13].includes(code));
});

export function emptyReadingList() { return { version: 2, saved: [] }; }

export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function validateReadingList(value) {
  if (!keysEqual(value, ['version', 'saved']) || ![1, 2].includes(value.version) || !Array.isArray(value.saved) || value.saved.length > 60) {
    throw new Error('阅读清单格式无法识别，旧数据未覆盖；本页可暂存并导出。');
  }
  const ids = new Set();
  const saved = value.saved.map((item) => {
    let url;
    try { url = new URL(item?.url); } catch { throw new Error('清单包含无效链接，旧数据未覆盖。'); }
    if (!keysEqual(item, value.version === 1 ? fields : [...fields, 'reflection']) || !short(item.id, 100) || !/^[a-z][a-z0-9-]*$/.test(item.id) || ids.has(item.id) ||
        !short(item.title, 240) || !short(item.url, 2048) || url.protocol !== 'https:' || url.username || url.password ||
        !topics.includes(item.topic) || !(value.version === 1 ? ['source', 'briefing'] : ['source', 'briefing', 'update']).includes(item.item_type) ||
        !short(item.version, 240) || !validDate(item.checked_on) || !short(item.question, 1200) || !short(item.caveat, 1200) ||
        (value.version === 2 && !validReflection(item.reflection))) {
      throw new Error('清单含无效或重复条目，旧数据未覆盖；本页可暂存并导出。');
    }
    ids.add(item.id);
    return { ...Object.fromEntries(fields.map((key) => [key, item[key]])), reflection: value.version === 1 ? '' : item.reflection };
  });
  const result = { version: 2, saved };
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > MAX_LIST_BYTES) throw new Error('清单过长，请先导出并移除部分条目。');
  return result;
}

export function parseReadingList(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > MAX_LIST_BYTES) throw new Error('旧清单过大，未覆盖。');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('旧清单无法读取，未覆盖；本页可暂存并导出。'); }
  return validateReadingList(value);
}

export function toggleReading(state, item) {
  const current = validateReadingList(state);
  const exists = current.saved.some((entry) => entry.id === item.id);
  return validateReadingList({ version: 2, saved: exists ? current.saved.filter((entry) => entry.id !== item.id) : [...current.saved, { ...item, reflection: item.reflection || '' }] });
}

export function addReadings(state, items) {
  const current = validateReadingList(state);
  const existing = new Set(current.saved.map((item) => item.id));
  const additions = [];
  for (const item of items) if (!existing.has(item.id)) {
    existing.add(item.id); additions.push({ ...item, reflection: item.reflection || '' });
  }
  return validateReadingList({ version: 2, saved: [...current.saved, ...additions] });
}

export function recordReflection(state, id, reflection) {
  const current = validateReadingList(state);
  if (!current.saved.some((item) => item.id === id)) throw new Error('材料已移除，笔记未保存。');
  return validateReadingList({ version: 2, saved: current.saved.map((item) => item.id === id ? { ...item, reflection } : item) });
}

export function filterSavedReadings(state, { query = '', topic = 'all', annotated = false } = {}) {
  const normalize = (value) => value.normalize('NFKC').toLowerCase();
  const term = normalize(query.trim().slice(0, 120));
  return validateReadingList(state).saved.filter((item) => (topic === 'all' || item.topic === topic) &&
    (!annotated || item.reflection.trim().length > 0) &&
    normalize([item.title, item.version, item.question, item.reflection].join(' ')).includes(term));
}

export function appendReadingOutline(reflection, outline) {
  if (!validReflection(reflection) || !validReflection(outline) || !outline.trim()) throw new Error('手记或提纲格式无法识别，原内容未改动。');
  const marker = outline.trim().split('\n')[0];
  if (reflection.includes(marker)) return { reflection, added: false };
  const next = reflection + (reflection ? '\n\n' : '') + outline.trim() + '\n';
  if (next.length > MAX_REFLECTION) throw new Error('追加后将超过 2,000 字符，提纲未插入。请先备份或精简，原内容保留。');
  return { reflection: next, added: true };
}

export function mergeReadings(state, backup) {
  const current = validateReadingList(state); const incoming = validateReadingList(backup);
  const merged = new Map(current.saved.map((item) => [item.id, item]));
  let added = 0; let filled = 0; let kept = 0;
  for (const item of incoming.saved) {
    const local = merged.get(item.id);
    if (!local) { merged.set(item.id, item); added++; }
    else if (!local.reflection && item.reflection && local.url === item.url && local.version === item.version) {
      merged.set(item.id, { ...local, reflection: item.reflection }); filled++;
    } else kept++;
  }
  return { state: validateReadingList({ version: 2, saved: [...merged.values()] }), added, filled, kept };
}

export function matchesSource(source, { query = '', topic = 'all', kind = 'all' }) {
  const normalize = (text) => text.normalize('NFKC').toLocaleLowerCase();
  return (topic === 'all' || source.topic === topic) && (kind === 'all' || source.kind === kind) &&
    normalize(source.search).includes(normalize(query.trim().slice(0, 120)));
}

export function shanghaiDate(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function catalogAge(checked, now = new Date()) {
  if (!validDate(checked)) return null;
  const days = Math.floor((Date.parse(shanghaiDate(now)) - Date.parse(checked)) / 86400000);
  return days < 0 ? null : days;
}

export function readingPlan(state, now = new Date()) {
  const { saved } = validateReadingList(state);
  const clean = (text) => text.replace(/[\\`*_[\]<>#]/g, '\\$&');
  const lines = ['# 我的 AI 与全球观察阅读计划', '', `导出日期：${shanghaiDate(now)}（北京时间）`,
    '由我主动选择的材料；收藏不代表已读或已掌握。原站内容可能更新，请保留具体版本与证据。', ''];
  saved.forEach((item, index) => {
    lines.push(`## ${index + 1}. ${clean(item.title)}`, '', `原文：${item.url}`, '',
      `材料：${{ briefing: '导读文档', source: '来源入口', update: '自动发现 · 待核对' }[item.item_type]} · ${clean(item.version)}`,
      `${item.item_type === 'update' ? '首次收集日期' : '收藏时的目录核对日期'}：${item.checked_on}（北京时间）`, '', `阅读问题：${clean(item.question)}`, '', `阅读边界：${clean(item.caveat)}`, '',
      '- [ ] 读原文并标出版本、发布时间与事件／统计时间。',
      '- [ ] 写出一项核心主张，并定位页码、表格、条文或原始证据。',
      '- [ ] 区分事实、预测、作者解释与机构立场。',
      '- [ ] 检查方法、样本、统计口径、替代解释与独立来源。', '',
      '我的解释：', '', item.reflection ? clean(item.reflection) : '（尚未记录）', '', '证据位置：', '', '尚不能确认／下一步验证：', '', '---', '');
  });
  return lines.join('\n');
}
