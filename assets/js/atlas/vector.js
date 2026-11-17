import { createVectorRun, validateVectorRegistry, validateVectorSettings, vectorEvidence, vectorReport } from './vector-models.js';

const byId = (id) => document.getElementById(id);
if (document.querySelector('[data-vector-lab]')) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)'), effects = new Set();
  const formatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 5 });
  const format = (value) => value === null ? '—' : value !== 0 && Math.abs(value) < 1e-4 ? value.toExponential(3) : formatter.format(value);
  let corpus, registry, run, selectedId = null, composing = false;
  const draft = () => ({ query: byId('vector-query').value, weighting: byId('vector-weighting').value, version: byId('vector-version').value, k: byId('vector-k').valueAsNumber });
  const element = (tag, text, attributes = {}) => {
    const node = document.createElement(tag); if (text !== undefined) node.textContent = text;
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
    return node;
  };
  const write = (id, text) => { const node = byId(id); if (node.textContent !== text) node.textContent = text; };
  const source = (id) => {
    const fragment = run.corpus.fragments.find((row) => row.id === id);
    return { fragment, document: run.corpus.documents.find((row) => row.id === fragment.document_id) };
  };
  function focus(id) { const node = byId(id); node.focus(); node.scrollIntoView({ block: 'center', behavior: 'instant' }); }
  function revealSource(id) { byId('vector-source').open = true; focus('vector-source-' + id); }
  function feedback(node) {
    for (const effect of effects) effect.cancel();
    if (!preference.matches) {
      const effect = node?.animate?.([{ opacity: .8 }, { opacity: 1 }], { duration: 180 });
      if (effect) { effects.add(effect); effect.finished.catch(() => {}).finally(() => effects.delete(effect)); }
    }
  }
  function syncDraft() {
    let valid = true;
    try { validateVectorSettings(draft(), corpus); } catch { valid = false; }
    const changed = !run || JSON.stringify(draft()) !== JSON.stringify(run.settings);
    const k = byId('vector-k').valueAsNumber;
    byId('vector-k').setAttribute('aria-invalid', String(!Number.isInteger(k) || k < 1 || k > 8));
    byId('vector-query').setAttribute('aria-invalid', String(!valid && Number.isInteger(k) && k >= 1 && k <= 8));
    byId('vector-run').disabled = !valid || composing;
    byId('vector-export').disabled = !run || changed || !valid;
    byId('vector-error').hidden = valid;
    write('vector-error', valid ? '' : '查询最多200个Unicode字符、6种空格分组；k需为1到8的整数。已计算结果保留，请修正草稿。');
    write('vector-status', changed ? '设置草稿已改变。结果仍是上次实际计算，明确计算后才更新。' : `已实际计算，返回${run.ranked_ids.length}个候选。设置改动后需重算。`);
    write('vector-export-status', changed ? '先应用或还原设置，再下载与当前设置一致的记录。' : '点击后下载已应用查询与全部公开计算输入；观察选择不进入记录。');
  }
  function tableRow(values) {
    const row = element('tr');
    values.forEach((value, index) => row.append(element(index === 0 ? 'th' : 'td', value, index === 0 ? { scope: 'row' } : {})));
    return row;
  }
  function renderTerms(evidence) {
    byId('vector-term-caption').textContent = evidence ? `已计算查询与当前观察${evidence.id}的完整数值；选择只切换观察。` : '已计算查询的词项统计，当前没有观察片段；“—”表示未计算或未定义。';
    byId('vector-term-table').replaceChildren(...run.registry.vocabulary.map((term, index) => {
      const observed = evidence?.terms[index];
      return tableRow([term, String(run.index.document_frequency[index]), format(run.index.inverse_document_frequency[index]), format(run.index.applied_idf[index]), String(run.query.counts[index]), format(run.query.weighted[index]), format(run.query.unit_vector?.[index] ?? null), format(observed?.fragment_count ?? null), format(observed?.fragment_weight ?? null), format(observed?.fragment_unit ?? null), format(observed?.contribution ?? null)]);
    }));
  }
  function renderSelection() {
    for (const node of byId('vector-results').querySelectorAll('button[data-vector-id]')) node.setAttribute('aria-pressed', String(node.dataset.vectorId === selectedId));
    byId('vector-selection').hidden = selectedId === null;
    byId('vector-no-selection').hidden = selectedId !== null;
    if (selectedId === null) { byId('vector-selection-status').textContent = '当前没有正分候选。'; renderTerms(null); return; }
    const { fragment, document } = source(selectedId), evidence = vectorEvidence(run, selectedId);
    renderTerms(evidence);
    byId('vector-selected-title').textContent = document.title;
    byId('vector-selected-source').textContent = `${document.version}，${fragment.section}，${fragment.id}；原创虚构原文。`;
    byId('vector-fragment-text').textContent = fragment.text;
    byId('vector-score').textContent = format(evidence.cosine);
    byId('vector-contributions').replaceChildren(...evidence.terms.filter((term) => term.contribution > 0).map((term) => {
      const row = element('li'), meter = element('meter', undefined, { min: 0, max: 1, value: term.contribution, 'aria-hidden': 'true' });
      row.append(element('span', term.term), meter, element('span', format(term.contribution), { class: 'vector-contribution-value' }));
      return row;
    }));
    const zero = evidence.terms.filter((term) => term.contribution === 0);
    byId('vector-zero-features').hidden = zero.length === 0;
    byId('vector-zero-summary').textContent = `另外${zero.length}项贡献为0`;
    byId('vector-zero-terms').replaceChildren(...zero.map((term) => element('li', `${term.term}：查询${format(term.query_unit)}，片段${format(term.fragment_unit)}，乘积0。`)));
    byId('vector-source-link').setAttribute('href', '#vector-source-' + selectedId);
    byId('vector-selection-status').textContent = `当前观察${fragment.id}，余弦${format(evidence.cosine)}。`;
  }
  function render() {
    const label = run.settings.weighting === 'tfidf' ? 'TF-IDF后归一化' : '原始计数后归一化';
    byId('vector-applied').textContent = `已计算：“${run.settings.query}”，${label}，${run.settings.version === 'all' ? '所有版本' : run.settings.version}，k=${run.settings.k}。`;
    byId('vector-candidate-count').textContent = `${run.candidate_count}个正分候选，实际返回${run.ranked_ids.length}个。拟合范围始终为完整8片段。`;
    byId('vector-results').replaceChildren(...run.ranked_ids.map((id) => {
      const { fragment, document } = source(id), score = run.scores.find((row) => row.id === id), row = element('li');
      const actions = element('div', undefined, { class: 'vector-candidate-actions' });
      const inspect = element('button', '拆开分数', { type: 'button', 'data-vector-id': id, 'aria-pressed': id === selectedId });
      inspect.addEventListener('click', () => {
        if (selectedId !== id) { selectedId = id; renderSelection(); feedback(byId('vector-selection')); }
        if (matchMedia('(max-width: 900px)').matches) focus('vector-evidence-title');
      });
      const anchor = element('a', '完整原文', { href: '#vector-source-' + id });
      anchor.addEventListener('click', (event) => { event.preventDefault(); revealSource(id); });
      actions.append(inspect, anchor);
      row.append(element('h3', document.title), element('p', `${document.version}，${fragment.section}`, { class: 'vector-help' }),
        element('p', `余弦 ${format(score.cosine)}`, { class: 'vector-help' }), actions);
      return row;
    }));
    const empty = run.ranked_ids.length === 0;
    byId('vector-empty').hidden = !empty;
    byId('vector-empty-title').textContent = run.query.norm === 0 ? '固定词表没有覆盖这次查询。' : '当前版本中没有正分候选。';
    byId('vector-empty-detail').textContent = run.query.norm === 0
      ? `查询向量范数为0，余弦未定义；原字面规则仍有${run.literal_baseline.candidate_count}个候选。可展开对照核查原文，或换回默认词项。`
      : '词项已被表示，但当前版本筛选后没有正分候选；这不代表现实中没有资料。';
    renderSelection();
    byId('vector-count-table').replaceChildren(...run.index.rows.map((row) => tableRow([row.id, ...row.counts.map(String), format(row.norm), format(run.scores.find((value) => value.id === row.id).cosine), run.scores.find((value) => value.id === row.id).included ? '范围内' : '已过滤'])));
    byId('vector-fit-summary').textContent = `实际拟合${run.index.document_count}行、${run.registry.vocabulary.length}列；版本筛选后仍保留同一组df和IDF。count模式的“本次权重”为1，IDF列继续提供对照。`;
    byId('vector-baseline-summary').textContent = `同一查询、候选版本与k下，原字面规则有${run.literal_baseline.candidate_count}个候选，返回${run.literal_baseline.ranked.length}个。它的分数是不同查询词命中数。`;
    byId('vector-baseline-results').replaceChildren(...run.literal_baseline.ranked.map((row) => {
      const { fragment, document } = source(row.id), li = element('li');
      const anchor = element('a', `${document.title} / ${document.version} / ${fragment.section}`, { href: '#vector-source-' + row.id });
      anchor.addEventListener('click', (event) => { event.preventDefault(); revealSource(row.id); });
      li.append(anchor, element('p', `字面命中数${row.score}；${row.matched_terms.join('、')}`, { class: 'vector-help' })); return li;
    }));
    syncDraft();
  }
  function apply() {
    if (composing) return;
    try { run = createVectorRun(corpus, registry, draft()); selectedId = run.ranked_ids[0] ?? null; render(); feedback(byId('vector-visual')); }
    catch { byId('vector-error').hidden = false; byId('vector-error').textContent = '本次未能计算；已应用结果保留。请检查查询与设置，或重新加载公开输入。'; }
  }
  try {
    const raw = byId('vector-corpus-data').textContent, rawRegistry = byId('vector-registry-data').textContent;
    if (raw.length > 65536 || rawRegistry.length > 16000) throw new Error('vector_data_size');
    corpus = JSON.parse(raw); registry = validateVectorRegistry(JSON.parse(rawRegistry), corpus);
    run = createVectorRun(corpus, registry, draft()); selectedId = run.ranked_ids[0] ?? null;
    byId('vector-form').addEventListener('submit', (event) => { event.preventDefault(); apply(); });
    for (const id of ['vector-query', 'vector-weighting', 'vector-version', 'vector-k']) {
      byId(id).addEventListener('input', syncDraft); byId(id).addEventListener('change', syncDraft);
    }
    byId('vector-query').addEventListener('compositionstart', () => { composing = true; syncDraft(); });
    byId('vector-query').addEventListener('compositionend', () => { composing = false; syncDraft(); });
    const replaceQuery = (query) => { byId('vector-query').value = query; syncDraft(); focus('vector-query'); };
    for (const node of document.querySelectorAll('[data-vector-query]')) node.addEventListener('click', () => replaceQuery(node.dataset.vectorQuery));
    byId('vector-recover').addEventListener('click', () => replaceQuery('保留 空间'));
    byId('vector-source-link').addEventListener('click', (event) => { event.preventDefault(); if (selectedId) revealSource(selectedId); });
    byId('vector-results-jump').addEventListener('click', (event) => { event.preventDefault(); focus('vector-results-title'); });
    byId('vector-input-jump').addEventListener('click', (event) => { event.preventDefault(); focus('vector-query'); });
    byId('vector-back-results').addEventListener('click', (event) => { event.preventDefault(); focus('vector-results-title'); });
    byId('vector-export').addEventListener('click', () => {
      if (byId('vector-export').disabled) return;
      const report = vectorReport(run), url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' }));
      const link = element('a', undefined, { href: url, download: 'brook-vector-record.json' }); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    preference.addEventListener('change', () => { if (preference.matches) for (const effect of effects) effect.cancel(); });
    byId('vector-controls').disabled = false; byId('vector-stage').dataset.vectorReady = 'true'; byId('vector-candidates').hidden = false; byId('vector-visual').hidden = false; byId('vector-source').open = false; render(); byId('vector-results-jump').hidden = false; byId('vector-matrix').hidden = false;
  } catch {
    run = null; byId('vector-controls').disabled = true; byId('vector-export').disabled = true; byId('vector-visual').hidden = true;
    delete byId('vector-stage').dataset.vectorReady; byId('vector-candidates').hidden = true; byId('vector-matrix').hidden = true;
    byId('vector-results-jump').hidden = true; byId('vector-export-status').textContent = '输入未通过检查，未生成可下载记录。';
    byId('vector-status').textContent = '公开输入未通过检查，未建立可用结果。可继续阅读公式、固定词表与完整语料，重新加载后再试。';
    byId('vector-source').open = true;
  }
}
