/**
 * CarAdvance — a készlet-tábla (Google Sheet) olvasása SZERVEROLDALON (Pages Functions + Node build).
 *
 * 2026-11-24 (Mr. Job SK lista, 15. pont): a böngésző többé nem tölti le közvetlenül a Google-táblát
 * (abban mobile_id, forras, sajat … is van). A weboldal a /api/sheet végponton keresztül kap adatot,
 * amely csak a nyilvános oszlopokat adja tovább (publicCsv).
 *
 * Hitelesítés: ha be van állítva a GOOGLE_SHEETS_SA titok (Google service account JSON-kulcs, a táblához
 * „Olvasó” joggal megosztva), akkor OAuth-tokennel olvasunk — így a tábla nyilvános linkes megosztása
 * kikapcsolható. A titok nélkül a régi, nyilvános gviz-címet használja (átmeneti állapot).
 */
export const SHEET_ID = '1rVdjNPmwPnqZ-whBBs0f_xnAnZRXP-ozeaNkQBvIO2Y';
const GVIZ = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;

/* ---------------- OAuth (service account → access token), WebCrypto: Workers + Node 20+ ---------------- */
let TOKEN = null; // { key, value, exp }
const b64u = (input) => {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
function pemToDer(pem) {
  const b = atob(String(pem).replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
  const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u.buffer;
}
function saFrom(env) {
  const raw = (env && (env.GOOGLE_SHEETS_SA || env.GOOGLE_SA_JSON)) || '';
  if (!raw) return null;
  try { const j = typeof raw === 'string' ? JSON.parse(raw) : raw; return j.client_email && j.private_key ? j : null; } catch (e) { return null; }
}
async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (TOKEN && TOKEN.key === sa.client_email && TOKEN.exp - 60 > now) return TOKEN.value;
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64u(JSON.stringify({
    iss: sa.client_email, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly',
  }));
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + claim));
  const jwt = head + '.' + claim + '.' + b64u(sig);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('Google OAuth hiba: ' + (j.error_description || j.error || r.status));
  TOKEN = { key: sa.client_email, value: j.access_token, exp: now + (j.expires_in || 3600) };
  return TOKEN.value;
}

/**
 * gviz-lekérés a táblából (pontosan ugyanaz a válaszformátum, mint eddig).
 * query: pl. 'tqx=out:csv' · 'tqx=out:csv&sheet=bizomanyos' · 'tqx=out:json&sheet=autok&headers=1'
 */
export async function fetchGviz(env, query, init = {}) {
  const sa = saFrom(env);
  const url = GVIZ + '?' + query;
  if (!sa) return fetch(url, init);
  const tok = await accessToken(sa);
  const { cf, ...rest } = init; // hitelesített kérésnél ne gyorsítótárazzon a Cloudflare a közös URL-re
  return fetch(url, { ...rest, headers: { ...(rest.headers || {}), Authorization: 'Bearer ' + tok } });
}

/* ---------------- CSV + nyilvános oszlopok ---------------- */
export function parseCsvRows(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}
export const toCsv = (rows) => rows.map((r) => r.map((v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n');

/** gviz JSON (out:json) → sorok, ugyanúgy, ahogy a régi böngészős „gvizJsonShim” csinálta (dátum: formázott érték). */
export function gvizJsonRows(t) {
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  const j = JSON.parse(t.slice(a, b + 1));
  const val = (c) => {
    if (!c) return '';
    const v = c.v;
    if (typeof v === 'string' && /^Date\(/.test(v)) return c.f != null ? c.f : v;
    if (v == null) return c.f != null ? c.f : '';
    return v;
  };
  const head = j.table.cols.map((c) => c.label || '');
  return [head, ...j.table.rows.map((r) => (r.c || []).map(val))];
}

/** A weboldal által használt oszlopok — minden más (mobile_id, forras, sajat, kulcs, utolso_latas, …) kimarad. */
export const PUBLIC_COLS = new Set([
  'modell', 'marka', 'karosszeria', 'km', 'teljesitmeny', 'valto', 'uzemanyag', 'evjarat', 'hajtas',
  'berlet_eur', 'vetel_eur', 'vetel_eur_netto', 'vetel_huf', 'kep_url', 'kep_url_manual', 'kiemelt', 'felszereltseg', 'galeria',
  'aktiv', 'hozzaadva', 'elkelt', 'elkelt_datum', 'berelheto', 'berlet_modell', 'kaucio_eur', 'berlet_2000_eur', 'berlet_3000_eur', 'slug',
  // bizományos lap
  'seller_ngo', 'seller', 'vetel_ft', 'ar_ft', 'eur',
]);

/**
 * Nyilvános tábla: csak a PUBLIC_COLS oszlopok + egy származtatott „berles_ok” oszlop
 * („nem” = partner autója, nem a saját flotta → nem bérelhető; ezt eddig a böngésző számolta a forras/sajat oszlopból).
 */
export function publicRows(rows) {
  if (!rows.length) return rows;
  const head = rows[0].map((h) => String(h).trim().toLowerCase());
  const keep = head.map((h, i) => (PUBLIC_COLS.has(h) ? i : -1)).filter((i) => i >= 0);
  const iF = head.indexOf('forras'), iS = head.indexOf('sajat');
  const own = (r) => {
    const f = iF < 0 ? '' : String(r[iF] || '').trim().toLowerCase();
    const s = iS < 0 ? '' : String(r[iS] || '').trim().toLowerCase();
    return !(f && f !== 'caradvance' && s !== 'igen');
  };
  const withFlag = iF >= 0 || iS >= 0;
  const out = [keep.map((i) => head[i]).concat(withFlag ? ['berles_ok'] : [])];
  for (let n = 1; n < rows.length; n++) {
    const r = rows[n];
    out.push(keep.map((i) => (i < r.length ? r[i] : '')).concat(withFlag ? [own(r) ? 'igen' : 'nem'] : []));
  }
  return out;
}
