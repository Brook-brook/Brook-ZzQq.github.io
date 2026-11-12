import {
  READING_KEY, emptyReadingList, parseReadingList, toggleReading, addReadings,
  matchesSource, catalogAge, readingPlan
} from './observatory-models.js';

const room = document.querySelector('[data-observatory]');
if (room) {
  const checked = room.dataset.checkedOn;
  const items = [...room.querySelectorAll('[data-reading-item]')].map((node) => ({
    id: node.dataset.readingItem, title: node.querySelector('[data-item-title]').textContent.trim().replace(/ ↗$/, ''),
    url: node.querySelector('[data-item-url]').href, topic: node.dataset.topic,
    item_type: node.dataset.itemType, version: node.dataset.version, checked_on: checked,
    question: node.querySelector('[data-item-question]').textContent.trim().replace(/^试着回答：/, ''),
    caveat: node.querySelector('.observatory-caveat').textContent.trim().replace(/^(留意|阅读边界)：/, '')
  }));
  const byId = new Map(items.map((item) => [item.id, item]));
  const rows = [...room.querySelectorAll('[data-source-row]')];
  const buttons = [...room.querySelectorAll('[data-save-item]')];
  const query = document.getElementById('source-query');
  const storageStatus = document.getElementById('reading-storage');
  const queue = document.getElementById('reading-queue');
  const exported = document.getElementById('reading-export');
  let state = emptyReadingList();
  let lastStored = null;
  let writable = true;
  const filters = { query: '', topic: 'all', kind: 'all' };
  const setText = (element, text) => { if (element.textContent !== text) element.textContent = text; };
  try {
    lastStored = localStorage.getItem(READING_KEY);
    if (lastStored !== null) state = parseReadingList(lastStored);
    setText(storageStatus, '清单留在当前浏览器，可随时导出。');
  } catch {
    writable = false;
    setText(storageStatus, '旧清单无法读取或存储不可用，原数据未覆盖。本页只暂存，请导出后再离开。');
  }
  const age = catalogAge(checked);
  if (age === null) setText(document.getElementById('observatory-freshness'), '核对日期与本机日期无法比对，请在原站确认版本与发布状态。');
  else if (age > 30) setText(document.getElementById('observatory-freshness'), '目录距离上次核对已超过 30 天。请在原站确认链接、版本与最新发布。');

  function filterSources() {
    filters.query = query.value;
    let visible = 0;
    for (const row of rows) {
      const match = matchesSource({ topic: row.dataset.topic, kind: row.dataset.kind, search: row.dataset.search }, filters);
      row.hidden = !match;
      if (match) visible++;
    }
    setText(document.getElementById('source-count'), `${visible} / ${rows.length} 个来源`);
    document.getElementById('source-empty').hidden = visible !== 0;
  }

  function persist() {
    if (!writable) return;
    try {
      if (localStorage.getItem(READING_KEY) !== lastStored) {
        writable = false;
        setText(storageStatus, '另一标签页修改了清单。为避免覆盖，本页只暂存；请先导出，再刷新。');
        return;
      }
      const text = JSON.stringify(state);
      localStorage.setItem(READING_KEY, text); lastStored = text;
      setText(storageStatus, '已保存到当前浏览器，可下载阅读计划。');
    } catch {
      writable = false;
      setText(storageStatus, '无法写入本机存储。本页清单仍在，请先下载阅读计划；刷新后可能丢失。');
    }
  }

  function renderList(focusAfterRemove) {
    for (const button of buttons) button.setAttribute('aria-pressed', String(state.saved.some((item) => item.id === button.dataset.saveItem)));
    const nodes = state.saved.map((item) => {
      const li = document.createElement('li');
      const link = document.createElement('a'); link.href = item.url; link.textContent = item.title;
      const meta = document.createElement('small');
      meta.textContent = `${item.version}${byId.has(item.id) ? '' : ' · 历史收藏（当前目录外）'}`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '移除';
      remove.setAttribute('aria-label', `移除：${item.title}`);
      remove.addEventListener('click', () => change(() => toggleReading(state, item), item.id));
      li.append(link, meta, remove); return li;
    });
    queue.replaceChildren(...nodes);
    setText(document.getElementById('reading-count'), `已选 ${state.saved.length} 份材料 · 随时增减`);
    document.getElementById('reading-empty').hidden = state.saved.length > 0;
    exported.disabled = state.saved.length === 0;
    if (focusAfterRemove) {
      (queue.querySelector('button') || room.querySelector('[data-start-list]')).focus();
    }
  }

  function change(update, focusAfterRemove) {
    try { state = update(); renderList(focusAfterRemove); persist(); return true; }
    catch (error) { setText(storageStatus, `${error.message} 本次未改动清单。`); return false; }
  }
  for (const button of buttons) button.addEventListener('click', () => {
    const changed = change(() => toggleReading(state, byId.get(button.dataset.saveItem)));
    setText(button.closest('[data-reading-item]').querySelector('[data-save-feedback]'), changed
      ? (writable ? '清单已更新，可在阅读桌查看与导出。' : '仅本页暂存，未保存。请到阅读桌导出后再离开。')
      : '本次未更改清单，请到阅读桌查看提示。');
  });
  room.querySelectorAll('[data-start-list]').forEach((button) => button.addEventListener('click', () => {
    const added = button.dataset.startList.split(' ').map((id) => byId.get(id));
    change(() => addReadings(state, added));
  }));
  query.addEventListener('input', filterSources);
  for (const [selector, key] of [['[data-topic-filter]', 'topic'], ['[data-kind-filter]', 'kind']]) {
    room.querySelectorAll(selector).forEach((button) => button.addEventListener('click', () => {
      filters[key] = button.dataset[`${key}Filter`];
      room.querySelectorAll(selector).forEach((peer) => peer.setAttribute('aria-pressed', String(peer === button)));
      filterSources();
    }));
  }
  document.getElementById('source-reset').addEventListener('click', () => {
    filters.topic = 'all'; filters.kind = 'all'; query.value = '';
    room.querySelectorAll('[data-topic-filter], [data-kind-filter]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.topicFilter === 'all' || button.dataset.kindFilter === 'all'));
    });
    filterSources(); query.focus();
  });
  exported.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([readingPlan(state)], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'brooks-observatory-reading-plan.md';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.getElementById('reading-clear').addEventListener('click', () => {
    if (!window.confirm('清除本机观察台阅读清单？不影响学习手记、主题和校园收藏。')) return;
    try {
      localStorage.removeItem(READING_KEY); lastStored = null; writable = true;
      setText(storageStatus, '观察台清单已清除。学习手记、主题与校园收藏保留。');
    } catch {
      writable = false;
      setText(storageStatus, '本页清单已清空，但无法删除存储；刷新可能恢复旧清单。');
    }
    state = emptyReadingList(); renderList();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== READING_KEY && event.key !== null) return;
    writable = false;
    setText(storageStatus, '其他标签页修改了存储。本页暂停保存；请先导出阅读计划，再刷新。');
  });
  room.querySelectorAll('[data-observatory-control]').forEach((element) => { element.hidden = false; });
  renderList(); filterSources();
}
