/* CarAdvance Sales Desk — connects the desk page to /desk/api (Notion).
   Gives the page the same small database interface it used as a Claude artifact:
   collection(name).onSnapshot(cb), doc(path).set/update/delete. Checks for changes every 10 s and when
   the tab regains focus (only downloads the data when something changed), so everyone sees the same, current data.
   A saved record shows at once (the server answers with the finished record). */
(function () {
  const API = location.origin + '/api/desk/';
  const POLL_MS = 10000;
  let state = { vehicles: [], dealers: [], outreach: [], extras: [] }, me = null, catalogue = {};
  const subs = { vehicles: [], dealers: [], outreach: [], extras: [] };
  let loading = null, again = false, lastErr = null, ver = '';
  // Public mode: not signed in (or no Sales Desk access) → the cars only, read-only.
  let PUBLIC = false;
  const markPublic = () => {
    window.DESK_PUBLIC = true; document.documentElement.classList.add('public');
    const keep = () => { if (/^#(dealers|outreach)/.test(location.hash)) location.hash = '#stock'; };
    keep(); addEventListener('hashchange', keep);
  };

  const snap = docs => ({ metadata: { fromCache: false }, docs: docs.map(d => ({ id: d.id, data: () => { const { _pid, ...rest } = d; return rest; } })) });
  const emit = col => subs[col].forEach(s => { try { s.next(snap(state[col])); } catch (e) { console.error(e); } });
  const fail = (code, message) => { const e = new Error(message); e.code = code; return e; };

  async function api(path, opts) {
    const r = await fetch(API + path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
    if (r.redirected || r.status === 401 || (r.headers.get('content-type') || '').includes('text/html')) {
      if (opts && opts.method === 'POST') { location.href = '/admin/?next=' + encodeURIComponent(location.pathname); }
      throw fail('unauthenticated', 'Sign-in needed.');
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = fail(r.status === 409 ? 'conflict' : r.status === 403 ? 'invalid_argument' : r.status >= 500 ? 'unavailable' : 'error', j.error || ('HTTP ' + r.status)); e.current = j.current; throw e; }
    return j;
  }

  // full = download everything even if the version did not change (after a conflict)
  async function refresh(full) {
    if (loading) { if (full) again = true; return loading; }
    loading = (async () => {
      try {
        if (!Object.keys(catalogue).length) catalogue = await fetch('catalogue.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
        let j;
        if (!PUBLIC) {
          // A refresh can hit a transient 401/redirect on cold start — don't demote a signed-in user to
          // public (which disables the stock list) on the first miss; retry a few times first.
          for (let attempt = 1; ; attempt++) {
            try { j = await api('data' + (ver && !full ? '?v=' + encodeURIComponent(ver) : '')); break; }
            catch (e) {
              if (e.code === 'unauthenticated' || e.code === 'invalid_argument') {
                if (attempt >= 3) { PUBLIC = true; markPublic(); break; }
                await new Promise(r => setTimeout(r, 400 * attempt));
              } else throw e;
            }
          }
        }
        if (PUBLIC) { j = await api('public'); j.dealers = []; j.outreach = []; j.me = null; }
        if (j.same) { lastErr = null; return; } // nothing new on the server
        ver = j.v || '';
        me = j.me;
        if (Array.isArray(j.team) && j.team.length) { try { window.dispatchEvent(new CustomEvent('desk:team', { detail: j.team })); } catch (e) {} }
        const changed = ['vehicles', 'dealers', 'outreach'].filter(c => JSON.stringify(state[c]) !== JSON.stringify(j[c]));
        state.vehicles = j.vehicles; state.dealers = j.dealers; state.outreach = j.outreach;
        const firstExtras = !state.extras.length;
        state.extras = Object.entries(catalogue).map(([id, v]) => ({ id, ...v }));
        if (firstExtras) emit('extras');
        changed.forEach(emit);
        lastErr = null;
      } catch (e) {
        if (!lastErr) Object.values(subs).flat().forEach(s => s.error && s.error(e));
        lastErr = e;
      } finally { loading = null; if (again) { again = false; refresh(true); } }
    })();
    return loading;
  }

  function findDoc(col, id) { return state[col].find(d => d.id === id); }

  async function write(op, path, data) {
    const [col, id] = path.split('/');
    const cur = findDoc(col, id) || {};
    const prev = {}; if (data) for (const k of Object.keys(data)) prev[k] = cur[k] ?? null;
    let j;
    try {
      j = await api('write', { method: 'POST', body: JSON.stringify({ op, path, data, prev }) });
    } catch (e) {
      if (e.code === 'conflict') { await refresh(true); const err = fail('conflict', e.message); throw err; }
      throw e;
    }
    // show the change at once with the record the server saved (new activities have the Notion id),
    // then pick up anything else that changed – without making the user wait for it
    const doc = j && j.doc;
    if (op === 'delete') state[col] = state[col].filter(d => d.id !== id);
    else if (doc && doc.id) { const k = state[col].findIndex(d => d.id === doc.id || d.id === id); if (k >= 0) state[col] = state[col].map((d, i) => i === k ? doc : d); else state[col] = [...state[col], doc]; }
    else if (findDoc(col, id)) state[col] = state[col].map(d => d.id === id ? { ...d, ...data } : d);
    emit(col);
    // a refresh already in flight may carry data from before this write – queue one more after it
    ver = ''; if (loading) again = true; refresh();
    return doc;
  }

  const db = {
    collection(col) {
      return {
        onSnapshot(next, error) {
          if (!subs[col]) subs[col] = [];
          const s = { next, error }; subs[col].push(s);
          if (state[col].length) next(snap(state[col])); else refresh();
          return () => { subs[col] = subs[col].filter(x => x !== s); };
        },
      };
    },
    doc(path) {
      return {
        set: data => write('set', path, data),
        update: data => write('update', path, data),
        delete: () => write('delete', path),
      };
    },
  };

  setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });

  window.claude = {
    async use(name) {
      if (name === 'db') { await refresh(); return db; }
      if (name === 'user') { await refresh(); return { email: me && me.email, name: me && me.name, can: async () => (PUBLIC ? null : true) }; }
      if (name === 'downloads') return {
        save: async ({ filename, data }) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
          a.download = filename; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        },
      };
      return null;
    },
    me: () => me,
  };
  window.__deskRefresh = () => refresh(true);
})();
