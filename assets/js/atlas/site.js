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
  const filters = document.querySelector('.filters');
  filters.hidden = false;
  document.querySelector('.note-search').hidden = false;
  const notes = [...document.querySelectorAll('[data-note]')];
  let category = 'all';
  function filter() {
    const text = query.value.trim().toLocaleLowerCase();
    notes.forEach((note) => {
      note.hidden = !(
        (category === 'all' || note.dataset.category === category) &&
        note.textContent.toLocaleLowerCase().includes(text)
      );
    });
    const count = notes.filter((note) => !note.hidden).length;
    document.getElementById('note-count').textContent = `${count} 篇笔记`;
    document.getElementById('note-empty').hidden = count > 0;
  }
  query.addEventListener('input', filter);
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    category = button.dataset.category;
    filters
      .querySelectorAll('button')
      .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    filter();
  });
  filter();
}
