export const connectionKinds = { prepare: '准备基础', extend: '延伸理解', compare: '对照边界' };
function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function text(value, max) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
function id(value) { return typeof value === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(value); }
function exact(value, keys) { return record(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function fail() { throw new Error('公开学习连接未通过校验；请使用完整目录继续阅读。'); }

export function validateKnowledgeModel(model, base = '') {
  if (typeof base !== 'string' || (base && !/^\/[A-Za-z0-9._/-]+$/.test(base)) || base.includes('..') || base.includes('//') || base.endsWith('/')) fail();
  if (!exact(model, ['schema_version', 'ai_assisted', 'notes', 'links']) || model.schema_version !== 1 || typeof model.ai_assisted !== 'boolean' ||
    !Array.isArray(model.notes) || model.notes.length < 1 || model.notes.length > 200 ||
    !Array.isArray(model.links) || model.links.length > 256 || JSON.stringify(model).length > 512 * 1024) fail();
  const seen = new Set(), practiceIds = new Set();
  const internal = (url) => typeof url === 'string' && url.startsWith(base + '/') &&
    /^\/(?!\/)[a-z0-9/-]+(?:#[a-z][a-z0-9-]*)?$/.test(url.slice(base.length)) && !url.slice(base.length).includes('//');
  for (const note of model.notes) {
    if (!exact(note, ['id', 'title', 'summary', 'category', 'url', 'lab_url', 'practice']) ||
      !id(note.id) || seen.has(note.id) || !text(note.title, 240) || !text(note.summary, 600) ||
      !text(note.category, 80) || note.url !== `${base}/knowledge/${note.id}/` ||
      (note.lab_url !== null && !internal(note.lab_url)) || !Array.isArray(note.practice) || note.practice.length > 100) fail();
    seen.add(note.id);
    for (const step of note.practice) {
      if (!exact(step, ['id', 'title', 'path_title', 'url']) || !id(step.id) || practiceIds.has(step.id) ||
        !text(step.title, 240) || !text(step.path_title, 240) || step.url !== `${base}/study/practice/#${step.id}`) fail();
      practiceIds.add(step.id);
    }
  }
  const linkIds = new Set(), pairs = new Set();
  for (const link of model.links) {
    const pair = [link.from, link.to].sort().join('|');
    if (!exact(link, ['id', 'from', 'to', 'kind', 'reason']) || !id(link.id) || linkIds.has(link.id) ||
      !seen.has(link.from) || !seen.has(link.to) || link.from === link.to ||
      typeof link.kind !== 'string' || !Object.hasOwn(connectionKinds, link.kind) ||
      !text(link.reason, 400) || pairs.has(pair)) fail();
    linkIds.add(link.id); pairs.add(pair);
  }
  return model;
}

export function knowledgeNeighborhood(model, currentId, kind = 'all') {
  if (typeof kind !== 'string' || (kind !== 'all' && !Object.hasOwn(connectionKinds, kind))) fail();
  const note = model.notes.find((n) => n.id === currentId);
  if (!note) fail();
  const groups = { before: [], after: [], compare: [] };
  for (const link of model.links) {
    if (kind !== 'all' && link.kind !== kind) continue;
    if (link.from !== currentId && link.to !== currentId) continue;
    const otherId = link.from === currentId ? link.to : link.from;
    const group = link.kind === 'compare' ? 'compare' : link.to === currentId ? 'before' : 'after';
    groups[group].push({ link, note: model.notes.find((n) => n.id === otherId) });
  }
  return { note, groups, count: Object.values(groups).reduce((sum, rows) => sum + rows.length, 0) };
}
