# SEO-CHANGELOG — CarAdvance

Minden SEO-változás ide kerül: dátum, piac, mi változott, melyik build-lépés csinálja, mérés előtte/utána.

## 2026-11-24 — HU / CH / EU, SEO prompt-csomag 1–5. lépés

### CH (dev.caradvance.ch) és EU (dev.caradvance.eu) — `xlang-sk1124.mjs` (ONLY: ch, eu)
- Fordítatlan szlovák szöveg (bérlés-, használtautó-, újautó-oldalak, nyelvenként ~150 oldal) sablonos fordítása de/fr/it/en/es nyelvre:
  ~9 600 szövegegység → ~50. Országonként 108 fordítatlan modelldizájn-bekezdés kivéve (fordítás: [ADAT SZÜKSÉGES]).
- Title > 60: CH 393 → 0, EU 252 → 0; meta > 160: CH 305 → 0, EU 218 → 0; meta < 110: CH 163 → 0, EU 74 → 0
  (rövid meta: ajánlatkérő mondat); importkosten-rechner H1 (CH, 4 oldal).
- Kulcsszótérkép (Ahrefs, 2026-11-24): fő oldalak title-je (főoldal, bérlés, BMW/Mercedes/Audi/MINI konfigurátor, import,
  importköltség-kalkulátor) piaconként; konfigurátor-oldal H1: „BMW, Mercedes, Audi & MINI Konfigurator …” (5 nyelven).
- Ahrefs Web Analytics: saját kulcs (CH 10760726, EU 10760728) a magyar helyett.
- Telefon/iPad: vízszintes kilógás javítva (3D-autókarusszel, jogi sáv, renting-űrlap) — `<style id="x1124">`.

### HU (dev.caradvance.hu) — `hu-seo1124.mjs` (ONLY: hu)
- 19 Astro meta-refresh csonk (200) törölve → a meglévő 301 érvényesül; 829 belső link a végső URL-re
  (nem létező bérlés-modelloldal → rokon modell / márka bérelhető autói). Hibás/átirányított linkcél: 32 → 12.
- Title > 60: 29 → 0 („ | CarAdvance”, „, Németországból” le, kulcsszó marad); /kapcsolat title; /szerzodes meta; 2 hosszú meta.
- /egyedi-auto-rendeles/ H1: „BMW, Mercedes, Audi és MINI konfigurátor – egyedi autó rendelés” (bmw konfigurátor 900/hó, 6. hely).

### HU / CH / EU — `trust1124.mjs` (ONLY: hu, ch, eu)
- Blog: látható szerzősor („Szerző: a CarAdvance csapata” / „Autor: Team CarAdvance” …) a Rólunk oldalra linkelve; BlogPosting.author.
- AutoDealer schema: munkatársak (employee) a kapcsolat-oldalról; anyacég (Caradvance GmbH, DE232664616, HRB 151009, 2003).

### Mérés (Ahrefs)
- Projektek: HU 10162655 (Health 98, 2026-11-18), CH 10760726, EU 10760728 (új, élesítésig noindex).
- Rank Tracker: CH 15, EU 24 (AT/FR/IT/ES), HU +7 kulcsszó (39 összesen).
- Brand Radar: CH (10 prompt), EU (10 prompt AT/FR/IT/ES), heti ChatGPT / AI Overviews / AI Mode.
