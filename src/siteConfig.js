function parseHex(hex) {
  const h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length >= 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  return [10, 22, 40];
}

function toHex([r, g, b]) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mixHex(a, b, t) {
  const ar = parseHex(a);
  const br = parseHex(b);
  return toHex([
    ar[0] + (br[0] - ar[0]) * t,
    ar[1] + (br[1] - ar[1]) * t,
    ar[2] + (br[2] - ar[2]) * t,
  ]);
}

function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Display line for city / state / legacy location. */
export function formatBusinessLocation(business) {
  if (!business) return '';
  const city = String(business.city || '').trim();
  const state = String(business.state || '').trim();
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return String(business.location || '').trim();
}

const SECTION_DOM = {
  hero: 'hero',
  offers: 'offers',
  products: 'shop-products',
  services: 'shop-services',
  about: 'about',
  gallery: 'gallery',
  contact: 'contact',
};

const NAV_VIEW = {
  hero: 'home',
  offers: 'offers',
  products: 'products',
  services: 'services',
  about: 'about',
  gallery: 'gallery',
  contact: 'contact',
};

const DEFAULT_NAV_LABELS = {
  home: 'Kreu',
  offers: 'Oferta',
  products: 'Produkte',
  services: 'Shërbimet',
  about: 'Rreth nesh',
  gallery: 'Galeria',
  contact: 'Kontakt',
};

const SOCIAL_SVG = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.427.403a4.92 4.92 0 0 1 1.675 1.09 4.92 4.92 0 0 1 1.09 1.675c.163.457.349 1.257.403 2.427.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.427a4.92 4.92 0 0 1-1.09 1.675 4.92 4.92 0 0 1-1.675 1.09c-.457.163-1.257.349-2.427.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.427-.403a4.92 4.92 0 0 1-1.675-1.09 4.92 4.92 0 0 1-1.09-1.675c-.163-.457-.349-1.257-.403-2.427C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.427a4.92 4.92 0 0 1 1.09-1.675 4.92 4.92 0 0 1 1.675-1.09c.457-.163 1.257-.349 2.427-.403C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.15 0-3.516.012-4.746.068-1.043.048-1.61.222-1.987.37a3.3 3.3 0 0 0-1.193.778 3.3 3.3 0 0 0-.778 1.193c-.148.377-.322.944-.37 1.987-.056 1.23-.068 1.596-.068 4.746s.012 3.516.068 4.746c.048 1.043.222 1.61.37 1.987a3.3 3.3 0 0 0 .778 1.193 3.3 3.3 0 0 0 1.193.778c.377.148.944.322 1.987.37 1.23.056 1.596.068 4.746.068s3.516-.012 4.746-.068c1.043-.048 1.61-.222 1.987-.37a3.3 3.3 0 0 0 1.193-.778 3.3 3.3 0 0 0 .778-1.193c.148-.377.322-.944.37-1.987.056-1.23.068-1.596.068-4.746s-.012-3.516-.068-4.746c-.048-1.043-.222-1.61-.37-1.987a3.3 3.3 0 0 0-.778-1.193 3.3 3.3 0 0 0-1.193-.778c-.377-.148-.944-.322-1.987-.37-1.23-.056-1.596-.068-4.746-.068zM12 7.378a4.622 4.622 0 1 0 0 9.244 4.622 4.622 0 0 0 0-9.244zm0 7.6a2.978 2.978 0 1 1 0-5.956 2.978 2.978 0 0 1 0 5.956zm5.806-7.845a1.08 1.08 0 1 0 0 2.16 1.08 1.08 0 0 0 0-2.16z"/></svg>',
  tiktok:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .55.04.8.11V9.01a6.27 6.27 0 0 0-.8-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>',
  youtube:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.062 2.062 0 0 1 2.063-2.063 2.062 2.062 0 0 1 2.063 2.063 2.062 2.062 0 0 1-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  whatsapp:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
};

function sectionMap(siteConfig) {
  const list = siteConfig?.sections || [];
  const map = new Map();
  for (const s of list) map.set(s.id, s);
  return map;
}

function isEnabled(map, id) {
  const s = map.get(id);
  return s ? s.enabled !== false : true;
}

function youtubeEmbedUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
  } catch (_) {
    const id = String(url).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  return url;
}

export function buildShopViews(siteConfig) {
  const map = sectionMap(siteConfig);
  const home = [];
  for (const id of ['hero', 'offers', 'products', 'services', 'about', 'gallery', 'contact']) {
    if (isEnabled(map, id)) home.push(SECTION_DOM[id]);
  }
  const views = { home: home.length ? home : ['hero', 'shop-products', 'contact'] };
  for (const id of ['offers', 'products', 'services', 'about', 'gallery', 'contact']) {
    if (isEnabled(map, id)) views[NAV_VIEW[id]] = [SECTION_DOM[id]];
  }
  return views;
}

export function buildSectionIds(siteConfig) {
  return Object.values(SECTION_DOM).filter((domId) => {
    const id = Object.entries(SECTION_DOM).find(([, v]) => v === domId)?.[0];
    return id && isEnabled(sectionMap(siteConfig), id);
  });
}

export function applySiteTheme(siteConfig) {
  const theme = siteConfig?.theme || {};
  const root = document.documentElement;
  const primary = theme.primary || '#1c1917';
  const accent = theme.accent || '#ff6b35';
  const surface = theme.background || mixHex(primary, '#ffffff', 0.08);
  const text = theme.text || (luminance(primary) > 0.4 ? '#0f172a' : '#f8fafc');

  root.style.setProperty('--navy', primary);
  root.style.setProperty('--navy-mid', mixHex(primary, '#000000', 0.12));
  root.style.setProperty('--navy-light', mixHex(primary, '#ffffff', 0.14));
  root.style.setProperty('--yellow', accent);
  root.style.setProperty('--yellow-hover', mixHex(accent, '#000000', 0.08));
  root.style.setProperty('--yellow-text', luminance(accent) > 0.55 ? '#0a1628' : '#ffffff');
  root.style.setProperty('--surface', surface);
  root.style.setProperty('--text', text);
  root.style.setProperty('--muted', mixHex(text, primary, 0.45));
  root.style.setProperty('--border', `color-mix(in srgb, ${text} 12%, transparent)`);
  root.style.setProperty(
    '--header-bg',
    `color-mix(in srgb, ${primary} 88%, transparent)`,
  );

  if (siteConfig?.layout === 'wide') {
    root.style.setProperty('--max', '1280px');
    document.body.classList.add('layout-wide');
  } else {
    root.style.setProperty('--max', '1200px');
    document.body.classList.remove('layout-wide');
  }
}

export function applyStoreBranding(business) {
  const brandLogo = document.querySelector('.brand-logo');
  const logoUrl = (business?.logoUrl || '').trim();
  if (!brandLogo) return;
  if (logoUrl) {
    brandLogo.src = logoUrl;
    brandLogo.alt = business?.name ? `${business.name} logo` : '';
    brandLogo.classList.add('brand-logo--store');
  } else {
    brandLogo.classList.remove('brand-logo--store');
  }
}

function setSectionHead(sectionEl, cfg, fallbackTitle) {
  if (!sectionEl) return;
  const head = sectionEl.querySelector('.section-head');
  if (!head) return;
  const h2 = head.querySelector('h2');
  const descId = `${sectionEl.id}-desc`;
  let desc = head.querySelector(`#${descId}`);
  if (cfg?.title && h2) h2.textContent = cfg.title;
  else if (h2 && fallbackTitle) h2.textContent = fallbackTitle;
  if (cfg?.description) {
    if (!desc) {
      desc = document.createElement('p');
      desc.id = descId;
      desc.className = 'muted section-desc';
      head.appendChild(desc);
    }
    desc.textContent = cfg.description;
    desc.classList.remove('hidden');
  } else if (desc) {
    desc.classList.add('hidden');
  }
}

function renderGallery(cfg) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.replaceChildren();
  const items = cfg?.galleryItems || [];
  if (!items.length) {
    grid.innerHTML = '<p class="muted">Nuk ka elementë në galeri.</p>';
    return;
  }
  for (const item of items) {
    const cell = document.createElement('div');
    cell.className = 'gallery-site-item';
    if (item.youtubeUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = youtubeEmbedUrl(item.youtubeUrl);
      iframe.title = item.caption || 'Video';
      iframe.loading = 'lazy';
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      cell.appendChild(iframe);
    } else if (item.imageUrl) {
      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = item.caption || '';
      cell.appendChild(img);
    }
    if (item.caption) {
      const cap = document.createElement('p');
      cap.className = 'gallery-site-caption';
      cap.textContent = item.caption;
      cell.appendChild(cap);
    }
    if (cell.childNodes.length) grid.appendChild(cell);
  }
}

function rebuildNav(siteConfig, siteNav) {
  if (!siteNav) return;
  const map = sectionMap(siteConfig);
  siteNav.replaceChildren();
  const links = [];
  if (
    isEnabled(map, 'hero') ||
    isEnabled(map, 'offers') ||
    isEnabled(map, 'products') ||
    isEnabled(map, 'services')
  ) {
    links.push({ view: 'home', label: DEFAULT_NAV_LABELS.home, href: '#' });
  }
  for (const id of ['products', 'services', 'offers', 'about', 'gallery', 'contact']) {
    if (!isEnabled(map, id)) continue;
    const cfg = map.get(id);
    const view = NAV_VIEW[id];
    const label = cfg?.navLabel || cfg?.title || DEFAULT_NAV_LABELS[view];
    links.push({
      view,
      label,
      href: view === 'home' ? '#' : `#${view}`,
    });
  }
  for (const link of links) {
    const a = document.createElement('a');
    a.href = link.href;
    a.className = 'nav-link';
    a.dataset.nav = '';
    a.dataset.view = link.view;
    a.textContent = link.label;
    siteNav.appendChild(a);
  }
}

function renderFooter(business, siteConfig) {
  const extras = document.getElementById('footer-extras');
  if (!extras) return;
  extras.replaceChildren();
  const cfg = siteConfig || {};
  const map = sectionMap(cfg);

  const locationLine = formatBusinessLocation(business);
  if (cfg.footerShowLocation !== false && locationLine) {
    const p = document.createElement('p');
    p.className = 'footer-line footer-line--location';
    p.textContent = locationLine;
    extras.appendChild(p);
  }

  const embedSrc = business?.googleMapsEmbedUrl || '';
  if (cfg.footerShowLocation !== false && embedSrc) {
    const mapWrap = document.createElement('div');
    mapWrap.className = 'footer-map';
    const iframe = document.createElement('iframe');
    iframe.src = embedSrc;
    iframe.title = 'Google Maps';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    mapWrap.appendChild(iframe);
    extras.appendChild(mapWrap);
  }

  const phone = business?.orderPhone || '';
  const digits = String(phone).replace(/\D/g, '');
  if (cfg.footerShowPhone !== false && digits) {
    const a = document.createElement('a');
    a.className = 'footer-line';
    a.href = `tel:+${digits}`;
    a.textContent = phone;
    extras.appendChild(a);
  }

  if (cfg.footerShowWhatsApp !== false && digits) {
    const wa = document.createElement('a');
    wa.className = 'footer-wa-btn';
    wa.href = `https://wa.me/${digits}`;
    wa.target = '_blank';
    wa.rel = 'noopener noreferrer';
    wa.textContent = 'WhatsApp';
    extras.appendChild(wa);
  }

  const socials = cfg.socials || [];
  if (socials.length) {
    const row = document.createElement('div');
    row.className = 'footer-socials';
    row.setAttribute('role', 'list');
    for (const s of socials) {
      const href = s.url?.startsWith('http') ? s.url : `https://${s.url}`;
      const a = document.createElement('a');
      a.href = href;
      a.className = `footer-social footer-social--${s.platform}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', s.platform);
      a.innerHTML = SOCIAL_SVG[s.platform] || '';
      row.appendChild(a);
    }
    extras.appendChild(row);
  }

  const powered = document.createElement('p');
  powered.className = 'footer-powered';
  powered.innerHTML =
    'Faqe e biznesit nga <a href="https://binisoft.github.io/binisoft-ad/" target="_blank" rel="noopener noreferrer">Binisoft</a>';
  extras.appendChild(powered);
}

/**
 * Apply storefront config from API business object.
 * Returns { shopViews, sectionIds } for main.js routing.
 */
export function applySiteConfig(business) {
  const siteConfig = business?.siteConfig;
  applySiteTheme(siteConfig);
  applyStoreBranding(business);
  const map = sectionMap(siteConfig);

  for (const [id, domId] of Object.entries(SECTION_DOM)) {
    const el = document.getElementById(domId);
    if (!el) continue;
    const enabled = isEnabled(map, id);
    el.classList.toggle('site-section-disabled', !enabled);
    if (!enabled) el.classList.add('view-hidden');
  }

  const heroCfg = map.get('hero');
  const heroEl = document.getElementById('hero');
  if (heroEl && isEnabled(map, 'hero')) {
    const titleEl = document.getElementById('hero-title');
    const taglineEl = document.getElementById('hero-tagline');
    const eyebrowEl = document.getElementById('hero-eyebrow');
    if (heroCfg?.title && titleEl) titleEl.textContent = heroCfg.title;
    if (heroCfg?.description && taglineEl) taglineEl.textContent = heroCfg.description;
    if (eyebrowEl && !heroCfg?.title) eyebrowEl.textContent = business?.name || 'Mirësevini';

    const ctaEl = document.getElementById('hero-cta');
    if (ctaEl && heroCfg?.ctaLabel) ctaEl.textContent = heroCfg.ctaLabel;

    const coverEl = document.getElementById('hero-cover');
    let coverUrl = business?.coverImageUrl || '';
    if (heroCfg?.useProfileCover === false && heroCfg?.imageUrl) {
      coverUrl = heroCfg.imageUrl;
    }
    if (coverEl) {
      if (coverUrl) {
        coverEl.style.backgroundImage = `url(${coverUrl})`;
        coverEl.classList.remove('hidden');
        heroEl.classList.add('hero--with-cover');
      } else {
        coverEl.classList.add('hidden');
        heroEl.classList.remove('hero--with-cover');
      }
    }
  }

  setSectionHead(document.getElementById('offers'), map.get('offers'), 'Ofertat');
  setSectionHead(document.getElementById('shop-products'), map.get('products'), 'Produktet');
  setSectionHead(document.getElementById('shop-services'), map.get('services'), 'Shërbimet');
  setSectionHead(document.getElementById('about'), map.get('about'), 'Rreth nesh');
  setSectionHead(document.getElementById('gallery'), map.get('gallery'), 'Galeria');
  setSectionHead(document.getElementById('contact'), map.get('contact'), 'Kontakt');

  const aboutCfg = map.get('about');
  const aboutText = document.getElementById('about-text');
  if (aboutText) {
    if (aboutCfg?.description) aboutText.textContent = aboutCfg.description;
  }

  const contactCfg = map.get('contact');
  const contactText = document.getElementById('contact-text');
  if (contactText && contactCfg?.description) {
    contactText.textContent = contactCfg.description;
  }

  if (isEnabled(map, 'gallery')) renderGallery(map.get('gallery'));

  const siteNav = document.getElementById('site-nav');
  rebuildNav(siteConfig, siteNav);
  renderFooter(business, siteConfig);

  return {
    shopViews: buildShopViews(siteConfig),
    sectionIds: buildSectionIds(siteConfig),
  };
}
