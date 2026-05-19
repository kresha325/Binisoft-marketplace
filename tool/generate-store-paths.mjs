/**
 * GitHub Pages serves real files per path. Copy index.html under each store slug
 * so /Binisoft-marketplace/{slug} returns 200 (not only 404.html fallback).
 */
import fs from 'node:fs';
import path from 'node:path';

const apiBase =
  process.env.VITE_API_BASE_URL ||
  'https://us-central1-jon-sport.cloudfunctions.net/publicApi';
const distDir = path.resolve('dist');
const indexFile = path.join(distDir, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error('Missing dist/index.html — run vite build first.');
  process.exit(1);
}

const html = fs.readFileSync(indexFile, 'utf8');
const url = `${apiBase.replace(/\/$/, '')}/api/public/businesses`;

let slugs = [];
try {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await res.json();
  if (!res.ok) {
    console.warn(`Could not fetch businesses (${res.status}):`, data?.error?.message || '');
  } else {
    slugs = (data.businesses || [])
      .map((b) => String(b.slug || '').trim().toLowerCase())
      .filter((s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length >= 2);
  }
} catch (err) {
  console.warn('Could not fetch businesses:', err.message);
}

const unique = [...new Set(slugs)];
for (const slug of unique) {
  const dir = path.join(distDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

console.log(`Store path indexes: ${unique.length} slug(s) → dist/{slug}/index.html`);
