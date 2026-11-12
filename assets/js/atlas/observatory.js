import {
  READING_KEY, emptyReadingList, parseReadingList, toggleReading, addReadings,
  matchesSource, catalogAge, readingPlan, recordReflection, mergeReadings, MAX_LIST_BYTES, MAX_REFLECTION
} from './observatory-models.js';
import { mountStream } from './observatory-stream.js';
import { mountReadingRoom } from './reading-room.js';

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
  let pendingImport = null;
  let studio = null;
  const studyButtons = [];
  const filters = { query: '', topic: 'all', kind: 'all' };
  const setText = (element, text) => { if (element.textContent !== text) element.textContent = text; };
  const setStorage = (text) => { setText(storageStatus, text); studio?.updateStatus?.(text); };
  try {
    lastStored = localStorage.getItem(READING_KEY);
    if (lastStored !== null) state = parseReadingList(lastStored);
    setStorage('清单与理解手记留在当前浏览器，可随时备份。');
  } catch {
    writable = false;
    setStorage('旧清单无法读取或存储不可用，原数据未覆盖。本页只暂存，请导出后再离开。');
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
        setStorage('另一标签页修改了清单。为避免覆盖，本页只暂存；请先导出，再刷新。');
        return;
      }
      const text = JSON.stringify(state);
      localStorage.setItem(READING_KEY, text); lastStored = text;
      setStorage('已保存到当前浏览器，可下载阅读计划或 JSON 备份。');
    } catch {
      writable = false;
      setStorage('无法写入本机存储。本页清单仍在，请先下载阅读计划；刷新后可能丢失。');
    }
  }

  function writeNote(id, value) {
    try {
      state = recordReflection(state, id, value);
      const field = document.getElementById(`reading-note-${id}`);
      if (field && field.value !== value) field.value = value;
      const hint = document.getElementById(`reading-hint-${id}`);
      if (hint) setText(hint, `本机编辑 · ${value.length} / ${MAX_REFLECTION} 字符；保存状态见上方。`);
      persist(); return true;
    } catch (error) { setStorage(`${error.message} 请复制未保存的文字。`); return false; }
  }

  function renderList(focusAfterRemove) {
    for (const button of buttons) button.setAttribute('aria-pressed', String(state.saved.some((item) => item.id === button.dataset.saveItem)));
    for (const button of studyButtons) setText(button, state.saved.some((item) => item.id === button.dataset.studyItem) ? '继续研读' : '加入并研读');
    window.dispatchEvent(new CustomEvent('observatory:selection', { detail: state.saved.map((item) => item.id) }));
    const openNotes = new Set([...queue.querySelectorAll('details[open]')].map((node) => node.dataset.noteFor));
    const nodes = state.saved.map((item) => {
      const li = document.createElement('li');
      const link = document.createElement('a'); link.href = item.url; link.textContent = item.title;
      const meta = document.createElement('small');
      meta.textContent = `${item.version}${item.item_type === 'update' ? ' · 待核对快照' : byId.has(item.id) ? '' : ' · 历史收藏（当前目录外）'}`;
      const notes = document.createElement('details'); notes.dataset.noteFor = item.id;
      notes.open = openNotes.has(item.id);
      const summary = document.createElement('summary'); summary.textContent = '我的理解手记';
      const label = document.createElement('label'); label.htmlFor = `reading-note-${item.id}`;
      label.textContent = '主张、证据位置、我的解释与下一步验证';
      const input = document.createElement('textarea'); input.id = label.htmlFor; input.rows = 5;
      input.maxLength = MAX_REFLECTION; input.value = item.reflection; input.autocomplete = 'off';
      const hint = document.createElement('small'); hint.id = `reading-hint-${item.id}`;
      hint.textContent = `本机编辑 · ${item.reflection.length} / ${MAX_REFLECTION} 字符；保存状态见上方。`;
      input.setAttribute('aria-describedby', hint.id);
      input.addEventListener('input', () => writeNote(item.id, input.value));
      notes.append(summary, label, input, hint);
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '移除';
      remove.setAttribute('aria-label', `移除：${item.title}`);
      remove.addEventListener('click', () => removeOrToggle(item, item.id));
      li.append(link, meta);
      if (studio?.available) {
        const study = document.createElement('a'); study.href = '#reading-desk'; study.textContent = '专注研读 →'; study.dataset.studySaved = item.id;
        study.addEventListener('click', (event) => { event.preventDefault(); studio.open(item.id); }); li.append(study);
      }
      li.append(notes, remove); return li;
    });
    queue.replaceChildren(...nodes);
    setText(document.getElementById('reading-count'), `已选 ${state.saved.length} 份材料 · 随时增减`);
    document.getElementById('reading-empty').hidden = state.saved.length > 0;
    exported.disabled = state.saved.length === 0;
    studio?.refresh?.();
    if (focusAfterRemove) {
      (queue.querySelector('button') || room.querySelector('[data-start-list]')).focus();
    }
  }

  function change(update, focusAfterRemove) {
    try { state = update(); renderList(focusAfterRemove); persist(); return true; }
    catch (error) { setStorage(`${error.message} 本次未改动清单。`); return false; }
  }
  function removeOrToggle(item, focusAfterRemove) {
    const selected = state.saved.find((entry) => entry.id === item.id);
    if (selected?.reflection && !window.confirm('移除此材料及其理解手记？建议先下载备份。')) return false;
    return change(() => toggleReading(state, item), focusAfterRemove);
  }
  window.addEventListener('observatory:selection-request', () => {
    window.dispatchEvent(new CustomEvent('observatory:selection', { detail: state.saved.map((item) => item.id) }));
  });
  window.addEventListener('observatory:save-update', (event) => {
    event.detail.result = removeOrToggle(event.detail.item);
  });
  function studyItem(item) {
    if (!studio?.available) return false;
    if (!state.saved.some((entry) => entry.id === item.id) && !change(() => addReadings(state, [item]))) return false;
    return studio.open(item.id);
  }
  window.addEventListener('observatory:study-update', (event) => { event.detail.result = studyItem(event.detail.item); });
  for (const button of buttons) button.addEventListener('click', () => {
    const changed = removeOrToggle(byId.get(button.dataset.saveItem));
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
  function download(content, type, name) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a'); link.href = url; link.download = name;
    (room.querySelector('dialog[open]') || document.body).append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportMarkdown() {
    download(readingPlan(state), 'text/markdown;charset=utf-8', 'brooks-observatory-reading-plan.md');
  }
  function exportJSON() {
    download(JSON.stringify(state, null, 2) + '\n', 'application/json', 'brooks-observatory-backup.json');
  }
  exported.addEventListener('click', exportMarkdown);
  document.getElementById('reading-backup').addEventListener('click', exportJSON);
  const importFile = document.getElementById('reading-import');
  const importStatus = document.getElementById('reading-import-status');
  const importConfirm = document.getElementById('reading-import-confirm');
  let importSequence = 0;
  function cancelImport() {
    importSequence++; pendingImport = null; importFile.value = ''; importConfirm.hidden = true;
    document.getElementById('reading-import-cancel').hidden = true;
  }
  importFile.addEventListener('change', async () => {
    const sequence = ++importSequence; pendingImport = null; importConfirm.hidden = true;
    document.getElementById('reading-import-cancel').hidden = true;
    try {
      const file = importFile.files[0]; if (!file) return;
      if (file.size > MAX_LIST_BYTES) throw new Error('备份超过 2 MiB，未导入。');
      const candidate = parseReadingList(await file.text());
      if (sequence !== importSequence) return;
      const preview = mergeReadings(state, candidate); pendingImport = candidate;
      setText(importStatus, `预览：新增 ${preview.added} 份，补入 ${preview.filled} 份空白手记，保留 ${preview.kept} 份本机记录。确认后合并；本机已有手记优先。`);
      importConfirm.hidden = false; document.getElementById('reading-import-cancel').hidden = false;
    } catch (error) { if (sequence === importSequence) setText(importStatus, `${error.message} 本机内容未改变。`); }
  });
  importConfirm.addEventListener('click', () => {
    if (!pendingImport) return;
    if (change(() => mergeReadings(state, pendingImport).state)) {
      cancelImport(); setText(importStatus, '已合并到阅读桌。本机已有手记保留；保存状态见上方。');
    }
  });
  document.getElementById('reading-import-cancel').addEventListener('click', () => {
    cancelImport(); setText(importStatus, '已取消，本机内容未改变。');
  });
  document.getElementById('reading-clear').addEventListener('click', () => {
    if (!window.confirm('清除本机观察台清单及其中的理解手记？不影响学习路线手记、主题和校园收藏。')) return;
    try {
      localStorage.removeItem(READING_KEY); lastStored = null; writable = true;
      setStorage('观察台清单已清除。学习手记、主题与校园收藏保留。');
    } catch {
      writable = false;
      setStorage('本页清单已清空，但无法删除存储；刷新可能恢复旧清单。');
    }
    cancelImport(); state = emptyReadingList(); renderList();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== READING_KEY && event.key !== null) return;
    writable = false;
    setStorage('其他标签页修改了存储。本页暂停保存；请先导出阅读计划，再刷新。');
  });
  room.querySelectorAll('[data-observatory-control]').forEach((element) => { element.hidden = false; });
  studio = mountReadingRoom(room, { getState: () => state, writeNote, exportJSON, exportMarkdown, getStatus: () => storageStatus.textContent });
  if (studio.available) for (const node of room.querySelectorAll('[data-reading-item]')) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.studyItem = node.dataset.readingItem;
    button.setAttribute('aria-label', `研读：${byId.get(node.dataset.readingItem).title}`);
    button.addEventListener('click', () => studyItem(byId.get(node.dataset.readingItem)));
    (node.querySelector('.observatory-item-actions') || node).append(button); studyButtons.push(button);
  }
  renderList(); filterSources();
  mountStream(room);
}
