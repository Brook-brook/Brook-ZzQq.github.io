// Theme preference crosses the Atlas/legacy boundary; the legacy controls remain.
(() => {
  const root = document.documentElement;
  const sync = () => {
    const value = root.dataset.bsTheme;
    if (!['dark', 'light'].includes(value)) return;
    root.dataset.theme = value;
    try {
      localStorage.setItem('atlas-theme', value);
    } catch {
      /* optional persistence */
    }
  };
  new MutationObserver(sync).observe(root, {
    attributes: true,
    attributeFilter: ['data-bs-theme']
  });
  sync();
})();
