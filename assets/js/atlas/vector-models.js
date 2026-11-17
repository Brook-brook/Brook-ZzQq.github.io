import { createRetrievalRun, literalTerms, validateRetrievalCorpus } from './retrieval-models.js';

const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join('|') === keys.slice().sort().join('|');
const length = (value) => Array.from(value).length;
const normalize = (value) => value.normalize('NFKC').toLowerCase();
const copy = (value) => JSON.parse(JSON.stringify(value));
const wellFormed = (value) => !Array.from(value).some((character) => { const point = character.codePointAt(0); return point >= 0xd800 && point <= 0xdfff; });
function frozen(value) {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) frozen(child); Object.freeze(value); }
  return value;
}

export function validateVectorCorpus(corpus) {
  validateRetrievalCorpus(corpus);
  const visit = (value) => {
    if (typeof value === 'string') { if (!wellFormed(value)) throw new Error('vector_unicode'); }
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(corpus); return corpus;
}

export function validateVectorRegistry(registry, corpus) {
  validateVectorCorpus(corpus);
  if (!exact(registry, ['schema_version', 'id', 'source_kind', 'corpus_id', 'feature_policy', 'description', 'vocabulary']) || registry.schema_version !== 1 || registry.id !== 'brook-lexical-vectors-v1' || registry.source_kind !== 'original_feature_registry' || registry.corpus_id !== corpus.corpus_id || registry.feature_policy !== 'nfkc-lower-nonoverlap-substrings-v1' || typeof registry.description !== 'string' || !registry.description.trim() || length(registry.description) > 500 || !Array.isArray(registry.vocabulary) || registry.vocabulary.length < 1 || registry.vocabulary.length > 32) throw new Error('vector_registry');
  const words = registry.vocabulary;
  if (!wellFormed(registry.description) || words.some((term) => typeof term !== 'string' || length(term) < 1 || length(term) > 24 || /\s/u.test(term) || normalize(term) !== term || !wellFormed(term)) || new Set(words).size !== words.length) throw new Error('vector_vocabulary');
  return copy(registry);
}

export function vectorCounts(text, vocabulary) {
  if (typeof text !== 'string' || length(text) > 4096 || !Array.isArray(vocabulary) || vocabulary.length < 1 || vocabulary.length > 32 || vocabulary.some((term) => typeof term !== 'string' || length(term) < 1 || length(term) > 24 || /\s/u.test(term) || normalize(term) !== term) || new Set(vocabulary).size !== vocabulary.length) throw new Error('vector_counts');
  if (!wellFormed(text) || !wellFormed(vocabulary.join(''))) throw new Error('vector_unicode');
  const input = normalize(text);
  if (length(input) > 8192) throw new Error('vector_text_size');
  return vocabulary.map((term) => {
    let total = 0, position = 0;
    while ((position = input.indexOf(term, position)) !== -1) { total++; position += term.length; }
    return total;
  });
}

function transformed(counts, appliedIdf) {
  const weighted = counts.map((value, index) => value * appliedIdf[index]);
  const norm = Math.sqrt(weighted.reduce((sum, value) => sum + value ** 2, 0));
  return { counts, weighted, norm, unit_vector: norm ? weighted.map((value) => value / norm) : null };
}

export function fitVectorIndex(input, registry, weighting = 'tfidf') {
  const corpus = validateVectorCorpus(input), checked = validateVectorRegistry(registry, corpus);
  if (!['count', 'tfidf'].includes(weighting)) throw new Error('vector_weighting');
  const counts = corpus.fragments.map((fragment) => {
    const document = corpus.documents.find((row) => row.id === fragment.document_id);
    return vectorCounts(`${document.title}\n${fragment.section}\n${fragment.text}`, checked.vocabulary);
  });
  const documentFrequency = checked.vocabulary.map((_, column) => counts.filter((row) => row[column] > 0).length);
  const inverseDocumentFrequency = documentFrequency.map((count) => Math.log((corpus.fragments.length + 1) / (count + 1)) + 1);
  const appliedIdf = weighting === 'tfidf' ? inverseDocumentFrequency : checked.vocabulary.map(() => 1);
  return { document_count: corpus.fragments.length, fit_fragment_ids: corpus.fragments.map((row) => row.id),
    document_frequency: documentFrequency, inverse_document_frequency: inverseDocumentFrequency, applied_idf: appliedIdf,
    rows: counts.map((row, i) => ({ id: corpus.fragments[i].id, ...transformed(row, appliedIdf) })) };
}

export function validateVectorSettings(value, corpus) {
  if (!exact(value, ['query', 'weighting', 'version', 'k']) || !['count', 'tfidf'].includes(value.weighting) || !(value.version === 'all' || corpus.documents.some((row) => row.version === value.version)) || !Number.isInteger(value.k) || value.k < 1 || value.k > 8) throw new Error('vector_settings');
  literalTerms(value.query);
  if (!wellFormed(value.query)) throw new Error('vector_unicode');
  return copy(value);
}

const cosine = (a, b) => a === null || b === null ? null : a.reduce((sum, value, index) => sum + value * b[index], 0);

export function createVectorRun(input, registry, draft) {
  const corpus = copy(validateVectorCorpus(input)), checked = validateVectorRegistry(registry, corpus), applied = validateVectorSettings(draft, corpus);
  // Fit on the whole public snapshot first. A display filter never refits IDF.
  const index = fitVectorIndex(corpus, checked, applied.weighting);
  const query = transformed(vectorCounts(applied.query, checked.vocabulary), index.applied_idf);
  const scores = index.rows.map((row) => {
    const fragment = corpus.fragments.find((item) => item.id === row.id), document = corpus.documents.find((item) => item.id === fragment.document_id);
    return { id: row.id, version: document.version, cosine: cosine(query.unit_vector, row.unit_vector), included: applied.version === 'all' || document.version === applied.version };
  });
  const candidates = scores.filter((row) => row.included && row.cosine !== null && row.cosine > 0)
    .sort((a, b) => b.cosine - a.cosine || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const baseline = createRetrievalRun({ task: corpus.tasks[0].id, query: applied.query, version: applied.version, k: applied.k, context_budget: 220 }, corpus);
  return frozen({ schema_version: 1, kind: 'brook-lexical-vector-run', corpus, registry: checked, settings: applied, index, query, scores,
    candidate_count: candidates.length, ranked_ids: candidates.slice(0, applied.k).map((row) => row.id),
    literal_baseline: { terms: baseline.terms, candidate_count: baseline.candidate_count,
      ranked: baseline.ranked.map((row) => ({ id: row.id, score: row.score, matched_terms: row.matched_terms })) } });
}

export function vectorEvidence(run, id) {
  run = replayVectorRun(run);
  const row = run.index.rows.find((value) => value.id === id), score = run.scores.find((value) => value.id === id);
  if (!row || !score) throw new Error('vector_fragment');
  return { id, cosine: score.cosine, terms: run.registry.vocabulary.map((term, i) => ({ term,
    document_frequency: run.index.document_frequency[i], idf: run.index.inverse_document_frequency[i], applied_idf: run.index.applied_idf[i],
    query_count: run.query.counts[i], fragment_count: row.counts[i], query_weight: run.query.weighted[i], fragment_weight: row.weighted[i],
    query_unit: run.query.unit_vector?.[i] ?? null, fragment_unit: row.unit_vector?.[i] ?? null,
    contribution: run.query.unit_vector && row.unit_vector ? run.query.unit_vector[i] * row.unit_vector[i] : null })) };
}

function replayVectorRun(run) {
  if (!exact(run, ['schema_version', 'kind', 'corpus', 'registry', 'settings', 'index', 'query', 'scores', 'candidate_count', 'ranked_ids', 'literal_baseline'])) throw new Error('vector_record');
  const replay = createVectorRun(run.corpus, run.registry, run.settings);
  const same = (a, b) => {
    if (typeof a === 'number') return typeof b === 'number' && Number.isFinite(b) && a === b;
    if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((row, i) => same(row, b[i]));
    if (a && typeof a === 'object') return exact(b, Object.keys(a)) && Object.entries(a).every(([key, value]) => same(value, b[key]));
    return a === b;
  };
  if (!same(replay, run)) throw new Error('vector_record');
  return replay;
}

export function vectorReport(run) {
  const replay = replayVectorRun(run);
  return { schema_version: 1, kind: 'brook-lexical-vector-search', model_called: false,
    rules: { features: 'NFKC/lowercase; fixed registry; non-overlapping literal substring counts per feature; different features may overlap; title/section/text joined by newline',
      fit: 'all source fragments are the rows; df counts rows containing the term; version is a post-fit candidate filter; query does not refit',
      idf: 'ln((N+1)/(df+1))+1; count mode applies1 instead; no sublinear TF',
      normalization: 'each weighted row/query is divided by its L2 norm; zero norm gives null unit vector and undefined cosine, distinct from zero similarity',
      ranking: 'positive defined cosine only; descending cosine then ASCII fragment ID; take requested k; not semantic evidence or answer grading',
      baseline: 'existing distinct whitespace-delimited literal presence rule, same query/version/k; its score is not cosine',
      export: 'complete applied query/settings, public corpus/registry and actual calculations; no future drafts, viewing choice or browser journal' }, snapshot: copy(replay) };
}
