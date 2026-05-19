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
import { fetchBusinesses, fetchCatalog, fetchOffers, fetchServices } from './catalogApi.js';
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
import {
  getRawPathSegment,
  isStorePath,
  isValidSlug,
  marketplaceHomePath,
  shopPathFor,
} from './slug.js';
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
import { businessTypeLabel } from './businessTypeLabels.js';
import {
  applySiteConfig,
  formatBusinessLocation,
  setStoreCtaNavigate,
  wireStoreCtas,
} from './siteConfig.js';
import { resolveGoogleMapsOpenUrl } from './googleMapsUrl.js';
import { applyProStoreTheme, clearProStoreTheme } from './storeProTheme.js';
import {
  getStoredScheme,
  SCHEME_DARK,
  toggleStoredScheme,
} from './storeThemeMode.js';
import {
  catalogSkeletonHtml,
  emptyStateHtml,
  initStoreScrollSpy,
  isStoreMode,
  scrollToStoreView,
  STORE_VIEW_SECTIONS,
} from './storeUx.js';
import {
  checkoutConfigForCart,
  isCartEnabledForSlug,
  normalizeShopCheckout,
  registerShopCheckout,
} from './shopCheckout.js';

const $ = (sel) => document.querySelector(sel);

const offersSection = $('#offers');
const offersListEl = $('#offers-list');
const offersEmptyEl = $('#offers-empty');
const servicesSection = $('#shop-services');
const servicesListEl = $('#services-list');
const servicesEmptyEl = $('#services-empty');
const catalogEl = $('#catalog');
const catalogActionsEl = $('#catalog-actions');
const CATALOG_PREVIEW_LIMIT = 8;
const cartPanel = $('#cart-panel');
const cartLines = $('#cart-lines');
const cartEmpty = $('#cart-empty');
const cartTotalEl = $('#cart-total');
const cartItemCountEl = $('#cart-item-count');
const cartCountEl = $('#cart-count');
const orderPreview = $('#order-preview');
const orderNotes = $('#order-notes');
const customerNameInput = $('#customer-name');
const customerAddressInput = $('#customer-address');
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
const heroTagline = $('#hero-tagline');
const heroCta = $('#hero-cta');
const heroCtaServices = $('#hero-cta-services');
const heroTrust = $('#hero-trust');
const heroStats = $('#hero-stats');
const contactCards = $('#contact-cards');
const aboutText = $('#about-text');
const contactText = $('#contact-text');
const contactWa = $('#contact-wa');
const footerName = $('#footer-name');
const footerYear = $('#footer-year');
const navToggle = $('#nav-toggle');
const siteNav = $('#site-nav');
const brandLink = $('#brand-link');
const langSwitcherEl = $('#lang-switcher');
const themeToggleEl = $('#theme-toggle');
const langModal = $('#lang-modal');
const langModalBackdrop = $('#lang-modal-backdrop');
const langModalClose = $('#lang-modal-close');
const langModalOptions = $('#lang-modal-options');
const storeBottomNav = $('#store-bottom-nav');
const bottomCartBtn = $('#bottom-cart');
const bottomCartCount = $('#bottom-cart-count');
const cartBackdrop = $('#cart-backdrop');
const cartToggleBtn = $('#cart-toggle');
const checkoutFieldName = $('#checkout-field-name');
const checkoutFieldAddress = $('#checkout-field-address');
const checkoutFieldNotes = $('#checkout-field-notes');
const checkoutFieldPhone = $('#checkout-field-phone');

let storeBusinessProfile = null;
let storeCheckoutConfig = null;
let storeSectionMap = null;

let products = [];
let categories = [];
let selectedCategoryId = '';
let catalogExpanded = false;
let shopLogoUrl = '';
let offers = [];
let services = [];
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

function formatCartItemCount(n) {
  const c = Number(n) || 0;
  if (c === 1) return '1 artikull';
  return `${c} artikuj`;
}

function displayShopName(name) {
  const text = String(name || 'Shop').trim();
  shopName.textContent = text;
  if (footerName) footerName.textContent = text;
  if (brandLink) brandLink.setAttribute('aria-label', `${text} — Kreu`);
}

function renderHeroStats(business) {
  if (!heroStats) return;
  const count = business?.productCount;
  const loc = formatBusinessLocation(business);
  const items = [];
  if (count != null && count > 0) {
    items.push({ value: String(count), label: count === 1 ? 'Produkt' : 'Produkte' });
  }
  if (business?.orderPhone) items.push({ value: 'WA', label: 'Porosi WhatsApp' });

  if (!items.length || !document.body.classList.contains('store-pro')) {
    heroStats.classList.add('hidden');
    heroStats.replaceChildren();
    return;
  }

  heroStats.innerHTML = items
    .map(
      (s) =>
        `<div class="hero-stat"><span class="hero-stat__value">${escapeHtml(s.value)}</span><span class="hero-stat__label">${escapeHtml(s.label)}</span></div>`,
    )
    .join('');
  heroStats.classList.remove('hidden');
}

function contactWaLabelFromBusiness(business) {
  const sections = business?.siteConfig?.sections;
  if (Array.isArray(sections)) {
    const contact = sections.find((s) => s.id === 'contact');
    if (contact?.ctaLabel) return contact.ctaLabel;
  }
  return 'WhatsApp';
}

const CONTACT_BTN_ICONS = {
  phone:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  email:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>',
  whatsapp:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
};

function renderContactCards(business) {
  if (!contactCards) return;
  contactCards.replaceChildren();
  contactWa?.classList.add('hidden');

  const phone = (business?.orderPhone || '').trim();
  const email = (business?.contactEmail || '').trim();
  const bizName = String(business?.name || '').trim();
  const items = [];

  if (phone) {
    const digits = phoneDigits(phone);
    items.push({
      label: 'Telefoni',
      action: 'Thirr tani',
      detail: phone,
      href: digits ? `tel:+${digits}` : null,
      kind: 'phone',
      title: 'Thirr tani',
    });
  }

  if (email) {
    const subject = bizName ? encodeURIComponent(`Kontakt — ${bizName}`) : '';
    const mailHref = subject ? `mailto:${email}?subject=${subject}` : `mailto:${email}`;
    items.push({
      label: 'Email',
      action: 'Dërgo email',
      detail: email,
      href: mailHref,
      kind: 'email',
      title: 'Dërgo email',
    });
  }

  if (phone) {
    const digits = phoneDigits(phone);
    if (digits) {
      items.push({
        label: 'WhatsApp',
        action: contactWaLabelFromBusiness(business) || 'Na kontaktoni',
        detail: phone,
        href: `https://wa.me/${digits}`,
        kind: 'whatsapp',
        title: 'Hap WhatsApp',
      });
    }
  }
  if (!items.length) {
    contactCards.classList.add('hidden');
    return;
  }
  for (const item of items) {
    const card = document.createElement('a');
    card.className = `contact-btn contact-btn--${item.kind}`;
    if (item.href) card.href = item.href;
    const hint = item.detail ? `${item.title} — ${item.detail}` : item.title;
    if (hint) card.title = hint;
    if (item.kind === 'whatsapp') {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }
    const icon = CONTACT_BTN_ICONS[item.kind] || '';
    card.innerHTML = `<span class="contact-btn__icon">${icon}</span><span class="contact-btn__body"><span class="contact-btn__label">${escapeHtml(item.label)}</span><span class="contact-btn__action">${escapeHtml(item.action)}</span></span>`;
    contactCards.appendChild(card);
  }
  contactCards.classList.remove('hidden');
}

function refreshStoreCtas() {
  if (!storeBusinessProfile || !storeSectionMap) return;
  wireStoreCtas(storeBusinessProfile, storeSectionMap, {
    hasServices: services.length > 0,
  });
}

function businessMonogram(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  const word = parts[0] || 'B';
  return word.slice(0, 2).toUpperCase();
}

function setHeroVisual(logoUrl, name) {
  const card =
    document.getElementById('hero-visual-card') || document.querySelector('.hero-visual-card');
  if (!card) return;
  card.replaceChildren();
  if (logoUrl) {
    const img = document.createElement('img');
    img.className = 'hero-visual-logo';
    img.src = logoUrl;
    img.alt = '';
    card.appendChild(img);
  } else {
    const monogram = document.createElement('div');
    monogram.className = 'hero-visual-monogram';
    monogram.textContent = businessMonogram(name);
    monogram.setAttribute('aria-hidden', 'true');
    card.appendChild(monogram);
  }
}

function updateShopPresentation(business) {
  businessProfile = business || {};
  const name = business?.name || 'Dyqani';
  const tagline = String(business?.description || '').trim();
  displayShopName(name);
  if (brandLink) brandLink.setAttribute('aria-label', `${name} — Kreu`);
  if (heroTitle) heroTitle.textContent = name;
  const typeLabel = businessTypeLabel(business?.businessType);
  if (heroEyebrow) {
    if (typeLabel) {
      heroEyebrow.textContent = typeLabel;
      heroEyebrow.classList.remove('hidden');
    } else {
      heroEyebrow.textContent = '';
      heroEyebrow.classList.add('hidden');
    }
  }
  if (heroTagline) {
    if (tagline) {
      heroTagline.textContent = tagline.split('\n')[0].slice(0, 160);
      heroTagline.classList.remove('hidden');
    } else {
      heroTagline.textContent = '';
      heroTagline.classList.add('hidden');
    }
  }
  if (shopSlug) {
    shopSlug.classList.add('hidden');
    const pathSlug = itemUrlSlug(business) || business?.slug || '';
    shopSlug.textContent = pathSlug ? `/${pathSlug}` : '';
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

  shopLogoUrl = business?.logoUrl || '';
  setHeroVisual(shopLogoUrl, name);

  renderContactCards(business);
  renderHeroStats(business);
}

let SHOP_VIEWS = {
  home: ['hero', 'offers', 'shop-services', 'shop-products', 'about', 'contact'],
  offers: ['offers'],
  products: ['shop-products'],
  services: ['shop-services'],
  about: ['about'],
  gallery: ['gallery'],
  contact: ['contact'],
};

let SHOP_SECTION_IDS = [
  'hero',
  'offers',
  'shop-services',
  'shop-products',
  'about',
  'gallery',
  'contact',
];

function parseShopViewFromHash() {
  const hash = window.location.hash.replace(/^#/, '').toLowerCase();
  if (hash && Object.prototype.hasOwnProperty.call(SHOP_VIEWS, hash)) return hash;
  return 'home';
}

function highlightShopNav(view, { updateHash = true } = {}) {
  const key = SHOP_VIEWS[view] ? view : 'home';
  document.body.dataset.shopView = key;
  siteNav?.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('data-view') === key);
  });
  storeBottomNav?.querySelectorAll('[data-bottom-nav]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-bottom-nav') === key);
  });
  if (updateHash) {
    const hash = key === 'home' ? '' : `#${key}`;
    if (window.location.hash !== hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    }
  }
  return key;
}

function shouldLimitCatalogPreview() {
  if (!isStoreMode()) return false;
  return !catalogExpanded;
}

function setShopView(view, options = {}) {
  const key = highlightShopNav(view, { updateHash: options.updateHash !== false });
  closeMobileNav();

  if (key === 'products' && !options.fromScroll) {
    catalogExpanded = true;
  } else if (options.fromScroll && key !== 'products' && catalogExpanded && isStoreMode()) {
    catalogExpanded = false;
  }

  if (isStoreMode()) {
    SHOP_SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('view-hidden');
    });
    if (!options.fromScroll) scrollToStoreView(key);
    return;
  }

  const visible = SHOP_VIEWS[key];
  SHOP_SECTION_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.classList.contains('site-section-disabled')) return;
    el.classList.toggle('view-hidden', !visible.includes(id));
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (products.length) renderCatalog();
  if (key === 'services' && services.length) renderServices();
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
  setStoreCtaNavigate((view) => setShopView(view));
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

  window.addEventListener('hashchange', () => setShopView(parseShopViewFromHash()));

  storeBottomNav?.addEventListener('click', (e) => {
    if (e.target.closest('#bottom-cart')) {
      openCart();
      return;
    }
    const btn = e.target.closest('[data-bottom-nav]');
    if (!btn) return;
    setShopView(btn.getAttribute('data-bottom-nav') || 'home');
  });

  initStoreScrollSpy((view, meta) => {
    if (!isStoreMode()) return;
    highlightShopNav(view, { updateHash: !meta?.fromScroll });
  });

  setShopView(parseShopViewFromHash());

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 901px)').matches) closeMobileNav();
  });
}

function updateCartBadge(count) {
  cartCountEl.textContent = String(count);
  cartCountEl.dataset.zero = count === 0 ? 'true' : 'false';
  const badge = document.getElementById('bottom-cart-count');
  if (badge) {
    badge.textContent = String(count);
    badge.classList.toggle('hidden', count === 0);
  }
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
}

function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function currentStoreSlug() {
  return getSlug() || storeBusinessProfile?.slug || '';
}

function isShopCartEnabled(slug = currentStoreSlug()) {
  if (!slug) return true;
  if (storeCheckoutConfig && slug === storeBusinessProfile?.slug) {
    return storeCheckoutConfig.cartEnabled;
  }
  return isCartEnabledForSlug(slug);
}

function canCheckoutNow() {
  return canPlaceOrders() && isShopCartEnabled();
}

function setCheckoutField(wrap, enabled, input, required) {
  if (!wrap) return;
  wrap.classList.toggle('hidden', !enabled);
  if (input) {
    input.required = !!required;
    if (!enabled) input.value = '';
  }
}

function applyCheckoutFieldVisibility(cart = loadCart()) {
  const cfg = cart.length
    ? checkoutConfigForCart(cart, currentStoreSlug())
    : storeCheckoutConfig || normalizeShopCheckout(storeBusinessProfile || {});

  setCheckoutField(checkoutFieldName, cfg.customerName, customerNameInput, cfg.customerName);
  setCheckoutField(
    checkoutFieldAddress,
    cfg.deliveryAddress,
    customerAddressInput,
    cfg.deliveryAddress,
  );
  setCheckoutField(checkoutFieldNotes, cfg.orderNotes, orderNotes, false);
  setCheckoutField(checkoutFieldPhone, cfg.phone, customerPhoneInput, false);

  const formVisible =
    cfg.customerName || cfg.deliveryAddress || cfg.orderNotes || cfg.phone;
  checkoutForm?.classList.toggle('hidden', !formVisible);
}

function applyCartChrome() {
  const storeSlug = currentStoreSlug();
  const enabled = isStoreMode() && storeSlug ? isShopCartEnabled(storeSlug) : true;
  cartToggleBtn?.classList.toggle('hidden', !enabled);
  bottomCartBtn?.classList.toggle('hidden', !enabled);
  document.body.classList.toggle('shop-cart-disabled', isStoreMode() && !enabled);
  if (!enabled) closeCart();
}

function refreshShopCheckoutUi(cart = loadCart()) {
  applyCartChrome();
  applyCheckoutFieldVisibility(cart);
}

function getPending() {
  return loadPendingOrder();
}

function hasActivePending() {
  const p = getPending();
  return p && isPendingStatus(p.status);
}

function formatOrderMessageBody({
  businessLabel,
  orderNumber,
  lineRows,
  totalLabel,
  customer,
  address,
  orderNotes,
}) {
  const addr = String(address || '').trim();
  const phone = String(customer?.phone || '').trim();
  const notes = String(orderNotes || '').trim();
  const parts = [
    'Përshëndetje!',
    '',
    `Porosi online — ${businessLabel}`,
    orderNumber ? `Referenca: ${orderNumber}` : 'Referenca: (pas dërgimit)',
    '',
    '▸ POROSIA',
    ...lineRows,
    '',
    `▸ TOTALI: ${totalLabel}`,
    '',
    '▸ KLIENTI',
    `Emri: ${customer?.name || '—'}`,
  ];
  if (addr) parts.push(`Adresa: ${addr}`);
  if (phone) parts.push(`Telefoni: ${phone}`);
  else parts.push('Telefoni: (kontakt përmes WhatsApp)');
  if (notes) {
    parts.push('', '▸ KËRKESA PËR POROSINË', notes);
  }
  parts.push('', 'Faleminderit!');
  return parts.join('\n');
}

function buildOrderMessage(cart, checkout, orderNumber = null) {
  const { customer, address, orderNotes } = checkout;
  const groups = groupCartByBusiness(cart);

  if (groups.size > 1) {
    const blocks = [];
    for (const [slug, items] of groups) {
      const lineRows = items.map(
        (i) => `• ${i.quantity}× ${i.name} — ${formatEuro(i.price * i.quantity)}`,
      );
      const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
      blocks.push(
        formatOrderMessageBody({
          businessLabel: slug,
          orderNumber,
          lineRows,
          totalLabel: formatEuro(sub),
          customer,
          address,
          orderNotes,
        }),
      );
    }
    blocks.push(
      '',
      `▸ TOTALI I PËRGJITHSHËM: ${formatEuro(cartTotal(cart))}`,
    );
    return blocks.join('\n\n');
  }

  const lineRows = cart.map(
    (i) => `• ${i.quantity}× ${i.name} — ${formatEuro(i.price * i.quantity)}`,
  );
  return formatOrderMessageBody({
    businessLabel: businessName,
    orderNumber,
    lineRows,
    totalLabel: formatEuro(cartTotal(cart)),
    customer,
    address,
    orderNotes,
  });
}

function whatsAppUrl(text) {
  const digits = phoneDigits(businessProfile?.orderPhone || config.orderPhone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function buildServiceReserveMessage(service) {
  const parts = [
    `Rezervim — ${businessName}`,
    `Shërbimi: ${service.name}`,
  ];
  const mins = service.durationMinutes;
  if (mins != null && mins > 0) {
    parts.push(`Kohëzgjatja: ~${mins} min`);
  }
  const price = service.priceEur;
  if (price != null && price > 0) {
    parts.push(`Çmimi: €${Number(price).toFixed(2)}`);
  }
  if (service.description) {
    parts.push(`Përshkrimi: ${service.description}`);
  }
  parts.push(
    '',
    'Emri:',
    'Mbiemri:',
    'Data/ora e preferuar:',
    'Telefoni:',
  );
  return parts.join('\n');
}

function reserveWhatsAppUrl(service) {
  const text = buildServiceReserveMessage(service);
  return whatsAppUrl(text);
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
  document.body.classList.add('cart-open');
  updateOrderPreview();
  renderPendingBanner();
  $('#cart-close')?.focus();
}

function closeCart() {
  cartPanel.classList.add('hidden');
  cartPanel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-open');
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
  if (customerAddressInput) customerAddressInput.value = '';
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
  const cart = hasActivePending() ? getPending()?.cart || [] : loadCart();
  orderPreview.textContent = cart.length
    ? buildOrderMessage(cart, readCheckoutFields())
    : '';
  orderPreview.classList.add('hidden');
}

function cartItemImageUrl(item) {
  if (item.imageUrl) return item.imageUrl;
  const p = products.find((x) => x.id === item.productId);
  return p?.imageUrls?.[0] || null;
}

function cartLineMediaHtml(item) {
  const url = cartItemImageUrl(item);
  if (url) {
    return `<div class="cart-line__media"><img src="${escapeHtml(url)}" alt="" loading="lazy" decoding="async" /></div>`;
  }
  const initial = escapeHtml((item.name || '?').trim().slice(0, 1).toUpperCase());
  return `<div class="cart-line__media cart-line__media--placeholder" aria-hidden="true"><span>${initial}</span></div>`;
}

function shortCartName(name) {
  const s = String(name || '');
  const paren = s.indexOf(' (');
  return paren > 0 ? s.slice(0, paren) : s;
}

function cartLineVariantHint(name) {
  const m = String(name || '').match(/\(([^)]+)\)\s*$/);
  return m ? m[1] : '';
}

function cartLineHtml(item, locked, multiBiz) {
  const subtotal = item.price * item.quantity;
  const variantHint = cartLineVariantHint(item.name);
  const slugAttr = escapeHtml(item.businessSlug || '');
  const variantAttr = item.variantId || '';
  return `
    <li class="cart-line${locked ? ' cart-line--locked' : ''}">
      ${cartLineMediaHtml(item)}
      <div class="cart-line__body">
        <div class="cart-line__top">
          <p class="cart-line__name">${escapeHtml(shortCartName(item.name))}</p>
          <p class="cart-line__total" aria-label="Nëntotali">${formatEuro(subtotal)}</p>
        </div>
        ${variantHint ? `<p class="cart-line__variant">${escapeHtml(variantHint)}</p>` : ''}
        ${multiBiz && item.businessSlug ? `<p class="cart-line__store">/${escapeHtml(item.businessSlug)}</p>` : ''}
        <div class="cart-line__bottom">
          <span class="cart-line__unit">${formatEuro(item.price)} · copë</span>
          <div class="qty-controls" aria-label="Sasia">
            <button type="button" class="qty-btn" data-dec="${item.productId}" data-variant-id="${variantAttr}" data-slug="${slugAttr}" ${locked ? 'disabled' : ''} aria-label="Zbrit sasinë">−</button>
            <span class="qty-value" aria-live="polite">${item.quantity}</span>
            <button type="button" class="qty-btn" data-inc="${item.productId}" data-variant-id="${variantAttr}" data-slug="${slugAttr}" ${locked ? 'disabled' : ''} aria-label="Shto sasinë">+</button>
          </div>
        </div>
      </div>
    </li>`;
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

function syncStoreBottomNav() {
  const view = document.body.dataset.shopView || 'home';
  highlightShopNav(view, { updateHash: false });
}

function bindEmptyStateActions(container) {
  container?.querySelectorAll('[data-empty-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-empty-action');
      if (view) setShopView(view);
    });
  });
}

function renderOffers() {
  if (!offers.length) {
    offersListEl.innerHTML = emptyStateHtml({
      title: 'Nuk ka oferta aktive',
      text: 'Kthehuni më vonë për zbritje dhe paketa speciale.',
    });
    offersEmptyEl?.classList.add('hidden');
    bindEmptyStateActions(offersListEl);
    return;
  }

  offersEmptyEl?.classList.add('hidden');
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
            ${
              isShopCartEnabled(getSlug())
                ? `<button type="button" class="add-btn add-btn--sm" data-offer-add="${item.productId}" data-offer-price="${item.salePrice}" ${hasActivePending() ? 'disabled' : ''}>Shto</button>`
                : ''
            }
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
  const count = urls.length;
  if (!count) {
    return `<div class="product-thumb-btn product-thumb-btn--placeholder" aria-hidden="true"><span>${escapeHtml((p.name || '?').slice(0, 1).toUpperCase())}</span></div>`;
  }
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
  const existing = document.getElementById('category-filters');
  if (!head || !categories.length || shouldLimitCatalogPreview()) {
    existing?.remove();
    return;
  }
  let bar = existing;
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

function renderCatalogActions(totalCount, shownCount) {
  if (!catalogActionsEl) return;
  const hiddenCount = totalCount - shownCount;
  if (!shouldLimitCatalogPreview() || hiddenCount <= 0) {
    if (catalogExpanded && isStoreMode() && totalCount > CATALOG_PREVIEW_LIMIT) {
      catalogActionsEl.innerHTML = `
        <button type="button" class="catalog-expand-btn catalog-expand-btn--less" data-catalog-collapse>
          Më pak
        </button>`;
      catalogActionsEl.classList.remove('hidden');
      catalogActionsEl.querySelector('[data-catalog-collapse]')?.addEventListener('click', () => {
        catalogExpanded = false;
        renderCatalog();
      });
      return;
    }
    catalogActionsEl.innerHTML = '';
    catalogActionsEl.classList.add('hidden');
    return;
  }

  catalogActionsEl.innerHTML = `
    <button type="button" class="catalog-expand-btn" data-catalog-expand>
      Shiko më shumë (${hiddenCount})
    </button>`;
  catalogActionsEl.classList.remove('hidden');
  catalogActionsEl.querySelector('[data-catalog-expand]')?.addEventListener('click', () => {
    catalogExpanded = true;
    renderCatalog();
    document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function renderCatalog() {
  renderCategoryFilters();
  const list = filteredProducts();
  if (!list.length) {
    catalogEl.innerHTML = emptyStateHtml({
      title: products.length ? 'Nuk ka produkte në këtë kategori' : 'Nuk ka produkte aktive',
      text: products.length
        ? 'Zgjidhni një kategori tjetër.'
        : 'Biznesi nuk ka publikuar produkte ende.',
    });
    renderCatalogActions(0, 0);
    return;
  }

  const limited = shouldLimitCatalogPreview();
  const visible = limited ? list.slice(0, CATALOG_PREVIEW_LIMIT) : list;
  catalogEl.classList.toggle('catalog--preview', limited);

  catalogEl.innerHTML = visible
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
      ${
        isShopCartEnabled(p.businessSlug || getSlug())
          ? `<button type="button" class="add-btn" data-add="${p.id}" ${hasActivePending() ? 'disabled' : ''}>Shto në shportë</button>`
          : ''
      }
    </article>
  `,
    )
    .join('');

  renderCatalogActions(list.length, visible.length);

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
  setSendButtonsEnabled(count > 0 && canCheckoutNow() && !locked);
  refreshShopCheckoutUi(displayCart);

  renderPendingBanner();

  if (count === 0 && !locked) {
    cartLines.innerHTML = '';
    cartEmpty.classList.remove('hidden');
    cartTotalEl.textContent = '';
    if (cartItemCountEl) cartItemCountEl.textContent = '';
    orderPreview.classList.add('hidden');
    return;
  }

  cartEmpty.classList.add('hidden');
  cartTotalEl.textContent = formatEuro(cartTotal(displayCart));
  if (cartItemCountEl) cartItemCountEl.textContent = formatCartItemCount(count);
  updateOrderPreview();

  const multiBiz = cartBusinessSlugs(displayCart).length > 1;

  cartLines.innerHTML = displayCart
    .map((item) => cartLineHtml(item, locked, multiBiz))
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

const SOCIAL_SVG_WHATSAPP =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>';

function formatServiceDuration(minutes) {
  if (minutes == null || minutes <= 0) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${h} orë`;
  return `${h} orë ${rest} min`;
}

function renderServices() {
  if (!servicesListEl) return;
  if (!services.length) {
    servicesListEl.innerHTML = emptyStateHtml({
      title: 'Nuk ka shërbime aktive',
      text: 'Kontaktoni biznesin direkt për informacion.',
      actionLabel: 'Kontakt',
      actionView: 'contact',
    });
    servicesEmptyEl?.classList.add('hidden');
    bindEmptyStateActions(servicesListEl);
    return;
  }

  servicesEmptyEl?.classList.add('hidden');
  const waAvailable = Boolean(reserveWhatsAppUrl(services[0]));

  servicesListEl.innerHTML = services
    .map((service) => {
      const duration = formatServiceDuration(service.durationMinutes);
      const price =
        service.priceEur != null && service.priceEur > 0
          ? formatEuro(service.priceEur)
          : '';
      const meta = [duration, price].filter(Boolean).join(' · ');
      const waUrl = reserveWhatsAppUrl(service);
      const reserveBtn = waAvailable && waUrl
        ? `<a class="rezervo-btn" href="${waUrl}" target="_blank" rel="noopener noreferrer" aria-label="Rezervo ${escapeHtml(service.name)} përmes WhatsApp">
            <span class="rezervo-btn__icon" aria-hidden="true">${SOCIAL_SVG_WHATSAPP}</span>
            Rezervo
          </a>`
        : `<p class="muted rezervo-unavailable">Vendosni numrin e porosive në admin.</p>`;

      return `
    <article class="service-card">
      <div class="service-card__body">
        <h3 class="service-card__title">${escapeHtml(service.name)}</h3>
        ${meta ? `<p class="service-card__meta">${escapeHtml(meta)}</p>` : ''}
        ${service.description ? `<p class="service-card__desc">${escapeHtml(service.description)}</p>` : ''}
      </div>
      ${reserveBtn}
    </article>`;
    })
    .join('');
}

async function loadServices() {
  if (!hasStoreSlug()) return;

  try {
    const data = await fetchServices(getSlug());
    services = data.services || [];
    renderServices();
    refreshStoreCtas();
  } catch {
    services = [];
    renderServices();
    refreshStoreCtas();
  }
}

function hideThemeToggle() {
  if (!themeToggleEl) return;
  themeToggleEl.hidden = true;
  themeToggleEl.classList.add('hidden');
}

function updateThemeToggleUi(scheme) {
  if (!themeToggleEl) return;
  const isDark = scheme === SCHEME_DARK;
  themeToggleEl.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  themeToggleEl.setAttribute(
    'aria-label',
    isDark ? 'Aktivizo modalitetin e ndritshëm' : 'Aktivizo modalitetin e errët',
  );
}

function applyStoreColorScheme(scheme) {
  if (storeBusinessProfile) applyProStoreTheme(storeBusinessProfile, scheme);
  updateThemeToggleUi(scheme);
}

function initThemeToggle() {
  if (!themeToggleEl || !hasStoreSlug()) {
    hideThemeToggle();
    return;
  }
  const scheme = getStoredScheme(getSlug());
  applyStoreColorScheme(scheme);
  themeToggleEl.hidden = false;
  themeToggleEl.classList.remove('hidden');
  if (themeToggleEl.dataset.bound === '1') return;
  themeToggleEl.dataset.bound = '1';
  themeToggleEl.addEventListener('click', () => {
    applyStoreColorScheme(toggleStoredScheme(getSlug()));
  });
}

async function renderMarketplaceHome() {
  document.body.dataset.mode = 'marketplace';
  storeBusinessProfile = null;
  storeCheckoutConfig = null;
  clearProStoreTheme();
  hideThemeToggle();
  heroTrust?.classList.add('hidden');
  storeBottomNav?.classList.add('hidden');
  offersSection.classList.add('hidden');
  servicesSection?.classList.add('hidden');
  document.querySelector('.catalog-head')?.classList.add('hidden');
  document.getElementById('hero')?.classList.add('hidden');
  document.querySelector('.site-nav')?.classList.add('hidden');
  displayShopName('Marketplace');
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

function closeLangModal() {
  if (!langModal) return;
  langModal.classList.add('hidden');
  langModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lang-modal-open');
  langSwitcherEl?.setAttribute('aria-expanded', 'false');
}

function openLangModal() {
  if (!langModal || !langModalOptions) return;
  const { locales } = getCatalogMeta();
  const active = getShopLocale();
  const available = locales.filter((code) => LOCALE_LABELS[code]);
  langModalOptions.replaceChildren();
  for (const code of available) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `lang-modal-option${code === active ? ' is-active' : ''}`;
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', code === active ? 'true' : 'false');
    btn.textContent = LOCALE_LABELS[code] || code.toUpperCase();
    btn.addEventListener('click', () => {
      closeLangModal();
      if (code !== active) setShopLocale(code);
    });
    langModalOptions.appendChild(btn);
  }
  langModal.classList.remove('hidden');
  langModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lang-modal-open');
  langSwitcherEl?.setAttribute('aria-expanded', 'true');
  langModalClose?.focus();
}

function initLangModal() {
  langSwitcherEl?.addEventListener('click', () => {
    if (langModal?.classList.contains('hidden')) openLangModal();
    else closeLangModal();
  });
  langModalBackdrop?.addEventListener('click', closeLangModal);
  langModalClose?.addEventListener('click', closeLangModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && langModal && !langModal.classList.contains('hidden')) {
      closeLangModal();
    }
  });
}

function renderLangSwitcher() {
  if (!langSwitcherEl) return;
  const { locales } = getCatalogMeta();
  const active = getShopLocale();
  const available = locales.filter((code) => LOCALE_LABELS[code]);
  if (available.length <= 1) {
    langSwitcherEl.hidden = true;
    return;
  }
  langSwitcherEl.hidden = false;
  langSwitcherEl.textContent = LOCALE_LABELS[active] || active.toUpperCase();
  langSwitcherEl.setAttribute('lang', active);
}

function applyShopSeo(business) {
  const { title, description } = businessSeoFromProfile(business, businessName);
  applyDocumentSeo({ title, description, locale: getShopLocale() });
}

function showStoreLoadError(err, slug) {
  document.body.dataset.mode = 'store';
  storeBusinessProfile = null;
  hideThemeToggle();
  heroTrust?.classList.add('hidden');
  storeBottomNav?.classList.add('hidden');
  offersSection?.classList.add('hidden');
  servicesSection?.classList.add('hidden');
  document.getElementById('hero')?.classList.add('hidden');
  document.querySelector('.site-nav')?.classList.add('hidden');

  const notFound = /not found/i.test(String(err?.message || err));
  const title = notFound ? 'Dyqani nuk u gjet' : 'Gabim gjatë ngarkimit';
  const text = notFound
    ? `Nuk ekziston dyqan me slug «${escapeHtml(slug)}». Kontrolloni linkun ose krijoni slug-in te Settings → Website.`
    : escapeHtml(String(err?.message || err));

  catalogEl.innerHTML = `${emptyStateHtml({
    title,
    text,
    actionLabel: 'Shiko të gjitha dyqanet',
    actionView: 'home',
  })}<p class="store-error-hint muted">Shembull linku: <code>${escapeHtml(
    shopPathFor('emri-i-biznesit'),
  )}</code></p>`;

  bindEmptyStateActions(catalogEl);
  catalogEl.querySelector('[data-empty-action]')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = marketplaceHomePath();
  });
}

async function loadShop() {
  const rawSegment = getRawPathSegment();
  if (rawSegment && !isValidSlug(rawSegment)) {
    await renderMarketplaceHome();
    const banner = document.createElement('p');
    banner.className = 'market-invalid-slug-banner';
    banner.setAttribute('role', 'alert');
    banner.textContent = `Adresa «/${rawSegment}» nuk është slug i vlefshëm. Zgjidhni një dyqan më poshtë.`;
    catalogEl.prepend(banner);
    return;
  }

  if (!hasStoreSlug()) {
    await renderMarketplaceHome();
    return;
  }

  const slug = getSlug();

  document.body.dataset.mode = 'store';
  heroTrust?.classList.remove('hidden');
  storeBottomNav?.classList.remove('hidden');
  if (brandLink) brandLink.href = shopPathFor(getSlug());
  offersSection.classList.remove('hidden');
  servicesSection?.classList.remove('hidden');
  document.querySelector('.catalog-head')?.classList.remove('hidden');
  document.getElementById('hero')?.classList.remove('hidden');
  document.querySelector('.site-nav')?.classList.remove('hidden');
  closeMobileNav();
  catalogEl.innerHTML = catalogSkeletonHtml(6);

  let data;
  try {
    data = await fetchCatalog(slug);
  } catch (err) {
    showStoreLoadError(err, slug);
    return;
  }
  if (data.meta) setCatalogMeta(data.meta);
  businessName = data.business?.name || 'Biznesi';
  const business = { ...data.business, productCount: data.productCount };
  updateShopPresentation(business);
  renderLangSwitcher();
  applyShopSeo(business);
  const routing = applySiteConfig(business);
  renderContactCards(business);
  storeBusinessProfile = business;
  registerShopCheckout(business);
  storeCheckoutConfig = normalizeShopCheckout(business);
  storeSectionMap = routing?.sectionMap || null;
  refreshStoreCtas();
  refreshShopCheckoutUi();
  initThemeToggle();
  renderHeroStats(business);
  if (routing?.shopViews) SHOP_VIEWS = routing.shopViews;
  if (routing?.sectionIds?.length) SHOP_SECTION_IDS = routing.sectionIds;
  if (isStoreMode()) {
    SHOP_SECTION_IDS.forEach((id) => {
      document.getElementById(id)?.classList.remove('view-hidden');
    });
    syncStoreBottomNav();
  }
  requestAnimationFrame(() => setShopView(parseShopViewFromHash()));
  categories = data.categories || [];
  selectedCategoryId = '';
  catalogExpanded = !isStoreMode() || parseShopViewFromHash() === 'products';
  products = data.products || [];
  const countEl = document.getElementById('catalog-count');
  if (countEl && data.productCount != null) {
    countEl.textContent = `${data.productCount} produkte`;
    countEl.classList.remove('hidden');
  }
  await loadOffers();
  await loadServices();
  renderCatalog();
  showOrderKeyHint();
}

function readCustomer() {
  return {
    name: customerNameInput?.value.trim() || '',
    phone: customerPhoneInput?.value.trim() || '',
  };
}

function readCheckoutFields() {
  return {
    customer: readCustomer(),
    address: customerAddressInput?.value.trim() || '',
    orderNotes: orderNotes?.value.trim() || '',
  };
}

function validateCheckout(checkout, cart = loadCart()) {
  const cfg = checkoutConfigForCart(cart, currentStoreSlug());
  const { customer, address } = checkout;
  if (cfg.customerName) {
    if (!customer.name || customer.name.length < 2) {
      return 'Shkruani emrin (min. 2 shkronja).';
    }
  }
  if (cfg.deliveryAddress) {
    if (!address || address.length < 5) {
      return 'Shkruani adresën e plotë të dorëzimit.';
    }
  }
  if (cfg.phone) {
    const digits = phoneDigits(customer.phone);
    if (customer.phone && digits.length > 0 && digits.length < 8) {
      return 'Numri i telefonit është i pavlefshëm (min. 8 shifra) ose lëreni bosh.';
    }
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
  if (!cart.length || !canCheckoutNow()) return;

  const checkout = readCheckoutFields();
  const customerError = validateCheckout(checkout, cart);
  if (customerError) {
    checkoutError.textContent = customerError;
    checkoutError.classList.remove('hidden');
    return;
  }

  const { customer, address, orderNotes: orderNotesText } = checkout;
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
            phone: customer.phone || undefined,
            address: address || undefined,
            notes: orderNotesText || undefined,
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
          phone: customer.phone || '',
          name: customer.name,
          address,
          status: o.status || 'pending',
          cart: cartSnapshot,
          notes: orderNotesText,
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
    setSendButtonsEnabled(cartCount(loadCart()) > 0 && canCheckoutNow() && !hasActivePending());
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
    if (customerAddressInput && pending.address) {
      customerAddressInput.value = pending.address;
    }
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
initLangModal();
initSiteNav();

$('#cart-toggle').addEventListener('click', openCart);
$('#cart-close').addEventListener('click', closeCart);
cartBackdrop?.addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !cartPanel.classList.contains('hidden')) closeCart();
});
orderNotes.addEventListener('input', updateOrderPreview);
customerNameInput?.addEventListener('input', updateOrderPreview);
customerAddressInput?.addEventListener('input', updateOrderPreview);
customerPhoneInput?.addEventListener('input', updateOrderPreview);
btnWhatsApp.addEventListener('click', () => sendOrder('whatsapp'));
btnSms.addEventListener('click', () => sendOrder('sms'));

restorePendingOnLoad();
loadShop().catch((err) => {
  const slug = getSlug() || getRawPathSegment() || '';
  if (slug && isValidSlug(slug)) showStoreLoadError(err, slug);
  else catalogEl.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
});
