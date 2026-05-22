import { dashboardAppUrl, dashboardLoginUrl, dashboardRegisterUrl } from './platformLinks.js';
import { getShopLocale, LOCALE_LABELS } from './locale.js';
import { marketMt } from './marketplaceI18n.js';
import { getMarketplaceSession } from './marketplaceSession.js';
import { buildNavLinks } from './siteConfig.js';

/** Primary destinations pinned to the mobile bottom bar (max 2 + cart + menu). */
export const STORE_BOTTOM_PRIMARY = ['home', 'products'];

const MENU_SVG =
  '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Mobile bottom bar: Kreu, Produkte (if enabled), Shporta, Më shumë (opens drawer).
 * Other sections live only in the burger drawer.
 */
export function rebuildStoreBottomNav(siteConfig, bottomNavEl) {
  if (!bottomNavEl) return;
  const cartBadgeHidden = document.getElementById('bottom-cart-count')?.classList.contains('hidden');
  const cartCount = document.getElementById('bottom-cart-count')?.textContent || '0';
  const links = buildNavLinks(siteConfig);
  const linkByView = new Map(links.map((l) => [l.view, l]));

  bottomNavEl.replaceChildren();

  for (const view of STORE_BOTTOM_PRIMARY) {
    const link = linkByView.get(view);
    if (!link) continue;
    bottomNavEl.appendChild(createBottomBtn(link));
  }

  const cartBtn = document.createElement('button');
  cartBtn.type = 'button';
  cartBtn.className = 'store-bottom-nav__btn store-bottom-nav__btn--cart';
  cartBtn.id = 'bottom-cart';
  cartBtn.setAttribute('aria-label', 'Shporta');
  cartBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12L6 6z" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="20" r="1.5" fill="currentColor"/><circle cx="18" cy="20" r="1.5" fill="currentColor"/></svg><span>Shporta</span><span id="bottom-cart-count" class="store-bottom-nav__badge${cartBadgeHidden ? ' hidden' : ''}">${cartCount}</span>`;
  bottomNavEl.appendChild(cartBtn);

  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.className = 'store-bottom-nav__btn store-bottom-nav__btn--menu';
  menuBtn.dataset.bottomNav = 'menu';
  menuBtn.setAttribute('aria-label', marketMt('menuMore'));
  menuBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">${MENU_SVG}</svg><span>${escapeHtml(marketMt('menuMore'))}</span>`;
  bottomNavEl.appendChild(menuBtn);
}

function createBottomBtn(link) {
  const BOTTOM_NAV_SVG = {
    home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    products:
      '<rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/>',
  };
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'store-bottom-nav__btn';
  btn.dataset.bottomNav = link.view;
  btn.setAttribute('aria-label', link.label);
  const paths = BOTTOM_NAV_SVG[link.view] || BOTTOM_NAV_SVG.home;
  btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">${paths}</svg>`;
  const labelSpan = document.createElement('span');
  labelSpan.textContent = link.label;
  btn.appendChild(labelSpan);
  return btn;
}

/** Extra rows at bottom of store burger drawer (account, theme, language, marketplace). */
export function appendStoreDrawerExtras(siteNav, { onTheme, onLang, onMarketplace, onClose } = {}) {
  if (!siteNav) return;
  siteNav.querySelector('.store-drawer-extras')?.remove();

  const { status, displayLabel, dashboardPath } = getMarketplaceSession();
  const signedIn = status === 'signedIn' && displayLabel;
  const activeLang = LOCALE_LABELS[getShopLocale()] || getShopLocale().toUpperCase();

  let accountBlock = '';
  if (signedIn) {
    accountBlock = `
      <p class="header-menu-panel__greeting">${escapeHtml(marketMt('headerWelcome', { name: displayLabel }))}</p>
      <a class="header-menu-panel__btn header-menu-panel__btn--primary" href="${escapeHtml(dashboardAppUrl(dashboardPath))}">${escapeHtml(marketMt('headerDashboard'))}</a>`;
  } else {
    accountBlock = `
      <a class="header-menu-panel__btn" href="${escapeHtml(dashboardLoginUrl())}">${escapeHtml(marketMt('headerLogin'))}</a>
      <a class="header-menu-panel__btn header-menu-panel__btn--primary" href="${escapeHtml(dashboardRegisterUrl())}">${escapeHtml(marketMt('headerRegister'))}</a>`;
  }

  const wrap = document.createElement('div');
  wrap.className = 'store-drawer-extras header-menu-panel';
  wrap.innerHTML = `
    <p class="header-menu-panel__section">${escapeHtml(marketMt('menuAccount'))}</p>
    ${accountBlock}
    <button type="button" class="header-menu-panel__row" data-drawer-action="marketplace">
      <span>${escapeHtml(marketMt('exitToMarketplace'))}</span>
    </button>
    <button type="button" class="header-menu-panel__row" data-drawer-action="theme">
      <span>${escapeHtml(marketMt('menuTheme'))}</span>
    </button>
    <button type="button" class="header-menu-panel__row" data-drawer-action="lang">
      <span>${escapeHtml(marketMt('menuLanguage'))}</span>
      <span class="header-menu-panel__meta">${escapeHtml(activeLang)}</span>
    </button>`;

  siteNav.appendChild(wrap);

  wrap.querySelector('[data-drawer-action="theme"]')?.addEventListener('click', () => onTheme?.());
  wrap.querySelector('[data-drawer-action="lang"]')?.addEventListener('click', () => onLang?.());
  wrap.querySelector('[data-drawer-action="marketplace"]')?.addEventListener('click', () => onMarketplace?.());
  wrap.querySelectorAll('.header-menu-panel__btn').forEach((a) => {
    a.addEventListener('click', () => onClose?.());
  });
}
