// CarAdvance Sales Desk — API between the desk page and Notion (the master copy).
// Runs as a Cloudflare Pages Function: functions/api/desk/[[path]].js. The page is /sales/ (functions/sales/_middleware.js).
// Sign-in: the existing staff login (/admin/, ca_session cookie, D1 "DB" sessions + users) — any staff role.
//
// Environment:
//   DESK_NOTION_TOKEN   secret  — Notion internal integration token, connected to the "CarAdvance Sales Desk" page
//                                 (falls back to NOTION_TOKEN if that integration is in the same workspace)
//   DB                  D1      — already bound (staff accounts)
//   DESK_DEV_NO_ACCESS  var     — "1" only for local testing; never set in Cloudflare
//
// Routes:
//   GET  /api/desk/data   → { vehicles, dealers, outreach, me }
//   POST /api/desk/write  { op: "set"|"update"|"delete", path: "dealers/HU-abn", data: {...}, prev: {...} }
//        prev = the values the user saw for each field being changed. If Notion now holds something
//        different for any of those fields, nothing is written and 409 returns the current record.

const NOTION = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';
export const DS = {
  vehicles: '4231b3fa-181e-81d1-a613-000bedd39111',
  dealers: '4231b3fa-181e-81c3-a234-000b272b8bab',
  outreach: '4231b3fa-181e-8101-a561-000b28a6a538',
};
const CACHE_SECONDS = 15;

/* ---------------- field maps: desk field → [Notion property, type] ---------------- */
export const MAP = {
  vehicles: {
    id: ['Stock ID', 'text'], model: ['Car', 'title'], category: ['Category', 'select'], make: ['Make', 'select'],
    status: ['Status', 'select'], status_changed: ['Status changed', 'date'], vin: ['VIN', 'text'], plate: ['Plate', 'text'],
    first_reg: ['First reg', 'text'], mileage: ['Mileage km', 'number'], km_text: ['Mileage note', 'text'],
    colour: ['Colour', 'text'], interior: ['Interior', 'text'], power: ['Power', 'text'], fuel: ['Fuel', 'text'],
    transmission: ['Transmission', 'text'], drive: ['Drive', 'text'], dealer_net: ['B2B', 'number'],
    dealer_gross: ['B2C', 'number'], msrp_gross: ['List price new', 'number'], asking_price: ['Asking price', 'number'],
    min_price: ['Minimum price', 'number'], available_until: ['Available until', 'date'], highlights: ['Highlights', 'list'],
    source: ['Source', 'text'], data_gaps: ['Data gaps', 'text'], reserved_for: ['Reserved for', 'text'], notes: ['Notes', 'text'],
    prev_owners: ['Previous owners', 'number'], condition: ['Condition', 'text'], paint: ['Paint (manufacturer)', 'text'],
    trim: ['Trim', 'text'], climate: ['Climate', 'text'], park_assist: ['Park assist', 'text'], seats: ['Seats', 'number'],
    doors: ['Doors', 'text'], engine_cc: ['Engine cc', 'number'], equipment: ['Equipment', 'list'], photo_count: ['Photos', 'number'], rent_sale: ['Rental & sale', 'checkbox'],
    // team only — never in PUBLIC_FIELDS
    mde_url: ['mobile.de link', 'url'], mde_price: ['mobile.de price', 'number'], mde_km: ['mobile.de km', 'number'],
    mde_checked: ['mobile.de checked', 'date'], mde_desc: ['mobile.de description', 'text'],
    updated: ['Updated', 'readonly_edited'],
  },
  dealers: {
    id: ['Dealer ID', 'text'], name: ['Company', 'title'], legal_name: ['Legal name', 'text'], reg_no: ['Reg. no.', 'text'],
    country: ['Country', 'select'], city: ['City', 'text'], address: ['Address', 'text'], website: ['Website', 'url'],
    tier: ['Type', 'tier'], brands: ['Brands', 'text'], premium_stock: ['Premium stock', 'number'], fit: ['Fit', 'select'],
    email: ['Email', 'email'], phone: ['Phone', 'phone'], contact_name: ['Contact person', 'text'],
    contact_title: ['Contact title', 'text'], contact_email: ['Contact email', 'email'], contact_phone: ['Contact phone', 'phone'],
    language: ['Language', 'select'], score: ['Score', 'number'], score_reason: ['Score reason', 'text'],
    status: ['Status', 'select'], owner: ['Owner', 'text'], last_contact: ['Last contact', 'date'], sources: ['Sources', 'text'],
    notes: ['Notes', 'text'], updated: ['Updated', 'readonly_edited'],
  },
  outreach: {
    date: ['Date', 'date'], dealer: ['Dealer', 'dealer_rel'], cars: ['Cars (as typed)', 'text'], channel: ['Channel', 'select'],
    direction: ['Direction', 'select'], member: ['Team member', 'text'], outcome: ['Outcome', 'select'],
    next_step: ['Next step', 'text'], follow_up: ['Follow-up', 'date'], notes: ['Notes', 'text'],
    log_no: ['Log ID', 'readonly_uid'], logged: ['Logged', 'readonly_created'],
  },
};
export const VAT = 0.19;
export const b2c = net => Math.round(Number(net) * (1 + VAT) * 100) / 100;
const TIERS = { 1: '1 BMW/MINI dealer', 2: '2 Premium used', 3: '3 Trader/importer' };

/* ---------------- Notion value ⇄ desk value ---------------- */
const plain = arr => (arr || []).map(t => t.plain_text ?? t.text?.content ?? '').join('');
function readProp(p, type) {
  if (!p) return undefined;
  switch (type) {
    case 'title': return plain(p.title) || undefined;
    case 'text': case 'list': {
      const s = plain(p.rich_text); if (!s) return undefined;
      return type === 'list' ? s.split(/;\s*/).map(x => x.trim()).filter(x => x && x !== '…') : s;
    }
    case 'number': return p.number ?? undefined;
    case 'select': return p.select?.name ?? undefined;
    case 'tier': { const n = parseInt(p.select?.name, 10); return isNaN(n) ? undefined : n; }
    case 'date': return p.date?.start ?? undefined;
    case 'email': return p.email ?? undefined;
    case 'phone': return p.phone_number ?? undefined;
    case 'url': return p.url ?? undefined;
    case 'checkbox': return p.checkbox ? true : undefined;
    case 'readonly_edited': return p.last_edited_time?.slice(0, 10);
    case 'readonly_created': return p.created_time;
    case 'readonly_uid': return p.unique_id?.number ?? undefined;
    case 'dealer_rel': return p.relation?.[0]?.id; // page id — translated to Dealer ID by the caller
  }
}
const chunks = s => { const out = []; for (let i = 0; i < s.length; i += 1900) out.push({ type: 'text', text: { content: s.slice(i, i + 1900) } }); return out; };
function writeProp(type, v) {
  const empty = v === null || v === undefined || v === '';
  switch (type) {
    case 'title': return { title: empty ? [] : chunks(String(v)) };
    case 'text': return { rich_text: empty ? [] : chunks(String(v)) };
    case 'list': return { rich_text: empty ? [] : chunks(Array.isArray(v) ? v.join('; ') : String(v)) };
    case 'number': { if (empty) return { number: null }; const n = Number(v); if (isNaN(n)) throw bad(`"${v}" is not a number`); return { number: n }; }
    case 'select': return { select: empty ? null : { name: String(v) } };
    case 'tier': return { select: empty ? null : { name: TIERS[v] || String(v) } };
    case 'date': return { date: empty ? null : { start: String(v).slice(0, 10) } };
    case 'email': return { email: empty ? null : String(v) };
    case 'phone': return { phone_number: empty ? null : String(v) };
    case 'url': return { url: empty ? null : String(v) };
    case 'checkbox': return { checkbox: !!v && v !== 'false' && v !== '0' };
  }
  return undefined; // read-only and unknown types are skipped
}

export function pageToDoc(col, page, idx) {
  const d = { _pid: page.id };
  for (const [k, [prop, type]] of Object.entries(MAP[col])) {
    const v = readProp(page.properties?.[prop], type);
    if (v !== undefined) d[k] = v;
  }
  if (col === 'vehicles') {
    if (d.source) d.price_source = d.source;
    // Rule: B2B is the dealer price without VAT. If B2C is missing, it is B2B + 19% VAT.
    if (d.dealer_net != null && d.dealer_gross == null) { d.dealer_gross = b2c(d.dealer_net); d.b2c_generated = true; }
    if (d.dealer_gross && d.msrp_gross) d.pct_vs_list = Math.round((d.dealer_gross / d.msrp_gross - 1) * 1000) / 10;
  }
  if (col === 'outreach') {
    d.id = page.id;
    if (d.dealer && idx) d.dealer = idx.dealerByPid[d.dealer] || d.dealer;
    if (!d.cars && idx) {
      const ids = (page.properties?.Cars?.relation || []).map(r => idx.vehicleByPid[r.id]).filter(Boolean);
      if (ids.length) d.cars = ids.join(', ');
    }
  }
  return d;
}

/* ---------------- Notion HTTP ---------------- */
function bad(msg, status = 400) { const e = new Error(msg); e.status = status; return e; }
async function notion(env, method, path, body) {
  const token = env.DESK_NOTION_TOKEN || env.NOTION_TOKEN;
  if (!token) throw bad('The desk is not connected to Notion yet (DESK_NOTION_TOKEN is missing).', 503);
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(NOTION + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 429 && attempt < 3) { await new Promise(res => setTimeout(res, (Number(r.headers.get('Retry-After')) || 1) * 1000)); continue; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw bad(`Notion: ${j.message || r.status}`, r.status === 404 ? 404 : 502);
    return j;
  }
}
async function queryAll(env, ds) {
  const out = []; let cursor;
  do {
    const j = await notion(env, 'POST', `/data_sources/${ds}/query`, { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) });
    out.push(...j.results.filter(p => !p.in_trash && !p.archived)); cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}

/* ---------------- data snapshot (shared cache, short TTL) ---------------- */
let memo = null; // per-isolate
async function loadAll(env, ctx, fresh) {
  if (!fresh && memo && Date.now() - memo.t < CACHE_SECONDS * 1000) return memo.data;
  const [vp, dp, op] = await Promise.all([queryAll(env, DS.vehicles), queryAll(env, DS.dealers), queryAll(env, DS.outreach)]);
  const idx = { dealerByPid: {}, vehicleByPid: {}, dealerPid: {}, vehiclePid: {}, vehicleCat: {} };
  const vehicles = vp.map(p => pageToDoc('vehicles', p)).filter(d => d.id);
  const dealers = dp.map(p => pageToDoc('dealers', p)).filter(d => d.id);
  vehicles.forEach(d => { idx.vehicleByPid[d._pid] = d.id; idx.vehiclePid[d.id] = d._pid; (idx.vehicleCat[d.category] ||= []).push(d._pid); });
  dealers.forEach(d => { idx.dealerByPid[d._pid] = d.id; idx.dealerPid[d.id] = d._pid; });
  const outreach = op.map(p => pageToDoc('outreach', p, idx));
  const data = { vehicles, dealers, outreach, idx };
  memo = { t: Date.now(), data };
  return data;
}

/* ---------------- who is signed in (staff login: /admin/, ca_session cookie) ---------------- */
function cookie(request, name) {
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const k = part.indexOf('='); if (k > 0 && part.slice(0, k).trim() === name) return decodeURIComponent(part.slice(k + 1).trim());
  }
  return null;
}
/** users.desk_access (0/1): who may open the Sales Desk. Added on first use, so no separate migration is needed. */
let DESK_COL = false;
export async function ensureDeskColumn(env) {
  if (DESK_COL || !env.DB) return;
  try { await env.DB.prepare('ALTER TABLE users ADD COLUMN desk_access INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
  DESK_COL = true;
}

export async function whoAmI(request, env) {
  if (env.DESK_DEV_NO_ACCESS === '1') return { email: request.headers.get('x-dev-email') || 'dev@localhost', name: 'Dev' };
  const token = cookie(request, 'ca_session');
  if (!token || !env.DB) throw bad('Sign-in required.', 401);
  await ensureDeskColumn(env);
  const row = await env.DB.prepare('SELECT u.email, u.name, u.role, u.desk_access, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').bind(token).first();
  if (!row || new Date(row.expires_at + 'Z').getTime() < Date.now()) throw bad('Sign-in required.', 401);
  // Only the people given Sales Desk access (Admin → Felhasználók → "Sales Desk"), and every "Csak Sales Desk" account.
  if (!(row.role === 'sales_desk' || Number(row.desk_access) === 1)) throw bad('This account has no access to the Sales Desk.', 403);
  return { email: row.email, name: row.name, role: row.role };
}

/* ---------------- writes ---------------- */
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null) || String(a ?? '') === String(b ?? '');
function toProps(col, data, idx) {
  const props = {};
  for (const [k, v] of Object.entries(data)) {
    const m = MAP[col][k]; if (!m) continue;
    const [prop, type] = m;
    if (type === 'dealer_rel') { const pid = idx.dealerPid[v]; if (v && !pid) throw bad(`Unknown dealer "${v}"`); props[prop] = { relation: pid ? [{ id: pid }] : [] }; continue; }
    const w = writeProp(type, v); if (w) props[prop] = w;
  }
  if (col === 'outreach' && 'cars' in data) props.Cars = { relation: carsToRelation(data.cars, idx) };
  return props;
}
function carsToRelation(text, idx) {
  const pids = new Set(); const s = String(text || '');
  for (const id of s.match(/\b(?:P1|P2|S26|V)-\d{1,2}\b/gi) || []) { const pid = idx.vehiclePid[id.toUpperCase()]; if (pid) pids.add(pid); }
  for (const [cat, list] of Object.entries(idx.vehicleCat)) if (cat && s.toLowerCase().includes(cat.toLowerCase())) list.forEach(p => pids.add(p));
  return [...pids].slice(0, 100).map(id => ({ id }));
}

async function write(env, ctx, me, body) {
  const { op, path, data = {}, prev = {} } = body || {};
  const [col, docId] = String(path || '').split('/');
  if (!MAP[col] || !docId) throw bad('Unknown record.');
  const all = await loadAll(env, ctx, true); // always check against fresh data before writing
  const list = all[col];
  const cur = col === 'outreach' ? list.find(d => d.id === docId) : list.find(d => d.id === docId);

  if (op === 'delete') {
    if (!cur) return { ok: true };
    if (col !== 'outreach') throw bad('Cars and dealers can only be removed in Notion.', 403);
    await notion(env, 'PATCH', `/pages/${cur._pid}`, { in_trash: true });
    memo = null; return { ok: true };
  }

  if (cur && (op === 'update' || op === 'set')) {
    const changed = Object.keys(data).filter(k => k in prev && !same(cur[k], prev[k]));
    if (changed.length) { const e = bad('Someone else changed this while you were editing. The latest version is now shown — check it and save again.', 409); e.current = cur; e.fields = changed; throw e; }
    if (col === 'vehicles' && 'dealer_net' in data && !('dealer_gross' in data) && (cur.dealer_gross == null || cur.b2c_generated || Math.abs(Number(cur.dealer_gross) - b2c(cur.dealer_net)) <= 1))
      data.dealer_gross = data.dealer_net == null || data.dealer_net === '' ? null : b2c(data.dealer_net);
    if (col === 'vehicles' && cur.b2c_generated && !('dealer_gross' in data)) data.dealer_gross = cur.dealer_gross; // write the generated B2C into Notion
    const props = toProps(col, data, all.idx);
    if (col === 'outreach' && !data.member && !cur.member) props['Team member'] = writeProp('text', me.name || nameOf(me.email));
    if (!Object.keys(props).length) return { ok: true, doc: cur };
    const page = await notion(env, 'PATCH', `/pages/${cur._pid}`, { properties: props });
    memo = null; return { ok: true, doc: pageToDoc(col, page, all.idx) };
  }

  // create
  if (col === 'vehicles') throw bad('New cars are added in Notion.', 403);
  if (col === 'dealers' && all.dealers.some(d => d.id === docId)) throw bad('A dealer with this ID already exists.', 409);
  const full = col === 'dealers' ? { ...data, id: docId, status: data.status || 'New' } : { ...data };
  if (col === 'outreach' && !full.member) full.member = me.name || nameOf(me.email);
  const props = toProps(col, full, all.idx);
  if (col === 'outreach') {
    const dn = all.dealers.find(d => d.id === full.dealer)?.name || full.dealer || 'dealer';
    props.Summary = writeProp('title', `${full.outcome || full.channel || 'Contact'} — ${dn}`);
    props.Direction ||= writeProp('select', 'Outgoing');
  }
  const page = await notion(env, 'POST', '/pages', { parent: { type: 'data_source_id', data_source_id: DS[col] }, properties: props });
  memo = null; return { ok: true, doc: pageToDoc(col, page, all.idx) };
}
const nameOf = email => { const n = (email || '').split('@')[0].split(/[._-]/)[0]; return n ? n[0].toUpperCase() + n.slice(1) : ''; };

/* ---------------- entry ---------------- */
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
/* ---------------- offers from the car page (no login needed) ----------------
 * Saved to the Contact log in Notion (Channel: Website, Direction: Incoming, Outcome: Offer received),
 * so the team sees them in the desk's activity list. Rate-limited per IP; a hidden "website" field catches bots. */
async function offerRateOk(env, ip) {
  if (!env.DB) return true;
  const now = Math.floor(Date.now() / 1000), key = 'offer:' + ip;
  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS desk_rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, win INTEGER NOT NULL)').run();
    const row = await env.DB.prepare('SELECT n, win FROM desk_rate WHERE k = ?').bind(key).first();
    if (!row || now - row.win > 3600) { await env.DB.prepare('INSERT INTO desk_rate (k, n, win) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = 1, win = excluded.win').bind(key, now).run(); return true; }
    if (row.n >= 8) return false;
    await env.DB.prepare('UPDATE desk_rate SET n = n + 1 WHERE k = ?').bind(key).run();
    return true;
  } catch (e) { return true; }
}
async function makeOffer(request, env, ctx) {
  const url = new URL(request.url);
  if (request.headers.get('Origin') && new URL(request.headers.get('Origin')).host !== url.host) return json({ error: 'Cross-site request refused.' }, 403);
  const b = await request.json().catch(() => null);
  if (!b || typeof b !== 'object') return json({ error: 'bad_request' }, 400);
  if (b.website) return json({ ok: true }); // bot trap
  const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, n);
  const name = str(b.name, 100), company = str(b.company, 120), email = str(b.email, 160).toLowerCase(), msg = str(b.message, 1500);
  let phone = str(b.phone, 40); const dial = str(b.dial, 6).replace(/[^\d+]/g, '');
  if (phone && !/^(\+|00)/.test(phone) && /^\+\d{1,4}$/.test(dial)) phone = dial + ' ' + phone.replace(/^0+/, '');
  const type = b.type === 'b2c' ? 'b2c' : b.type === 'b2b' ? 'b2b' : '';
  const price = Math.round(Number(String(b.price ?? '').replace(/[^\d.,]/g, '').replace(',', '.')));
  if (name.length < 2) return json({ error: 'name' }, 400);
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/.test(email) && phone.replace(/\D/g, '').length < 6) return json({ error: 'contact' }, 400);
  if (!type) return json({ error: 'type' }, 400);
  if (!(price > 0 && price < 10000000)) return json({ error: 'price' }, 400);
  if (!(await offerRateOk(env, request.headers.get('cf-connecting-ip') || 'x'))) return json({ error: 'too_many' }, 429);
  let car;
  try { const all = await loadAll(env, ctx, false); car = all.vehicles.find(v => v.id === str(b.car, 20)); } catch (e) { return json({ error: 'unavailable' }, 503); }
  if (!car || car.status === 'Sold') return json({ error: 'car' }, 400);
  const eurs = n => n == null || n === '' ? '—' : '€' + Math.round(Number(n)).toLocaleString('en-GB');
  const listed = type === 'b2b' ? `Business to Business ${eurs(car.dealer_net)} (excl. VAT)` : `Business to Customer ${eurs(car.dealer_gross)} (incl. 19% German VAT)`;
  const notes = [
    `OFFER: ${eurs(price)} — ${type === 'b2b' ? 'dealer / B2B' : 'private buyer / B2C'}`,
    `Car: ${car.id} · ${car.model || ''}`, `Listed: ${listed}`,
    `Name: ${name}`, company && `Company: ${company}`, email && `Email: ${email}`, phone && `Phone: ${phone}`,
    msg && `Message: ${msg}`, countryOf(url.hostname, b.lang) && `Country: ${countryOf(url.hostname, b.lang)}`, request.cf && request.cf.country && `Location: ${request.cf.country}`, `Sent from: ${url.hostname} (${str(b.lang, 5) || '—'})`,
  ].filter(Boolean).join('\n');
  const today = new Date().toISOString().slice(0, 10);
  const props = {
    Summary: writeProp('title', `Offer ${eurs(price)} — ${name}${company ? ' (' + company + ')' : ''} — ${car.id}`),
    Date: writeProp('date', today), 'Cars (as typed)': writeProp('text', car.id),
    Channel: writeProp('select', 'Website'), Direction: writeProp('select', 'Incoming'), Outcome: writeProp('select', 'Offer received'),
    'Next step': writeProp('text', 'Reply to the offer'), 'Follow-up': writeProp('date', today), Notes: writeProp('text', notes),
  };
  try { await notion(env, 'POST', '/pages', { parent: { type: 'data_source_id', data_source_id: DS.outreach }, properties: props }); }
  catch (e) { return json({ error: 'unavailable' }, 503); }
  memo = null;
  return json({ ok: true });
}

/* ---------------- offers: accept / decline / send to Caradvance GmbH for a check (German email) ----------------
 * Env: DESK_CHECK_EMAIL  — who decides on offers (German email with one-click Annehmen / Ablehnen / Gegenangebot)
 *      RESEND_API_KEY    — email sending (already used by the CRM); CRM_EMAIL_FROM optional
 *      DESK_LINK_SECRET  — optional; signs the decision links (falls back to the Notion token) */
const VAT_F = 1 + VAT;
const CC_BY_TLD = { hu: 'HU', sk: 'SK', cz: 'CZ', pl: 'PL', ch: 'CH', de: 'DE', at: 'AT', ro: 'RO' };
const CC_BY_LANG = { hu: 'HU', sk: 'SK', cs: 'CZ', pl: 'PL', de: 'DE', en: '' };
const COUNTRY_DE = { HU: 'Ungarn', SK: 'Slowakei', CZ: 'Tschechien', PL: 'Polen', CH: 'Schweiz', DE: 'Deutschland', AT: 'Österreich', RO: 'Rumänien' };
export function countryOf(host, lang) {
  const tld = String(host || '').split('.').pop().toLowerCase();
  return CC_BY_TLD[tld] || CC_BY_LANG[String(lang || '').toLowerCase()] || '';
}
export function parseOffer(o) {
  const n = String(o && o.notes || '');
  const f = k => { const m = n.match(new RegExp('^' + k + ':\\s*(.+)$', 'm')); return m ? m[1].trim() : ''; };
  const head = (n.match(/^OFFER:.*$/m) || [''])[0];
  const price = Number((head.match(/€\s*([\d.,]+)/) || [, ''])[1].replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')) || null;
  const type = /B2B/.test(head) ? 'b2b' : /B2C/.test(head) ? 'b2c' : '';
  const sent = f('Sent from'); const sm = sent.match(/^(\S+)\s*\((\w*)\)/) || [];
  const country = (f('Country') || countryOf(sm[1], sm[2]) || '').toUpperCase();
  const car = (String(o && o.cars || '').match(/\b(?:P1|P2|S26|V)-\d{1,2}\b/i) || [''])[0].toUpperCase();
  return { price, type, net: price == null ? null : type === 'b2c' ? Math.round(price / VAT_F) : price, name: f('Name'), company: f('Company'), email: f('Email'), phone: f('Phone'), message: f('Message'), country, location: f('Location').toUpperCase(), car };
}
const isOffer = o => o && (/^OFFER:/m.test(o.notes || '') || (o.direction === 'Incoming' && o.channel === 'Website'));
function rankFor(all, offer) {
  const p = parseOffer(offer);
  const same = all.outreach.filter(isOffer).map(o => ({ o, p: parseOffer(o) })).filter(x => x.p.car === p.car && x.p.net != null && !/declined/i.test(x.o.outcome || ''));
  same.sort((a, b) => b.p.net - a.p.net);
  const rank = same.findIndex(x => x.o.id === offer.id) + 1;
  const inCountry = same.filter(x => x.p.country === p.country);
  return { rank, of: same.length, best: same[0] ? same[0].p.net : null, crank: inCountry.findIndex(x => x.o.id === offer.id) + 1, cof: inCountry.length };
}
const eurDe = n => n == null || n === '' ? '—' : Math.round(Number(n)).toLocaleString('de-DE') + ' €';
const escH = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function linkSig(env, id) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.DESK_LINK_SECRET || env.DESK_NOTION_TOKEN || 'x'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode('offer-check|' + id));
  return [...new Uint8Array(s)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
function germanCheck(offer, car, rk, base, sig) {
  // 2 lines: where the offer comes from · model + year · our price vs offer · link to the car · accept / reject
  const p = parseOffer(offer);
  const land = COUNTRY_DE[p.country] || p.country || '—';
  const net = p.type === 'b2b', vat = net ? 'netto' : 'brutto';
  const ours = net ? car.dealer_net : car.dealer_gross;
  const year = String(car.first_reg || '').replace(/^(\d{1,2})\//, '$1/') || '—';
  const carUrl = `${base}/sales/#car=${encodeURIComponent(car.id)}`;
  const dec = `${base}/api/desk/offer-decision?id=${encodeURIComponent(offer.id)}&sig=${sig}`;
  const l1 = `Angebot aus ${land}: ${car.model || ''} (EZ ${year}) – unser Preis ${eurDe(ours)} ${vat}, Angebot ${eurDe(p.price)} ${vat}.`;
  const l2 = `Fahrzeug: ${carUrl} · Annehmen/Ablehnen: ${dec}`;
  const subject = `Angebot ${car.id} aus ${land}: ${eurDe(p.price)} – annehmen?`;
  const btn = (t, d, bg) => `<a href="${dec}&d=${d}" style="display:inline-block;margin:0 6px 0 0;padding:8px 18px;border-radius:999px;background:${bg};color:#fff;font-weight:bold;text-decoration:none">${t}</a>`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#141519">Angebot aus <b>${escH(land)}</b>: <a href="${carUrl}" style="color:#e30613;font-weight:bold">${escH(car.model || '')} (EZ ${escH(year)})</a> – unser Preis ${eurDe(ours)} ${vat}, Angebot <b>${eurDe(p.price)} ${vat}</b>.<div style="margin-top:8px">${btn('Annehmen', 'accept', '#15803d')}${btn('Ablehnen', 'decline', '#b91c1c')}</div></div>`;
  return { subject, text: l1 + '\n' + l2, html };
}
const todayIso = () => new Date().toISOString().slice(0, 10);
async function setOutcome(env, offer, outcome, next, line) {
  const notes = [String(offer.notes || '').trim(), `[${todayIso()}] ${line}`].filter(Boolean).join('\n');
  await notion(env, 'PATCH', `/pages/${offer._pid || offer.id}`, { properties: {
    Outcome: writeProp('select', outcome), 'Next step': writeProp('text', next), 'Follow-up': writeProp('date', todayIso()), Notes: writeProp('text', notes) } });
  memo = null;
}
/* Accepting an offer puts the car "Under offer" (reserved for that buyer); declining the accepted offer frees it again. */
async function carForOffer(env, all, offer, accepted) {
  const p = parseOffer(offer); const car = all.vehicles.find(v => v.id === p.car); if (!car) return;
  const who = [p.name, p.company && '(' + p.company + ')', p.country && '· ' + p.country].filter(Boolean).join(' ');
  if (accepted) {
    await notion(env, 'PATCH', `/pages/${car._pid}`, { properties: { Status: writeProp('select', 'Under offer'), 'Status changed': writeProp('date', todayIso()), 'Reserved for': writeProp('text', who) } });
  } else if (car.status === 'Under offer' && String(car.reserved_for || '').startsWith(p.name || '\u0000')) {
    await notion(env, 'PATCH', `/pages/${car._pid}`, { properties: { Status: writeProp('select', 'Available'), 'Status changed': writeProp('date', todayIso()), 'Reserved for': writeProp('text', '') } });
  }
  memo = null;
}
async function offerAction(request, env, ctx, me) {
  const b = await request.json().catch(() => ({}));
  const all = await loadAll(env, ctx, true);
  const offer = all.outreach.find(o => o.id === b.id);
  if (!offer || !isOffer(offer)) throw bad('Offer not found.', 404);
  const who = me.name || nameOf(me.email);
  const p = parseOffer(offer);
  if (b.action === 'accept') { await setOutcome(env, offer, 'Offer accepted', 'Confirm to the buyer', `Accepted by ${who}`); await carForOffer(env, all, offer, true); return { ok: true }; }
  if (b.action === 'decline') { await setOutcome(env, offer, 'Offer declined', 'Tell the buyer', `Declined by ${who}`); await carForOffer(env, all, offer, false); return { ok: true }; }
  if (b.action !== 'check' && b.action !== 'preview') throw bad('Unknown action.');
  const car = all.vehicles.find(v => v.id === p.car);
  if (!car) throw bad('The car of this offer was not found.', 404);
  const cat = await fetch(new URL('/sales/catalogue.json', request.url)).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  const ex = cat[car.id] || {}; const photo = [...(ex.real_photos || []), ...(ex.photos || [])][0];
  const base = new URL(request.url).origin;
  const mail = germanCheck(offer, { ...car, photo }, rankFor(all, offer), base, await linkSig(env, offer.id));
  // Default decision maker: Alexander (has the authority to accept) — his email from Kapcsolat contacts, else DESK_CHECK_EMAIL
  let alex = '';
  if (env.DB) { try { await ensureMsg(env); const r = await env.DB.prepare("SELECT email FROM desk_contacts WHERE k = 'alexander'").first(); alex = (r && r.email) || ''; } catch (e) {} }
  const to = String(b.to || alex || env.DESK_CHECK_EMAIL || '').trim();
  if (b.action === 'preview') return { ok: true, to, toName: 'Alexander', subject: mail.subject, text: mail.text, html: mail.html, ready: !!(env.RESEND_API_KEY && to) };
  if (b.manual) { await setOutcome(env, offer, 'Sent for check', 'Waiting for the decision', `Sent for check by ${who} (own email)`); return { ok: true }; }
  if (!env.RESEND_API_KEY || !to) return { ok: false, manual: true, to, subject: mail.subject, text: mail.text, why: !env.RESEND_API_KEY ? 'RESEND_API_KEY' : 'DESK_CHECK_EMAIL' };
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.CRM_EMAIL_FROM || 'CarAdvance <sales@caradvance.hu>', to: to.split(',').map(s => s.trim()).filter(Boolean), reply_to: me.email || undefined, subject: mail.subject, html: mail.html, text: mail.text }) });
  if (!r.ok) throw bad('The email could not be sent (' + r.status + ').', 502);
  await setOutcome(env, offer, 'Sent for check', 'Waiting for the decision', `Sent for check to ${to} by ${who}`);
  return { ok: true, sent: true, to };
}
/* One-click decision page for the German contact. GET shows the choice (link scanners never decide), POST records it. */
async function offerDecision(request, env, ctx) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '', sig = url.searchParams.get('sig') || '';
  const page = (body, st = 200) => new Response(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>CarAdvance – Angebot</title>
<style>body{font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;color:#141519;margin:0;padding:24px}main{max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:24px}h1{font-size:20px;margin:0 0 6px}.s{color:#6b7280}.big{font-size:26px;font-weight:bold;margin:10px 0}button{border:0;border-radius:999px;padding:13px 20px;font-weight:bold;font-size:15px;color:#fff;cursor:pointer;margin:0 8px 8px 0}.a{background:#15803d}.d{background:#b91c1c}.c{background:#141519}input,textarea{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:12px;padding:11px;font-size:15px;margin:6px 0 10px}.ok{background:#ecfdf3;border-radius:14px;padding:14px;font-weight:bold}</style></head><body><main>${body}</main></body></html>`,
    { status: st, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  if (!id || sig !== await linkSig(env, id)) return page('<h1>Link ungültig</h1><p class="s">Dieser Link ist nicht (mehr) gültig.</p>', 403);
  const all = await loadAll(env, ctx, true);
  const offer = all.outreach.find(o => o.id === id);
  if (!offer) return page('<h1>Angebot nicht gefunden</h1>', 404);
  const p = parseOffer(offer); const car = all.vehicles.find(v => v.id === p.car) || { id: p.car };
  const head = `<h1><a href="/sales/#car=${encodeURIComponent(car.id)}" style="color:#141519">${escH(car.model || '')}</a> · ${escH(car.id)}</h1><div class="s">Händlerpreis ${eurDe(car.dealer_net)} netto · Endkundenpreis ${eurDe(car.dealer_gross)} brutto</div>
<div class="big">${eurDe(p.price)}</div><div class="s">${p.type === 'b2b' ? 'Händlerangebot (netto)' : 'Privatkunde (brutto)'} · ${escH(COUNTRY_DE[p.country] || p.country || '')}</div>
<p class="s">Aktueller Status: <b>${escH(offer.outcome || '—')}</b></p>`;
  if (request.method === 'POST') {
    const f = await request.formData();
    const d = f.get('d'); const cp = String(f.get('price') || '').replace(/[^\d]/g, ''); const cm = String(f.get('comment') || '').slice(0, 800).trim();
    if (d === 'accept') { await setOutcome(env, offer, 'Offer accepted', 'Confirm to the buyer', 'Caradvance GmbH: Angebot angenommen' + (cm ? ' – ' + cm : '')); await carForOffer(env, all, offer, true); }
    else if (d === 'decline') { await setOutcome(env, offer, 'Offer declined', 'Tell the buyer', 'Caradvance GmbH: Angebot abgelehnt' + (cm ? ' – ' + cm : '')); await carForOffer(env, all, offer, false); }
    else if (d === 'counter' && cp) await setOutcome(env, offer, 'Counter offer', 'Send the counter offer to the buyer', `Caradvance GmbH: Gegenangebot ${eurDe(cp)}` + (cm ? ' – ' + cm : ''));
    else return page(head + '<p>Bitte einen Betrag für das Gegenangebot eingeben.</p>', 400);
    return page(head.replace(/Aktueller Status:.*<\/p>/, '') + `<p class="ok">Danke – Ihre Entscheidung wurde gespeichert${d === 'counter' ? ` (Gegenangebot ${eurDe(cp)})` : ''}.</p>`);
  }
  const d = url.searchParams.get('d');
  const form = (dd, label, cls, extra = '') => `<form method="post"><input type="hidden" name="d" value="${dd}">${extra}<textarea name="comment" rows="2" placeholder="Kommentar (optional)"></textarea><button class="${cls}">${label}</button></form>`;
  const body = d === 'counter' ? form('counter', 'Gegenangebot senden', 'c', `<label>Gegenangebot (€, ${p.type === 'b2b' ? 'netto' : 'brutto'})<input name="price" inputmode="numeric" required></label>`)
    : d === 'decline' ? form('decline', 'Angebot ablehnen', 'd') : d === 'accept' ? form('accept', 'Angebot annehmen', 'a')
    : `<form method="post" style="display:inline"><input type="hidden" name="d" value="accept"><button class="a">Annehmen</button></form><form method="post" style="display:inline"><input type="hidden" name="d" value="decline"><button class="d">Ablehnen</button></form>`;
  return page(head + body + `<p class="s" style="margin-top:14px">Andere Entscheidung: <a href="?id=${encodeURIComponent(id)}&sig=${sig}&d=accept">Annehmen</a> · <a href="?id=${encodeURIComponent(id)}&sig=${sig}&d=decline">Ablehnen</a> · <a href="?id=${encodeURIComponent(id)}&sig=${sig}&d=counter">Gegenangebot</a></p>`);
}

/* ---------------- Kapcsolat: internal messages between the team (D1) ----------------
 * desk_contacts: the people you can write to (Marc, Karoly, Alexander, Kevin by default; email/phone filled in later).
 * desk_msgs: one row per message. A message reaches a person by email (if known) or by their contact key. */
const DEFAULT_CONTACTS = [['marc', 'Marc', '', '', 1], ['karoly', 'Tóth Károly', 'import@caradvance.de', '', 2], ['alexander', 'Alexander', '', '', 3], ['kevin', 'Kevin', '', '', 4]];
let msgReady = false;
async function ensureMsg(env) {
  if (msgReady || !env.DB) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS desk_contacts (k TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, sort INTEGER DEFAULT 9)').run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS desk_msgs (id INTEGER PRIMARY KEY AUTOINCREMENT, created INTEGER NOT NULL, from_email TEXT NOT NULL, from_name TEXT, to_key TEXT NOT NULL, body TEXT NOT NULL, car TEXT, read_at INTEGER)').run();
  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM desk_contacts').first();
  if (!n || !n.n) for (const c of DEFAULT_CONTACTS) await env.DB.prepare('INSERT OR IGNORE INTO desk_contacts (k, name, email, phone, sort) VALUES (?, ?, ?, ?, ?)').bind(...c).run();
  msgReady = true;
}
const lc = s => String(s || '').trim().toLowerCase();
async function myKeys(env, me) {
  const rows = (await env.DB.prepare('SELECT k, email FROM desk_contacts').all()).results || [];
  const keys = new Set([lc(me.email)]);
  for (const r of rows) if (r.email && lc(r.email) === lc(me.email)) keys.add(r.k);
  return [...keys];
}
async function msgRoute(route, request, env, me) {
  if (!env.DB) throw bad('Messages are not available here.', 503);
  await ensureMsg(env);
  const mine = await myKeys(env, me);
  const ph = mine.map(() => '?').join(',');
  if (route === 'msg/list' && request.method === 'GET') {
    const contacts = ((await env.DB.prepare('SELECT k, name, email, phone FROM desk_contacts ORDER BY sort, name').all()).results || [])
      .filter(c => !mine.includes(c.k)).map(c => ({ key: c.k, name: c.name, phone: c.phone || '', email: c.email || '' }));
    const msgs = (await env.DB.prepare(`SELECT id, created, from_email, from_name, to_key, body, car, read_at FROM desk_msgs WHERE to_key IN (${ph}) OR lower(from_email) = ? ORDER BY created DESC LIMIT 300`).bind(...mine, lc(me.email)).all()).results || [];
    // people who wrote to me but are not in the list (e.g. an admin) can be answered too
    for (const m of msgs) if (mine.includes(m.to_key) && !contacts.some(c => lc(c.email) === lc(m.from_email) || c.key === lc(m.from_email)) && lc(m.from_email) !== lc(me.email))
      contacts.push({ key: lc(m.from_email), name: m.from_name || m.from_email, phone: '', email: m.from_email });
    const out = msgs.map(m => ({ id: m.id, at: m.created, from: m.from_name || m.from_email, fromEmail: m.from_email, to: m.to_key, body: m.body, car: m.car || '', mine: lc(m.from_email) === lc(me.email), unread: mine.includes(m.to_key) && !m.read_at }));
    return { me: { email: me.email, name: me.name || nameOf(me.email), role: me.role, keys: mine }, contacts, msgs: out, unread: out.filter(m => m.unread).length };
  }
  if (route === 'msg/send' && request.method === 'POST') {
    const b = await request.json().catch(() => ({}));
    const body = String(b.body || '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, 4000);
    const to = [...new Set((Array.isArray(b.to) ? b.to : [b.to]).map(lc).filter(Boolean))].slice(0, 10);
    if (!body) throw bad('Write a message first.');
    if (!to.length) throw bad('Choose who the message is for.');
    const car = String(b.car || '').toUpperCase().match(/^(?:P1|P2|S26|V)-\d{1,2}$/) ? String(b.car).toUpperCase() : '';
    const now = Math.floor(Date.now() / 1000);
    const contacts = (await env.DB.prepare('SELECT k, name, email FROM desk_contacts').all()).results || [];
    for (const k of to) {
      const c = contacts.find(x => x.k === k);
      const key = c && c.email ? lc(c.email) : k; // deliver by email when we know it
      await env.DB.prepare('INSERT INTO desk_msgs (created, from_email, from_name, to_key, body, car) VALUES (?, ?, ?, ?, ?, ?)').bind(now, me.email, me.name || nameOf(me.email), key, body, car || null).run();
      if (env.RESEND_API_KEY && c && c.email) {
        const link = new URL('/sales/#contact', request.url).toString();
        await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: env.CRM_EMAIL_FROM || 'CarAdvance <sales@caradvance.hu>', to: [c.email], reply_to: me.email, subject: `Sales Desk – ${me.name || nameOf(me.email)}${car ? ' · ' + car : ''}`,
            text: `${body}\n\n${car ? 'Car: ' + car + '\n' : ''}Reply in the Sales Desk: ${link}`,
            html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:22px;color:#141519"><p><b>${escH(me.name || nameOf(me.email))}</b>${car ? ' · ' + escH(car) : ''}</p><p style="white-space:pre-wrap">${escH(body)}</p><p><a href="${link}">Reply in the Sales Desk</a></p></div>` }) }).catch(() => {});
      }
    }
    return { ok: true };
  }
  if (route === 'msg/read' && request.method === 'POST') {
    const b = await request.json().catch(() => ({}));
    const ids = (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Boolean).slice(0, 300);
    if (ids.length) await env.DB.prepare(`UPDATE desk_msgs SET read_at = ? WHERE read_at IS NULL AND to_key IN (${ph}) AND id IN (${ids.map(() => '?').join(',')})`).bind(Math.floor(Date.now() / 1000), ...mine, ...ids).run();
    return { ok: true };
  }
  if (route === 'msg/contact' && request.method === 'POST') { // admins fill in email / phone
    if (me.role !== 'admin') throw bad('Only an admin can change contacts.', 403);
    const b = await request.json().catch(() => ({}));
    const k = lc(b.key).replace(/[^a-z0-9._@-]/g, '').slice(0, 60); if (!k) throw bad('Missing contact.');
    await env.DB.prepare('INSERT INTO desk_contacts (k, name, email, phone, sort) VALUES (?, ?, ?, ?, 9) ON CONFLICT(k) DO UPDATE SET name = excluded.name, email = excluded.email, phone = excluded.phone')
      .bind(k, String(b.name || k).slice(0, 80), lc(b.email).slice(0, 160) || null, String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 20) || null).run();
    return { ok: true };
  }
  throw bad('Not found', 404);
}

/* ---------------- Stock list (master list + mobile.de comparison) — D1, signed-in users only ----------------
 * Purchase prices (EK), planned VK and fleet-system fields are returned to admins only.
 * Data loaded once into D1 (desk_stocklist) from the vehicle master list of 25 Nov 2026. */
async function ensureStock(env) {
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS desk_stocklist (id TEXT PRIMARY KEY, sort INTEGER, data TEXT NOT NULL, updated INTEGER)').run();
}
const STOCK_ADMIN_ONLY = ['ek', 'vk_plan', 'fleet_status', 'fleet_sales'];
async function stockList(env, me) {
  if (!env.DB) throw bad('Not available here.', 503);
  await ensureStock(env);
  const rows = (await env.DB.prepare('SELECT data, updated FROM desk_stocklist ORDER BY sort').all()).results || [];
  const admin = me.role === 'admin';
  const cars = rows.map(r => { const d = JSON.parse(r.data); if (!admin) for (const k of STOCK_ADMIN_ONLY) delete d[k]; return d; });
  return { cars, admin, canPrice: ['admin', 'sales_manager'].includes(me.role), updated: rows.reduce((m, r) => Math.max(m, r.updated || 0), 0) };
}

/* Choosing the right price when the documents disagree (admins / sales managers). Optionally also sets the desk price in Notion. */
const STOCK_IMPORT_SHA256 = '64dc722f85632b1d55a5aab9b0b2dfe6cb26b57136e4d75c4837f6016c4c3434'; // one-off upload key (hash only); removed after use
async function stockMerge(request, env) {
  const key = request.headers.get('X-Import-Key') || '';
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)))].map(b => b.toString(16).padStart(2, '0')).join('');
  if (hash !== STOCK_IMPORT_SHA256) return json({ error: 'Forbidden' }, 403);
  const list = await request.json();
  if (!Array.isArray(list) || !list.length) return json({ error: 'Empty' }, 400);
  await ensureStock(env);
  const old = Object.fromEntries(((await env.DB.prepare('SELECT id, data FROM desk_stocklist').all()).results || []).map(r => [r.id, JSON.parse(r.data)]));
  const KEEP = ['chosen', 'net', 'gross', 'net_from', 'price_ok', 'prices', 'ek', 'vk_plan']; // prices and choices are never touched here
  const now = Math.floor(Date.now() / 1000); const stmts = [];
  for (const u of list) { const o = old[u.id]; if (!o) continue; const n = { ...o }; for (const [k, v] of Object.entries(u)) if (!KEEP.includes(k)) n[k] = v;
    stmts.push(env.DB.prepare('UPDATE desk_stocklist SET data = ?, updated = ? WHERE id = ?').bind(JSON.stringify(n), now, String(u.id))); }
  for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));
  return json({ ok: true, n: stmts.length });
}

async function stockChoosePrice(request, env, ctx, me) {
  if (!['admin', 'sales_manager'].includes(me.role)) throw bad('Only an admin or a sales manager can set the price.', 403);
  const b = await request.json().catch(() => ({}));
  const net = Math.round(Number(String(b.net).replace(/[^\d.]/g, '')) * 100) / 100;
  if (!(net > 1000 && net < 5000000)) throw bad('Enter a valid net price.');
  await ensureStock(env);
  const row = await env.DB.prepare('SELECT data FROM desk_stocklist WHERE id = ?').bind(String(b.id || '')).first();
  if (!row) throw bad('Car not found.', 404);
  const d = JSON.parse(row.data);
  const who = me.name || nameOf(me.email), at = new Date().toISOString().slice(0, 10);
  d.chosen = { by: who, at, prev: d.net, how: b.how === 'typed' ? 'typed' : 'document' };
  d.net = net; d.gross = Math.round(net * (1 + VAT) * 100) / 100; d.net_from = `Chosen by ${who} (${at})`; d.price_ok = true;
  await env.DB.prepare('UPDATE desk_stocklist SET data = ?, updated = ? WHERE id = ?').bind(JSON.stringify(d), Math.floor(Date.now() / 1000), d.id).run();
  let desk = false;
  if (b.desk && d.desk) {
    const all = await loadAll(env, ctx, true);
    const car = all.vehicles.find(v => v.id === d.desk);
    if (car) {
      await notion(env, 'PATCH', `/pages/${car._pid}`, { properties: { B2B: writeProp('number', net), B2C: writeProp('number', d.gross) } });
      memo = null; desk = true;
    }
  }
  if (me.role !== 'admin') for (const k of STOCK_ADMIN_ONLY) delete d[k];
  return { ok: true, car: d, desk };
}


/** Fields anyone may see without signing in (both prices included, by decision of 25 Nov 2026).
 *  Never public: plate, data gaps, price source, notes, minimum/asking price, reserved-for, edit history. Sold cars are left out. */
export const PUBLIC_FIELDS = ['id', 'make', 'model', 'category', 'colour', 'interior', 'first_reg', 'mileage', 'km_text', 'power', 'fuel', 'transmission', 'drive',
  'highlights', 'msrp_gross', 'dealer_net', 'dealer_gross', 'pct_vs_list', 'status', 'available_until', 'vin',
  'prev_owners', 'condition', 'paint', 'trim', 'climate', 'park_assist', 'seats', 'doors', 'engine_cc', 'equipment', 'rent_sale'];
export function publicCar(v) {
  const o = {};
  for (const k of PUBLIC_FIELDS) if (v[k] != null && v[k] !== '') o[k] = v[k];
  return o;
}

export async function handle(request, env, ctx) {
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/desk\/?/, '');
  if (request.method === 'POST' && route === 'offer') return makeOffer(request, env, ctx);
  if (request.method === 'POST' && route === 'stocklist-merge') return stockMerge(request, env); // one-off, removed after use
  if (request.method === 'GET' && route === 'geo') return json({ country: (request.cf && request.cf.country) || '' });
  if (route === 'offer-decision' && (request.method === 'GET' || request.method === 'POST')) return offerDecision(request, env, ctx);
  if (request.method === 'GET' && route === 'public') {
    try {
      const { vehicles } = await loadAll(env, ctx, false);
      return json({ vehicles: vehicles.filter(v => (v.status || 'Available') !== 'Sold').map(publicCar), public: true, at: new Date().toISOString() });
    } catch (e) { return json({ error: 'Could not load the cars.' }, 503); }
  }
  try {
    const me = await whoAmI(request, env);
    if (request.method === 'GET' && route === 'data') {
      const { vehicles, dealers, outreach } = await loadAll(env, ctx, url.searchParams.has('fresh'));
      return json({ vehicles, dealers, outreach, me: { email: me.email, name: me.name || nameOf(me.email) }, at: new Date().toISOString() });
    }
    if (request.method === 'GET' && route === 'stocklist') return json(await stockList(env, me));
  if (request.method === 'POST' && route === 'stocklist/price') {
      if (request.headers.get('Origin') && new URL(request.headers.get('Origin')).host !== url.host) throw bad('Cross-site request refused.', 403);
      return json(await stockChoosePrice(request, env, ctx, me));
    }
    if (route.startsWith('msg/')) {
      if (request.method === 'POST' && request.headers.get('Origin') && new URL(request.headers.get('Origin')).host !== url.host) throw bad('Cross-site request refused.', 403);
      return json(await msgRoute(route, request, env, me));
    }
    if (request.method === 'POST' && route === 'offer-action') {
      if (request.headers.get('Origin') && new URL(request.headers.get('Origin')).host !== url.host) throw bad('Cross-site request refused.', 403);
      return json(await offerAction(request, env, ctx, me));
    }
    if (request.method === 'POST' && route === 'write') {
      if (request.headers.get('Origin') && new URL(request.headers.get('Origin')).host !== url.host) throw bad('Cross-site request refused.', 403);
      return json(await write(env, ctx, me, await request.json()));
    }
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: e.message || 'Error', current: e.current, fields: e.fields }, e.status || 500);
  }
}
