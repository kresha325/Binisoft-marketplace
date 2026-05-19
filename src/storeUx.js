/** Storefront scroll navigation, empty states, and loading placeholders. */

export const STORE_VIEW_SECTIONS = {
  home: { sectionId: 'hero', scrollTop: true },
  products: { sectionId: 'shop-products' },
  offers: { sectionId: 'offers' },
  services: { sectionId: 'shop-services' },
  about: { sectionId: 'about' },
  gallery: { sectionId: 'gallery' },
  contact: { sectionId: 'contact' },
};

export function isStoreMode() {
  return document.body.dataset.mode === 'store';
}

function headerOffset() {
  const h = getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim();
  const n = parseInt(h, 10);
  return (Number.isFinite(n) ? n : 72) + 16;
}

export function scrollToStoreView(view) {
  const cfg = STORE_VIEW_SECTIONS[view] || STORE_VIEW_SECTIONS.home;
  if (cfg.scrollTop || view === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(cfg.sectionId);
  if (!el || el.classList.contains('site-section-disabled')) return;
  const y = el.getBoundingClientRect().top + window.scrollY - headerOffset();
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}

export function detectStoreViewFromScroll() {
  const offset = headerOffset() + 40;
  const entries = Object.entries(STORE_VIEW_SECTIONS).filter(([, cfg]) => !cfg.scrollTop);
  let active = 'home';
  for (const [view, cfg] of entries) {
    const el = document.getElementById(cfg.sectionId);
    if (!el || el.classList.contains('site-section-disabled')) continue;
    if (el.getBoundingClientRect().top <= offset) active = view;
  }
  return active;
}

export function initStoreScrollSpy(onViewChange) {
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!isStoreMode() || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        onViewChange(detectStoreViewFromScroll(), { fromScroll: true });
      });
    },
    { passive: true },
  );
}

export function emptyStateHtml({ title, text, actionLabel, actionView }) {
  const action =
    actionLabel && actionView
      ? `<button type="button" class="empty-state__action" data-empty-action="${actionView}">${actionLabel}</button>`
      : '';
  return `
    <div class="empty-state" role="status">
      <div class="empty-state__icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
      </div>
      <p class="empty-state__title">${title}</p>
      ${text ? `<p class="empty-state__text">${text}</p>` : ''}
      ${action}
    </div>`;
}


export function catalogSkeletonHtml(count = 6) {
  const cards = Array.from({ length: count }, () => '<div class="skeleton-card" aria-hidden="true"></div>').join(
    '',
  );
  return `<div class="catalog catalog--skeleton" aria-busy="true" aria-label="Duke ngarkuar produktet">${cards}</div>`;
}
