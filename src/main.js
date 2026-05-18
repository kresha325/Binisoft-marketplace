import config, {
  canPlaceOrders,
  cancelOrderUrl,
  checkoutUrl,
  getApiKey,
  getApiKeyForSlug,
  getSlug,
  hasStoreSlug,
  orderUrl,
} from './config.js';
import { fetchBusinesses, fetchCatalog, fetchOffers } from './catalogApi.js';
import {
  applyDocumentSeo,
  businessSeoFromProfile,
  hasLocalizedUrlSlug,
  itemUrlSlug,
} from './catalogDisplay.js';
import {
  getCatalogMeta,
  getShopLocale,
  LOCALE_LABELS,
  setCatalogMeta,
  setShopLocale,
} from './locale.js';
import { isStorePath, marketplaceHomePath, shopPathFor } from './slug.js';
import {
  addToCart,
  cartBusinessSlugs,
  cartCount,
  cartTotal,
  clearCart,
  groupCartByBusiness,
  loadCart,
  saveCart,
  updateQty,
} from './cart.js';
import { initGallery, openGallery } from './gallery.js';
import {
  clearPendingOrder,
  isPendingStatus,
  isTerminalStatus,
  loadPendingOrder,
  savePendingOrder,
} from './pendingOrder.js';
import { loadMarketplace, isMarketplaceMode } from './marketplace.js';
import { applySiteConfig } from './siteConfig.js';

const $ = (sel) => document.querySelector(sel);

const offersSection = $('#offers');
const offersListEl = $('#offers-list');
const offersEmptyEl = $('#offers-empty');
const catalogEl = $('#catalog');
const cartPanel = $('#cart-panel');
const cartLines = $('#cart-lines');
const cartEmpty = $('#cart-empty');
const cartTotalEl = $('#cart-total');
const cartCountEl = $('#cart-count');
const orderPreview = $('#order-preview');
const orderNotes = $('#order-notes');
const customerNameInput = $('#customer-name');
const customerPhoneInput = $('#customer-phone');
const btnWhatsApp = $('#btn-whatsapp');
const btnSms = $('#btn-sms');
const checkoutError = $('#checkout-error');
const pendingOrderEl = $('#pending-order');
const checkoutForm = document.querySelector('.checkout-form');
const shopName = $('#shop-name');
const shopSlug = $('#shop-slug');
const heroTitle = $('#hero-title');
const heroEyebrow = $('#hero-eyebrow');
const heroCta = $('#hero-cta');
const aboutText = $('#about-text');
const contactText = $('#contact-text');
const contactWa = $('#contact-wa');
const footerName = $('#footer-name');
const footerYear = $('#footer-year');
const navToggle = $('#nav-toggle');
const siteNav = $('#site-nav');
const brandLink = $('#brand-link');
const langSwitcherEl = $('#lang-switcher');

let products = [];
let categories = [];
let selectedCategoryId = '';
let shopLogoUrl = '';
let offers = [];
let businessName = 'Biznesi';
let businessProfile = {};
let pollTimer = null;

/** JSON headers; API key only when set (integrations). Public orders use phone verification. */
const orderHeaders = (slug = getSlug()) => {
  const headers = { 'Content-Type': 'application/json' };
  const key = getApiKeyForSlug(slug) || getApiKey();
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
};

function formatEuro(n) {
  return `€${Number(n).toFixed(2)}`;
}

function displayShopName(name) {
  const text = String(name || 'Shop').trim();
  shopName.textContent = text;
  if (footerName) footerName.textContent = text;
  if (brandLink) brandLink.setAttribute('aria-label', `${text} — Kreu`);
}

function setHeroVisual(logoUrl) {
  const card = document.querySelector('.hero-visual-card');
  if (!card) return;
  card.replaceChildren();
  if (logoUrl) {
    const img = document.createElement('img');
    img.className = 'hero-visual-logo';
    img.src = logoUrl;
    img.alt = '';
    card.appendChild(img);
  } else {
    const icon = document.createElement('div');
    icon.className = 'hero-visual-icon';
    icon.textContent = '🛒';
    card.appendChild(icon);
  }
}

function updateShopPresentation(business) {
  businessProfile = business || {};
  const name = business?.name || 'Dyqani';
  const desc =
    business?.description ||
    'Produkte të zgjedhura me kujdes, çmime konkurruese dhe porosi të shpejta përmes WhatsApp.';
  displayShopName(name);
  if (heroTitle) {
    heroTitle.textContent = `Mirësevini në ${name}`;
  }
  if (heroEyebrow) heroEyebrow.textContent = name;
  if (aboutText) {
    const loc = business?.location ? `\n\n📍 ${business.location}` : '';
    aboutText.textContent = `${desc}${loc}`.trim();
  }
  if (shopSlug) {
    const pathSlug = itemUrlSlug(business) || business?.slug || '';
    shopSlug.textContent = pathSlug ? `/${pathSlug}` : '';
    shopSlug.classList.toggle('hidden', !pathSlug);
    if (hasLocalizedUrlSlug(business)) {
      shopSlug.title = `/${business.slug}`;
    } else {
      shopSlug.removeAttribute('title');
    }
  }

  const coverEl = document.getElementById('hero-cover');
  const heroSection = document.getElementById('hero');
  const coverUrl = business?.coverImageUrl || '';
  if (coverEl && heroSection) {
    if (coverUrl) {
      coverEl.style.backgroundImage = `url(${coverUrl})`;
      coverEl.classList.remove('hidden');
      heroSection.classList.add('hero--with-cover');
    } else {
      coverEl.classList.add('hidden');
      coverEl.style.backgroundImage = '';
      heroSection.classList.remove('hero--with-cover');
    }
  }

  const profileBar = document.getElementById('hero-profile-bar');
  const profileLogo = document.getElementById('hero-profile-logo');
  const locationEl = document.getElementById('hero-location');
  const websiteEl = document.getElementById('hero-website');
  shopLogoUrl = business?.logoUrl || '';
  setHeroVisual(shopLogoUrl);

  if (profileBar) {
    const hasMeta =
      shopLogoUrl || business?.location || business?.website || business?.orderPhone;
    profileBar.classList.toggle('hidden', !hasMeta);
  }
  if (profileLogo) {
    if (shopLogoUrl) {
      profileLogo.src = shopLogoUrl;
      profileLogo.classList.remove('hidden');
    } else {
      profileLogo.classList.add('hidden');
    }
  }
  if (locationEl) {
    const loc = business?.location || '';
    locationEl.textContent = loc ? `📍 ${loc}` : '';
    locationEl.classList.toggle('hidden', !loc);
  }
  if (websiteEl) {
    const site = (business?.website || '').trim();
    if (site) {
      const href = site.startsWith('http') ? site : `https://${site}`;
      websiteEl.href = href;
      websiteEl.textContent = site.replace(/^https?:\/\//, '');
      websiteEl.classList.remove('hidden');
    } else {
      websiteEl.classList.add('hidden');
    }
  }

  const orderPhone = business?.orderPhone || config.orderPhone || '';
  const digits = phoneDigits(orderPhone);
  if (contactWa && digits) {
    contactWa.href = `https://wa.me/${digits}`;
    contactWa.classList.remove('hidden');
    if (contactText) {
      contactText.textContent =
        'Porosit nga shporta — mesazhi shkon te numri i biznesit në WhatsApp (nga telefoni juaj).';
    }
  } else if (contactWa) {
    contactWa.classList.add('hidden');
    if (contactText) {
      contactText.textContent = 'Vendosni numrin e porosive te Settings në admin.';
    }
  }
}

let SHOP_VIEWS = {
  home: ['hero', 'offers', 'shop-products', 'about', 'contact'],
  offers: ['offers'],
  products: ['shop-products'],
  about: ['about'],
  gallery: ['gallery'],
  contact: ['contact'],
};

let SHOP_SECTION_IDS = ['hero', 'offers', 'shop-products', 'about', 'gallery', 'contact'];

function parseShopViewFromHash() {
  const hash = window.location.hash.replace(/^#/, '').toLowerCase();
  if (hash && Object.prototype.hasOwnProperty.call(SHOP_VIEWS, hash)) return hash;
  return 'home';
}

function setShopView(view) {
  const key = SHOP_VIEWS[view] ? view : 'home';
  const visible = SHOP_VIEWS[key];

  document.body.dataset.shopView = key;

  SHOP_SECTION_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.classList.contains('site-section-disabled')) return;
    el.classList.toggle('view-hidden', !visible.includes(id));
  });

  siteNav?.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('data-view') === key);
  });

  const hash = key === 'home' ? '' : `#${key}`;
  if (window.location.hash !== hash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (key === 'products' && products.length) renderCatalog();
}

function closeMobileNav() {
  document.body.classList.remove('nav-open');
  navToggle?.setAttribute('aria-expanded', 'false');
}

function openMobileNav() {
  document.body.classList.add('nav-open');
  navToggle?.setAttribute('aria-expanded', 'true');
}

function initSiteNav() {
  footerYear.textContent = String(new Date().getFullYear());

  navToggle?.addEventListener('click', () => {
    if (document.body.classList.contains('nav-open')) closeMobileNav();
    else openMobileNav();
  });

  siteNav?.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    const view = link.getAttribute('data-view') || 'home';
    setShopView(view);
    closeMobileNav();
  });

  brandLink?.addEventListener('click', (e) => {
    e.preventDefault();
    closeMobileNav();
    if (isMarketplaceMode()) {
      window.location.href = marketplaceHomePath();
      return;
    }
    setShopView('home');
  });

  heroCta?.addEventListener('click', () => setShopView('products'));

  window.addEventListener('hashchange', () => setShopView(parseShopViewFromHash()));

  setShopView(parseShopViewFromHash());

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 901px)').matches) closeMobileNav();
  });
}

function updateCartBadge(count) {
  cartCountEl.textContent = String(count);
  cartCountEl.dataset.zero = count === 0 ? 'true' : 'false';
}

function formatOfferPeriod(startsAt, endsAt) {
  if (!startsAt || !endsAt) return '';
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  const start = new Date(startsAt).toLocaleDateString('sq-AL', opts);
  const end = new Date(endsAt).toLocaleDateString('sq-AL', opts);
  return `${start} – ${end}`;
}

function productForCart(productId, salePrice) {
  const base = products.find((p) => p.id === productId);
  if (!base) return null;
  return {
    ...base,
    price: salePrice != null ? Number(salePrice) : base.price,
  };
}

function addOfferProductToCart(productId, salePrice) {
  const product = productForCart(productId, salePrice);
  if (!product) return;
  renderCart(addToCart(product, 1, null, getSlug()));
  openCart();
}

function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function getPending() {
  return loadPendingOrder();
}

function hasActivePending() {
  const p = getPending();
  return p && isPendingStatus(p.status);
}

function buildOrderMessage(cart, notes, customer) {
  const groups = groupCartByBusiness(cart);
  const parts = [`Porosi nga shop online`, '─────────────────'];

  if (groups.size > 1) {
    for (const [slug, items] of groups) {
      parts.push(`\n[${slug}]`);
      for (const i of items) {
        parts.push(`${i.quantity}× ${i.name} — ${formatEuro(i.price * i.quantity)}`);
      }
      const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
      parts.push(`Nëntotali: ${formatEuro(sub)}`);
    }
    parts.push('─────────────────');
    parts.push(`Total: ${formatEuro(cartTotal(cart))}`);
  } else {
    const rows = cart.map(
      (i) => `${i.quantity}× ${i.name} — ${formatEuro(i.price * i.quantity)}`,
    );
    parts.push(`Porosi — ${businessName}`, ...rows);
    parts.push('─────────────────', `Total: ${formatEuro(cartTotal(cart))}`);
  }

  if (customer?.name && customer?.phone) {
    parts.push(`Klienti: ${customer.name}, ${customer.phone}`);
  }
  const trimmedNotes = String(notes || '').trim();
  if (trimmedNotes) parts.push(`Shënime: ${trimmedNotes}`);
  return parts.join('\n');
}

function whatsAppUrl(text) {
  const digits = phoneDigits(config.orderPhone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function smsUrl(text) {
  const digits = phoneDigits(config.orderPhone);
  if (!digits) return null;
  return `sms:+${digits}?body=${encodeURIComponent(text)}`;
}

function setSendButtonsEnabled(enabled) {
  btnWhatsApp.disabled = !enabled;
  btnSms.disabled = !enabled;
}

function setSendButtonsLoading(loading) {
  const cart = hasActivePending() ? getPending().cart : loadCart();
  const count = cartCount(cart);
  btnWhatsApp.disabled = loading || count === 0 || hasActivePending();
  btnSms.disabled = loading || count === 0 || hasActivePending();
  btnWhatsApp.textContent = loading ? 'Duke dërguar…' : 'WhatsApp';
  btnSms.textContent = loading ? 'Duke dërguar…' : 'SMS';
}

function openCart() {
  cartPanel.classList.remove('hidden');
  cartPanel.setAttribute('aria-hidden', 'false');
  updateOrderPreview();
  renderPendingBanner();
}

function closeCart() {
  cartPanel.classList.add('hidden');
  cartPanel.setAttribute('aria-hidden', 'true');
}

function statusLabelSq(status) {
  if (status === 'confirmed') return 'E konfirmuar';
  if (status === 'cancelled') return 'E anuluar';
  return 'Në pritje';
}

function renderPendingBanner() {
  const pending = getPending();
  if (!pending) {
    pendingOrderEl.classList.add('hidden');
    pendingOrderEl.innerHTML = '';
    if (checkoutForm) checkoutForm.classList.remove('hidden');
    return;
  }

  pendingOrderEl.classList.remove('hidden');
  const canCancel = isPendingStatus(pending.status);
  const statusText = statusLabelSq(pending.status);

  pendingOrderEl.innerHTML = `
    <div class="pending-order__inner">
      <p class="pending-order__title">Porosia ${escapeHtml(pending.orderNumber)}</p>
      <p class="pending-order__status">${escapeHtml(statusText)}</p>
      <p class="muted pending-order__hint">${
        canCancel
          ? 'Porosia mbetet në shportë derisa admini ta konfirmojë. Mund ta anuloni vetë.'
          : pending.status === 'confirmed'
            ? 'Faleminderit! Porosia u konfirmua.'
            : 'Porosia u anulua.'
      }</p>
      ${
        canCancel
          ? '<button type="button" id="btn-cancel-pending" class="pending-cancel-btn">Anulo porosinë</button>'
          : '<button type="button" id="btn-dismiss-pending" class="pending-dismiss-btn">Mbyll</button>'
      }
    </div>
  `;

  if (canCancel) {
    $('#btn-cancel-pending')?.addEventListener('click', cancelPendingOrder);
  } else {
    $('#btn-dismiss-pending')?.addEventListener('click', dismissPendingOrder);
  }

  if (checkoutForm) {
    checkoutForm.classList.toggle('hidden', canCancel);
  }

  renderOffers();
  renderCatalog();
}

function dismissPendingOrder() {
  stopPolling();
  clearPendingOrder();
  clearCart();
  orderNotes.value = '';
  if (customerNameInput) customerNameInput.value = '';
  if (customerPhoneInput) customerPhoneInput.value = '';
  renderCart([]);
  renderPendingBanner();
}

async function cancelPendingOrder() {
  const pending = getPending();
  if (!pending || !isPendingStatus(pending.status)) return;

  const btn = $('#btn-cancel-pending');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Duke anuluar…';
  }

  try {
    const slug = pending.businessSlug || getSlug();
    const res = await fetch(cancelOrderUrl(pending.orderId, slug), {
      method: 'POST',
      headers: orderHeaders(),
      body: JSON.stringify({ phone: pending.phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error?.message || `Anulimi dështoi (${res.status})`);
    }
    pending.status = 'cancelled';
    savePendingOrder(pending);
    renderPendingBanner();
    await pollOrderStatus();
  } catch (err) {
    checkoutError.textContent = err.message;
    checkoutError.classList.remove('hidden');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Anulo porosinë';
    }
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPolling() {
  stopPolling();
  pollOrderStatus();
  pollTimer = setInterval(pollOrderStatus, 8000);
}

async function pollOrderStatus() {
  const pending = getPending();
  if (!pending) {
    stopPolling();
    return;
  }

  if (isTerminalStatus(pending.status)) {
    renderPendingBanner();
    return;
  }

  try {
    const slug = pending.businessSlug || getSlug();
    const url = `${orderUrl(pending.orderId, slug)}?phone=${encodeURIComponent(pending.phone)}`;
    const res = await fetch(url, { headers: orderHeaders() });

    if (res.status === 404) {
      dismissPendingOrder();
      return;
    }

    if (!res.ok) return;

    const data = await res.json();
    pending.status = data.status;
    savePendingOrder(pending);
    renderPendingBanner();

    if (data.status === 'confirmed') {
      stopPolling();
      setTimeout(dismissPendingOrder, 4000);
    } else if (data.status === 'cancelled') {
      stopPolling();
    }
  } catch {
    /* ignore transient network errors */
  }
}

function updateOrderPreview() {
  if (hasActivePending()) {
    orderPreview.classList.add('hidden');
    return;
  }
  const cart = loadCart();
  if (!cart.length) {
    orderPreview.classList.add('hidden');
    orderPreview.textContent = '';
    return;
  }
  orderPreview.textContent = buildOrderMessage(cart, orderNotes.value, readCustomer());
  orderPreview.classList.remove('hidden');
}

function priceHtml(price, originalPrice, onOffer) {
  if (onOffer && originalPrice != null && originalPrice > price) {
    return `<p class="product-price"><span class="price-was">${formatEuro(originalPrice)}</span> ${formatEuro(price ?? 0)}</p>`;
  }
  return `<p class="product-price">${formatEuro(price ?? 0)}</p>`;
}

function offerItemPriceHtml(item) {
  const orig = Number(item.originalPrice) || 0;
  const sale = Number(item.salePrice) ?? orig;
  let pct =
    item.discountPercent != null ? Math.round(Number(item.discountPercent)) : 0;
  if (pct <= 0 && orig > sale) {
    pct = Math.round((1 - sale / orig) * 100);
  }
  if (orig <= sale || pct <= 0) {
    return `<span class="offer-item__price">${formatEuro(orig)}</span>`;
  }
  return `<span class="offer-item__price"><span class="price-was">${formatEuro(orig)}</span> <span class="price-now">${formatEuro(sale)}</span> <span class="offer-pct">−${pct}%</span></span>`;
}

function renderOffers() {
  if (!offers.length) {
    offersListEl.innerHTML = '';
    offersEmptyEl.classList.remove('hidden');
    return;
  }

  offersEmptyEl.classList.add('hidden');
  offersListEl.innerHTML = offers
    .map((offer) => {
      const period = formatOfferPeriod(offer.startsAt, offer.endsAt);
      const items = offer.items || [];
      return `
    <article class="offer-card">
      <header class="offer-card__head">
        <div>
          <h3 class="offer-card__title">${escapeHtml(offer.title)}</h3>
          ${offer.description ? `<p class="offer-card__desc">${escapeHtml(offer.description)}</p>` : ''}
        </div>
        ${period ? `<span class="offer-badge">${escapeHtml(period)}</span>` : ''}
      </header>
      <div class="offer-items">
        ${
          items.length === 0
            ? '<p class="muted">Nuk ka produkte në këtë ofertë.</p>'
            : items
                .map((item) => {
                  return `
          <div class="offer-item">
            <div class="offer-item__info">
              <strong>${escapeHtml(item.productName)}</strong>
              ${offerItemPriceHtml(item)}
            </div>
            <button type="button" class="add-btn add-btn--sm" data-offer-add="${item.productId}" data-offer-price="${item.salePrice}" ${hasActivePending() ? 'disabled' : ''}>+ Shto</button>
          </div>`;
                })
                .join('')
        }
      </div>
    </article>`;
    })
    .join('');

  offersListEl.querySelectorAll('[data-offer-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (hasActivePending()) return;
      const productId = btn.getAttribute('data-offer-add');
      const salePrice = Number(btn.getAttribute('data-offer-price'));
      addOfferProductToCart(productId, salePrice);
    });
  });
}

function variantSelectHtml(p) {
  const variants = p.variants || [];
  if (!variants.length) return '';
  const options = variants
    .map((v) => {
      const label =
        Object.values(v.attributes || {})
          .filter(Boolean)
          .join(' / ') || v.sku || 'Variant';
      return `<option value="${escapeHtml(v.id)}">${escapeHtml(label)} — ${formatEuro(v.price)}</option>`;
    })
    .join('');
  return `<select class="variant-select" data-variant-for="${p.id}" aria-label="Variant">${options}</select>`;
}

function selectedVariant(product) {
  const variants = product.variants || [];
  if (!variants.length) return null;
  const sel = catalogEl.querySelector(`select[data-variant-for="${product.id}"]`);
  const id = sel?.value || variants[0]?.id;
  return variants.find((v) => v.id === id) || variants[0];
}

function productThumbHtml(p) {
  const urls = p.imageUrls || [];
  if (!urls.length) return '';
  const count = urls.length;
  return `
    <button type="button" class="product-thumb-btn" data-gallery="${p.id}" aria-label="Shiko fotot (${count})">
      <img src="${escapeHtml(urls[0])}" alt="" loading="lazy" />
      ${count > 1 ? `<span class="product-thumb-badge">${count}</span>` : ''}
    </button>`;
}

function filteredProducts() {
  if (!selectedCategoryId) return products;
  return products.filter((p) => (p.categoryIds || []).includes(selectedCategoryId));
}

function renderCategoryFilters() {
  const head = document.querySelector('.catalog-head');
  if (!head || !categories.length) return;
  let bar = document.getElementById('category-filters');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'category-filters';
    bar.className = 'category-filters';
    head.appendChild(bar);
  }
  const chips = [
    { id: '', name: 'Të gjitha' },
    ...categories.map((c) => ({ id: c.id, name: c.name })),
  ];
  bar.innerHTML = chips
    .map(
      (c) => `
    <button type="button" class="category-chip${selectedCategoryId === c.id ? ' is-active' : ''}"
      data-category="${escapeHtml(c.id)}">${escapeHtml(c.name)}</button>`,
    )
    .join('');
  bar.querySelectorAll('[data-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCategoryId = btn.getAttribute('data-category') || '';
      renderCatalog();
    });
  });
}

function renderCatalog() {
  renderCategoryFilters();
  const list = filteredProducts();
  if (!list.length) {
    catalogEl.innerHTML = '<p class="muted">Nuk ka produkte aktive.</p>';
    return;
  }

  catalogEl.innerHTML = list
    .map(
      (p) => `
    <article class="product-card${p.onOffer ? ' product-card--offer' : ''}" data-id="${p.id}">
      ${productThumbHtml(p)}
      <div class="product-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="product-desc">${escapeHtml(p.description || '')}</p>
        ${variantSelectHtml(p)}
        ${priceHtml(p.price, p.originalPrice, p.onOffer)}
      </div>
      <button type="button" class="add-btn" data-add="${p.id}" ${hasActivePending() ? 'disabled' : ''}>+ Shto</button>
    </article>
  `,
    )
    .join('');

  catalogEl.querySelectorAll('[data-gallery]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-gallery');
      const product = products.find((x) => x.id === id);
      if (product) openGallery({ name: product.name, imageUrls: product.imageUrls });
    });
  });

  catalogEl.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (hasActivePending()) return;
      const id = btn.getAttribute('data-add');
      const product = products.find((x) => x.id === id);
      if (!product) return;
      const variant = selectedVariant(product);
      renderCart(addToCart(product, 1, variant, getSlug()));
      openCart();
    });
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCart(cart = null) {
  const pending = getPending();
  const displayCart =
    cart ?? (hasActivePending() && pending?.cart?.length ? pending.cart : loadCart());
  const count = cartCount(displayCart);
  const locked = hasActivePending();

  updateCartBadge(count);
  setSendButtonsEnabled(count > 0 && canPlaceOrders() && !locked);

  renderPendingBanner();

  if (count === 0 && !locked) {
    cartLines.innerHTML = '';
    cartEmpty.classList.remove('hidden');
    cartTotalEl.textContent = '';
    orderPreview.classList.add('hidden');
    return;
  }

  cartEmpty.classList.add('hidden');
  cartTotalEl.textContent = `Total: ${formatEuro(cartTotal(displayCart))}`;
  updateOrderPreview();

  const multiBiz = cartBusinessSlugs(displayCart).length > 1;

  cartLines.innerHTML = displayCart
    .map(
      (item) => `
    <li class="cart-line${locked ? ' cart-line--locked' : ''}">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        ${multiBiz && item.businessSlug ? `<span class="muted cart-line-slug">/${escapeHtml(item.businessSlug)}</span>` : ''}
        <span class="muted">${formatEuro(item.price)}</span>
      </div>
      <div class="qty-controls">
        <button type="button" data-dec="${item.productId}" data-variant-id="${item.variantId || ''}" data-slug="${escapeHtml(item.businessSlug || '')}" ${locked ? 'disabled' : ''}>−</button>
        <span>${item.quantity}</span>
        <button type="button" data-inc="${item.productId}" data-variant-id="${item.variantId || ''}" data-slug="${escapeHtml(item.businessSlug || '')}" ${locked ? 'disabled' : ''}>+</button>
      </div>
    </li>
  `,
    )
    .join('');

  if (!locked) {
    cartLines.querySelectorAll('[data-inc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-inc');
        const variantId = btn.getAttribute('data-variant-id') || null;
        const slug = btn.getAttribute('data-slug') || null;
        const item = displayCart.find(
          (i) =>
            i.productId === id &&
            (i.variantId || '') === (variantId || '') &&
            (i.businessSlug || '') === (slug || ''),
        );
        if (item) {
          renderCart(
            updateQty(id, item.quantity + 1, item.variantId || null, item.businessSlug),
          );
        }
      });
    });

    cartLines.querySelectorAll('[data-dec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-dec');
        const variantId = btn.getAttribute('data-variant-id') || null;
        const slug = btn.getAttribute('data-slug') || null;
        const item = displayCart.find(
          (i) =>
            i.productId === id &&
            (i.variantId || '') === (variantId || '') &&
            (i.businessSlug || '') === (slug || ''),
        );
        if (item) {
          renderCart(
            updateQty(id, item.quantity - 1, item.variantId || null, item.businessSlug),
          );
        }
      });
    });
  }
}

async function loadOffers() {
  if (!hasStoreSlug()) return;

  try {
    const data = await fetchOffers(getSlug());
    offers = data.offers || [];
    renderOffers();
  } catch {
    offers = [];
    renderOffers();
  }
}

async function renderMarketplaceHome() {
  document.body.dataset.mode = 'marketplace';
  offersSection.classList.add('hidden');
  document.querySelector('.catalog-head')?.classList.add('hidden');
  document.getElementById('hero')?.classList.add('hidden');
  document.querySelector('.site-nav')?.classList.add('hidden');
  displayShopName('Binisoft Marketplace');
  if (footerName) footerName.textContent = 'Binisoft Marketplace';
  if (brandLink) brandLink.href = marketplaceHomePath();

  await loadMarketplace({
    catalogEl,
    setCatalogMeta,
    applyDocumentSeo: (seo) => applyDocumentSeo({ ...seo, locale: getShopLocale() }),
  });

  renderLangSwitcher();
}

function showOrderKeyHint() {
  /* Public customer shop — no API key required. */
}

function renderLangSwitcher() {
  if (!langSwitcherEl) return;
  const { locales } = getCatalogMeta();
  const active = getShopLocale();
  const available = locales.filter((code) => LOCALE_LABELS[code]);
  if (available.length <= 1) {
    langSwitcherEl.hidden = true;
    langSwitcherEl.replaceChildren();
    return;
  }
  langSwitcherEl.hidden = false;
  langSwitcherEl.replaceChildren();
  available.forEach((code) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `lang-switcher__btn${code === active ? ' is-active' : ''}`;
    btn.textContent = LOCALE_LABELS[code] || code.toUpperCase();
    btn.setAttribute('aria-pressed', code === active ? 'true' : 'false');
    btn.setAttribute('lang', code);
    if (code !== active) {
      btn.addEventListener('click', () => setShopLocale(code));
    }
    langSwitcherEl.appendChild(btn);
  });
}

function applyShopSeo(business) {
  const { title, description } = businessSeoFromProfile(business, businessName);
  applyDocumentSeo({ title, description, locale: getShopLocale() });
}

async function loadShop() {
  if (!hasStoreSlug()) {
    await renderMarketplaceHome();
    return;
  }

  document.body.dataset.mode = 'store';
  if (brandLink) brandLink.href = shopPathFor(getSlug());
  offersSection.classList.remove('hidden');
  document.querySelector('.catalog-head')?.classList.remove('hidden');
  document.getElementById('hero')?.classList.remove('hidden');
  document.querySelector('.site-nav')?.classList.remove('hidden');
  closeMobileNav();
  catalogEl.innerHTML = '<p class="loading muted">Duke ngarkuar produktet…</p>';

  const data = await fetchCatalog(getSlug());
  if (data.meta) setCatalogMeta(data.meta);
  businessName = data.business?.name || 'Biznesi';
  updateShopPresentation(data.business);
  renderLangSwitcher();
  applyShopSeo(data.business);
  const routing = applySiteConfig(data.business);
  if (routing?.shopViews) SHOP_VIEWS = routing.shopViews;
  if (routing?.sectionIds?.length) SHOP_SECTION_IDS = routing.sectionIds;
  setShopView(parseShopViewFromHash());
  categories = data.categories || [];
  selectedCategoryId = '';
  products = data.products || [];
  const countEl = document.getElementById('catalog-count');
  if (countEl && data.productCount != null) {
    countEl.textContent = `${data.productCount} produkte`;
    countEl.classList.remove('hidden');
  }
  await loadOffers();
  renderCatalog();
  showOrderKeyHint();
}

function readCustomer() {
  return {
    name: customerNameInput?.value.trim() || '',
    phone: customerPhoneInput?.value.trim() || '',
  };
}

function validateCustomer(customer) {
  if (!customer.name || customer.name.length < 2) {
    return 'Shkruani emrin (min. 2 shkronja).';
  }
  if (phoneDigits(customer.phone).length < 8) {
    return 'Shkruani numrin e telefonit (min. 8 shifra).';
  }
  return null;
}

function cartToGroups(cart) {
  const groups = groupCartByBusiness(cart);
  return [...groups.entries()].map(([slug, items]) => ({
    slug,
    lines: items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      ...(i.variantId ? { variantId: i.variantId } : {}),
    })),
  }));
}

async function sendOrder(channel) {
  checkoutError.classList.add('hidden');
  if (hasActivePending()) {
    checkoutError.textContent = 'Keni një porosi në pritje. Anuloni ose prisni konfirmimin.';
    checkoutError.classList.remove('hidden');
    openCart();
    return;
  }

  const cart = loadCart();
  if (!cart.length || !canPlaceOrders()) return;

  const customer = readCustomer();
  const customerError = validateCustomer(customer);
  if (customerError) {
    checkoutError.textContent = customerError;
    checkoutError.classList.remove('hidden');
    return;
  }

  const notes = orderNotes.value.trim();
  const localMessage = buildOrderMessage(cart, notes, customer);
  const groups = cartToGroups(cart);
  const slugs = groups.map((g) => g.slug);
  const useBatch = true;

  setSendButtonsLoading(true);

  try {
    if (useBatch) {
      const res = await fetch(checkoutUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: customer.name,
            phone: customer.phone,
            notes: notes || undefined,
          },
          channel,
          groups,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || `Porosia dështoi (${res.status})`);
      }

      const orders = data.orders || [];
      if (!orders.length) throw new Error('Asnjë porosi nuk u krijua.');

      const cartSnapshot = [...cart];

      for (let i = 0; i < orders.length; i++) {
        const o = orders[i];
        const url =
          channel === 'sms' ? o.notify?.smsUrl : o.notify?.whatsAppUrl;
        if (!url) {
          throw new Error(
            `Numri i porosive mungon për ${o.businessName || o.slug}. Vendoseni te Settings.`,
          );
        }
        setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), i * 400);
      }

      if (orders.length === 1) {
        const o = orders[0];
        savePendingOrder({
          orderId: o.orderId,
          orderNumber: o.orderNumber,
          phone: customer.phone,
          name: customer.name,
          status: o.status || 'pending',
          cart: cartSnapshot,
          notes,
          createdAt: new Date().toISOString(),
          businessSlug: o.slug || slugs[0],
        });
        saveCart(cartSnapshot);
        renderCart(cartSnapshot);
        openCart();
        startPolling();
      } else {
        clearCart();
        renderCart([]);
        orderNotes.value = '';
        closeCart();
      }

      if (orders.length > 1) {
        checkoutError.textContent = `Hapen ${orders.length} mesazhe — një për çdo biznes.`;
        checkoutError.classList.remove('hidden');
        checkoutError.style.color = 'var(--yellow, #f5c518)';
      }
      return;
    }
  } catch (err) {
    checkoutError.textContent = err.message;
    checkoutError.classList.remove('hidden');
  } finally {
    setSendButtonsLoading(false);
    setSendButtonsEnabled(cartCount(loadCart()) > 0 && canPlaceOrders() && !hasActivePending());
  }
}

function restorePendingOnLoad() {
  const pending = getPending();
  if (!pending) {
    renderCart();
    return;
  }

  if (pending.cart?.length) {
    saveCart(pending.cart);
    if (pending.notes) orderNotes.value = pending.notes;
    if (customerNameInput && pending.name) customerNameInput.value = pending.name;
    if (customerPhoneInput && pending.phone) {
      customerPhoneInput.value = pending.phone;
    }
  }

  renderCart(pending.cart || loadCart());

  if (isPendingStatus(pending.status)) {
    startPolling();
    openCart();
  } else if (pending.status === 'cancelled') {
    renderPendingBanner();
    openCart();
  }
}

initGallery();
initSiteNav();

$('#cart-toggle').addEventListener('click', openCart);
$('#cart-close').addEventListener('click', closeCart);
orderNotes.addEventListener('input', updateOrderPreview);
customerNameInput?.addEventListener('input', updateOrderPreview);
customerPhoneInput?.addEventListener('input', updateOrderPreview);
btnWhatsApp.addEventListener('click', () => sendOrder('whatsapp'));
btnSms.addEventListener('click', () => sendOrder('sms'));

restorePendingOnLoad();
loadShop().catch((err) => {
  catalogEl.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
});
