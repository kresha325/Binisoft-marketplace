/** Same Firebase web app as binisoft-ad (shared auth on kresha325.github.io). */
export const firebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBkHpcfoxEZSvmFRKGwUwuO1LnmihUdGfU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'jon-sport.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'jon-sport',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'jon-sport.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '732129842851',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || '1:732129842851:web:7b0bc8e041b6e2ae645116',
};
