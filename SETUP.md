# Jon Sport Shop — dyqan publik për klientët

Ky projekt është **vetëm për klientët** (browse, shportë, porosi WhatsApp).  
**Admin** është aplikacion i veçantë: `Business Dashboard API` (Binisoft Admin).

## Kërkesa

- Biznesi me **slug** aktiv (p.sh. `napoletana-nostra`)
- **Order phone** në admin → Settings (për WhatsApp pas porosisë)
- Cloud Function `publicApi` e deployuar

## Nis lokalisht

```bash
cd jon-sport-shop
npm install
cp .env.example .env
npm run dev
```

Hap: http://localhost:5179/napoletana-nostra  

Nuk nevojitet API key për klientët. Vite proxy-on `/api/public` te Firebase.

## Deploy (Firebase Hosting `shop`)

```bash
npm run build
# kopjo dist/ → Business Dashboard API/hosting-shop/
firebase deploy --only hosting:shop
```

URL: `https://jon-sport-shop.web.app/{slug}`

## API key (opsionale)

Vetëm për integrime të jashtme (web të tretë). **Jo** për klientët e zakonshëm.  
Admin → API Docs → `?key=...` në URL ruhet në session.
