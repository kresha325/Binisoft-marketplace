/**
 * User-entered URLs often omit the scheme (e.g. www.test.com).
 * Without https:// the browser treats them as site-relative paths → 404 on GitHub Pages.
 */
export function normalizeExternalUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^(mailto:|tel:|sms:|data:|#|\/|\?)/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  return `https://${s}`;
}

/** Safe value for HTML src/href attributes. */
export function normalizeMediaUrl(raw) {
  return normalizeExternalUrl(raw);
}

/** CSS background-image: url("…") with escaped quotes. */
export function cssBackgroundUrl(raw) {
  const url = normalizeExternalUrl(raw);
  if (!url) return '';
  const safe = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `url("${safe}")`;
}
