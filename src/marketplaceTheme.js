import { SCHEME_DARK, SCHEME_LIGHT } from './storeThemeMode.js';

/** Gold accent kept as marketplace signature; ink surfaces for a premium feel. */
const ACCENT = '#f0c43a';
const ACCENT_HOVER = '#e0b42e';

function applyTokens(root, scheme) {
  if (scheme === SCHEME_DARK) {
    root.style.setProperty('--navy', '#070b14');
    root.style.setProperty('--navy-mid', '#0e1628');
    root.style.setProperty('--navy-light', '#162238');
    root.style.setProperty('--yellow', ACCENT);
    root.style.setProperty('--yellow-hover', ACCENT_HOVER);
    root.style.setProperty('--yellow-text', '#0a0f18');
    root.style.setProperty('--surface', '#121a2b');
    root.style.setProperty('--surface-elevated', '#1a2438');
    root.style.setProperty('--text', '#f4f7fb');
    root.style.setProperty('--muted', '#9aa8bc');
    root.style.setProperty('--border', 'rgba(255, 255, 255, 0.09)');
    root.style.setProperty('--header-bg', 'rgba(7, 11, 20, 0.82)');
    root.style.setProperty('--market-page-bg', '#070b14');
    root.style.setProperty('--market-glow', 'rgba(240, 196, 58, 0.18)');
    root.style.setProperty('--shadow-card', '0 8px 32px rgba(0, 0, 0, 0.28)');
    root.style.setProperty('--shadow-elevated', '0 24px 56px rgba(0, 0, 0, 0.4)');
    return;
  }

  root.style.setProperty('--navy', '#0c1220');
  root.style.setProperty('--navy-mid', '#152036');
  root.style.setProperty('--navy-light', '#243552');
  root.style.setProperty('--yellow', ACCENT);
  root.style.setProperty('--yellow-hover', ACCENT_HOVER);
  root.style.setProperty('--yellow-text', '#0c1220');
  root.style.setProperty('--surface', '#ffffff');
  root.style.setProperty('--surface-elevated', '#f8fafc');
  root.style.setProperty('--text', '#0c1220');
  root.style.setProperty('--muted', '#5b6b82');
  root.style.setProperty('--border', 'rgba(12, 18, 32, 0.1)');
  root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.86)');
  root.style.setProperty('--market-page-bg', '#eef1f6');
  root.style.setProperty('--market-glow', 'rgba(240, 196, 58, 0.22)');
  root.style.setProperty('--shadow-card', '0 10px 28px rgba(12, 18, 32, 0.08)');
  root.style.setProperty('--shadow-elevated', '0 22px 48px rgba(12, 18, 32, 0.14)');
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
