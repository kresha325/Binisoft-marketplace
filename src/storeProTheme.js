/**
 * Light “pro” storefront theme (mockup-style). Uses business siteConfig accent when set.
 */
export function applyProStoreTheme(business) {
  document.body.classList.add('store-pro');
  const theme = business?.siteConfig?.theme || {};
  const accent = theme.accent && /^#[0-9a-fA-F]{3,8}$/.test(theme.accent) ? theme.accent : '#ff6b35';
  const root = document.documentElement;

  root.style.setProperty('--navy', '#1c1917');
  root.style.setProperty('--navy-mid', '#292524');
  root.style.setProperty('--navy-light', '#44403c');
  root.style.setProperty('--yellow', accent);
  root.style.setProperty('--yellow-hover', accent);
  root.style.setProperty('--yellow-text', '#ffffff');
  root.style.setProperty('--surface', '#ffffff');
  root.style.setProperty('--text', '#1c1917');
  root.style.setProperty('--muted', '#78716c');
  root.style.setProperty('--border', 'rgba(28, 25, 23, 0.1)');
  root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.92)');
  root.style.setProperty('--store-page-bg', '#f5f3f0');
}

export function clearProStoreTheme() {
  document.body.classList.remove('store-pro');
}
