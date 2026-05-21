/**
 * GitHub Pages returns 404 for unknown paths (e.g. /www.test.com).
 * Prepend a redirect so domain-like or invalid segments go to marketplace home.
 */
import fs from 'node:fs';
import path from 'node:path';

const basePath = process.env.BASE_PATH || '/Binisoft-marketplace/';
const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
const distDir = path.resolve('dist');
const indexFile = path.join(distDir, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error('Missing dist/index.html — run vite build first.');
  process.exit(1);
}

const redirectScript = `<script>
(function () {
  var base = ${JSON.stringify(base)};
  var prefix = base.replace(/\\/$/, '');
  var path = window.location.pathname;
  if (prefix && path.indexOf(prefix) === 0) {
    path = path.slice(prefix.length) || '/';
  }
  var seg = path.split('/').filter(Boolean)[0] || '';
  if (!seg) return;
  var slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var reserved = { assets: 1, icons: 1, src: 1, api: 1, public: 1, marketplace: 1 };
  if (seg.length < 2 || seg.indexOf('.') >= 0 || reserved[seg] || !slugRe.test(seg)) {
    var qs = new URLSearchParams(window.location.search);
    qs.set('invalidSlug', seg);
    window.location.replace(base + '?' + qs.toString());
  }
})();
</script>
`;

const html = fs.readFileSync(indexFile, 'utf8');
fs.writeFileSync(path.join(distDir, '404.html'), redirectScript + html);
console.log('Wrote dist/404.html with invalid-path redirect');
