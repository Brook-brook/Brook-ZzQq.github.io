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
