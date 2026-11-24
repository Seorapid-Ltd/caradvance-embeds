#!/usr/bin/env node
/**
 * skcz-seo1124.mjs — SEO 1. lépés (technikai alapok), caradvance.sk + caradvance.cz, 2026-11-24
 * Csak dist/sk/** és dist/cs/** (a /en/, /de/, /hu/ alváltozatokkal együtt). A HU oldalhoz nem nyúl.
 *
 *  T1  Törött / átirányított belső linkek: …/autoink/ (404 az /en/ /de/ /hu/ alatt, 301 a gyökérben)
 *      és a már nem létező autóoldalakra mutató linkek → a piac autólistája (/auta/ · /vozy/, nyelvi előtaggal)
 *  T2  Hibás „/sk/…” és „/cs/…” előtagú belső linkek (301) → helyes útvonal
 *  T3  Kalkulátor-oldalak: nincs H1 → az első <h2 class="lk-title"> H1 lesz (stílus változatlan)
 *  T4  Autó-adatlapok <title>: csonka („… na”), és az /en/ /de/ /hu/ változaton szlovák szöveg („Predané:”)
 *      → a nyelvnek megfelelő, egész szavas, max. 60 karakteres cím
 *  T5  Bérlési oldalak: a Google Fonts CSS @import-tal, render-blokkolóan töltődik (~0,8 s mobilon)
 *      → @import nélküli CSS-másolat + aszinkron font-link; a hero poszterkép előtöltése (fetchpriority=high)
 *  T7  „/…” gyökér-linkek, amelyeket a middleware a caradvance.hu-ra küldene (ott 301/404) → helyi megfelelő, ha van
 *  T8  Autó-adatlapok Car/Product JSON-LD: image (og:image), sku (slug), seller → a létező #dealer entitás
 *  T6  Főoldalak: WebSite JSON-LD (név, URL, nyelv, kiadó = az oldal AutoDealer @id-je)
 * Szabályonként logol. Idempotens. Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const MARKETS = { sk: { site: 'https://www.caradvance.sk', list: 'auta/' }, cs: { site: 'https://www.caradvance.cz', list: 'vozy/' } };
const SUBLANGS = ['en', 'de', 'hu'];
const FONT = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap';
const SALE = { sk: ['na predaj', 'Predané'], cs: ['na prodej', 'Prodáno'], en: ['for sale', 'Sold'], de: ['zu verkaufen', 'Verkauft'], hu: ['eladó', 'Eladva'] };
const DESC_SALE = /^(Na predaj|Na prodej|For sale:|Zu verkaufen:|Eladó:)\s*/;
const DESC_SOLD = /^(Predané:|Prodáno:|Sold:|Verkauft:|Eladva:)\s*/;
const count = {};
const hit = (k, n = 1) => { count[k] = (count[k] || 0) + n; };

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function cut(s, max) { // egész szavakra vágás
  if (s.length <= max) return s;
  let t = s.slice(0, max + 1); t = t.slice(0, t.lastIndexOf(' ')).replace(/[\s,;:·/–—-]+$/, '');
  return t || s.slice(0, max);
}

function run(mk) {
  const root = path.join(DIST, mk);
  if (!fs.existsSync(root)) { console.log(`[skcz-seo1124] ${mk}: nincs mappa — kihagyva`); return; }
  const files = walk(root);
  const exists = (urlPath) => { // /de/auto/x/ → dist/<mk>/de/auto/x/index.html
    const rel = urlPath.replace(/^\//, '').replace(/[?#].*$/, '');
    return fs.existsSync(path.join(root, rel, 'index.html')) || fs.existsSync(path.join(root, rel));
  };

  let SLUGS = {}; try { SLUGS = JSON.parse(fs.readFileSync(path.join(root, '_slugs.json'), 'utf8')); } catch {} // régi magyar cím → helyi cím

  // T5 előkészítés: az @import-os CSS-ek @import nélküli másolata (csak ezen a piacon használjuk)
  const astro = path.join(DIST, '_astro');
  const cssMap = {};
  if (fs.existsSync(astro)) for (const f of fs.readdirSync(astro)) {
    if (!f.endsWith('.css') || f.startsWith('skcz-')) continue;
    const css = fs.readFileSync(path.join(astro, f), 'utf8');
    if (!/@import\s*["']https:\/\/fonts\.googleapis\.com/.test(css)) continue;
    const nf = 'skcz-' + f;
    fs.writeFileSync(path.join(astro, nf), css.replace(/@import\s*["']https:\/\/fonts\.googleapis\.com[^"']*["']\s*;?/g, ''));
    cssMap['/_astro/' + f] = '/_astro/' + nf;
  }

  for (const file of files) {
    let h = fs.readFileSync(file, 'utf8');
    const before = h;
    const relDir = path.relative(root, path.dirname(file)).split(path.sep).join('/');
    const pagePath = '/' + (relDir ? relDir + '/' : '');
    const sub = SUBLANGS.find((l) => pagePath.startsWith('/' + l + '/'));
    const lang = sub || mk;
    const prefix = sub ? '/' + sub + '/' : '/';
    const listing = '/' + mk + prefix + MARKETS[mk].list; // dist-forma: a middleware a kiszolgáláskor /' + mk + '/ nélkül adja ki

    // T2 — /sk/… és /cs/… előtagú linkek a <script>-ben összerakott HTML-ben (pl. bérlési űrlap): ezeket a middleware
    //      nem írja át (csak a valódi <a href>-eket), ezért a böngészőben 301-es ugrás lenne → előtag nélkül
    h = h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (blk) => blk.replace(new RegExp(`href=(\\\\?)"/${mk}/`, 'g'), (m, bs) => { hit('T2 /' + mk + '/ előtagú link (szkriptben) javítva'); return `href=${bs}"/`; }));

    // T1 — autoink és nem létező autóoldal linkek
    const fixLinks = (part) => part.replace(/href="((?:\.\.\/|\.\/|\/)[^"#?]*)(?:[#?][^"]*)?"/g, (m, href) => {
      if (/['+(]/.test(href)) return m; // JS-sablonban összerakott link — nem nyúlunk hozzá
      let abs;
      try { abs = new URL(href, 'https://x' + pagePath).pathname; } catch { return m; }
      if (/\/autoink\/?$/.test(abs)) { hit('T1 autoink-link → autólista'); return `href="${listing}"`; }
      const am = /^\/((?:en|de|hu)\/)?auto\/([^/]+)\/$/.exec(abs);
      if (am && !exists(abs)) { hit('T1 megszűnt autóoldal-link → autólista'); return `href="/${mk}/${(am[1] || '') + MARKETS[mk].list}"`; }
      return m;
    });
    h = h.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/).map((part, i) => (i % 2 ? part : fixLinks(part))).join(''); // csak szkripten kívül

    // T7 — gyökér-relatív „/…” linkek: a middleware ezeket a caradvance.hu-ra küldi (ott 301 vagy 404).
    //      Ha az oldalnak van helyi (szlovák / cseh) megfelelője — azonos cím vagy a _slugs.json szerinti —, oda mutasson.
    const toLocal = (part) => part.replace(/(<a\b[^>]*\shref=")(\/[^"]*)"/g, (m, pre, href) => {
      if (href.startsWith('/' + mk + '/') || href.startsWith('//') || href.startsWith('/api/') || /['+(]/.test(href)) return m;
      const mm = /^([^?#]*)(.*)$/.exec(href); let p = mm[1]; const rest = mm[2];
      if (/\.[a-z0-9]{1,5}$/i.test(p)) return m;
      if (!p.endsWith('/')) p += '/';
      const lm = /^\/(en|de|hu)(\/.*)$/.exec(p); const lp = lm ? '/' + lm[1] : (sub ? '/' + sub : ''); const bare = lm ? lm[2] : p;
      const cands = [];
      if (lm) cands.push(p); else { if (sub) cands.push('/' + sub + p); cands.push(p); }
      const mapped = SLUGS[bare]; if (mapped) { cands.push(lp + mapped); cands.push(mapped); }
      for (const c of cands) if (exists(c)) { hit('T7 .hu-ra kifutó link → helyi oldal'); return `${pre}/${mk}${c}${rest}"`; }
      const bm = /^\/berelheto-auto\/([a-z]+)(-benz)?-/.exec(bare); // ezen a piacon nem kínált bérelhető modell → a márkára szűrt bérelhető lista
      if (bm) { const marka = bm[1] === 'vw' ? 'volkswagen' : bm[1]; hit('T7 .hu bérlési modell-link → márkára szűrt helyi lista'); return `${pre}/${mk}${lp}/${MARKETS[mk].list}?marka=${marka}#berelheto"`; }
      return m;
    });
    h = h.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/).map((part, i) => (i % 2 ? part : toLocal(part))).join('');

    // T3 — kalkulátor H1
    if (!/<h1[\s>]/.test(h) && /<h2 class="lk-title"[^>]*>/.test(h)) {
      h = h.replace(/<h2 class="lk-title"([^>]*)>([\s\S]*?)<\/h2>/, (m, a, t) => { hit('T3 kalkulátor H1'); return `<h1 class="lk-title"${a}>${t}</h1>`; });
    }

    // T4 — autó-adatlap címe
    if (/\/auto\/[^/]+\/$/.test(pagePath)) {
      const dm = /<meta\s+name="description"\s+content="([^"]*)"/.exec(h);
      if (dm) {
        const d = unesc(dm[1]);
        const sold = DESC_SOLD.test(d), sale = DESC_SALE.test(d);
        if (sold || sale) {
          const name = d.replace(sold ? DESC_SOLD : DESC_SALE, '').split(/, (?:19|20)\d\d,/)[0].replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
          const [forSale, soldW] = SALE[lang] || SALE[mk];
          let title;
          if (sold) title = `${soldW}: ${cut(name, 60 - soldW.length - 2)}`;
          else if (lang === 'hu') title = `${forSale[0].toUpperCase() + forSale.slice(1)} ${cut(name, 60 - forSale.length - 1)}`;
          else title = `${cut(name, 60 - forSale.length - 1)} ${forSale}`;
          const tm = /<title>([^<]*)<\/title>/.exec(h);
          const t0 = tm ? unesc(tm[1]) : '';
          const norm = (x) => x.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
          const core = norm(t0.replace(/^(Predané|Prodáno|Sold|Verkauft|Eladva|Eladó):\s*/, '').replace(/\s*[·|].*$/, '').replace(/\s+(na predaj|na prodej|for sale|zu verkaufen)$/, ''));
          const full = norm(name);
          const dangling = /\s(na|k|za|zu|for|v|z)$/.test(t0);
          const foreign = lang !== mk && /(Predané|na predaj|Na predaj|Prodáno|na prodej|Na prodej)/.test(t0);
          const midword = full.startsWith(core) && core.length < full.length && /[\p{L}\p{N}]$/u.test(core) && /[\p{L}\p{N}]/u.test(full[core.length]);
          if (foreign && !dangling && !midword) { // csak a piac nyelvű szót cseréljük, a cím többi része (év, km) marad
            const MK_SOLD = mk === 'sk' ? 'Predané' : 'Prodáno', MK_SALE = mk === 'sk' ? /\s(na predaj)(?=\s|$)/ : /\s(na prodej)(?=\s|$)/;
            let t1 = t0.replace(new RegExp('^' + MK_SOLD + ':'), soldW + ':');
            if (MK_SALE.test(t1)) t1 = lang === 'hu' ? 'Eladó ' + t1.replace(MK_SALE, '') : t1.replace(MK_SALE, ' ' + forSale);
            title = t1;
          }
          if (tm && name && (dangling || foreign || midword) && unesc(tm[1]) !== title) {
            h = h.replace(tm[0], `<title>${esc(title)}</title>`);
            h = h.replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`);
            h = h.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`);
            hit('T4 autó-adatlap címe javítva');
          }
        }
      }
    }

    // T5 — render-blokkoló @import kiváltása + hero poszter előtöltése
    for (const [from, to] of Object.entries(cssMap)) {
      if (h.includes(`href="${from}"`)) {
        h = h.split(`href="${from}"`).join(`href="${to}"`);
        if (!h.includes('data-ca-font')) {
          h = h.replace('</head>', `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${FONT}" media="print" onload="this.media='all'" data-ca-font><noscript><link rel="stylesheet" href="${FONT}"></noscript></head>`);
        }
        hit('T5 render-blokkoló font-@import kiváltva');
      }
    }
    if (!/<link rel="preload" as="image"/.test(h)) {
      const pm = /<video[^>]*class="[^"]*ca-lv[^"]*"[^>]*poster="([^"]+)"|<video[^>]*poster="([^"]+)"[^>]*class="[^"]*ca-lv/.exec(h);
      const poster = pm && (pm[1] || pm[2]);
      if (poster) {
        h = h.replace('</head>', `<link rel="preload" as="image" href="${poster}" fetchpriority="high"></head>`);
        hit('T5 hero poszter előtöltés');
      }
    }

    // T8 — autó-adatlap Car/Product schema: hiányzó image és sku; a seller nem létező „#organization” @id-re mutatott
    if (/\/auto\/[^/]+\/$/.test(pagePath)) {
      const og = /<meta\s+property="og:image"\s+content="([^"]+)"/.exec(h);
      const slug = pagePath.split('/').filter(Boolean).pop();
      h = h.replace(/(<script[^>]*application\/ld\+json[^>]*>)([\s\S]*?)(<\/script>)/g, (m, a, body, c) => {
        let j; try { j = JSON.parse(body); } catch { return m; }
        const t = [].concat(j && j['@type'] || []);
        if (!t.includes('Car') && !t.includes('Product')) return m;
        let ch = false;
        if (!j.image && og) { j.image = [unesc(og[1])]; ch = true; }
        if (!j.sku && slug) { j.sku = slug; ch = true; }
        const sel = j.offers && j.offers.seller;
        if (sel && /#organization$/.test(sel['@id'] || '')) { j.offers.seller = { '@type': 'AutoDealer', '@id': MARKETS[mk].site + '/#dealer', name: 'CarAdvance' }; ch = true; }
        if (!ch) return m;
        hit('T8 autó schema kiegészítve (image/sku/seller)');
        return a + JSON.stringify(j).replace(/</g, '\\u003c') + c;
      });
    }

    // T6 — WebSite schema a főoldalakon
    if ((pagePath === '/' || SUBLANGS.some((l) => pagePath === '/' + l + '/')) && !/"@type":"WebSite"/.test(h)) {
      const site = MARKETS[mk].site;
      const ws = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': site + pagePath + '#website', name: 'CarAdvance', url: site + pagePath, inLanguage: lang === 'cs' ? 'cs-CZ' : lang === 'sk' ? 'sk-SK' : lang, publisher: { '@id': site + '/#dealer' } };
      h = h.replace('</head>', `<script type="application/ld+json">${JSON.stringify(ws)}</script></head>`);
      hit('T6 WebSite schema');
    }

    if (h !== before) fs.writeFileSync(file, h);
  }
}

try {
  for (const mk of Object.keys(MARKETS)) run(mk);
  for (const [k, v] of Object.entries(count).sort()) console.log(`[skcz-seo1124] ${k}: ${v}`);
} catch (e) { console.error('[skcz-seo1124] HIBA (a build folytatódik):', e && e.stack || e); }
