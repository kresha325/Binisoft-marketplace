import { defineConfig, loadEnv } from 'vite';

/** Shop base `/shop/` or `/binisoft-ad/shop/` → site root `/` or `/binisoft-ad/`. */
function siteRootFromShopBase(base) {
  const normalized = (base.endsWith('/') ? base.slice(0, -1) : base) || '';
  if (normalized.endsWith('/shop')) {
    const root = normalized.slice(0, -'/shop'.length);
    return root ? `${root}/` : '/';
  }
  return base.endsWith('/') ? base : `${base}/`;
}

/** Root-absolute public files that must follow Vite `base` on Firebase + GitHub Pages. */
const PUBLIC_ROOT_ASSETS = [
  'favicon.ico',
  'favicon.svg',
  'binisoft-logo.png',
  'app-icon.png',
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = process.env.BASE_PATH || env.BASE_PATH || '/';
  const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
  const siteRoot = siteRootFromShopBase(baseWithSlash);
  const functionsTarget =
    env.VITE_FUNCTIONS_PROXY ||
    'https://us-central1-jon-sport.cloudfunctions.net';

  return {
    base: baseWithSlash,
    plugins: [
      {
        name: 'rebase-html-public-assets',
        transformIndexHtml(html) {
          let out = html;
          for (const file of PUBLIC_ROOT_ASSETS) {
            const re = new RegExp(`(href|src)="/${file.replace(/\./g, '\\.')}"`, 'g');
            out = out.replace(re, `$1="${baseWithSlash}${file}"`);
          }
          // Admin lives next to /shop/ on the same host (Firebase or /binisoft-ad/).
          out = out.replaceAll('href="/admin/', `href="${siteRoot}admin/`);
          return out;
        },
      },
    ],
    server: {
      port: Number(env.PORT) || 5179,
      open: true,
      proxy: {
        '/api/shop': {
          target: functionsTarget,
          changeOrigin: true,
          rewrite: (path) => `/publicApi${path}`,
        },
        '/api/public': {
          target: functionsTarget,
          changeOrigin: true,
          rewrite: (path) => `/publicApi${path}`,
        },
      },
    },
  };
});
