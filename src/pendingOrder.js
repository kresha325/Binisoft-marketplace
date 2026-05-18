import { getBusinessSlug } from './slug.js';

function pendingStorageKey() {
  const slug = getBusinessSlug();
  return slug ? `jon_sport_pending_order_v1:${slug}` : 'jon_sport_pending_order_v1';
}

export function loadPendingOrder() {
  try {
    const raw = localStorage.getItem(pendingStorageKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePendingOrder(data) {
  localStorage.setItem(pendingStorageKey(), JSON.stringify(data));
}

export function clearPendingOrder() {
  localStorage.removeItem(pendingStorageKey());
}

export function isPendingStatus(status) {
  return status === 'pending' || status === 'new';
}

export function isTerminalStatus(status) {
  return status === 'confirmed' || status === 'cancelled';
}
