const IFRAME_SRC_RE = /<iframe[^>]+src\s*=\s*["']([^"']+)["']/i;
const HTTP_URL_RE = /https?:\/\/[^\s"'<>]+/;

export function extractGoogleMapsUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  const iframe = raw.match(IFRAME_SRC_RE);
  if (iframe) return iframe[1].trim();

  if (/<\s*iframe/i.test(raw) || raw.includes('</iframe>')) {
    return '';
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const end = raw.search(/[\s"'<>]/);
    return (end > 0 ? raw.slice(0, end) : raw).trim();
  }

  const http = raw.match(HTTP_URL_RE);
  return http ? http[0].trim() : '';
}

/** Safe iframe [src] for footer map — never raw HTML. */
export function resolveMapsEmbedSrc(business) {
  for (const raw of [business?.googleMapsEmbedUrl, business?.googleMapsUrl]) {
    const url = extractGoogleMapsUrl(raw);
    if (!url || !url.startsWith('http') || url.includes('<')) continue;
    if (url.includes('/maps/embed') || url.includes('output=embed')) {
      return url;
    }
  }
  return '';
}

function mapsUrlForOpening(url) {
  try {
    const u = new URL(url);
    if (u.pathname.includes('/maps/embed')) {
      const pb = u.searchParams.get('pb');
      if (pb) return `https://www.google.com/maps?pb=${pb}`;
      return url.replace('/maps/embed', '/maps');
    }
    if (u.searchParams.get('output') === 'embed') {
      u.searchParams.delete('output');
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/** URL to open Google Maps in a new tab (share link or search by address). */
export function resolveGoogleMapsOpenUrl(business, locationLine = '') {
  const stored = extractGoogleMapsUrl(business?.googleMapsUrl);
  if (stored) return mapsUrlForOpening(stored);
  const query = String(locationLine || '').trim();
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Makes a location label open Google Maps on click / Enter. */
export function bindLocationAction(el, business, locationText) {
  if (!el) return;
  const mapsUrl = resolveGoogleMapsOpenUrl(business, locationText);
  const label = String(locationText || '').trim();

  const cleanup = () => {
    el.classList.remove('location-action');
    el.removeAttribute('role');
    el.removeAttribute('tabindex');
    el.removeAttribute('title');
    el.onclick = null;
    el.onkeydown = null;
    el.style.cursor = '';
  };

  if (!label || !mapsUrl) {
    cleanup();
    return;
  }

  const openMaps = () => {
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  el.classList.add('location-action');
  el.setAttribute('role', 'link');
  el.setAttribute('tabindex', '0');
  el.setAttribute('title', 'Hap në Google Maps');
  el.onclick = (e) => {
    e.preventDefault();
    openMaps();
  };
  el.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMaps();
    }
  };
}
