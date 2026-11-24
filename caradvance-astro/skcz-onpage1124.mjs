#!/usr/bin/env node
/**
 * skcz-onpage1124.mjs — SEO 3. lépés, 1. kör (on-page), caradvance.sk + caradvance.cz, 2026-11-24
 * Csak dist/sk/** és dist/cs/**. Oldalanként pontos cserék; ha egy minta nem található, logol és továbblép (a buildet nem állítja meg).
 *
 *  P1  SK /prenajom/        fő kulcsszó: operatívny leasing (Ahrefs SK 2 000/hó)
 *  P2  CZ /pronajem/        fő kulcsszó: operativní leasing (Ahrefs CZ 8 400/hó)
 *  P3  SK /dovoz/kalkulacka-prepisu/   fő kulcsszó: prepis auta cena (Ahrefs SK 2 600/hó)
 *  P4  SK + CZ Audi Q9 modelloldal     fő kulcsszó: audi q9 (SK 5 200, CZ 6 600/hó) — SK már 9. helyen: csak title/meta
 *  P5  SK Audi Q7 modelloldal          fő kulcsszó: audi q7 cena (SK 100/hó, 8. hely) — csak title/meta/bevezető
 *  +   főoldal SK/CZ: a bérlési link horgonyszövege leíró („operatívny leasing” / „operativní leasing”)
 * Az árakat (Q7) a build saját adatából veszi, így napi árváltozásnál sem avul el.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
let ok = 0, miss = 0;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function edit(rel, fn) {
  const f = path.join(DIST, rel, 'index.html');
  if (!fs.existsSync(f)) { console.log(`[skcz-onpage] nincs: ${rel} — kihagyva`); return; }
  const before = fs.readFileSync(f, 'utf8');
  const ctx = { h: before, rel };
  fn(ctx);
  if (ctx.h !== before) fs.writeFileSync(f, ctx.h);
}
// a: pontos szöveg vagy RegExp; b: csere. Ha már a cél állapotban van (idempotencia), nem számít hibának.
function rep(ctx, label, a, b, done) {
  if (done && ctx.h.includes(done)) return;
  const n = typeof a === 'string' ? ctx.h.split(a).length - 1 : (ctx.h.match(new RegExp(a.source, a.flags.includes('g') ? a.flags : a.flags + 'g')) || []).length;
  if (!n) { miss++; console.log(`[skcz-onpage] HIÁNYZIK ${ctx.rel}: ${label}`); return; }
  ctx.h = typeof a === 'string' ? ctx.h.split(a).join(b) : ctx.h.replace(a, b);
  ok++;
}
function meta(ctx, title, desc) {
  rep(ctx, 'title', /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`, `<title>${esc(title)}</title>`);
  rep(ctx, 'meta description', /(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`, `content="${esc(desc)}"`);
  for (const [k, v] of [['og:title', title], ['og:description', desc]]) ctx.h = ctx.h.replace(new RegExp(`(<meta property="${k}" content=")[^"]*(")`), `$1${esc(v)}$2`);
  for (const [k, v] of [['twitter:title', title], ['twitter:description', desc]]) ctx.h = ctx.h.replace(new RegExp(`(<meta name="${k}" content=")[^"]*(")`), `$1${esc(v)}$2`);
}
const C2 = 'data-astro-cid-2zgg5vxy=""';

// ---------- P1  SK /prenajom/ ----------
edit('sk/prenajom', (c) => {
  meta(c, 'Operatívny leasing od 6 mesiacov, bez akontácie | CarAdvance',
    'Dlhodobý prenájom auta ako flexibilnejší operatívny leasing: 48 nových prémiových áut od 6 mesiacov, bez akontácie, so servisom, daňou a poistením v cene.');
  rep(c, 'H1', `<h1 ${C2}>Dlhodobý prenájom —<br ${C2}><span class="accent" ${C2}>nové prémiové auto od 6 mesiacov</span></h1>`,
    `<h1 ${C2}>Operatívny leasing od 6 mesiacov —<br ${C2}><span class="accent" ${C2}>dlhodobý prenájom nového prémiového auta</span></h1>`, 'Operatívny leasing od 6 mesiacov —');
  rep(c, 'bevezető', `<p class="sub sub-wide" ${C2}>Jeden fixný mesačný poplatok, ktorý`,
    `<p class="sub sub-wide" ${C2}>Dlhodobý prenájom od CarAdvance je flexibilnejšia forma operatívneho leasingu: jeden fixný mesačný poplatok, ktorý`, 'flexibilnejšia forma operatívneho leasingu');
  rep(c, 'H2 összehasonlítás', `<h2 ${C2}>Dlhodobý prenájom, operatívny lízing alebo finančný lízing?</h2>`,
    `<h2 ${C2}>Dlhodobý prenájom, operatívny leasing alebo finančný lízing?</h2> <p class="sub" ${C2}>Operatívny leasing aj dlhodobý prenájom znamenajú, že auto nekupujete a platíte jeden mesačný poplatok so servisom a poistením. Rozdiel je vo viazanosti a vstupných nákladoch: operatívny leasing sa uzatvára zvyčajne na 24–60 mesiacov, dlhodobý prenájom u CarAdvance už od 6 mesiacov, bez akontácie, len s vratnou kauciou.</p>`, 'Operatívny leasing aj dlhodobý prenájom znamenajú');
  rep(c, 'tegező „vrátiš”', 'a na konci auto jednoducho vrátiš.', 'a na konci auto jednoducho vrátite.', 'jednoducho vrátite.');
});

// ---------- P2  CZ /pronajem/ ----------
edit('cs/pronajem', (c) => {
  meta(c, 'Operativní leasing od 6 měsíců, bez akontace | CarAdvance',
    'Dlouhodobý pronájem auta jako flexibilnější operativní leasing: 48 nových prémiových vozů od 6 měsíců, bez akontace, se servisem, daní a pojištěním v ceně.');
  rep(c, 'H1', `<h1 ${C2}>Dlouhodobý pronájem —<br ${C2}><span class="accent" ${C2}>nový prémiový vůz od 6 měsíců</span></h1>`,
    `<h1 ${C2}>Operativní leasing od 6 měsíců —<br ${C2}><span class="accent" ${C2}>dlouhodobý pronájem nového prémiového vozu</span></h1>`, 'Operativní leasing od 6 měsíců —');
  rep(c, 'bevezető', `<p class="sub sub-wide" ${C2}>Jedno pevné měsíční nájemné, které`,
    `<p class="sub sub-wide" ${C2}>Dlouhodobý pronájem od CarAdvance je flexibilnější forma operativního leasingu: jedno pevné měsíční nájemné, které`, 'flexibilnější forma operativního leasingu');
  rep(c, 'H2 összehasonlítás + válasz', `<h2 ${C2}>Dlouhodobý pronájem, operativní leasing, nebo finanční leasing?</h2>`,
    `<h2 ${C2}>Dlouhodobý pronájem, operativní leasing, nebo finanční leasing?</h2> <p class="sub" ${C2}>Operativní leasing i dlouhodobý pronájem znamenají, že auto nekupujete a platíte jedno měsíční nájemné se servisem a pojištěním. Rozdíl je v délce závazku a vstupních nákladech: operativní leasing se uzavírá obvykle na 24–60 měsíců, dlouhodobý pronájem u CarAdvance už od 6 měsíců, bez akontace, jen s vratnou kaucí.</p>`,
    'Operativní leasing i dlouhodobý pronájem znamenají');
  rep(c, 'tykání „vrátíš”', 'a na konci auto jednoduše vrátíš.', 'a na konci auto jednoduše vrátíte.', 'jednoduše vrátíte.');
});

// ---------- P3  SK /dovoz/kalkulacka-prepisu/ ----------
edit('sk/dovoz/kalkulacka-prepisu', (c) => {
  meta(c, 'Prepis auta 2026: cena a kalkulačka poplatku | CarAdvance',
    'Prepis auta 2026: cena a poplatok za prepis auta na Slovensku. Kalkulačka podľa výkonu motora a emisnej normy, tabuľka sadzieb, zľavy a postup prepisu.');
  rep(c, 'H1', '<h1 class="lk-title">Kalkulačka poplatku za prepis vozidla</h1>', '<h1 class="lk-title">Prepis auta 2026 – cena a kalkulačka poplatku</h1>', 'Prepis auta 2026 – cena a kalkulačka poplatku</h1>');
  rep(c, 'bevezető', '<p class="lk-lead">Zadajte výkon motora,',
    '<p class="lk-lead">Cena za prepis auta je správny poplatok: sadzba podľa výkonu motora × ekologický koeficient, najmenej 33 €. Zadajte výkon motora,', 'Cena za prepis auta je správny poplatok');
  rep(c, 'H2 ár-válasz', '<section class="sec">\n<h2>Sadzba podľa výkonu motora (Pkw)</h2>',
    '<section class="sec">\n<h2>Prepis auta – cena v roku 2026</h2>\n<p class="lede">Cena za prepis auta na Slovensku je správny poplatok za zápis nového držiteľa: sadzba podľa výkonu motora (33 € až 1 000 €) × ekologický koeficient vozidla (0,10 až 1,00), najmenej 33 €. Elektromobil platí pevných 33 €. Príklad: auto so 140 kW a normou Euro 6d zaplatí 300 € × 0,40 = 120 €.</p>\n</section>\n\n<section class="sec">\n<h2>Sadzba podľa výkonu motora (Pkw)</h2>',
    '<h2>Prepis auta – cena v roku 2026</h2>');
  rep(c, 'H2 doklady', '</section>\n\n<section class="sec">\n<h2>Časté otázky</h2>',
    '</section>\n\n<section class="sec">\n<h2>Čo potrebujete na prepis auta?</h2>\n<ul class="lede">\n<li>doklad totožnosti nového aj pôvodného držiteľa, prípadne plnú moc pre splnomocnenú osobu,</li>\n<li>osvedčenie o evidencii (časť I aj časť II),</li>\n<li>potvrdenie o povinnom zmluvnom poistení (PZP) nového držiteľa,</li>\n<li>pri ojazdenom aute potvrdenie o kontrole originality.</li>\n</ul>\n<p class="lede">Okrem správneho poplatku z kalkulačky môžete platiť za kontrolu originality a za nové tabuľky s EČV, ak si pôvodný držiteľ ponechá tie svoje — tieto sumy kalkulačka nezahŕňa. Dovážate auto zo zahraničia? Pozrite si <a href="/sk/dovoz/kalkulacka-poplatkov/">kalkulačku poplatku za prihlásenie auta</a> alebo <a href="/sk/dovoz/">dovoz auta z Nemecka na kľúč</a>.</p>\n</section>\n\n<section class="sec">\n<h2>Časté otázky</h2>',
    '<h2>Čo potrebujete na prepis auta?</h2>');
});

// ---------- P4  Audi Q9 (SK, CZ) ----------
edit('sk/predaj/auto-na-mieru/q9-benzin', (c) => {
  meta(c, 'Audi Q9 – cena, výbava a objednávka z Nemecka | CarAdvance',
    'Nové Audi Q9 z Nemecka: najväčšie SUV Audi so siedmimi miestami, benzín aj plug-in hybrid. Cena na požiadanie, predobjednávka, dovoz na kľúč a prihlásenie.');
  rep(c, 'data-price HU', 'data-price="Hamarosan"', 'data-price="Čoskoro"', 'data-price="Čoskoro"');
});
edit('cs/prodej/vuz-na-miru/q9-benzin', (c) => {
  meta(c, 'Audi Q9 – cena, výbava a objednávka z Německa | CarAdvance',
    'Nové Audi Q9 z Německa: největší SUV Audi se sedmi místy, benzin i plug-in hybrid. Cena na vyžádání, předobjednávka, dovoz na klíč a registrace vozu.');
  rep(c, 'data-price HU', 'data-price="Hamarosan"', 'data-price="Brzy"', 'data-price="Brzy"');
});

// ---------- P5  SK Audi Q7 ----------
edit('sk/predaj/auto-na-mieru/q7-benzin', (c) => {
  const pm = /data-name="Audi Q7"[^>]*data-price="([^"]+)"/.exec(c.h) || /<title>Cena nového Audi Q7: od ([^<]+?) bez DPH/.exec(c.h);
  const price = pm && pm[1];
  if (!price || /cena|Hamarosan/i.test(price)) { miss++; console.log('[skcz-onpage] HIÁNYZIK Q7 ár'); return; }
  meta(c, `Audi Q7 cena od ${price} bez DPH, z Nemecka | CarAdvance`,
    `Cena nového Audi Q7 z Nemecka: od ${price} bez DPH. Diesel aj benzín 231–507 k, až 7 miest. Objednávka na mieru, dovoz na kľúč a prihlásenie do evidencie.`);
  rep(c, 'bevezető', '<p class="cd-sub" data-astro-cid-mpvqbwv3="">Prémiové SUV so sedem miestami — Audi Q7 z Nemecka, TDI, TFSI alebo plug-in hybrid.</p>',
    `<p class="cd-sub" data-astro-cid-mpvqbwv3="">Prémiové SUV so siedmimi miestami — cena nového Audi Q7 z Nemecka od ${price} bez DPH, TDI, TFSI alebo plug-in hybrid.</p>`, 'cena nového Audi Q7 z Nemecka od');
});

// ---------- főoldal: leíró horgonyszöveg a bérlési oldalra ----------
edit('sk', (c) => rep(c, 'főoldal kontextuális link SK', 'ale flexibilnú <strong>konštrukciu s mesačným poplatkom, od minimálnej dĺžky 6 mesiacov</strong>',
  'ale flexibilný <a href="/sk/prenajom/"><strong>operatívny leasing</strong></a> <strong>s mesačným poplatkom, od minimálnej dĺžky 6 mesiacov</strong>', '<strong>operatívny leasing</strong></a>'));
edit('cs', (c) => rep(c, 'főoldal kontextuális link CZ', 'ale flexibilní <strong>konstrukci s měsíčním poplatkem, od minimální doby 6 měsíců</strong>',
  'ale flexibilní <a href="/cs/pronajem/"><strong>operativní leasing</strong></a> <strong>s měsíčním poplatkem, od minimální doby 6 měsíců</strong>', '<strong>operativní leasing</strong></a>'));


// =====================================================================
// 2. KÖR (2026-11-24) — az összes többi kulcsszótérkép-céloldal + 2×100 modelloldal sablonnal
// =====================================================================
const KD = 'data-astro-cid-kwivusqf=""', XJ = 'data-astro-cid-xj2uyz6m=""', RZ = 'data-astro-cid-rz42esbf=""';
const LEN = [];  // utólagos hossz-ellenőrzés
const meta2 = (c, t, d) => { meta(c, t, d); LEN.push([c.rel, t, d]); };

// ---------- SK /dovoz/  (dovoz áut z nemecka 800) ----------
edit('sk/dovoz', (c) => {
  meta2(c, 'Dovoz áut z Nemecka na kľúč – cena a postup | CarAdvance',
    'Dovoz áut z Nemecka na kľúč: hľadanie auta, kontrola na mieste, preprava, prihlásenie dovezeného vozidla a EČV. Položkový rozpis nákladov ešte pred dovozom.');
  rep(c, 'bevezető', `<p class="sub" ${KD}>Dovezte si domov auto svojich snov:`,
    `<p class="sub" ${KD}>Dovoz áut z Nemecka na kľúč — dovezte si domov auto svojich snov:`, 'Dovoz áut z Nemecka na kľúč — dovezte');
});
// ---------- CZ /dovoz/  (dovoz aut z německa 1 200) ----------
edit('cs/dovoz', (c) => {
  meta2(c, 'Dovoz aut z Německa na klíč – cena a postup | CarAdvance',
    'Dovoz aut z Německa na klíč: vyhledání vozu, kontrola na místě, přeprava, registrace a uvedení do provozu. Položková kalkulace nákladů, obvykle za 5–14 dní.');
  rep(c, 'bevezető', `<p class="sub" ${KD}>Přivezte si vůz svých snů:`,
    `<p class="sub" ${KD}>Dovoz aut z Německa na klíč — přivezte si vůz svých snů:`, 'Dovoz aut z Německa na klíč — přivezte');
});

// ---------- készletlista SK /auta/, CZ /vozy/ ----------
// km mértékegység a kártyákon (18802 → 18 802 km) + a „0 €/mes.” meta-hiba megszűnik az új metával
const kmFix = (c) => { c.h = c.h.replace(/<div class="specs">(\d{3,7}) ·/g, (m, n) => `<div class="specs">${Number(n).toLocaleString('fr-FR').replace(/ /g, ' ')} km ·`); };
edit('sk/auta', (c) => {
  meta2(c, 'Ojazdené a málo jazdené autá na predaj | CarAdvance',
    'Ojazdené a málo jazdené prémiové autá na predaj z Nemecka: BMW, Porsche, Mercedes-Benz, Audi a ďalšie. Ceny bez DPH, auto po kontrole, so zárukou a prihlásením.');
  rep(c, 'H1', '<h1>Autá na predaj</h1>', '<h1>Ojazdené a málo jazdené autá na predaj</h1>', '<h1>Ojazdené a málo jazdené autá na predaj</h1>');
  rep(c, 'bevezető', '<p class="sub">Prémiové autá z Nemecka za ceny bez DPH —', '<p class="sub">Ojazdené a málo jazdené prémiové autá z Nemecka za ceny bez DPH —', 'Ojazdené a málo jazdené prémiové autá z Nemecka za');
  kmFix(c);
});
edit('cs/vozy', (c) => {
  meta2(c, 'Auta z dovozu z Německa – ojeté vozy na prodej | CarAdvance',
    'Auta z dovozu z Německa: ojeté a málo jeté prémiové vozy na prodej — BMW, Porsche, Mercedes-Benz, Audi a další. Ceny bez DPH, vůz po kontrole a se zárukou.');
  rep(c, 'H1', '<h1>Vozy na prodej</h1>', '<h1>Auta z dovozu na prodej</h1>', '<h1>Auta z dovozu na prodej</h1>');
  rep(c, 'bevezető', '<p class="sub">Prémiové vozy z Německa za ceny bez DPH —', '<p class="sub">Ojeté prémiové vozy a auta z dovozu z Německa za ceny bez DPH —', 'Ojeté prémiové vozy a auta z dovozu');
  kmFix(c);
});

// ---------- SK /dovoz/kalkulacka-poplatkov/ (prihlasenie auta 1 200, prihlasenie auta cena 700) ----------
edit('sk/dovoz/kalkulacka-poplatkov', (c) => {
  meta2(c, 'Prihlásenie auta 2026 – cena a kalkulačka | CarAdvance',
    'Prihlásenie auta 2026: koľko stojí prihlásenie dovezeného auta na Slovensku? Kalkulačka správneho poplatku podľa výkonu a normy Euro, sadzby a postup.');
  rep(c, 'H1', '<h1 class="lk-title">Kalkulačka poplatku za prihlásenie dovezeného auta</h1>', '<h1 class="lk-title">Prihlásenie auta 2026 – cena a kalkulačka poplatku</h1>', 'Prihlásenie auta 2026 – cena a kalkulačka poplatku</h1>');
  rep(c, 'bevezető', '<p class="lk-lead">Zadajte výkon motora,', '<p class="lk-lead">Cena za prihlásenie auta je najmä správny poplatok podľa položky 65 — vypočítate ho nižšie. Zadajte výkon motora,', 'Cena za prihlásenie auta je najmä');
});
// ---------- CZ /dovoz/kalkulacka-prepisu/ (kolik stojí přepis auta 500, přepis auta cena 400) ----------
edit('cs/dovoz/kalkulacka-prepisu', (c) => {
  meta2(c, 'Přepis auta 2026: cena a kalkulačka poplatků | CarAdvance',
    'Kolik stojí přepis auta v roce 2026? Přepis auta – cena: správní poplatek 800 Kč a emisní poplatek podle normy Euro. Kalkulačka, sazby a postup přepisu.');
  rep(c, 'H1', '<h1 class="lk-title">Kalkulačka poplatků za přepis vozidla</h1>', '<h1 class="lk-title">Přepis auta 2026 – kolik stojí a kalkulačka poplatků</h1>', 'Přepis auta 2026 – kolik stojí');
  rep(c, 'bevezető', '<p class="lk-lead">Vyberte druh vozidla,', '<p class="lk-lead">Kolik stojí přepis auta? Správní poplatek 800 Kč a případný emisní poplatek podle normy Euro. Vyberte druh vozidla,', 'Kolik stojí přepis auta? Správní');
});
// ---------- CZ /dovoz/kalkulacka-poplatku/ (přihlášení auta z německa 150, eko daň 150) ----------
edit('cs/dovoz/kalkulacka-poplatku', (c) => {
  meta2(c, 'Přihlášení auta z Německa: poplatky 2026 | CarAdvance',
    'Přihlášení auta z Německa v roce 2026: kalkulačka správního poplatku, značky EL a emisního poplatku (eko daň) podle normy Euro, sazby a postup registrace.');
  rep(c, 'H1', '<h1 class="lk-title">Kalkulačka poplatků za registraci dovezeného auta</h1>', '<h1 class="lk-title">Přihlášení auta z Německa – kalkulačka poplatků</h1>', 'Přihlášení auta z Německa – kalkulačka');
  rep(c, 'bevezető', '<p class="lk-lead">Vyberte druh vozidla,', '<p class="lk-lead">Přihlášení auta z Německa stojí správní poplatek a případný emisní poplatek (eko daň). Vyberte druh vozidla,', 'Přihlášení auta z Německa stojí');
  rep(c, 'H2 eko daň', '<h2>Emisní poplatek (M1 a N1)</h2>', '<h2>Emisní poplatek – eko daň (M1 a N1)</h2>', 'eko daň (M1 a N1)</h2>');
});

// ---------- főoldalak (auto z nemecka 200 / auta z německa) ----------
edit('sk', (c) => {
  meta2(c, 'Auto z Nemecka – prenájom, predaj a dovoz áut | CarAdvance',
    'Auto z Nemecka bez starostí: prémiové autá na predaj, dlhodobý prenájom od 6 mesiacov bez akontácie a dovoz auta z Nemecka na kľúč. Ceny bez DPH, so zárukou.');
  rep(c, 'bevezető', '<p class="sub">Prenájom a predaj prémiových áut, dovoz áut z Nemecka.</p>', '<p class="sub">Auto z Nemecka bez starostí: prenájom a predaj prémiových áut, dovoz áut z Nemecka na kľúč.</p>', 'Auto z Nemecka bez starostí:');
});
edit('cs', (c) => {
  meta2(c, 'Auta z Německa – pronájem, prodej a dovoz | CarAdvance',
    'Auta z Německa bez starostí: prémiové vozy na prodej, dlouhodobý pronájem od 6 měsíců bez akontace a dovoz auta z Německa na klíč. Ceny bez DPH, se zárukou.');
  rep(c, 'bevezető', '<p class="sub">Pronájem a prodej prémiových vozů, dovoz aut z Německa.</p>', '<p class="sub">Auta z Německa bez starostí: pronájem a prodej prémiových vozů, dovoz aut z Německa na klíč.</p>', 'Auta z Německa bez starostí:');
});

// ---------- konfigurátor SK/CZ (bmw konfigurator 600 / bmw 1 200 + audi konfigurátor 1 000) ----------
// A JS (applyHero) betöltéskor felülírja a H1-et és a bevezetőt; a „(1 € = 368 €/Kč)” hibás árfolyam-szöveg is innen jön (HUF-árfolyam).
function egl(c, h1, note) {
  rep(c, 'H1 statikus', /<h1 id="eglTitle">[^<]*<\/h1>/, `<h1 id="eglTitle">${h1}</h1>`, `<h1 id="eglTitle">${h1}</h1>`);
  rep(c, 'H1 JS (HERO[""])', /('':\{crumb:'[^']*',title:)'[^']*'/, `$1'${h1}'`, `title:'${h1}'`);
  rep(c, 'árfolyam-szöveg JS', `' Az árak tájékoztató német nettó listaárak, élő árfolyammal (1&nbsp;€ = <span id="eglFx">'+fx+'</span>&nbsp;Ft).'`,
    `' ${note}<span id="eglFx" style="display:none">'+fx+'</span>'`, `' ${note}<span id="eglFx"`);
  rep(c, 'árfolyam-szöveg statikus', /(<p class="egl-sub" id="eglSub">.*?) Ce(ny|ny) (sú|jsou) [^<]*<span id="eglFx" style="display:none"><\/span>\.<\/p>/, `$1 ${note}<span id="eglFx" style="display:none"></span></p>`, `${note}<span id="eglFx" style="display:none"></span></p>`);
}
edit('sk/predaj/auto-na-mieru', (c) => {
  meta2(c, 'BMW konfigurátor po slovensky – auto z Nemecka | CarAdvance',
    'BMW konfigurátor po slovensky, s cenníkom: zostavte si nové BMW (alebo MINI, Mercedes, Audi) a my vám ho dovezieme z Nemecka za nemeckú cenu, na kľúč.');
  egl(c, 'BMW konfigurátor – nové auto na mieru z Nemecka', 'Ceny sú orientačné nemecké cenníkové ceny bez DPH.');
});
edit('cs/prodej/vuz-na-miru', (c) => {
  meta2(c, 'BMW a Audi konfigurátor česky – vůz z Německa | CarAdvance',
    'BMW konfigurátor a Audi konfigurátor česky, s ceníkem: sestavte si nové BMW, Audi, MINI nebo Mercedes a my vám ho dovezeme z Německa za německou cenu.');
  egl(c, 'BMW a Audi konfigurátor – nový vůz na míru z Německa', 'Ceny jsou orientační německé ceníkové ceny bez DPH.');
});

// ---------- SK /predaj/financovanie-lizing/ — nincs kalkulátor az oldalon, ezért a „kalkulačka” ígéret kikerül ----------
edit('sk/predaj/financovanie-lizing', (c) => {
  meta2(c, 'Lízing auta a financovanie kúpy z Nemecka | CarAdvance',
    'Lízing auta alebo úver na kúpu auta z Nemecka cez partnerskú lízingovú spoločnosť: nové aj ojazdené autá, zmluvu uzatvárate priamo s lízingovou spoločnosťou.');
  rep(c, 'H1', `<h1 ${RZ}>Lízing a financovanie áut —`, `<h1 ${RZ}>Lízing auta a financovanie —`, 'Lízing auta a financovanie —');
});

// ---------- blogcikkek ----------
edit('sk/blog/dovoz-auta-z-nemecka', (c) => {
  meta2(c, 'Koľko stojí dovoz auta z Nemecka? Náklady a postup 2026',
    'Koľko stojí dovoz auta z Nemecka v roku 2026? Všetky náklady — registračný poplatok, DPH, prihlásenie vozidla, kontrola, preprava — a postup krok za krokom.');
  rep(c, 'H1', `<h1 ${XJ}>Dovoz auta z Nemecka — kompletný sprievodca nákladmi a postupom</h1>`, `<h1 ${XJ}>Koľko stojí dovoz auta z Nemecka? Náklady a postup v roku 2026</h1>`, 'Náklady a postup v roku 2026</h1>');
  rep(c, 'H2', /<h2([^>]*)>Koľko stojí dovoz auta\? Zložky nákladov<\/h2>/, '<h2$1>Koľko stojí dovoz auta z Nemecka? Zložky nákladov</h2>', 'Koľko stojí dovoz auta z Nemecka? Zložky');
});
edit('sk/blog/dlhodoby-prenajom-auta', (c) => {
  meta2(c, 'Dlhodobý prenájom auta: ako funguje a koľko stojí v 2026',
    'Ako funguje dlhodobý prenájom auta 2026: čo zahŕňa mesačný poplatok, ako prebieha prenájom auta krok za krokom, pre koho sa oplatí a čím sa líši od lízingu.');
  rep(c, 'H1', `<h1 ${XJ}>Dlhodobý prenájom auta — pre koho sa oplatí a koľko stojí?</h1>`, `<h1 ${XJ}>Dlhodobý prenájom auta — ako funguje, pre koho sa oplatí a koľko stojí?</h1>`, 'ako funguje, pre koho sa oplatí');
  rep(c, 'H2', /<h2([^>]*)>Ako začať\?<\/h2>/, '<h2$1>Ako funguje prenájom auta krok za krokom?</h2>', 'Ako funguje prenájom auta krok za krokom?');
});
edit('cs/blog/dlouhodoby-pronajem-vozu', (c) => {
  meta2(c, 'Dlouhodobý pronájem vozu: jak funguje a kolik stojí 2026',
    'Jak funguje dlouhodobý pronájem vozu 2026: co obsahuje měsíční poplatek, jak probíhá pronájem krok za krokem, pro koho se vyplatí a čím se liší od leasingu.');
  rep(c, 'H1', `<h1 ${XJ}>Dlouhodobý pronájem vozu — pro koho se vyplatí a kolik stojí?</h1>`, `<h1 ${XJ}>Dlouhodobý pronájem vozu — jak funguje, pro koho se vyplatí a kolik stojí?</h1>`, 'jak funguje, pro koho se vyplatí');
  rep(c, 'H2', /<h2([^>]*)>Jak začít\?<\/h2>/, '<h2$1>Jak funguje pronájem vozu krok za krokem?</h2>', 'Jak funguje pronájem vozu krok za krokem?');
  // a „co je operativní leasing” kérdés a /prodej/operativni-leasing/ oldalé — kannibalizáció helyett belső link
  rep(c, 'link operativní leasing', 'abyste dostali přesně to, co potřebujete.</p>', 'abyste dostali přesně to, co potřebujete. Čím se dlouhodobý pronájem liší od leasingu, vysvětlujeme v článku <a href="/cs/prodej/operativni-leasing/">co je operativní leasing</a>.</p>', 'v článku <a href="/cs/prodej/operativni-leasing/">');
});
edit('cs/blog/dovoz-auta-z-nemecka', (c) => {
  meta2(c, 'Dovoz auta z Německa: cena, náklady a postup v roce 2026',
    'Dovoz auta z Německa – cena v roce 2026: registrační poplatek, DPH, registrace, STK a přeprava. Skutečné náklady a postup dovozu krok za krokem, bez nástrah.');
  rep(c, 'H1', `<h1 ${XJ}>Dovoz auta z Německa — kompletní průvodce náklady a postupem</h1>`, `<h1 ${XJ}>Dovoz auta z Německa — cena, náklady a postup</h1>`, 'Dovoz auta z Německa — cena, náklady a postup</h1>');
  rep(c, 'H2', /<h2([^>]*)>Kolik stojí dovoz auta\? Složky nákladů<\/h2>/, '<h2$1>Dovoz auta z Německa – cena: složky nákladů</h2>', 'Dovoz auta z Německa – cena: složky');
});

// ---------- modelloldalak, sablon: „[modell] cena” ----------
function models(root, L) {
  const dir = path.join(DIST, root); if (!fs.existsSync(dir)) return;
  let done = 0, skipped = 0;
  for (const slug of fs.readdirSync(dir)) {
    if (!fs.existsSync(path.join(dir, slug, 'index.html'))) continue;
    if (L === 'sk' && /^q[79]-benzin$/.test(slug)) continue;      // 1. körben kézzel
    if (L === 'cs' && slug === 'q9-benzin') continue;
    edit(`${root}/${slug}`, (c) => {
      c.h = c.h.replace(/data-price="Ár kérésre"/g, `data-price="${L === 'sk' ? 'Cena na vyžiadanie' : 'Cena na vyžádání'}"`)
               .replace(/data-price="Hamarosan"/g, `data-price="${L === 'sk' ? 'Čoskoro' : 'Brzy'}"`);
      const name = ((/<h1[^>]*>([^<]+)<\/h1>/.exec(c.h) || [])[1] || '').trim();
      const dp = (new RegExp(`data-name="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*data-price="([^"]*)"`).exec(c.h) || /data-price="([^"]*)"/.exec(c.h) || [])[1] || '';
      if (!name || !/\d/.test(dp)) { skipped++; return; }
      const eur = (/([\d  ]+ ?€)/.exec(dp) || [])[1]?.trim(), czk = (/([\d  ]+ ?Kč)/.exec(dp) || [])[1]?.trim();
      const P = L === 'sk' ? eur : czk; if (!P) { skipped++; return; }
      const z = L === 'sk' ? ', z Nemecka' : ', z Německa';
      let t = `${name} cena od ${P} bez DPH | CarAdvance`;
      if (t.length < 50 && (`${name} cena od ${P} bez DPH${z} | CarAdvance`).length <= 60) t = `${name} cena od ${P} bez DPH${z} | CarAdvance`;
      if (t.length > 60) t = `${name} cena od ${P} bez DPH${z}`;
      if (t.length > 60) t = `${name} cena od ${P} bez DPH`;
      if (t.length > 60) t = `${name} cena od ${P}`;
      const old = (/<meta name="description" content="([^"]*)"/.exec(c.h) || [])[1] || '';
      const tail = ((/bez DPH(?:\s*\([^)]*\))?\.\s*(.+)$/.exec(old) || [])[1] || '').trim();
      const head = L === 'sk' ? `${name} cena: od ${P} bez DPH, nové auto z Nemecka.` : `${name} cena: od ${P} (${eur}) bez DPH, nový vůz z Německa.`;
      const ends = L === 'sk'
        ? [' Objednávka na mieru, dovoz na kľúč a prihlásenie do evidencie.', ' Objednávka na mieru, dovoz na kľúč a prihlásenie.', ' Dovoz na kľúč a prihlásenie.', ' Dovoz na kľúč.', '']
        : [' Objednávka na míru, dovoz na klíč a registrace vozu.', ' Dovoz na klíč a registrace vozu.', ' Dovoz na klíč.', ''];
      const base = head + (tail ? ' ' + tail : '');
      let d = ends.map((e) => base + e).find((x) => x.length <= 160) || base;
      if (d.length < 140) d = ends.map((e) => d.replace(/\.$/, '') + '.' + e).find((x) => x.length >= 140 && x.length <= 160) || d;
      if (!old.startsWith(`${esc(name)} cena:`)) meta2(c, t, d);   // idempotens: már átírt metát nem bont újra
      rep(c, 'bevezető', /(<p class="cd-sub"[^>]*>)/, `$1${esc(name)} cena: od ${P} bez DPH. `, `>${esc(name)} cena: od`);
      done++;
    });
  }
  console.log(`[skcz-onpage] modelloldalak ${root}: ${done} kész, ${skipped} ár nélkül (csak HU szöveg javítva)`);
}
models('sk/predaj/auto-na-mieru', 'sk');
models('cs/prodej/vuz-na-miru', 'cs');

// hossz-ellenőrzés (címkék 50–60, meta 140–160) — csak figyelmeztet
for (const [r, t, d] of LEN) {
  if (t.length < 50 || t.length > 60) console.log(`[skcz-onpage] CÍM ${t.length} kar: ${r} — ${t}`);
  if (d.length < 140 || d.length > 160) console.log(`[skcz-onpage] META ${d.length} kar: ${r}`);
}

console.log(`[skcz-onpage] kész: ${ok} csere, ${miss} hiányzó minta`);
