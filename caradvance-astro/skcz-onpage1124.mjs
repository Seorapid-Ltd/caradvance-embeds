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
    'Dlhodobý prenájom ako flexibilnejší operatívny leasing: 48 nových prémiových áut od 6 mesiacov, bez akontácie, so servisom, daňou a poistením v cene.');
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
    'Dlouhodobý pronájem jako flexibilnější operativní leasing: 48 nových prémiových vozů od 6 měsíců, bez akontace, se servisem, daní a pojištěním v ceně.');
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
    'Koľko stojí prepis auta v roku 2026? Kalkulačka vypočíta správny poplatok podľa výkonu motora a emisnej normy. Tabuľka sadzieb, zľavy a postup prepisu.');
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

console.log(`[skcz-onpage] kész: ${ok} csere, ${miss} hiányzó minta`);
