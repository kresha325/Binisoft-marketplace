/** Shop locale from ?lang=, localStorage, or business default (API meta). */

const SUPPORTED = ['sq', 'en', 'de'];

let catalogMeta = {
  defaultLocale: 'sq',
  locales: [...SUPPORTED],
};

export function normalizeLocale(raw) {
  if (!raw) return null;
  const code = String(raw).trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED.includes(code) ? code : null;
}

export function setCatalogMeta(meta) {
  if (!meta) return;
  const def = normalizeLocale(meta.defaultLocale);
  if (def) catalogMeta.defaultLocale = def;
  if (Array.isArray(meta.locales) && meta.locales.length) {
    const list = meta.locales.map(normalizeLocale).filter(Boolean);
    if (list.length) catalogMeta.locales = [...new Set(list)];
  }
}

export function getCatalogMeta() {
  return { ...catalogMeta, locales: [...catalogMeta.locales] };
}

const STORAGE_KEY = 'shop_locale';

export function getShopLocale() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = normalizeLocale(params.get('lang'));
  if (fromQuery && catalogMeta.locales.includes(fromQuery)) {
    localStorage.setItem(STORAGE_KEY, fromQuery);
    return fromQuery;
  }

  const stored = normalizeLocale(localStorage.getItem(STORAGE_KEY));
  if (stored && catalogMeta.locales.includes(stored)) return stored;

  return catalogMeta.defaultLocale || 'sq';
}

/** Persist locale in URL + storage; reload catalog with new ?lang=. */
export function setShopLocale(code) {
  const next = normalizeLocale(code);
  if (!next || !catalogMeta.locales.includes(next)) return;

  localStorage.setItem(STORAGE_KEY, next);
  const params = new URLSearchParams(window.location.search);
  if (next === catalogMeta.defaultLocale) {
    params.delete('lang');
  } else {
    params.set('lang', next);
  }
  const qs = params.toString();
  const hash = window.location.hash || '';
  window.location.assign(`${window.location.pathname}${qs ? `?${qs}` : ''}${hash}`);
}

export function appendLangQuery(url) {
  const loc = getShopLocale();
  const def = catalogMeta.defaultLocale || 'sq';
  if (!loc || loc === def) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}lang=${encodeURIComponent(loc)}`;
}

export const LOCALE_LABELS = {
  sq: 'SQ',
  en: 'EN',
  de: 'DE',
};
