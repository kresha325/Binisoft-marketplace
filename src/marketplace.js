import { fetchMarketplace } from './catalogApi.js';
import { registerShopCheckout } from './shopCheckout.js';
import { shopPathFor } from './slug.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function marketplaceStatsDisplay(stats, categories) {
  const unified = buildUnifiedCategories(categories || []);
  return {
    ...stats,
    categoryCount: unified.length,
  };
}

function renderStats(stats) {
  return `
    <div class="market-stats">
      <div class="market-stat"><span class="market-stat__value">${stats.businessCount}</span><span class="market-stat__label">Dyqane</span></div>
      <div class="market-stat"><span class="market-stat__value">${stats.productCount}</span><span class="market-stat__label">Produkte</span></div>
      <div class="market-stat"><span class="market-stat__value">${stats.categoryCount}</span><span class="market-stat__label">Kategori</span></div>
      <div class="market-stat"><span class="market-stat__value">${stats.offerCount}</span><span class="market-stat__label">Oferta</span></div>
    </div>`;
}

function renderTabs() {
  const tabs = [
    { id: 'stores', label: 'Dyqane' },
    { id: 'products', label: 'Produkte' },
    { id: 'categories', label: 'Kategori' },
    { id: 'offers', label: 'Oferta' },
  ];
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
  if (b.coverImageUrl) {
    return `<div class="market-store-card__cover" style="background-image:url(${escapeHtml(b.coverImageUrl)})"></div>`;
  }
  const initial = escapeHtml((b.name || '?').trim().slice(0, 1).toUpperCase());
  return `<div class="market-store-card__cover market-store-card__cover--placeholder" aria-hidden="true"><span>${initial}</span></div>`;
}

function storeLogoHtml(b) {
  if (b.logoUrl) {
    return `<img src="${escapeHtml(b.logoUrl)}" alt="" class="market-store-card__logo" loading="lazy" decoding="async" />`;
  }
  return '<div class="market-store-card__logo market-store-card__logo--placeholder" aria-hidden="true">🛒</div>';
}

function renderStores(businesses) {
  const list = filterBySearch(businesses, ['name', 'slug', 'description', 'location']);
  if (!list.length) {
    return '<p class="muted market-empty">Nuk u gjet asnjë dyqan.</p>';
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
        <a class="business-card market-store-card" href="${escapeHtml(shopPathFor(b.slug))}">
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
              <span>${b.productCount ?? 0} produkte</span>
              ${(b.categoryCount ?? 0) > 0 ? `<span>${b.categoryCount} kategori</span>` : ''}
              ${(b.offerCount ?? 0) > 0 ? `<span>${b.offerCount} oferta</span>` : ''}
            </div>
            <span class="market-store-card__cta">Hyr në dyqan →</span>
          </div>
        </a>`;
        })
        .join('')}
    </div>`;
}
function renderProducts(products) {
  const list = filterBySearch(products, ['name', 'businessName', 'businessSlug']);
  if (!list.length) {
    return '<p class="muted market-empty">Nuk u gjet asnjë produkt.</p>';
  }
  return `
    <div class="catalog market-product-grid">
      ${list
        .map(
          (p) => `
        <a class="product-card market-product-card" href="${escapeHtml(shopPathFor(p.businessSlug))}#products">
          ${p.imageUrls?.[0] ? `<img src="${escapeHtml(p.imageUrls[0])}" alt="" class="market-product-card__img" loading="lazy" />` : '<div class="market-product-card__img market-product-card__img--placeholder">📦</div>'}
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
    return '<p class="muted market-empty">Nuk u gjet asnjë kategori.</p>';
  }
  return `
    <p class="market-category-hint muted">Zgjidhni një kategori për të parë produktet nga të gjitha dyqanet.</p>
    <div class="market-category-grid">
      ${list
        .map((g) => {
          const count = productsInCategoryGroup(g, products).length;
          const bizLabel =
            g.businessCount > 1 ? `${g.businessCount} dyqane` : g.refs[0]?.businessName || '';
          return `
        <button type="button" class="market-category-card" data-market-category="${escapeHtml(g.key)}">
          <span class="market-category-card__icon" aria-hidden="true">🏷️</span>
          <div class="market-category-card__body">
            <h3>${escapeHtml(g.name)}</h3>
            <p class="muted market-category-card__meta">${count} produkte${bizLabel ? ` · ${escapeHtml(bizLabel)}` : ''}</p>
          </div>
        </button>`;
        })
        .join('')}
    </div>`;
}

function renderCategoryProductsView(group, products) {
  if (!group) {
    return '<p class="muted market-empty">Kategoria nuk u gjet.</p>';
  }
  const filtered = productsInCategoryGroup(group, products);
  return `
    <div class="market-category-view">
      <button type="button" class="market-back-btn" data-market-category-back>← Kategoritë</button>
      <h2 class="market-category-view__title">${escapeHtml(group.name)}</h2>
      <p class="muted market-category-view__sub">${filtered.length} produkte nga ${group.businessCount} ${group.businessCount === 1 ? 'dyqan' : 'dyqane'}</p>
    </div>
    ${renderProducts(filtered)}`;
}

function renderOffers(offers) {
  const list = filterBySearch(offers, ['title', 'businessName', 'description']);
  if (!list.length) {
    return '<p class="muted market-empty">Nuk ka oferta aktive.</p>';
  }
  return `
    <div class="offers-list market-offers-grid">
      ${list
        .map(
          (o) => `
        <a class="offer-card market-offer-card" href="${escapeHtml(shopPathFor(o.businessSlug))}#offers">
          <header class="offer-card__head">
            <div>
              <h3 class="offer-card__title">${escapeHtml(o.title)}</h3>
              <p class="muted">${escapeHtml(o.businessName)} · ${o.itemCount} produkte</p>
            </div>
          </header>
        </a>`,
        )
        .join('')}
    </div>`;
}

function renderPanel() {
  if (!marketplaceData) return '';
  const { businesses, products, categories, offers, stats } = marketplaceData;

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
    default:
      panel = renderStores(businesses);
  }

  return `
    <div class="marketplace">
      <div class="marketplace-hero">
        <p class="hero-eyebrow">Binisoft Marketplace</p>
        <h1 class="marketplace-hero__title">Zbulo dyqanet &amp; blerje online</h1>
        <p class="marketplace-hero__sub">Të gjitha bizneset nga platforma — profilet krijohen nga admin dashboard dhe sinkronizohen automatikisht.</p>
        <label class="market-search">
          <span class="visually-hidden">Kërko</span>
          <input type="search" id="market-search-input" placeholder="Kërko dyqan, produkt, kategori…" value="${escapeHtml(searchQuery)}" />
        </label>
      </div>
      ${renderStats(marketplaceStatsDisplay(stats, categories))}
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
  catalogEl.innerHTML = '<p class="loading">Duke ngarkuar marketplace…</p>';

  try {
    const data = await fetchMarketplace();
    marketplaceData = data;
    (data.businesses || []).forEach((b) => registerShopCheckout(b));
    if (data.meta) setCatalogMeta(data.meta);
    applyDocumentSeo({
      title: 'Binisoft Marketplace — Dyqane & produkte',
      description: 'Zbulo të gjitha dyqanet, produktet, kategoritë dhe ofertat në platformë.',
      locale: data.meta?.locale,
    });

    catalogEl.innerHTML = renderPanel();
    bindMarketplaceEvents(catalogEl);
  } catch (err) {
    catalogEl.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}
