import { filterSavedReadings, appendReadingOutline, MAX_REFLECTION } from './observatory-models.js';

const setText = (node, value) => { if (node.textContent !== value) node.textContent = value; };
const topics = { ai: 'AI 前沿', economy: '全球经济', politics: '国际政治' };
const kinds = { source: '来源入口', briefing: '选编导读', update: '自动发现 · 待核对' };
const element = (tag, text) => { const node = document.createElement(tag); node.textContent = text; return node; };

// All private reads/writes stay with the existing controller and v2 model.
export function mountReadingRoom(root, api) {
  const dialog = root.querySelector('[data-reading-room]');
  if (!dialog || typeof dialog.showModal !== 'function') return { available: false };
  const get = (id) => document.getElementById(`reading-room-${id}`);
  const guides = new Map([...root.querySelectorAll('[data-reading-guide]')].map((node) => [node.dataset.readingGuide, {
    title: node.querySelector('[data-guide-title]').textContent.trim(),
    questions: [...node.querySelectorAll('[data-guide-questions] > li')].map((li) => li.textContent),
    outline: node.querySelector('[data-guide-outline]').textContent.trim(),
    method: node.querySelector('[data-guide-method]').href
  }]));
  if (!['ai', 'economy', 'politics'].every((id) => guides.has(id))) return { available: false };
  const search = get('query'); const topic = get('topic'); const annotated = get('annotated');
  const select = get('select'); const input = get('note'); const compare = get('compare-select');
  let currentId = ''; let compareId = ''; let firstOpen = true;
  const current = () => api.getState().saved.find((item) => item.id === currentId);
  const countInput = () => setText(get('note-hint'), `本机编辑 · ${input.value.length} / ${MAX_REFLECTION} 字符；保存状态见下方。`);

  function refreshCatalog() {
    const state = api.getState();
    const found = filterSavedReadings(state, { query: search.value, topic: topic.value, annotated: annotated.checked });
    const item = current();
    const outside = item && !found.some((entry) => entry.id === item.id);
    const options = found.map((entry) => new Option(entry.title, entry.id));
    if (outside) options.unshift(new Option(`当前研读 · ${item.title}`, item.id));
    if (!options.length) options.push(new Option('先留一份材料', ''));
    select.replaceChildren(...options); select.disabled = state.saved.length === 0;
    select.value = currentId;
    get('filter-empty').hidden = found.length > 0 && !outside;
    setText(get('filter-empty'), found.length ? '当前研读材料不在筛选结果内，内容与手记已保留。' : '没有匹配的材料。当前研读内容与手记会保留，可以重置筛选再找。');
    const notes = state.saved.filter((entry) => entry.reflection.trim()).length;
    setText(get('count'), `找到 ${found.length} / ${state.saved.length} 份 · ${notes} 份有手记`);
    get('md').disabled = state.saved.length === 0;
  }

  function renderComparison() {
    const item = api.getState().saved.find((entry) => entry.id === compareId && entry.id !== currentId);
    get('comparison').hidden = !item;
    if (!item) return;
    setText(get('compare-title'), item.title);
    get('compare-url').href = item.url;
    setText(get('compare-url'), `打开对照原文 · ${new URL(item.url).hostname} ↗`);
    setText(get('compare-version'), `${kinds[item.item_type]} · ${item.version}`);
    setText(get('compare-question'), `阅读问题：${item.question}`);
    setText(get('compare-note'), item.reflection || '尚未记录手记。这里不会自动补写答案。');
  }

  function renderCurrent() {
    const item = current();
    get('current').hidden = !item; get('empty').hidden = !!item;
    if (!item) return;
    setText(get('meta'), `${topics[item.topic]} / ${kinds[item.item_type]}`);
    setText(get('material-title'), item.title); get('source').href = item.url;
    setText(get('source'), `打开原文 · ${new URL(item.url).hostname} ↗`);
    setText(get('kind'), item.item_type === 'source'
      ? '这是可持续变化的来源入口。请在手记里定位具体文档的标题、日期与版本。'
      : item.item_type === 'update' ? '这份自动元信息尚未逐条核对。请打开原文，不用标题代替结论。' : '按收藏时的文档与版本研读；原站可能修订，请核对原文。');
    setText(get('version'), `${item.version} · ${item.item_type === 'update' ? '首次收集日' : '目录核对日'}：${item.checked_on}（北京时间）`);
    setText(get('caveat'), item.caveat); setText(get('question'), `带着问题读：${item.question}`);
    const guide = guides.get(item.topic);
    setText(get('lens-title'), guide.title);
    get('questions').replaceChildren(...guide.questions.map((question) => element('li', question)));
    get('method').href = guide.method;
    input.value = item.reflection; countInput(); setText(get('edit-feedback'), '');
    const candidates = api.getState().saved.filter((entry) => entry.id !== currentId);
    if (!candidates.some((entry) => entry.id === compareId)) compareId = '';
    compare.replaceChildren(new Option('先选择一份', ''), ...candidates.map((entry) => new Option(entry.title, entry.id)));
    compare.value = compareId; renderComparison();
  }

  function updateStatus(text) { setText(get('status'), text); }
  function open(id) {
    const saved = api.getState().saved;
    if (id && saved.some((item) => item.id === id)) currentId = id;
    else if (!saved.some((item) => item.id === currentId)) currentId = saved[0]?.id || '';
    if (firstOpen) { get('library-controls').open = !matchMedia('(max-width: 48rem)').matches; firstOpen = false; }
    renderCurrent(); refreshCatalog(); updateStatus(api.getStatus());
    if (!dialog.open) {
      document.documentElement.classList.add('reading-room-open'); dialog.showModal();
    }
    get('title').focus({ preventScroll: true });
    return true;
  }
  function close() {
    document.documentElement.classList.remove('reading-room-open'); dialog.close();
  }
  get('close').addEventListener('click', close);
  dialog.addEventListener('close', () => document.documentElement.classList.remove('reading-room-open'));
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]')]
      .filter((node) => node.tabIndex >= 0 && !node.disabled && node.getClientRects().length);
    const first = controls[0]; const last = controls.at(-1); const active = document.activeElement;
    if (!first) { event.preventDefault(); get('title').focus(); return; }
    if (event.shiftKey && (active === first || active === get('title') || !dialog.contains(active))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (active === last || active === get('title') || !dialog.contains(active))) {
      event.preventDefault(); first.focus();
    }
  });
  for (const link of root.querySelectorAll('[data-open-reading-room]')) {
    link.hidden = false;
    link.addEventListener('click', (event) => { event.preventDefault(); open(); });
  }
  for (const link of [get('find'), dialog.querySelector('[data-room-guide-link]')]) link.addEventListener('click', (event) => {
    event.preventDefault(); close();
    const target = document.querySelector(link.getAttribute('href'));
    target.tabIndex = -1; target.scrollIntoView({ block: 'start' }); target.focus({ preventScroll: true });
  });
  search.addEventListener('input', refreshCatalog);
  topic.addEventListener('change', refreshCatalog); annotated.addEventListener('change', refreshCatalog);
  get('reset').addEventListener('click', () => {
    search.value = ''; topic.value = 'all'; annotated.checked = false; refreshCatalog(); search.focus();
  });
  select.addEventListener('change', () => {
    currentId = select.value; renderCurrent(); refreshCatalog();
    get('current').scrollIntoView({ block: 'nearest' });
  });
  input.addEventListener('input', () => {
    if (!current()) return;
    api.writeNote(currentId, input.value); countInput(); refreshCatalog();
  });
  get('outline').addEventListener('click', () => {
    const item = current(); if (!item) return;
    try {
      const guide = guides.get(item.topic); const next = appendReadingOutline(input.value, guide.outline);
      if (!next.added) { setText(get('edit-feedback'), '这份手记已有该提纲，原内容保留。'); return; }
      if (!api.writeNote(item.id, next.reflection)) return;
      input.value = next.reflection; countInput(); refreshCatalog();
      setText(get('edit-feedback'), '已追加空白提纲，原手记保留。请用自己的话填写，不把提示当成答案。');
      input.focus();
      const start = input.value.length - guide.outline.trim().length - 1;
      const first = input.value.indexOf('\n', start);
      const position = input.value.indexOf('\n', first + 1);
      input.setSelectionRange(position, position);
    } catch (error) { setText(get('edit-feedback'), error.message); }
  });
  compare.addEventListener('change', () => { compareId = compare.value; renderComparison(); });
  get('json').addEventListener('click', api.exportJSON);
  get('md').addEventListener('click', api.exportMarkdown);
  root.dataset.readingRoomEnabled = 'true';
  return { available: true, open, updateStatus,
    refresh() { if (dialog.open) { refreshCatalog(); renderComparison(); } } };
}
