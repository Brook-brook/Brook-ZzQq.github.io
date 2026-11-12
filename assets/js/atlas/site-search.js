import { SEARCH_LIMIT, searchEntries, validateSearchIndex } from './search-models.js';

export function mountSiteSearch() {
  const opener = document.querySelector('[data-open-site-search]');
  if (!opener) return;
  const dialog = document.querySelector('[data-site-search-dialog]');
  const base = opener.dataset.searchBase || '';
  const pageWidget = document.querySelector('[data-site-search-page]');
  let entries;
  let loading;
  let invoker;

  function prepare(widget, records, existing = new Map()) {
    const input = widget.querySelector('input');
    const filters = widget.querySelector('[data-search-filters]');
    const list = widget.querySelector('[data-search-results]');
    const count = widget.querySelector('[data-search-count]');
    const empty = widget.querySelector('[data-search-empty]');
    let kind = 'all';
    filters.hidden = false;
    widget.querySelector('[data-search-controls]')?.removeAttribute('hidden');
    function render() {
      const matches = searchEntries(records, input.value, kind);
      const shown = widget.hasAttribute('data-search-popup') ? matches.slice(0, 8) : matches;
      const fragment = document.createDocumentFragment();
      for (const entry of shown) {
        let node = existing.get(entry.id);
        if (!node) {
          node = document.createElement('li');
          const detail = document.createElement('span');
          detail.className = 'search-result-detail';
          detail.textContent = entry.detail;
          const heading = document.createElement('h2');
          const anchor = document.createElement('a');
          anchor.href = entry.url;
          anchor.textContent = entry.title;
          heading.append(anchor);
          const summary = document.createElement('p');
          summary.textContent = entry.summary;
          node.append(detail, heading, summary);
          existing.set(entry.id, node);
        }
        fragment.append(node);
      }
      list.replaceChildren(fragment);
      count.textContent = `${matches.length} 个匹配入口${shown.length < matches.length ? ` · 显示前 ${shown.length} 个，完整目录见下方` : ''}`;
      empty.hidden = matches.length > 0;
      filters.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.searchKind === kind)));
    }
    input.addEventListener('input', render);
    filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-search-kind]');
      if (button) { kind = button.dataset.searchKind; render(); }
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && list.querySelector('a')) {
        event.preventDefault();
        list.querySelector('a').focus();
      }
    });
    list.addEventListener('keydown', (event) => {
      const links = [...list.querySelectorAll('a')];
      const index = links.indexOf(document.activeElement);
      if (index < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowUp' && index === 0) input.focus();
      else links[event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : Math.min(links.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))].focus();
    });
    render();
  }

  if (pageWidget) {
    try {
      const nodes = [...pageWidget.querySelectorAll('[data-search-entry]')];
      entries = validateSearchIndex({ schema_version: 1, entries: nodes.map((node) => ({
        id: node.dataset.entryId, kind: node.dataset.entryKind, keywords: node.dataset.entryKeywords,
        featured: node.dataset.entryFeatured === 'true', title: node.querySelector('a').textContent,
        url: node.querySelector('a').getAttribute('href'), summary: node.querySelector('p').textContent,
        detail: node.querySelector('.search-result-detail').textContent
      })) }, base);
      prepare(pageWidget, entries, new Map(nodes.map((node) => [node.dataset.entryId, node])));
    } catch {
      pageWidget.querySelector('[data-search-error]').textContent = '筛选暂不可用，公开目录仍可直接阅读。';
    }
  }

  if (!dialog || typeof dialog.showModal !== 'function') return;
  opener.setAttribute('aria-haspopup', 'dialog');
  const widget = dialog.querySelector('[data-search-widget]');
  const input = widget.querySelector('input');
  const error = widget.querySelector('[data-search-error]');
  const retry = widget.querySelector('[data-search-retry]');
  let ready = false;

  async function readIndex() {
    if (entries) return entries;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(opener.dataset.searchIndex, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal });
      if (!response.ok || Number(response.headers.get('content-length')) > SEARCH_LIMIT) throw new Error('unavailable');
      const reader = response.body.getReader();
      const chunks = [];
      let length = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > SEARCH_LIMIT) { await reader.cancel(); throw new Error('oversize'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      entries = validateSearchIndex(JSON.parse(new TextDecoder().decode(bytes)), base);
      return entries;
    } finally { clearTimeout(timer); }
  }

  async function load() {
    if (ready || loading) return;
    widget.setAttribute('aria-busy', 'true');
    widget.querySelector('[data-search-count]').textContent = '正在读取本站公开索引……';
    error.textContent = '';
    retry.hidden = true;
    loading = readIndex();
    try {
      prepare(widget, await loading);
      ready = true;
    } catch {
      widget.querySelector('[data-search-count]').textContent = '';
      error.textContent = '索引暂时无法读取。可以重试，或打开下方的完整内容目录。';
      retry.hidden = false;
    } finally { loading = null; widget.removeAttribute('aria-busy'); }
  }

  function open() {
    if (dialog.open || document.querySelector('dialog[open]')) return;
    const menu = document.querySelector('.menu-toggle[aria-expanded="true"]');
    if (menu) menu.click();
    invoker = document.activeElement;
    dialog.showModal();
    document.documentElement.classList.add('site-search-open');
    input.focus();
    load();
  }
  opener.addEventListener('click', (event) => { event.preventDefault(); open(); });
  retry.addEventListener('click', load);
  dialog.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) { invoker = null; dialog.close(); }
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('site-search-open');
    if (invoker?.isConnected) invoker.focus();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('a[href], button, input')].filter((node) => !node.disabled && node.getClientRects().length);
    if (event.shiftKey && document.activeElement === controls[0]) {
      event.preventDefault(); controls.at(-1).focus();
    } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
      event.preventDefault(); controls[0].focus();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k' ||
      event.target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]') || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    open();
  });
}
