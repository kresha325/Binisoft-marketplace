import { cartBusinessSlugs, loadCart } from './cart.js';
import {
  absorbApiKeyFromQuery,
  getBusinessSlug,
  isValidSlug,
} from './slug.js';

absorbApiKeyFromQuery();

const CLOUD_PUBLIC_API =
  'https://us-central1-jon-sport.cloudfunctions.net/publicApi';

/** Public catalog API (matches deployed publicApi routes). */
export const SHOP_API_PREFIX = '/api/public';

function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'kresha325.github.io' || host.endsWith('.github.io')) {
      return CLOUD_PUBLIC_API;
    }
    return window.location.origin;
  }
  return CLOUD_PUBLIC_API;
}

const apiBaseUrl = resolveApiBaseUrl();

const defaultSlug = import.meta.env.VITE_BUSINESS_SLUG || '';
const defaultApiKey = import.meta.env.VITE_API_KEY || '';

export function getSlug() {
  return getBusinessSlug();
}

export function getApiKey() {
  const slug = getSlug();
  if (!slug) return '';
  const stored = sessionStorage.getItem(`shop_api_key:${slug}`);
  if (stored) return stored;
  if (slug === defaultSlug && defaultApiKey) return defaultApiKey;
  return '';
}

function shopPath(slug, resource, extra = '') {
  const base = `${apiBaseUrl}${SHOP_API_PREFIX}`;
  if (!slug) return base;
  return `${base}/${slug}/${resource}${extra}`;
}

/** All active businesses (marketplace landing). */
export function businessesUrl() {
  return `${apiBaseUrl}${SHOP_API_PREFIX}/businesses`;
}

/** Global marketplace snapshot (businesses + catalog slices). */
export function marketplaceUrl() {
  return `${apiBaseUrl}${SHOP_API_PREFIX}/marketplace`;
}

export function businessUrl(slug = getSlug()) {
  return shopPath(slug, 'business');
}

export function catalogUrl(slug = getSlug()) {
  return shopPath(slug, 'products');
}

export function categoriesUrl(slug = getSlug()) {
  return shopPath(slug, 'categories');
}

export function offersUrl(slug = getSlug()) {
  return shopPath(slug, 'offers');
}

export function contestsUrl(slug = getSlug()) {
  return shopPath(slug, 'contests');
}

export function contestEntryUrl(slug, contestId) {
  return shopPath(slug, `contests/${contestId}/entries`);
}

export function servicesUrl(slug = getSlug()) {
  return shopPath(slug, 'services');
}

export function ordersUrl(slug = getSlug()) {
  return `${apiBaseUrl}/api/public/${slug}/orders`;
}

export function checkoutUrl() {
  return `${apiBaseUrl}${SHOP_API_PREFIX}/checkout`;
}

export function getApiKeyForSlug(slug) {
  if (!slug) return '';
  const stored = sessionStorage.getItem(`shop_api_key:${slug}`);
  if (stored) return stored;
  if (slug === defaultSlug && defaultApiKey) return defaultApiKey;
  return '';
}

export function orderUrl(orderId, slug = getSlug()) {
  return `${apiBaseUrl}/api/public/${slug}/orders/${orderId}`;
}

export function cancelOrderUrl(orderId, slug = getSlug()) {
  return `${orderUrl(orderId, slug)}/cancel`;
}

export function hasStoreSlug() {
  return isValidSlug(getSlug());
}

export function canPlaceOrders() {
  return hasStoreSlug();
}

export function isConfigured() {
  return hasStoreSlug();
}

export default {
  get apiBaseUrl() {
    return apiBaseUrl;
  },
  get businessSlug() {
    return getSlug();
  },
  get apiKey() {
    return getApiKey();
  },
  get orderPhone() {
    return import.meta.env.VITE_ORDER_PHONE || '';
  },
};
