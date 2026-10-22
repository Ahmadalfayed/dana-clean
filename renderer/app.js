// Dana Clean UI — © Watan Al-Nahar. All rights reserved.
let L = localStorage.lang || 'ar'; const t = (k, o = {}) => (T[L][k] || k).replace(/\{(\w+)\}/g, (_, x) => o[x]);
const $ = s => document.querySelector(s), V = $('#view');
const fmt = b => { const ar = L === 'ar'; if (b >= 1073741824) return (b / 1073741824).toFixed(2) + (ar ? ' جيجا' : ' GB'); if (b >= 1048576) return (b / 1048576).toFixed(1) + (ar ? ' ميجا' : ' MB'); return Math.round(b / 1024) + (ar ? ' كيلو' : ' KB'); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ep = s => esc(s).replace(/([\\/])/g, '$1\u200E');
const I = { dash: '<path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z"/>', clean: '<path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14zM6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"/>', mal: '<path d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5z"/>', priv: '<path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>', start: '<path d="M13 3h-2v10h2zm4.8 2.2-1.4 1.4A7 7 0 1 1 7.6 6.6L6.2 5.2A9 9 0 1 0 17.8 5.2z"/>', large: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 7V3.5L18.5 9z"/>', dups: '<path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>' };
const S = { scan: null, mal: null, start: null, last: +localStorage.last || 0, sel: new Set(['sysTemp', 'thumbs', 'logs', 'chrome', 'edge', 'firefox', 'safari', 'appCache', 'recycle']) };
const ICON = { sysTemp: '🗂️', appCache: '📦', thumbs: '🖼️', logs: '📜', chrome: '🌐', edge: '🌊', firefox: '🦊', safari: '🧭', recent: '🕘', recycle: '♻️' };
let cur = 'dash';
function nav() { $('#nav').innerHTML = Object.keys(I).map(k => `<button class="${k === cur ? 'on' : ''}" data-v="${k}"><svg viewBox="0 0 24 24" fill="currentColor">${I[k]}</svg>${t(k)}</button>`).join(''); $('#nav').querySelectorAll('button').forEach(b => b.onclick = () => go(b.dataset.v)); }
function i18n() { document.documentElement.lang = L; document.documentElement.dir = L === 'ar' ? 'rtl' : 'ltr'; document.querySelectorAll('[data-t]').forEach(e => e.textContent = t(e.dataset.t)); $('#lang').textContent = L === 'ar' ? 'English' : 'العربية'; nav(); }
$('#lang').onclick = () => { L = localStorage.lang = L === 'ar' ? 'en' : 'ar'; i18n(); go(cur); };
function toast(m) { const e = $('#toast'); e.textContent = m; e.classList.remove('hidden'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.add('hidden'), 3200); }
function confirmBox(title, body, yes) { return new Promise(r => { $('#mTitle').textContent = title; $('#mBody').innerHTML = body; $('#mYes').textContent = yes || t('yes'); $('#mNo').textContent = t('no'); $('#modal').classList.remove('hidden'); $('#mYes').onclick = () => { $('#modal').classList.add('hidden'); r(true); }; $('#mNo').onclick = () => { $('#modal').classList.add('hidden'); r(false); }; }); }
const head = (k, sub) => `<h1>${t(k)}</h1><p class="sub">${sub}${window.MOCK ? ` · <span class="pill medium">${t('mockNote')}</span>` : ''}</p>`;
async function doScan() { S.scan = await api.scan(); S.last = Date.now(); localStorage.last = S.last; }
const ago = ts => { if (!ts) return t('never'); const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? t('now') : t('mins', { n: m }); };

const views = {
  async dash() {
    const junk = S.scan ? S.scan.reduce((a, c) => a + c.size, 0) : 0, items = S.scan ? S.scan.reduce((a, c) => a + c.count, 0) : 0;
    const thr = S.mal ? S.mal.findings.length : 0; const score = S.scan ? await api.health(S.scan, S.mal, S.start) : null; const d = await api.disk();
    const lbl = score == null ? '—' : score >= 90 ? t('excellent') : score >= 75 ? t('good') : score >= 55 ? t('fair') : t('poor');
    const col = score == null ? '#22314f' : score >= 75 ? '#1fb5a6' : score >= 55 ? '#e7b54a' : '#ef5d5d'; const C = 2 * Math.PI * 80;
    V.innerHTML = head('hello', t('dashSub')) + `<div class="card hero"><div class="ring"><svg width="190" height="190"><circle cx="95" cy="95" r="80" stroke="#1a2744" stroke-width="16" fill="none"/><circle cx="95" cy="95" r="80" stroke="${col}" stroke-width="16" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - (score || 0) / 100)}" style="transition:stroke-dashoffset 1s"/></svg><div class="v"><b>${score ?? '—'}</b><small>${t('health')}</small></div></div>
      <div class="sp"><h2 style="margin:0;color:${col}">${lbl}</h2><p class="sub" style="margin:6px 0 16px">${t('last')}: ${ago(S.last && S.scan ? S.last : 0)}</p>
      ${d ? `<small style="color:var(--mu)">${t('diskFree')}: <b style="color:var(--tx)">${fmt(d.free)}</b> ${t('of')} ${fmt(d.total)}</small><div class="bar" style="margin:8px 0 18px;max-width:420px"><div style="width:${(1 - d.free / d.total) * 100}%"></div></div>` : ''}
      <button class="gold" id="sm">${t('smart')}</button></div></div>
      <div class="grid g4" style="margin-top:16px">${[['reclaim', S.scan ? fmt(junk) : '—', '🧹', '#e7b54a'], ['found', S.scan ? items.toLocaleString(L) : '—', '📁', '#1fb5a6'], ['threats', S.mal ? thr : '—', '🛡️', thr ? '#ef5d5d' : '#1fb5a6'], ['last', ago(S.scan ? S.last : 0), '⏱️', '#8a97b3']].map(([k, v, ic, c]) => `<div class="card stat"><i style="background:${c}22">${ic}</i><small>${t(k)}</small><b>${v}</b></div>`).join('')}</div>`;
    $('#sm').onclick = async () => { $('#sm').disabled = true; $('#sm').innerHTML = `<span class="spin"></span> ${t('scanning')}`; await Promise.all([doScan(), api.malware().then(r => S.mal = r), api.startup().then(r => S.start = r)]); views.dash(); };
  },
  async clean(group = ['system', 'browser']) {
    const pk = cur; V.innerHTML = head(pk === 'priv' ? 'priv' : 'clean', pk === 'priv' ? t('privSub') : t('cleanSub')) + (pk === 'priv' ? `<div class="note" style="margin-bottom:14px">${t('privNote')}</div>` : '') + `<div class="card"><div class="empty"><span class="spin"></span> ${t('scanning')}</div></div>`;
    if (!S.scan) await doScan(); if (cur !== pk) return;
    const list = S.scan.filter(c => group.includes(c.group)); const sum = () => list.filter(c => S.sel.has(c.id)).reduce((a, c) => a + c.size, 0);
    V.querySelector('.card').innerHTML = list.map(c => `<div class="cat"><input type="checkbox" data-id="${c.id}" ${S.sel.has(c.id) ? 'checked' : ''}><div class="ic">${ICON[c.id] || '📁'}</div><div class="sp"><b>${t(c.id)}</b><small>${c.count.toLocaleString(L)} ${t('files')}</small></div>${c.items.length ? `<button class="ghost" data-p="${c.id}">${t('preview')}</button>` : ''}<div class="size">${fmt(c.size)}</div></div>`).join('') +
      `<div class="row" style="margin-top:16px"><b id="tot" style="color:var(--gold);font-size:20px">${fmt(sum())}</b><div class="sp"></div><button class="gold" id="go">${t('cleanSel')}</button></div>`;
    V.querySelectorAll('[data-id]').forEach(c => c.onchange = () => { c.checked ? S.sel.add(c.dataset.id) : S.sel.delete(c.dataset.id); $('#tot').textContent = fmt(sum()); });
    V.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const c = list.find(x => x.id === b.dataset.p); confirmBox(t(c.id), `<div class="preview"><table>${c.items.slice(0, 200).map(i => `<tr><td class="path">${ep(i.path)}</td><td class="size">${fmt(i.size)}</td></tr>`).join('')}</table></div>`, 'OK'); });
    $('#go').onclick = async () => { const ids = list.filter(c => S.sel.has(c.id)).map(c => c.id); const n = list.filter(c => ids.includes(c.id)).reduce((a, c) => a + c.count, 0);
      if (!ids.length || !await confirmBox(t('confirmT'), `<p>${t('confirmB', { n: n.toLocaleString(L), s: fmt(sum()) })}</p>`)) return;
      $('#go').disabled = true; $('#go').innerHTML = `<span class="spin"></span>`; const r = await api.clean(ids); toast(t('done', { s: fmt(r.freed) })); S.scan = null; views.clean(group); };
  },
  priv() { return views.clean(['privacy', 'browser']); },
  async mal(dir) {
    V.innerHTML = head('mal', t('malSub')) + `<div class="card"><div class="row"><button class="gold" id="ms">${t('startScan')}</button><button class="ghost" id="md">${t('chooseDir')}</button><span class="sp"></span><span id="prog" style="color:var(--mu)"></span></div><div id="mr" style="margin-top:14px"></div></div>`;
    const render = () => { const r = S.mal; if (!r) return; $('#prog').textContent = `${r.scanned.toLocaleString(L)} ${t('scanned')}`;
      $('#mr').innerHTML = r.findings.length ? `<table><tr><th>${t('file')}</th><th>${t('reason')}</th><th>${t('level')}</th><th></th></tr>${r.findings.map((f, i) => `<tr><td class="path">${ep(f.path)}</td><td>${t(f.reason)}${f.name ? ` <small style="color:var(--mu)">(${esc(f.name)})</small>` : ''}</td><td><span class="pill ${f.level}">${t(f.level)}</span></td><td style="white-space:nowrap"><button class="ghost" data-s="${i}">${t('show')}</button> <button class="danger" data-q="${i}">${t('quar')}</button></td></tr>`).join('')}</table>` : `<div class="empty"><div class="big">🛡️</div>${t('noThreat')}</div>`;
      $('#mr').querySelectorAll('[data-s]').forEach(b => b.onclick = () => api.reveal(r.findings[b.dataset.s].path));
      $('#mr').querySelectorAll('[data-q]').forEach(b => b.onclick = async () => { const f = r.findings[b.dataset.q]; if (!await confirmBox(t('quar'), `<p class="path">${ep(f.path)}</p>`, t('quar'))) return; await api.quarantine(f.path); r.findings.splice(b.dataset.q, 1); toast(t('quarDone')); render(); }); };
    api.onMal(n => { const p = $('#prog'); if (p) p.textContent = `${n.toLocaleString(L)} ${t('scanned')}`; });
    const run = async d => { $('#ms').disabled = true; $('#mr').innerHTML = `<div class="empty"><span class="spin"></span> ${t('scanning')}</div>`; S.mal = await api.malware(d ? [d] : undefined); $('#ms').disabled = false; render(); };
    $('#ms').onclick = () => run(); $('#md').onclick = async () => { const d = await api.pickDir(); if (d) run(d); }; render();
  },
  async start() {
    V.innerHTML = head('start', t('startSub')) + `<div class="card"><div class="empty"><span class="spin"></span></div></div>`; S.start = await api.startup(); if (cur !== 'start') return;
    V.querySelector('.card').innerHTML = S.start.length ? `<table><tr><th>${t('name')}</th><th>${t('cmd')}</th><th>${t('src')}</th><th>${t('status')}</th></tr>${S.start.map(s => `<tr><td><b>${esc(s.name)}</b></td><td class="path">${ep(s.command)}</td><td style="color:var(--mu);direction:ltr">${esc(s.source)}</td><td><span class="pill ${s.suspicious ? 'high' : 'ok'}">${s.suspicious ? t('susp') : t('normal')}</span></td></tr>`).join('')}</table>` : `<div class="empty">${t('none')}</div>`;
  },
  async large() { await fileList('large', () => api.large(), r => r.map((f, i) => `<tr><td class="path">${ep(f.path)}</td><td class="size">${fmt(f.size)}</td><td style="white-space:nowrap"><button class="ghost" data-s="${esc(f.path)}">${t('show')}</button> <button class="danger" data-d="${esc(f.path)}">${t('toTrash')}</button></td></tr>`).join('')); },
  async dups() { await fileList('dups', () => api.dups(), r => r.map(g => `<tr><td colspan="3" style="background:var(--p2);border-radius:8px"><b>${g.files.length} ${t('copies')}</b> · ${fmt(g.size)} · <span style="color:var(--gold)">${fmt(g.waste)} ${t('waste')}</span></td></tr>` + g.files.map((f, i) => `<tr><td class="path">${ep(f)}</td><td></td><td style="white-space:nowrap"><button class="ghost" data-s="${esc(f)}">${t('show')}</button> ${i ? `<button class="danger" data-d="${esc(f)}">${t('toTrash')}</button>` : ''}</td></tr>`).join('')).join('')); }
};
async function fileList(k, fetcher, rows) {
  V.innerHTML = head(k, t(k + 'Sub')) + `<div class="card"><button class="gold" id="f">${t('find')}</button><div id="fr" style="margin-top:14px"></div></div>`;
  $('#f').onclick = async () => { $('#fr').innerHTML = `<div class="empty"><span class="spin"></span> ${t('scanning')}</div>`; const r = await fetcher(); if (cur !== k) return;
    $('#fr').innerHTML = r.length ? `<table>${rows(r)}</table>` : `<div class="empty">${t('none')}</div>`;
    $('#fr').querySelectorAll('[data-s]').forEach(b => b.onclick = () => api.reveal(b.dataset.s));
    $('#fr').querySelectorAll('[data-d]').forEach(b => b.onclick = async () => { if (!await confirmBox(t('toTrash'), `<p class="path">${ep(b.dataset.d)}</p>`, t('toTrash'))) return; await api.trash(b.dataset.d); b.closest('tr').remove(); }); };
}
function go(v) { cur = v; nav(); views[v](); }
window.go = go; i18n(); go('dash');
