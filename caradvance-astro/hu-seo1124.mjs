#!/usr/bin/env node
/**
 * hu-seo1124 — caradvance.hu technikai + on-page javítások (2026-11-24, SEO prompt-csomag 1–3. lépés)
 *
 *  1. Astro átirányító csonkok („Redirecting to: …”, 200-as meta refresh) → valódi 301 a dist/_redirects-ben
 *  2. Belső linkek, amelyek csonkra vagy 301-es forrásra mutatnak → közvetlenül a végső URL-re
 *  3. Title > 60 karakter (magyar gyökér oldalak): „ | CarAdvance”, „, Németországból” levágása (a kulcsszó marad)
 *  4. Rövid / hiányzó title és meta pótlása, 160 fölötti meta mondathatáron rövidítve
 * Csak a magyar gyökér oldalakhoz nyúl (a nyelvi tükrök és más országok mappáit kihagyja). Hibára exit 0.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SKIP = /^(_np|en|de|fr|uk|zh|sk|cs|pl|ch|eu|admin|belso|icons|_astro)(\/|$)/;
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = (t) => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const norm = (p) => (p.endsWith('/') ? p : p + '/');

const META = {
  '/szerzodes/': 'A CarAdvance bérleti szerződés online felülete: a tartós bérlet szerződésének adatai kitölthetők és előkészíthetők. Kérdés esetén kollégáink segítenek.',
};
const TITLE = {
  '/kapcsolat/': 'Kapcsolat – CarAdvance autóimport és tartós bérlet',
};

function walk(d, rel = '', out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!SKIP.test(r)) walk(path.join(d, e.name), r, out); }
    else if (e.name === 'index.html') out.push(['/' + (rel ? rel + '/' : ''), path.join(d, e.name)]);
  }
  return out;
}
function fitTitle(t) {
  if (t.length > 60) t = t.replace(/\s*[|—–]\s*CarAdvance\s*$/, '');
  if (t.length > 60) t = t.replace(/,\s*Németországból\s*$/, '');
  if (t.length > 60) { const m = /^(.{30,60}?)\s(?:—|–)\s/.exec(t); if (m) t = m[1]; }
  return t;
}
function fitMeta(d) {
  if (d.length <= 160) return d;
  const c = d.slice(0, 161); const i = Math.max(c.lastIndexOf('. '), c.lastIndexOf('! '), c.lastIndexOf('? '));
  if (i >= 110) return d.slice(0, i + 1);
  return c.slice(0, c.lastIndexOf(' ', 157)).replace(/[\s,;:–—-]+$/, '') + '…';
}

try {
  const pages = walk(DIST);
  const st = { stub: 0, red: 0, link: 0, t: 0, d: 0 };
  /* 1. csonkok */
  const MAP = new Map();
  for (const [rel, f] of pages) {
    const h = fs.readFileSync(f, 'utf8');
    const m = /<title>Redirecting to: (?:https?:\/\/(?:www\.)?caradvance\.hu)?(\/[^<\s]*)<\/title>/.exec(h);
    if (m) MAP.set(rel, norm(m[1]));
  }
  const RF = path.join(DIST, '_redirects');
  let red = fs.existsSync(RF) ? fs.readFileSync(RF, 'utf8') : '';
  const have = new Set(red.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter(Boolean));
  for (const l of red.split('\n')) { const [a, b, c] = l.trim().split(/\s+/); if (a && b && /^30[18]$/.test(c || '301') && a.startsWith('/') && b.startsWith('/') && !a.includes('*') && !a.includes(':')) MAP.set(norm(a), norm(b)); }
  const add = [];
  for (const [from, to] of MAP) {
    if (have.has(from) || have.has(from.replace(/\/$/, ''))) continue;
    if (!pages.some(([r]) => r === from)) continue; // csak a csonkok kellenek ide
    add.push(`${from} ${to} 301`, `${from.replace(/\/$/, '')} ${to} 301`); st.stub++;
  }
  if (add.length) { red = add.join('\n') + '\n' + red; fs.writeFileSync(RF, red); }
  /* a csonk fájl törlése: így a (meglévő vagy most felvett) 301-es szabály érvényesül, nem a 200-as meta refresh */
  const PAGESET = new Set(pages.map(([r]) => r));
  for (const [rel, f] of pages) {
    if (!MAP.has(rel)) continue;
    const h = fs.readFileSync(f, 'utf8');
    if (/^<!doctype html><title>Redirecting to:/i.test(h) && h.length < 2000) { fs.rmSync(f); PAGESET.delete(rel); st.red++; }
  }
  /* lánc feloldása; nem létező bérlés-modelloldal → a modell rokon oldala vagy a márka bérelhető autói */
  const ALT = { '/berelheto-auto/mercedes-benz-c-osztaly-berles/': '/berelheto-auto/mercedes-benz-c-osztaly-limuzin-berles/' };
  const fin = (p) => {
    let x = p, n = 0; while (MAP.has(x) && n++ < 5) x = MAP.get(x);
    if (x.startsWith('/berelheto-auto/') && !PAGESET.has(x)) {
      if (ALT[x] && PAGESET.has(ALT[x])) return ALT[x];
      const b = (/^\/berelheto-auto\/([a-z]+)/.exec(x) || [])[1];
      if (b) return `/autoink/?marka=${b}#berelheto`;
    }
    return x;
  };

  for (const [rel, f] of pages) {
    if (MAP.has(rel) || !fs.existsSync(f)) continue;
    let h = fs.readFileSync(f, 'utf8');
    const o = h;
    /* 2. belső linkek */
    h = h.replace(/href="(\/[^"#?]*)([#?][^"]*)?"/g, (m, p, q) => { const k = norm(p); if (!MAP.has(k) && !(k.startsWith('/berelheto-auto/') && k.split('/').length === 4 && !PAGESET.has(k))) return m; st.link++; return `href="${fin(k)}${q || ''}"`; });
    /* 3–4. title / meta */
    h = h.replace(/<title>([^<]*)<\/title>/, (m, t) => { const a = unesc(t).trim(); const n = TITLE[rel] || fitTitle(a); if (n === a) return m; st.t++; return `<title>${esc(n)}</title>`; });
    const tt = (/<title>([^<]*)<\/title>/.exec(h) || [])[1];
    if (tt) h = h.replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"/g, (m, a) => a + tt + '"');
    if (/<meta name="description"/.test(h)) h = h.replace(/(<meta name="description" content=")([^"]*)"/, (m, a, d) => { const x = unesc(d); const n = fitMeta(x); if (n === x) return m; st.d++; return a + esc(n) + '"'; });
    else if (META[rel]) { h = h.replace(/<\/title>/, `</title>\n<meta name="description" content="${esc(META[rel])}">`); st.d++; }
    /* kulcsszótérkép: a konfigurátor főoldal H1-e (bmw konfigurátor 900, mercedes 3 400, audi 800, mini 150 keresés/hó) */
    if (rel === '/egyedi-auto-rendeles/' && /<h1 id="eglTitle">/.test(h)) {
      const H = 'BMW, Mercedes, Audi és MINI konfigurátor – egyedi autó rendelés';
      h = h.replace(/<h1 id="eglTitle">[^<]*<\/h1>/, `<h1 id="eglTitle">${H}</h1>`).replace(/('':\{crumb:'[^']*',title:')[^']*'/, `$1${H}'`);
    }
    if (h !== o) fs.writeFileSync(f, h);
  }
  /* nyelvi tükrök (en/de/fr/uk/zh/_np): csak a belső linkek */
  const ML = /^\/(en|de|fr|uk|zh|_np)(?=\/)/;
  for (const L of ['en', 'de', 'fr', 'uk', 'zh', '_np']) {
    const d = path.join(DIST, L); if (!fs.existsSync(d)) continue;
    const stack = [d];
    while (stack.length) {
      const cur = stack.pop();
      for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
        const fp = path.join(cur, e.name);
        if (e.isDirectory()) { stack.push(fp); continue; }
        if (e.name !== 'index.html') continue;
        const h = fs.readFileSync(fp, 'utf8');
        if (/^<!doctype html><title>Redirecting to:/i.test(h)) continue;
        const o = h.replace(/href="(\/[^"#?]*)([#?][^"]*)?"/g, (m, p0, q) => {
          const pre = (ML.exec(p0) || [''])[0]; const k = norm(p0.slice(pre.length));
          if (!MAP.has(k) && !(k.startsWith('/berelheto-auto/') && k.split('/').length === 4 && !PAGESET.has(k))) return m;
          const t = fin(k); st.link++;
          return `href="${t.startsWith('/') ? pre + t : t}${t.includes('#') ? '' : (q || '')}"`;
        });
        if (o !== h) fs.writeFileSync(fp, o);
      }
    }
  }
  console.log(`[hu-seo1124] ${st.red} átirányító csonk törölve (301 érvényesül), ${st.stub} új 301, ${st.link} belső link a végső URL-re, title ${st.t}, meta ${st.d}`);
} catch (e) { console.error('[hu-seo1124] hiba:', e.message); }
process.exit(0);
