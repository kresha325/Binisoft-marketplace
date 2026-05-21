import { jobApplicationUrl } from './config.js';
import { appendLangQuery } from './locale.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const EMPLOYMENT_LABELS = {
  sq: {
    full_time: 'Me kohë të plotë',
    part_time: 'Me kohë të pjesshme',
    contract: 'Kontratë',
    internship: 'Praktikë',
    temporary: 'Përkohshme',
    other: 'Tjetër',
  },
  en: {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    internship: 'Internship',
    temporary: 'Temporary',
    other: 'Other',
  },
  de: {
    full_time: 'Vollzeit',
    part_time: 'Teilzeit',
    contract: 'Vertrag',
    internship: 'Praktikum',
    temporary: 'Befristet',
    other: 'Sonstiges',
  },
};

export function employmentTypeLabel(type, locale = 'sq') {
  if (!type) return '';
  const table = EMPLOYMENT_LABELS[locale] || EMPLOYMENT_LABELS.sq;
  return table[type] || type;
}

export function formatJobPeriod(startsAt, endsAt) {
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

export function storeJobOpeningCardHtml(job, { slug, showForm = true, locale = 'sq' }) {
  const period = formatJobPeriod(job.startsAt, job.endsAt);
  const emp = employmentTypeLabel(job.employmentType, locale);
  const img = job.imageUrl
    ? `<div class="job-card__media"><img src="${escapeHtml(job.imageUrl)}" alt="" loading="lazy" /></div>`
    : '';
  const loc = job.location
    ? `<p class="job-card__location muted">📍 ${escapeHtml(job.location)}</p>`
    : '';
  const sal = job.salaryHint
    ? `<p class="job-card__salary"><strong>Paga:</strong> ${escapeHtml(job.salaryHint)}</p>`
    : '';
  const req = job.requirements
    ? `<details class="job-card__req"><summary>Kërkesat</summary><p>${escapeHtml(job.requirements)}</p></details>`
    : '';
  const desc = job.description
    ? `<p class="job-card__desc">${escapeHtml(job.description)}</p>`
    : '';
  const applyLinks = [
    job.applyEmail
      ? `<a href="mailto:${escapeHtml(job.applyEmail)}" class="job-card__mailto">${escapeHtml(job.applyEmail)}</a>`
      : '',
    job.applyUrl
      ? `<a href="${escapeHtml(job.applyUrl)}" class="job-card__link" target="_blank" rel="noopener noreferrer">Link aplikimi</a>`
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const form =
    showForm && slug
      ? `
    <form class="job-application-form" data-job-application="${escapeHtml(job.id)}" novalidate>
      <label class="job-application-form__field">
        <span>Emri *</span>
        <input type="text" name="name" required minlength="2" autocomplete="name" />
      </label>
      <label class="job-application-form__field">
        <span>Telefoni *</span>
        <input type="tel" name="phone" required minlength="6" autocomplete="tel" />
      </label>
      <label class="job-application-form__field">
        <span>Email</span>
        <input type="email" name="email" autocomplete="email" />
      </label>
      <label class="job-application-form__field">
        <span>Mesazh / CV (shënim)</span>
        <textarea name="note" rows="3"></textarea>
      </label>
      <p class="job-application-form__status hidden" data-job-status role="status"></p>
      <button type="submit" class="btn btn-primary job-application-form__submit">Apliko</button>
    </form>`
      : '';

  return `
    <article class="job-card" data-job-id="${escapeHtml(job.id)}">
      ${img}
      <div class="job-card__body">
        <h3 class="job-card__title">${escapeHtml(job.title || 'Pozicion')}</h3>
        ${emp ? `<span class="job-card__badge">${escapeHtml(emp)}</span>` : ''}
        ${period ? `<p class="job-card__meta muted">${escapeHtml(period)}</p>` : ''}
        ${loc}
        ${sal}
        ${desc}
        ${req}
        ${applyLinks ? `<p class="job-card__apply-links">${applyLinks}</p>` : ''}
        ${form}
      </div>
    </article>`;
}

export function marketJobOpeningCardHtml(job, shopLinkFn, locale = 'sq') {
  const href = shopLinkFn(job.businessSlug, '#job-openings');
  const period = formatJobPeriod(job.startsAt, job.endsAt);
  const emp = employmentTypeLabel(job.employmentType, locale);
  const img = job.imageUrl
    ? `<div class="market-job-card__media" style="background-image:url(${escapeHtml(job.imageUrl)})"></div>`
    : '<div class="market-job-card__media market-job-card__media--placeholder" aria-hidden="true">💼</div>';
  return `
    <a class="market-job-card" href="${escapeHtml(href)}">
      ${img}
      <div class="market-job-card__body">
        <span class="market-job-card__biz muted">${escapeHtml(job.businessName || '')}</span>
        <h3>${escapeHtml(job.title || 'Pozicion')}</h3>
        ${emp ? `<p class="market-job-card__type">${escapeHtml(emp)}</p>` : ''}
        ${job.location ? `<p class="muted">${escapeHtml(job.location)}</p>` : ''}
        ${period ? `<p class="muted market-job-card__meta">${escapeHtml(period)}</p>` : ''}
        <span class="market-job-card__cta">Shiko pozicionin →</span>
      </div>
    </a>`;
}

export async function submitJobApplication(slug, jobOpeningId, body) {
  const url = appendLangQuery(jobApplicationUrl(slug, jobOpeningId));
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

export function bindJobApplicationForms(root, slug) {
  if (!root || !slug) return;
  root.querySelectorAll('form[data-job-application]').forEach((form) => {
    if (form.dataset.bound === '1') return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const jobId = form.getAttribute('data-job-application');
      const statusEl = form.querySelector('[data-job-status]');
      const btn = form.querySelector('button[type="submit"]');
      const fd = new FormData(form);
      const body = {
        name: String(fd.get('name') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        note: String(fd.get('note') || '').trim(),
      };
      if (statusEl) {
        statusEl.classList.remove('hidden', 'job-application-form__status--ok', 'job-application-form__status--err');
        statusEl.textContent = 'Duke dërguar…';
      }
      if (btn) btn.disabled = true;
      try {
        await submitJobApplication(slug, jobId, body);
        if (statusEl) {
          statusEl.textContent = 'Faleminderit! Aplikimi u regjistrua.';
          statusEl.classList.add('job-application-form__status--ok');
        }
        form.reset();
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = err.message || 'Gabim. Provoni përsëri.';
          statusEl.classList.add('job-application-form__status--err');
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });
}
