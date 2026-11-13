export const retrievalDefaults = { task: 'retention', query: '保留 空间', version: 'all', k: 2, context_budget: 220 };
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => isObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const text = (value, limit) => typeof value === 'string' && value.trim().length > 0 && Array.from(value).length <= limit;
const validId = (value) => typeof value === 'string' && /^[a-z][a-z0-9-]{0,59}$/.test(value);
const unique = (items) => new Set(items).size === items.length;
const norm = (value) => value.normalize('NFKC').toLowerCase();
export function literalTerms(query) {
  if (typeof query !== 'string' || Array.from(query).length > 200) throw new Error('关键词最多200个Unicode字符。');
  const terms = [...new Set(norm(query).trim().split(/\s+/u).filter(Boolean))];
  if (terms.length > 6 || terms.some((term) => Array.from(term).length > 40)) throw new Error('最多6个空格分隔的词，每词最多40个字符。');
  return terms;
}
export function validateRetrievalCorpus(data) {
  if (!exact(data, ['schema_version', 'corpus_id', 'title', 'disclosure', 'documents', 'fragments', 'tasks']) || data.schema_version !== 1 || !validId(data.corpus_id) || !text(data.title, 200) || !text(data.disclosure, 1000)) throw new Error('教学语料信封无效。');
  for (const [key, max] of [['documents', 20], ['fragments', 100], ['tasks', 10]]) if (!Array.isArray(data[key]) || !data[key].length || data[key].length > max || !unique(data[key].map((item) => item?.id))) throw new Error('语料规模或ID无效。');
  if (data.documents.some((d) => !exact(d, ['id', 'title', 'version']) || !validId(d.id) || !text(d.title, 120) || !/^v[1-9]\d{0,2}$/.test(d.version))) throw new Error('文档版本无效。');
  const docs = new Set(data.documents.map((d) => d.id)), fragments = new Set(data.fragments.map((f) => f.id));
  if (data.fragments.some((f) => !exact(f, ['id', 'document_id', 'section', 'text']) || !validId(f.id) || !docs.has(f.document_id) || !text(f.section, 120) || !text(f.text, 1500))) throw new Error('片段或出处无效。');
  for (const task of data.tasks) {
    if (!exact(task, ['id', 'title', 'question', 'query', 'relevant_ids', 'annotation_reason']) || !validId(task.id) || !text(task.title, 120) || !text(task.question, 300) || !text(task.annotation_reason, 1000) || !(task.relevant_ids === null || Array.isArray(task.relevant_ids) && unique(task.relevant_ids) && task.relevant_ids.every((id) => fragments.has(id)))) throw new Error('题目或相关性标注无效。');
    literalTerms(task.query);
  }
  return data;
}
export function validateRetrievalSettings(settings, corpus) {
  validateRetrievalCorpus(corpus);
  if (!exact(settings, ['task', 'query', 'version', 'k', 'context_budget']) || !corpus.tasks.some((t) => t.id === settings.task) || !(settings.version === 'all' || corpus.documents.some((d) => d.version === settings.version)) || !Number.isInteger(settings.k) || settings.k < 1 || settings.k > 8 || !Number.isInteger(settings.context_budget) || settings.context_budget < 40 || settings.context_budget > 1000) throw new Error('题目、版本、k（1–8）或字符预算（40–1000）无效。');
  literalTerms(settings.query); return { ...settings };
}
export function evaluateRetrieval(rows, relevantIds, k) {
  if (!Number.isInteger(k) || k < 1 || k > 8 || !Array.isArray(rows) || rows.length > k || !unique(rows.map((r) => r?.id)) || rows.some((r) => !validId(r?.id)) || !(relevantIds === null || Array.isArray(relevantIds) && unique(relevantIds) && relevantIds.every(validId))) throw new Error('指标需要不重复的返回ID、标注和明确k。');
  if (relevantIds === null) return null;
  const ids = rows.map((r) => r.id), hits = ids.filter((id) => relevantIds.includes(id)).length;
  const first = ids.findIndex((id) => relevantIds.includes(id));
  return { requested_k: k, returned: ids.length, hits, relevant_total: relevantIds.length,
    precision_at_k: hits / k, recall_at_k: relevantIds.length ? hits / relevantIds.length : null,
    reciprocal_rank_at_k: relevantIds.length ? (first < 0 ? 0 : 1 / (first + 1)) : null };
}
export function createRetrievalRun(settings, input) {
  const corpus = structuredClone(validateRetrievalCorpus(input)), checked = validateRetrievalSettings(settings, corpus), terms = literalTerms(checked.query);
  const candidates = corpus.fragments.flatMap((fragment) => {
    const document = corpus.documents.find((d) => d.id === fragment.document_id);
    if (checked.version !== 'all' && document.version !== checked.version) return [];
    const haystack = norm(`${document.title}\n${fragment.section}\n${fragment.text}`), matched = terms.filter((term) => haystack.includes(term));
    return matched.length ? [{ ...structuredClone(fragment), document: { ...document }, score: matched.length, matched_terms: matched }] : [];
  }).sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const ranked = candidates.slice(0, checked.k), task = corpus.tasks.find((t) => t.id === checked.task);
  return { schema_version: 1, settings: checked, corpus, terms, candidate_count: candidates.length, ranked,
    metrics: evaluateRetrieval(ranked, task.relevant_ids, checked.k), selected_ids: [] };
}
export function formatRetrievalContext(run) {
  return run.selected_ids.map((id) => {
    const f = run.ranked.find((row) => row.id === id);
    if (!f) throw new Error('上下文片段不属于本次返回结果。');
    return `[${f.id} | ${f.document.title} | ${f.document.version} | ${f.section}]\n${f.text}`;
  }).join('\n\n');
}
export function retrievalContextSize(run) { return Array.from(formatRetrievalContext(run)).length; }
export function toggleRetrievalFragment(input, id) {
  const run = structuredClone(input);
  if (!run.ranked.some((row) => row.id === id)) throw new Error('只能选择本次返回的完整片段。');
  if (run.selected_ids.includes(id)) run.selected_ids = run.selected_ids.filter((value) => value !== id);
  else run.selected_ids.push(id);
  const used = retrievalContextSize(run);
  if (used > run.settings.context_budget) throw new Error(`完整片段与引用需要${used}字符，预算为${run.settings.context_budget}；没有加入或截断。`);
  return run;
}
export function createRetrievalReport(input) {
  let replay = createRetrievalRun(input.settings, input.corpus);
  if (!Array.isArray(input.selected_ids) || !unique(input.selected_ids)) throw new Error('上下文选择无效。');
  for (const id of input.selected_ids) replay = toggleRetrievalFragment(replay, id);
  return { schema_version: 1, kind: 'literal-retrieval-evidence-teaching', model_called: false,
    rules: { ranking: 'NFKC/lowercase; whitespace-delimited unique literal terms; presence in title/section/text; OR candidates; distinct matched terms descending then ASCII fragment ID',
      precision: 'hits/requested k; unreturned slots do not count as hits', recall: 'hits/all original task annotations, unchanged by version filtering',
      rank: 'single-task reciprocal rank within returned k, not mean reciprocal rank; no positive reference => null',
      context: 'whole fragments in selection order; exact citation headers and separators included; Unicode code points, not model tokens' },
    snapshot: replay, context: formatRetrievalContext(replay), context_characters: retrievalContextSize(replay) };
}
