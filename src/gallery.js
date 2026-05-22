import { normalizeMediaUrl } from './externalUrl.js';

const modal = () => document.getElementById('gallery-modal');
const imgEl = () => document.getElementById('gallery-img');
const titleEl = () => document.getElementById('gallery-title');
const counterEl = () => document.getElementById('gallery-counter');
const dotsEl = () => document.getElementById('gallery-dots');

let state = { urls: [], index: 0, name: '' };

function render() {
  const { urls, index, name } = state;
  if (!urls.length) return;
  const url = urls[index];
  imgEl().src = url;
  imgEl().alt = name;
  titleEl().textContent = name;
  counterEl().textContent = `${index + 1} / ${urls.length}`;
  dotsEl().innerHTML = urls
    .map(
      (_, i) =>
        `<button type="button" class="gallery-dot${i === index ? ' is-active' : ''}" data-dot="${i}" aria-label="Foto ${i + 1}"></button>`,
    )
    .join('');
  dotsEl().querySelectorAll('[data-dot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.index = Number(btn.getAttribute('data-dot'));
      render();
    });
  });
  document.getElementById('gallery-prev').disabled = urls.length <= 1;
  document.getElementById('gallery-next').disabled = urls.length <= 1;
}

export function openGallery({ name, imageUrls }) {
  const urls = (imageUrls || []).map((u) => normalizeMediaUrl(u)).filter(Boolean);
  if (!urls.length) return;
  state = { urls, index: 0, name: name || 'Produkt' };
  render();
  const m = modal();
  m.classList.remove('hidden');
  m.setAttribute('aria-hidden', 'false');
  document.body.classList.add('gallery-open');
}

export function closeGallery() {
  const m = modal();
  m.classList.add('hidden');
  m.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('gallery-open');
  imgEl().removeAttribute('src');
}

export function initGallery() {
  document.getElementById('gallery-close')?.addEventListener('click', closeGallery);
  document.getElementById('gallery-backdrop')?.addEventListener('click', closeGallery);
  document.getElementById('gallery-prev')?.addEventListener('click', () => {
    if (state.urls.length <= 1) return;
    state.index = (state.index - 1 + state.urls.length) % state.urls.length;
    render();
  });
  document.getElementById('gallery-next')?.addEventListener('click', () => {
    if (state.urls.length <= 1) return;
    state.index = (state.index + 1) % state.urls.length;
    render();
  });
  document.addEventListener('keydown', (e) => {
    if (modal()?.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowLeft') document.getElementById('gallery-prev')?.click();
    if (e.key === 'ArrowRight') document.getElementById('gallery-next')?.click();
  });
}
