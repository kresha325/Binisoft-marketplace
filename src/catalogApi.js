import {
  businessUrl,
  businessesUrl,
  catalogUrl,
  categoriesUrl,
  marketplaceUrl,
  offersUrl,
  servicesUrl,
} from './config.js';
import { appendLangQuery } from './locale.js';

async function fetchJson(url) {
  const res = await fetch(appendLangQuery(url), {
    headers: { Accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || data.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/** GET /api/public/businesses */
export async function fetchBusinesses() {
  const data = await fetchJson(businessesUrl());
  return data.businesses || [];
}

/** GET /api/public/marketplace — global feed (businesses, products, categories, offers). */
export async function fetchMarketplace() {
  return fetchJson(marketplaceUrl());
}

/** GET /api/shop/{slug}/business */
export async function fetchBusiness(slug) {
  const data = await fetchJson(businessUrl(slug));
  return data.business || null;
}

/** GET /api/shop/{slug}/products — includes categories, customFields, products */
export async function fetchCatalog(slug) {
  return fetchJson(catalogUrl(slug));
}

/** GET /api/shop/{slug}/categories */
export async function fetchCategories(slug) {
  const data = await fetchJson(categoriesUrl(slug));
  return {
    business: data.business || null,
    categories: data.categories || [],
  };
}

/** GET /api/shop/{slug}/offers */
export async function fetchOffers(slug) {
  const data = await fetchJson(offersUrl(slug));
  return {
    business: data.business || null,
    offers: data.offers || [],
  };
}

/** GET /api/shop/{slug}/services */
export async function fetchServices(slug) {
  const data = await fetchJson(servicesUrl(slug));
  return {
    business: data.business || null,
    services: data.services || [],
  };
}
