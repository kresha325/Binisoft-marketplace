import { normalizeMediaUrl } from './externalUrl.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function storeEmployeeCardHtml(employee) {
  const name = escapeHtml(
    `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Punëtor',
  );
  const photo = employee.photoUrl
    ? `<div class="employee-card__media"><img src="${escapeHtml(normalizeMediaUrl(employee.photoUrl))}" alt="" loading="lazy" /></div>`
    : `<div class="employee-card__media employee-card__media--placeholder" aria-hidden="true"><span>${name.slice(0, 1)}</span></div>`;
  const contact = [employee.email, employee.phone].filter(Boolean).map(escapeHtml).join(' · ');
  return `
    <article class="employee-card">
      ${photo}
      <div class="employee-card__body">
        <h3 class="employee-card__name">${name}</h3>
        ${contact ? `<p class="employee-card__contact muted">${contact}</p>` : ''}
      </div>
    </article>`;
}
