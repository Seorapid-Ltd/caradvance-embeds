/* CarAdvance Sales Desk — connects the desk page to /desk/api (Notion).
   Gives the page the same small database interface it used as a Claude artifact:
   collection(name).onSnapshot(cb), doc(path).set/update/delete. Refreshes every 20 s and when
   the tab regains focus, so everyone sees the same, current data. */
(function () {
  const API = location.origin + '/api/desk/';
  const POLL_MS = 20000;
  let state = { vehicles: [], dealers: [], outreach: [], extras: [] }, me = null, catalogue = {};
  const subs = { vehicles: [], dealers: [], outreach: [], extras: [] };
  let loading = null, lastErr = null;
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

  async function refresh(fresh) {
    if (loading) return loading;
    loading = (async () => {
      try {
        if (!Object.keys(catalogue).length) catalogue = await fetch('catalogue.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
        let j;
        if (!PUBLIC) {
          try { j = await api('data' + (fresh ? '?fresh=1' : '')); }
          catch (e) { if (e.code === 'unauthenticated' || e.code === 'invalid_argument') { PUBLIC = true; markPublic(); } else throw e; }
        }
        if (PUBLIC) { j = await api('public'); j.dealers = []; j.outreach = []; j.me = null; }
        me = j.me;
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
      } finally { loading = null; }
    })();
    return loading;
  }

  function findDoc(col, id) { return state[col].find(d => d.id === id); }

  async function write(op, path, data) {
    const [col, id] = path.split('/');
    const cur = findDoc(col, id) || {};
    const prev = {}; if (data) for (const k of Object.keys(data)) prev[k] = cur[k] ?? null;
    try {
      await api('write', { method: 'POST', body: JSON.stringify({ op, path, data, prev }) });
    } catch (e) {
      if (e.code === 'conflict') { await refresh(true); const err = fail('conflict', e.message); throw err; }
      throw e;
    }
    // show the change at once, then confirm from Notion
    if (op === 'delete') state[col] = state[col].filter(d => d.id !== id);
    else if (findDoc(col, id)) state[col] = state[col].map(d => d.id === id ? { ...d, ...data } : d);
    emit(col);
    await refresh(true);
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
