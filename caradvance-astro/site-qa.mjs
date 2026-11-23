// site-qa.mjs — élesítés előtti minőségbiztosítási javítások (a build legvégén fut, minden HTML-re)
// Technikai / SEO (minden nyelv):
//  · <meta charset> a <head> legelejére (az első 1024 bájtba — Lighthouse „charset”)
//  · az oldal-specifikus dizájnosztályok (ca-cd, ca-kap, …) már a HTML-ben a <html> elemen → nincs elcsúszás (CLS) betöltéskor
//  · Astro átirányító lapok (meta refresh) helyett valódi 301 a _redirects-ben, a végleges www + perjeles címre; canonical a célra
//  · sitemap: a belső, nem indexelendő oldalak (/szerzodes/, /icons/) kikerülnek, és noindex-et kapnak
//  · og:image: AVIF helyett WebP/JPG (a Facebook/LinkedIn az AVIF-et nem mutatja)
//  · eladó autók galériája: a bélyegképek lusta betöltéssel (mobil LCP)
//  · lábléc címsorai h4 helyett h2 (helyes címsor-sorrend), változatlan kinézettel
// Magyar oldalak:
//  · hiányzó BreadcrumbList strukturált adat pótlása
//  · 60 karakternél hosszabb <title>: a „ | CarAdvance” végződés elhagyása
//  · felső menüsáv: lefelé görgetve elrejtőzik, felfelé visszajön (mint a főoldalon) — minden oldalon
//  · kontraszt (WCAG AA) a halvány szürke/piros apró szövegeken; Görgess mobilon egységesen rejtve; kerek avatarok
// Az Előnyök oldalak (/elonyok/, /berles-elonyei/, /vasarlas-elonyei/) dizájnjához nem nyúl. Idempotens.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let sharp = null; try { sharp = require('sharp'); } catch (e) {}
const ogConvert = [];

const DIST = process.argv[2] || 'dist';
const SITE = 'https://www.caradvance.hu';
const MARK = '<!--ca-qa-->';
const NO_DESIGN = new Set(['/elonyok/', '/berles-elonyei/', '/vasarlas-elonyei/']);

const ROOTCLS = { 'ca-au-css': 'ca-au', 'ca-ai-css': 'ca-ai', 'ca-bf-css': 'ca-bf', 'ca-bfo-css': 'ca-bfo', 'ca-bft-css': 'ca-bft', 'ca-lgl-css': 'ca-lgl', 'ca-biz-css': 'ca-biz', 'ca-blog-css': 'ca-blog', 'ca-calc-css': 'ca-calc', 'ca-cd-css': 'ca-cd', 'ca-ef-css': 'ca-ef', 'ca-ev-css': 'ca-ev', 'ca-fin-css': 'ca-fin', 'ca-imp-css': 'ca-imp', 'ca-jot-css': 'ca-jot', 'ca-kap-css': 'ca-kap', 'ca-kf-css': 'ca-kf', 'ca-md-css': 'ca-md', 'ca-ol-css': 'ca-ol', 'ca-ord-css': 'ca-ord', 'ca-rol-css': 'ca-rol', 'ca-sell-css': 'ca-sell' };

const BC_HU = {
  '/aszf/': [['ÁSZF']], '/impresszum/': [['Impresszum']], '/adatkezeles/': [['Adatkezelési tájékoztató']],
  '/media/': [['Média']], '/eladom/': [['Autóeladás']], '/bizomanyos/': [['Bizományos autóink']], '/jotekonysag/': [['Jótékonyság']],
  '/autot-keresek/': [['Autót keresek']], '/egyedi-auto-rendeles/': [['Egyedi autó rendelés']],
  '/ertekesitesi-folyamat/': [['Autóeladás', '/eladom/'], ['Értékesítési folyamat']], '/kapcsolat/': [['Kapcsolat']],
};

// ---- közös CSS/JS -------------------------------------------------------------
const NAV_CSS = '<style id="ca-qa-nav">html .ca-navwrap{transition:transform .38s cubic-bezier(.2,.8,.2,1)!important;will-change:transform}html .ca-navwrap.ca-nav-hide{transform:translateY(calc(-100% - 24px))!important}@media (prefers-reduced-motion:reduce){html .ca-navwrap{transition:none!important}}</style>';
const NAV_JS = '<script id="ca-qa-navjs">(function(){var y0=scrollY,w=null,tk=0;function run(){tk=0;w=w||document.querySelector(".ca-navwrap");if(!w)return;var y=Math.max(0,scrollY),d=y-y0;if(y<=140){w.classList.remove("ca-nav-hide");y0=y;return}if(Math.abs(d)<8)return;var mp=w.querySelector(".mobilepanel"),open=w.classList.contains("open")||(mp&&mp.getBoundingClientRect().height>40&&getComputedStyle(mp).visibility!=="hidden"&&getComputedStyle(mp).display!=="none"),dd=w.querySelector(".open,[aria-expanded=\\"true\\"]");if(d>0&&!open&&!dd&&!w.matches(":hover")&&!w.contains(document.activeElement))w.classList.add("ca-nav-hide");else if(d<0)w.classList.remove("ca-nav-hide");y0=y}addEventListener("scroll",function(){if(!tk)tk=requestAnimationFrame(run)},{passive:true});document.addEventListener("focusin",function(e){if(w&&w.contains(e.target))w.classList.remove("ca-nav-hide")})})();</script>';

const FOOT_CSS = '<style id="ca-qa-foot">.cafoot h2.cafoot-h{color:#fff;font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin:4px 0 14px;font-weight:800;line-height:1.3}</style>';

const MUTED = '#6E6E73';
const L = 'html:not(.ca-dark):not(#ca-x) body ';
// újratöltéskor (görgetett helyzetben) az oldal csak akkor jelenik meg, amikor már a végleges helyén van
const RST = '<style id="ca-rst-css">html.ca-rst body{opacity:0!important}html.ca-rsd body{animation:caRsd .28s ease-out both}@keyframes caRsd{from{opacity:0}to{opacity:1}}</style>'
  + '<script id="ca-rst">(function(){try{var K="ca-sy:"+location.pathname;addEventListener("pagehide",function(){try{sessionStorage.setItem(K,String(Math.round(scrollY)))}catch(e){}});'
  + 'var n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(!n||n.type!=="reload"||location.hash)return;var y=+(sessionStorage.getItem(K)||0);if(!(y>150))return;'
  + 'if("scrollRestoration" in history)history.scrollRestoration="manual";var d=document.documentElement;d.classList.add("ca-rst");'
  + 'function done(){if(done.x)return;done.x=1;scrollTo(0,y);requestAnimationFrame(function(){d.classList.add("ca-rsd");d.classList.remove("ca-rst");setTimeout(function(){d.classList.remove("ca-rsd")},400)})}'
  + 'addEventListener("load",function(){setTimeout(function(){requestAnimationFrame(done)},450)});setTimeout(done,3000)}catch(e){}})();</script>';
const HU_CSS = '<style id="ca-qa-hu">'
  // újratöltéskor ne ugorjon a fejléc: a végső (menüsáv alá húzott) helyzet már CSS-ből, nem futásidőben
  + 'html.ca-site body :is(section,div,header)[data-ca-hb].ca-hero:not(.ca-ed):not(.kaphero):not(#ca-x){margin-top:calc(-1 * var(--navh,80px))!important}'
  // kontraszt: apró, halvány szövegek világos módban
  + L + ':is(.stg-cnt,.ca-pm,.ca-pe,.sub-dep,.sec-intro,.crumb,.crumb a,.cd-note,.cd-dep-live,.cd-specnote,.bp-crumb a,.bp-crumb span,.bp-cur,.bp-meta,.kap-sec-sub,.tb-crumb a,.tb-crumb span,.ol-note){color:' + MUTED + '!important;opacity:1!important}'
  + L + ':is(.eyebrow,.cav-eb){color:#C40018!important;-webkit-text-fill-color:#C40018!important;opacity:1!important}'
  + L + '.cd-note a{color:#C40018!important}'
  // kerek avatarok (a főoldali véleményeknél nem lehet ovális)
  + 'html body .cah .rev-av{width:42px!important;height:42px!important;min-height:42px!important;max-height:42px!important;aspect-ratio:1/1;flex:0 0 42px!important}'
  // Görgess: mobilon egységesen rejtve (mint a legtöbb oldalon)
  + '@media(max-width:640px){html body :is(.scrolldown,.kaphero-scroll,.cd-scroll,.hero-scroll){display:none!important}}'
  // CTA-kártyák: világos módban világos (piros keret), sötét módban marad a sötét
  + (function () {
    const C = ':is(.close-cta,.ca-bcta,.jot-cta,.tb-cta,.ic-cta,.pf-cta,.fl-cta,.ca-end,.ca-osav,.el-cta,section.block#kapcsolat>.wrap.center)';
    return L + C + '{background:radial-gradient(70% 90% at 100% 0%,rgba(226,0,26,.08),transparent 60%),linear-gradient(125deg,rgba(255,255,255,.85),rgba(255,255,255,.55)),rgba(255,255,255,.62)!important;background-color:rgba(255,255,255,.62)!important;color:#121317!important;border:1.5px solid rgba(226,0,26,.32)!important;box-shadow:inset 2px 2px 1px rgba(255,255,255,.95),0 0 0 4px rgba(226,0,26,.05),0 30px 70px rgba(226,0,26,.08)!important}'
      + L + C + '::before,' + L + C + '::after{opacity:0!important}'
      + L + C + ' :is(h2,h3,h4,b,strong,.sec-title,.ca-num,.osav-n){color:#121317!important;-webkit-text-fill-color:#121317!important}'
      + L + C + ' :is(p,li,small,.sec-sub,.ca-k){color:#4A4A50!important;-webkit-text-fill-color:#4A4A50!important}'
      + L + C + ' .accent{color:#E2001A!important;-webkit-text-fill-color:#E2001A!important}'
      + L + C + ' :is(p,li) a:not([class*=btn]){color:#C40018!important;-webkit-text-fill-color:#C40018!important}'
      + L + ':is(.tb-cta,.fl-cta,.el-cta):not(#ca-y):not(#ca-z):not(#ca-w) a.btn-white:first-of-type:not(#ca-v){background:#E2001A!important;border-color:#E2001A!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:0 12px 26px rgba(226,0,26,.28)!important}'
      + L + '.ca-bcta:not(#ca-y) a.a2{color:#121317!important;-webkit-text-fill-color:#121317!important;border-color:rgba(18,19,23,.16)!important;background:#fff!important}'
      + L + '.ca-end:not(#ca-y) .lg-btn{color:#fff!important;-webkit-text-fill-color:#fff!important}'
      + L + '.ca-osav:not(#ca-y) :is(.rw span,.sv span){color:#4A4A50!important;-webkit-text-fill-color:#4A4A50!important}'
      + L + '.ca-osav:not(#ca-y) .sv b{color:#0E9F6E!important;-webkit-text-fill-color:#0E9F6E!important}'
      + L + '.ca-osav:not(#ca-y) .r2{background:rgba(18,19,23,.025)!important;border-color:rgba(18,19,23,.08)!important}'
      + L + '.ca-osav:not(#ca-y) .sv{border-top-color:rgba(18,19,23,.1)!important}'
      + L + '.ca-osav:not(#ca-y) .bar{background:rgba(18,19,23,.08)!important}' + L + '.ca-osav:not(#ca-y) .bar:not(.de) i{background:rgba(18,19,23,.28)!important}'
      + L + '.ca-osav:not(#ca-y) .bt a.w{background:#fff!important;color:#121317!important;-webkit-text-fill-color:#121317!important;border:1px solid rgba(18,19,23,.14)!important}'
      + L + C + ' :is(.btn-primary,.btn-red,.btn.red,.cd-btn,.ca-btnr,a.btn:not(.btn-white):not(.btn-ghost):not(.btn-o)){background:#E2001A!important;border-color:#E2001A!important;color:#fff!important;-webkit-text-fill-color:#fff!important}'
      + L + C + ' :is(.btn-white,.btn-ghost,.btn-o){background:#fff!important;color:#121317!important;-webkit-text-fill-color:#121317!important;border:1px solid rgba(18,19,23,.14)!important;box-shadow:0 6px 16px rgba(18,19,23,.08)!important}';
  })()
  + '</style>';

// ---- segédek -----------------------------------------------------------------
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p); } return out; };
const urlPath = (f) => '/' + path.relative(DIST, f).split(path.sep).join('/').replace(/index\.html$/, '');
const txt = (s) => (s || '').replace(/<br[^>]*>/g, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const jsonStr = (s) => JSON.stringify(s);
const LANGS = /^\/(en|de|fr|uk|zh|pl|cs|sk|ro|it|es|hr|sl|sr|ru|nl)\//;

function breadcrumb(p, h) {
  let trail = BC_HU[p];
  const h1 = txt((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]).replace(/\s+[—–-]\s*$/, '');
  const head = h1.split(/\s+[—–]\s+/)[0].trim();
  if (!trail) {
    let m;
    if ((m = p.match(/^\/berelheto-auto\/[^/]+\/$/)) && head) trail = [['Bérelhető autóink', '/autoink/'], [head.replace(/\s+bérlés.*$/i, '') + ' bérlés']];
    else if ((m = p.match(/^\/egyedi-auto-rendeles\/[^/]+\/$/)) && head) trail = [['Egyedi autó rendelés', '/egyedi-auto-rendeles/'], [head]];
    else if ((m = p.match(/^\/auto\/[^/]+\/$/)) && head) trail = [['Autóink', '/autoink/'], [head]];
    else if ((m = p.match(/^\/blog\/[^/]+\/$/)) && head) trail = [['Blog', '/blog/'], [head]];
  }
  if (!trail) return null;
  const items = [{ n: 'Főoldal', u: '/' }].concat(trail.map(([n, u]) => ({ n, u: u || p })));
  return '<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' + items.map((it, i) => '{"@type":"ListItem","position":' + (i + 1) + ',"name":' + jsonStr(it.n) + ',"item":' + jsonStr(SITE + it.u) + '}').join(',') + ']}</script>';
}

// ---- fő futás -----------------------------------------------------------------
const files = walk(DIST);
const redirects = []; const noindexPaths = new Set();
let n = { charset: 0, root: 0, stub: 0, og: 0, thumbs: 0, foot: 0, bc: 0, title: 0, nav: 0, hu: 0, noindex: 0 };

for (const f of files) {
  let h = fs.readFileSync(f, 'utf8');
  const p = urlPath(f);
  // Astro átirányító lap → 301
  const rf = h.length < 3000 && h.match(/<meta http-equiv="refresh" content="0;url=([^"]+)"/i);
  if (rf) {
    let t = rf[1].replace(/^https?:\/\/(www\.)?caradvance\.hu/, '');
    if (!t.startsWith('/')) t = '/' + t;
    if (!/[?#]/.test(t) && !/\.[a-z0-9]+$/i.test(t) && !t.endsWith('/')) t += '/';
    if (t !== p) {
      redirects.push(p + ' ' + t + ' 301', p.replace(/\/$/, '') + ' ' + t + ' 301');
      const o = h.replace(/(<link rel="canonical" href=")[^"]*"/, '$1' + SITE + t + '"');
      if (o !== h) { fs.writeFileSync(f, o); }
      n.stub++;
    }
    continue;
  }
  // 0) og:image AVIF → WebP/JPG
  h = h.replace(/(<meta[^>]+(?:property|name)="(?:og:image|twitter:image)"[^>]*content=")([^"]+)\.avif"/g, (m, a, base) => {
    const rel = base.replace(SITE, '');
    for (const ext of ['webp', 'jpg', 'jpeg', 'png']) if (fs.existsSync(path.join(DIST, rel + '.' + ext))) { n.og++; return a + base + '.' + ext + '"'; }
    if (sharp && fs.existsSync(path.join(DIST, rel + '.avif'))) { ogConvert.push(rel); n.og++; return a + base + '.og.jpg"'; }
    return m;
  });
  // nem indexelendő belső oldal <head> nélkül (pl. /icons/)
  if (/^\/(?:[a-z]{2}\/)?(szerzodes|icons)\//.test(p) && h.indexOf('<head') < 0 && !/<meta[^>]+name="robots"/i.test(h)) { h = h.replace(/<meta charset="[^"]*">/i, (m) => m + '<meta name="robots" content="noindex,follow">'); n.noindex++; }
  // blog: a „Röviden” doboz címe a H1 után H2 szintű (helyes címsor-sorrend, változatlan kinézet)
  h = h.replace(/(<div class="bp-tldr"[^>]*>\s*<h3)(?![^>]*aria-level)/g, '$1 role="heading" aria-level="2"');
  if (h.indexOf(MARK) > -1 || h.indexOf('<head') < 0) { if (h !== fs.readFileSync(f, 'utf8')) fs.writeFileSync(f, h); continue; }
  const isHu = /<html[^>]*\slang="hu"/.test(h);
  // 1) charset legelőre
  const cm = h.match(/<meta charset="[^"]*"\s*\/?>/i);
  if (cm && h.indexOf(cm[0]) > 1024) { h = h.replace(cm[0], ''); h = h.replace(/<head([^>]*)>/i, (m) => m + '<meta charset="utf-8">'); n.charset++; }
  // 1b) a fejléc (hero) „ca-hero” osztálya már a HTML-ben (a hu-site.mjs futásidőben adná hozzá → elcsúszás)
  if (h.indexOf('id="ca-site-css"') > -1 && h.indexOf('data-ca-hb="1"') < 0) {
    const bi = h.indexOf('<body'); let best = null;
    for (const re of [/<section class="hero(?=[" ])/, /<(?:section|div|header) class="cd-hero(?=[" ])/, /<(?:section|div) class="egl-land-hero(?=[" ])/, /<(?:section|div) class="egl-mhero(?=[" ])/, /<(?:section|div) class="kaphero(?=[" ])/, /<section class="bizhero(?=[" ])/, /<header class="bp-hero(?=[" ])/, /<(?:section|header|div) class="lg-hero(?=[" ])/]) {
      re.lastIndex = 0; const m = re.exec(h.slice(bi)); if (m && (!best || m.index < best.index)) best = { index: m.index, s: m[0] };
    }
    if (best) { const at = bi + best.index; const end = h.indexOf('"', at + best.s.length); if (end > at) { h = h.slice(0, end) + ' ca-hero" data-ca-hb="1' + h.slice(end); n.hero = (n.hero || 0) + 1; } }
  }
  // 2) gyökérosztályok a <html> elemen
  const add = Object.keys(ROOTCLS).filter((id) => h.indexOf('id="' + id + '"') > -1).map((id) => ROOTCLS[id]);
  if (add.length) {
    h = h.replace(/<html([^>]*)>/i, (m, a) => {
      if (/\sclass="/.test(a)) return '<html' + a.replace(/\sclass="([^"]*)"/, (mm, c) => ' class="' + (c + ' ' + add.filter((x) => (' ' + c + ' ').indexOf(' ' + x + ' ') < 0).join(' ')).trim() + '"') + '>';
      return '<html' + a + ' class="' + add.join(' ') + '">';
    });
    n.root++;
  }
  // 4) eladó autók: bélyegképek lusta betöltéssel (az első 6 kivételével)
  if (h.indexOf('<div class="thumbs" id="thumbs">') > -1) {
    h = h.replace(/(<div class="thumbs" id="thumbs">)([\s\S]*?)(<\/div>)/, (m, a, body, c) => { let i = 0; return a + body.replace(/<img (?![^>]*loading=)/g, (x) => (i++ < 6 ? x : '<img loading="lazy" decoding="async" ')) + c; });
    n.thumbs++;
  }
  // 5) lábléc címsorai h4 → h2 (változatlan kinézet)
  if (h.indexOf('class="cafoot"') > -1 && /<footer class="cafoot"[\s\S]*?<h4>/.test(h)) {
    h = h.replace(/(<footer class="cafoot"[\s\S]*?<\/footer>)/, (m) => m.replace(/<h4>([\s\S]*?)<\/h4>/g, '<h2 class="cafoot-h">$1</h2>'));
    h = h.replace('</head>', () => FOOT_CSS + '</head>');
    n.foot++;
  }
  // 6) főoldali „autok-tabs”: role="tablist" tab-gyerekek nélkül → szerep nélkül
  h = h.replace('<div class="autok-tabs" role="tablist">', '<div class="autok-tabs">');
  // 7) menüsáv elrejtése görgetéskor (ahol még nincs)
  if (h.indexOf('class="ca-navwrap') > -1 && h.indexOf('var y0=scrollY,w=null') < 0 && h.indexOf('id="ca-qa-navjs"') < 0) {
    h = h.replace('</head>', () => NAV_CSS + '</head>');
    h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => NAV_JS + '</body>');
    n.nav++;
  }
  // 8) nem indexelendő belső oldalak
  if (/^\/(?:[a-z]{2}\/)?(szerzodes|icons)\//.test(p)) {
    noindexPaths.add(p);
    if (!/<meta[^>]+name="robots"/i.test(h)) { h = h.replace(/<head([^>]*)>/i, (m) => m + '<meta name="robots" content="noindex,follow">'); n.noindex++; }
  }
  // 1e) a fejléc CSS-háttérképe előtöltve (LCP) — a böngésző különben csak a CSS feldolgozása után találja meg
  if (h.indexOf('data-ca-pre') < 0) {
    const hm = h.match(/<(?:section|header|div) class="(?:cd-hero|bp-hero|egl-land-hero|egl-mhero)[^"]*"[^>]*style="[^"]*background-image:url\(['"]?([^'")]+)['"]?\)/);
    if (hm && !/\.(mp4|webm)$/i.test(hm[1]) && h.indexOf('rel="preload" as="image" href="' + hm[1] + '"') < 0) { h = h.replace('</head>', () => '<link rel="preload" as="image" href="' + hm[1] + '" fetchpriority="high" data-ca-pre>' + '</head>'); n.pre = (n.pre || 0) + 1; }
  }
  // 1c) a <body>-ban lévő <style> blokkok a <head> végére (első rajzoláskor már minden stílus megvan → nincs elcsúszás); a sorrend nem változik
  if (isHu && h.indexOf('data-ca-hoist') < 0) {
    const hb = h.indexOf('<body'); const hoisted = [];
    if (hb > -1) {
      const head = h.slice(0, hb); let body = h.slice(hb);
      const parts = body.split(/(<script\b[\s\S]*?<\/script>|<template\b[\s\S]*?<\/template>|<noscript\b[\s\S]*?<\/noscript>|<svg\b[\s\S]*?<\/svg>)/i);
      for (let i = 0; i < parts.length; i += 2) parts[i] = parts[i].replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (m, a, c) => { if (/\smedia=|\sscoped/i.test(a)) return m; hoisted.push('<style data-ca-hoist' + a + '>' + c + '</style>'); return ''; });
      if (hoisted.length) { body = parts.join(''); const hi = head.lastIndexOf('</head>'); h = (hi > -1 ? head.slice(0, hi) + hoisted.join('') + head.slice(hi) : head + hoisted.join('')) + body; n.hoist = (n.hoist || 0) + 1; }
    }
  }
  // 1d) futásidőben cserélt fejléc-szövegek már a buildben (nincs elcsúszás) — Autóink, Tartós bérlet
  if (isHu && p === '/autoink/' && h.indexOf('class="ca-slst"') < 0) {
    if (/<div class="autok-panel on" id="panel-eladas">/.test(h)) h = h.replace(/<html([^>]*)\sclass="([^"]*)"/, (m, a, c) => (/(^| )ca-sl( |$)/.test(c) ? m : '<html' + a + ' class="' + c + ' ca-sl"'));
    h = h.replace(/(<[a-z]+[^>]*data-hero="eladas"[\s\S]*?<p class="sub"[^>]*>)[\s\S]*?(<\/p>)/, (m, a, b) => a + 'Ellenőrzött prémium autók Németországból — bevizsgálva, garanciával, teljes ügyintézéssel.' + b + '<div class="ca-slst"><span><b>&nbsp;</b>autó készleten</span><span><b>Garancia</b>minden autóra</span><span><b>Teljes</b>ügyintézés</span></div>');
  }
  if (isHu && p === '/tartos-berlet/') h = h.replace(/(<section class="hero[^"]*"[\s\S]*?<p class="sub[^"]*"[^>]*>)[^<]*(<\/p>)/, (m, a, b) => a + 'Egy fix havidíj — casco, szerviz, adó és gumi benne. Önerő nélkül, cégeknek és magánszemélyeknek.' + b);
  if (isHu && !LANGS.test(p)) {
    // 9) BreadcrumbList pótlása
    if (h.indexOf('"BreadcrumbList"') < 0 && !/<meta[^>]+robots[^>]+noindex/i.test(h) && !NO_DESIGN.has(p) && p !== '/') {
      const bc = breadcrumb(p, h);
      if (bc) { h = h.replace('</head>', () => bc + '</head>'); n.bc++; }
    }
    // 10) túl hosszú title
    h = h.replace(/<title>([^<]{61,})<\/title>/, (m, t) => { const s = t.replace(/\s*\|\s*CarAdvance\s*$/, ''); if (s !== t) { n.title++; return '<title>' + s + '</title>'; } return m; });
    // 11) magyar dizájn-QA (Előnyök oldalak kivételével)
    if (!NO_DESIGN.has(p)) { h = h.replace(/<style id="ca-qa-hu">[\s\S]*?<\/style>/, ''); h = h.replace('</head>', () => HU_CSS + '</head>'); n.hu++; }
    // 12) újratöltés görgetett állapotban: a tartalom átrendeződése alatt nem látszik ugrálás
    if (h.indexOf('id="ca-rst"') < 0) { h = h.replace(/(<meta charset="[^"]*"\s*\/?>)/i, (m) => m + RST); n.rst = (n.rst || 0) + 1; }
  }
  h = h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => MARK + '</body>');
  fs.writeFileSync(f, h);
}

// sitemap: belső oldalak ki
for (const sm of fs.readdirSync(DIST).filter((x) => /^sitemap.*\.xml$/.test(x))) {
  const fp = path.join(DIST, sm); let x = fs.readFileSync(fp, 'utf8'); const before = x.length;
  x = x.replace(/\s*<url>\s*<loc>https:\/\/www\.caradvance\.hu\/(?:[a-z]{2}\/)?(?:szerzodes|icons)\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
  if (x.length !== before) fs.writeFileSync(fp, x);
}
// _redirects: valódi 301 az átirányító lapok helyett (a fájl elejére, hogy elsőbbséget kapjon)
// og:image: AVIF-ből JPG (1200 px széles) a közösségi megosztáshoz
for (const rel of [...new Set(ogConvert)]) {
  const out = path.join(DIST, rel + '.og.jpg');
  if (!fs.existsSync(out)) { try { await sharp(path.join(DIST, rel + '.avif')).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(out); } catch (e) { console.log('[site-qa] og konverzió hiba', rel, e.message); } }
}
if (redirects.length) {
  const rp = path.join(DIST, '_redirects');
  const cur = fs.existsSync(rp) ? fs.readFileSync(rp, 'utf8') : '';
  const uniq0 = [...new Set(redirects)].filter((l) => cur.indexOf('\n' + l.split(' ')[0] + ' ') < 0 && !cur.startsWith(l.split(' ')[0] + ' '));
  if (cur.indexOf('# ca-qa') < 0 && uniq0.length) {
    const uniq = [...new Set(redirects)].filter((l) => cur.indexOf('\n' + l.split(' ')[0] + ' ') < 0 && !cur.startsWith(l.split(' ')[0] + ' '));
    fs.writeFileSync(rp, '# ca-qa: Astro átirányító lapok → 301\n' + uniq.join('\n') + '\n' + cur);
  }
}
console.log('[site-qa]', JSON.stringify(n));
