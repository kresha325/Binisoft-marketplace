# Binisoft Marketplace

Public shop for the Binisoft platform: **global marketplace** at `/` and **per-business stores** at `/{slug}`.

Data comes from the same Firestore catalog managed in [Business Dashboard API](https://github.com/kresha325/binisoft-ad) (superadmin + admin). Cloud Functions: `publicApi` → `/api/public/marketplace`, `/api/public/{slug}/products`, etc.

## URLs

| Environment | Marketplace | Example store |
|-------------|-------------|---------------|
| Local dev | http://localhost:5179/ | http://localhost:5179/napoletana-nostra |
| GitHub Pages | https://kresha325.github.io/Binisoft-marketplace/ | https://kresha325.github.io/Binisoft-marketplace/napoletana-nostra |
| Firebase (optional) | https://jon-sport-shop.web.app/ | https://jon-sport-shop.web.app/napoletana-nostra |

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` — API base (optional; dev uses Vite proxy to Cloud Functions):

```env
VITE_API_BASE_URL=https://us-central1-jon-sport.cloudfunctions.net/publicApi
```

## Run

```bash
npm run dev
```

- **`/`** — all businesses, products, categories, offers (tabs + search)
- **`/{business-slug}`** — single store (catalog, cart, WhatsApp/SMS checkout)

Do **not** set `VITE_BUSINESS_SLUG` unless you want legacy single-store mode on `/` (`VITE_SINGLE_STORE_DEV=true`).

## Deploy (GitHub Pages)

1. Repo → **Settings** → **Pages** → **Build and deployment**: **GitHub Actions** (not “Deploy from branch”).
2. Push to `main` — workflow **Deploy GitHub Pages** publishes `dist/`.

Local preview of the Pages build:

```bash
npm run build:pages
npm run preview:pages
```

API calls go directly to Cloud Functions (`VITE_API_BASE_URL` at build time). Ensure `publicApi` allows CORS from `https://kresha325.github.io`.

## Deploy (Firebase Hosting, optional)

```bash
npm run deploy:firebase
```

Builds and copies `dist/` into `Business Dashboard API/hosting-shop`, then deploys `hosting:shop` on project `jon-sport`.

## API (platform)

- `GET /api/public/marketplace` — global feed
- `GET /api/public/businesses` — business list
- `GET /api/public/{slug}/products` — store catalog
- `GET /api/public/{slug}/offers` — active offers

Locale: `?lang=sq|en|de`

## Related repos

- **Admin / superadmin:** [binisoft-ad](https://github.com/kresha325/binisoft-ad)
- **Backend:** `Business Dashboard API` (Firebase Functions + Firestore)
