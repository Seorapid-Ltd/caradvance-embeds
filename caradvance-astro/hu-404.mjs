// Build lépés (a hu-menu / hu-search / hu-fiok UTÁN, a ver-assets ELŐTT): a magyar 404-es oldal teljes értékű lesz.
// A dist/404.html eddig egy önálló, fejléc nélküli doboz volt, amelyhez a lábléc oldalra csúszva tapadt.
// Most egy valódi magyar oldal (impresszum) keretéből készül: ugyanaz a fejléc, mega menü, kereső, sötét mód és lábléc,
// középen egy prémium „nem található” blokkal és gyors linkekkel.
// CSAK a gyökér dist/404.html-t írja (a magyar). A piaci 404-ek (404-pl-*, 404-ch-* …) a market-404.mjs-ből
// korábban már elkészültek, azokhoz nem nyúl; a piacváltó <script id="ca-404m"> megmarad.
// Idempotens; hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');

const IC = {
  car: '<path d="M5 17h14v-4.5l-1.8-4.6A2 2 0 0 0 15.3 6.6H8.7a2 2 0 0 0-1.9 1.3L5 12.5V17z"/><path d="M5 12.5h14"/><circle cx="8" cy="15" r=".6"/><circle cx="16" cy="15" r=".6"/><path d="M6.5 17v2M17.5 17v2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3"/><path d="m17 6 3 3"/><path d="m15 8 2 2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  phone: '<path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
};
const svg = (k, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;

const LINKS = [
  ['/autoink/', 'car', 'Megvásárolható autóink', 'Ellenőrzött prémium autók készletről'],
  ['/tartos-berlet/', 'key', 'Tartós bérlet', 'Új autó fix havidíjjal, 6 hónaptól'],
  ['/auto-rendeles/', 'globe', 'Autóimport Németországból', 'Megkeressük és behozzuk neked'],
  ['/eladom/', 'tag', 'Add el az autód', 'Profi értékesítés, egy jó ügyért'],
  ['/kapcsolat/', 'phone', 'Kapcsolat', 'Hívj, írj, vagy gyere be hozzánk'],
];

const MAIN = `<main id="ca-404" class="box">
<section class="e4">
  <div class="e4-in">
    <div class="e4-num" aria-hidden="true"><span>4</span><span class="e4-o">0</span><span>4</span></div>
    <div class="e4-code">Az oldal nem található</div>
    <h1 class="e4-h">Ez az út most nem vezet sehova</h1>
    <p class="e4-p">Lehet, hogy elírás történt a címben, vagy az oldalt időközben áthelyeztük. Ha egy autó régi linkjéről jöttél: valószínűleg már gazdára talált.</p>
    <div class="e4-btns">
      <a class="e4-btn e4-pri" href="/autoink/">Aktuális készletünk ${svg('arrow', 18)}</a>
      <button type="button" class="e4-btn e4-sec" id="e4-search">${svg('search', 18)} Keresés az oldalon</button>
      <a class="e4-btn e4-ter" href="/">Főoldal</a>
    </div>
    <div class="e4-hint">
      <div class="e4-hint-ic">${svg('car', 22)}</div>
      <div><b>Elkelt az autó, amit néztél?</b><span>Hasonlót a teljes német piacról behozunk neked — szállítással, honosítással, teljes ügyintézéssel.</span></div>
      <a href="/autot-keresek/">Autót keresek ${svg('arrow', 16)}</a>
    </div>
    <div class="e4-sub">Népszerű oldalaink</div>
    <div class="e4-grid">
${LINKS.map(([h, i, t, d]) => `      <a class="e4-card" href="${h}"><span class="e4-ic">${svg(i)}</span><span class="e4-tx"><b>${t}</b><span>${d}</span></span><span class="e4-ar">${svg('arrow', 16)}</span></a>`).join('\n')}
    </div>
    <div class="e4-foot">Kérdésed van? <a href="tel:+36302336060">+36 30 233 6060</a><span>·</span><a href="mailto:info@caradvance.hu">info@caradvance.hu</a></div>
  </div>
</section>
</main>`;

const CSS = `<style id="ca-dark-hu-404">
/* 404 — prémium „nem található” oldal (csak magyar). Az id „ca-dark-” kezdetű, így a dark-mode.js nem írja át. */
#ca-404{display:block;background:transparent;border:0;box-shadow:none;padding:0;max-width:none;width:auto;border-radius:0}
#ca-404 .e4{position:relative;overflow:hidden;padding:calc(var(--navh,80px) + 72px) 24px 96px;min-height:calc(100vh - 40px)}
#ca-404 .e4:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 50% at 50% 0%,rgba(226,0,26,.10),rgba(226,0,26,0) 70%);z-index:0}
html:not(.ca-dark) #ca-404 .e4:before{background:radial-gradient(60% 50% at 50% 0%,rgba(18,19,23,.06),rgba(18,19,23,0) 70%)}
#ca-404 .e4:after{content:"";position:absolute;left:0;right:0;top:0;height:420px;pointer-events:none;background-image:radial-gradient(circle,rgba(0,0,0,.08) 1px,transparent 1.3px);background-size:16px 16px;-webkit-mask-image:linear-gradient(180deg,#000,transparent);mask-image:linear-gradient(180deg,#000,transparent);z-index:0}
html.ca-dark #ca-404 .e4:after{background-image:radial-gradient(circle,rgba(255,255,255,.07) 1px,transparent 1.3px)}
#ca-404 .e4-in{position:relative;z-index:1;max-width:880px;margin:0 auto;text-align:center}
#ca-404 .e4-num{display:flex;justify-content:center;gap:.02em;font-weight:800;font-size:clamp(110px,19vw,210px);line-height:.9;letter-spacing:-.06em;margin-bottom:18px;user-select:none}
#ca-404 .e4-num span{background:linear-gradient(180deg,#1D1D1F 0%,#6E6E73 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
#ca-404 .e4-num .e4-o{position:relative;background:linear-gradient(160deg,#FF3B4E,#B3001A);-webkit-background-clip:text;background-clip:text;animation:e4spin 9s linear infinite;display:inline-block}
@keyframes e4spin{0%,80%{transform:rotate(0)}90%{transform:rotate(-10deg)}100%{transform:rotate(0)}}
html.ca-dark #ca-404 .e4-num span:not(.e4-o){background:linear-gradient(180deg,#F5F5F7 0%,#5A5A60 100%);-webkit-background-clip:text;background-clip:text}
#ca-404 .e4-code{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#E2001A;margin-bottom:14px}
#ca-404 .e4-h{font-size:clamp(30px,4.4vw,46px);font-weight:800;letter-spacing:-.025em;line-height:1.1;margin:0 auto 16px;max-width:720px;color:#1D1D1F}
#ca-404 .e4-p{font-size:17px;line-height:1.6;color:#6E6E73;max-width:600px;margin:0 auto 30px}
#ca-404 .e4-btns{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:40px}
#ca-404 .e4-btn{display:inline-flex;align-items:center;gap:8px;font:inherit;font-size:15px;font-weight:700;padding:14px 24px;border-radius:999px;text-decoration:none;cursor:pointer;border:1px solid transparent;transition:transform .15s,background-color .15s,box-shadow .15s,border-color .15s}
#ca-404 .e4-btn:hover{transform:translateY(-1px)}
#ca-404 .e4-pri{background:#E2001A;color:#fff;box-shadow:0 10px 24px -8px rgba(226,0,26,.55)}
#ca-404 .e4-pri:hover{background:#C80017}
#ca-404 .e4-sec{background:#fff;color:#1D1D1F;border-color:rgba(0,0,0,.12)}
#ca-404 .e4-sec:hover{border-color:rgba(0,0,0,.3)}
#ca-404 .e4-ter{background:transparent;color:#1D1D1F}
#ca-404 .e4-ter:hover{background:rgba(0,0,0,.05)}
#ca-404 .e4-hint{display:flex;align-items:center;gap:16px;text-align:left;max-width:760px;margin:0 auto 48px;padding:18px 20px;border-radius:20px;background:#fff;border:1px solid rgba(0,0,0,.07);box-shadow:0 14px 40px -18px rgba(0,0,0,.18)}
#ca-404 .e4-hint-ic{flex:none;width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#F5F5F7;color:#1D1D1F}
#ca-404 .e4-hint>div:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
#ca-404 .e4-hint b{font-size:15.5px;color:#1D1D1F}
#ca-404 .e4-hint span{font-size:14px;line-height:1.5;color:#6E6E73}
#ca-404 .e4-hint>a{flex:none;display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:#E2001A;text-decoration:none;white-space:nowrap}
#ca-404 .e4-hint>a:hover svg{transform:translateX(3px)}
#ca-404 .e4-hint>a svg,#ca-404 .e4-ar svg{transition:transform .15s}
#ca-404 .e4-sub{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#86868B;margin-bottom:14px}
#ca-404 .e4-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;text-align:left}
#ca-404 .e4-card{grid-column:span 2}
#ca-404 .e4-grid .e4-card:nth-child(4){grid-column:2/span 2}
#ca-404 .e4-card{display:flex;align-items:center;gap:13px;padding:15px 16px;border-radius:18px;background:#fff;border:1px solid rgba(0,0,0,.07);text-decoration:none;color:inherit;transition:transform .15s,border-color .15s,box-shadow .15s}
#ca-404 .e4-card:hover{transform:translateY(-2px);border-color:rgba(0,0,0,.18);box-shadow:0 14px 30px -16px rgba(0,0,0,.25)}
#ca-404 .e4-card:hover .e4-ar svg{transform:translateX(3px)}
#ca-404 .e4-ic{flex:none;width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#3A3D45,#1B1C21);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
#ca-404 .e4-card:hover .e4-ic{background:linear-gradient(145deg,#FF3B4E,#B3001A)}
#ca-404 .e4-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
#ca-404 .e4-tx b{font-size:15px;font-weight:700;color:#1D1D1F}
#ca-404 .e4-tx span{font-size:12.5px;line-height:1.4;color:#86868B}
#ca-404 .e4-ar{flex:none;color:#C7C7CC}
#ca-404 .e4-card:hover .e4-ar{color:#1D1D1F}
#ca-404 .e4-foot{margin-top:34px;font-size:14px;color:#86868B;display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
#ca-404 .e4-foot a{color:#1D1D1F;font-weight:700;text-decoration:none}
#ca-404 .e4-foot a:hover{color:#E2001A}
/* sötét mód: semleges grafit */
html.ca-dark #ca-404 .e4-h,html.ca-dark #ca-404 .e4-hint b,html.ca-dark #ca-404 .e4-tx b,html.ca-dark #ca-404 .e4-foot a{color:#F5F5F7!important}
html.ca-dark #ca-404 .e4-p,html.ca-dark #ca-404 .e4-hint span{color:#A1A1A6!important}
html.ca-dark #ca-404 .e4-tx span,html.ca-dark #ca-404 .e4-sub,html.ca-dark #ca-404 .e4-foot{color:#8E8E93!important}
html.ca-dark #ca-404 :is(.e4-hint,.e4-card){background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02)),#141518!important;border-color:rgba(255,255,255,.09)!important;box-shadow:none}
html.ca-dark #ca-404 .e4-card:hover{border-color:rgba(255,255,255,.22)!important}
html.ca-dark #ca-404 .e4-hint-ic{background:rgba(255,255,255,.07)!important;color:#F5F5F7}
html.ca-dark #ca-404 .e4-ic{background:linear-gradient(145deg,#4A4D55,#24262B)!important}
html.ca-dark #ca-404 .e4-card:hover .e4-ic{background:linear-gradient(145deg,#FF3B4E,#B3001A)!important}
html.ca-dark #ca-404 .e4-ar{color:#48484A}
html.ca-dark #ca-404 .e4-card:hover .e4-ar{color:#F5F5F7}
html.ca-dark #ca-404 .e4-sec{background:rgba(255,255,255,.06)!important;color:#F5F5F7!important;border-color:rgba(255,255,255,.14)!important}
html.ca-dark #ca-404 .e4-ter{color:#F5F5F7!important}
html.ca-dark #ca-404 .e4-ter:hover{background:rgba(255,255,255,.06)!important}
@media(max-width:860px){
  #ca-404 .e4-grid{grid-template-columns:1fr 1fr}
  #ca-404 .e4-card,#ca-404 .e4-grid .e4-card:nth-child(4){grid-column:auto}
  #ca-404 .e4-grid .e4-card:nth-child(5){grid-column:1/-1}
}
@media(max-width:600px){
  #ca-404 .e4{padding:calc(var(--navh,72px) + 44px) 16px 64px;min-height:0}
  #ca-404 .e4-p{font-size:15.5px}
  #ca-404 .e4-btns{flex-direction:column;align-items:stretch;margin-bottom:30px}
  #ca-404 .e4-btn{justify-content:center}
  #ca-404 .e4-hint{flex-direction:column;align-items:flex-start;gap:12px;margin-bottom:36px}
  #ca-404 .e4-grid{grid-template-columns:1fr}
  #ca-404 .e4-grid .e4-card:nth-child(5){grid-column:auto}
}
@media(prefers-reduced-motion:reduce){#ca-404 .e4-num .e4-o{animation:none}}
</style>
<script id="ca-404s">document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('#e4-search'))return;var b=document.querySelector('.ca-sbtn');if(b){b.click()}else{location.href='/autoink/'}});</script>`;

function run() {
  const rootF = path.join(DIST, '404.html');
  if (!fs.existsSync(rootF)) return 'nincs dist/404.html — kihagyva';
  const base = fs.readFileSync(rootF, 'utf8');
  if (base.includes('id="ca-404"')) return 'már kész';
  const tplF = ['impresszum', 'adatkezeles', 'aszf'].map(d => path.join(DIST, d, 'index.html')).find(f => fs.existsSync(f));
  if (!tplF) return 'nincs sablon oldal — kihagyva';
  let t = fs.readFileSync(tplF, 'utf8');
  if (!/<html[^>]*lang="hu"/.test(t) || (t.match(/<main[\s>]/g) || []).length !== 1 || !/<\/main>/.test(t)) return 'a sablon nem megfelelő — kihagyva';
  const swap = (/<script id="ca-404m">[\s\S]*?<\/script>/.exec(base) || [''])[0];
  t = t
    .replace(/<link rel="canonical"[^>]*>\s*/g, '')
    .replace(/<link rel="alternate" hreflang[^>]*>\s*/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '')
    .replace(/<meta property="og:(url|title|description)"[^>]*>\s*/g, '')
    .replace(/<meta name="robots"[^>]*>\s*/g, '')
    .replace(/<meta name="description"[^>]*>/, '<meta name="description" content="Ez az oldal nem található. Nézd meg aktuális prémium autókészletünket, a tartós bérletet vagy az autóimportot.">')
    .replace(/<title>[^<]*<\/title>/, '<title>Ez az oldal nem található — CarAdvance</title>')
    .replace(/<head>/, '<head>' + swap + '<meta name="robots" content="noindex,follow">')
    .replace(/<main[\s>][\s\S]*?<\/main>/, () => MAIN)
    .replace('</head>', CSS + '</head>')
    // a sablon oldal saját aktív menüpont-jelölése ne maradjon rajta
    .replace(/(<a[^>]*href="\/impresszum\/?")\s+aria-current="page"/g, '$1')
    // nyelvváltó: a sablon oldal nyelvi változatai helyett a nyelvek főoldalaira mutasson
    .replace(/(class="langopt" href=")(\/(?:[a-z]{2}\/)?)impresszum\/"/g, '$1$2"')
    .replace(/(href="https:\/\/www\.caradvance\.(?:sk|cz)\/)impresszum\/"/g, '$1"');
  fs.writeFileSync(rootF, t);
  return 'kész (sablon: ' + path.relative(DIST, tplF) + ')';
}
try { console.log('[hu-404] ' + run()); } catch (e) { console.log('[hu-404] hiba: ' + (e && e.message || e)); }
