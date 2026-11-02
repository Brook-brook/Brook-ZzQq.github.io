// Runs before CSS to avoid a flash of the wrong theme. Storage may be unavailable.
(() => {
  let theme;
  try {
    theme = localStorage.getItem('atlas-theme');
  } catch {
    /* private browsing */
  }
  if (!['light', 'dark'].includes(theme)) theme = 'dark';
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* optional shared preference */
  }
})();
