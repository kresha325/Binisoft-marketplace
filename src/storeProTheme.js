import { SCHEME_DARK, SCHEME_LIGHT } from './storeThemeMode.js';

/**
 * Premium storefront theme. Uses business siteConfig accent when set.
 */
function resolveAccent(business) {
  const theme = business?.siteConfig?.theme || {};
  return theme.accent && /^#[0-9a-fA-F]{3,8}$/.test(theme.accent) ? theme.accent : '#f5c518';
}

function applyProTokens(root, accent, scheme) {
  root.style.setProperty('--store-accent', accent);
  root.style.setProperty('--store-glow', `color-mix(in srgb, ${accent} 42%, transparent)`);

  if (scheme === SCHEME_DARK) {
    root.style.setProperty('--navy', '#070b14');
    root.style.setProperty('--navy-mid', '#0f1729');
    root.style.setProperty('--navy-light', '#1a2744');
    root.style.setProperty('--yellow', accent);
    root.style.setProperty('--yellow-hover', accent);
    root.style.setProperty('--yellow-text', '#0a1628');
    root.style.setProperty('--surface', '#121a2b');
    root.style.setProperty('--text', '#f4f7fb');
    root.style.setProperty('--muted', '#94a3b8');
    root.style.setProperty('--border', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--header-bg', 'rgba(7, 11, 20, 0.88)');
    root.style.setProperty('--store-page-bg', '#070b14');
    root.style.setProperty('--store-card-bg', '#121a2b');
    root.style.setProperty('--store-elevated-shadow', '0 8px 28px rgba(0, 0, 0, 0.4)');
    root.style.setProperty('--store-hover-shadow', '0 18px 44px rgba(0, 0, 0, 0.5)');
    root.style.setProperty('--store-header-shadow', '0 1px 0 var(--border), 0 8px 28px rgba(0, 0, 0, 0.35)');
    return;
  }

  root.style.setProperty('--navy', '#0a1628');
  root.style.setProperty('--navy-mid', '#0f2240');
  root.style.setProperty('--navy-light', '#152a4a');
  root.style.setProperty('--yellow', accent);
  root.style.setProperty('--yellow-hover', accent);
  root.style.setProperty('--yellow-text', '#0a1628');
  root.style.setProperty('--surface', '#ffffff');
  root.style.setProperty('--text', '#0c1220');
  root.style.setProperty('--muted', '#5b6577');
  root.style.setProperty('--border', 'rgba(12, 18, 32, 0.1)');
  root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.86)');
  root.style.setProperty('--store-page-bg', '#eef1f6');
  root.style.setProperty('--store-card-bg', '#ffffff');
  root.style.setProperty('--store-elevated-shadow', '0 4px 22px rgba(12, 18, 32, 0.08)');
  root.style.setProperty('--store-hover-shadow', '0 16px 40px rgba(12, 18, 32, 0.14)');
  root.style.setProperty('--store-header-shadow', '0 1px 0 var(--border), 0 8px 28px rgba(12, 18, 32, 0.06)');
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
