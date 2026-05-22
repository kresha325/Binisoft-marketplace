import { fetchMarketplace } from './catalogApi.js';
import { cssBackgroundUrl, normalizeMediaUrl } from './externalUrl.js';
import { marketContestCardHtml } from './contests.js';
import { marketJobOpeningCardHtml } from './jobOpenings.js';
import { appendLangQuery } from './locale.js';
import { mt } from './marketplaceI18n.js';
import { registerShopCheckout } from './shopCheckout.js';
import { shopPathFor } from './slug.js';

const MARKETPLACE_HERO_BG = `${import.meta.env.BASE_URL}images/marketplace-hero.png`;

function shopLink(slug, hash = '') {
  return appendLangQuery(`${shopPathFor(slug)}${hash}`);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MARKETPLACE_TAB_IDS = ['stores', 'products', 'categories', 'offers', 'contests', 'jobs'];

function marketplaceTabLabel(tabId) {
  return {
    stores: mt('tabStores'),
    products: mt('tabProducts'),
    categories: mt('tabCategories'),
    offers: mt('tabOffers'),
    contests: mt('tabContests'),
    jobs: mt('tabJobOpenings'),
  }[tabId] || tabId;
}

/** Switch marketplace tab and re-render catalog (from burger menu, etc.). */
export function setMarketplaceTab(tabId) {
  if (!marketplaceData || !MARKETPLACE_TAB_IDS.includes(tabId)) return;
  activeTab = tabId;
  selectedCategoryKey = null;
  const root = document.getElementById('catalog');
  if (!root) return;
  root.innerHTML = renderPanel();
  bindMarketplaceEvents(root);
  const panel = root.querySelector('.market-tabs') || root.querySelector('.market-panel');
  panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function getMarketplaceTabIds() {
  return [...MARKETPLACE_TAB_IDS];
}

export function getActiveMarketplaceTab() {
  return activeTab;
}

function formatEuro(n) {
  return `€${Number(n).toFixed(2)}`;
}

let marketplaceData = null;
let activeTab = 'stores';
let searchQuery = '';
/** @type {string | null} unified category key (see categoryGroupKey) */
let selectedCategoryKey = null;

export function isMarketplaceMode() {
  return document.body.dataset.mode === 'marketplace';
}

function filterBySearch(items, fields) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((f) => String(item[f] || '').toLowerCase().includes(q)),
  );
}

/** Group by display name (case-insensitive) so "Pizza" / "pizza" are one marketplace category. */
function categoryGroupKey(c) {
  const nameKey = String(c.name || '').trim().toLowerCase();
  if (nameKey) return `name:${nameKey}`;
  const slug = String(c.slug || '').trim().toLowerCase();
  if (slug.length > 1) return `slug:${slug}`;
  return `id:${c.businessId}:${c.id}`;
}

function buildUnifiedCategories(categories) {
  const map = new Map();
  for (const c of categories) {
    const key = categoryGroupKey(c);
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        name: String(c.name || '').trim() || 'Kategori',
        refs: [],
        businessCount: 0,
      };
      map.set(key, group);
    }
    group.refs.push({
      businessId: c.businessId,
      categoryId: c.id,
      businessSlug: c.businessSlug,
      businessName: c.businessName,
    });
    const display = String(c.name || '').trim();
    if (display && (!group.name || (group.name === group.name.toLowerCase() && display !== display.toLowerCase()))) {
      group.name = display;
    }
  }
  for (const group of map.values()) {
    const biz = new Set(group.refs.map((r) => r.businessId));
    group.businessCount = biz.size;
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'sq'));
}

function productsInCategoryGroup(group, products) {
  if (!group) return [];
  const refKeys = new Set(group.refs.map((r) => `${r.businessId}:${r.categoryId}`));
  return products.filter((p) => {
    const ids = p.categoryIds || [];
    return ids.some((cid) => refKeys.has(`${p.businessId}:${cid}`));
  });
}

function marketplaceStatsDisplay(stats, categories, offers = []) {
  const unified = buildUnifiedCategories(categories || []);
  const offerProductCount =
    stats?.offerProductCount ??
    (offers || []).reduce((sum, o) => sum + (o.itemCount || o.items?.length || 0), 0);
  return {
    ...stats,
    categoryCount: unified.length,
    offerProductCount,
  };
}

function renderStats(stats) {
  const offerProducts = stats.offerProductCount ?? stats.offerCount ?? 0;
  const contestCount = stats.contestCount ?? 0;
  return `
    <div class="market-stats">
      <div class="market-stat"><span class="market-stat__value">${stats.businessCount}</span><span class="market-stat__label">${escapeHtml(mt('statStores'))}</span></div>
      <div class="market-stat"><span class="market-stat__value">${stats.productCount}</span><span class="market-stat__label">${escapeHtml(mt('statProducts'))}</span></div>
      <div class="market-stat"><span class="market-stat__value">${stats.categoryCount}</span><span class="market-stat__label">${escapeHtml(mt('statCategories'))}</span></div>
      <div class="market-stat"><span class="market-stat__value">${offerProducts}</span><span class="market-stat__label">${escapeHtml(mt('statOfferProducts'))}</span></div>
      <div class="market-stat"><span class="market-stat__value">${contestCount}</span><span class="market-stat__label">${escapeHtml(mt('statContests'))}</span></div>
      <div class="market-stat"><span class="market-stat__value">${stats.jobOpeningCount ?? 0}</span><span class="market-stat__label">${escapeHtml(mt('statJobOpenings'))}</span></div>
    </div>`;
}

function renderTabs() {
  const tabs = MARKETPLACE_TAB_IDS.map((id) => ({ id, label: marketplaceTabLabel(id) }));
  return `
    <div class="market-tabs" role="tablist">
      ${tabs
        .map(
          (t) => `
        <button type="button" class="market-tab${activeTab === t.id ? ' is-active' : ''}"
          data-market-tab="${t.id}" role="tab" aria-selected="${activeTab === t.id}">
          ${escapeHtml(t.label)}
        </button>`,
        )
        .join('')}
    </div>`;
}

function storeCoverHtml(b) {
  const cover = normalizeMediaUrl(b.coverImageUrl);
  if (cover) {
    return `<div class="market-store-card__cover" style="background-image:${escapeHtml(cssBackgroundUrl(cover))}"></div>`;
  }
  const initial = escapeHtml((b.name || '?').trim().slice(0, 1).toUpperCase());
  return `<div class="market-store-card__cover market-store-card__cover--placeholder" aria-hidden="true"><span>${initial}</span></div>`;
}

function storeLogoHtml(b) {
  const logo = normalizeMediaUrl(b.logoUrl);
  if (logo) {
    return `<img src="${escapeHtml(logo)}" alt="" class="market-store-card__logo" loading="lazy" decoding="async" />`;
  }
  return '<div class="market-store-card__logo market-store-card__logo--placeholder" aria-hidden="true">🛒</div>';
}

function renderStores(businesses) {
  const list = filterBySearch(businesses, ['name', 'slug', 'description', 'location']);
  if (!list.length) {
    return `<p class="muted market-empty">${escapeHtml(mt('emptyStores'))}</p>`;
  }
  return `
    <div class="business-grid market-grid">
      ${list
        .map((b) => {
          const desc = b.description ? String(b.description) : '';
          const descHtml =
            desc.length > 120
              ? `${escapeHtml(desc.slice(0, 120))}…`
              : escapeHtml(desc);
          return `
        <a class="business-card market-store-card" href="${escapeHtml(shopLink(b.slug))}">
          ${storeCoverHtml(b)}
          <div class="market-store-card__body">
            <div class="market-store-card__head">
              ${storeLogoHtml(b)}
              <div class="market-store-card__titles">
                <h3>${escapeHtml(b.name)}</h3>
                <span class="business-card-slug">/${escapeHtml(b.slug)}</span>
              </div>
            </div>
            ${desc ? `<p class="market-card-desc">${descHtml}</p>` : ''}
            ${b.location ? `<p class="muted market-card-meta">📍 ${escapeHtml(b.location)}</p>` : ''}
            <div class="market-store-card__counts">
              <span>${escapeHtml(mt('storeProducts', { n: b.productCount ?? 0 }))}</span>
              ${(b.categoryCount ?? 0) > 0 ? `<span>${escapeHtml(mt('storeCategories', { n: b.categoryCount }))}</span>` : ''}
              ${(b.offerProductCount ?? b.offerCount ?? 0) > 0 ? `<span>${escapeHtml(mt('storeOfferProducts', { n: b.offerProductCount ?? b.offerCount }))}</span>` : ''}
              ${(b.contestCount ?? 0) > 0 ? `<span>${escapeHtml(mt('storeContests', { n: b.contestCount }))}</span>` : ''}
              ${(b.jobOpeningCount ?? 0) > 0 ? `<span>${escapeHtml(mt('storeJobOpenings', { n: b.jobOpeningCount }))}</span>` : ''}
            </div>
            <span class="market-store-card__cta">${escapeHtml(mt('enterStore'))}</span>
          </div>
        </a>`;
        })
        .join('')}
    </div>`;
}

function renderProducts(products) {
  const list = filterBySearch(products, ['name', 'businessName', 'businessSlug']);
  if (!list.length) {
    return `<p class="muted market-empty">${escapeHtml(mt('emptyProducts'))}</p>`;
  }
  return `
    <div class="catalog market-product-grid">
      ${list
        .map(
          (p) => `
        <a class="product-card market-product-card" href="${escapeHtml(shopLink(p.businessSlug, '#products'))}">
          ${p.imageUrls?.[0] ? `<img src="${escapeHtml(normalizeMediaUrl(p.imageUrls[0]))}" alt="" class="market-product-card__img" loading="lazy" />` : '<div class="market-product-card__img market-product-card__img--placeholder">📦</div>'}
          <div class="product-body">
            <p class="market-product-card__store">${escapeHtml(p.businessName)}</p>
            <h3>${escapeHtml(p.name)}</h3>
            <p class="product-price">${p.onOffer && p.originalPrice != null ? `<span class="price-was">${formatEuro(p.originalPrice)}</span> ` : ''}${formatEuro(p.price ?? 0)}</p>
          </div>
        </a>`,
        )
        .join('')}
    </div>`;
}

function renderUnifiedCategories(categories, products) {
  const groups = buildUnifiedCategories(categories);
  const list = filterBySearch(groups, ['name']);
  if (!list.length) {
    return `<p class="muted market-empty">${escapeHtml(mt('emptyCategories'))}</p>`;
  }
  return `
    <p class="market-category-hint muted">${escapeHtml(mt('categoryHint'))}</p>
    <div class="market-category-grid">
      ${list
        .map((g) => {
          const count = productsInCategoryGroup(g, products).length;
          const bizLabel =
            g.businessCount > 1
              ? mt('storesCount', { n: g.businessCount })
              : g.refs[0]?.businessName || '';
          return `
        <button type="button" class="market-category-card" data-market-category="${escapeHtml(g.key)}">
          <span class="market-category-card__icon" aria-hidden="true">🏷️</span>
          <div class="market-category-card__body">
            <h3>${escapeHtml(g.name)}</h3>
            <p class="muted market-category-card__meta">${escapeHtml(mt('productsCount', { n: count }))}${bizLabel ? ` · ${escapeHtml(bizLabel)}` : ''}</p>
          </div>
        </button>`;
        })
        .join('')}
    </div>`;
}

function renderCategoryProductsView(group, products) {
  if (!group) {
    return `<p class="muted market-empty">${escapeHtml(mt('categoryNotFound'))}</p>`;
  }
  const filtered = productsInCategoryGroup(group, products);
  const storesLabel =
    group.businessCount === 1 ? mt('storeCountOne') : mt('storesCount', { n: group.businessCount });
  return `
    <div class="market-category-view">
      <button type="button" class="market-back-btn" data-market-category-back>${escapeHtml(mt('categoryBack'))}</button>
      <h2 class="market-category-view__title">${escapeHtml(group.name)}</h2>
      <p class="muted market-category-view__sub">${escapeHtml(
        mt('categoryViewSub', { n: filtered.length, stores: storesLabel }),
      )}</p>
    </div>
    ${renderProducts(filtered)}`;
}

function collectMarketplaceOfferProducts(offers) {
  const rows = [];
  for (const o of offers) {
    for (const item of o.items || []) {
      if (!item?.productId) continue;
      rows.push({
        ...item,
        businessSlug: o.businessSlug,
        businessName: o.businessName,
        offerTitle: o.title,
      });
    }
  }
  return rows;
}

function marketOfferPriceHtml(item) {
  const sale = Number(item.salePrice) ?? 0;
  const orig = Number(item.originalPrice) || 0;
  const onOffer = orig > sale && sale >= 0;
  if (onOffer) {
    return `<p class="product-price"><span class="price-was">${formatEuro(orig)}</span> ${formatEuro(sale)}</p>`;
  }
  return `<p class="product-price">${formatEuro(sale)}</p>`;
}

function marketOfferProductThumb(item) {
  const initial = escapeHtml((item.productName || '?').trim().slice(0, 1).toUpperCase());
  if (item.imageUrl) {
    return `<img src="${escapeHtml(normalizeMediaUrl(item.imageUrl))}" alt="" class="market-offer-product-card__img" loading="lazy" decoding="async" />`;
  }
  return `<div class="market-offer-product-card__img market-offer-product-card__img--placeholder" aria-hidden="true"><span>${initial}</span></div>`;
}

function marketOfferProductCardHtml(item) {
  const pct =
    item.discountPercent != null && item.discountPercent > 0
      ? Math.round(Number(item.discountPercent))
      : 0;
  return `
    <a class="product-card product-card--offer market-offer-product-card" href="${escapeHtml(shopLink(item.businessSlug, '#offers'))}">
      ${marketOfferProductThumb(item)}
      <div class="product-body">
        ${pct > 0 ? `<span class="offer-pct-badge">−${pct}%</span>` : ''}
        <p class="market-product-card__store">${escapeHtml(item.businessName)}</p>
        <h3>${escapeHtml(item.productName)}</h3>
        ${marketOfferPriceHtml(item)}
        ${item.onOfferHold ? `<p class="muted product-desc">${escapeHtml(mt('offerExclusive'))}</p>` : ''}
      </div>
    </a>`;
}

function renderOffersSummaryCards(offers) {
  return `
    <div class="offers-list market-offers-grid">
      ${offers
        .map(
          (o) => `
        <a class="offer-card market-offer-card" href="${escapeHtml(shopLink(o.businessSlug, '#offers'))}">
          <header class="offer-card__head">
            <div>
              <h3 class="offer-card__title">${escapeHtml(o.title)}</h3>
              <p class="muted">${escapeHtml(o.businessName)} · ${escapeHtml(mt('offerProducts', { n: o.itemCount }))}</p>
            </div>
          </header>
        </a>`,
        )
        .join('')}
    </div>`;
}

function renderContests(contests) {
  const list = filterBySearch(contests, ['title', 'businessName', 'description', 'prize']);
  if (!list.length) {
    return `<p class="muted market-empty">${escapeHtml(mt('emptyContests'))}</p>`;
  }
  const locale = getShopLocale();
  return `<div class="market-contests-grid">${list.map((c) => marketContestCardHtml(c, shopLink, locale)).join('')}</div>`;
}

function renderJobOpenings(jobs) {
  const list = filterBySearch(jobs, ['title', 'businessName', 'description', 'location']);
  if (!list.length) {
    return `<p class="muted market-empty">${escapeHtml(mt('emptyJobOpenings'))}</p>`;
  }
  const locale = getShopLocale();
  return `<div class="market-jobs-grid">${list.map((j) => marketJobOpeningCardHtml(j, shopLink, locale)).join('')}</div>`;
}

function renderOffers(offers) {
  const list = filterBySearch(offers, ['title', 'businessName', 'description']);
  let items = collectMarketplaceOfferProducts(list);
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    items = items.filter((item) =>
      [item.productName, item.businessName, item.offerTitle].some((f) =>
        String(f || '').toLowerCase().includes(q),
      ),
    );
  }

  if (items.length) {
    return `
      <div class="catalog market-offer-products-grid">
        ${items.map((item) => marketOfferProductCardHtml(item)).join('')}
      </div>`;
  }

  if (!list.length) {
    return `<p class="muted market-empty">${escapeHtml(mt('emptyOffers'))}</p>`;
  }

  return renderOffersSummaryCards(list);
}

function renderPanel() {
  if (!marketplaceData) return '';
  const { businesses, products, categories, offers, contests, jobOpenings, stats } = marketplaceData;

  let panel = '';
  switch (activeTab) {
    case 'products':
      panel = renderProducts(products);
      break;
    case 'categories': {
      if (selectedCategoryKey) {
        const group = buildUnifiedCategories(categories).find((g) => g.key === selectedCategoryKey);
        panel = renderCategoryProductsView(group, products);
      } else {
        panel = renderUnifiedCategories(categories, products);
      }
      break;
    }
    case 'offers':
      panel = renderOffers(offers);
      break;
    case 'contests':
      panel = renderContests(contests || []);
      break;
    case 'jobs':
      panel = renderJobOpenings(jobOpenings || []);
      break;
    default:
      panel = renderStores(businesses);
  }

  return `
    <div class="marketplace">
      <div class="marketplace-hero marketplace-hero--photo">
        <div
          class="marketplace-hero__cover"
          style="background-image:url('${MARKETPLACE_HERO_BG}')"
          aria-hidden="true"
        ></div>
        <div class="marketplace-hero__inner">
          <p class="marketplace-hero__eyebrow">${escapeHtml(mt('heroEyebrow'))}</p>
          <h1 class="marketplace-hero__title">${escapeHtml(mt('heroTitle'))}</h1>
          <p class="marketplace-hero__sub">${escapeHtml(mt('heroSub'))}</p>
          <label class="market-search market-search--hero">
            <span class="visually-hidden">${escapeHtml(mt('searchLabel'))}</span>
            <input type="search" id="market-search-input" placeholder="${escapeHtml(mt('searchPlaceholder'))}" value="${escapeHtml(searchQuery)}" />
          </label>
        </div>
      </div>
      ${renderStats(marketplaceStatsDisplay(stats, categories, offers))}
      ${renderTabs()}
      <div class="market-panel" role="tabpanel">${panel}</div>
    </div>`;
}

function bindMarketplaceEvents(root) {
  root.querySelectorAll('[data-market-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.getAttribute('data-market-tab') || 'stores';
      selectedCategoryKey = null;
      root.innerHTML = renderPanel();
      bindMarketplaceEvents(root);
    });
  });

  root.querySelectorAll('[data-market-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCategoryKey = btn.getAttribute('data-market-category');
      root.innerHTML = renderPanel();
      bindMarketplaceEvents(root);
    });
  });

  root.querySelector('[data-market-category-back]')?.addEventListener('click', () => {
    selectedCategoryKey = null;
    root.innerHTML = renderPanel();
    bindMarketplaceEvents(root);
  });

  const searchInput = root.querySelector('#market-search-input');
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    selectedCategoryKey = null;
    root.innerHTML = renderPanel();
    bindMarketplaceEvents(root);
    const next = root.querySelector('#market-search-input');
    if (next) {
      next.focus();
      next.setSelectionRange(next.value.length, next.value.length);
    }
  });
}

export async function loadMarketplace({ catalogEl, setCatalogMeta, applyDocumentSeo }) {
  document.body.dataset.mode = 'marketplace';
  document.body.dataset.shopView = 'marketplace';
  catalogEl.innerHTML = `<p class="loading">${escapeHtml(mt('loading'))}</p>`;

  try {
    const data = await fetchMarketplace();
    marketplaceData = data;
    (data.businesses || []).forEach((b) => registerShopCheckout(b));
    if (data.meta) setCatalogMeta(data.meta);
    applyDocumentSeo({
      title: mt('pageTitle'),
      description: mt('pageDescription'),
      locale: data.meta?.locale,
    });

    catalogEl.innerHTML = renderPanel();
    bindMarketplaceEvents(catalogEl);
  } catch (err) {
    catalogEl.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}
