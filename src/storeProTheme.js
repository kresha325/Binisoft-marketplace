import { SCHEME_DARK, SCHEME_LIGHT } from './storeThemeMode.js';

/**
 * Light “pro” storefront theme (mockup-style). Uses business siteConfig accent when set.
 */
function resolveAccent(business) {
  const theme = business?.siteConfig?.theme || {};
  return theme.accent && /^#[0-9a-fA-F]{3,8}$/.test(theme.accent) ? theme.accent : '#ff6b35';
}

function applyProTokens(root, accent, scheme) {
  if (scheme === SCHEME_DARK) {
    root.style.setProperty('--navy', '#0c0a09');
    root.style.setProperty('--navy-mid', '#1c1917');
    root.style.setProperty('--navy-light', '#292524');
    root.style.setProperty('--yellow', accent);
    root.style.setProperty('--yellow-hover', accent);
    root.style.setProperty('--yellow-text', '#ffffff');
    root.style.setProperty('--surface', '#1c1917');
    root.style.setProperty('--text', '#fafaf9');
    root.style.setProperty('--muted', '#a8a29e');
    root.style.setProperty('--border', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--header-bg', 'rgba(12, 10, 9, 0.94)');
    root.style.setProperty('--store-page-bg', '#0c0a09');
    root.style.setProperty('--store-card-bg', '#1c1917');
    root.style.setProperty('--store-elevated-shadow', '0 2px 16px rgba(0, 0, 0, 0.35)');
    root.style.setProperty('--store-hover-shadow', '0 12px 32px rgba(0, 0, 0, 0.45)');
    root.style.setProperty('--store-header-shadow', '0 1px 0 var(--border), 0 4px 24px rgba(0, 0, 0, 0.4)');
    return;
  }

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
  root.style.setProperty('--store-card-bg', '#ffffff');
  root.style.setProperty('--store-elevated-shadow', '0 2px 16px rgba(28, 25, 23, 0.06)');
  root.style.setProperty('--store-hover-shadow', '0 12px 32px rgba(28, 25, 23, 0.1)');
  root.style.setProperty('--store-header-shadow', '0 1px 0 var(--border), 0 4px 24px rgba(28, 25, 23, 0.06)');
}

export function applyProStoreTheme(business, scheme = SCHEME_LIGHT) {
  const mode = scheme === SCHEME_DARK ? SCHEME_DARK : SCHEME_LIGHT;
  document.body.classList.add('store-pro');
  document.body.classList.toggle('store-pro--dark', mode === SCHEME_DARK);
  document.documentElement.dataset.colorScheme = mode;
  applyProTokens(document.documentElement, resolveAccent(business), mode);
}

export function clearProStoreTheme() {
  document.body.classList.remove('store-pro', 'store-pro--dark');
  document.documentElement.removeAttribute('data-color-scheme');
}
