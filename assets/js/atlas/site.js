const root = document.documentElement;
const toggle = document.getElementById('theme-toggle');
if (toggle) {
  function labelTheme() {
    const next = root.dataset.theme === 'light' ? '深色' : '浅色';
    toggle.setAttribute('aria-label', `切换至${next}主题`);
    toggle.querySelector('span').textContent = next;
  }
  toggle.hidden = false;
  labelTheme();
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('atlas-theme', root.dataset.theme);
      localStorage.setItem('theme', root.dataset.theme);
    } catch {
      /* optional persistence */
    }
    labelTheme();
  });
}
const menu = document.querySelector('.menu-toggle');
const nav = document.getElementById('primary-nav');
if (menu && nav) {
  menu.hidden = false;
  root.classList.add('has-js');
  const close = () => {
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      menu.getAttribute('aria-expanded') === 'true'
    ) {
      close();
      menu.focus();
    }
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });
  matchMedia('(min-width: 1051px)').addEventListener('change', close);
}
const query = document.getElementById('note-query');
if (query) {
  const index = query.closest('[data-note-index]') || query.closest('section');
  const filters = index.querySelector('.filters');
  const kinds = index.querySelector('[data-note-kinds]');
  const reset = index.querySelector('#note-reset');
  const notes = [...index.querySelectorAll('[data-note]')];
  const categories = [...filters.querySelectorAll('button[data-category]')];
  const kindButtons = [...(kinds?.querySelectorAll('button[data-kind]') || [])];
  let category = 'all';
  let kind = 'all';
  filters.hidden = false;
  index.querySelector('.note-search').hidden = false;
  if (kinds) kinds.hidden = false;
  if (reset) reset.hidden = false;

  function readState() {
    const params = new URL(location.href).searchParams;
    query.value = (params.get('q') || '').slice(0, 120);
    const requestedCategory = params.get('category');
    const requestedKind = params.get('kind');
    category = categories.some((button) => button.dataset.category === requestedCategory)
      ? requestedCategory : 'all';
    kind = kindButtons.some((button) => button.dataset.kind === requestedKind)
      ? requestedKind : 'all';
  }

  function writeState() {
    const url = new URL(location.href);
    for (const [key, value] of [['q', query.value.trim()], ['category', category], ['kind', kind]]) {
      if (!value || value === 'all') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    try {
      history.replaceState(null, '', url);
    } catch {
      // Filtering remains usable if optional URL persistence is unavailable.
    }
  }

  function filter(syncUrl = true) {
    const text = query.value.trim().toLocaleLowerCase();
    notes.forEach((note) => {
      const haystack = note.dataset.search || note.textContent;
      note.hidden = !(
        (category === 'all' || note.dataset.category === category) &&
        (kind === 'all' || (note.dataset.noteKind || 'tutorial') === kind) &&
        haystack.toLocaleLowerCase().includes(text)
      );
    });
    categories.forEach((button) => button.setAttribute('aria-pressed',
      String(button.dataset.category === category)));
    kindButtons.forEach((button) => button.setAttribute('aria-pressed',
      String(button.dataset.kind === kind)));
    const count = notes.filter((note) => !note.hidden).length;
    index.querySelector('#note-count').textContent = `${count} 篇笔记`;
    index.querySelector('#note-empty').hidden = count > 0;
    if (syncUrl) writeState();
  }
  query.addEventListener('input', () => filter());
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    category = button.dataset.category;
    filter();
  });
  kinds?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-kind]');
    if (!button) return;
    kind = button.dataset.kind;
    filter();
  });
  reset?.addEventListener('click', () => {
    query.value = '';
    category = kind = 'all';
    filter();
    query.focus();
  });
  window.addEventListener('popstate', () => {
    readState();
    filter(false);
  });
  readState();
  filter(false);
}
