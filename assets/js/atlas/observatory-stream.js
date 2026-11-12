import {
  MAX_STREAM_BYTES, parseStreamJson, validateStreamStatus, validateStreamIndex,
  validateStreamArchive, filterStream, streamSnapshot
} from './stream-models.js';

// Public bibliography only. Private reading state is owned by observatory.js.
const feedBase = 'https://raw.githubusercontent.com/Brook-brook/Brook-ZzQq.github.io/observatory-data/feed/';
const pollInterval = 5 * 60 * 1000;
const topicNames = { ai: 'AI 前沿', economy: '全球经济', politics: '国际政治' };
const setText = (node, value) => { if (node.textContent !== value) node.textContent = value; };
const el = (tag, value, className) => {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
};
const time = (value) => value ? new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
}).format(new Date(value)) : '尚无成功记录';
const order = (records) => [...records].sort((a, b) => b.changed_at.localeCompare(a.changed_at) ||
  String(b.published_at || '').localeCompare(String(a.published_at || '')) || a.id.localeCompare(b.id));

async function readJson(url, limit = MAX_STREAM_BYTES) {
  const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
    signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`快照请求失败（HTTP ${response.status}），此前内容保留。`);
  const reader = response.body.getReader(); const decoder = new TextDecoder();
  let size = 0; let raw = '';
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new Error('快照超过读取上限，此前内容保留。'); }
    raw += decoder.decode(value, { stream: true });
  }
  return parseStreamJson(raw + decoder.decode());
}

export function mountStream(room) {
  const root = room.querySelector('[data-observatory-stream]'); if (!root) return;
  const get = (id) => document.getElementById(id);
  const list = get('stream-list'); const message = get('stream-message');
  const checkButton = get('stream-check'); const applyButton = get('stream-apply');
  const daySelect = get('stream-day'); const sourceSelect = get('stream-source');
  const topicSelect = get('stream-topic'); const query = get('stream-query');
  const more = get('stream-more'); const health = get('stream-health');
  let index = null; let records = []; let selected = new Set(); let pending = null;
  let limit = 8; let checking = false; let lastCheck = 0; let viewSequence = 0;
  let currentDay = 'latest';
  function selectedButtons() {
    for (const button of list.querySelectorAll('[data-stream-save]')) {
      button.setAttribute('aria-pressed', String(selected.has(button.dataset.streamSave)));
    }
    for (const button of list.querySelectorAll('[data-stream-study]')) {
      setText(button, selected.has(button.dataset.streamStudy) ? '继续研读' : '加入并研读');
    }
  }
  window.addEventListener('observatory:selection', (event) => {
    selected = new Set(event.detail); selectedButtons();
  });
  window.dispatchEvent(new CustomEvent('observatory:selection-request'));

  function render() {
    const matches = filterStream(order(records), { topic: topicSelect.value, source: sourceSelect.value, query: query.value });
    const nodes = matches.slice(0, limit).map((item) => {
      const li = el('li'); li.dataset.streamItem = item.id;
      const meta = el('p', `${topicNames[item.topic]} / ${item.publisher} · 自动发现，待核对`, 'observatory-meta');
      const heading = el('h3'); const link = el('a', item.title + ' ↗'); link.href = item.url; heading.append(link);
      const dates = el('p', `源站发布：${item.published_at ? time(item.published_at) : '时间待核对'} · 首次收集：${time(item.first_seen_at)}`, 'stream-dates');
      const detail = el('details'); const summary = el('summary', item.revision_count ? `元信息修订 ${item.revision_count} 次与阅读边界` : '来源与阅读边界');
      detail.append(summary, el('p', item.caveat));
      if (item.date_warning) detail.append(el('p', item.date_warning === 'future' ? '源站时间异常偏晚，未作为有效发布时间；请到原文核对。' : '源站未提供可解析且带时区的发布时间，不以采集时间代替。'));
      detail.append(el('p', `最近元信息变化：${time(item.changed_at)}。归档按首次收集日（北京时间），不是新闻事件发生日。`));
      if (item.previous_versions.length) {
        const history = el('ol');
        for (const old of [...item.previous_versions].reverse()) history.append(el('li', `${time(old.changed_at)} · ${old.title}`));
        detail.append(el('p', '以下仅保留最近 10 次旧元信息，Git 数据分支保留提交历史；不存储文章正文。'), history);
      }
      const actions = el('div', '', 'observatory-item-actions');
      const save = el('button', '留在清单'); save.type = 'button'; save.dataset.streamSave = item.id;
      save.setAttribute('aria-label', `留在清单：${item.title}`);
      const desk = el('a', '到阅读桌写手记'); desk.href = '#reading-desk';
      const feedback = el('p', '', 'observatory-help'); feedback.setAttribute('role', 'status');
      save.addEventListener('click', () => {
        const detail = { item: streamSnapshot(item), result: false };
        window.dispatchEvent(new CustomEvent('observatory:save-update', { detail }));
        setText(feedback, detail.result ? '清单已更新，保存状态与备份请到阅读桌查看。' : '清单未改变，取消移除或保存提示请到阅读桌查看。');
      });
      actions.append(save);
      if (room.dataset.readingRoomEnabled === 'true') {
        const study = el('button', '加入并研读'); study.type = 'button'; study.dataset.streamStudy = item.id;
        study.setAttribute('aria-label', `研读：${item.title}`);
        study.addEventListener('click', () => {
          const detail = { item: streamSnapshot(item), result: false };
          window.dispatchEvent(new CustomEvent('observatory:study-update', { detail }));
          if (!detail.result) setText(feedback, '本次未打开研读空间，请到阅读桌查看清单容量与保存提示。');
        });
        actions.append(study);
      }
      actions.append(desk); li.append(meta, heading, dates, detail, actions, feedback); return li;
    });
    list.replaceChildren(...nodes); selectedButtons();
    setText(get('stream-count'), `显示 ${nodes.length} / ${matches.length} 份${currentDay === 'latest' ? '最近变更的元信息' : `${currentDay} 首次收集的材料`} · 档案累计 ${index.total} 份`);
    get('stream-empty').hidden = matches.length > 0;
    more.hidden = nodes.length >= matches.length;
    setText(more, `再看 ${Math.min(8, matches.length - nodes.length)} 份`);
  }

  function refreshStamp() {
    if (!index) return;
    const okay = index.sources.filter((source) => ['ok', 'not_modified'].includes(source.status)).length;
    const stale = Date.now() - Date.parse(index.attempted_at) > 6 * 60 * 60 * 1000;
    setText(get('stream-updated'), `上次采集尝试：${time(index.attempted_at)}（北京时间） · ${okay} / ${index.sources.length} 个来源响应成功${stale ? ' · 快照已超过 6 小时，请检查采集状态' : ''}`);
  }

  function renderHealth() {
    refreshStamp();
    const nodes = index.sources.map((source) => {
      const li = el('li'); const link = el('a', source.title); link.href = source.home;
      const labels = { ok: `成功 · 本轮接受 ${source.accepted} 条${source.limited ? '（达到单源上限）' : ''}`, not_modified: '成功 · 源站回复未修改', error: `采集失败 · ${source.error || '请求异常'}`, deferred: `限流等待 · 下次允许 ${time(source.retry_after)}` };
      li.append(link, el('span', labels[source.status]), el('small', `最近成功：${time(source.last_success_at)}`)); return li;
    });
    health.replaceChildren(...nodes);
    const receipts = index.recent_runs.slice().reverse().map((run) => el('li', `${time(run.at)} · ${run.sources_ok}/${run.sources_total} 源成功 · 新增 ${run.additions} · 修订 ${run.revisions}`));
    get('stream-runs').replaceChildren(...receipts);
  }

  function install(next) {
    viewSequence++; index = next; records = next.latest; currentDay = 'latest'; limit = 8;
    list.removeAttribute('aria-busy');
    const source = sourceSelect.value;
    sourceSelect.replaceChildren(new Option('全部订阅源', 'all'), ...index.sources.map((item) => new Option(item.title, item.id)));
    if ([...sourceSelect.options].some((option) => option.value === source)) sourceSelect.value = source;
    daySelect.replaceChildren(new Option('最近 60 份元信息变更', 'latest'), ...index.archives.map((day) => new Option(`${day.date} · ${day.count} 份`, day.date)));
    render(); renderHealth();
    root.querySelectorAll('[data-stream-control]').forEach((node) => { node.hidden = false; });
  }

  async function check() {
    refreshStamp();
    if (checking || document.hidden || !navigator.onLine) return;
    checking = true; lastCheck = Date.now(); checkButton.disabled = true;
    setText(message, '正在检查公共数据快照…');
    try {
      const status = validateStreamStatus(await readJson(feedBase + 'status.json', 32 * 1024));
      if (index && status.attempted_at === index.attempted_at) {
        setText(message, '已检查，采集时间未改变。失败或空订阅源的状态见下方；这不表示所有原站均无新发布。'); return;
      }
      const candidate = validateStreamIndex(await readJson(feedBase + 'index.json'));
      if (candidate.attempted_at !== status.attempted_at || candidate.total !== status.total) throw new Error('公共缓存正在切换版本，请稍后重试；此前内容保留。');
      if (globalThis.crypto?.subtle) {
        const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(candidate)));
        const digest = [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
        if (digest !== status.digest) throw new Error('快照校验不一致，请稍后重试；此前内容保留。');
      }
      if (index && Date.parse(candidate.attempted_at) < Date.parse(index.attempted_at)) throw new Error('远端返回较旧版本，保留当前快照。');
      if (!index) { install(candidate); setText(message, '已载入公开快照，标题尚未逐条核对。'); }
      else {
        pending = candidate; applyButton.hidden = false;
        setText(message, `发现 ${time(candidate.attempted_at)} 的新快照。点击载入后更新列表，阅读位置和手记不会自动刷新。`);
      }
    } catch (error) {
      setText(message, `${error.name === 'TimeoutError' ? '快照读取超时。' : error.message} 可稍后重试，或打开原站。`);
    } finally { checking = false; checkButton.disabled = false; }
  }
  checkButton.addEventListener('click', () => {
    if (!navigator.onLine) setText(message, '当前离线，已保留此前快照。联网后再检查。');
    else check();
  });
  applyButton.addEventListener('click', () => {
    if (!pending) return;
    install(pending); pending = null; applyButton.hidden = true;
    setText(message, '新快照已载入，返回最近变更。阅读桌与手记保留。'); checkButton.focus();
  });
  more.addEventListener('click', () => {
    const previous = list.children.length; limit += 8; render();
    list.children[previous]?.querySelector('h3 a')?.focus();
  });
  for (const input of [sourceSelect, topicSelect, query]) input.addEventListener(input === query ? 'input' : 'change', () => { limit = 8; render(); });
  get('stream-reset').addEventListener('click', () => {
    sourceSelect.value = 'all'; topicSelect.value = 'all'; query.value = ''; limit = 8; render(); query.focus();
  });
  daySelect.addEventListener('change', async () => {
    const sequence = ++viewSequence; const selectedDay = daySelect.value;
    if (selectedDay === 'latest') { currentDay = 'latest'; records = index.latest; limit = 8; list.removeAttribute('aria-busy'); render(); return; }
    const summary = index.archives.find((day) => day.date === selectedDay); if (!summary) return;
    setText(message, `正在读取 ${selectedDay} 的档案…`); list.setAttribute('aria-busy', 'true');
    try {
      const archive = validateStreamArchive(await readJson(feedBase + summary.path), index);
      if (sequence !== viewSequence) return;
      if (archive.date !== selectedDay) throw new Error('档案日期不匹配，此前内容保留。');
      currentDay = selectedDay; records = archive.records; limit = 8; render();
      setText(message, `已打开 ${selectedDay} 首次收集的档案（北京时间）。元信息变更仍记录在原收集日。`);
    } catch (error) { if (sequence === viewSequence) { daySelect.value = currentDay; setText(message, error.message); } }
    finally { if (sequence === viewSequence) list.removeAttribute('aria-busy'); }
  });
  async function start() {
    try { install(validateStreamIndex(await readJson(root.dataset.streamBundle))); }
    catch { setText(message, '内置快照不可读，仍可打开原始链接；正在检查公共快照。'); }
    checkButton.hidden = false;
    await check();
    setInterval(() => {
      if (!document.hidden) refreshStamp();
      if (!navigator.connection?.saveData && !document.hidden && navigator.onLine) check();
    }, pollInterval);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshStamp();
      if (!document.hidden && Date.now() - lastCheck >= pollInterval && !navigator.connection?.saveData) check();
    });
  }
  start();
}
