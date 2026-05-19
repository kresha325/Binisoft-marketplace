/** URL path → business slug (multi-tenant storefront). */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_SLUG_LENGTH = 2;

/** Path segments that must not be treated as store slugs (assets, SPA files, …). */
const RESERVED_SEGMENTS = new Set([
  'assets',
  'icons',
  'src',
  'api',
  'public',
  'marketplace',
  'businesses',
  'index.html',
  '404.html',
  'favicon.ico',
  'favicon.svg',
  'binisoft-logo.png',
]);

export function normalizeSlug(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Strip Vite base (e.g. /Binisoft-marketplace) for GitHub Pages project sites. */
function appPathname() {
  const base = import.meta.env.BASE_URL || '/';
  let path = window.location.pathname;
  if (base !== '/') {
    const prefix = base.replace(/\/$/, '');
    if (path === prefix) path = '/';
    else if (path.startsWith(`${prefix}/`)) path = path.slice(prefix.length) || '/';
  }
  return path;
}

/** First path segment, e.g. /napoletana-nostra → napoletana-nostra */
export function getPathSegment() {
  const path = appPathname().replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  return parts[0] || null;
}

export function isValidSlug(slug) {
  if (!slug || slug.length < MIN_SLUG_LENGTH) return false;
  if (RESERVED_SEGMENTS.has(slug)) return false;
  return SLUG_RE.test(slug);
}

/** Raw first URL segment (may be invalid slug). */
export function getRawPathSegment() {
  return getPathSegment();
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

/** Marketplace root (respects BASE_URL on GitHub Pages). */
export function marketplaceHomePath() {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

export function shopPathFor(slug) {
  const s = normalizeSlug(slug);
  if (!isValidSlug(s)) return marketplaceHomePath();
  const root = marketplaceHomePath();
  return `${root}${s}`;
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
