import { normalizeSearch } from './search-models.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const book = document.querySelector('[data-notebook]');
if (book) {
  const tabs = [...book.querySelectorAll('[data-preview-tab]')];
  const panels = [...book.querySelectorAll('[data-preview-panel]')];
  const tablist = book.querySelector('.notebook-tabs');
  tablist.hidden = false;
  tablist.setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', () => select(i, false));
    tab.addEventListener('keydown', (event) => {
      const key = event.key;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      const next =
        key === 'Home'
          ? 0
          : key === 'End'
            ? tabs.length - 1
            : (i + (key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      select(next, true);
    });
  });
  function select(index, focus) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
    if (!reduced.matches)
      panels[index].animate(
        [
          { opacity: 0.5, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'none' }
        ],
        { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
  }
  select(0, false);
  reduced.addEventListener('change', () => {
    if (reduced.matches)
      book.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  });
}

const finder = document.querySelector('[data-project-finder]');
if (finder) {
  const rows = [...document.querySelectorAll('[data-project-row]')];
  const input = finder.querySelector('input');
  const buttons = [...finder.querySelectorAll('[data-project-filter]')];
  let status = 'all';
  finder.hidden = false;
  function filter() {
    const terms = normalizeSearch(input.value.slice(0, 120)).split(/\s+/).filter(Boolean);
    rows.forEach((row) => {
      row.hidden = !((status === 'all' || row.dataset.projectStatus === status) &&
        terms.every((term) => normalizeSearch(row.dataset.projectSearch).includes(term)));
    });
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.projectFilter === status)));
    const count = rows.filter((row) => !row.hidden).length;
    finder.querySelector('[data-project-count]').textContent = `${count} / ${rows.length} 个作品记录`;
    document.querySelector('[data-project-empty]').hidden = count > 0;
  }
  input.addEventListener('input', filter);
  buttons.forEach((button) => button.addEventListener('click', () => { status = button.dataset.projectFilter; filter(); }));
  finder.querySelector('[data-project-reset]').addEventListener('click', () => {
    status = 'all'; input.value = ''; filter(); input.focus();
  });
  function revealLinkedProject(hash) {
    const row = rows.find((row) => '#' + row.id === hash);
    if (!row?.hidden) return;
    status = 'all'; input.value = ''; filter();
    row.tabIndex = -1;
    row.focus();
  }
  window.addEventListener('hashchange', () => revealLinkedProject(location.hash));
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href);
    if (url.origin === location.origin && url.pathname === location.pathname) revealLinkedProject(url.hash);
  });
  filter();
}
