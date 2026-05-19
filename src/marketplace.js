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

function renderStores(businesses) {
  const list = filterBySearch(businesses, ['name', 'slug', 'description', 'location']);
  if (!list.length) {
    return '<p class="muted market-empty">Nuk u gjet asnjë dyqan.</p>';
  }
  return `
    <div class="business-grid market-grid">
      ${list
        .map(
          (b) => `
        <a class="business-card market-store-card" href="${escapeHtml(shopPathFor(b.slug))}">
          ${b.coverImageUrl ? `<div class="market-store-card__cover" style="background-image:url(${escapeHtml(b.coverImageUrl)})"></div>` : ''}
          <div class="market-store-card__body">
            ${b.logoUrl ? `<img src="${escapeHtml(b.logoUrl)}" alt="" class="business-card-logo" />` : '<div class="business-card-logo business-card-logo--placeholder">🛒</div>'}
            <h3>${escapeHtml(b.name)}</h3>
            ${b.description ? `<p class="market-card-desc">${escapeHtml(b.description)}</p>` : ''}
            ${b.location ? `<p class="muted market-card-meta">📍 ${escapeHtml(b.location)}</p>` : ''}
            <div class="market-store-card__counts">
              <span>${b.productCount ?? 0} produkte</span>
              <span>${b.categoryCount ?? 0} kategori</span>
              <span>${b.offerCount ?? 0} oferta</span>
            </div>
            <span class="business-card-slug">/${escapeHtml(b.slug)}</span>
          </div>
        </a>`,
        )
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

function renderCategories(categories) {
  const list = filterBySearch(categories, ['name', 'businessName', 'description']);
  if (!list.length) {
    return '<p class="muted market-empty">Nuk u gjet asnjë kategori.</p>';
  }
  return `
    <div class="market-category-grid">
      ${list
        .map(
          (c) => `
        <a class="market-category-card" href="${escapeHtml(shopPathFor(c.businessSlug))}#products">
          <span class="market-category-card__icon">🏷️</span>
          <div>
            <h3>${escapeHtml(c.name)}</h3>
            <p class="muted">${escapeHtml(c.businessName)}</p>
            ${c.description ? `<p class="market-card-desc">${escapeHtml(c.description)}</p>` : ''}
          </div>
        </a>`,
        )
        .join('')}
    </div>`;
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
    case 'categories':
      panel = renderCategories(categories);
      break;
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
      ${renderStats(stats)}
      ${renderTabs()}
      <div class="market-panel" role="tabpanel">${panel}</div>
    </div>`;
}

function bindMarketplaceEvents(root) {
  root.querySelectorAll('[data-market-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.getAttribute('data-market-tab') || 'stores';
      root.innerHTML = renderPanel();
      bindMarketplaceEvents(root);
    });
  });

  const searchInput = root.querySelector('#market-search-input');
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
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
