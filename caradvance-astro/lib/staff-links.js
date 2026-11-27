/**
 * CarAdvance staff sign-in by e-mail link (no password needed).
 *
 *   POST /api/belso/link          {email, next}            → e-mails a sign-in link (30 min) if the account exists
 *   GET  /api/belso/link/open?t=  (opened from the e-mail)  → small "Sign in" page (mail scanners only GET, so they can't use up the link)
 *   POST /api/belso/link/open     t=…                       → creates the session (ca_session) and redirects
 *   POST /api/belso/admin/invite  {email, name, role, next} → admin only: creates the account if new, e-mails a link (7 days)
 *
 * Passwords keep working; this is an extra way in. Links are single-use, stored only as a SHA-256 hash.
 * Mail goes through Resend (RESEND_API_KEY), from STAFF_EMAIL_FROM / LEAD_EMAIL_FROM.
 */

import { cleanMarkets, deskMarketOf, ensureDeskColumn } from './desk-api.js';

const LINK_MIN = 30;
const INVITE_DAYS = 7;
const SESSION_DAYS = 30;

let READY = false;
async function ensureTables(env) {
  if (READY) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS login_links (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, next TEXT, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, created_by INTEGER)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS login_link_rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, win INTEGER NOT NULL)`)
  ]);
  READY = true;
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
}
function hex(bytes) { return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(''); }
function randomHex(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); }
async function sha256hex(s) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s))))); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function normEmail(e) {
  const s = String(e || '').trim().toLowerCase();
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/.test(s) ? s : '';
}
/** E-mail language by site: caradvance.sk → Slovak, .cz → Czech, everything else English. */
function langOf(origin) { const m = deskMarketOf(new URL(origin).hostname); return m === 'sk' ? 'sk' : m === 'cz' ? 'cs' : 'en'; }
/** The link must open on a site the account may use (users.desk_markets): e.g. an "sk,cz" account invited from
 * dev.caradvance.hu gets a dev.caradvance.sk link. Non-CarAdvance hosts (pages.dev previews) are left as they are. */
function originFor(origin, markets) {
  const allowed = cleanMarkets(markets); if (!allowed) return origin;
  const u = new URL(origin); const list = allowed.split(',');
  if (list.includes(deskMarketOf(u.hostname))) return origin;
  const m = /^(.*\.)?caradvance\.(hu|sk|cz|pl|ch|eu)$/.exec(u.hostname); if (!m) return origin;
  const pre = (m[1] || '').startsWith('dev.') ? 'dev.' : 'www.';
  return u.protocol + '//' + pre + 'caradvance.' + list[0];
}
const TXT = {
  en: { place: 'the CarAdvance Sales Desk', place2: 'the CarAdvance staff area', sTitle: 'Your sign-in link', sLead: (n, p) => `Hi ${n}, click the button to sign in to ${p}. No password needed.`, sBtn: 'Sign in', sFoot: m => `The link works once and is valid for ${m} minutes. If you didn't ask for it, you can ignore this e-mail.`, sSubj: 'Your CarAdvance sign-in link',
        iTitle: p => `You're invited to ${p}`, iLead: (n, w, p) => `Hi ${n}, ${w} has given you access to ${p}. Click the button to sign in. No password needed.`, iBtn: 'Open the Sales Desk', iFoot: (d, host, e) => `This button is valid for ${d} days and works once. Later you can sign in any time at ${host}/admin/ with your e-mail (${e}): choose "Sign in with a code from e-mail".`, iSubj: p => `Your access to ${p}`, team: 'the CarAdvance team' },
  sk: { place: 'CarAdvance Sales Desk', place2: 'internej zóny CarAdvance', sTitle: 'Váš prihlasovací odkaz', sLead: (n, p) => `Dobrý deň ${n}, kliknutím na tlačidlo sa prihlásite do ${p}. Heslo nie je potrebné.`, sBtn: 'Prihlásiť sa', sFoot: m => `Odkaz funguje raz a platí ${m} minút. Ak ste oň nežiadali, tento e-mail môžete ignorovať.`, sSubj: 'Váš prihlasovací odkaz do CarAdvance',
        iTitle: p => `Pozvánka do ${p}`, iLead: (n, w, p) => `Dobrý deň ${n}, ${w} vám udelil prístup do ${p}. Prihlásite sa kliknutím na tlačidlo. Heslo nie je potrebné.`, iBtn: 'Otvoriť Sales Desk', iFoot: (d, host, e) => `Tlačidlo platí ${d} dní a funguje raz. Neskôr sa môžete kedykoľvek prihlásiť na ${host}/admin/ svojím e-mailom (${e}): zvoľte „Prihlásenie kódom z e-mailu“.`, iSubj: p => `Váš prístup do ${p}`, team: 'tím CarAdvance' },
  cs: { place: 'CarAdvance Sales Desk', place2: 'interní zóny CarAdvance', sTitle: 'Váš přihlašovací odkaz', sLead: (n, p) => `Dobrý den ${n}, kliknutím na tlačítko se přihlásíte do ${p}. Heslo není potřeba.`, sBtn: 'Přihlásit se', sFoot: m => `Odkaz funguje jednou a platí ${m} minut. Pokud jste o něj nežádali, tento e-mail můžete ignorovat.`, sSubj: 'Váš přihlašovací odkaz do CarAdvance',
        iTitle: p => `Pozvánka do ${p}`, iLead: (n, w, p) => `Dobrý den ${n}, ${w} vám udělil přístup do ${p}. Přihlásíte se kliknutím na tlačítko. Heslo není potřeba.`, iBtn: 'Otevřít Sales Desk', iFoot: (d, host, e) => `Tlačítko platí ${d} dní a funguje jednou. Později se můžete kdykoli přihlásit na ${host}/admin/ svým e-mailem (${e}): zvolte „Přihlášení kódem z e-mailu“.`, iSubj: p => `Váš přístup do ${p}`, team: 'tým CarAdvance' }
};

/** Only our own pages; anything else falls back to the Sales Desk. */
export function safeNext(nx, fallback = '/sales/') {
  const s = String(nx || '');
  if (/^\/sales\/[a-z0-9\/_-]*$/.test(s)) return s;
  if (/^\/(admin|belso)\/$/.test(s)) return s;
  if (/^\/belso\/(ugyfel\/\?id=\d+|ajanlatmotor\/[a-z0-9\/_-]*)$/.test(s)) return s;
  return fallback;
}

async function rateOk(env, key, max, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(`SELECT n, win FROM login_link_rate WHERE k = ?`).bind(key).first();
  if (!row || now - row.win > windowSec) {
    await env.DB.prepare(`INSERT INTO login_link_rate (k, n, win) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = 1, win = excluded.win`).bind(key, now).run();
    return true;
  }
  if (row.n >= max) return false;
  await env.DB.prepare(`UPDATE login_link_rate SET n = n + 1 WHERE k = ?`).bind(key).run();
  return true;
}

async function issueLink(env, origin, userId, next, validSec, createdBy) {
  const t = randomHex(32);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(`DELETE FROM login_links WHERE expires_at < ?`).bind(now).run();
  await env.DB.prepare(`INSERT INTO login_links (token_hash, user_id, next, expires_at, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(await sha256hex(t), userId, next, now + validSec, now, createdBy || null).run();
  return `${origin}/api/belso/link/open?t=${t}`;
}

function mailHtml({ title, lead, btn, url, foot }) {
  return `<div style="background:#f4f7fb;padding:24px 12px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#141519">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6eaf1">
    <div style="background:#0b0b0d;padding:18px 24px"><img src="https://www.caradvance.hu/caradvance-logo-email.png" alt="CarAdvance" width="180" height="60" style="width:180px;height:60px;display:block;border:0"></div>
    <div style="padding:26px 24px 22px">
      <p style="margin:0 0 6px;font-size:18px;font-weight:bold">${esc(title)}</p>
      <p style="margin:0 0 20px;color:#3d4350">${lead}</p>
      <p style="margin:0 0 20px"><a href="${esc(url)}" style="display:inline-block;background:#E2001A;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:9px">${esc(btn)}</a></p>
      <p style="margin:0;color:#6b7280;font-size:13px">${foot}</p>
    </div>
    <div style="padding:14px 24px;background:#f4f7fb;color:#6b7280;font-size:12px;line-height:1.55"><b style="color:#141519">Caradvance GmbH</b> · Bgm-Graf-Ring 21 · D-82538 Geretsried</div>
  </div></div>`;
}

async function sendMail(env, to, subject, html, text) {
  if (!env.RESEND_API_KEY) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.STAFF_EMAIL_FROM || env.LEAD_EMAIL_FROM || 'CarAdvance <lead@send.caradvance.hu>',
      to: [to], reply_to: env.STAFF_REPLY_TO || 'info@caradvance.hu', subject, html, text
    })
  });
  return r.ok;
}

async function sendSignInMail(env, user, url, next) {
  const T = TXT[langOf(url)], place = next.startsWith('/sales/') ? T.place : T.place2;
  const html = mailHtml({ title: T.sTitle, lead: T.sLead(esc(user.name), place), btn: T.sBtn, url, foot: T.sFoot(LINK_MIN) });
  return sendMail(env, user.email, T.sSubj, html, `${T.sLead(user.name, place)}\n${url}\n\n${T.sFoot(LINK_MIN)}`);
}

async function sendInviteMail(env, user, url, next, inviter) {
  const T = TXT[langOf(url)], place = next.startsWith('/sales/') ? T.place : T.place2, host = new URL(url).host, who = inviter || T.team;
  const html = mailHtml({ title: T.iTitle(place), lead: T.iLead(esc(user.name), esc(who), place), btn: next.startsWith('/sales/') ? T.iBtn : T.sBtn, url, foot: T.iFoot(INVITE_DAYS, esc(host), esc(user.email)) });
  return sendMail(env, user.email, T.iSubj(place), html, `${T.iLead(user.name, who, place)}\n${url}\n\n${T.iFoot(INVITE_DAYS, host, user.email)}`);
}

const PG = {
  en: { signIn: 'Sign in', as: 'Sign in as', expT: 'Link expired', exp: 'This sign-in link has expired or was already used.', newL: 'Sign in again' },
  sk: { signIn: 'Prihlásiť sa', as: 'Prihlásiť sa ako', expT: 'Odkaz vypršal', exp: 'Platnosť tohto prihlasovacieho odkazu vypršala alebo už bol použitý.', newL: 'Prihlásiť sa znova' },
  cs: { signIn: 'Přihlásit se', as: 'Přihlásit se jako', expT: 'Odkaz vypršel', exp: 'Platnost tohoto přihlašovacího odkazu vypršela nebo už byl použit.', newL: 'Přihlásit se znovu' }
};
function page(title, body, lang = 'en') {
  return new Response(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)} · CarAdvance</title></head>
<body style="margin:0;min-height:100vh;background:#101216;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;color:#fff">
<div style="background:#17181c;border:1px solid #2a2c33;border-radius:14px;padding:28px;width:340px;max-width:calc(100vw - 32px);text-align:center">
<div style="font-weight:800;font-size:17px">CarAdvance</div>${body}</div></body></html>`,
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex' } });
}
const BTN = 'display:block;width:100%;box-sizing:border-box;margin-top:18px;padding:12px;border:0;border-radius:9px;background:#E2001A;color:#fff;font-weight:800;font-size:15px;cursor:pointer;text-decoration:none';

async function findLink(env, t) {
  if (!/^[0-9a-f]{64}$/.test(t || '')) return null;
  const row = await env.DB.prepare(`SELECT l.token_hash, l.next, l.expires_at, u.id, u.email, u.name, u.role FROM login_links l JOIN users u ON u.id = l.user_id WHERE l.token_hash = ?`)
    .bind(await sha256hex(t)).first();
  if (!row || row.expires_at < Math.floor(Date.now() / 1000)) return null;
  return row;
}

function expiredPage(lang = 'en') {
  const P = PG[lang] || PG.en;
  return page(P.expT, `<p style="color:#c9ced8;font-size:14px;margin:14px 0 0">${P.exp}</p>
<a href="/admin/?next=/sales/" style="${BTN}">${P.newL}</a>`, lang);
}

/** Handles /link, /link/open and /admin/invite. Returns null for other paths. */
export async function handleStaffLinks(path, request, env, getSessionUser) {
  const method = request.method;
  const isLink = path === '/link' || path === '/link/open' || path === '/admin/invite';
  if (!isLink) return null;
  await ensureTables(env);
  const origin = new URL(request.url).origin;

  if (path === '/link' && method === 'POST') {
    const b = await request.json().catch(() => ({}));
    const email = normEmail(b.email);
    if (!email) return json({ error: 'Adj meg egy érvényes e-mail címet.' }, 400);
    if (!env.RESEND_API_KEY) return json({ error: 'Az e-mail küldés még nincs beállítva ezen az oldalon.' }, 501);
    const ip = request.headers.get('cf-connecting-ip') || 'x';
    if (!(await rateOk(env, 'e:' + email, 5, 3600)) || !(await rateOk(env, 'i:' + ip, 20, 3600)))
      return json({ error: 'Túl sok kérés. Próbáld újra később.' }, 429);
    await ensureDeskColumn(env);
    const user = await env.DB.prepare(`SELECT id, email, name, desk_markets FROM users WHERE email = ?`).bind(email).first();
    if (user) {
      const next = safeNext(b.next, '/admin/');
      const url = await issueLink(env, originFor(origin, user.desk_markets), user.id, next, LINK_MIN * 60, null);
      await sendSignInMail(env, user, url, next);
    }
    // Same answer whether or not the address has an account.
    return json({ ok: true });
  }

  if (path === '/link/open' && method === 'GET') {
    const lang = langOf(origin), P = PG[lang];
    const t = new URL(request.url).searchParams.get('t') || '';
    const row = await findLink(env, t);
    if (!row) return expiredPage(lang);
    return page(P.signIn, `<p style="color:#c9ced8;font-size:14px;margin:14px 0 0">${P.as}<br><b style="color:#fff">${esc(row.name)}</b><br><span style="font-size:12px;color:#8b93a7">${esc(row.email)}</span></p>
<form method="POST" action="/api/belso/link/open"><input type="hidden" name="t" value="${esc(t)}"><button type="submit" style="${BTN}">${P.signIn}</button></form>`, lang);
  }

  if (path === '/link/open' && method === 'POST') {
    const f = await request.formData().catch(() => null);
    const t = f ? String(f.get('t') || '') : '';
    const row = await findLink(env, t);
    if (!row) return expiredPage(langOf(origin));
    await env.DB.prepare(`DELETE FROM login_links WHERE token_hash = ?`).bind(row.token_hash).run();
    const token = randomHex(32);
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000).toISOString().slice(0, 19);
    await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).bind(token, row.id, expiresAt).run();
    return new Response(null, { status: 303, headers: {
      Location: safeNext(row.next, '/admin/'),
      'Set-Cookie': `ca_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
      'cache-control': 'no-store'
    } });
  }

  if (path === '/admin/invite' && method === 'POST') {
    const me = await getSessionUser(request, env);
    if (!me) return json({ error: 'Nincs bejelentkezve.' }, 401);
    if (me.role !== 'admin') return json({ error: 'Csak admin jogosultsággal.' }, 403);
    const b = await request.json().catch(() => ({}));
    const email = normEmail(b.email);
    if (!email) return json({ error: 'Érvénytelen e-mail cím.' }, 400);
    await ensureDeskColumn(env);
    let user = await env.DB.prepare(`SELECT id, email, name, desk_markets FROM users WHERE email = ?`).bind(email).first();
    let created = false;
    if (!user) {
      const name = String(b.name || '').trim();
      if (!name) return json({ error: 'Add meg a nevet.' }, 400);
      const role = b.role === 'admin' ? 'admin' : b.role === 'sales_desk' ? 'sales_desk' : 'sales_manager';
      const desk = role === 'sales_desk' || b.desk_access === true || b.desk_access === 1 ? 1 : 0;
      const markets = cleanMarkets(b.desk_markets);
      // No usable password: a random one nobody knows. They sign in by link (an admin can still set a password).
      const res = await env.DB.prepare(`INSERT INTO users (email, name, role, salt_hex, hash_hex, desk_access, desk_markets) VALUES (?,?,?,?,?,?,?)`)
        .bind(email, name, role, randomHex(16), randomHex(32), desk, markets).run();
      user = { id: res.meta.last_row_id, email, name, desk_markets: markets };
      created = true;
    }
    const next = safeNext(b.next, '/sales/');
    const url = await issueLink(env, originFor(origin, user.desk_markets), user.id, next, INVITE_DAYS * 86400, me.id);
    // No e-mail service on this site (e.g. the dev sites): the admin gets the one-time link to forward themselves.
    const sent = env.RESEND_API_KEY ? await sendInviteMail(env, user, url, next, me.name).catch(() => false) : false;
    if (!sent) return json({ ok: true, created, id: user.id, mailed: false, link: url, days: INVITE_DAYS });
    return json({ ok: true, created, id: user.id, mailed: true });
  }

  return json({ error: 'Not found' }, 404);
}
