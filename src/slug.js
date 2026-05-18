/** URL path → business slug (multi-tenant storefront). */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** First path segment, e.g. /napoletana-nostra → napoletana-nostra */
export function getPathSegment() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  return parts[0] || null;
}

export function isValidSlug(slug) {
  return Boolean(slug && SLUG_RE.test(slug));
}

/**
 * Slug from URL path only. Root `/` = marketplace (all businesses).
 * Set VITE_SINGLE_STORE_DEV=true + VITE_BUSINESS_SLUG to force one store on `/` (legacy dev).
 */
export function getBusinessSlug() {
  const segment = getPathSegment();
  if (segment && isValidSlug(segment)) return segment;
  if (import.meta.env.VITE_SINGLE_STORE_DEV === 'true') {
    const fallback = normalizeSlug(import.meta.env.VITE_BUSINESS_SLUG || '');
    if (isValidSlug(fallback)) return fallback;
  }
  return '';
}

export function isStorePath() {
  const segment = getPathSegment();
  return Boolean(segment && isValidSlug(segment));
}

export function shopPathFor(slug) {
  const s = normalizeSlug(slug);
  if (!isValidSlug(s)) return '/';
  return `/${s}`;
}

export function shopAbsoluteUrl(slug) {
  return `${window.location.origin}${shopPathFor(slug)}`;
}

/** Persist ?key= from admin (API Docs) for order placement on this slug. */
export function absorbApiKeyFromQuery() {
  const slug = getBusinessSlug();
  if (!slug) return;
  const params = new URLSearchParams(window.location.search);
  const key = params.get('key')?.trim();
  if (!key || key.length < 16) return;
  sessionStorage.setItem(`shop_api_key:${slug}`, key);
  params.delete('key');
  const qs = params.toString();
  const next = window.location.pathname + (qs ? `?${qs}` : '');
  window.history.replaceState({}, '', next);
}
