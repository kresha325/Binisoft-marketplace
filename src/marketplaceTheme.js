import { SCHEME_DARK, SCHEME_LIGHT } from './storeThemeMode.js';

const ACCENT = '#f5c518';
const ACCENT_HOVER = '#e6b800';

function applyTokens(root, scheme) {
  if (scheme === SCHEME_DARK) {
    root.style.setProperty('--navy', '#0a1628');
    root.style.setProperty('--navy-mid', '#0f2240');
    root.style.setProperty('--navy-light', '#152a4a');
    root.style.setProperty('--yellow', ACCENT);
    root.style.setProperty('--yellow-hover', ACCENT_HOVER);
    root.style.setProperty('--yellow-text', '#0a1628');
    root.style.setProperty('--surface', '#111d33');
    root.style.setProperty('--text', '#ffffff');
    root.style.setProperty('--muted', '#94a3b8');
    root.style.setProperty('--border', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--header-bg', 'rgba(10, 22, 40, 0.92)');
    root.style.setProperty('--market-page-bg', '#0a1628');
    root.style.setProperty('--shadow-card', '0 4px 24px rgba(0, 0, 0, 0.18)');
    root.style.setProperty('--shadow-elevated', '0 20px 48px rgba(0, 0, 0, 0.28)');
    return;
  }

  root.style.setProperty('--navy', '#0f172a');
  root.style.setProperty('--navy-mid', '#1e293b');
  root.style.setProperty('--navy-light', '#334155');
  root.style.setProperty('--yellow', ACCENT);
  root.style.setProperty('--yellow-hover', ACCENT_HOVER);
  root.style.setProperty('--yellow-text', '#0f172a');
  root.style.setProperty('--surface', '#ffffff');
  root.style.setProperty('--text', '#0f172a');
  root.style.setProperty('--muted', '#64748b');
  root.style.setProperty('--border', 'rgba(15, 23, 42, 0.12)');
  root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.92)');
  root.style.setProperty('--market-page-bg', '#eef2f7');
  root.style.setProperty('--shadow-card', '0 4px 20px rgba(15, 23, 42, 0.08)');
  root.style.setProperty('--shadow-elevated', '0 16px 40px rgba(15, 23, 42, 0.12)');
}

export function applyMarketplaceTheme(scheme = SCHEME_LIGHT) {
  const mode = scheme === SCHEME_DARK ? SCHEME_DARK : SCHEME_LIGHT;
  document.body.classList.add('marketplace-theme');
  document.body.classList.toggle('marketplace-theme--dark', mode === SCHEME_DARK);
  document.documentElement.dataset.colorScheme = mode;
  applyTokens(document.documentElement, mode);
}

export function clearMarketplaceTheme() {
  document.body.classList.remove('marketplace-theme', 'marketplace-theme--dark');
  document.documentElement.removeAttribute('data-color-scheme');
}
