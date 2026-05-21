import { contestEntryUrl } from './config.js';
import { appendLangQuery } from './locale.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatContestPeriod(startsAt, endsAt) {
  const fmt = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };
  const a = fmt(startsAt);
  const b = fmt(endsAt);
  if (a && b) return `${a} – ${b}`;
  return a || b || '';
}

/**
 * Store contest card with optional inline entry form.
 * @param {object} contest
 * @param {{ slug: string, showForm?: boolean }} opts
 */
export function storeContestCardHtml(contest, { slug, showForm = true }) {
  const period = formatContestPeriod(contest.startsAt, contest.endsAt);
  const img = contest.imageUrl
    ? `<div class="contest-card__media"><img src="${escapeHtml(contest.imageUrl)}" alt="" loading="lazy" /></div>`
    : '';
  const prize = contest.prize
    ? `<p class="contest-card__prize"><strong>Çmimi:</strong> ${escapeHtml(contest.prize)}</p>`
    : '';
  const rules = contest.rules
    ? `<details class="contest-card__rules"><summary>Rregullat</summary><p>${escapeHtml(contest.rules)}</p></details>`
    : '';
  const desc = contest.description
    ? `<p class="contest-card__desc">${escapeHtml(contest.description)}</p>`
    : '';
  const meta = period
    ? `<p class="contest-card__meta muted">${escapeHtml(period)}${contest.entryCount ? ` · ${contest.entryCount} pjesëmarrës` : ''}</p>`
    : contest.entryCount
      ? `<p class="contest-card__meta muted">${contest.entryCount} pjesëmarrës</p>`
      : '';

  const form =
    showForm && slug
      ? `
    <form class="contest-entry-form" data-contest-entry="${escapeHtml(contest.id)}" novalidate>
      <label class="contest-entry-form__field">
        <span>Emri *</span>
        <input type="text" name="name" required minlength="2" autocomplete="name" />
      </label>
      <label class="contest-entry-form__field">
        <span>Telefoni *</span>
        <input type="tel" name="phone" required minlength="6" autocomplete="tel" />
      </label>
      <label class="contest-entry-form__field">
        <span>Email</span>
        <input type="email" name="email" autocomplete="email" />
      </label>
      <label class="contest-entry-form__field">
        <span>Shënim</span>
        <textarea name="note" rows="2"></textarea>
      </label>
      <p class="contest-entry-form__status hidden" data-contest-status role="status"></p>
      <button type="submit" class="btn btn-primary contest-entry-form__submit">Merr pjesë</button>
    </form>`
      : '';

  return `
    <article class="contest-card" data-contest-id="${escapeHtml(contest.id)}">
      ${img}
      <div class="contest-card__body">
        <h3 class="contest-card__title">${escapeHtml(contest.title || 'Konkurs')}</h3>
        ${meta}
        ${prize}
        ${desc}
        ${rules}
        ${form}
      </div>
    </article>`;
}

/** Marketplace summary card linking to store contests section. */
export function marketContestCardHtml(contest, shopLinkFn, _locale = 'sq') {
  const href = shopLinkFn(contest.businessSlug, '#contests');
  const period = formatContestPeriod(contest.startsAt, contest.endsAt);
  const img = contest.imageUrl
    ? `<div class="market-contest-card__media" style="background-image:url(${escapeHtml(contest.imageUrl)})"></div>`
    : '<div class="market-contest-card__media market-contest-card__media--placeholder" aria-hidden="true">🏆</div>';
  return `
    <a class="market-contest-card" href="${escapeHtml(href)}">
      ${img}
      <div class="market-contest-card__body">
        <span class="market-contest-card__biz muted">${escapeHtml(contest.businessName || '')}</span>
        <h3>${escapeHtml(contest.title || 'Konkurs')}</h3>
        ${contest.prize ? `<p class="market-contest-card__prize">${escapeHtml(contest.prize)}</p>` : ''}
        ${period ? `<p class="muted market-contest-card__meta">${escapeHtml(period)}</p>` : ''}
        <span class="market-contest-card__cta">Hyr në dyqan →</span>
      </div>
    </a>`;
}

export async function submitContestEntry(slug, contestId, body) {
  const url = appendLangQuery(contestEntryUrl(slug, contestId));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || data.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function bindContestEntryForms(root, slug) {
  if (!root || !slug) return;
  root.querySelectorAll('form[data-contest-entry]').forEach((form) => {
    if (form.dataset.bound === '1') return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const contestId = form.getAttribute('data-contest-entry');
      const statusEl = form.querySelector('[data-contest-status]');
      const btn = form.querySelector('button[type="submit"]');
      const fd = new FormData(form);
      const body = {
        name: String(fd.get('name') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        note: String(fd.get('note') || '').trim(),
      };
      if (statusEl) {
        statusEl.classList.remove('hidden', 'contest-entry-form__status--ok', 'contest-entry-form__status--err');
        statusEl.textContent = 'Duke dërguar…';
      }
      if (btn) btn.disabled = true;
      try {
        await submitContestEntry(slug, contestId, body);
        if (statusEl) {
          statusEl.textContent = 'Faleminderit! Pjesëmarrja u regjistrua.';
          statusEl.classList.add('contest-entry-form__status--ok');
        }
        form.reset();
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = err.message || 'Gabim. Provoni përsëri.';
          statusEl.classList.add('contest-entry-form__status--err');
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });
}
