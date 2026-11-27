// Build lépés (a hu-404 után, a hu-fix ELŐTT): két új magyar oldal egy meglévő magyar oldal (impresszum) keretéből.
//  • /cegeknek/ — Benchmark (járműbeszerzés tesztre, összehasonlításra), Rendezvények, Céges tartós bérlet
//    (a caradvance.de/services/benchmark tartalma magyarul)
//  • /vip/      — külön VIP világ a luxusautó-bérléshez (saját fejléc, világos módban elefántcsont-arany, sötétben fekete-arany)
// A fejléc/menü/lábléc a sablonból jön, a hu-fix.mjs utána rakja rá a menü-módosításokat. CSAK magyar, idempotens.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const SITE = 'https://www.caradvance.hu';
const MAIL = 'info@caradvance.hu';
const TEL = '+36302336060', TELTXT = '+36 30 233 6060';

const svg = (p, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ARR = svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', 17);
const CHK = svg('<path d="M20 6 9 17l-5-5"/>', 16);
const IC = {
  clinic: '<path d="M9 3h6M10 3v5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-10V3"/><path d="M7.5 14h9"/>',
  launch: '<path d="M4 20 20 4"/><path d="M14 4h6v6"/><path d="M4 14v6h6"/>',
  brand: '<path d="M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z"/>',
  media: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  incentive: '<path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 21V7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  fleet: '<path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4h-2"/><path d="M3 17v-4h18"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  phone: '<path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
};

// ---------------------------------------------------------------- Cégeknek
const CORP = `<main id="ca-corp" data-dm-skip="1">
<section class="cp-hero">
  <div class="cp-hero-bg" style="background-image:url('/cover-ceges-auto-operativ-lizing-tartos-berlet.webp')"></div>
  <div class="cp-wrap cp-hero-in">
    <div class="cp-ey">Cégeknek · Benchmark</div>
    <h1>Benchmark <span>powered by Caradvance</span></h1>
    <p class="cp-lead">Bármely autó, bárhonnan — beszerzés tesztre, összehasonlításra és rendezvényekre, bérelve vagy megvásárolva. Ha kereke van, előkerítjük.</p>
    <div class="cp-btns"><a class="cp-btn cp-pri" href="#kapcsolat">Ajánlatot kérek ${ARR}</a><a class="cp-btn cp-btn2" href="#benchmark">Szolgáltatásaink</a></div>
    <div class="cp-facts"><span><b>20+ év</b>tapasztalat</span><span><b>Partnerhálózat</b>gyártók, kereskedők, importőrök</span><span><b>Bérlés vagy vásárlás</b>ahogy a projektnek jobb</span></div>
  </div>
</section>

<section class="cp-sec" id="benchmark">
  <div class="cp-wrap cp-split">
    <div class="cp-img" style="background-image:url('/caradvance-hero-beszerzesi-poster.jpg')"></div>
    <div class="cp-txt">
      <div class="cp-ey">„A kapcsolati háló a minden”</div>
      <h2>Járműkutatás és beszerzés</h2>
      <p>A megadott specifikáció alapján a világpiacon felkutatjuk a kért autót, és megszervezzük a bérlését vagy megvásárlását — legyen szó konkurens modellről tesztre, összehasonlításra vagy fejlesztési projekthez.</p>
      <ul class="cp-list">
        <li>${CHK}<span>Keresés pontosan a te specifikációd szerint, világszerte</span></li>
        <li>${CHK}<span>Bérlés vagy vásárlás — a projekt igényei szerint</span></li>
        <li>${CHK}<span>Sokéves kapcsolat német és nemzetközi gyártók flottáival, kereskedőkkel, importőrökkel és autókölcsönzőkkel</span></li>
      </ul>
      <a class="cp-link" href="#kapcsolat">Autót keresek a projekthez ${ARR}</a>
    </div>
  </div>
</section>

<section class="cp-sec cp-alt" id="rendezvenyek">
  <div class="cp-wrap">
    <div class="cp-head">
      <div class="cp-ey">„A márkák élménye”</div>
      <h2>Rendezvényszervezés</h2>
      <p>Egyedi, autós céges rendezvényeket tervezünk és valósítunk meg — belső és külső eseményekhez —, hogy a márkák egyedien és tartósan átélhetővé váljanak.</p>
    </div>
    <div class="cp-grid">
      ${[['clinic', 'Car clinic és termékoktatás', 'Vásárlói tesztek és oktatások valós autókkal'],
         ['launch', 'Modellbemutató', 'Piaci bevezetés a megfelelő autókkal és helyszínnel'],
         ['brand', 'Márkakampány', 'Élményalapú kampányok a márka köré'],
         ['media', 'Média- és filmforgatás', 'Autók beszerzése és kezelése forgatásokhoz'],
         ['incentive', 'Incentive rendezvény', 'Emlékezetes élmény munkatársaknak, partnereknek']]
        .map(([i, t, d]) => `<div class="cp-card"><span class="cp-ic">${svg(IC[i], 22)}</span><b>${t}</b><span>${d}</span></div>`).join('')}
    </div>
  </div>
</section>

<section class="cp-sec">
  <div class="cp-wrap cp-fleet">
    <span class="cp-ic cp-ic-lg">${svg(IC.fleet, 26)}</span>
    <div><h3>Céges tartós bérlet és flotta</h3><p>Új autók havidíjjal, nettó árakon — szerviz, biztosítás és adó egy díjban, egyetlen autótól a teljes flottáig.</p></div>
    <div class="cp-fleet-btns"><a class="cp-btn cp-pri" href="/tartos-berlet/#cegeknek">Céges tartós bérlet ${ARR}</a><a class="cp-btn cp-btn2" href="/operativ-lizing/">Operatív lízing</a></div>
  </div>
</section>

<section class="cp-sec" id="kapcsolat">
  <div class="cp-wrap"><div class="cp-cta">
    <div class="cp-ey cp-ey-l">Következő lépés</div>
    <h2>Készen állsz a következő projektre?</h2>
    <p>Írd meg, milyen autóra vagy rendezvényre van szükséged — egyedi ajánlattal jelentkezünk.</p>
    <div class="cp-btns"><a class="cp-btn cp-pri" href="mailto:${MAIL}?subject=Benchmark%20%2F%20c%C3%A9ges%20aj%C3%A1nlatk%C3%A9r%C3%A9s">${svg(IC.mail, 18)} Írj nekünk</a><a class="cp-btn cp-ghost" href="tel:${TEL}">${svg(IC.phone, 18)} ${TELTXT}</a></div>
  </div></div>
</section>
</main>`;

const CORP_CSS = `<style id="ca-dark-hu-corp">
#ca-corp{--ink:#1D1D1F;--mut:#6E6E73;--line:rgba(0,0,0,.08);--card:#fff;--alt:#F5F5F7;--ic:linear-gradient(145deg,#3A3D45,#1B1C21);display:block;color:var(--ink);background:transparent}
html.ca-dark #ca-corp{--ink:#F5F5F7;--mut:#A1A1A6;--line:rgba(255,255,255,.09);--card:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02)),#141518;--alt:rgba(255,255,255,.025);--ic:linear-gradient(145deg,#4A4D55,#24262B)}
#ca-corp .cp-wrap{max-width:1160px;margin:0 auto;padding:0 24px}
#ca-corp .cp-hero{position:relative;overflow:hidden;margin-top:calc(-1 * var(--navh,80px));padding:calc(var(--navh,80px) + 110px) 0 90px;color:#fff;background:#0B0B0D}
#ca-corp .cp-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.5)}
#ca-corp .cp-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,11,13,.85) 0%,rgba(11,11,13,.35) 60%,rgba(11,11,13,.1)),linear-gradient(180deg,transparent 60%,rgba(11,11,13,.6))}
html:not(.ca-dark) #ca-corp .cp-hero{-webkit-mask-image:linear-gradient(180deg,#000 88%,transparent);mask-image:linear-gradient(180deg,#000 88%,transparent)}
#ca-corp .cp-hero-in{position:relative;z-index:1}
#ca-corp .cp-ey{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#E2001A;margin-bottom:14px}
#ca-corp .cp-hero .cp-ey{color:#FF6B78}
#ca-corp h1{font-size:clamp(40px,6vw,72px);line-height:1.02;letter-spacing:-.035em;font-weight:800;margin:0 0 18px;max-width:780px}
#ca-corp h1 span{display:block;font-size:.42em;letter-spacing:-.01em;font-weight:600;color:rgba(255,255,255,.7);margin-top:10px}
#ca-corp .cp-lead{font-size:18px;line-height:1.6;color:rgba(255,255,255,.82);max-width:560px;margin:0 0 28px}
#ca-corp .cp-btns{display:flex;gap:10px;flex-wrap:wrap}
#ca-corp .cp-btn{display:inline-flex;align-items:center;gap:8px;height:50px;padding:0 24px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;transition:transform .15s,background-color .15s,border-color .15s}
#ca-corp .cp-btn:hover{transform:translateY(-1px)}
#ca-corp .cp-pri{background:#E2001A;color:#fff!important;box-shadow:0 10px 24px -8px rgba(226,0,26,.55)}
#ca-corp .cp-pri:hover{background:#C80017}
#ca-corp .cp-btn2{background:rgba(255,255,255,.12);color:#fff!important;border:1px solid rgba(255,255,255,.22);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
#ca-corp .cp-facts{display:flex;gap:34px;flex-wrap:wrap;margin-top:46px;padding-top:24px;border-top:1px solid rgba(255,255,255,.16);font-size:13.5px;color:rgba(255,255,255,.7)}
#ca-corp .cp-facts b{display:block;color:#fff;font-size:17px;margin-bottom:2px}
#ca-corp .cp-sec{padding:84px 0}
#ca-corp .cp-alt{background:var(--alt)}
#ca-corp h2{font-size:clamp(30px,3.6vw,44px);line-height:1.1;letter-spacing:-.03em;font-weight:800;margin:0 0 16px;color:var(--ink)}
#ca-corp h3{font-size:22px;letter-spacing:-.02em;margin:0 0 6px;color:var(--ink)}
#ca-corp p{color:var(--mut);font-size:16.5px;line-height:1.65;margin:0 0 18px}
#ca-corp .cp-split{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}
#ca-corp .cp-img{aspect-ratio:4/3;border-radius:26px;background-size:cover;background-position:center;box-shadow:0 30px 60px -30px rgba(0,0,0,.45)}
#ca-corp .cp-list{list-style:none;padding:0;margin:0 0 24px;display:grid;gap:12px}
#ca-corp .cp-list li{display:flex;gap:12px;align-items:flex-start;font-size:15.5px;line-height:1.5;color:var(--ink)}
#ca-corp .cp-list svg{flex:none;margin-top:2px;padding:4px;width:24px;height:24px;border-radius:50%;background:rgba(48,209,88,.14);color:#1FA34A}
#ca-corp .cp-link{display:inline-flex;align-items:center;gap:8px;font-weight:700;color:#E2001A;text-decoration:none}
#ca-corp .cp-link:hover svg{transform:translateX(3px)}#ca-corp .cp-link svg{transition:transform .15s}
#ca-corp .cp-head{max-width:680px;margin:0 auto 40px;text-align:center}
#ca-corp .cp-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
#ca-corp .cp-card{display:flex;flex-direction:column;gap:6px;padding:22px 18px;border-radius:20px;background:var(--card);border:1px solid var(--line)}
#ca-corp .cp-card b{font-size:16px;color:var(--ink);margin-top:10px}
#ca-corp .cp-card>span:last-child{font-size:13.5px;line-height:1.5;color:var(--mut)}
#ca-corp .cp-ic{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:var(--ic);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
#ca-corp .cp-ic-lg{width:58px;height:58px;border-radius:17px;flex:none}
#ca-corp .cp-fleet{display:flex;align-items:center;gap:24px;padding:28px 30px!important;border-radius:26px;background:var(--card);border:1px solid var(--line)}
#ca-corp .cp-fleet>div:nth-child(2){flex:1;min-width:0}#ca-corp .cp-fleet p{margin:0}
#ca-corp .cp-fleet .cp-btn2{background:transparent;color:var(--ink)!important;border:1px solid var(--line);-webkit-backdrop-filter:none;backdrop-filter:none}
#ca-corp .cp-fleet-btns{display:flex;gap:10px;flex-wrap:wrap}
#ca-corp .cp-cta{text-align:center;padding:64px 28px;border-radius:32px;background:radial-gradient(60% 120% at 50% 120%,rgba(226,0,26,.28),transparent 70%),#121317;color:#fff}
html:not(.ca-dark) #ca-corp .cp-cta{background:radial-gradient(60% 120% at 50% 120%,rgba(18,19,23,.08),transparent 70%),#fff;color:var(--ink);border:1px solid var(--line);box-shadow:0 30px 60px -40px rgba(0,0,0,.35)}
#ca-corp .cp-cta h2{color:inherit}#ca-corp .cp-cta p{max-width:520px;margin:0 auto 26px}
html.ca-dark #ca-corp .cp-cta{border:1px solid var(--line)}
#ca-corp .cp-cta .cp-btns{justify-content:center}
#ca-corp .cp-ey-l{color:#E2001A}
#ca-corp .cp-ghost{border:1px solid var(--line);color:var(--ink)!important;background:transparent}
html.ca-dark #ca-corp .cp-ghost{border-color:rgba(255,255,255,.22);color:#fff!important}
#ca-corp [id]{scroll-margin-top:calc(var(--navh,80px) + 20px)}
@media(max-width:1000px){#ca-corp .cp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#ca-corp .cp-split{grid-template-columns:1fr;gap:30px}#ca-corp .cp-fleet{flex-wrap:wrap}}
@media(max-width:600px){#ca-corp .cp-hero{padding:calc(var(--navh,72px) + 60px) 0 60px}#ca-corp .cp-sec{padding:60px 0}#ca-corp .cp-grid{grid-template-columns:1fr}#ca-corp .cp-facts{gap:18px}#ca-corp .cp-btn{width:100%;justify-content:center}#ca-corp .cp-fleet{padding:22px!important}#ca-corp .cp-cta{padding:44px 20px}}
</style>`;

// ---------------------------------------------------------------- VIP
// VIP flotta (forrás: caradvance.de „Verfügbare Fahrzeuge”, a luxusautók; a fotókat a caradvance.de képoptimalizálója szolgálja ki)
const SB = 'https://dojspukytlbetcrsgwld.supabase.co/storage/v1/object/public/fahrzeuge_bilder/';
const IMG = (id, f, w = 1080) => 'https://caradvance.de/_next/image?url=' + encodeURIComponent(SB + id + '/' + f) + '&w=' + w + '&q=75';
const FLEET = [ // [név, kategória, napidíj, hétvége, hét, adatok, mappa, fotók] — bruttó (áfával) euró; 0 = ár kérésre
  ['Ferrari 812 GTS Superfast', 'Sportautó', 2678, 7081, 14726, ['Automata', '800 LE', '2 ülés'], '5538', ['IMG_7994.jpg', 'IMG_7981.jpg', 'IMG_7996.jpg', 'IMG_7995.jpg']],
  ['Ferrari SF90 Spider', 'Sportautó', 2678, 7081, 14875, ['Automata', '1001 LE', '2 ülés'], '5569', ['IMG_9021.jpg', 'IMG_9025.jpg', 'IMG_9023.jpg', 'IMG_9024.jpg']],
  ['Ferrari 296 GTS', 'Sportautó', 1695, 3950, 9900, ['Automata', 'Benzin', '2 ülés'], '5706', ['IMG_5052.jpg', 'IMG_5057.jpg', 'IMG_5053.jpg', 'IMG_5058.jpg']],
  ['Ferrari F8 Spider', 'Cabrio', 1660, 4980, 11841, ['Automata', '720 LE', '2 ülés'], '5537', ['IMG_9021.jpg', 'IMG_9023.jpg', 'IMG_9022.jpg', 'IMG_9024.jpg']],
  ['Ferrari F8 Spider', 'Cabrio', 1660, 4980, 9960, ['Automata', 'Benzin'], '5531', ['IMG_7951.jpg', 'IMG_7955.jpg', 'IMG_7959.jpg', 'IMG_7952.jpg', 'IMG_7953.jpg']],
  ['Ferrari Amalfi', 'Sportautó', 1541, 7081, 15411, ['Automata', 'Benzin'], '5599', ['IMG_8940.jpg', 'IMG_8934.jpg', 'IMG_8941.jpg', 'IMG_8936.jpg']],
  ['Ferrari Roma Spider', 'Cabrio', 1541, 4701, 9461, ['Automata', 'Benzin'], '5628', ['IMG_4179.jpg', 'IMG_4180.jpg', 'IMG_4184.jpg', 'IMG_4190.jpg', 'IMG_4195.jpg', 'IMG_4189.jpg']],
  ['Porsche 911 Targa 4S', 'Sportautó', 1184, 3511, 6486, ['Automata', '480 LE', 'Összkerék'], '5680', ['IMG_9925.jpg', 'IMG_9924.jpg', 'IMG_9929.jpg']],
  ['Porsche 911 Carrera GTS Cabriolet', 'Cabrio', 1184, 3209, 6486, ['Automata', '541 LE', '2 ülés'], '5532', ['1730194-2026.04.16.09.54.32-WP0ZZZ990TS239222_0.jpg']],
  ['Bentley Continental GTC', 'Cabrio', 1131, 4701, 7081, ['Automata', '4 ülés'], '5541', ['Bentley_Continental_GTC_schwarz_front.jpg']],
  ['Mercedes-AMG GT R', 'Sportautó', 1070, 3273, 4701, ['Automata', '585 LE', '2 ülés'], '4946', ['1712986-2026.02.11.13.02.50-WMX1903791A018427_0.jpg', '1712986-2026.02.11.13.02.55-WMX1903791A018427_6.jpg', '1712986-2026.02.11.13.02.54-WMX1903791A018427_4.jpg', '1712986-2026.02.11.13.02.52-WMX1903791A018427_2.jpg']],
  ['BMW M3 Competition', 'Limuzin', 1070, 2678, 4701, ['Automata'], '5623', ['IMG_0364.jpg', 'IMG_0358.jpg', 'IMG_0368.jpg', 'IMG_0370.jpg']],
  ['BMW X6 M', 'SUV', 1065, 2916, 4701, ['Automata', '625 LE', 'Összkerék'], '1110', ['1711423-2026.01.19.14.15.04_api_v1_mo-prod_images_0e_0ef4f89a-377a-4547-b32d-750a72eac7e8', '1711423-2026.01.19.14.15.04_api_v1_mo-prod_images_91_916df7a5-9de6-40f2-9b6e-9dfb5c18fef8', '1711423-2026.01.19.14.15.04_api_v1_mo-prod_images_a9_a9c55bed-526e-4147-b6dc-53dfaf01fbbb', '1711423-2026.01.19.14.15.04_api_v1_mo-prod_images_1e_1e068e85-4460-4432-8f20-9fc2f2408fb3']],
  ['Audi SQ7', 'SUV', 594, 2374, 4165, ['Automata', '507 LE', '7 ülés'], '4940', ['1718552-2026.02.24.14.49.39-WUAZZZ4M0SD042434_0.jpg', '1718552-2026.02.24.14.49.44-WUAZZZ4M0SD042434_6.jpg', '1718552-2026.02.24.14.49.43-WUAZZZ4M0SD042434_4.jpg', '1718552-2026.02.24.14.49.41-WUAZZZ4M0SD042434_2.jpg']],
  ['Mercedes S 350', 'Limuzin', 0, 0, 0, ['Automata'], '5589', ['S350_M-CC8476_01.jpg', 'S350_M-CC8476_02.jpg', 'S350_M-CC8476_03.jpg', 'S350_M-CC8476_04.jpg', 'S350_M-CC8476_05.jpg', 'S350_M-CC8476_06.jpg']],
];
const AVAIL = { '5532': '2026. dec. 1-től', '4946': '2026. dec. 1-től', '1110': '2026. dec. 29-től', '4940': '2027. febr. 1-től' };
const NOPHOTO = { '5532': 1 }; // a caradvance.de-n is hiányzik a fotója
const eur = n => '€' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
const BRAND = n => n.split(/[ -]/)[0];
const FLEET_HTML = FLEET.map(([name, cat, price, we, wk, specs, id, imgs]) => `<article class="vp-car" data-cat="${cat}" data-brand="${BRAND(name)}">
    <div class="vp-gal" tabindex="0" aria-label="${name} fotói">${NOPHOTO[id] ? `<div class="vp-nophoto"><span>${name.split(' ')[0]}</span>Fotó hamarosan</div>` : imgs.map((f, i) => `<img src="${IMG(id, f)}" data-big="${IMG(id, f, 1920)}" alt="${name}${i ? ' – ' + (i + 1) + '. fotó' : ''}" loading="lazy" decoding="async" width="1080" height="720">`).join('')}</div>
    ${NOPHOTO[id] ? '' : `<button type="button" class="vp-zoom" aria-label="${name} fotói teljes képernyőn">${svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', 17)}</button>`}
    ${imgs.length > 1 && !NOPHOTO[id] ? `<div class="vp-dots">${imgs.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
    <span class="vp-av${AVAIL[id] ? ' vp-av-later' : ''}"><i></i>${AVAIL[id] ? 'Elérhető ' + AVAIL[id] : 'Azonnal elérhető'}</span>
    <div class="vp-cb">
      <div class="vp-cat">${cat}</div>
      <h3>${name}</h3>
      <div class="vp-specs">${specs.concat(['200 km/nap']).map(x => `<span>${x}</span>`).join('')}</div>
      <div class="vp-pr">${price ? `<b class="vp-g">${eur(price)}</b><span>/ nap · áfával</span>` : `<b class="vp-g">Ár kérésre</b><span>személyre szabott ajánlat</span>`}</div>
      ${price ? `<div class="vp-more"><span class="vp-huf" data-eur="${price}" hidden></span><span>Hétvége <b>${eur(we)}</b></span><span>Egy hét <b>${eur(wk)}</b></span></div>` : ''}
      <a class="vp-btn vp-gold vp-ask" href="#foglalas" data-car="${name}">Ajánlatot kérek</a>
    </div>
  </article>`).join('\n  ');
// galéria-pöttyök, teljes képernyős fotónézegető, szűrők, napi forint-árfolyam, foglalási űrlap (/api/lead), lebegő sáv
const VIP_GAL_JS = `<script id="ca-vip-gal">(function(){var R=document.getElementById('ca-vipp');if(!R)return;var $$=function(s,c){return [].slice.call((c||R).querySelectorAll(s))};
$$('.vp-car').forEach(function(c){var g=c.querySelector('.vp-gal'),d=c.querySelectorAll('.vp-dots i');if(!g||!d.length)return;g.addEventListener('scroll',function(){var i=Math.round(g.scrollLeft/g.clientWidth);[].forEach.call(d,function(x,k){x.className=k===i?'on':''})},{passive:true});[].forEach.call(d,function(x,k){x.addEventListener('click',function(){g.scrollTo({left:k*g.clientWidth,behavior:'smooth'})})})});
/* fotónézegető */
var lb=document.getElementById('vp-lb'),lbt=lb.querySelector('.vp-lb-track'),lbn=lb.querySelector('.vp-lb-n'),lbh=lb.querySelector('.vp-lb-h'),last=null;
function lbIdx(){return Math.round(lbt.scrollLeft/lbt.clientWidth)}
function lbUpd(){lbn.textContent=(lbIdx()+1)+' / '+lbt.children.length}
function lbOpen(c,i){var im=$$('.vp-gal img',c);if(!im.length)return;last=document.activeElement;lbh.textContent=c.querySelector('h3').textContent;lbt.innerHTML=im.map(function(x){return '<img src="'+x.getAttribute('data-big')+'" alt="'+x.alt.replace(/"/g,'&quot;')+'" decoding="async">'}).join('');lb.hidden=false;document.documentElement.classList.add('vp-lock');requestAnimationFrame(function(){lbt.scrollLeft=i*lbt.clientWidth;lbUpd();lb.querySelector('.vp-lb-x').focus()})}
function lbClose(){lb.hidden=true;lbt.innerHTML='';document.documentElement.classList.remove('vp-lock');last&&last.focus&&last.focus()}
function lbGo(s){lbt.scrollTo({left:(lbIdx()+s)*lbt.clientWidth,behavior:'smooth'})}
lbt.addEventListener('scroll',lbUpd,{passive:true});
lb.addEventListener('click',function(e){var t=e.target.closest('button');if(t&&t.classList.contains('vp-lb-x'))lbClose();else if(t&&t.classList.contains('vp-lb-p'))lbGo(-1);else if(t&&t.classList.contains('vp-lb-nx'))lbGo(1);else if(e.target===lb||e.target===lbt)lbClose()});
document.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')lbClose();if(e.key==='ArrowLeft')lbGo(-1);if(e.key==='ArrowRight')lbGo(1)});
$$('.vp-car').forEach(function(c){var g=c.querySelector('.vp-gal'),z=c.querySelector('.vp-zoom');if(!g||!z)return;var o=function(){lbOpen(c,Math.round(g.scrollLeft/g.clientWidth))};z.addEventListener('click',o);g.addEventListener('click',function(e){if(e.target.tagName==='IMG')o()});g.addEventListener('keydown',function(e){if(e.key==='Enter')o()})});
/* szűrők: kategória és márka együtt */
var F={cat:'',brand:''},cnt=R.querySelector('.vp-fcount');
function filt(){var n=0;$$('.vp-car').forEach(function(c){var ok=(!F.cat||c.dataset.cat===F.cat)&&(!F.brand||c.dataset.brand===F.brand);c.hidden=!ok;if(ok)n++});cnt.textContent=n+' autó';R.querySelector('.vp-empty').hidden=n>0}
$$('.vp-f button').forEach(function(b){b.addEventListener('click',function(){var k=b.parentNode.dataset.k,v=b.dataset.v;if(k==='brand'&&F.brand===v)v='';F[k]=v;$$('button',b.parentNode).forEach(function(x){x.setAttribute('aria-pressed',x.dataset.v===v?'true':'false')});filt()})});
R.querySelector('.vp-reset').addEventListener('click',function(){F.cat='';F.brand='';$$('.vp-f button').forEach(function(x){x.setAttribute('aria-pressed',x.dataset.v===''?'true':'false')});filt()});
/* forint: napi EUR/HUF árfolyam, tájékoztató jelleggel */
fetch('https://open.er-api.com/v6/latest/EUR').then(function(r){return r.json()}).then(function(d){var k=d&&d.rates&&d.rates.HUF;if(!k)return;$$('.vp-huf').forEach(function(s){s.textContent='≈ '+(Math.round(s.dataset.eur*k/1000)*1000).toLocaleString('hu-HU')+' Ft / nap';s.hidden=false});var r=R.querySelector('.vp-rate');if(r){r.textContent='Forintban a napi árfolyammal (1 € ≈ '+k.toFixed(1).replace('.',',')+' Ft), tájékoztató jelleggel.';r.hidden=false}}).catch(function(){});
/* foglalási űrlap */
var f=document.getElementById('vp-form'),sel=f.car,occ=f.occ;
function pick(car,o){if(car)sel.value=car;if(o)occ.value=o;document.getElementById('foglalas').scrollIntoView({behavior:'smooth'});setTimeout(function(){f.n.focus({preventScroll:true})},700)}
$$('.vp-ask').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();pick(a.dataset.car,'')})});
$$('.vp-tile').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();pick('',a.dataset.occ)})});
var td=new Date(),iso=function(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)};f.from.min=iso(td);f.to.min=iso(td);
f.from.addEventListener('change',function(){f.to.min=f.from.value||iso(td);if(f.to.value&&f.to.value<f.from.value)f.to.value=f.from.value});
f.addEventListener('submit',function(e){e.preventDefault();var er=f.querySelector('.vp-err'),btn=f.querySelector('button[type=submit]');er.hidden=true;if(!f.checkValidity()){f.reportValidity();return}
var data={"Típus":"VIP luxusautó-bérlés – ajánlatkérés","Autó":sel.value||"Még nem tudom","Alkalom":occ.value||"","Bérlés kezdete":f.from.value,"Bérlés vége":f.to.value||f.from.value,"Név":f.n.value.trim(),"Telefon":f.p.value.trim(),"E-mail":f.e.value.trim().toLowerCase(),"Megjegyzés":f.m.value.trim(),"Adatkezelés":"Adatkezelési tájékoztató elfogadva ("+new Date().toISOString()+")","website":f.website.value};
try{if(window.caLeadExtras){var x=window.caLeadExtras();for(var k in x)data[k]=x[k]}else data.page=location.href}catch(_){data.page=location.href}
btn.disabled=true;btn.textContent='Küldés…';
fetch("/api/lead",{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)}).then(function(r){return r.json().catch(function(){return{ok:r.ok}})}).then(function(j){if(!j||!j.ok)throw 0;try{window.caFireLead&&window.caFireLead("vip")}catch(_){}f.hidden=true;R.querySelector('.vp-ok').hidden=false}).catch(function(){btn.disabled=false;btn.textContent='Ajánlatot kérek';er.hidden=false})});
/* lebegő sáv: a fejléckép után jelenik meg, a foglalási résznél és a lábléc közelében eltűnik */
var bar=R.querySelector('.vp-bar'),hero=R.querySelector('.vp-hero'),bk=document.getElementById('foglalas');
function bs(){var y=hero.getBoundingClientRect().bottom<60,b=bk.getBoundingClientRect(),inF=b.top<innerHeight&&b.bottom>0;bar.classList.toggle('on',y&&!inF)}
addEventListener('scroll',bs,{passive:true});addEventListener('resize',bs);bs();
})();</script>`;

// Alkalmak fotós csempéi — ideiglenesen a saját flotta fotóival, amíg a stock fotókat jóvá nem hagyják
const OCC = [
  ['Esküvő', 'Elegáns érkezés a nagy napon', IMG('5541', 'Bentley_Continental_GTC_schwarz_front.jpg', 828)],
  ['Hétvége', 'Nyitott tető, hosszú utak', IMG('5628', 'IMG_4179.jpg', 828)],
  ['Születésnap', 'Ajándék, amire évekig emlékeznek', IMG('5706', 'IMG_5052.jpg', 828)],
  ['Céges rendezvény', 'Partnerek és vendégek fogadása', IMG('5589', 'S350_M-CC8476_01.jpg', 828)],
  ['Forgatás, fotózás', 'Film, reklám, klip, fotózás', IMG('5569', 'IMG_9021.jpg', 828)],
  ['Üzleti út', 'Kényelem és tekintély', IMG('1110', '1711423-2026.01.19.14.15.04_api_v1_mo-prod_images_0e_0ef4f89a-377a-4547-b32d-750a72eac7e8', 828)],
];
const CATS = ['Sportautó', 'Cabrio', 'SUV', 'Limuzin'];
// márkalogók (a megküldött logókból, átlátszó háttérrel); az egyszínű Bentley-nek külön világos/sötét változat
const BRANDS = [['Ferrari', '/vip-logo-ferrari.png'], ['Porsche', '/brand-porsche.png'], ['Bentley', '/vip-logo-bentley.png', '/vip-logo-bentley-w.png'], ['Mercedes', '/vip-logo-mercedes.png'], ['BMW', '/vip-logo-bmw.png'], ['Audi', '/vip-logo-audi.png']];
const WA = 'https://wa.me/36302336060?text=' + encodeURIComponent('Szia! VIP luxusautó-bérlés miatt írok.');
const WAI = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z"/></svg>';
const CAR_OPTS = [...new Set(FLEET.map(r => r[0]))].map(n => `<option>${n}</option>`).join('');
const VIP = `<main id="ca-vipp" data-dm-skip="1">
<header class="vp-top"><div class="vp-wrap vp-top-in">
  <a class="vp-logo" href="/vip/"><span class="vp-g">CARADVANCE</span><i>VIP</i></a>
  <nav class="vp-nav"><a href="#szolgaltatas">Szolgáltatás</a><a href="#alkalmak">Alkalmak</a><a href="#flotta">Flotta</a><a href="#foglalas">Foglalás</a></nav>
  <a class="vp-back" href="/">← caradvance.hu</a>
</div></header>
<section class="vp-hero">
  <div class="vp-hero-bg" role="img" aria-label="Lamborghini Huracán és Aventador"></div>
  <div class="vp-wrap vp-hero-in">
    <div class="vp-ey">Privát luxusautó-bérlés</div>
    <h1>Egy nap.<br><span class="vp-g">Egy élmény.</span></h1>
    <p>Sport- és luxusautók napi bérlésre — személyes kapcsolattartóval, egyedi ajánlattal, diszkréten.</p>
    <div class="vp-btns"><a class="vp-btn vp-gold" href="#foglalas">Személyes ajánlatot kérek</a><a class="vp-btn vp-ghost" href="#alkalmak">Alkalmak</a></div>
  </div>
</section>
<section class="vp-perks" id="szolgaltatas"><div class="vp-wrap vp-perks-in">
  ${[['cal', 'Napi bérlés', 'Egy napra, egy hétvégére vagy egy hétre'], ['user', 'Személyes kapcsolattartó', 'Egy név, egy telefonszám — végig'], ['spark', 'Egyedi ajánlat', 'Az autót és az átvételt hozzád igazítjuk'], ['lock', 'Diszkréció', 'Csendes, gyors és megbízható ügyintézés']]
    .map(([i, t, d]) => `<div class="vp-perk"><span class="vp-ic">${svg(IC[i], 24)}</span><b>${t}</b><span>${d}</span></div>`).join('')}
</div></section>
<section class="vp-sec" id="alkalmak"><div class="vp-wrap">
  <div class="vp-ey">Alkalmak</div><h2>Minden különleges naphoz a megfelelő autó</h2>
  <div class="vp-tiles">${OCC.map(([t, d, im]) => `<a class="vp-tile" href="#foglalas" data-occ="${t}"><img src="${im}" alt="" loading="lazy" decoding="async"><span><b>${t}</b><i>${d}</i></span></a>`).join('')}</div>
</div></section>
<section class="vp-sec vp-how"><div class="vp-wrap">
  <div class="vp-ey">Hogyan működik</div><h2>Három lépés a kulcsig</h2>
  <ol class="vp-steps">
    <li><span class="vp-num">01</span><b>Válaszd ki az autót és a napot</b><span>A flottából vagy az alkalom alapján — ha még nem döntöttél, segítünk.</span></li>
    <li><span class="vp-num">02</span><b>Személyes ajánlatot kapsz</b><span>A kapcsolattartód felhív, egyeztetjük a részleteket és az átvételt.</span></li>
    <li><span class="vp-num">03</span><b>Átveszed az autót</b><span>Tiszta, tankolt autó — indulhat a nap.</span></li>
  </ol>
</div></section>
<section class="vp-sec" id="flotta"><div class="vp-wrap">
  <div class="vp-ey">VIP flotta</div><h2>Válaszd ki az autódat</h2>
  <p>Napi 200 km minden autónál, az árak áfával értendők. Néhány autó csak később lesz elérhető, a dátum a fotón látszik.</p>
  <p class="vp-rate" hidden></p>
  <div class="vp-filters">
    <div class="vp-f" data-k="cat" role="group" aria-label="Kategória"><button type="button" data-v="" aria-pressed="true">Összes</button>${CATS.map(c => `<button type="button" data-v="${c}" aria-pressed="false">${c}</button>`).join('')}</div>
    <div class="vp-f vp-fb" data-k="brand" role="group" aria-label="Márka">${BRANDS.map(([b, l, ld]) => `<button type="button" data-v="${b}" aria-pressed="false" title="${b}">${l ? `<img class="vp-bl" src="${l}" alt="${b}" loading="lazy">${ld ? `<img class="vp-bld" src="${ld}" alt="" loading="lazy">` : ''}` : `<span class="vp-bt">${b}</span>`}</button>`).join('')}</div>
    <div class="vp-fmeta"><span class="vp-fcount">${FLEET.length} autó</span><button type="button" class="vp-reset">Szűrők törlése</button></div>
  </div>
  <div class="vp-cars">
  ${FLEET_HTML}
  </div>
  <p class="vp-empty" hidden>Ebben a párosításban most nincs autónk. <button type="button" class="vp-reset2" onclick="this.closest('.vp-wrap').querySelector('.vp-reset').click()">Szűrők törlése</button></p>
</div></section>
<section class="vp-sec" id="foglalas"><div class="vp-wrap vp-book">
  <div class="vp-book-l">
    <div class="vp-ey">Foglalás</div><h2>Mondd el, milyen napot tervezel</h2>
    <p>Az autót, a dátumot és az átvételt személyesen egyeztetjük. Az ajánlatkérés nem kötelez semmire.</p>
    <div class="vp-direct">
      <a href="tel:${TEL}">${svg(IC.phone, 18)}<span><b>${TELTXT}</b><i>Hívj minket</i></span></a>
      <a href="${WA}" target="_blank" rel="noopener">${WAI}<span><b>WhatsApp</b><i>Írj nekünk most</i></span></a>
      <a href="mailto:${MAIL}?subject=VIP%20luxusaut%C3%B3-b%C3%A9rl%C3%A9s">${svg(IC.mail, 18)}<span><b>E-mail</b><i>Írásban is jó</i></span></a>
    </div>
  </div>
  <div class="vp-book-r">
    <form id="vp-form" novalidate>
      <label class="vp-fl vp-span">Autó<select name="car"><option value="">Még nem tudom — segítsetek</option>${CAR_OPTS}</select></label>
      <label class="vp-fl">Kezdete<input type="date" name="from" required></label>
      <label class="vp-fl">Vége<input type="date" name="to"></label>
      <label class="vp-fl vp-span">Alkalom<select name="occ"><option value="">Nem fontos</option>${OCC.map(o => `<option>${o[0]}</option>`).join('')}</select></label>
      <label class="vp-fl">Név<input name="n" autocomplete="name" required></label>
      <label class="vp-fl">Telefon<input name="p" type="tel" autocomplete="tel" required></label>
      <label class="vp-fl vp-span"><span>E-mail <small>(nem kötelező)</small></span><input name="e" type="email" autocomplete="email"></label>
      <label class="vp-fl vp-span"><span>Megjegyzés <small>(nem kötelező)</small></span><textarea name="m" rows="3" placeholder="Pl. átvétel helye, időpontja, különleges kérés"></textarea></label>
      <input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="vp-hp">
      <label class="vp-ck vp-span"><input type="checkbox" required> <span>Elolvastam és elfogadom az <a href="/adatkezeles/" target="_blank">adatkezelési tájékoztatót</a>.</span></label>
      <button type="submit" class="vp-btn vp-gold vp-span">Ajánlatot kérek</button>
      <p class="vp-err vp-span" hidden>Nem sikerült elküldeni. Kérlek, próbáld újra, vagy hívj minket: <a href="tel:${TEL}">${TELTXT}</a>.</p>
    </form>
    <div class="vp-ok" hidden><span class="vp-ic vp-ic-lg">${svg(IC.spark, 26)}</span><h3>Köszönjük, megkaptuk!</h3><p>Hamarosan jelentkezünk a személyes ajánlattal.</p></div>
  </div>
</div></section>
<footer class="vp-foot"><div class="vp-wrap">© ${new Date().getFullYear()} Caradvance · <a href="/">caradvance.hu</a> · <a href="/adatkezeles/">Adatkezelés</a> · <a href="/impresszum/">Impresszum</a></div></footer>
<div class="vp-bar" aria-hidden="false"><a class="vp-btn vp-gold" href="#foglalas">Ajánlatot kérek</a><a class="vp-bar-ic" href="${WA}" target="_blank" rel="noopener" aria-label="WhatsApp">${WAI}</a><a class="vp-bar-ic" href="tel:${TEL}" aria-label="Hívás: ${TELTXT}">${svg(IC.phone, 18)}</a></div>
<div class="vp-lb" id="vp-lb" hidden role="dialog" aria-modal="true" aria-label="Fotónézegető"><div class="vp-lb-top"><b class="vp-lb-h"></b><span class="vp-lb-n"></span><button type="button" class="vp-lb-x" aria-label="Bezárás">${svg('<path d="M6 6l12 12M18 6 6 18"/>', 22)}</button></div><div class="vp-lb-track"></div><button type="button" class="vp-lb-p" aria-label="Előző">${svg('<path d="m15 6-6 6 6 6"/>', 24)}</button><button type="button" class="vp-lb-nx" aria-label="Következő">${svg('<path d="m9 6 6 6-6 6"/>', 24)}</button></div>
</main>` + VIP_GAL_JS;

const VIP_CSS = `<style id="ca-dark-hu-vip">
/* a VIP egy külön világ: a fő menü és lábléc helyett saját fejléc és lábléc */
html[data-vip] body>.ca-navwrap,html[data-vip] .ca-navwrap,html[data-vip] footer.cafoot,html[data-vip] .cafoot{display:none!important}
html[data-vip] body{background:var(--vp-bg)!important}
html[data-vip]{--vp-bg:#F7F3EC;--vp-ink:#1B1712;--vp-mut:#6F6656;--vp-line:rgba(120,95,40,.2);--vp-card:#FFFDF8}
html[data-vip].ca-dark{--vp-bg:#07070A;--vp-ink:#F3EEE3;--vp-mut:#A9A08E;--vp-line:rgba(201,162,75,.22);--vp-card:linear-gradient(180deg,#121116,#0B0B0E)}
#ca-vipp{display:block;color:var(--vp-ink);background:var(--vp-bg);font-family:inherit}
#ca-vipp .vp-wrap{max-width:1200px;margin:0 auto;padding:0 28px}
#ca-vipp .vp-g{background:linear-gradient(135deg,#D9B860,#B08A35 50%,#7E5D1C);-webkit-background-clip:text;background-clip:text;color:transparent!important;-webkit-text-fill-color:transparent!important}
html.ca-dark #ca-vipp .vp-g{background-image:linear-gradient(135deg,#F3DFA2,#C9A24B 45%,#8E6A22)}
#ca-vipp .vp-top{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--vp-bg) 86%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid var(--vp-line)}
#ca-vipp .vp-top-in{display:flex;align-items:center;gap:28px;height:72px}
#ca-vipp .vp-logo{display:flex;align-items:center;gap:12px;text-decoration:none;font-weight:800;letter-spacing:.32em;font-size:14px}
#ca-vipp .vp-logo i{font-style:normal;color:var(--vp-ink);letter-spacing:.32em}
#ca-vipp .vp-nav{display:flex;gap:28px;margin-left:auto}
#ca-vipp .vp-nav a,#ca-vipp .vp-back{color:var(--vp-mut);text-decoration:none;font-size:14px;letter-spacing:.04em;transition:color .15s}
#ca-vipp .vp-nav a:hover,#ca-vipp .vp-back:hover{color:var(--vp-ink)}
#ca-vipp .vp-back{color:#B08A35;font-weight:700}
#ca-vipp .vp-hero{position:relative;overflow:hidden;min-height:max(min(100vh - 72px,900px),620px);display:flex;align-items:flex-end;padding:120px 0 44px;background:#0B0B0E}
#ca-vipp .vp-hero-bg{position:absolute;inset:0;background:url('/vip-hero-lamborghini-hq.jpg') 50% 22%/cover no-repeat}
/* a kép tisztán látszik: csak alul egy finom sötétítés a szöveg alatt, a legalján átúszik az oldal hátterébe */
#ca-vipp .vp-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,var(--vp-bg) 0%,rgba(8,8,10,.85) 10%,rgba(8,8,10,.55) 24%,rgba(8,8,10,0) 40%)}
#ca-vipp .vp-hero-in{position:relative;z-index:1;width:100%}
#ca-vipp .vp-hero h1{color:#fff!important;text-shadow:0 2px 24px rgba(0,0,0,.45);font-size:clamp(38px,4.6vw,64px)!important;margin-bottom:12px!important}
#ca-vipp .vp-hero h1 br{display:none}#ca-vipp .vp-hero h1 .vp-g{margin-left:.25em}
@media(min-width:701px){#ca-vipp .vp-hero-in{display:grid;grid-template-columns:1fr auto;align-items:end;column-gap:40px}#ca-vipp .vp-hero-in>.vp-ey,#ca-vipp .vp-hero-in>h1{grid-column:1/-1}#ca-vipp .vp-hero-in>p{margin:0!important}#ca-vipp .vp-hero-in>.vp-btns{grid-column:2;grid-row:3}}
#ca-vipp .vp-hero p{color:rgba(255,255,255,.86)!important;text-shadow:0 1px 12px rgba(0,0,0,.5)}
#ca-vipp .vp-hero .vp-ey{color:#E9CE86!important}
#ca-vipp .vp-hero .vp-ghost{color:#fff!important;border-color:rgba(255,255,255,.45)!important;background:rgba(255,255,255,.08)!important;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
#ca-vipp .vp-hero .vp-g{background-image:linear-gradient(135deg,#F3DFA2,#C9A24B 45%,#A27A2B)!important}
@media(max-width:700px){
  #ca-vipp .vp-hero{display:block;min-height:0;padding:0 0 34px;background:var(--vp-bg)}
  #ca-vipp .vp-hero-bg{position:relative;inset:auto;aspect-ratio:3/2;background-position:50% 50%}
  #ca-vipp .vp-hero:after{display:none}
  #ca-vipp .vp-hero-in{padding-top:26px}
  #ca-vipp .vp-hero h1{color:var(--vp-ink)!important;text-shadow:none}
  #ca-vipp .vp-hero p{color:var(--vp-mut)!important;text-shadow:none}
  #ca-vipp .vp-hero .vp-ey{color:#A88230!important}
  #ca-vipp .vp-hero .vp-ghost{color:var(--vp-ink)!important;border-color:var(--vp-line)!important;background:transparent!important}
  #ca-vipp .vp-hero h1 br{display:inline}#ca-vipp .vp-hero h1 .vp-g{margin-left:0}
  html:not(.ca-dark) #ca-vipp .vp-hero .vp-g{background-image:linear-gradient(135deg,#C9A24B,#A27A2B 50%,#7E5D1C)!important}
}
#ca-vipp .vp-ey{font-size:12px;font-weight:700;letter-spacing:.4em;text-transform:uppercase;margin-bottom:18px;display:inline-block;color:#A88230}
html.ca-dark #ca-vipp .vp-ey{color:#D4B062}
#ca-vipp h1{font-size:clamp(46px,7vw,86px);line-height:1;letter-spacing:-.035em;font-weight:800;margin:0 0 20px;color:var(--vp-ink)}
#ca-vipp h2{font-size:clamp(28px,3.4vw,42px);letter-spacing:-.03em;line-height:1.1;font-weight:800;margin:0 0 14px;color:var(--vp-ink)}
#ca-vipp p{color:var(--vp-mut);font-size:17px;line-height:1.65;max-width:540px;margin:0 0 28px}
#ca-vipp .vp-btns{display:flex;gap:10px;flex-wrap:wrap}
#ca-vipp .vp-btn{display:inline-flex;align-items:center;gap:9px;height:52px;padding:0 26px;border-radius:999px;font-weight:800;font-size:14.5px;letter-spacing:.04em;text-decoration:none;transition:transform .15s,box-shadow .15s}
#ca-vipp .vp-btn:hover{transform:translateY(-1px)}
#ca-vipp .vp-gold{color:#1B1407!important;background:linear-gradient(135deg,#F3DFA2,#C9A24B 45%,#8E6A22);box-shadow:0 10px 26px -10px rgba(201,162,75,.6),inset 0 1px 0 rgba(255,255,255,.5)}
#ca-vipp .vp-ghost{color:var(--vp-ink)!important;border:1px solid var(--vp-line);background:transparent}
#ca-vipp .vp-perks{padding:44px 0 10px}
#ca-vipp .vp-perks-in{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
#ca-vipp .vp-perk{display:flex;flex-direction:column;gap:6px;padding:28px 24px 26px;border-radius:24px;border:1px solid var(--vp-line);background:var(--vp-card);font-size:14.5px;line-height:1.5;color:var(--vp-mut);transition:transform .2s,box-shadow .2s}
#ca-vipp .vp-perk:hover{transform:translateY(-3px);box-shadow:0 22px 44px -28px rgba(120,95,40,.55)}
#ca-vipp .vp-perk .vp-ic{width:56px;height:56px;margin-bottom:14px;background:radial-gradient(circle at 30% 25%,rgba(243,223,162,.35),rgba(201,162,75,.08) 70%);border-color:rgba(201,162,75,.4)}
#ca-vipp .vp-perk b{color:var(--vp-ink);font-size:18px;letter-spacing:-.01em}
#ca-vipp .vp-ic{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--vp-line);color:#B08A35}
#ca-vipp .vp-ic-lg{width:64px;height:64px;flex:none}
#ca-vipp .vp-sec{padding:70px 0}
#ca-vipp .vp-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}
#ca-vipp .vp-tile{position:relative;display:block;aspect-ratio:4/3;border-radius:22px;overflow:hidden;text-decoration:none;background:#111;isolation:isolate}
#ca-vipp .vp-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
#ca-vipp .vp-tile:hover img{transform:scale(1.06)}
#ca-vipp .vp-tile:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,8,10,.82),rgba(8,8,10,.25) 45%,rgba(8,8,10,0) 70%)}
#ca-vipp .vp-tile span{position:absolute;left:20px;right:20px;bottom:18px;z-index:1;display:flex;flex-direction:column;gap:3px}
#ca-vipp .vp-tile b{color:#fff;font-size:20px;font-weight:800;letter-spacing:-.01em}
#ca-vipp .vp-tile i{font-style:normal;color:rgba(255,255,255,.8);font-size:13.5px}
#ca-vipp .vp-tile span:after{content:"Ajánlatot kérek →";margin-top:8px;color:#E9CE86;font-size:12.5px;font-weight:700;letter-spacing:.04em;opacity:0;transform:translateY(6px);transition:.25s}
#ca-vipp .vp-tile:hover span:after,#ca-vipp .vp-tile:focus-visible span:after{opacity:1;transform:none}
/* hogyan működik */
#ca-vipp .vp-how{padding-top:20px}
#ca-vipp .vp-steps{list-style:none;margin:26px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;counter-reset:s}
#ca-vipp .vp-steps li{position:relative;display:flex;flex-direction:column;gap:6px;padding:30px 26px;border-radius:24px;border:1px solid var(--vp-line);background:var(--vp-card);color:var(--vp-mut);font-size:14.5px;line-height:1.55}
#ca-vipp .vp-steps li:not(:last-child):after{content:"";position:absolute;top:50%;right:-13px;width:8px;height:8px;border-top:1.5px solid #C9A24B;border-right:1.5px solid #C9A24B;transform:translateY(-50%) rotate(45deg);z-index:1}
#ca-vipp .vp-steps b{color:var(--vp-ink);font-size:18px}
#ca-vipp .vp-num{font-size:40px;font-weight:800;letter-spacing:-.03em;line-height:1;margin-bottom:12px;background:linear-gradient(135deg,#F3DFA2,#C9A24B 45%,#8E6A22);-webkit-background-clip:text;background-clip:text;color:transparent}
/* szűrők */
#ca-vipp .vp-rate{font-size:13.5px;margin:-16px 0 0}
#ca-vipp .vp-filters{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;margin-top:26px;padding:14px;border-radius:22px;border:1px solid var(--vp-line);background:var(--vp-card)}
#ca-vipp .vp-f{display:flex;flex-wrap:wrap;gap:6px}
#ca-vipp .vp-f button{height:40px;padding:0 16px;border-radius:999px;border:1px solid var(--vp-line);background:transparent;color:var(--vp-ink);font-family:inherit;font-size:14px;font-weight:600;line-height:1;cursor:pointer;transition:background-color .15s,border-color .15s,color .15s}
#ca-vipp .vp-f button:hover{border-color:#C9A24B}
#ca-vipp .vp-f button[aria-pressed="true"]{background:linear-gradient(135deg,#F3DFA2,#C9A24B 45%,#8E6A22);border-color:transparent;color:#1B1407}
#ca-vipp .vp-fb{padding-left:18px;border-left:1px solid var(--vp-line)}
#ca-vipp .vp-fb button{display:inline-flex;align-items:center;justify-content:center;min-width:64px;padding:0 12px}
#ca-vipp .vp-fb img{height:26px;width:auto;max-width:84px;object-fit:contain}#ca-vipp .vp-fb button[data-v=Bentley] img{height:20px}#ca-vipp .vp-fb button[aria-pressed="true"]{background:#E4E2DE;border-color:#8F8B84;box-shadow:inset 0 0 0 1px #8F8B84}html.ca-dark #ca-vipp .vp-fb button[aria-pressed="true"]{background:#000;border-color:#6B6B70;box-shadow:inset 0 0 0 1px #6B6B70}#ca-vipp .vp-fb button[data-v=Audi] img{height:22px}
#ca-vipp .vp-bld{display:none}html.ca-dark #ca-vipp .vp-bld{display:block}html.ca-dark #ca-vipp .vp-fb button:has(.vp-bld) .vp-bl{display:none}
#ca-vipp .vp-bt{font-size:11.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}

#ca-vipp .vp-fmeta{margin-left:auto;display:flex;align-items:center;gap:14px;font-size:13.5px;color:var(--vp-mut);font-weight:600}
#ca-vipp .vp-reset,#ca-vipp .vp-reset2{border:0;background:none;color:#B08A35;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}
#ca-vipp .vp-empty{max-width:none;text-align:center;margin:30px 0 0}
#ca-vipp .vp-car[hidden]{display:none!important}
#ca-vipp .vp-huf{color:var(--vp-ink);font-weight:700}
/* fotónézegető */
#ca-vipp .vp-zoom{position:absolute;right:14px;top:14px;z-index:2;width:38px;height:38px;border-radius:50%;border:0;display:flex;align-items:center;justify-content:center;background:rgba(10,10,12,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#fff;cursor:pointer;opacity:.85;transition:opacity .15s,transform .15s}
#ca-vipp .vp-zoom:hover{opacity:1;transform:scale(1.06)}
#ca-vipp .vp-gal img{cursor:zoom-in}
html.vp-lock,html.vp-lock body{overflow:hidden!important}
#ca-vipp .vp-lb{position:fixed;inset:0;z-index:9999;background:rgba(5,5,7,.97);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);display:flex;flex-direction:column}
#ca-vipp .vp-lb[hidden]{display:none}
#ca-vipp .vp-lb-top{display:flex;align-items:center;gap:16px;padding:16px 20px;color:#fff}
#ca-vipp .vp-lb-h{font-size:16px}#ca-vipp .vp-lb-n{color:rgba(255,255,255,.6);font-size:13.5px;font-variant-numeric:tabular-nums}
#ca-vipp .vp-lb-x{margin-left:auto;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}
#ca-vipp .vp-lb-track{flex:1;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;min-height:0}
#ca-vipp .vp-lb-track::-webkit-scrollbar{display:none}
#ca-vipp .vp-lb-track img{flex:0 0 100%;width:100%;height:100%;object-fit:contain;scroll-snap-align:center;padding:0 4vw 4vh}
#ca-vipp .vp-lb-p,#ca-vipp .vp-lb-nx{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}
#ca-vipp .vp-lb-p{left:18px}#ca-vipp .vp-lb-nx{right:18px}
@media(max-width:700px){#ca-vipp .vp-lb-p,#ca-vipp .vp-lb-nx{display:none}#ca-vipp .vp-lb-track img{padding:0}}
/* foglalás */
#ca-vipp .vp-book{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:48px;align-items:start}
#ca-vipp .vp-direct{display:flex;flex-direction:column;gap:10px;max-width:380px}
#ca-vipp .vp-direct a{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:18px;border:1px solid var(--vp-line);background:var(--vp-card);color:#B08A35;text-decoration:none;transition:border-color .15s,transform .15s}
#ca-vipp .vp-direct a:hover{border-color:#C9A24B;transform:translateX(3px)}
#ca-vipp .vp-direct span{display:flex;flex-direction:column}
#ca-vipp .vp-direct b{color:var(--vp-ink);font-size:15.5px}#ca-vipp .vp-direct i{font-style:normal;color:var(--vp-mut);font-size:13px}
#ca-vipp .vp-book-r{padding:30px;border-radius:28px;border:1px solid var(--vp-line);background:radial-gradient(70% 60% at 100% 0%,rgba(201,162,75,.16),transparent 70%),var(--vp-card);box-shadow:0 30px 60px -40px rgba(120,95,40,.5)}
#vp-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
#ca-vipp .vp-span{grid-column:1/-1}
#ca-vipp .vp-fl{display:flex;flex-direction:column;gap:6px;font-size:12.5px;font-weight:700;letter-spacing:.06em;color:var(--vp-mut)}
#ca-vipp .vp-fl small{font-weight:500;letter-spacing:0}
#ca-vipp .vp-fl :is(input,select,textarea){height:50px;padding:0 14px;border-radius:14px;border:1px solid var(--vp-line);background:var(--vp-bg);color:var(--vp-ink);font-family:inherit;font-size:15.5px;font-weight:500;line-height:1.3;letter-spacing:0;outline:none;transition:border-color .15s,box-shadow .15s;color-scheme:light}
html.ca-dark #ca-vipp .vp-fl :is(input,select,textarea){color-scheme:dark;background:#0E0E11!important;border-color:rgba(201,162,75,.22)!important;color:#F3EEE3!important}
#ca-vipp .vp-fl textarea{height:auto;padding:12px 14px;resize:vertical}
#ca-vipp .vp-fl :is(input,select,textarea):focus{border-color:#C9A24B;box-shadow:0 0 0 3px rgba(201,162,75,.22)}
#ca-vipp .vp-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
#ca-vipp .vp-ck{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:var(--vp-mut);line-height:1.45}
#ca-vipp .vp-ck input{width:18px;height:18px;margin:1px 0 0;accent-color:#C9A24B;flex:none}
#ca-vipp .vp-ck a{color:#B08A35}
#vp-form .vp-btn{justify-content:center;border:0;cursor:pointer;font-family:inherit;height:56px;font-size:15.5px}
#vp-form .vp-btn:disabled{opacity:.6;cursor:wait}
#ca-vipp .vp-err{margin:0;font-size:14px;color:#C2410C}
#ca-vipp .vp-ok{text-align:center;padding:40px 10px}#ca-vipp .vp-ok .vp-ic{margin:0 auto 16px;color:#B08A35}#ca-vipp .vp-ok h3{font-size:24px;margin:0 0 6px;color:var(--vp-ink)}#ca-vipp .vp-ok p{margin:0 auto}
/* lebegő sáv */
#ca-vipp .vp-bar{position:fixed;left:50%;bottom:18px;z-index:60;display:flex;align-items:center;gap:8px;padding:8px;border-radius:999px;background:color-mix(in srgb,var(--vp-bg) 80%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid var(--vp-line);box-shadow:0 18px 40px -16px rgba(0,0,0,.45);transform:translate(-50%,140%);opacity:0;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .25s;pointer-events:none}
#ca-vipp .vp-bar.on{transform:translate(-50%,0);opacity:1;pointer-events:auto}
#ca-vipp .vp-bar .vp-btn{height:48px;width:auto!important}
#ca-vipp .vp-bar-ic{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--vp-line);color:var(--vp-ink);text-decoration:none}
#ca-vipp .vp-bar-ic:first-of-type{color:#25D366}
@media(max-width:900px){#ca-vipp .vp-tiles{grid-template-columns:1fr 1fr}#ca-vipp .vp-steps{grid-template-columns:1fr}#ca-vipp .vp-steps li:after{display:none}#ca-vipp .vp-book{grid-template-columns:1fr;gap:28px}#ca-vipp .vp-fb{padding-left:0;border-left:0}#ca-vipp .vp-fmeta{margin-left:0;width:100%;justify-content:space-between}}
@media(max-width:600px){#ca-vipp .vp-tiles{grid-template-columns:1fr 1fr;gap:10px}#ca-vipp .vp-tile{aspect-ratio:1}#ca-vipp .vp-tile span{left:14px;right:14px;bottom:12px}#ca-vipp .vp-tile b{font-size:16px}#ca-vipp .vp-tile i{display:none}#vp-form{grid-template-columns:1fr}#ca-vipp .vp-book-r{padding:20px}#ca-vipp .vp-f{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px}#ca-vipp .vp-f button{flex:none}#ca-vipp .vp-filters{display:block}#ca-vipp .vp-filters>*+*{margin-top:10px}#ca-vipp .vp-bar{left:12px;right:12px;bottom:12px;transform:translateY(140%)}#ca-vipp .vp-bar.on{transform:none}#ca-vipp .vp-bar .vp-btn{flex:1}}
#ca-vipp .vp-fleet{display:flex;gap:28px;align-items:flex-start;padding:40px;border-radius:28px;border:1px solid var(--vp-line);background:var(--vp-card)}
#ca-vipp .vp-fleet p{margin:0}
#ca-vipp .vp-cars{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:30px}
#ca-vipp .vp-car{position:relative;display:flex;flex-direction:column;border-radius:24px;overflow:hidden;border:1px solid var(--vp-line);background:var(--vp-card);transition:transform .2s,box-shadow .2s}
#ca-vipp .vp-car:hover{transform:translateY(-3px);box-shadow:0 24px 50px -28px rgba(120,95,40,.55)}
#ca-vipp .vp-gal{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;aspect-ratio:3/2;background:#111;scrollbar-width:none;outline:none}
#ca-vipp .vp-gal::-webkit-scrollbar{display:none}
#ca-vipp .vp-gal img{flex:0 0 100%;width:100%;height:100%;object-fit:cover;scroll-snap-align:start}
#ca-vipp .vp-dots{position:relative;display:flex;justify-content:center;align-items:center;gap:5px;margin-top:-24px;height:24px;z-index:2}
#ca-vipp .vp-dots i{width:6px;height:6px;border-radius:999px;background:rgba(255,255,255,.55);cursor:pointer;transition:width .2s,background-color .2s}
#ca-vipp .vp-dots i.on{width:18px;background:#fff!important}
#ca-vipp .vp-av{position:absolute;left:14px;top:14px;display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;background:rgba(10,10,12,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#fff;font-size:12px;font-weight:700}
#ca-vipp .vp-av i{width:7px;height:7px;border-radius:50%;background:#30D158}
#ca-vipp .vp-av-later i{background:#FF9F0A}
#ca-vipp .vp-nophoto{flex:0 0 100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:radial-gradient(70% 70% at 50% 40%,#2A2620,#0B0B0E);color:#A9A08E;font-size:13px;letter-spacing:.08em}
#ca-vipp .vp-nophoto span{font-size:34px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;background:linear-gradient(135deg,#F3DFA2,#C9A24B 45%,#8E6A22);-webkit-background-clip:text;background-clip:text;color:transparent}
#ca-vipp .vp-cb{display:grid;grid-template-columns:1fr auto;column-gap:16px;padding:20px 22px 22px;flex:1;align-items:end}
#ca-vipp .vp-cb>.vp-cat,#ca-vipp .vp-cb>h3,#ca-vipp .vp-cb>.vp-specs{grid-column:1/-1}
#ca-vipp .vp-cb>.vp-more{grid-column:1;grid-row:5;display:flex;gap:16px;margin-top:6px;font-size:12.5px;color:var(--vp-mut)}
#ca-vipp .vp-more b{color:var(--vp-ink);font-weight:700}
#ca-vipp .vp-cb>.vp-ask{grid-column:2;grid-row:4/6;align-self:center}
#ca-vipp .vp-cb>.vp-pr{margin:0!important}
#ca-vipp .vp-cb>.vp-ask{width:auto!important;padding:0 26px}
@media(max-width:640px){#ca-vipp .vp-cb{grid-template-columns:1fr}#ca-vipp .vp-cb>*{grid-column:1!important;grid-row:auto!important}#ca-vipp .vp-cb>.vp-more{margin:0 0 14px!important}#ca-vipp .vp-cb>.vp-pr{margin:0 0 14px!important}#ca-vipp .vp-cb>.vp-ask{width:100%!important}}
#ca-vipp .vp-cat{font-size:11.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--vp-mut)}
#ca-vipp .vp-car h3{font-size:23px;font-weight:800;letter-spacing:-.015em;margin:4px 0 12px;color:var(--vp-ink)}
#ca-vipp .vp-specs{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:16px}
#ca-vipp .vp-specs span{height:26px;display:inline-flex;align-items:center;padding:0 10px;border-radius:999px;border:1px solid var(--vp-line);font-size:12px;font-weight:600;color:var(--vp-ink)}
#ca-vipp .vp-pr{display:flex;align-items:baseline;gap:8px;margin:auto 0 16px}
#ca-vipp .vp-pr b{font-size:26px;font-weight:800;letter-spacing:-.02em}
#ca-vipp .vp-pr span{font-size:12.5px;color:var(--vp-mut);font-weight:600}
#ca-vipp .vp-ask{justify-content:center;height:48px;width:100%}
@media(max-width:640px){#ca-vipp .vp-cars{grid-template-columns:1fr}}
#ca-vipp .vp-cta{text-align:center;padding:64px 28px;border-radius:32px;border:1px solid var(--vp-line);background:radial-gradient(60% 120% at 50% 120%,rgba(201,162,75,.22),transparent 70%),var(--vp-card)}
#ca-vipp .vp-cta p{margin:0 auto 26px}#ca-vipp .vp-cta .vp-btns{justify-content:center}
#ca-vipp .vp-foot{padding:34px 0 44px;border-top:1px solid var(--vp-line);font-size:13px;color:var(--vp-mut)}
#ca-vipp .vp-foot a{color:var(--vp-mut);text-decoration:none}#ca-vipp .vp-foot a:hover{color:var(--vp-ink)}
#ca-vipp [id]{scroll-margin-top:90px}
@media(max-width:900px){#ca-vipp .vp-nav{display:none}#ca-vipp .vp-back{margin-left:auto}#ca-vipp .vp-perks-in{grid-template-columns:1fr 1fr}}
@media(max-width:600px){#ca-vipp .vp-wrap{padding:0 18px}#ca-vipp .vp-perks-in{grid-template-columns:1fr 1fr;gap:10px}#ca-vipp .vp-perk{padding:18px 16px;font-size:13px}#ca-vipp .vp-perk .vp-ic{width:44px;height:44px;margin-bottom:8px}#ca-vipp .vp-perk b{font-size:15.5px}#ca-vipp .vp-steps li{display:grid;grid-template-columns:auto 1fr;column-gap:16px;padding:20px 18px}#ca-vipp .vp-steps .vp-num{grid-row:1/3;font-size:32px;margin:0}#ca-vipp .vp-cb>.vp-more{flex-wrap:wrap;row-gap:4px}#ca-vipp .vp-huf{flex:0 0 100%}#ca-vipp .vp-fleet{flex-direction:column;padding:26px}#ca-vipp .vp-btn{width:100%;justify-content:center}#ca-vipp .vp-logo{letter-spacing:.2em;font-size:12.5px}}
</style>`;

function make(tpl, slug, title, desc, main, css, extraHtmlAttr) {
  let t = tpl
    .replace(/<link rel="canonical"[^>]*>\s*/g, '')
    .replace(/<link rel="alternate" hreflang[^>]*>\s*/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '')
    .replace(/<meta property="og:(url|title|description)"[^>]*>\s*/g, '')
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${desc}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<head>/, `<head><link rel="canonical" href="${SITE}/${slug}/"><meta property="og:url" content="${SITE}/${slug}/"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">`)
    .replace(/<main[\s>][\s\S]*?<\/main>/, () => main)
    .replace('</head>', css + '</head>')
    .replace(/(<a[^>]*href="\/impresszum\/?")\s+aria-current="page"/g, '$1')
    .replace(/(class="langopt" href=")(\/(?:[a-z]{2}\/)?)impresszum\/"/g, '$1$2"')
    .replace(/(href="https:\/\/www\.caradvance\.(?:sk|cz)\/)impresszum\/"/g, '$1"');
  if (extraHtmlAttr) t = t.replace(/<html\b/, '<html ' + extraHtmlAttr);
  const dir = path.join(DIST, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), t);
}

function run() {
  const tplF = ['impresszum', 'adatkezeles', 'aszf'].map(d => path.join(DIST, d, 'index.html')).find(f => fs.existsSync(f));
  if (!tplF) return 'nincs sablon oldal — kihagyva';
  const tpl = fs.readFileSync(tplF, 'utf8');
  if (!/<html[^>]*lang="hu"/.test(tpl) || (tpl.match(/<main[\s>]/g) || []).length !== 1) return 'a sablon nem megfelelő — kihagyva';
  make(tpl, 'cegeknek', 'Cégeknek — Benchmark, rendezvények, céges bérlet | CarAdvance',
    'Benchmark: bármely autó beszerzése tesztre, összehasonlításra és rendezvényekre, bérelve vagy megvásárolva. Autós céges rendezvények, céges tartós bérlet.', CORP, CORP_CSS);
  make(tpl, 'vip', 'VIP luxusautó-bérlés — CarAdvance',
    'Privát luxusautó-bérlés: sport- és luxusautók napi bérlésre, személyes kapcsolattartóval és egyedi ajánlattal.', VIP, VIP_CSS, 'data-vip="1"');
  return 'kész: /cegeknek/, /vip/ (sablon: ' + path.relative(DIST, tplF) + ')';
}
try { console.log('[hu-pages] ' + run()); } catch (e) { console.log('[hu-pages] hiba: ' + (e && e.message || e)); }
