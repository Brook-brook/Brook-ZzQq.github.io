import { retrievalDefaults, validateRetrievalCorpus, validateRetrievalSettings,
  createRetrievalRun, toggleRetrievalFragment, formatRetrievalContext,
  retrievalContextSize, createRetrievalReport } from './retrieval-models.js';

const root = document.querySelector('[data-retrieval]');
if (root) {
  const get = (id) => root.querySelector(`#${id}`);
  const make = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let corpus, run, dirty = false, animation;
  const rows = new Map();
  const settings = () => ({ task: get('retrieval-task').value, query: get('retrieval-query').value,
    version: get('retrieval-version').value, k: Number(get('retrieval-k').value), context_budget: Number(get('retrieval-budget').value) });
  const matchesApplied = () => JSON.stringify(settings()) === JSON.stringify(run.settings);
  function status(text, error = false) { get('retrieval-status').textContent = text; get('retrieval-status').dataset.error = String(error); }
  function markDraft() {
    dirty = !matchesApplied();
    for (const row of rows.values()) row.button.disabled = dirty;
    get('retrieval-export').disabled = dirty;
    status(dirty ? '设置已变；下方仍是上次检索与选择。重新检索后才应用，导出与片段修改已暂停。' : '设置与本次检索一致；可以继续选择完整片段。');
  }
  function guard() {
    if (matchesApplied()) return true;
    markDraft(); return false;
  }
  function renderContext() {
    const used = retrievalContextSize(run);
    get('retrieval-usage').textContent = `已用${used} / ${run.settings.context_budget}字符（包括引用与空行）`;
    get('retrieval-context').textContent = formatRetrievalContext(run) || '还没有选择片段。';
    for (const [id, row] of rows) {
      const selected = run.selected_ids.includes(id);
      row.button.setAttribute('aria-pressed', String(selected));
      row.button.textContent = selected ? '移出上下文' : '放入上下文';
      row.jump.hidden = !run.selected_ids.length;
    }
  }
  function settle() {
    animation?.cancel();
    if (!motion.matches && get('retrieval-context').animate) animation = get('retrieval-context').animate(
      [{ opacity: .75, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function renderMetrics() {
    const target = get('retrieval-metrics'); target.replaceChildren();
    if (!run.metrics) { target.append(make('p', '本题没有相关性标注；不从字面命中推算precision、recall或RR。')); return; }
    const m = run.metrics, dl = make('dl');
    for (const [label, value] of [['precision@k', m.precision_at_k], ['recall@k', m.recall_at_k], ['RR@k（单题）', m.reciprocal_rank_at_k]]) {
      const item = make('div'); item.append(make('dt', label), make('dd', value === null ? '未定义（无正例）' : value.toFixed(3))); dl.append(item);
    }
    target.append(dl, make('p', `命中${m.hits} / ${m.relevant_total}条相关标注；P@k分母=${m.requested_k}。`));
  }
  function renderResults() {
    const task = run.corpus.tasks.find((item) => item.id === run.settings.task);
    get('retrieval-question').textContent = `当前问题：${task.question}`;
    get('retrieval-result-summary').textContent = `${run.candidate_count}个字面候选，返回${run.ranked.length}条 / k=${run.settings.k}；分数只表示命中词数。`;
    get('retrieval-annotation').textContent = `${task.annotation_reason} 相关片段：${task.relevant_ids === null ? '未建立标注' : task.relevant_ids.join('、') || '集合为空'}。`;
    renderMetrics(); rows.clear(); get('retrieval-results').replaceChildren();
    get('retrieval-empty').hidden = run.ranked.length > 0;
    for (const fragment of run.ranked) {
      const li = make('li'), title = make('h3', `${fragment.document.title} / ${fragment.document.version}`);
      const meta = make('p', `${fragment.section}；${fragment.id}；命中${fragment.score}词：${fragment.matched_terms.join('、')}`); meta.className = 'retrieval-row-meta';
      const source = make('a', '回看完整出处'); source.href = `#source-${fragment.id}`; source.dataset.fragmentSource = fragment.id;
      const actions = make('div'); actions.className = 'retrieval-row-actions';
      const button = make('button', '放入上下文'); button.type = 'button'; button.dataset.fragmentToggle = fragment.id;
      button.setAttribute('aria-pressed', 'false');
      const jump = make('a', '查看上下文'); jump.href = '#retrieval-context-title'; jump.hidden = true;
      jump.addEventListener('click', (event) => { event.preventDefault(); get('retrieval-context-title').focus(); get('retrieval-context-title').scrollIntoView({ block: 'start' }); });
      const feedback = make('p'); feedback.className = 'retrieval-row-status'; feedback.setAttribute('role', 'status');
      button.addEventListener('click', () => {
        if (!guard()) return;
        try {
          const existed = run.selected_ids.includes(fragment.id);
          run = toggleRetrievalFragment(run, fragment.id); renderContext(); settle();
          feedback.textContent = existed ? '已移出；其余完整片段保持原顺序。' : '已加入完整片段；版本与适用条件一起保留。';
          feedback.dataset.error = 'false';
        } catch (error) { feedback.textContent = error.message; feedback.dataset.error = 'true'; }
      });
      actions.append(button, jump); li.append(title, meta, make('p', fragment.text), source, actions, feedback);
      get('retrieval-results').append(li); rows.set(fragment.id, { button, jump, feedback });
    }
    renderContext();
  }
  function apply() {
    try {
      const checked = validateRetrievalSettings(settings(), corpus);
      run = createRetrievalRun(checked, corpus); dirty = false; animation?.cancel(); renderResults();
      get('retrieval-export').disabled = false;
      status('已按设置检索；上下文选择已重开。');
    } catch (error) {
      dirty = true; for (const row of rows.values()) row.button.disabled = true;
      get('retrieval-export').disabled = true; status(`${error.message} 原检索与上下文未改变。`, true);
    }
  }
  for (const id of ['retrieval-query', 'retrieval-version', 'retrieval-k', 'retrieval-budget']) get(id).addEventListener('input', markDraft);
  get('retrieval-task').addEventListener('input', () => {
    const task = corpus.tasks.find((item) => item.id === get('retrieval-task').value);
    if (task) { get('retrieval-query').value = task.query; get('retrieval-version').value = 'all'; }
    markDraft();
  });
  get('retrieval-run').addEventListener('click', apply);
  get('retrieval-export').addEventListener('click', () => {
    if (!guard()) return;
    try {
      const report = createRetrievalReport(run), url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' }));
      const link = make('a'); link.href = url; link.download = 'brooks-retrieval-evidence.json'; link.hidden = true;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { status(error.message, true); }
  });
  root.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-fragment-source]');
    if (!link) return;
    get('retrieval-source').open = true;
    root.querySelector(`#source-${CSS.escape(link.dataset.fragmentSource)}`)?.focus();
  });
  motion.addEventListener('change', () => { if (motion.matches) animation?.cancel(); });
  try {
    const raw = root.querySelector('[data-retrieval-corpus]').textContent;
    if (raw.length > 128 * 1024) throw new Error('Corpus too large');
    corpus = validateRetrievalCorpus(JSON.parse(raw));
    get('retrieval-task').value = retrievalDefaults.task; get('retrieval-query').value = retrievalDefaults.query;
    get('retrieval-version').value = retrievalDefaults.version; get('retrieval-k').value = retrievalDefaults.k; get('retrieval-budget').value = retrievalDefaults.context_budget;
    get('retrieval-controls').disabled = false; apply();
    if (run) get('retrieval-source').open = false;
    else get('retrieval-controls').disabled = true;
  } catch { status('本页语料未通过检查，交互未启用；下面完整语料与原理仍可阅读。', true); }
}
