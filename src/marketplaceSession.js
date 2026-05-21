import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import { firebaseWebConfig } from './firebaseConfig.js';

/** @typedef {'loading' | 'signedOut' | 'signedIn'} SessionStatus */

/** @type {{ status: SessionStatus, displayLabel: string, dashboardPath: string }} */
let session = { status: 'loading', displayLabel: '', dashboardPath: '/dashboard' };

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(session);
    } catch (_) {
      /* ignore */
    }
  });
}

function labelFromProfile(data, email) {
  const name = String(data?.displayName || '').trim();
  if (name) return name;
  const mail = String(email || data?.email || '').trim();
  if (!mail) return '';
  const local = mail.split('@')[0] || mail;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

async function loadProfile(uid, email) {
  const db = getFirestore();
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.exists() ? snap.data() : {};
  const businessId = String(data.businessId || '').trim();
  return {
    displayLabel: labelFromProfile(data, email),
    dashboardPath: businessId ? '/dashboard' : '/businesses',
  };
}

export function getMarketplaceSession() {
  return session;
}

/** @param {(s: typeof session) => void} fn */
export function onMarketplaceSessionChange(fn) {
  listeners.add(fn);
  fn(session);
  return () => listeners.delete(fn);
}

let started = false;

/** Detects Firebase session (e.g. after login on binisoft-ad on same github.io origin). */
export function initMarketplaceSession() {
  if (started) return;
  started = true;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseWebConfig);
  const auth = getAuth(app);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      session = { status: 'signedOut', displayLabel: '', dashboardPath: '/dashboard' };
      notify();
      return;
    }

    session = { status: 'loading', displayLabel: '', dashboardPath: '/dashboard' };
    notify();

    try {
      const profile = await loadProfile(user.uid, user.email || '');
      session = {
        status: 'signedIn',
        displayLabel: profile.displayLabel || labelFromProfile(null, user.email),
        dashboardPath: profile.dashboardPath,
      };
    } catch (_) {
      session = {
        status: 'signedIn',
        displayLabel: labelFromProfile(null, user.email),
        dashboardPath: '/dashboard',
      };
    }
    notify();
  });
}
