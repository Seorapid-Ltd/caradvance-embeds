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
const OCC = ['Esküvő', 'Hétvége', 'Születésnap', 'Céges rendezvény', 'Forgatás, fotózás', 'Üzleti út'];
const VIP = `<main id="ca-vipp" data-dm-skip="1">
<header class="vp-top"><div class="vp-wrap vp-top-in">
  <a class="vp-logo" href="/vip/"><span class="vp-g">CARADVANCE</span><i>VIP</i></a>
  <nav class="vp-nav"><a href="#szolgaltatas">Szolgáltatás</a><a href="#alkalmak">Alkalmak</a><a href="#flotta">Flotta</a><a href="#kapcsolat">Kapcsolat</a></nav>
  <a class="vp-back" href="/">← caradvance.hu</a>
</div></header>
<section class="vp-hero">
  <div class="vp-hero-bg" style="background-image:url('/caradvance-hero-x5-poster.jpg')"></div>
  <div class="vp-wrap vp-hero-in">
    <div class="vp-ey">Privát luxusautó-bérlés</div>
    <h1>Egy nap.<br><span class="vp-g">Egy élmény.</span></h1>
    <p>Sport- és luxusautók napi bérlésre — személyes kapcsolattartóval, egyedi ajánlattal, diszkréten.</p>
    <div class="vp-btns"><a class="vp-btn vp-gold" href="#kapcsolat">Személyes ajánlatot kérek</a><a class="vp-btn vp-ghost" href="#alkalmak">Alkalmak</a></div>
  </div>
</section>
<section class="vp-perks" id="szolgaltatas"><div class="vp-wrap vp-perks-in">
  ${[['cal', 'Napi bérlés', 'Egy napra, egy hétvégére vagy egy hétre'], ['user', 'Személyes kapcsolattartó', 'Egy név, egy telefonszám — végig'], ['spark', 'Egyedi ajánlat', 'Az autót és az átvételt hozzád igazítjuk'], ['lock', 'Diszkréció', 'Csendes, gyors és megbízható ügyintézés']]
    .map(([i, t, d]) => `<div><span class="vp-ic">${svg(IC[i], 20)}</span><b>${t}</b><span>${d}</span></div>`).join('')}
</div></section>
<section class="vp-sec" id="alkalmak"><div class="vp-wrap">
  <div class="vp-ey">Alkalmak</div><h2>Minden különleges naphoz a megfelelő autó</h2>
  <div class="vp-occ">${OCC.map(o => `<span>${o}</span>`).join('')}</div>
</div></section>
<section class="vp-sec" id="flotta"><div class="vp-wrap"><div class="vp-fleet">
  <span class="vp-ic vp-ic-lg">${svg(IC.crown, 26)}</span>
  <div><div class="vp-ey">VIP flotta</div><h2>A teljes flotta hamarosan itt</h2><p>Az aktuálisan elérhető autókról és napidíjakról személyre szabott ajánlatot küldünk — írd meg, milyen autót és melyik napra szeretnél.</p></div>
</div></div></section>
<section class="vp-sec" id="kapcsolat"><div class="vp-wrap"><div class="vp-cta">
  <div class="vp-ey">Személyes ajánlat</div><h2>Mondd el, milyen napot tervezel</h2>
  <p>Az autót, a dátumot és az átvételt személyesen egyeztetjük.</p>
  <div class="vp-btns"><a class="vp-btn vp-gold" href="tel:${TEL}">${svg(IC.phone, 18)} ${TELTXT}</a><a class="vp-btn vp-ghost" href="mailto:${MAIL}?subject=VIP%20luxusaut%C3%B3-b%C3%A9rl%C3%A9s">${svg(IC.mail, 18)} Írj nekünk</a></div>
</div></div></section>
<footer class="vp-foot"><div class="vp-wrap">© ${new Date().getFullYear()} Caradvance · <a href="/">caradvance.hu</a> · <a href="/adatkezeles/">Adatkezelés</a> · <a href="/impresszum/">Impresszum</a></div></footer>
</main>`;

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
#ca-vipp .vp-hero{position:relative;overflow:hidden;min-height:min(78vh,640px);display:flex;align-items:flex-end;padding:120px 0 70px}
#ca-vipp .vp-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center}
#ca-vipp .vp-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--vp-bg) 22%,color-mix(in srgb,var(--vp-bg) 40%,transparent) 62%,transparent),linear-gradient(0deg,var(--vp-bg),transparent 40%)}
#ca-vipp .vp-hero-in{position:relative;z-index:1;width:100%}
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
#ca-vipp .vp-perks{padding:10px 0 30px}
#ca-vipp .vp-perks-in{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;border-top:1px solid var(--vp-line);padding-top:30px}
#ca-vipp .vp-perks-in>div{display:flex;flex-direction:column;gap:4px;font-size:14px;color:var(--vp-mut)}
#ca-vipp .vp-perks-in b{color:var(--vp-ink);font-size:15.5px;margin-top:10px}
#ca-vipp .vp-ic{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--vp-line);color:#B08A35}
#ca-vipp .vp-ic-lg{width:64px;height:64px;flex:none}
#ca-vipp .vp-sec{padding:70px 0}
#ca-vipp .vp-occ{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
#ca-vipp .vp-occ span{padding:12px 20px;border-radius:999px;border:1px solid var(--vp-line);background:var(--vp-card);font-weight:600;font-size:15px}
#ca-vipp .vp-fleet{display:flex;gap:28px;align-items:flex-start;padding:40px;border-radius:28px;border:1px solid var(--vp-line);background:var(--vp-card)}
#ca-vipp .vp-fleet p{margin:0}
#ca-vipp .vp-cta{text-align:center;padding:64px 28px;border-radius:32px;border:1px solid var(--vp-line);background:radial-gradient(60% 120% at 50% 120%,rgba(201,162,75,.22),transparent 70%),var(--vp-card)}
#ca-vipp .vp-cta p{margin:0 auto 26px}#ca-vipp .vp-cta .vp-btns{justify-content:center}
#ca-vipp .vp-foot{padding:34px 0 44px;border-top:1px solid var(--vp-line);font-size:13px;color:var(--vp-mut)}
#ca-vipp .vp-foot a{color:var(--vp-mut);text-decoration:none}#ca-vipp .vp-foot a:hover{color:var(--vp-ink)}
#ca-vipp [id]{scroll-margin-top:90px}
@media(max-width:900px){#ca-vipp .vp-nav{display:none}#ca-vipp .vp-back{margin-left:auto}#ca-vipp .vp-perks-in{grid-template-columns:1fr 1fr}}
@media(max-width:600px){#ca-vipp .vp-wrap{padding:0 18px}#ca-vipp .vp-hero{padding:90px 0 50px}#ca-vipp .vp-perks-in{grid-template-columns:1fr}#ca-vipp .vp-fleet{flex-direction:column;padding:26px}#ca-vipp .vp-btn{width:100%;justify-content:center}#ca-vipp .vp-logo{letter-spacing:.2em;font-size:12.5px}}
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
