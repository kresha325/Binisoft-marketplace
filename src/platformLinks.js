import { appendLangQuery } from './locale.js';

/** Flutter admin (business register / login). */
const DASHBOARD_APP_BASE =
  import.meta.env.VITE_DASHBOARD_APP_URL || 'https://kresha325.github.io/binisoft-ad/app';

export function dashboardLoginUrl() {
  return appendLangQuery(`${DASHBOARD_APP_BASE}/login`);
}

export function dashboardRegisterUrl() {
  return appendLangQuery(`${DASHBOARD_APP_BASE}/register`);
}

export function dashboardAppUrl(path = '/dashboard') {
  const p = path.startsWith('/') ? path : `/${path}`;
  return appendLangQuery(`${DASHBOARD_APP_BASE}${p}`);
}
