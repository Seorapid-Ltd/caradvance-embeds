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
// adatsorok a Romans-féle tiszta kártyához (címke: érték)
const ROWS = (cat, specs) => {
  const r = [['Kategória', cat]];
  const hp = specs.find(x => /LE$/.test(x)); if (hp) r.push(['Teljesítmény', hp]);
  const seat = specs.find(x => /ülés$/.test(x)); if (seat) r.push(['Ülések', seat.replace(' ülés', '')]);
  r.push(['Váltó', specs.includes('Automata') ? 'Automata' : '—']);
  if (specs.includes('Összkerék')) r.push(['Hajtás', 'Összkerék']);
  r.push(['Futásteljesítmény', '200 km / nap']);
  return r;
};
const FLEET_HTML = FLEET.map(([name, cat, price, we, wk, specs, id, imgs]) => `<article class="vp-car" data-cat="${cat}" data-brand="${BRAND(name)}">
    <h3>${name}</h3>
    <div class="vp-media">
      <div class="vp-gal" tabindex="0" aria-label="${name} fotói">${NOPHOTO[id] ? `<div class="vp-nophoto"><span>${name.split(' ')[0]}</span>Fotó hamarosan</div>` : imgs.map((f, i) => `<img src="${IMG(id, f)}" data-big="${IMG(id, f, 1920)}" alt="${name}${i ? ' – ' + (i + 1) + '. fotó' : ''}" loading="lazy" decoding="async" width="1080" height="720">`).join('')}</div>
      ${NOPHOTO[id] ? '' : `<button type="button" class="vp-zoom" aria-label="${name} fotói teljes képernyőn">${svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', 17)}</button>`}
      ${imgs.length > 1 && !NOPHOTO[id] ? `<button type="button" class="vp-arr vp-arr-p" aria-label="Előző fotó" disabled>${svg('<path d="m15 6-6 6 6 6"/>', 20)}</button><button type="button" class="vp-arr vp-arr-n" aria-label="Következő fotó">${svg('<path d="m9 6 6 6-6 6"/>', 20)}</button>` : ''}
      ${imgs.length > 1 && !NOPHOTO[id] ? `<div class="vp-dots">${imgs.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
      <span class="vp-av${AVAIL[id] ? ' vp-av-later' : ''}">${AVAIL[id] ? 'Elérhető ' + AVAIL[id] : 'Azonnal elérhető'}</span>
    </div>
    <div class="vp-cb">
      <div class="vp-prrow"><span>Napidíj</span>${price ? `<b>${eur(price)}</b>` : `<b>Ár kérésre</b>`}</div>
      ${price ? `<div class="vp-prsub"><span class="vp-huf" data-eur="${price}" hidden></span><span>áfával</span></div>` : ''}
      <dl class="vp-rows">${ROWS(cat, specs).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}${price ? `<div><dt>Hétvége</dt><dd>${eur(we)}</dd></div><div><dt>Egy hét</dt><dd>${eur(wk)}</dd></div>` : ''}</dl>
      <a class="vp-btn vp-gold vp-ask" href="#foglalas" data-car="${name}">Ajánlatot kérek</a>
    </div>
  </article>`).join('\n  ');
// galéria-pöttyök, teljes képernyős fotónézegető, szűrők, napi forint-árfolyam, foglalási űrlap (/api/lead), lebegő sáv
const VIP_GAL_JS = `<script id="ca-vip-gal">(function(){var R=document.getElementById('ca-vipp');if(!R)return;var $$=function(s,c){return [].slice.call((c||R).querySelectorAll(s))};
$$('.vp-car').forEach(function(c){var g=c.querySelector('.vp-gal'),d=c.querySelectorAll('.vp-dots i'),ap=c.querySelector('.vp-arr-p'),an=c.querySelector('.vp-arr-n');if(!g||!d.length)return;
function at(){var i=Math.round(g.scrollLeft/g.clientWidth);[].forEach.call(d,function(x,k){x.className=k===i?'on':''});if(ap){ap.disabled=i<=0;an.disabled=i>=d.length-1}}
g.addEventListener('scroll',at,{passive:true});
if(ap){ap.addEventListener('click',function(e){e.stopPropagation();g.scrollTo({left:(Math.round(g.scrollLeft/g.clientWidth)-1)*g.clientWidth,behavior:'smooth'})});an.addEventListener('click',function(e){e.stopPropagation();g.scrollTo({left:(Math.round(g.scrollLeft/g.clientWidth)+1)*g.clientWidth,behavior:'smooth'})})}
g.addEventListener('keydown',function(e){if(e.key==='ArrowRight'&&an)an.click();if(e.key==='ArrowLeft'&&ap)ap.click()});[].forEach.call(d,function(x,k){x.addEventListener('click',function(){g.scrollTo({left:k*g.clientWidth,behavior:'smooth'})})})});
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
var F={cat:'',brand:'',rec:null},cnt=R.querySelector('.vp-fcount'),rn=R.querySelector('.vp-recnote');
function filt(){var n=0;$$('.vp-car').forEach(function(c){var ok=(!F.cat||c.dataset.cat===F.cat)&&(!F.brand||c.dataset.brand===F.brand)&&(!F.rec||F.rec.indexOf(c.querySelector('h3').textContent)>-1);c.hidden=!ok;if(ok)n++});cnt.textContent=n+' autó';R.querySelector('.vp-empty').hidden=n>0}
$$('.vp-f button').forEach(function(b){b.addEventListener('click',function(){var k=b.parentNode.dataset.k,v=b.dataset.v;F.rec=null;rn.hidden=true;if(k==='brand'&&F.brand===v)v='';F[k]=v;$$('button',b.parentNode).forEach(function(x){x.setAttribute('aria-pressed',x.dataset.v===v?'true':'false')});filt()})});
function resetAll(){F.cat='';F.brand='';F.rec=null;rn.hidden=true;$$('.vp-f button').forEach(function(x){x.setAttribute('aria-pressed',x.dataset.v===''?'true':'false')});filt()}
R.querySelector('.vp-reset').addEventListener('click',resetAll);R.querySelector('.vp-reset3').addEventListener('click',resetAll);
$$('.vp-tile').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();resetAll();F.rec=a.dataset.cars.split('|');rn.firstChild.textContent=a.dataset.occ+' — ajánlott autók:';rn.hidden=false;filt();document.getElementById('flotta').scrollIntoView({behavior:'smooth'})})});
/* forint: napi EUR/HUF árfolyam, tájékoztató jelleggel */
fetch('https://open.er-api.com/v6/latest/EUR').then(function(r){return r.json()}).then(function(d){var k=d&&d.rates&&d.rates.HUF;if(!k)return;$$('.vp-huf').forEach(function(s){s.textContent='≈ '+(Math.round(s.dataset.eur*k/1000)*1000).toLocaleString('hu-HU')+' Ft';s.hidden=false});var r=R.querySelector('.vp-rate');if(r){r.textContent='Forintban a napi árfolyammal (1 € ≈ '+k.toFixed(1).replace('.',',')+' Ft), tájékoztató jelleggel.';r.hidden=false}}).catch(function(){});
/* foglalás: 3 lépés + élő összesítő */
var f=document.getElementById('vp-form'),CARS={},FX=0;try{CARS=JSON.parse(document.getElementById('vp-cars').textContent)}catch(_){}
var steps=$$('.vp-step',f),pr=$$('.vp-prog li'),cur=1,er=f.querySelector('.vp-err'),bPrev=f.querySelector('.vp-prev'),bNext=f.querySelector('.vp-next'),bSend=f.querySelector('.vp-send');
function rv(n){var x=f.querySelector('input[name='+n+']:checked');return x?x.value:''}
function setRadio(n,v){$$('input[name='+n+']',f).forEach(function(x){x.checked=x.value===v})}
function go(n){cur=n;steps.forEach(function(s){s.hidden=+s.dataset.s!==n});pr.forEach(function(l,k){l.className=k+1<n?'done':k+1===n?'on':''});bPrev.hidden=n===1;bNext.hidden=n===3;bSend.hidden=n!==3;er.hidden=true}
function bad(msg,el){er.textContent=msg;er.hidden=false;el&&el.focus&&el.focus()}
function okStep(n){if(n===1){if(!f.from.value)return bad('Válaszd ki az átvétel napját.',f.from),false;if(!f.to.value)return bad('Válaszd ki a visszahozatal napját.',f.to),false;if(f.to.value<f.from.value)return bad('A visszahozatal nem lehet korábban, mint az átvétel.',f.to),false;if(rv('place')==='Más helyszín'&&!f.addr.value.trim())return bad('Add meg a helyszín címét.',f.addr),false}
if(n===3){if(!f.n.value.trim())return bad('Add meg a neved.',f.n),false;if(f.p.value.replace(/\D/g,'').length<8)return bad('Adj meg egy érvényes telefonszámot.',f.p),false;if(f.e.value&&!/^\S+@\S+\.\S+$/.test(f.e.value))return bad('Az e-mail cím nem tűnik helyesnek.',f.e),false;if(rv('via')==='E-mail'&&!f.e.value)return bad('E-mailes kapcsolathoz add meg az e-mail címed.',f.e),false;if(!f.ok.checked)return bad('Kérlek, fogadd el az adatkezelési tájékoztatót.',f.ok),false}return true}
bNext.addEventListener('click',function(){if(okStep(cur)){go(cur+1);document.getElementById('foglalas').scrollIntoView({behavior:'smooth'})}});
bPrev.addEventListener('click',function(){go(cur-1)});
pr.forEach(function(l,k){l.addEventListener('click',function(){if(k+1<cur)go(k+1)})});
var td=new Date(),iso=function(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)};f.from.min=iso(td);f.to.min=iso(td);
f.from.addEventListener('change',function(){f.to.min=f.from.value||iso(td);if(!f.to.value||f.to.value<f.from.value){var d=new Date(f.from.value);d.setDate(d.getDate()+1);f.to.value=iso(d)}sum()});
var MON=['jan.','febr.','márc.','ápr.','máj.','jún.','júl.','aug.','szept.','okt.','nov.','dec.'],DAY=['vasárnap','hétfő','kedd','szerda','csütörtök','péntek','szombat'];
function hd(v){var d=new Date(v+'T12:00:00');return MON[d.getMonth()]+' '+d.getDate()+'. ('+DAY[d.getDay()]+')'}
function days(){if(!f.from.value||!f.to.value)return 0;return Math.max(1,Math.round((new Date(f.to.value)-new Date(f.from.value))/864e5))}
function fmt(n){return '€'+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function est(c,n){if(!c||!c[0]||!n)return 0;var p=c[0],we=c[1],wk=c[2],t=n*p;if(n>=7&&wk)t=Math.min(t,Math.floor(n/7)*wk+(n%7)*p);var d=new Date(f.from.value+'T12:00:00').getDay();if(n<=3&&we&&(d===5||d===6))t=Math.min(t,we+Math.max(0,n-(d===5?3:2))*p);return t}
var sm=R.querySelector('.vp-sum');
function sum(){var car=rv('car'),c=CARS[car],n=days(),im=sm.querySelector('.vp-sum-img');
sm.querySelector('.vp-sum-car').textContent=car||'Még nem választottál autót';
if(c&&c[3])im.style.setProperty('background-image','url("'+c[3]+'")','important');else im.style.removeProperty('background-image');im.classList.toggle('has',!!(c&&c[3]));
sm.querySelector('.vp-sum-dates').textContent=f.from.value?hd(f.from.value)+(f.to.value?' – '+hd(f.to.value):''):'—';
sm.querySelector('.vp-sum-days').textContent=n?n+' nap':'—';
sm.querySelector('.vp-sum-place').textContent=rv('place')==='Más helyszín'?(f.addr.value.trim()||'Más helyszínen'):'Nálatok, a telephelyen';
sm.querySelector('.vp-sum-occ').textContent=rv('occ')||'—';
var e=est(c,n),eb=sm.querySelector('.vp-sum-eur'),hb=sm.querySelector('.vp-sum-huf');
if(car&&c&&!c[0]){eb.textContent='Ár kérésre';hb.textContent=''}else if(e){eb.textContent=fmt(e);hb.textContent=FX?'≈ '+(Math.round(e*FX/1000)*1000).toLocaleString('hu-HU')+' Ft · napi árfolyamon':''}else{eb.textContent='—';hb.textContent=car?'Válaszd ki a dátumokat':'Válassz autót és dátumot'}}
f.addEventListener('change',function(e){if(e.target.name==='place')f.querySelector('.vp-addr').hidden=rv('place')!=='Más helyszín';sum()});f.addr.addEventListener('input',sum);
fetch('https://open.er-api.com/v6/latest/EUR').then(function(r){return r.json()}).then(function(d){if(d&&d.rates&&d.rates.HUF){FX=d.rates.HUF;sum()}}).catch(function(){});
function pick(car,o){if(car)setRadio('car',car);if(o)setRadio('occ',o);sum();go(1);document.getElementById('foglalas').scrollIntoView({behavior:'smooth'});var x=f.querySelector('input[name=car]:checked');x&&x.closest('label').scrollIntoView({block:'nearest',inline:'center'})}
$$('.vp-ask').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();pick(a.dataset.car,'')})});
$$('.vp-tile').forEach(function(a){a.addEventListener('click',function(){setRadio('occ',a.dataset.occ);sum()})});
f.addEventListener('submit',function(e){e.preventDefault();if(!okStep(3))return;
var ref='VIP-'+('0'+td.getDate()).slice(-2)+('0'+(td.getMonth()+1)).slice(-2)+'-'+Math.random().toString(36).slice(2,6).toUpperCase(),car=rv('car'),n=days(),c=CARS[car],ee=est(c,n);
var data={"Típus":"VIP luxusautó-bérlés – foglalási kérés","Azonosító":ref,"Autó":car||"Még nem tudom – segítséget kér","Átvétel napja":f.from.value,"Visszahozatal napja":f.to.value,"Bérlési napok":String(n),"Átvétel ideje":f.time.value,"Átvétel helye":rv('place')==='Más helyszín'?'Más helyszín: '+f.addr.value.trim():'Caradvance telephely',"Alkalom":rv('occ')||"Nem adta meg","Különleges kérés":f.m.value.trim(),"Becsült díj (oldal szerint)":ee?fmt(ee)+' (áfával)':'',"Név":f.n.value.trim(),"Telefon":f.p.value.trim(),"E-mail":f.e.value.trim().toLowerCase(),"Kapcsolatfelvétel módja":rv('via'),"Mikor hívható":rv('when'),"Adatkezelés":"Adatkezelési tájékoztató elfogadva ("+new Date().toISOString()+")","website":f.website.value};
try{if(window.caLeadExtras){var x=window.caLeadExtras();for(var k in x)data[k]=x[k]}else data.page=location.href}catch(_){data.page=location.href}
bSend.disabled=true;bSend.firstChild.nodeValue='Küldés… ';
fetch("/api/lead",{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)}).then(function(r){return r.json().catch(function(){return{ok:r.ok}})}).then(function(j){if(!j||!j.ok)throw 0;try{window.caFireLead&&window.caFireLead("vip")}catch(_){}
var ok=R.querySelector('.vp-ok');ok.querySelector('.vp-ref').textContent=ref;ok.querySelector('.vp-tl-via').textContent={'Telefon':'Telefonon','WhatsApp':'WhatsAppon','E-mail':'E-mailben'}[rv('via')]+(rv('when')!=='Bármikor'?', '+rv('when').toLowerCase():'');ok.querySelector('.vp-tl-date').textContent=hd(f.from.value)+(f.time.value!=='Egyeztetjük'?', '+f.time.value:'');
f.hidden=true;R.querySelector('.vp-prog').hidden=true;ok.hidden=false;ok.scrollIntoView({behavior:'smooth',block:'center'})}).catch(function(){bSend.disabled=false;bSend.firstChild.nodeValue='Ajánlatot kérek ';bad('Nem sikerült elküldeni. Kérlek, próbáld újra, vagy hívj minket: +36 30 233 6060.')})});
sum();
/* lebegő sáv: a fejléckép után jelenik meg, a foglalási résznél és a lábléc közelében eltűnik */
var bar=R.querySelector('.vp-bar'),hero=R.querySelector('.vp-hero'),bk=document.getElementById('foglalas');
var fl=document.getElementById('flotta');function bs(){var y=hero.getBoundingClientRect().bottom<60,b=bk.getBoundingClientRect(),inF=b.top<innerHeight&&b.bottom>0,q=fl.getBoundingClientRect(),inQ=q.top<innerHeight*.6&&q.bottom>innerHeight*.4;bar.classList.toggle('on',y&&!inF&&!inQ)}
addEventListener('scroll',bs,{passive:true});addEventListener('resize',bs);bs();
/* parallax és beúszás */
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!RM){document.documentElement.classList.add('vp-anim');
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vp-in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
$$('[data-rv]').forEach(function(el){io.observe(el)});
$$('.vp-perk,.vp-tile,.vp-steps li,.vp-car').forEach(function(el,k){el.setAttribute('data-rv','');el.style.setProperty('--d',(k%3)*90+'ms');io.observe(el)});
var hb=R.querySelector('.vp-hero-bg'),hi=R.querySelector('.vp-hero-in'),tk=0;
function px(){tk=0;var y=scrollY,h=hero.offsetHeight,wide=innerWidth>700;if(!wide){hb.style.transform='';return}if(y<h+200){var r=Math.min(1,y/h);hb.style.transform='translate3d(0,'+(y*(wide?.38:.22)).toFixed(1)+'px,0) scale('+(1.06+r*.06).toFixed(3)+')';if(wide){hi.style.transform='translate3d(0,'+(y*.18).toFixed(1)+'px,0)';hi.style.opacity=Math.max(0,1-r*1.5).toFixed(3)}}
}
addEventListener('scroll',function(){if(!tk)tk=requestAnimationFrame(px)},{passive:true});addEventListener('resize',px);px()}
})();</script>`;

// Alkalmak: színes ikonos kártyák kép nélkül — a fotók szerepe a flottáé. Kattintásra a flotta az ajánlott autókra szűr.
const OI = {
  wed: '<circle cx="9" cy="14" r="5.5"/><circle cx="15" cy="14" r="5.5"/><path d="M10.5 3.5h3l1.5 2-3 2.5-3-2.5z"/>',
  sun: '<path d="M3 18h18"/><path d="M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="M12 6v3M4.9 9.9l2.1 2.1M19.1 9.9 17 12M7 21h10"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M2.5 9h19v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 8.5z"/><path d="M12 7v13.5"/><path d="M12 7C10.5 4 7 3.5 7 5.5S10 7 12 7zM12 7c1.5-3 5-3.5 5-1.5S14 7 12 7z"/>',
  glass: '<path d="M7 3h10l-1 7a4 4 0 0 1-8 0z"/><path d="M12 14v6M8.5 21h7"/><path d="M7.4 7h9.2"/>',
  cam: '<rect x="2.5" y="7" width="13" height="11" rx="2"/><path d="m15.5 11 6-3.5v10l-6-3.5"/><circle cx="6" cy="4.5" r="1.8"/><circle cx="11" cy="4.5" r="1.8"/>',
  case: '<rect x="3" y="7.5" width="18" height="12.5" rx="2.2"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2"/><path d="M3 12.5h18"/><path d="M11 12.5h2v2h-2z"/>',
};
const OCC = [ // [alkalom, leírás, ikon, színárnyalat (RGB), ajánlott autók]
  ['Esküvő', 'Elegáns érkezés a nagy napon', 'wed', '201,162,75', ['Bentley Continental GTC', 'Mercedes S 350']],
  ['Hétvége', 'Nyitott tető, hosszú utak', 'sun', '240,138,36', ['Ferrari Roma Spider', 'Ferrari F8 Spider', 'Porsche 911 Targa 4S']],
  ['Születésnap', 'Ajándék, amire évekig emlékeznek', 'gift', '139,92,246', ['Ferrari 296 GTS', 'Ferrari SF90 Spider']],
  ['Céges rendezvény', 'Partnerek és vendégek fogadása', 'glass', '16,185,129', ['Mercedes S 350', 'BMW X6 M', 'Audi SQ7']],
  ['Forgatás, fotózás', 'Film, reklám, klip, fotózás', 'cam', '245,158,11', ['Ferrari 812 GTS Superfast', 'Mercedes-AMG GT R', 'Ferrari Amalfi']],
  ['Üzleti út', 'Kényelem és tekintély', 'case', '156,163,175', ['Mercedes S 350', 'BMW M3 Competition', 'Audi SQ7']],
];
const CATS = ['Sportautó', 'Cabrio', 'SUV', 'Limuzin'];
// márkalogók (a megküldött logókból, átlátszó háttérrel); az egyszínű Bentley-nek külön világos/sötét változat
const BRANDS = [['Ferrari', '/vip-logo-ferrari.png'], ['Porsche', '/brand-porsche.png'], ['Bentley', '/vip-logo-bentley.png', '/vip-logo-bentley-w.png'], ['Mercedes', '/vip-logo-mercedes.png'], ['BMW', '/vip-logo-bmw.png'], ['Audi', '/vip-logo-audi.png']];
const WA = 'https://wa.me/36302336060?text=' + encodeURIComponent('Szia! VIP luxusautó-bérlés miatt írok.');
const WAI = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z"/></svg>';
const PICKS = []; FLEET.forEach(([n, , p, we, wk, , id, imgs]) => { if (!PICKS.some(x => x.n === n)) PICKS.push({ n, p, we, wk, img: NOPHOTO[id] ? '' : IMG(id, imgs[0], 384) }); });
const PICK_HTML = PICKS.map(c => `<label class="vp-pc"><input type="radio" name="car" value="${c.n}"><span class="vp-pc-img">${c.img ? `<img src="${c.img}" alt="" loading="lazy" decoding="async">` : svg(IC.spark, 22)}</span><b>${c.n}</b><i>${c.p ? eur(c.p) + ' / nap' : 'Ár kérésre'}</i></label>`).join('');
const PICK_JSON = JSON.stringify(Object.fromEntries(PICKS.map(c => [c.n, [c.p, c.we, c.wk, c.img ? c.img.replace('w=384', 'w=828') : '']])));
const VIP = `<main id="ca-vipp" data-dm-skip="1">
<header class="vp-top"><div class="vp-wrap vp-top-in">
  <a class="vp-logo" href="/vip/"><span class="vp-g">CARADVANCE</span><i>VIP</i></a>
  <nav class="vp-nav"><a href="#szolgaltatas">Szolgáltatás</a><a href="#alkalmak">Alkalmak</a><a href="#flotta">Flotta</a><a href="#foglalas">Foglalás</a></nav>
  <a class="vp-back" href="/">← caradvance.hu</a>
</div></header>
<section class="vp-hero">
  <div class="vp-hero-bg" role="img" aria-label="Fekete Porsche 911 GT3 RS a garázsban"></div>
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
  <div class="vp-tiles">${OCC.map(([t, d, ic, rgb, cars]) => `<a class="vp-tile" href="#flotta" data-occ="${t}" data-cars="${cars.join('|')}" style="--oc:${rgb}"><span class="vp-oi">${svg(OI[ic], 26)}</span><b>${t}</b><i>${d}</i><small>Ajánlott: ${cars.join(' · ')}</small><em>Mutasd az autókat ${ARR}</em></a>`).join('')}</div>
</div></section>
<section class="vp-sec vp-how"><div class="vp-wrap">
  <div class="vp-ey">Hogyan működik</div><h2>Három lépés a kulcsig</h2>
  <ol class="vp-steps">
    <li><span class="vp-num">01</span><b>Válaszd ki az autót és a napot</b><span>A flottából vagy az alkalom alapján — ha még nem döntöttél, segítünk.</span></li>
    <li><span class="vp-num">02</span><b>Személyes ajánlatot kapsz</b><span>A kapcsolattartód felhív, egyeztetjük a részleteket és az átvételt.</span></li>
    <li><span class="vp-num">03</span><b>Átveszed az autót</b><span>Tiszta, tankolt autó — indulhat a nap.</span></li>
  </ol>
  <p class="vp-howmore"><a href="/vip/hogyan-mukodik/">A bérlés menete részletesen →</a><a href="/vip/gyakori-kerdesek/">Gyakori kérdések →</a></p>
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
  <p class="vp-recnote" hidden><span></span> <button type="button" class="vp-reset3">Összes autó</button></p>
  <div class="vp-cars">
  ${FLEET_HTML}
  </div>
  <p class="vp-empty" hidden>Ebben a párosításban most nincs autónk. <button type="button" class="vp-reset2" onclick="this.closest('.vp-wrap').querySelector('.vp-reset').click()">Szűrők törlése</button></p>
</div></section>
<section class="vp-sec vp-booksec" id="foglalas"><div class="vp-wrap">
  <div class="vp-book-head" data-rv><div class="vp-ey">Foglalás</div><h2>Tervezzük meg együtt a napodat</h2><p>Három rövid lépés, és személyre szabott ajánlattal jelentkezünk. Az ajánlatkérés díjtalan és nem kötelez semmire.</p></div>
  <div class="vp-book">
  <div class="vp-book-main" data-rv>
    <ol class="vp-prog" aria-label="Lépések"><li class="on"><i>1</i><span>Autó és időpont</span></li><li><i>2</i><span>Alkalom és kérések</span></li><li><i>3</i><span>Elérhetőség</span></li></ol>
    <form id="vp-form" novalidate>
      <fieldset class="vp-step" data-s="1">
        <legend class="vp-lg">Melyik autóval szeretnél menni?</legend>
        <div class="vp-pick" role="radiogroup" aria-label="Autó">
          <label class="vp-pc vp-pc-none"><input type="radio" name="car" value="" checked><span class="vp-pc-img">${svg(IC.spark, 22)}</span><b>Még nem tudom</b><i>Segítünk választani</i></label>
          ${PICK_HTML}
        </div>
        <div class="vp-row3">
          <label class="vp-fl">Átvétel napja<input type="date" name="from" required></label>
          <label class="vp-fl">Visszahozatal napja<input type="date" name="to" required></label>
          <label class="vp-fl">Átvétel ideje<select name="time">${['Egyeztetjük', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => `<option>${t}</option>`).join('')}</select></label>
        </div>
        <div class="vp-fl vp-span">Átvétel helye
          <div class="vp-seg"><label><input type="radio" name="place" value="Caradvance telephely" checked><span>Nálatok, a telephelyen</span></label><label><input type="radio" name="place" value="Más helyszín"><span>Más helyszínen</span></label></div>
        </div>
        <label class="vp-fl vp-addr" hidden>Helyszín címe<input name="addr" autocomplete="street-address" placeholder="Város, utca, házszám"></label>
      </fieldset>
      <fieldset class="vp-step" data-s="2" hidden>
        <legend class="vp-lg">Milyen alkalomra?</legend>
        <div class="vp-occp">${OCC.map(([t, , ic, rgb]) => `<label style="--oc:${rgb}"><input type="radio" name="occ" value="${t}"><span>${svg(OI[ic], 18)}${t}</span></label>`).join('')}<label style="--oc:201,162,75"><input type="radio" name="occ" value="Egyéb"><span>${svg(IC.spark, 18)}Egyéb</span></label></div>
        <label class="vp-fl vp-span"><span>Különleges kérés <small>(nem kötelező)</small></span><textarea name="m" rows="4" placeholder="Pl. díszítés, pontos útvonal, időzítés, bármi, amire figyeljünk"></textarea></label>
      </fieldset>
      <fieldset class="vp-step" data-s="3" hidden>
        <legend class="vp-lg">Hogyan érünk el?</legend>
        <div class="vp-row2">
          <label class="vp-fl">Név<input name="n" autocomplete="name" required></label>
          <label class="vp-fl">Telefon<input name="p" type="tel" autocomplete="tel" required placeholder="+36 …"></label>
        </div>
        <label class="vp-fl"><span>E-mail <small>(az írásos ajánlathoz)</small></span><input name="e" type="email" autocomplete="email"></label>
        <div class="vp-fl">Hogyan keressünk?
          <div class="vp-seg vp-seg3"><label><input type="radio" name="via" value="Telefon" checked><span>${svg(IC.phone, 16)} Telefon</span></label><label><input type="radio" name="via" value="WhatsApp"><span>${WAI} WhatsApp</span></label><label><input type="radio" name="via" value="E-mail"><span>${svg(IC.mail, 16)} E-mail</span></label></div>
        </div>
        <div class="vp-fl">Mikor hívhatunk?
          <div class="vp-seg vp-seg4"><label><input type="radio" name="when" value="Bármikor" checked><span>Bármikor</span></label><label><input type="radio" name="when" value="Délelőtt"><span>Délelőtt</span></label><label><input type="radio" name="when" value="Délután"><span>Délután</span></label><label><input type="radio" name="when" value="Este"><span>Este</span></label></div>
        </div>
        <input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="vp-hp">
        <label class="vp-ck"><input type="checkbox" name="ok" required> <span>Elolvastam és elfogadom az <a href="/adatkezeles/" target="_blank">adatkezelési tájékoztatót</a>.</span></label>
      </fieldset>
      <p class="vp-err" hidden></p>
      <div class="vp-nav2"><button type="button" class="vp-btn vp-ghost vp-prev" hidden>${svg('<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>', 17)} Vissza</button><button type="button" class="vp-btn vp-gold vp-next">Tovább ${ARR}</button><button type="submit" class="vp-btn vp-gold vp-send" hidden>Ajánlatot kérek ${ARR}</button></div>
    </form>
    <div class="vp-ok" hidden>
      <span class="vp-ok-ic">${CHK}</span>
      <h3>Köszönjük, megkaptuk!</h3>
      <p>Foglalási azonosító: <b class="vp-ref"></b></p>
      <ol class="vp-tl"><li class="done"><b>Ajánlatkérés beérkezett</b><span>Most</span></li><li><b>Személyesen felvesszük veled a kapcsolatot</b><span class="vp-tl-via"></span></li><li><b>Írásos ajánlat</b><span>Autó, időpont, átvétel, végleges ár</span></li><li><b>Átveszed az autót</b><span class="vp-tl-date"></span></li></ol>
    </div>
  </div>
  <aside class="vp-sum" data-rv aria-live="polite">
    <div class="vp-sum-card">
      <div class="vp-sum-img"><span>${svg(IC.spark, 26)}</span></div>
      <div class="vp-sum-b">
        <div class="vp-ey">Összesítő</div>
        <h3 class="vp-sum-car">Még nem választottál autót</h3>
        <dl>
          <div><dt>Időszak</dt><dd class="vp-sum-dates">—</dd></div>
          <div><dt>Bérlési napok</dt><dd class="vp-sum-days">—</dd></div>
          <div><dt>Átvétel</dt><dd class="vp-sum-place">Nálatok, a telephelyen</dd></div>
          <div><dt>Alkalom</dt><dd class="vp-sum-occ">—</dd></div>
        </dl>
        <div class="vp-sum-price"><span>Becsült bérleti díj</span><b class="vp-g vp-sum-eur">—</b><i class="vp-sum-huf"></i></div>
        <ul class="vp-sum-inc"><li>${CHK} Napi 200 km benne</li><li>${CHK} Az árak áfával értendők</li><li>${CHK} A végleges árat az ajánlatban kapod</li></ul>
      </div>
    </div>
    <div class="vp-trust">
      <div>${svg(IC.lock, 18)}<span><b>Kötelezettség nélkül</b>Az ajánlatkérés díjtalan</span></div>
      <div>${svg(IC.user, 18)}<span><b>Személyes kapcsolattartó</b>Egy név, egy telefonszám</span></div>
      <div>${svg(IC.spark, 18)}<span><b>Diszkréció</b>Adataidat csak az ajánlathoz használjuk</span></div>
    </div>
    <div class="vp-direct"><span class="vp-direct-t">Inkább beszélnél valakivel?</span>
      <a href="tel:${TEL}">${svg(IC.phone, 18)}<span><b>${TELTXT}</b><i>Hívj minket</i></span></a>
      <a href="${WA}" target="_blank" rel="noopener">${WAI}<span><b>WhatsApp</b><i>Írj nekünk most</i></span></a>
    </div>
  </aside>
  </div>
</div><script type="application/json" id="vp-cars">${PICK_JSON}</script></section>
<footer class="vp-foot"><div class="vp-wrap">© ${new Date().getFullYear()} Caradvance · <a href="/">caradvance.hu</a> · <a href="/adatkezeles/">Adatkezelés</a> · <a href="/impresszum/">Impresszum</a></div></footer>
<div class="vp-bar" aria-hidden="false"><a class="vp-btn vp-gold" href="#foglalas">Ajánlatot kérek</a><a class="vp-bar-ic" href="${WA}" target="_blank" rel="noopener" aria-label="WhatsApp">${WAI}</a><a class="vp-bar-ic" href="tel:${TEL}" aria-label="Hívás: ${TELTXT}">${svg(IC.phone, 18)}</a></div>
<div class="vp-lb" id="vp-lb" hidden role="dialog" aria-modal="true" aria-label="Fotónézegető"><div class="vp-lb-top"><b class="vp-lb-h"></b><span class="vp-lb-n"></span><button type="button" class="vp-lb-x" aria-label="Bezárás">${svg('<path d="M6 6l12 12M18 6 6 18"/>', 22)}</button></div><div class="vp-lb-track"></div><button type="button" class="vp-lb-p" aria-label="Előző">${svg('<path d="m15 6-6 6 6 6"/>', 24)}</button><button type="button" class="vp-lb-nx" aria-label="Következő">${svg('<path d="m9 6 6 6-6 6"/>', 24)}</button></div>
</main>` + VIP_GAL_JS;

const VIP_CSS = `<style id="ca-dark-hu-vip">
/* a VIP egy külön világ: a fő menü és lábléc helyett saját fejléc és lábléc */
html[data-vip] #ca-vipp .vp-top,html[data-vip] #ca-vipp .vp-foot{display:none!important}
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
/* fejléckép: lucas clarysse, Unsplash (ingyenes licenc). Az Unsplash képszerveréről nagy felbontásban, alatta a helyi másolat tartaléknak */
#ca-vipp .vp-hero-bg{position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1694026006855-6f4f0cdee8c0?w=2560&q=85&auto=format') 35% 50%/cover no-repeat,url('/vip-hero-porsche.jpg') 35% 50%/cover no-repeat}
@media(min-width:1400px) and (min-resolution:1.5dppx){#ca-vipp .vp-hero-bg{background-image:url('https://images.unsplash.com/photo-1694026006855-6f4f0cdee8c0?w=3800&q=85&auto=format'),url('/vip-hero-porsche.jpg')}}
@media(max-width:700px){#ca-vipp .vp-hero-bg{background-image:url('https://images.unsplash.com/photo-1694026006855-6f4f0cdee8c0?w=1200&q=80&auto=format'),url('/vip-hero-porsche.jpg')}}
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
#ca-vipp .vp-tile{position:relative;display:flex;flex-direction:column;gap:4px;padding:26px 24px 22px;border-radius:24px;overflow:hidden;text-decoration:none;border:1px solid var(--vp-line);background:radial-gradient(120% 90% at 100% 0%,rgba(var(--oc),.30),rgba(var(--oc),0) 62%),#FFFDF8!important;transition:transform .25s,box-shadow .25s,border-color .25s;isolation:isolate}
html.ca-dark #ca-vipp .vp-tile{background:radial-gradient(120% 90% at 100% 0%,rgba(var(--oc),.30),rgba(var(--oc),0) 62%),linear-gradient(180deg,#121116,#0B0B0E)!important}
#ca-vipp .vp-tile:hover{transform:translateY(-4px);border-color:rgba(var(--oc),.55);box-shadow:0 26px 50px -30px rgba(var(--oc),.75)}
#ca-vipp .vp-oi{width:56px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:#fff;background:linear-gradient(140deg,rgba(var(--oc),1),rgba(var(--oc),.62));box-shadow:0 12px 24px -12px rgba(var(--oc),.9),inset 0 1px 0 rgba(255,255,255,.35)}
#ca-vipp .vp-tile b{color:var(--vp-ink);font-size:20px;font-weight:800;letter-spacing:-.01em}
#ca-vipp .vp-tile i{font-style:normal;color:var(--vp-mut);font-size:14.5px}
#ca-vipp .vp-tile small{margin-top:14px;padding-top:14px;border-top:1px solid var(--vp-line);color:var(--vp-ink);font-size:13px;font-weight:600;line-height:1.45}
#ca-vipp .vp-tile em{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-style:normal;font-size:13px;font-weight:800;letter-spacing:.03em;color:rgb(var(--oc));filter:brightness(.85)}
html.ca-dark #ca-vipp .vp-tile em{filter:none}
#ca-vipp .vp-tile em svg{transition:transform .2s}#ca-vipp .vp-tile:hover em svg{transform:translateX(4px)}
#ca-vipp .vp-recnote{max-width:none;margin:18px 0 0;font-size:14.5px;color:var(--vp-ink);font-weight:600}
#ca-vipp .vp-reset3{border:0;background:none;color:#B08A35;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;padding:0;margin-left:8px;text-decoration:underline;text-underline-offset:3px}
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
#ca-vipp .vp-booksec{position:relative;padding:90px 0;background:radial-gradient(60% 50% at 85% 0%,rgba(201,162,75,.10),transparent 70%)}
#ca-vipp .vp-book-head{max-width:640px;margin-bottom:34px}#ca-vipp .vp-book>*,#ca-vipp .vp-pick,#ca-vipp .vp-sum>*{min-width:0}#ca-vipp .vp-row2>*,#ca-vipp .vp-row3>*,#ca-vipp .vp-step>*{min-width:0}#ca-vipp .vp-fl :is(input,select,textarea){width:100%;min-width:0;box-sizing:border-box}#ca-vipp .vp-sum{flex-direction:column}#ca-vipp .vp-sum>*{width:100%;box-sizing:border-box}
#ca-vipp .vp-book{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,1fr);gap:28px;align-items:start}
#ca-vipp .vp-book-main{padding:30px;border-radius:28px;border:1px solid var(--vp-line);background:var(--vp-card);box-shadow:0 40px 80px -50px rgba(120,95,40,.55)}
#ca-vipp .vp-prog{list-style:none;margin:0 0 26px;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
#ca-vipp .vp-prog li{display:flex;align-items:center;gap:10px;padding-top:12px;border-top:3px solid var(--vp-line);font-size:13px;font-weight:700;color:var(--vp-mut);transition:border-color .3s,color .3s}
#ca-vipp .vp-prog i{flex:none;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12.5px;border:1px solid var(--vp-line)}
#ca-vipp .vp-prog li.on{border-color:#C9A24B;color:var(--vp-ink)}#ca-vipp .vp-prog li.on i{background:linear-gradient(135deg,#F3DFA2,#C9A24B 45%,#8E6A22);color:#1B1407;border-color:transparent}
#ca-vipp .vp-prog li.done{border-color:rgba(201,162,75,.55);color:var(--vp-ink);cursor:pointer}#ca-vipp .vp-prog li.done i{background:rgba(201,162,75,.18);border-color:rgba(201,162,75,.5);color:#A88230}
#vp-form{display:block}#vp-form[hidden],#ca-vipp .vp-prog[hidden],#ca-vipp .vp-ok[hidden],#ca-vipp .vp-err[hidden]{display:none!important}
#ca-vipp .vp-step{border:0;margin:0;padding:0;min-width:0;display:flex;flex-direction:column;gap:16px;animation:vpStep .35s ease}
@keyframes vpStep{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
#ca-vipp .vp-step[hidden]{display:none}
#ca-vipp .vp-lg{padding:0;margin:0 0 2px;font-size:21px;font-weight:800;letter-spacing:-.015em;color:var(--vp-ink)}
#ca-vipp .vp-pick{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;max-height:388px;overflow:auto;padding:2px;margin:0 -2px;scrollbar-width:thin}
#ca-vipp .vp-pc{position:relative;display:flex;flex-direction:column;gap:2px;padding:8px 8px 10px;border-radius:16px;border:1px solid var(--vp-line);background:var(--vp-bg);cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
html.ca-dark #ca-vipp .vp-pc{background:#0E0E11}
#ca-vipp .vp-pc:hover{transform:translateY(-2px);border-color:rgba(201,162,75,.6)}
#ca-vipp .vp-pc input{position:absolute;opacity:0;pointer-events:none}
#ca-vipp .vp-pc-img{display:flex;align-items:center;justify-content:center;aspect-ratio:3/2;border-radius:10px;overflow:hidden;background:radial-gradient(70% 70% at 50% 40%,#2A2620,#0B0B0E);color:#C9A24B;margin-bottom:6px}
#ca-vipp .vp-pc-img img{width:100%;height:100%;object-fit:cover}
#ca-vipp .vp-pc b{font-size:12.5px;line-height:1.25;color:var(--vp-ink)}#ca-vipp .vp-pc i{font-style:normal;font-size:11.5px;color:var(--vp-mut);font-weight:600}
#ca-vipp .vp-pc:has(input:checked){border-color:#C9A24B;box-shadow:0 0 0 2px #C9A24B,0 14px 30px -18px rgba(201,162,75,.8)}
#ca-vipp .vp-pc:has(input:checked):after{content:"";position:absolute;right:14px;top:14px;width:22px;height:22px;border-radius:50%;background:#C9A24B url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231B1407' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center/13px no-repeat;box-shadow:0 2px 8px rgba(0,0,0,.35)}
#ca-vipp .vp-pc:has(input:focus-visible){outline:2px solid #C9A24B;outline-offset:2px}
#ca-vipp .vp-row3{display:grid;grid-template-columns:1fr 1fr .8fr;gap:12px}#ca-vipp .vp-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
#ca-vipp .vp-seg{display:flex;gap:6px;padding:5px;border-radius:16px;border:1px solid var(--vp-line);background:var(--vp-bg);letter-spacing:0}
html.ca-dark #ca-vipp .vp-seg{background:#0E0E11}
#ca-vipp .vp-seg label{flex:1;position:relative;cursor:pointer}
#ca-vipp .vp-seg input{position:absolute;opacity:0;pointer-events:none}
#ca-vipp .vp-seg span{display:flex;align-items:center;justify-content:center;gap:7px;height:42px;padding:0 10px;border-radius:12px;font-size:14px;font-weight:600;color:var(--vp-mut);transition:background-color .15s,color .15s;text-align:center}
#ca-vipp .vp-seg input:checked+span{background:var(--vp-card);color:var(--vp-ink);box-shadow:0 0 0 1px #C9A24B,0 6px 16px -10px rgba(120,95,40,.7)}
html.ca-dark #ca-vipp .vp-seg input:checked+span{background:#1A1810}
#ca-vipp .vp-seg input:focus-visible+span{outline:2px solid #C9A24B}
#ca-vipp .vp-occp{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#ca-vipp .vp-occp label{position:relative;cursor:pointer}#ca-vipp .vp-occp input{position:absolute;opacity:0;pointer-events:none}
#ca-vipp .vp-occp span{display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:14px;border-radius:16px;border:1px solid var(--vp-line);background:var(--vp-bg);font-size:14px;font-weight:700;color:var(--vp-ink);transition:.15s}
html.ca-dark #ca-vipp .vp-occp span{background:#0E0E11}
#ca-vipp .vp-occp svg{width:34px;height:34px;padding:8px;border-radius:11px;color:#fff;background:linear-gradient(140deg,rgba(var(--oc),1),rgba(var(--oc),.62))}
#ca-vipp .vp-occp input:checked+span{border-color:rgba(var(--oc),1);box-shadow:0 0 0 1px rgba(var(--oc),1),0 14px 30px -20px rgba(var(--oc),1);background:radial-gradient(120% 100% at 100% 0%,rgba(var(--oc),.18),transparent 70%),var(--vp-bg)}
#ca-vipp .vp-occp input:focus-visible+span{outline:2px solid rgba(var(--oc),1)}
#ca-vipp .vp-nav2{display:flex;gap:10px;justify-content:flex-end;margin-top:22px;padding-top:20px;border-top:1px solid var(--vp-line)}
#ca-vipp .vp-nav2 .vp-btn{height:54px;border:0;cursor:pointer;font-family:inherit;font-size:15px;width:auto!important}
#ca-vipp .vp-nav2 .vp-ghost{border:1px solid var(--vp-line);margin-right:auto}
#ca-vipp .vp-nav2 .vp-btn[hidden]{display:none}
#ca-vipp .vp-nav2 .vp-btn:disabled{opacity:.6;cursor:wait}
#ca-vipp .vp-fl{display:flex;flex-direction:column;gap:6px;font-size:12.5px;font-weight:700;letter-spacing:.06em;color:var(--vp-mut)}
#ca-vipp .vp-fl[hidden]{display:none}
#ca-vipp .vp-fl small{font-weight:500;letter-spacing:0}
#ca-vipp .vp-fl :is(input,select,textarea){height:50px;padding:0 14px;border-radius:14px;border:1px solid var(--vp-line);background:var(--vp-bg);color:var(--vp-ink);font-family:inherit;font-size:15.5px;font-weight:500;line-height:1.3;letter-spacing:0;outline:none;transition:border-color .15s,box-shadow .15s;color-scheme:light}
html.ca-dark #ca-vipp .vp-fl :is(input,select,textarea){color-scheme:dark;background:#0E0E11!important;border-color:rgba(201,162,75,.22)!important;color:#F3EEE3!important}
#ca-vipp .vp-fl textarea{height:auto;padding:12px 14px;resize:vertical}
#ca-vipp .vp-fl :is(input,select,textarea):focus{border-color:#C9A24B!important;box-shadow:0 0 0 3px rgba(201,162,75,.22)}
#ca-vipp .vp-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
#ca-vipp .vp-ck{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:var(--vp-mut);line-height:1.45}
#ca-vipp .vp-ck input{width:18px;height:18px;margin:1px 0 0;accent-color:#C9A24B;flex:none}
#ca-vipp .vp-ck a{color:#B08A35}
#ca-vipp .vp-err{max-width:none;margin:16px 0 0;padding:12px 14px;border-radius:12px;font-size:14px;color:#9A3412;background:rgba(234,88,12,.08);border:1px solid rgba(234,88,12,.25)}
html.ca-dark #ca-vipp .vp-err{color:#FDBA74}
/* összesítő */
#ca-vipp .vp-sum{position:sticky;top:96px;display:flex;flex-direction:column;gap:14px}
#ca-vipp .vp-sum-card{border-radius:24px;overflow:hidden;border:1px solid var(--vp-line);background:var(--vp-card);box-shadow:0 30px 60px -40px rgba(120,95,40,.55)}
#ca-vipp .vp-sum-img{aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:#C9A24B;background:radial-gradient(70% 70% at 50% 40%,#2A2620,#0B0B0E) center/cover no-repeat;transition:background-image .3s}
#ca-vipp .vp-sum-img.has span{display:none}
#ca-vipp .vp-sum-b{padding:20px 22px 22px}
#ca-vipp .vp-sum-b .vp-ey{margin-bottom:8px}
#ca-vipp .vp-sum-car{font-size:20px;font-weight:800;margin:0 0 14px;color:var(--vp-ink);letter-spacing:-.01em}
#ca-vipp .vp-sum dl{margin:0;display:flex;flex-direction:column}
#ca-vipp .vp-sum dl div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--vp-line);font-size:13.5px}
#ca-vipp .vp-sum dt{color:var(--vp-mut)}#ca-vipp .vp-sum dd{margin:0;color:var(--vp-ink);font-weight:700;text-align:right}
#ca-vipp .vp-sum-price{display:flex;flex-direction:column;gap:2px;margin-top:8px;padding:16px;border-radius:16px;background:rgba(201,162,75,.10);border:1px solid rgba(201,162,75,.28)}
#ca-vipp .vp-sum-price span{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--vp-mut)}
#ca-vipp .vp-sum-price b{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.15}
#ca-vipp .vp-sum-price i{font-style:normal;font-size:13px;color:var(--vp-mut);font-weight:600}
#ca-vipp .vp-sum-inc{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--vp-mut)}
#ca-vipp .vp-sum-inc li{display:flex;align-items:center;gap:8px}#ca-vipp .vp-sum-inc svg{color:#B08A35;flex:none}
#ca-vipp .vp-trust{display:flex;flex-direction:column;gap:2px;padding:6px 18px;border-radius:20px;border:1px solid var(--vp-line);background:var(--vp-card)}
#ca-vipp .vp-trust>div{display:flex;gap:12px;align-items:flex-start;padding:10px 0;color:#B08A35}
#ca-vipp .vp-trust>div+div{border-top:1px solid var(--vp-line)}
#ca-vipp .vp-trust span{display:flex;flex-direction:column;font-size:12.5px;color:var(--vp-mut)}#ca-vipp .vp-trust b{font-size:14px;color:var(--vp-ink)}
#ca-vipp .vp-direct{display:flex;flex-direction:column;gap:8px}
#ca-vipp .vp-direct-t{font-size:13px;font-weight:700;color:var(--vp-mut);margin:4px 0 2px}
#ca-vipp .vp-direct a{display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:16px;border:1px solid var(--vp-line);background:var(--vp-card);color:#B08A35;text-decoration:none;transition:border-color .15s,transform .15s}
#ca-vipp .vp-direct a:hover{border-color:#C9A24B;transform:translateX(3px)}
#ca-vipp .vp-direct a>span{display:flex;flex-direction:column}
#ca-vipp .vp-direct b{color:var(--vp-ink);font-size:15px}#ca-vipp .vp-direct i{font-style:normal;color:var(--vp-mut);font-size:12.5px}
/* visszaigazolás */
#ca-vipp .vp-ok{text-align:center;padding:26px 6px 6px;animation:vpStep .4s ease}
#ca-vipp .vp-ok-ic{width:64px;height:64px;margin:0 auto 16px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#1B1407;background:linear-gradient(135deg,#F3DFA2,#C9A24B 45%,#8E6A22);box-shadow:0 14px 30px -12px rgba(201,162,75,.8)}
#ca-vipp .vp-ok-ic svg{width:28px;height:28px;stroke-width:2.6}
#ca-vipp .vp-ok h3{font-size:26px;margin:0 0 6px;color:var(--vp-ink)}#ca-vipp .vp-ok>p{margin:0 auto 24px;max-width:none}
#ca-vipp .vp-ref{color:var(--vp-ink);letter-spacing:.06em}
#ca-vipp .vp-tl{list-style:none;margin:0 auto;padding:0;max-width:420px;text-align:left}
#ca-vipp .vp-tl li{position:relative;padding:0 0 18px 34px;display:flex;flex-direction:column;font-size:13.5px;color:var(--vp-mut)}
#ca-vipp .vp-tl li:before{content:"";position:absolute;left:6px;top:4px;width:12px;height:12px;border-radius:50%;border:2px solid #C9A24B;background:var(--vp-card)}
#ca-vipp .vp-tl li.done:before{background:#C9A24B}
#ca-vipp .vp-tl li:not(:last-child):after{content:"";position:absolute;left:12px;top:20px;bottom:0;width:1.5px;background:rgba(201,162,75,.4)}
#ca-vipp .vp-tl b{color:var(--vp-ink);font-size:15px}
@media(max-width:1000px){#ca-vipp .vp-book{grid-template-columns:1fr}#ca-vipp .vp-sum{position:static;display:grid;grid-template-columns:1fr 1fr;align-items:start}#ca-vipp .vp-sum-card{grid-row:span 2}}
@media(max-width:700px){#ca-vipp .vp-booksec{padding:60px 0}#ca-vipp .vp-book-main{padding:18px;border-radius:22px}#ca-vipp .vp-prog span{display:none}#ca-vipp .vp-prog li.on span{display:inline}#ca-vipp .vp-pick{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:42%;overflow-x:auto;overflow-y:hidden;max-height:none;scroll-snap-type:x mandatory;margin:0 -18px;padding:2px 18px 6px}#ca-vipp .vp-pc{scroll-snap-align:start}#ca-vipp .vp-row3{grid-template-columns:1fr 1fr}#ca-vipp .vp-row2{grid-template-columns:1fr}#ca-vipp .vp-row3>:last-child{grid-column:1/-1}#ca-vipp .vp-occp{grid-template-columns:1fr 1fr}#ca-vipp .vp-seg3 span{font-size:13px;padding:0 4px}#ca-vipp .vp-seg4{flex-wrap:wrap}#ca-vipp .vp-seg4 label{flex:1 1 45%}#ca-vipp .vp-sum{display:flex}#ca-vipp .vp-nav2 .vp-btn{flex:1;justify-content:center;padding:0 16px}#ca-vipp .vp-nav2 .vp-ghost{flex:0 0 auto;margin-right:0}}
/* parallax és beúszás */
html.vp-anim #ca-vipp [data-rv]{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.2,.7,.2,1) var(--d,0ms),transform .8s cubic-bezier(.2,.7,.2,1) var(--d,0ms)}
html.vp-anim #ca-vipp [data-rv].vp-in{opacity:1;transform:none}
html.vp-anim #ca-vipp .vp-car[data-rv].vp-in:hover{transform:translateY(-3px)}
html.vp-anim #ca-vipp .vp-tile[data-rv].vp-in:hover{transform:translateY(-4px)}
html.vp-anim #ca-vipp .vp-perk[data-rv].vp-in:hover{transform:translateY(-3px)}
#ca-vipp .vp-hero-bg{will-change:transform;transform-origin:50% 30%}
#ca-vipp .vp-hero-in{will-change:transform,opacity}
@media(max-width:700px){#ca-vipp .vp-hero{overflow:hidden}#ca-vipp .vp-hero-in{position:relative;z-index:1;background:var(--vp-bg)}}
/* lebegő sáv */
#ca-vipp .vp-bar{position:fixed;left:50%;bottom:18px;z-index:60;display:flex;align-items:center;gap:8px;padding:8px;border-radius:999px;background:color-mix(in srgb,var(--vp-bg) 80%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid var(--vp-line);box-shadow:0 18px 40px -16px rgba(0,0,0,.45);transform:translate(-50%,140%);opacity:0;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .25s;pointer-events:none}
#ca-vipp .vp-bar.on{transform:translate(-50%,0);opacity:1;pointer-events:auto}
#ca-vipp .vp-bar .vp-btn{height:48px;width:auto!important}
#ca-vipp .vp-bar-ic{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--vp-line);color:var(--vp-ink);text-decoration:none}
#ca-vipp .vp-bar-ic:first-of-type{color:#25D366}
@media(max-width:900px){#ca-vipp .vp-tiles{grid-template-columns:1fr 1fr}#ca-vipp .vp-steps{grid-template-columns:1fr}#ca-vipp .vp-steps li:after{display:none}#ca-vipp .vp-book{grid-template-columns:1fr;gap:28px}#ca-vipp .vp-fb{padding-left:0;border-left:0}#ca-vipp .vp-fmeta{margin-left:0;width:100%;justify-content:space-between}}
@media(max-width:600px){#ca-vipp .vp-tiles{grid-template-columns:1fr 1fr;gap:10px}#ca-vipp .vp-tile{padding:18px 14px 16px}#ca-vipp .vp-oi{width:46px;height:46px;border-radius:15px;margin-bottom:10px}#ca-vipp .vp-tile b{font-size:16px}#ca-vipp .vp-tile i{font-size:12.5px}#ca-vipp .vp-tile small{display:none}#ca-vipp .vp-tile em{font-size:12px}#vp-form{grid-template-columns:1fr}#ca-vipp .vp-book-r{padding:20px}#ca-vipp .vp-f{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px}#ca-vipp .vp-f button{flex:none}#ca-vipp .vp-filters{display:block}#ca-vipp .vp-filters>*+*{margin-top:10px}#ca-vipp .vp-bar{left:12px;right:12px;bottom:12px;transform:translateY(140%)}#ca-vipp .vp-bar.on{transform:none}#ca-vipp .vp-bar .vp-btn{flex:1}}
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


const VIP_MONO = `<style id="ca-dark-hu-vip-mono">
/* VIP: fekete-fehér, letisztult stílus (arany helyett). Csak a /vip/ oldal. */
html[data-vip]{--vp-bg:#FFFFFF;--vp-ink:#0B0B0B;--vp-mut:#6E6E6E;--vp-line:rgba(0,0,0,.13);--vp-card:#FFFFFF;--vp-soft:#F6F6F6;--vp-btn:#0B0B0B;--vp-btn-t:#FFFFFF}
html[data-vip].ca-dark{--vp-bg:#000000;--vp-ink:#FFFFFF;--vp-mut:#9C9C9C;--vp-line:rgba(255,255,255,.16);--vp-card:#000000;--vp-soft:#0E0E0E;--vp-btn:#FFFFFF;--vp-btn-t:#000000}
html #ca-vipp{--hf:'Montserrat',system-ui,sans-serif}
/* szövegek */
html #ca-vipp :is(h1,h2,.vp-lg,.vp-car h3,.vp-logo,.vp-sum-car,.vp-ok h3,.vp-tile b,.vp-steps b,.vp-perk b){font-family:var(--hf)!important}
html #ca-vipp h2{font-size:clamp(24px,2.6vw,32px)!important;font-weight:400!important;letter-spacing:.14em!important;text-transform:uppercase;line-height:1.25!important}
html #ca-vipp h2:after{content:"";display:block;width:44px;height:1.5px;background:var(--vp-ink);margin:18px 0 0}
html #ca-vipp .vp-ey{font-family:var(--hf);color:var(--vp-mut)!important;font-weight:500;letter-spacing:.32em;font-size:11.5px}
html #ca-vipp p{font-size:15.5px}
html #ca-vipp .vp-g,html #ca-vipp .vp-hero .vp-g,html:not(.ca-dark) #ca-vipp .vp-hero .vp-g{background:none!important;background-image:none!important;color:inherit!important;-webkit-text-fill-color:currentColor!important}
/* középre zárt szakaszfejek */
html #ca-vipp :is(#alkalmak,.vp-how,#flotta)>.vp-wrap>:is(.vp-ey,h2,p),html #ca-vipp .vp-book-head{text-align:center;margin-left:auto;margin-right:auto}
html #ca-vipp :is(#alkalmak,.vp-how,#flotta)>.vp-wrap>p,html #ca-vipp .vp-book-head p{max-width:640px}
html #ca-vipp :is(#alkalmak,.vp-how,#flotta,#foglalas) h2:after{margin:18px auto 0}
html #ca-vipp :is(#alkalmak,.vp-how,#flotta)>.vp-wrap>.vp-ey,html #ca-vipp .vp-book-head .vp-ey{display:block}
/* fejléc */
html #ca-vipp .vp-top{background:color-mix(in srgb,var(--vp-bg) 90%,transparent)}
html #ca-vipp .vp-logo{letter-spacing:.42em;font-weight:500;font-size:13.5px;color:var(--vp-ink)}
html #ca-vipp .vp-back{color:var(--vp-ink)!important;font-weight:500;letter-spacing:.08em;font-size:13px}
html #ca-vipp .vp-nav a{font-family:var(--hf);text-transform:uppercase;letter-spacing:.16em;font-size:11.5px}
/* gombok: szögletes, egyszínű */
html #ca-vipp .vp-btn{border-radius:0!important;height:50px;padding:0 30px;font-family:var(--hf);font-size:12px!important;font-weight:500!important;letter-spacing:.2em!important;text-transform:uppercase;box-shadow:none!important}
html #ca-vipp .vp-btn:hover{transform:none;opacity:.86}
html #ca-vipp .vp-gold{background:var(--vp-btn)!important;color:var(--vp-btn-t)!important;border:1px solid var(--vp-btn)!important}
html #ca-vipp .vp-ghost{background:transparent!important;color:var(--vp-ink)!important;border:1px solid var(--vp-ink)!important}
/* hero */
html #ca-vipp .vp-hero h1{font-family:var(--hf)!important;font-weight:300!important;text-transform:uppercase;letter-spacing:.1em!important;font-size:clamp(30px,3.6vw,52px)!important;text-shadow:0 2px 30px rgba(0,0,0,.5)}
html #ca-vipp .vp-hero .vp-ey{color:rgba(255,255,255,.82)!important}
html #ca-vipp .vp-hero .vp-gold{background:#fff!important;color:#000!important;border-color:#fff!important}
html #ca-vipp .vp-hero .vp-ghost{color:#fff!important;border-color:rgba(255,255,255,.7)!important;background:transparent!important;-webkit-backdrop-filter:none;backdrop-filter:none}
@media(max-width:700px){html #ca-vipp .vp-hero h1{color:var(--vp-ink)!important;text-shadow:none;font-size:30px!important}html #ca-vipp .vp-hero .vp-ey{color:var(--vp-mut)!important}html #ca-vipp .vp-hero .vp-gold{background:var(--vp-btn)!important;color:var(--vp-btn-t)!important;border-color:var(--vp-btn)!important}html #ca-vipp .vp-hero .vp-ghost{color:var(--vp-ink)!important;border-color:var(--vp-ink)!important}}
/* előnyök: kártya nélkül, középre */
html #ca-vipp .vp-perks{padding:56px 0 10px}
html #ca-vipp .vp-perk{background:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;align-items:center;text-align:center;padding:10px 12px!important}
html #ca-vipp .vp-perk:hover{transform:none!important;box-shadow:none!important}
html #ca-vipp .vp-perk .vp-ic{background:none!important;border:0!important;color:var(--vp-ink)!important;width:auto!important;height:auto!important;margin-bottom:12px!important}
html #ca-vipp .vp-perk .vp-ic svg{width:28px;height:28px;stroke-width:1.3}
html #ca-vipp .vp-perk b{text-transform:uppercase;letter-spacing:.14em;font-size:13px!important;font-weight:500}
html #ca-vipp .vp-perks-in{border-top:1px solid var(--vp-line);border-bottom:1px solid var(--vp-line);padding:30px 0;gap:0}
html #ca-vipp .vp-perks-in>.vp-perk+.vp-perk{border-left:1px solid var(--vp-line)!important}
/* alkalmak: egyszínű */
html #ca-vipp .vp-tile,html.ca-dark #ca-vipp .vp-tile{background:var(--vp-card)!important;border:1px solid var(--vp-line);border-radius:0!important;box-shadow:none!important;padding:30px 28px 26px}
html #ca-vipp .vp-tile:hover{transform:none!important;border-color:var(--vp-ink)!important;box-shadow:none!important}
html #ca-vipp .vp-oi{background:none!important;box-shadow:none!important;color:var(--vp-ink)!important;width:auto!important;height:auto!important;border-radius:0!important;justify-content:flex-start;margin-bottom:18px!important}
html #ca-vipp .vp-oi svg{width:30px;height:30px;stroke-width:1.3}
html #ca-vipp .vp-tile b{text-transform:uppercase;letter-spacing:.14em;font-size:15px!important;font-weight:500!important}
html #ca-vipp .vp-tile small{font-weight:400;color:var(--vp-mut)}
html #ca-vipp .vp-tile em{color:var(--vp-ink)!important;filter:none!important;font-family:var(--hf);text-transform:uppercase;letter-spacing:.18em;font-size:11px!important;font-weight:500!important}
/* lépések */
html #ca-vipp .vp-steps li{background:none!important;border:0!important;border-top:1px solid var(--vp-ink)!important;border-radius:0!important;box-shadow:none!important;padding:26px 4px 0!important}
html #ca-vipp .vp-steps li:after{display:none}
html #ca-vipp .vp-num{background:none!important;-webkit-text-fill-color:var(--vp-ink);color:var(--vp-ink)!important;font-family:var(--hf);font-weight:300!important;font-size:34px!important}
html #ca-vipp .vp-steps b{text-transform:uppercase;letter-spacing:.12em;font-size:14px!important;font-weight:500}
/* szűrők: szöveges fülek aláhúzással */
html #ca-vipp .vp-filters{background:none!important;border:0!important;border-radius:0!important;border-top:1px solid var(--vp-line)!important;border-bottom:1px solid var(--vp-line)!important;padding:16px 0!important;justify-content:center}
html #ca-vipp .vp-f button{border:0!important;border-radius:0!important;background:none!important;color:var(--vp-mut)!important;height:36px;padding:0 12px;font-family:var(--hf);text-transform:uppercase;letter-spacing:.16em;font-size:11.5px!important;font-weight:500!important;box-shadow:none!important}
html #ca-vipp .vp-f[data-k=cat] button[aria-pressed=true]{color:var(--vp-ink)!important;box-shadow:inset 0 -1.5px 0 var(--vp-ink)!important}
html #ca-vipp .vp-fb{border-left:1px solid var(--vp-line)}
html #ca-vipp .vp-fb img{filter:grayscale(1);opacity:.55;transition:filter .2s,opacity .2s}
html #ca-vipp .vp-fb button:hover img,html #ca-vipp .vp-fb button[aria-pressed=true] img{filter:none;opacity:1}
html #ca-vipp .vp-fb button[aria-pressed=true]{box-shadow:inset 0 -1.5px 0 var(--vp-ink)!important}
html #ca-vipp .vp-fmeta{font-family:var(--hf);text-transform:uppercase;letter-spacing:.14em;font-size:11px}
html #ca-vipp :is(.vp-reset,.vp-reset2,.vp-reset3){color:var(--vp-ink)!important}
html #ca-vipp .vp-recnote{text-align:center}
/* autókártyák a Romans mintájára */
html #ca-vipp .vp-cars{column-gap:40px;row-gap:64px;margin-top:44px}
html #ca-vipp .vp-car{background:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible}html #ca-vipp .vp-car{display:flex!important;flex-direction:column}html #ca-vipp .vp-car>.vp-cb{flex:1;display:flex!important;flex-direction:column;align-items:stretch!important}html #ca-vipp .vp-car .vp-rows{flex:1}html #ca-vipp .vp-car>h3{min-height:2.6em;display:flex;align-items:flex-end}
html #ca-vipp .vp-car:hover{transform:none!important;box-shadow:none!important}
html #ca-vipp .vp-car>h3{font-family:var(--hf)!important;text-transform:uppercase;letter-spacing:.12em;font-size:18px!important;font-weight:400!important;margin:0 0 16px!important;color:var(--vp-ink)}
html #ca-vipp .vp-media{position:relative;overflow:hidden}
html #ca-vipp .vp-gal{background:var(--vp-soft)}
html #ca-vipp .vp-av{border-radius:0!important;left:0;top:0;padding:8px 12px;background:rgba(0,0,0,.72)!important;font-family:var(--hf);text-transform:uppercase;letter-spacing:.16em;font-size:10.5px;font-weight:500;gap:0}
html #ca-vipp .vp-zoom{border-radius:0;right:0;top:0;width:40px;height:40px;background:rgba(0,0,0,.6)}
html #ca-vipp .vp-dots{margin-top:-26px}html #ca-vipp .vp-dots i{pointer-events:none}
html #ca-vipp .vp-arr{position:absolute;top:50%;z-index:3;width:44px;height:44px;margin-top:-22px;display:flex;align-items:center;justify-content:center;border:0;border-radius:0;background:rgba(255,255,255,.92);color:#0B0B0B;cursor:pointer;opacity:0;transition:opacity .2s,background-color .15s}
html #ca-vipp .vp-arr-p{left:0}html #ca-vipp .vp-arr-n{right:0}
html #ca-vipp .vp-media:hover .vp-arr,html #ca-vipp .vp-arr:focus-visible{opacity:1}
html #ca-vipp .vp-arr:hover{background:#fff}
html #ca-vipp .vp-media:hover .vp-arr:disabled{opacity:.3;cursor:default}
@media(hover:none),(max-width:700px){html #ca-vipp .vp-arr{opacity:1;width:38px;height:38px;margin-top:-19px}html #ca-vipp .vp-arr:disabled{opacity:.3}}
html #ca-vipp .vp-nophoto span{background:none;-webkit-text-fill-color:#fff;color:#fff;font-family:var(--hf);font-weight:300}
html #ca-vipp .vp-nophoto{background:#111}
html #ca-vipp .vp-cb{display:block!important;padding:0!important}
html #ca-vipp .vp-prrow{display:flex;justify-content:space-between;align-items:baseline;padding:18px 0 4px}
html #ca-vipp .vp-prrow span,html #ca-vipp .vp-rows dt{font-family:var(--hf);text-transform:uppercase;letter-spacing:.16em;font-size:11px;font-weight:500;color:var(--vp-ink)}
html #ca-vipp .vp-prrow b{font-family:var(--hf);font-size:22px;font-weight:500;letter-spacing:.02em;color:var(--vp-ink)}
html #ca-vipp .vp-prsub{display:flex;justify-content:flex-end;gap:10px;font-size:12px;color:var(--vp-mut);margin-bottom:12px}
html #ca-vipp .vp-huf{color:var(--vp-mut);font-weight:400}
html #ca-vipp .vp-rows{margin:0 0 22px;border-bottom:1px solid var(--vp-ink)}
html #ca-vipp .vp-rows div{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:10px 0;border-top:1px solid var(--vp-line)}
html #ca-vipp .vp-rows dd{margin:0;font-size:14px;color:var(--vp-mut);text-align:right}
html #ca-vipp .vp-car .vp-ask{display:flex!important;width:max-content!important;margin:0 auto;justify-content:center}
/* foglalás */
html #ca-vipp .vp-booksec{background:none!important}
html #ca-vipp :is(.vp-book-main,.vp-sum-card,.vp-trust,.vp-direct a,.vp-pc,.vp-seg,.vp-seg span,.vp-occp span,.vp-sum-price,.vp-fl :is(input,select,textarea),.vp-pc-img,.vp-err){border-radius:0!important;box-shadow:none!important}
html #ca-vipp .vp-book-main{border:1px solid var(--vp-line)!important;background:var(--vp-card)!important}
html #ca-vipp .vp-prog li{border-top-color:var(--vp-line)!important;font-family:var(--hf);text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:500}
html #ca-vipp .vp-prog li.on,html #ca-vipp .vp-prog li.done{border-top-color:var(--vp-ink)!important;color:var(--vp-ink)}
html #ca-vipp .vp-prog i{border-radius:0;border-color:var(--vp-line)}
html #ca-vipp .vp-prog li.on i{background:var(--vp-btn)!important;color:var(--vp-btn-t)!important}
html #ca-vipp .vp-prog li.done i{background:none!important;border-color:var(--vp-ink)!important;color:var(--vp-ink)!important}
html #ca-vipp .vp-lg{font-family:var(--hf)!important;text-transform:uppercase;letter-spacing:.12em;font-size:16px!important;font-weight:500!important}
html #ca-vipp .vp-pc,html.ca-dark #ca-vipp .vp-pc{background:var(--vp-card)!important}
html #ca-vipp .vp-pc:hover{transform:none;border-color:var(--vp-ink)}
html #ca-vipp .vp-pc:has(input:checked){border-color:var(--vp-ink)!important;box-shadow:inset 0 0 0 1px var(--vp-ink)!important}
html #ca-vipp .vp-pc:has(input:checked):after{border-radius:0;background-color:var(--vp-btn);box-shadow:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E")}
html:not(.ca-dark) #ca-vipp .vp-pc:has(input:checked):after{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E")}
html.ca-dark #ca-vipp .vp-pc:has(input:checked):after{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E")}
html #ca-vipp .vp-pc-img{background:var(--vp-soft)!important;color:var(--vp-ink)!important}html #ca-vipp .vp-pc-img{aspect-ratio:4/3!important}html #ca-vipp .vp-pc-img img{object-fit:contain!important}
html #ca-vipp .vp-pc b{font-family:var(--hf);font-weight:500;text-transform:uppercase;letter-spacing:.06em;font-size:11.5px}
html #ca-vipp .vp-seg,html.ca-dark #ca-vipp .vp-seg{background:none!important;padding:0;gap:0}
html #ca-vipp .vp-seg label+label span{border-left:1px solid var(--vp-line)}
html #ca-vipp .vp-seg span{font-family:var(--hf);text-transform:uppercase;letter-spacing:.1em;font-size:11.5px!important;font-weight:500!important}
html #ca-vipp .vp-seg input:checked+span,html.ca-dark #ca-vipp .vp-seg input:checked+span{background:var(--vp-btn)!important;color:var(--vp-btn-t)!important;box-shadow:none!important}
html #ca-vipp .vp-occp span,html.ca-dark #ca-vipp .vp-occp span{background:var(--vp-card)!important;font-family:var(--hf);text-transform:uppercase;letter-spacing:.08em;font-size:11.5px;font-weight:500}
html #ca-vipp .vp-occp svg{background:none!important;color:var(--vp-ink)!important;padding:0;width:26px;height:26px;stroke-width:1.4}
html #ca-vipp .vp-occp input:checked+span{border-color:var(--vp-ink)!important;box-shadow:inset 0 0 0 1px var(--vp-ink)!important;background:var(--vp-card)!important}
html #ca-vipp .vp-fl{font-family:var(--hf);text-transform:uppercase;letter-spacing:.14em;font-size:10.5px!important;font-weight:500!important;color:var(--vp-ink)!important}
html #ca-vipp .vp-fl small{text-transform:none;letter-spacing:0;color:var(--vp-mut)}
html #ca-vipp .vp-fl :is(input,select,textarea),html.ca-dark #ca-vipp .vp-fl :is(input,select,textarea){background:var(--vp-card)!important;border:1px solid var(--vp-line)!important;color:var(--vp-ink)!important;text-transform:none;letter-spacing:0;font-family:inherit}
html #ca-vipp .vp-fl :is(input,select,textarea):focus{border-color:var(--vp-ink)!important;box-shadow:inset 0 0 0 1px var(--vp-ink)!important}
html #ca-vipp .vp-ck input{accent-color:var(--vp-ink)}html #ca-vipp .vp-ck a{color:var(--vp-ink)}
html #ca-vipp .vp-nav2 .vp-btn{height:52px}
html #ca-vipp .vp-sum-card{border:1px solid var(--vp-line)!important;background:var(--vp-card)!important}
html #ca-vipp .vp-sum-img{background-color:var(--vp-soft)!important;color:var(--vp-ink);aspect-ratio:4/3!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important}
html #ca-vipp .vp-sum-car{text-transform:uppercase;letter-spacing:.1em;font-size:16px!important;font-weight:500!important}
html #ca-vipp .vp-sum dt{font-family:var(--hf);text-transform:uppercase;letter-spacing:.14em;font-size:10.5px;color:var(--vp-ink);align-self:center}
html #ca-vipp .vp-sum dd{font-weight:400!important;color:var(--vp-mut)!important}
html #ca-vipp .vp-sum-price{background:none!important;border:0!important;border-top:1px solid var(--vp-ink)!important;border-bottom:1px solid var(--vp-ink)!important;padding:16px 0!important;margin-top:12px}
html #ca-vipp .vp-sum-price span{font-family:var(--hf);color:var(--vp-ink)!important;letter-spacing:.18em!important;font-size:10.5px!important;font-weight:500}
html #ca-vipp .vp-sum-price b{font-family:var(--hf);font-weight:400!important;font-size:28px!important;color:var(--vp-ink)}
html #ca-vipp .vp-sum-inc svg,html #ca-vipp .vp-trust>div{color:var(--vp-ink)!important}
html #ca-vipp .vp-trust{border:1px solid var(--vp-line)!important;background:var(--vp-card)!important}
html #ca-vipp .vp-trust b,html #ca-vipp .vp-direct b{font-family:var(--hf);text-transform:uppercase;letter-spacing:.1em;font-size:12px!important;font-weight:500}
html #ca-vipp .vp-direct a{background:var(--vp-card)!important;color:var(--vp-ink)!important}
html #ca-vipp .vp-direct a:hover{transform:none;border-color:var(--vp-ink)}
html #ca-vipp .vp-direct-t{font-family:var(--hf);text-transform:uppercase;letter-spacing:.14em;font-size:10.5px!important;color:var(--vp-ink)!important}
html #ca-vipp .vp-ok-ic{border-radius:0!important;background:var(--vp-btn)!important;color:var(--vp-btn-t)!important;box-shadow:none!important}
html #ca-vipp .vp-ok h3{font-family:var(--hf)!important;text-transform:uppercase;letter-spacing:.12em;font-weight:400!important;font-size:22px!important}
html #ca-vipp .vp-tl li:before{border-radius:0;border-color:var(--vp-ink);width:10px;height:10px}
html #ca-vipp .vp-tl li.done:before{background:var(--vp-ink)}
html #ca-vipp .vp-tl li:not(:last-child):after{background:var(--vp-line)}
html #ca-vipp .vp-err{background:none!important;border:1px solid var(--vp-ink)!important;color:var(--vp-ink)!important}
/* lebegő sáv */
html #ca-vipp .vp-bar{border-radius:0;padding:0;gap:0;box-shadow:0 10px 30px -12px rgba(0,0,0,.4);background:var(--vp-bg)}
html #ca-vipp .vp-bar-ic{border-radius:0;border:0;border-left:1px solid var(--vp-line);color:var(--vp-ink)!important;height:50px;width:52px}
/* lábléc */
html #ca-vipp .vp-foot{text-align:center;font-family:var(--hf);text-transform:uppercase;letter-spacing:.16em;font-size:10.5px}
@media(max-width:900px){html #ca-vipp .vp-perks-in{grid-template-columns:1fr 1fr}html #ca-vipp .vp-perks-in>.vp-perk:nth-child(3){border-left:0!important}html #ca-vipp .vp-perks-in>.vp-perk:nth-child(n+3){border-top:1px solid var(--vp-line)!important;padding-top:24px!important}html #ca-vipp .vp-fb{border-left:0}}
@media(max-width:640px){html #ca-vipp .vp-back{white-space:nowrap;font-size:12px}html #ca-vipp .vp-logo{letter-spacing:.3em;font-size:12px}html #ca-vipp .vp-tile em{display:none}html #ca-vipp .vp-tile{padding:22px 16px 20px}html #ca-vipp .vp-tile b{font-size:13px!important;letter-spacing:.1em}html #ca-vipp .vp-cars{row-gap:52px}html #ca-vipp .vp-car .vp-ask{width:100%!important}html #ca-vipp .vp-filters{text-align:center}html #ca-vipp .vp-f{justify-content:flex-start}}
</style>`;


// VIP a főoldal színeivel és betűivel (elrendezés változatlan): Plus Jakarta Sans, piros kiemelés, főoldali háttérszínek
const VIP_MAIN = `<style id="ca-dark-hu-vip-main">
html[data-vip]{--vp-bg:#F4F7FB;--vp-ink:#141519;--vp-mut:#5A6B82;--vp-line:rgba(20,21,25,.1);--vp-card:#FFFFFF;--vp-soft:#EEF2F7;--vp-btn:#E2001A;--vp-btn-t:#FFFFFF;--vp-red:#E2001A}
html[data-vip].ca-dark{--vp-bg:#0D0F13;--vp-ink:#E8EBF0;--vp-mut:#A3ADBC;--vp-line:#2A2B30;--vp-card:#17181B;--vp-soft:#1F2024;--vp-btn:#E2001A;--vp-btn-t:#FFFFFF}
html[data-vip] #ca-vipp{--hf:var(--font,'Plus Jakarta Sans',system-ui,sans-serif);font-family:var(--hf)}
html[data-vip] #ca-vipp *{font-family:var(--hf)!important}
/* címek: főoldali stílus */
html[data-vip] #ca-vipp :is(h1,h2,h3,.vp-lg,.vp-sum-car,.vp-ok h3,.vp-tile b,.vp-steps b,.vp-perk b,.vp-car>h3,.vp-pc b,.vp-trust b,.vp-direct b){text-transform:none!important;letter-spacing:-.02em!important;font-weight:800!important}
html[data-vip] #ca-vipp h2{font-size:clamp(30px,3.6vw,48px)!important;line-height:1.08!important}
html[data-vip] #ca-vipp h2:after{display:none!important}
html[data-vip] #ca-vipp .vp-hero h1{font-weight:800!important;letter-spacing:-.03em!important;font-size:clamp(40px,5vw,72px)!important}
html[data-vip] #ca-vipp .vp-ey{color:var(--vp-red)!important;font-weight:700!important;letter-spacing:.12em!important;font-size:13px!important}
html[data-vip] #ca-vipp .vp-hero .vp-ey{color:#fff!important}
html[data-vip] #ca-vipp .vp-car>h3{font-size:24px!important;min-height:0}
html[data-vip] #ca-vipp :is(.vp-tile b,.vp-steps b,.vp-perk b){font-size:18px!important}
html[data-vip] #ca-vipp .vp-lg{font-size:21px!important}
html[data-vip] #ca-vipp .vp-sum-car{font-size:20px!important}
html[data-vip] #ca-vipp .vp-num{font-weight:800!important;color:var(--vp-red)!important;-webkit-text-fill-color:var(--vp-red)!important}
/* címkék: normál írás */
html[data-vip] #ca-vipp :is(.vp-rows dt,.vp-prrow span,.vp-sum dt,.vp-fl,.vp-prog li,.vp-direct-t,.vp-fmeta,.vp-av,.vp-tile em,.vp-seg span,.vp-occp span,.vp-f button,.vp-sum-price span,.vp-nav a,.vp-foot){text-transform:none!important;letter-spacing:0!important}
html[data-vip] #ca-vipp :is(.vp-rows dt,.vp-sum dt){color:var(--vp-mut)!important;font-size:14px!important;font-weight:500!important}
html[data-vip] #ca-vipp :is(.vp-rows dd,.vp-sum dd){color:var(--vp-ink)!important;font-weight:700!important}
html[data-vip] #ca-vipp .vp-prrow span{font-size:14px!important;color:var(--vp-mut)!important;font-weight:500!important}
html[data-vip] #ca-vipp .vp-prrow b{font-size:28px!important;font-weight:800!important;letter-spacing:-.02em!important}
html[data-vip] #ca-vipp .vp-fl{font-size:13px!important;font-weight:700!important;color:var(--vp-ink)!important}
html[data-vip] #ca-vipp .vp-sum-price span{font-size:13px!important;font-weight:700!important;color:var(--vp-mut)!important}
html[data-vip] #ca-vipp .vp-sum-price b{font-weight:800!important;font-size:32px!important}
html[data-vip] #ca-vipp .vp-av{font-size:12px!important;font-weight:700!important;border-radius:999px!important;left:14px;top:14px}
html[data-vip] #ca-vipp .vp-tile em{font-size:13.5px!important;font-weight:700!important;color:var(--vp-red)!important}
/* gombok: főoldali pirula */
html[data-vip] #ca-vipp .vp-btn{border-radius:999px!important;height:54px;padding:0 28px;font-size:15.5px!important;font-weight:800!important;letter-spacing:0!important;text-transform:none!important}
html[data-vip] #ca-vipp .vp-gold{background:var(--vp-red)!important;border-color:var(--vp-red)!important;color:#fff!important;box-shadow:0 10px 24px -10px rgba(226,0,26,.55)!important}
html[data-vip] #ca-vipp .vp-ghost{background:#fff!important;border-color:#fff!important;color:#141519!important}
html[data-vip] #ca-vipp .vp-hero .vp-gold{background:var(--vp-red)!important;border-color:var(--vp-red)!important;color:#fff!important}
html[data-vip] #ca-vipp .vp-hero .vp-ghost{background:#fff!important;color:#141519!important;border-color:#fff!important}
@media(max-width:700px){html[data-vip] #ca-vipp .vp-hero .vp-ghost{border:1px solid var(--vp-line)!important}}
/* kártyák, mezők: lekerekítés a főoldal szerint */
html[data-vip] #ca-vipp :is(.vp-book-main,.vp-sum-card,.vp-trust,.vp-tile){border-radius:24px!important;background:var(--vp-card)!important;border:1px solid var(--vp-line)!important;overflow:hidden}
html[data-vip] #ca-vipp :is(.vp-direct a,.vp-pc,.vp-occp span,.vp-fl :is(input,select,textarea)){border-radius:14px!important}
html[data-vip] #ca-vipp .vp-pc-img{border-radius:10px!important}
html[data-vip] #ca-vipp .vp-seg{border-radius:14px!important;padding:4px!important;gap:4px!important;background:var(--vp-soft)!important;border:0!important}
html[data-vip] #ca-vipp .vp-seg label+label span{border-left:0!important}
html[data-vip] #ca-vipp .vp-seg span{border-radius:10px!important;font-size:14px!important;font-weight:700!important}
html[data-vip] #ca-vipp .vp-seg input:checked+span{background:var(--vp-card)!important;color:var(--vp-ink)!important;box-shadow:0 0 0 1.5px var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-occp span{font-size:14px!important;font-weight:700!important}
html[data-vip] #ca-vipp .vp-occp svg{color:var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-occp input:checked+span,html[data-vip] #ca-vipp .vp-pc:has(input:checked){border-color:var(--vp-red)!important;box-shadow:inset 0 0 0 1.5px var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-pc:has(input:checked):after{background-color:var(--vp-red)!important;border-radius:50%!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E")!important}
html[data-vip] #ca-vipp .vp-fl :is(input,select,textarea):focus{border-color:var(--vp-red)!important;box-shadow:0 0 0 3px rgba(226,0,26,.15)!important}
html[data-vip] #ca-vipp .vp-ck input{accent-color:var(--vp-red)}html[data-vip] #ca-vipp .vp-ck a{color:var(--vp-red)}
html[data-vip] #ca-vipp .vp-prog li.on,html[data-vip] #ca-vipp .vp-prog li.done{border-top-color:var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-prog i{border-radius:50%!important}
html[data-vip] #ca-vipp .vp-prog li.on i{background:var(--vp-red)!important;color:#fff!important;border-color:var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-prog li{font-size:13px!important;font-weight:700!important}
html[data-vip] #ca-vipp .vp-sum-price{border:0!important;background:var(--vp-soft)!important;border-radius:16px!important;padding:16px!important}
html[data-vip] #ca-vipp .vp-sum-inc svg,html[data-vip] #ca-vipp .vp-trust>div{color:var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-direct a{color:var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-ok-ic{border-radius:50%!important;background:var(--vp-red)!important;color:#fff!important}
html[data-vip] #ca-vipp .vp-tl li:before{border-radius:50%;border-color:var(--vp-red)}html[data-vip] #ca-vipp .vp-tl li.done:before{background:var(--vp-red)}
/* előnyök, alkalmak, lépések */
html[data-vip] #ca-vipp .vp-perk .vp-ic,html[data-vip] #ca-vipp .vp-oi{color:var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-tile:hover{border-color:var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-steps li{border-top:2px solid var(--vp-red)!important}
html[data-vip] #ca-vipp .vp-howmore{display:flex;gap:26px;flex-wrap:wrap;justify-content:center;max-width:none!important;margin:30px auto 0!important}html[data-vip] #ca-vipp .vp-howmore a{color:var(--vp-red);font-weight:700;text-decoration:none;font-size:15px}
/* szűrők */
html[data-vip] #ca-vipp .vp-f button{font-size:14px!important;font-weight:700!important;border-radius:999px!important;height:40px;padding:0 16px}
html[data-vip] #ca-vipp .vp-f[data-k=cat] button[aria-pressed=true]{background:var(--vp-ink)!important;color:var(--vp-bg)!important;box-shadow:none!important}
html[data-vip] #ca-vipp .vp-fb button[aria-pressed=true]{box-shadow:inset 0 0 0 1.5px var(--vp-red)!important;background:var(--vp-card)!important}
html[data-vip] #ca-vipp .vp-fmeta{font-size:13.5px!important;font-weight:700!important}
html[data-vip] #ca-vipp :is(.vp-reset,.vp-reset2,.vp-reset3){color:var(--vp-red)!important}
/* autókártyák: fehér kártya a főoldal szerint, elrendezés marad */
html[data-vip] #ca-vipp .vp-car{background:var(--vp-card)!important;border:1px solid var(--vp-line)!important;border-radius:24px!important;overflow:hidden!important;padding:0 0 22px}
html[data-vip] #ca-vipp .vp-car>h3{padding:20px 22px 0;margin:0 0 14px!important}
html[data-vip] #ca-vipp .vp-car>.vp-cb{padding:0 22px!important}
html[data-vip] #ca-vipp .vp-rows{border-bottom:1px solid var(--vp-line)!important}
html[data-vip] #ca-vipp .vp-zoom,html[data-vip] #ca-vipp .vp-arr{border-radius:50%!important}
html[data-vip] #ca-vipp .vp-zoom{right:12px;top:12px}
html[data-vip] #ca-vipp .vp-arr-p{left:12px}html[data-vip] #ca-vipp .vp-arr-n{right:12px}
/* lebegő sáv */
html[data-vip] #ca-vipp .vp-bar{border-radius:999px!important;padding:6px!important;gap:6px!important;background:var(--vp-card)!important;border:1px solid var(--vp-line)}
html[data-vip] #ca-vipp .vp-bar-ic{border-radius:50%!important;border:1px solid var(--vp-line)!important;width:48px;height:48px}
html[data-vip] #ca-vipp .vp-bar .vp-btn{height:48px}
/* fő menü a VIP oldalon: a fejléckép a menü alá fut, mint a főoldalon */
html[data-vip] #ca-vipp .vp-hero{padding-top:140px}
@media(max-width:700px){html[data-vip] #ca-vipp .vp-hero .vp-ey{color:var(--vp-red)!important}html[data-vip] #ca-vipp .vp-hero{padding-top:0}html[data-vip] #ca-vipp .vp-hero-bg{margin-top:84px}}
</style>`;


// ---------------------------------------------------------------- VIP aloldalak: Hogyan működik, Gyakori kérdések
const VSUB_HEAD = (ey, h1, p) => `<section class="vp-sec vp-subhead"><div class="vp-wrap"><a class="vp-crumb" href="/vip/">← VIP luxusautó-bérlés</a><div class="vp-ey">${ey}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const VSUB_CTA = `<section class="vp-sec"><div class="vp-wrap"><div class="vp-subcta"><div><h2>Kérj személyre szabott ajánlatot</h2><p>Díjtalan, és nem kötelez semmire. Az autót, a dátumot és az átvételt személyesen egyeztetjük.</p></div><div class="vp-btns"><a class="vp-btn vp-gold" href="/vip/#foglalas">Ajánlatot kérek</a><a class="vp-btn vp-ghost" href="/vip/#flotta">VIP flotta</a></div></div><div class="vp-subdirect"><a href="tel:${TEL}">${svg(IC.phone, 18)} ${TELTXT}</a><a href="${WA}" target="_blank" rel="noopener">${WAI} WhatsApp</a><a href="mailto:${MAIL}?subject=VIP%20luxusaut%C3%B3-b%C3%A9rl%C3%A9s">${svg(IC.mail, 18)} E-mail</a></div></div></section>`;
const HOW_STEPS = [
  ['Válassz autót és időpontot', 'Nézd át a VIP flottát, vagy indulj ki az alkalomból: esküvő, hétvége, születésnap, céges rendezvény, forgatás vagy üzleti út. Ha még nem döntöttél, ez sem gond – segítünk választani.', [['VIP flotta', '/vip/#flotta'], ['Alkalmak', '/vip/#alkalmak']]],
  ['Küldd el az ajánlatkérést', 'A foglalási űrlapon három rövid lépésben megadod az autót, a dátumokat, az átvétel idejét és helyét, az alkalmat és az elérhetőségedet. Az összesítő közben becsült díjat is mutat. Az ajánlatkérés díjtalan, és nem kötelez semmire.', [['Foglalás', '/vip/#foglalas']]],
  ['Személyesen egyeztetünk', 'A kapcsolattartód azon a módon keres, amit megadtál – telefonon, WhatsAppon vagy e-mailben, a kért napszakban. Átbeszéljük a részleteket: az autót, az időpontot, az átvételt és a különleges kéréseidet.', []],
  ['Írásos ajánlatot kapsz', 'Az ajánlatban minden szerepel: a kiválasztott autó, a bérlés időszaka, az átvétel helye és ideje, a végleges ár és a feltételek. Az oldalon látható árak tájékoztató jellegűek, a végleges árat az ajánlat tartalmazza.', []],
  ['Átveszed az autót', 'A megbeszélt időpontban átveszed az autót a telephelyünkön vagy az egyeztetett helyszínen. Napi 200 km minden bérlésben benne van – indulhat a nap.', []],
];
const HOW_INC = [['Napi 200 km', 'Minden VIP bérlésben benne van.'], ['Áfás árak', 'Az oldalon szereplő díjak áfával értendők.'], ['Egy kapcsolattartó', 'Az ajánlatkéréstől az átvételig ugyanaz a személy.'], ['Rugalmas időtartam', 'Egy nap, egy hétvége vagy egy hét.']];
const VIP_HOW = `<main id="ca-vipp" class="vp-sub" data-dm-skip="1">
${VSUB_HEAD('Hogyan működik', 'A VIP bérlés menete', 'Az első kattintástól az átvételig – öt lépésben, személyes kapcsolattartóval.')}
<section class="vp-sec vp-sub-steps"><div class="vp-wrap"><ol class="vp-timeline">${HOW_STEPS.map(([t, d, l], i) => `<li><span class="vp-tn">${String(i + 1).padStart(2, '0')}</span><div><h3>${t}</h3><p>${d}</p>${l.length ? `<div class="vp-tlinks">${l.map(([a, h]) => `<a href="${h}">${a} ${ARR}</a>`).join('')}</div>` : ''}</div></li>`).join('')}</ol></div></section>
<section class="vp-sec"><div class="vp-wrap"><div class="vp-ey">Minden bérlésben</div><h2>Amire számíthatsz</h2><div class="vp-incs">${HOW_INC.map(([t, d]) => `<div class="vp-inc"><span class="vp-inc-ic">${CHK}</span><b>${t}</b><span>${d}</span></div>`).join('')}</div></div></section>
${VSUB_CTA}
</main>`;
const FAQ = [
  ['Hogyan tudok VIP autót bérelni?', 'A VIP oldalon a foglalási űrlapon három rövid lépésben kérhetsz ajánlatot, de hívhatsz minket telefonon, vagy írhatsz WhatsAppon és e-mailben is. A kapcsolattartód felveszi veled a kapcsolatot, és személyre szabott ajánlatot küld.'],
  ['Mennyi időre bérelhetek autót?', 'Egy napra, egy hétvégére vagy egy hétre – az autók kártyáján mindhárom díjat feltüntettük. Ennél hosszabb időszakra egyedi ajánlatot adunk.'],
  ['Mit tartalmaz a bérleti díj?', 'Minden VIP bérlésben napi 200 km benne van, a díjak áfával értendők. Az oldalon látható árak tájékoztató jellegűek, a végleges árat és a részleteket az írásos ajánlat tartalmazza.'],
  ['Mi történik, ha napi 200 km-nél többet vezetek?', 'Ha már előre tudod, hogy többet mennél, írd meg az ajánlatkérésben a különleges kéréseknél. A többlet kilométerek díját az ajánlatban rögzítjük.'],
  ['Kell kauciót fizetni?', 'Igen, a VIP autóknál kaució szükséges. Az összege autónként eltér, a pontos összeget az ajánlatban adjuk meg.'],
  ['Milyen feltételekkel bérelhetek?', 'A bérlés feltételei autónként eltérhetnek. A személyes egyeztetéskor mindent elmondunk, és az írásos ajánlatban is szerepelnek.'],
  ['Hol veszem át az autót?', 'A telephelyünkön, vagy egy egyeztetett helyszínen. Az ajánlatkérésben megadhatod, hol és mikor szeretnéd átvenni.'],
  ['Mikor elérhetők az autók?', 'A legtöbb autó azonnal elérhető. Ahol nem, ott az autó fotóján jelöljük, hogy melyik naptól bérelhető.'],
  ['Kötelez valamire az ajánlatkérés?', 'Nem. Az ajánlatkérés díjtalan, és nem kötelez semmire – a foglalás csak az írásos ajánlat elfogadásával válik véglegessé.'],
  ['Bérelhetek autót rendezvényre vagy forgatásra?', 'Igen. Esküvőre, születésnapra, céges rendezvényre, film- és fotóforgatásra is bérelhetők az autók. Céges rendezvényekhez a Cégeknek oldalon további lehetőségeket is találsz.'],
  ['Hogyan érlek el a leggyorsabban?', 'Telefonon a +36 30 233 6060-as számon, vagy WhatsAppon ugyanezen a számon. Írásban az info@caradvance.hu címen is elérsz minket.'],
];
const VIP_FAQ_LD = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }) + '</script>';
const VIP_FAQP = `<main id="ca-vipp" class="vp-sub" data-dm-skip="1">
${VSUB_HEAD('Gyakori kérdések', 'Kérdések a VIP bérlésről', 'A legfontosabb tudnivalók röviden. Ha nem találod a választ, kérdezz minket nyugodtan.')}
<section class="vp-sec vp-sub-faq"><div class="vp-wrap"><div class="vp-faq">${FAQ.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>
${VSUB_CTA}
</main>${VIP_FAQ_LD}`;
const VIP_SUB_CSS = `<style id="ca-dark-hu-vip-sub">
html[data-vip] #ca-vipp.vp-sub .vp-subhead{padding:140px 0 10px}
html[data-vip] #ca-vipp.vp-sub .vp-subhead .vp-ey{display:block}html[data-vip] #ca-vipp .vp-crumb{display:inline-block;margin-bottom:22px;color:var(--vp-mut);text-decoration:none;font-weight:600;font-size:14px}
html[data-vip] #ca-vipp .vp-crumb:hover{color:var(--vp-red)}
html[data-vip] #ca-vipp.vp-sub h1{font-size:clamp(36px,4.6vw,60px)!important;font-weight:800!important;letter-spacing:-.03em!important;text-transform:none!important;margin:0 0 14px;color:var(--vp-ink)}
html[data-vip] #ca-vipp.vp-sub .vp-subhead p{max-width:620px}
html[data-vip] #ca-vipp .vp-timeline{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px;max-width:880px}
html[data-vip] #ca-vipp .vp-timeline li{display:grid;grid-template-columns:72px 1fr;gap:18px;padding:26px 28px;border-radius:24px;background:var(--vp-card);border:1px solid var(--vp-line)}
html[data-vip] #ca-vipp .vp-tn{font-size:34px;font-weight:800;letter-spacing:-.03em;color:var(--vp-red);line-height:1}
html[data-vip] #ca-vipp .vp-timeline h3{margin:0 0 8px;font-size:21px;font-weight:800;letter-spacing:-.02em;color:var(--vp-ink)}
html[data-vip] #ca-vipp .vp-timeline p{margin:0;max-width:none;font-size:15.5px}
html[data-vip] #ca-vipp .vp-tlinks{display:flex;gap:16px;flex-wrap:wrap;margin-top:14px}
html[data-vip] #ca-vipp .vp-tlinks a{display:inline-flex;align-items:center;gap:6px;color:var(--vp-red);font-weight:700;text-decoration:none;font-size:14.5px}
html[data-vip] #ca-vipp .vp-incs{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:26px}
html[data-vip] #ca-vipp .vp-inc{display:flex;flex-direction:column;gap:6px;padding:24px 22px;border-radius:24px;background:var(--vp-card);border:1px solid var(--vp-line);color:var(--vp-mut);font-size:14.5px;line-height:1.5}
html[data-vip] #ca-vipp .vp-inc b{color:var(--vp-ink);font-size:17px}
html[data-vip] #ca-vipp .vp-inc-ic{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(226,0,26,.1);color:var(--vp-red);margin-bottom:8px}
html[data-vip] #ca-vipp .vp-faq{display:flex;flex-direction:column;gap:10px;max-width:880px}
html[data-vip] #ca-vipp .vp-faq details{border-radius:20px;background:var(--vp-card);border:1px solid var(--vp-line);overflow:hidden}
html[data-vip] #ca-vipp .vp-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:18px;padding:22px 24px;font-size:17px;font-weight:800;letter-spacing:-.01em;color:var(--vp-ink)}
html[data-vip] #ca-vipp .vp-faq summary::-webkit-details-marker{display:none}
html[data-vip] #ca-vipp .vp-fx{flex:none;width:30px;height:30px;border-radius:50%;background:var(--vp-soft);position:relative;transition:transform .2s}
html[data-vip] #ca-vipp .vp-fx:before,html[data-vip] #ca-vipp .vp-fx:after{content:"";position:absolute;left:50%;top:50%;width:12px;height:2px;margin:-1px 0 0 -6px;background:var(--vp-ink);border-radius:2px}
html[data-vip] #ca-vipp .vp-fx:after{transform:rotate(90deg);transition:opacity .2s}
html[data-vip] #ca-vipp .vp-faq details[open] .vp-fx{background:var(--vp-red)}
html[data-vip] #ca-vipp .vp-faq details[open] .vp-fx:before{background:#fff}html[data-vip] #ca-vipp .vp-faq details[open] .vp-fx:after{opacity:0}
html[data-vip] #ca-vipp .vp-faq details p{margin:0;padding:0 24px 22px;max-width:none;font-size:15.5px}
html[data-vip] #ca-vipp .vp-subcta{display:flex;justify-content:space-between;align-items:center;gap:30px;padding:36px;border-radius:28px;background:var(--vp-card);border:1px solid var(--vp-line)}
html[data-vip] #ca-vipp .vp-subcta h2{font-size:clamp(24px,2.6vw,34px)!important;margin:0 0 8px}
html[data-vip] #ca-vipp .vp-subcta p{margin:0}
html[data-vip] #ca-vipp .vp-subdirect{display:flex;gap:22px;flex-wrap:wrap;margin-top:18px;padding-left:6px}
html[data-vip] #ca-vipp .vp-subdirect a{display:inline-flex;align-items:center;gap:8px;color:var(--vp-ink);text-decoration:none;font-weight:700;font-size:14.5px}
html[data-vip] #ca-vipp .vp-subdirect svg{color:var(--vp-red)}
@media(max-width:900px){html[data-vip] #ca-vipp .vp-incs{grid-template-columns:1fr 1fr}html[data-vip] #ca-vipp .vp-subcta{flex-direction:column;align-items:flex-start}}
@media(max-width:600px){html[data-vip] #ca-vipp.vp-sub .vp-subhead{padding:120px 0 10px}html[data-vip] #ca-vipp .vp-timeline li{grid-template-columns:1fr;gap:8px;padding:22px 20px}html[data-vip] #ca-vipp .vp-incs{grid-template-columns:1fr}html[data-vip] #ca-vipp .vp-subcta{padding:24px}html[data-vip] #ca-vipp .vp-faq summary{padding:18px 18px;font-size:15.5px}html[data-vip] #ca-vipp .vp-faq details p{padding:0 18px 18px}}
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
    'Privát luxusautó-bérlés: sport- és luxusautók napi bérlésre, személyes kapcsolattartóval és egyedi ajánlattal.', VIP, VIP_CSS + VIP_MONO + VIP_MAIN, 'data-vip="1"');
  make(tpl, 'vip/hogyan-mukodik', 'Hogyan működik a VIP luxusautó-bérlés? — CarAdvance',
    'A VIP luxusautó-bérlés menete öt lépésben: autóválasztás, ajánlatkérés, személyes egyeztetés, írásos ajánlat és átvétel.', VIP_HOW, VIP_CSS + VIP_MONO + VIP_MAIN + VIP_SUB_CSS, 'data-vip="1"');
  make(tpl, 'vip/gyakori-kerdesek', 'VIP luxusautó-bérlés – gyakori kérdések — CarAdvance',
    'Gyakori kérdések a VIP luxusautó-bérlésről: bérlési idő, díjak, napi 200 km, kaució, átvétel és ajánlatkérés.', VIP_FAQP, VIP_CSS + VIP_MONO + VIP_MAIN + VIP_SUB_CSS, 'data-vip="1"');
  return 'kész: /cegeknek/, /vip/, /vip/hogyan-mukodik/, /vip/gyakori-kerdesek/ (sablon: ' + path.relative(DIST, tplF) + ')';
}
try { console.log('[hu-pages] ' + run()); } catch (e) { console.log('[hu-pages] hiba: ' + (e && e.message || e)); }
