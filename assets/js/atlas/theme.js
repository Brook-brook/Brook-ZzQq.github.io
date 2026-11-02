// Runs before CSS to avoid a flash of the wrong theme. Storage may be unavailable.
(() => {
  let theme;
  try {
    theme = localStorage.getItem('atlas-theme');
  } catch {
    /* private browsing */
  }
  if (!['light', 'dark'].includes(theme))
    theme = matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  document.documentElement.dataset.theme = theme;
})();
