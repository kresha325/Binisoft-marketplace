const STORAGE_PREFIX = 'binisoft-store-scheme:';

export const SCHEME_LIGHT = 'light';
export const SCHEME_DARK = 'dark';

/** localStorage key for marketplace home (/) theme preference */
export const MARKETPLACE_SCHEME_SLUG = '__marketplace__';

export function getStoredScheme(slug) {
  if (!slug) return SCHEME_LIGHT;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    return raw === SCHEME_DARK ? SCHEME_DARK : SCHEME_LIGHT;
  } catch {
    return SCHEME_LIGHT;
  }
}

export function setStoredScheme(slug, scheme) {
  if (!slug) return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${slug}`,
      scheme === SCHEME_DARK ? SCHEME_DARK : SCHEME_LIGHT,
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function toggleStoredScheme(slug) {
  const next = getStoredScheme(slug) === SCHEME_DARK ? SCHEME_LIGHT : SCHEME_DARK;
  setStoredScheme(slug, next);
  return next;
}
