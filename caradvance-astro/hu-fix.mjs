// Build lépés (a ver-assets.mjs előtt): a magyar oldalak apró, szemmel látható hibáinak javítása (hu-fix.css).
// Tartalom-hash verzióval CSAK a magyar oldalakra kerül. Idempotens; hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve(process.cwd(), 'dist');
const SRC = path.resolve(process.cwd(), 'hu-fix.css');

try {
  if (!fs.existsSync(dist) || !fs.existsSync(SRC)) console.log('[hu-fix] nincs dist vagy forrás — kihagyva');
  else {
    const css = fs.readFileSync(SRC, 'utf8');
    fs.writeFileSync(path.join(dist, 'hu-fix.css'), css);
    const v = crypto.createHash('sha1').update(css).digest('hex').slice(0, 10);
    const tag = '<link rel="stylesheet" id="ca-dark-hu-fix" href="/hu-fix.css?v=' + v + '">';
    const SKIP = new Set(['ch', 'cs', 'cz', 'de', 'en', 'eu', 'fr', 'pl', 'sk', 'uk', 'zh', 'at', 'ro', 'it', 'es', 'i18n', 'l10n', 'admin', '_np']);
    let files = 0;
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (d === dist && SKIP.has(e.name)) continue; walk(p); continue; }
        if (!/\.html$/.test(e.name)) continue;
        if (d === dist && /^404-/.test(e.name)) continue;
        let h = fs.readFileSync(p, 'utf8');
        if (h.indexOf('</head>') < 0) continue;
        if (!/<html[^>]*lang="hu"/i.test(h)) continue;
        const h2 = h.indexOf('id="ca-dark-hu-fix"') > -1
          ? h.replace(/<link rel="stylesheet" id="ca-dark-hu-fix" href="[^"]*">/, tag)
          : h.replace('</head>', tag + '</head>');
        // Autóink-szerű oldalak (nem a főoldal): az „Eladó autók / Eladva” váltót a dark-mode.js ne színezze át (saját sötét stílusa van a hu-fix.css-ben)
        let h3 = h2;
        if (p !== path.join(dist, 'index.html')) h3 = h3.replace(/<div class="autok-tabs" role="tablist">/g, '<div class="autok-tabs" role="tablist" data-dm-skip="1">');
        // 24. Bizományos: a fejléc alcíme szó szerint megismétlődött közvetlenül alatta — a bevezető az új információval indul
        if (/\/bizomanyos\/index\.html$/.test(p.split(path.sep).join('/'))) h3 = h3.replace('<p class="biz-lead">Bizományban értékesített prémium autók — és minden eladással egy magyar jótékony szervezetet is támogatunk. A jutalékunk', '<p class="biz-lead">A jutalékunk');
        // oldal-azonosító a <html>-en, hogy a hu-fix.css egy-egy oldalra célzottan is tudjon javítani
        const rel = path.relative(dist, p).split(path.sep).join('/');
        const hp = rel === 'index.html' ? '/' : (rel.endsWith('/index.html') ? '/' + rel.slice(0, -10) : '/' + rel);
        if (!/<html[^>]*data-hupath=/.test(h3)) h3 = h3.replace(/<html\b/, '<html data-hupath="' + hp.replace(/"/g, '') + '"');
        if (h3 !== h) { fs.writeFileSync(p, h3); files++; }
      }
    })(dist);
    console.log('[hu-fix] apró javítások (csak magyar oldalak): ' + files + ' oldal');
  }
} catch (e) { console.log('[hu-fix] hiba:', e.message); }
