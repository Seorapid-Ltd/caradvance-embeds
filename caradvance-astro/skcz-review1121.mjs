#!/usr/bin/env node
/**
 * skcz-review1121.mjs — Mr. Job SK „Pred spustením SK-CZ” (2026-11-21) lista: a döntést nem igénylő pontok
 * (a skcz-hufix.mjs után fut; csak dist/sk/** és dist/cs/**, a /en/, /de/, /hu/ alváltozatokhoz nem nyúl)
 *
 *   6  a magyar /berelheto-auto/… linkek a piac saját bérlési oldalára (vagy a márkára szűrt bérelhető listára),
 *      a caradvance.hu-ra mutató adatkezelési / oldal-linkek a saját domainre
 *  10  Referenciák: jelezni, hogy németországi, lefordított Google-értékelések (link a Google-profilra)
 *  13  Adatkezelés: Ahrefs Analytics a feldolgozók közé
 *  14  „Prečo my?”: „1 év kellékszavatosság minden autónál” → 1–2 év (jazdené / nové), mint az ÁSZF
 *  16  Autólista: a bérelhető nézetben a morzsa és a cím „Autá na prenájom” / „Vozy k pronájmu”
 *  17  Eladó autók szűrője: ismétlődő elemek egyszer, és a szűrés a lefordított értékekkel is működjön
 *      (eddig pl. „Benzín”, „Limuzína” választásakor üres lett a lista); darabszám a piac nyelvén
 *  18  Minimális bérleti idő: ÁSZF 3. pont + Feltételek + GYIK „spravidla 6 mesiacov, pri vybraných autách od 4”
 *  20  JSON-LD: a caradvance.hu oldal-címek (BreadcrumbList item, url) a piac domainjére; inLanguage hu-HU → sk-SK / cs-CZ
 * Szabályonként logol. Idempotens. Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const SITE = { sk: 'https://www.caradvance.sk', cs: 'https://www.caradvance.cz' };
const LIST = { sk: '/auta/', cs: '/vozy/' };
const INLANG = { sk: 'sk-SK', cs: 'cs-CZ' };
const GOOGLE = 'https://www.google.com/maps/search/?api=1&amp;query=Caradvance%20GmbH%20Autovermietung';

// Pontos szöveg-cserék (nyers HTML, szkripteken kívül; ahol JSON-LD-ben is szerepel, ott is — csak ha nincs benne HTML)
const TXT = {
  sk: [
    ['18', '<li>dlhodobý prenájom prémiových áut (minimálne na 6 mesiacov);</li>', '<li>dlhodobý prenájom prémiových áut (spravidla minimálne na 6 mesiacov, pri vybraných autách od 4 mesiacov);</li>'],
    ['18', 'Minimálna doba prenájmu je vždy 6 mesiacov.', 'Minimálna doba prenájmu je spravidla 6 mesiacov, pri vybraných autách od 4 mesiacov.'],
    ['18', '6 plných mesiacov od odovzdania.', 'Spravidla 6 plných mesiacov od odovzdania, pri vybraných autách od 4 mesiacov.'],
    ['18', 'Dlhodobý prenájom sa uzatvára minimálne na 6 mesiacov —', 'Dlhodobý prenájom sa uzatvára spravidla minimálne na 6 mesiacov (pri vybraných autách od 4 mesiacov) —'],
    ['14', '<strong>zodpovednosť za vady 1 rok</strong>', '<strong>zodpovednosť za vady 1 rok, pri nových autách 2 roky</strong>'],
    ['10', 'Caradvance GmbH má na Google momentálne priemerné hodnotenie 5,0. Tu je niekoľko skutočných recenzií.',
      'Caradvance GmbH má na Google priemerné hodnotenie 5,0. Uvádzame niekoľko recenzií zákazníkov z Nemecka, preložených do slovenčiny – originály nájdete na <a href="' + GOOGLE + '" target="_blank" rel="noopener">profile Google</a>.'],
    ['13', '<tr><td>Notion Labs, Inc.', '<tr><td>Ahrefs Pte. Ltd. — Singapur</td><td>Ahrefs Analytics — anonymná štatistika návštevnosti bez cookies</td><td>Singapur</td></tr> <tr><td>Notion Labs, Inc.'],
  ],
  cs: [
    ['18', '<li>dlouhodobý pronájem prémiových vozů (minimálně na 6 měsíců);</li>', '<li>dlouhodobý pronájem prémiových vozů (zpravidla minimálně na 6 měsíců, u vybraných vozů od 4 měsíců);</li>'],
    ['18', 'Minimální doba pronájmu je vždy 6 měsíců.', 'Minimální doba pronájmu je zpravidla 6 měsíců, u vybraných vozů od 4 měsíců.'],
    ['18', 'Minimálně 6 celých měsíců od předání.', 'Zpravidla minimálně 6 celých měsíců od předání, u vybraných vozů od 4 měsíců.'],
    ['18', 'Dlouhodobý pronájem se uzavírá minimálně na 6 měsíců —', 'Dlouhodobý pronájem se uzavírá zpravidla minimálně na 6 měsíců (u vybraných vozů od 4 měsíců) —'],
    ['10', 'Společnost Caradvance GmbH má na Googlu aktuálně průměrné hodnocení 5,0. Zde je několik skutečných recenzí.',
      'Společnost Caradvance GmbH má na Googlu průměrné hodnocení 5,0. Uvádíme několik recenzí zákazníků z Německa, přeložených do češtiny – originály najdete na <a href="' + GOOGLE + '" target="_blank" rel="noopener">profilu Google</a>.'],
    ['13', '<tr><td>Notion Labs, Inc.', '<tr><td>Ahrefs Pte. Ltd. — Singapur</td><td>Ahrefs Analytics — anonymní statistika návštěvnosti bez cookies</td><td>Singapur</td></tr> <tr><td>Notion Labs, Inc.'],
  ],
};
// 14 — a „Prečo my?” számsor (a span-ek között build-hash attribútumok vannak, ezért minta)
const STAT14 = { sk: [[/>1 r\.(<\/span><span class="mm-stat-l"[^>]*>)zodpovednosť za vady pri každom aute</g, '>1–2 r.$1zodpovednosť za vady (1 rok jazdené, 2 roky nové autá)<']] };

// 17 — eladó autók szűrője: nyers adatérték → a lista lefordított felirata
const MAPS = {
  sk: {
    uz: { Benzin: 'Benzín', Diesel: 'Diesel', 'Dízel': 'Diesel', Elektro: 'Elektro', Elektromos: 'Elektro', Hibrid: 'Hybrid', 'Hybrid (Benzin/Elektro)': 'Hybrid (benzín/elektro)', 'Hybrid (Diesel/Elektro)': 'Hybrid (Diesel/Elektro)' },
    kar: { Cabrio: 'Kabriolet', 'Kabrió': 'Kabriolet', Coupé: 'Coupé', 'Ferdehátú': 'Hatchback', Kombi: 'Kombi', Limuzin: 'Limuzína', SUV: 'SUV', 'Városi terepjáró (SUV)': 'SUV', 'Sportautó': 'Športové auto', 'Kisautó': 'Malé auto', 'Egyterű': 'MPV' },
    plural: "n===1?' auto':(n>1&&n<5?' autá':' áut')",
    crumbRent: 'Autá na prenájom',
  },
  cs: {
    uz: { Benzin: 'Benzín', Diesel: 'Nafta', 'Dízel': 'Nafta', Elektro: 'Elektro', Elektromos: 'Elektro', Hibrid: 'Hybrid', 'Hybrid (Benzin/Elektro)': 'Hybrid (benzin/elektro)', 'Hybrid (Diesel/Elektro)': 'Hybrid (Diesel/Elektro)' },
    kar: { Cabrio: 'Kabriolet', 'Kabrió': 'Kabriolet', Coupé: 'Coupé', 'Ferdehátú': 'Hatchback', Kombi: 'Kombi', Limuzin: 'Limuzína', SUV: 'SUV', 'Városi terepjáró (SUV)': 'SUV', 'Sportautó': 'Sportovní vůz', 'Kisautó': 'Malý vůz', 'Egyterű': 'MPV' },
    plural: "n===1?' vůz':(n>1&&n<5?' vozy':' vozů')",
    crumbRent: 'Vozy k pronájmu',
  },
};
const FILTER_OLD = "(!k||o.k===k)&&(!u||o.u===u)";
const FILTER_NEW = "(!k||(window.__caKM?__caKM(o.k):o.k)===k)&&(!u||(window.__caUM?__caUM(o.u):o.u)===u)";
const COUNT_OLD = "document.getElementById('count').textContent=n+' autó';";
const listJs = (lg) => {
  const M = MAPS[lg];
  return '<script id="ca-list-fix">(function(){var KM=' + JSON.stringify(M.kar) + ',UM=' + JSON.stringify(M.uz) + ';' +
    'window.__caKM=function(v){return KM[v]||v};window.__caUM=function(v){return UM[v]||v};' +
    // 17: ismétlődő szűrő-elemek kivétele (az érték = felirat)
    '["uz","kar"].forEach(function(id){var s=document.getElementById(id);if(!s)return;var seen={};[].slice.call(s.options).forEach(function(o){var t=o.textContent.trim();if(!o.value&&o.index===0)return;o.value=t;if(seen[t])o.parentNode.removeChild(o);else seen[t]=1;});});' +
    // 16: morzsa és cím a bérelhető nézetben
    'var b=document.querySelector(".crumb b"),h=document.querySelector(".ch-var h1"),S=b?b.textContent:"",SH=h?h.textContent:"",R=' + JSON.stringify(M.crumbRent) + ';' +
    'function upd(){var t=document.querySelector(".autok-tab.on");var rent=t?t.getAttribute("data-group")==="berles":/berelheto|premium|berbeadva/.test(location.hash);if(b)b.textContent=rent?R:S;if(h)h.textContent=rent?R:SH;}' +
    'upd();window.addEventListener("hashchange",upd);document.addEventListener("click",function(e){if(e.target&&e.target.closest&&e.target.closest(".autok-tab"))setTimeout(upd,0);});' +
    '[].forEach.call(document.querySelectorAll(".autok-tab"),function(t){new MutationObserver(upd).observe(t,{attributes:true,attributeFilter:["class"]});});' +
    '})();</script>';
};

function walk(d, root, out = []) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (d === root && /^(en|de|hu)$/.test(e.name)) continue; walk(p, root, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const brandOf = (slug) => { const m = slug.match(/^(mercedes-benz|mercedes|bmw|audi|mini|volkswagen|vw|hyundai|cupra|man|kia|seat|volvo)/); if (!m) return ''; return ({ 'mercedes-benz': 'mercedes', vw: 'volkswagen' })[m[1]] || m[1]; };

try {
  for (const lg of ['sk', 'cs']) {
    const root = path.join(DIST, lg);
    if (!fs.existsSync(root)) { console.log(`[skcz-review1121] ${lg}: hiányzik — kihagyva`); continue; }
    let SL = {};
    try { SL = JSON.parse(fs.readFileSync(path.join(root, '_slugs.json'), 'utf8')); } catch (e) { console.log(`[skcz-review1121] ${lg}: _slugs.json hiba: ${e.message}`); }
    const mapPath = (p) => {
      // HU útvonal → a piac útvonala (_slugs.json), lekérdezés/hash megtartva
      const m = p.match(/^([^?#]*)([?#].*)?$/); let base = m[1]; const rest = m[2] || '';
      if (!base.endsWith('/')) base += '/';
      if (SL[base]) return SL[base] + rest;
      return null;
    };
    const st = {};
    const bump = (k, n = 1) => { st[k] = (st[k] || 0) + n; };
    let changed = 0;
    for (const f of walk(root, root)) {
      const h0 = fs.readFileSync(f, 'utf8');
      const parts = h0.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/i);
      for (let k = 0; k < parts.length; k++) {
        let p = parts[k];
        if (!p) continue;
        if (/^<script\b[^>]*application\/ld\+json/i.test(p)) {
          // 20: JSON-LD oldal-címek és nyelv
          p = p.replace(/"https:\/\/www\.caradvance\.hu(\/[^"]*)"/g, (all, pth) => {
            if (/\.(webp|jpe?g|png|svg|mp4|pdf)(\?|$)/i.test(pth)) return all;
            const np = pth === '/' ? '/' : mapPath(pth);
            if (np == null) return all;
            bump('20 json-ld url'); return '"' + SITE[lg] + np + '"';
          });
          if (p.includes('"inLanguage":"hu-HU"')) { p = p.split('"inLanguage":"hu-HU"').join('"inLanguage":"' + INLANG[lg] + '"'); bump('20 inLanguage'); }
          for (const [id, a, b] of TXT[lg]) if (!/[<>]/.test(a + b) && p.includes(a)) { p = p.split(a).join(b); bump(id + ' (json-ld)'); }
          parts[k] = p;
        } else if (/^<script\b/i.test(p)) {
          if (p.includes(FILTER_OLD)) { p = p.split(FILTER_OLD).join(FILTER_NEW); bump('17 szűrő'); }
          if (p.includes(COUNT_OLD)) { p = p.split(COUNT_OLD).join("document.getElementById('count').textContent=n+(" + MAPS[lg].plural + ");"); bump('17 darabszám'); }
          parts[k] = p;
        } else {
          for (const [id, a, b] of TXT[lg]) if (p.includes(a) && !p.includes(b)) { p = p.split(a).join(b); bump(id); }
          for (const [re, rep] of STAT14[lg] || []) { const q = p.replace(re, rep); if (q !== p) { p = q; bump('14 számsor'); } }
          // 6: magyar bérlési linkek és caradvance.hu oldal-linkek
          p = p.replace(/(<a\b[^>]*\bhref=")(\/berelheto-auto\/[^"#?]*)([^"]*)(")/g, (all, a, pth, rest, z) => {
            let np = mapPath(pth);
            if (np == null) { const slug = pth.replace(/^\/berelheto-auto\//, ''); const br = brandOf(slug); np = LIST[lg] + (br ? '?marka=' + br : '') + '#berelheto'; }
            bump('6 bérlési link'); return a + np + z;
          });
          p = p.replace(/(<a\b(?![^>]*hreflang)[^>]*\bhref=")https:\/\/www\.caradvance\.hu(\/[^"]+)(")/g, (all, a, pth, z) => {
            const np = mapPath(pth); if (np == null) return all;
            bump('6 .hu link'); return a + np + z;
          });
          parts[k] = p;
        }
      }
      let h = parts.join('');
      if (h.includes(FILTER_NEW) && !h.includes('id="ca-list-fix"')) { const bi = h.lastIndexOf('</body>'); if (bi > 0) { h = h.slice(0, bi) + listJs(lg) + h.slice(bi); bump('16/17 lista-szkript'); } }
      if (h !== h0) { fs.writeFileSync(f, h); changed++; }
    }
    console.log(`[skcz-review1121] ${lg}: ${changed} oldal módosítva · ${JSON.stringify(st)}`);
  }
} catch (e) {
  console.log('[skcz-review1121] hiba:', e && e.stack || e);
}
process.exit(0);
