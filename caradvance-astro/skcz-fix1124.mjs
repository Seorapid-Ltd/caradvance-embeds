#!/usr/bin/env node
/**
 * skcz-fix1124.mjs — Mr. Job SK „Zostávajúce opravy SK-CZ” (2026-11-24) lista: a döntést nem igénylő pontok.
 * A build végén fut (dist/sk/** és dist/cs/**). A szöveg-cseréket a lista PDF-jében megadott SK/CZ szöveggel végzi.
 *
 *   1  BMW X6 / M4: magyar mondatok (X6 dizájn-bekezdés, „M Sport csomaggal”, „hibrid”, „… hajtás, … váltóval.”)
 *   2  hozzájárulás-doboz: https://www.caradvance.hu/ochrana-… → relatív /ochrana-osobnych-udajov/ (SK), /ochrana-osobnich-udaju/ (CZ)
 *   3  „dlhodobom prenájme” / „podobné autá” linkek: https://www.caradvance.hu/auta|vozy/… → relatív
 *      (2+3 általánosan: minden <a href="https://www.caradvance.hu/X…">, ahol X a piac saját oldala — a hreflang-linkek maradnak)
 *   6  új autó ár-megjegyzése: a forint-árfolyam („1 € = 368 €/Kč”) helyett SK: átváltás nélkül, CZ: EUR/CZK (intl-map.json fx.CZK)
 *   7  közösségi ikonok: a magyar Facebook/Instagram profil és a TikTok/LinkedIn KERESÉS-link kikerül (Google, YouTube marad);
 *      a JSON-LD sameAs-ből is
 *   9  VOP 5. pont: ÁFA — használt vs. új jármű
 *  11  Feltételek 6. pont: csak banki átutalás (a készpénz kikerül)
 *  12  VOP 11. pont: elállási nyilatkozat-minta
 *  16  rejtett űrlapértékek (value / data-label / data-name) magyarul → SK / CZ
 *  17  CZ sitemap: a működő, indexelhető /auto/… oldalak, amelyek az SK sitemapben benne vannak, a CZ-ből hiányoznak
 *
 * A 2, 3, 7 minden SK/CZ oldalon (az /en/, /de/, /hu/ alváltozatokon is), a többi csak az alapnyelvű oldalakon.
 * Szabályonként logol, idempotens. Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const MK = (process.env.CA_MARKET || '').trim().toLowerCase();
const LANGS = [['sk', 'sk'], ['cs', 'cz']].filter(([, m]) => !MK || MK === 'all' || MK === m).map(([l]) => l);
const SUBS = new Set(['en', 'de', 'hu', 'fr', 'uk', 'zh', 'pl', 'it', 'es']);
const SITE = { sk: 'https://www.caradvance.sk', cs: 'https://www.caradvance.cz' };

let CZK = 24.47;
try { CZK = +JSON.parse(fs.readFileSync('src/i18n/intl-map.json', 'utf8')).fx.CZK || CZK; } catch (e) {}
const czkFx = CZK.toFixed(2).replace('.', ',');

const stat = {};
const hit = (l, k, n = 1) => { if (n) { stat[l] = stat[l] || {}; stat[l][k] = (stat[l][k] || 0) + n; } };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const count = (s, re) => (s.match(re) || []).length;

/* ---------------- 1 — BMW X6 / M4 ---------------- */
const X6_HU = 'Az X6 hosszú motorháztetővel, lecsapott tetővonallal és izmos hátsó résszel sportosabb, mint az X5. A választhatóan világító veserács és a keskeny fényszóró-grafika markáns arcot ad; az M Sport csomag még hangsúlyosabbá teszi a karaktert.';
const X6 = {
  sk: 'X6 je vďaka dlhej kapote, zvažujúcej sa línii strechy a výraznej zadnej časti športovejšie ako X5. Voliteľne podsvietená maska chladiča a úzke svetlomety mu dávajú výraznú tvár; balík M Sport jeho charakter ešte zvýrazňuje.',
  cs: 'X6 je díky dlouhé kapotě, svažující se linii střechy a výrazné zádi sportovnější než X5. Volitelně podsvícená maska chladiče a úzké světlomety mu dávají výraznou tvář; paket M Sport jeho charakter ještě zdůrazňuje.',
};
const MSPORT = { sk: ' s balíkom M Sport', cs: ' s paketem M Sport' };
const HYB = { sk: { d: 'hybrid (diesel/elektro)', b: 'hybrid (benzín/elektro)' }, cs: { d: 'hybrid (nafta/elektro)', b: 'hybrid (benzín/elektro)' } };
const FUEL = {
  sk: { benzin: 'Benzínový motor', 'dízel': 'Dieselový motor', diesel: 'Dieselový motor', hibrid: 'Hybridný pohon', 'plug-in hibrid': 'Plug-in hybridný pohon', elektromos: 'Elektrický pohon' },
  cs: { benzin: 'Benzinový motor', 'dízel': 'Naftový motor', diesel: 'Naftový motor', hibrid: 'Hybridní pohon', 'plug-in hibrid': 'Plug-in hybridní pohon', elektromos: 'Elektrický pohon' },
};
const GEAR = { sk: { automata: 'automatická prevodovka', 'manuális': 'manuálna prevodovka' }, cs: { automata: 'automatická převodovka', 'manuális': 'manuální převodovka' } };

function fix1(h, l) {
  let n = h.split(X6_HU).length - 1; if (n) { h = h.split(X6_HU).join(X6[l]); hit(l, '1 X6 dizájn', n); }
  n = count(h, / M Sport csomaggal/g); if (n) { h = h.replace(/ M Sport csomaggal/g, MSPORT[l]); hit(l, '1 M Sport csomaggal', n); }
  h = h.replace(/(<strong>([^<]{1,120})<\/strong>\s*—\s*)hibrid(?=[,;.<])/g, (m, a, name) => { hit(l, '1 hibrid'); return a + HYB[l][/\b\d{2,3}d\b|\bd\b/i.test(name) ? 'd' : 'b']; });
  h = h.replace(/(Plug-in hibrid|Benzin|Dízel|Diesel|Hibrid|Elektromos) hajtás, (automata|manuális) váltóval\./g, (m, f, g) => {
    const F = FUEL[l][f.toLowerCase()], G = GEAR[l][g.toLowerCase()]; if (!F || !G) return m; hit(l, '1 hajtás/váltó'); return F + ', ' + G + '.';
  });
  return h;
}

/* ---------------- 2 + 3 — caradvance.hu linkek → relatív ---------------- */
function fixLinks(h, l, sub) {
  return h.replace(/<a\b[^>]*>/g, (tag) => {
    if (/\bhreflang=/.test(tag)) return tag; // nyelvváltó: szándékosan a magyar oldalra visz
    return tag.replace(/\bhref="https?:\/\/(?:www\.)?caradvance\.hu\/([^"]*)"/, (m, p) => {
      const seg = p.split(/[/?#]/)[0];
      if (!seg || seg.includes('.')) return m;
      const pre = sub && fs.existsSync(path.join(DIST, l, sub, seg)) ? '/' + sub + '/' : fs.existsSync(path.join(DIST, l, seg)) ? '/' : null;
      if (!pre) return m;
      hit(l, '2/3 caradvance.hu link → relatív');
      return 'href="' + pre + p + '"';
    });
  });
}

/* ---------------- 7 — közösségi ikonok ---------------- */
const SOCIAL = /https?:\/\/(?:www\.)?(?:facebook\.com\/caradvancehungary|instagram\.com\/caradvance_hungary|tiktok\.com\/search|linkedin\.com\/search)[^"]*/;
function fix7(h, l) {
  h = h.replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>[\s\S]*?<\/a>/g, (m, href) => {
    if (!SOCIAL.test(href)) return m;
    if (/<a\b/i.test(m.slice(2))) return m; // biztonság: egymásba ágyazott horgony — nem nyúlunk hozzá
    hit(l, '7 közösségi ikon'); return '';
  });
  h = h.replace(/"sameAs"\s*:\s*\[([^\]]*)\]/g, (m, list) => {
    const items = list.split(',').map((s) => s.trim()).filter(Boolean);
    const keep = items.filter((s) => !SOCIAL.test(s.replace(/\\\//g, '/')));
    if (keep.length === items.length) return m;
    hit(l, '7 sameAs', items.length - keep.length);
    return '"sameAs":[' + keep.join(',') + ']';
  });
  return h;
}

/* ---------------- 6 — új autó ár-megjegyzése ---------------- */
const nb = (s) => s.replace(/[  ]/g, ' ');
function fix6(h, l) {
  if (!/id="cdFx"/.test(h)) return h;
  if (l === 'sk') {
    h = h.replace(/Orientačná nemecká cenníková cena bez DPH, prepočítaná aktuálnym kurzom \(1 € = <span id="cdFx"[^>]*>[^<]*<\/span> €\)\./g, () => { hit(l, '6 árfolyam-megjegyzés'); return 'Orientačná nemecká cenníková cena bez DPH.'; });
    // a forintos átváltásból számolt fő ár helyett a nettó euróár; a duplikált kisebb „od … €” kimarad
    h = h.replace(/<span class="cd-huf cd-huf-live" id="cdHuf" data-net="(\d+)"([^>]*)>[^<]*<\/span>(<span class="cd-eur"[^>]*>[^<]*<\/span>)?/g, (m, net, rest, eur) => {
      hit(l, '6 fő ár (EUR)');
      const from = eur && /od\s/.test(eur) ? 'od ' : '';
      return '<span class="cd-huf" data-net="' + net + '"' + rest + '>' + from + nb((+net).toLocaleString('sk-SK')) + ' €</span>';
    });
  } else {
    h = h.replace(/(Orientační německá ceníková cena bez DPH, přepočet aktuálním kurzem \(1 € = )<span id="cdFx"[^>]*>[^<]*<\/span>( Kč\)\.)/g, (m, a, b) => { hit(l, '6 árfolyam-megjegyzés'); return a + czkFx + b; });
    h = h.replace(/<span class="cd-huf cd-huf-live" id="cdHuf" data-net="(\d+)"([^>]*)>[^<]*<\/span>/g, (m, net, rest) => {
      hit(l, '6 fő ár (Kč)');
      return '<span class="cd-huf" data-net="' + net + '"' + rest + '>' + nb((Math.round(+net * CZK / 100) * 100).toLocaleString('cs-CZ')) + ' Kč</span>';
    });
  }
  return h;
}

/* ---------------- 16 — rejtett űrlapértékek ---------------- */
const VAL = {
  sk: { 'Bemutató autó': 'Predvádzacie auto', 'Dolgozói autó': 'Firemné auto zamestnanca výrobcu', 'Napi rendszámos (előregisztrált)': 'Auto s dennou registráciou (predregistrované)',
    'BMW 3-as Limuzin': 'BMW 3 Limuzína', 'BMW 5-ös Limuzin': 'BMW 5 Limuzína', 'Mercedes-Benz trieda E Limuzin': 'Mercedes-Benz trieda E Limuzína', 'Mercedes-Benz E-osztály Limuzin': 'Mercedes-Benz trieda E Limuzína',
    'MINI Cooper 5 ajtós': 'MINI Cooper 5-dverový', 'Autóbérlés': 'Prenájom auta', 'Finanszírozás &amp; lízing': 'Financovanie a lízing', 'Finanszírozás & lízing': 'Financovanie a lízing' },
  cs: { 'Bemutató autó': 'Předváděcí vůz', 'Dolgozói autó': 'Služební vůz zaměstnance výrobce', 'Napi rendszámos (előregisztrált)': 'Vůz s denní registrací (předregistrovaný)',
    'BMW 3-as Limuzin': 'BMW řady 3 Sedan', 'BMW 5-ös Limuzin': 'BMW řady 5 Sedan', 'Mercedes-Benz trieda E Limuzin': 'Mercedes-Benz třída E Sedan', 'Mercedes-Benz třída E Limuzin': 'Mercedes-Benz třída E Sedan', 'Mercedes-Benz E-osztály Limuzin': 'Mercedes-Benz třída E Sedan',
    'MINI Cooper 5 ajtós': 'MINI Cooper 5dveřový', 'Autóbérlés': 'Pronájem vozu', 'Finanszírozás &amp; lízing': 'Financování a leasing', 'Finanszírozás & lízing': 'Financování a leasing' },
};
const VAL_RE = {};
for (const l of ['sk', 'cs']) VAL_RE[l] = new RegExp('(\\s(?:value|data-label|data-name|data-model|data-car|data-title)=")(' + Object.keys(VAL[l]).map(esc).join('|') + ')(")', 'g');
function fix16(h, l) {
  return h.replace(VAL_RE[l], (m, a, v, b) => { hit(l, '16 rejtett érték'); return a + VAL[l][v] + b; });
}

/* ---------------- 9, 11, 12 — jogi szövegek ---------------- */
const LEGAL = {
  sk: [
    ['9 VOP 5. pont ÁFA', 'obchodne-podmienky',
      'Pri predaji súkromnej osobe uplatňuje slovenskú DPH 23 %, ak vozidlo dopraví na Slovensko Poskytovateľ alebo osoba konajúca na jeho účet.',
      'Pri predaji ojazdeného vozidla súkromnej osobe uplatňuje slovenskú DPH 23 %, ak vozidlo dopraví na Slovensko Poskytovateľ alebo osoba konajúca na jeho účet. Nové vozidlo (najviac 6 mesiacov od prvého uvedenia do prevádzky alebo najviac 6 000 km) Poskytovateľ fakturuje súkromnej osobe bez DPH; DPH 23 % zaplatí kupujúci na Slovensku.'],
    ['11 bérleti díj: csak átutalás', 'prenajom/podmienky-a-kaucia',
      'Môžete platiť prevodom alebo v hotovosti oproti potvrdeniu o prevzatí; v eurách alebo v inej dohodnutej mene — pri inej mene podľa <strong>referenčného výmenného kurzu platného v deň platby</strong>.',
      'Platíte výlučne bankovým prevodom na účet Caradvance GmbH uvedený v zmluve a na faktúre; v eurách alebo v inej dohodnutej mene – pri inej mene podľa <strong>referenčného výmenného kurzu platného v deň platby</strong>. Mr. Job SK s.r.o. ani nikto iný v mene Caradvance GmbH neprijíma platby v hotovosti.'],
    ['12 elállási minta', 'obchodne-podmienky',
      /(<p>Vyhlásenie o odstúpení je potrebné doručiť[^<]*(?:<(?!\/p>)[^<]*)*<\/p>)/,
      '$1 <p>Na odstúpenie môžete použiť tento vzorový formulár: „Adresát: Caradvance GmbH, Bgm-Graf-Ring 21, 82538 Geretsried, Nemecko, info@caradvance.de – Týmto oznamujem, že odstupujem od zmluvy: … / Dátum uzavretia zmluvy: … / Meno a adresa spotrebiteľa: … / Podpis (len pri listinnej forme): … / Dátum: …“. Použitie formulára nie je povinné.</p>'],
  ],
  cs: [
    ['9 VOP 5. pont ÁFA', 'obchodni-podminky',
      'Při prodeji soukromé osobě uplatňuje českou DPH 21 %, pokud vozidlo do Česka dopraví Poskytovatel nebo osoba jednající na jeho účet.',
      'Při prodeji ojetého vozidla soukromé osobě uplatňuje českou DPH 21 %, pokud vozidlo do Česka dopraví Poskytovatel nebo osoba jednající na jeho účet. Nové vozidlo (nejvýše 6 měsíců od prvního uvedení do provozu nebo nejvýše 6 000 km) Poskytovatel fakturuje soukromé osobě bez DPH; DPH 21 % zaplatí kupující v Česku.'],
    ['11 bérleti díj: csak átutalás', 'pronajem/podminky-a-kauce',
      'Platit můžete bankovním převodem nebo v hotovosti proti potvrzení o převzetí; v eurech nebo v korunách — u plateb v korunách podle <strong>kurzu centrální banky platného ke dni platby</strong>.',
      'Platíte výhradně bankovním převodem na účet Caradvance GmbH uvedený ve smlouvě a na faktuře; v eurech nebo v korunách – u plateb v korunách podle <strong>kurzu centrální banky platného ke dni platby</strong>. Mr. Job SK s.r.o. ani nikdo jiný jménem Caradvance GmbH nepřijímá platby v hotovosti.'],
    ['12 elállási minta', 'obchodni-podminky',
      /(<p>Odstoupení od smlouvy je třeba doručit[^<]*(?:<(?!\/p>)[^<]*)*<\/p>)/,
      '$1 <p>K odstoupení můžete použít tento vzorový formulář: „Adresát: Caradvance GmbH, Bgm-Graf-Ring 21, 82538 Geretsried, Německo, info@caradvance.de – Tímto oznamuji, že odstupuji od smlouvy: … / Datum uzavření smlouvy: … / Jméno a adresa spotřebitele: … / Podpis (pouze u listinné podoby): … / Datum: …“. Použití formuláře není povinné.</p>'],
  ],
};
function fixLegal(h, l, rel) {
  for (const [k, page, from, to] of LEGAL[l]) {
    if (rel !== page + '/index.html') continue;
    const mark = to.replace(/^\$1 /, '').slice(0, 60);
    if (h.includes(mark)) { hit(l, k + ' (már kész)'); continue; } // idempotens
    if (typeof from === 'string') { const n = h.split(from).length - 1; if (n) { h = h.split(from).join(to); hit(l, k, n); } }
    else if (from.test(h)) { h = h.replace(from, to); hit(l, k); }
  }
  return h;
}

/* ---------------- 17 — CZ sitemap ---------------- */
// Minden működő, indexelhető, önmagára kanonikus /auto/<slug>/ oldal a CZ sitemapbe (mint az SK-n).
// Nem az SK sitemapből dolgozik, mert az egy-ország (dev-cz) buildben a dist/sk már nincs meg.
function fix17() {
  const smCs = path.join(DIST, 'cs', 'sitemap.xml'), dir = path.join(DIST, 'cs', 'auto');
  if (!fs.existsSync(smCs) || !fs.existsSync(dir)) return 'nincs cs sitemap vagy /auto/';
  let cs = fs.readFileSync(smCs, 'utf8');
  const have = new Set([...cs.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  const lm = (cs.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || new Date().toISOString().slice(0, 10);
  const add = [];
  for (const s of fs.readdirSync(dir).sort()) {
    const u = SITE.cs + '/auto/' + s + '/';
    const f = path.join(dir, s, 'index.html');
    if (have.has(u) || !fs.existsSync(f)) continue;
    const h = fs.readFileSync(f, 'utf8');
    if (h.length < 5000 || /<meta[^>]+name="robots"[^>]+noindex/i.test(h) || /http-equiv=["']?refresh/i.test(h.slice(0, 3000))) continue;
    const can = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (can !== u) continue;
    add.push(`  <url><loc>${u}</loc><lastmod>${lm}</lastmod></url>`);
  }
  if (add.length) { cs = cs.replace('</urlset>', add.join('\n') + '\n</urlset>'); fs.writeFileSync(smCs, cs); }
  return 'CZ sitemap +' + add.length + ' /auto/ oldal';
}


/* ---------------- 2026-11-24 este — utóellenőrzés ---------------- */
// PDF-adatlap: ha a böngésző blokkolja a felugró ablakot, a figyelmeztetés magyarul jelent meg
const POPUP_HU = 'A böngésző blokkolta a felugró ablakot. Engedélyezd, majd próbáld újra a letöltést.';
const POPUP = {
  sk: 'Prehliadač zablokoval vyskakovacie okno. Povoľte ho a skúste sťahovanie znova.',
  cs: 'Prohlížeč zablokoval vyskakovací okno. Povolte ho a zkuste stahování znovu.',
};
// JSON-LD: a caradvance.hu-n tárolt képek (logó, autófotók) a piac saját domainjén is elérhetők → saját domain
function fixMisc(h, l) {
  // csonka cím („… cena na požiadanie, objednávka z”) a title / og:title / twitter:title-ben → a csonka rész nélkül
  h = h.replace(/(<title>|<meta (?:property|name)="(?:og|twitter):title" content=")([^<"]*?), objednávka z(<\/title>|")/g, (m, a, t, b) => { hit(l, 'csonka cím'); return a + t + b; });
  let n = h.split(POPUP_HU).length - 1;
  if (n) { h = h.split(POPUP_HU).join(POPUP[l]); hit(l, 'PDF felugró-ablak üzenet', n); }
  h = h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, a, j, b) => {
    const j2 = j.replace(/https?:\/\/(?:www\.)?caradvance\.hu\/([^"\s]+?\.(?:webp|jpe?g|png|avif|svg|gif))(?=["\s])/g, (u, p) => {
      if (!fs.existsSync(path.join(DIST, p.split('?')[0]))) return u;
      hit(l, 'JSON-LD kép saját domainre'); return SITE[l] + '/' + p;
    });
    return a + j2 + b;
  });
  return h;
}


// hreflang: a feltételek-oldal „hu” / „x-default” változata a saját (www nélküli) címre mutatott → a magyar oldal
const HREFLANG_FIX = [
  [/(<link rel="alternate" hreflang="(?:hu|x-default)" href=")https:\/\/caradvance\.sk\/prenajom\/podmienky-a-kaucia\/(")/g, '$1https://www.caradvance.hu/berlesi-feltetelek/$2'],
  [/(<link rel="alternate" hreflang="(?:hu|x-default)" href=")https:\/\/caradvance\.cz\/pronajem\/podminky-a-kauce\/(")/g, '$1https://www.caradvance.hu/berlesi-feltetelek/$2'],
];
function fixHreflang(h, l) {
  for (const [re, to] of HREFLANG_FIX) h = h.replace(re, (...m) => { hit(l, 'hreflang feltételek-oldal'); return to.replace('$1', m[1]).replace('$2', m[2]); });
  return h;
}


// mobil / iPad: vízszintes kilógás (2026-11-24 este, élő oldalon mérve 375 / 768 / 834 / 1024 px-en)
//  - lábléc jogi sora (nowrap) iPaden 768–1100 px között kilógott → tördelhető
//  - /prenajom/ · /pronajem/ kalkulátor: a hosszú modellnév-opció 375 px-en kitolta a választómezőt
//  - főoldal 3D autó-karusszel: a széle 6–25 px-lel túlnyúlt → a lap nem görgethető oldalra (overflow-x: clip a karusszel szakaszán)
const LAYOUT_CSS = '<style id="skcz-fix1124-css">a[href*="facebook.com/caradvancehungary"],a[href*="instagram.com/caradvance_hungary"],a[href*="tiktok.com/search"],a[href*="linkedin.com/search"]{display:none!important}#autoink{overflow-x:clip}@media (max-width:1100px){.cafoot-copy span{white-space:normal!important;max-width:100%}}.tb-cf>label{min-width:0}.tb-cf select{width:100%;max-width:100%;min-width:0;text-overflow:ellipsis}</style>';
function fixLayout(h, l) {
  if (h.includes('id="skcz-fix1124-css"') || !h.includes('</head>')) return h;
  hit(l, 'mobil/iPad CSS');
  return h.replace('</head>', LAYOUT_CSS + '</head>');
}


// 7 (kiegészítés): a menü „Sledujte nás” blokkja szkriptből rajzolódik (mega-menu.js) — a magyar Facebook/Instagram
// profil és a TikTok/LinkedIn kereső-link ott is elrejtve (LAYOUT_CSS). Média-oldal: a magyar Instagram-posztok
// (#posztok) és a TikTok „čoskoro” kártya kimarad, amíg nincs szlovák/cseh profil; a YouTube marad.
function fixMedia(h, l, rel) {
  if (rel !== 'o-nas/media/index.html') return h;
  h = h.replace(/<section\b[^>]*\bid="posztok"[\s\S]*?<\/section>/, () => { hit(l, '7 média: magyar posztok'); return ''; });
  h = h.replace(/<div class="md-card md-card-soon"[^>]*>\s*<img[^>]*alt="TikTok"[\s\S]*?<\/div>/, () => { hit(l, '7 média: TikTok kártya'); return ''; });
  return h;
}

/* ---------------- futtatás ---------------- */
function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p); else if (e.name.endsWith('.html')) yield p;
  }
}
try {
  for (const l of LANGS) {
    const root = path.join(DIST, l);
    if (!fs.existsSync(root)) { console.log(`[skcz-fix1124] ${l}: nincs mappa — kihagyva`); continue; }
    let files = 0, changed = 0;
    for (const f of walk(root)) {
      const rel = path.relative(root, f).split(path.sep).join('/');
      const first = rel.split('/')[0];
      const sub = SUBS.has(first) && rel.includes('/') ? first : '';
      const h0 = fs.readFileSync(f, 'utf8'); let h = h0;
      h = fixLinks(h, l, sub);
      h = fix7(h, l);
      h = fixHreflang(h, l);
      h = fixLayout(h, l);
      if (!sub) { h = fix1(h, l); h = fix6(h, l); h = fix16(h, l); h = fixLegal(h, l, rel); h = fixMisc(h, l); h = fixMedia(h, l, rel); }
      files++;
      if (h !== h0) { fs.writeFileSync(f, h); changed++; }
    }
    console.log(`[skcz-fix1124] ${l}: ${changed}/${files} oldal módosítva — ` + Object.entries(stat[l] || {}).map(([k, n]) => k + ': ' + n).join(' · '));
    for (const [k] of LEGAL[l]) if (!(stat[l] || {})[k] && !(stat[l] || {})[k + ' (már kész)']) console.log(`[skcz-fix1124] ${l}: FIGYELEM — „${k}” forrásszövege nem található (változott a jogi oldal?)`);
  }
  if (LANGS.includes('cs')) console.log('[skcz-fix1124] ' + fix17());
} catch (e) {
  console.log('[skcz-fix1124] hiba (a build folytatódik): ' + (e && e.stack || e));
}
