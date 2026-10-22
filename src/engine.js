// Dana Clean engine — original code. © Watan Al-Nahar. All rights reserved.
const fs = require('fs'), fsp = fs.promises, path = require('path'), os = require('os'), crypto = require('crypto');
const { execFile } = require('child_process');
const H = os.homedir(), P = process.platform;
const env = (k, d = '') => process.env[k] || d;

function categories() {
  const L = env('LOCALAPPDATA', path.join(H, 'AppData/Local')), R = env('APPDATA', path.join(H, 'AppData/Roaming'));
  const C = [];
  const add = (id, group, paths, opts = {}) => C.push({ id, group, paths: paths.filter(Boolean), ...opts });
  if (P === 'win32') {
    add('sysTemp', 'system', [env('TEMP', path.join(L, 'Temp')), path.join(env('WINDIR', 'C:/Windows'), 'Temp')]);
    add('thumbs', 'system', [path.join(L, 'Microsoft/Windows/Explorer')], { pattern: /^(thumbcache|iconcache)_.*\.db$/i });
    add('logs', 'system', [path.join(env('WINDIR', 'C:/Windows'), 'Logs/CBS'), path.join(L, 'CrashDumps'), path.join(L, 'Microsoft/Windows/WER')]);
    add('chrome', 'browser', [path.join(L, 'Google/Chrome/User Data/Default/Cache'), path.join(L, 'Google/Chrome/User Data/Default/Code Cache')]);
    add('edge', 'browser', [path.join(L, 'Microsoft/Edge/User Data/Default/Cache'), path.join(L, 'Microsoft/Edge/User Data/Default/Code Cache')]);
    add('firefox', 'browser', [path.join(L, 'Mozilla/Firefox/Profiles')], { sub: 'cache2' });
    add('recent', 'privacy', [path.join(R, 'Microsoft/Windows/Recent')]);
    add('recycle', 'system', [], { recycle: true });
  } else if (P === 'darwin') {
    add('sysTemp', 'system', [os.tmpdir()]);
    add('appCache', 'system', [path.join(H, 'Library/Caches')]);
    add('logs', 'system', [path.join(H, 'Library/Logs')]);
    add('chrome', 'browser', [path.join(H, 'Library/Caches/Google/Chrome')]);
    add('safari', 'browser', [path.join(H, 'Library/Caches/com.apple.Safari')]);
    add('recycle', 'system', [path.join(H, '.Trash')]);
  } else {
    add('sysTemp', 'system', ['/tmp', '/var/tmp']);
    add('appCache', 'system', [path.join(H, '.cache')], { exclude: ['ms-playwright', 'electron', 'pip'] });
    add('thumbs', 'system', [path.join(H, '.cache/thumbnails')]);
    add('logs', 'system', [path.join(H, '.local/state'), '/var/log/journal'].filter(p => p.startsWith(H)));
    add('chrome', 'browser', [path.join(H, '.cache/google-chrome'), path.join(H, '.cache/chromium')]);
    add('firefox', 'browser', [path.join(H, '.cache/mozilla')]);
    add('recent', 'privacy', [path.join(H, '.local/share/recently-used.xbel')]);
    add('recycle', 'system', [path.join(H, '.local/share/Trash/files')]);
  }
  return C;
}
// Safety: deletion allowed only inside these roots
const SAFE_ROOTS = () => categories().flatMap(c => c.paths).map(p => path.resolve(p));
function isSafe(p) { const r = path.resolve(p); return SAFE_ROOTS().some(s => r.startsWith(s + path.sep) || (r === s && fs.existsSync(r) && fs.statSync(r).isFile())); }

async function walk(dir, cb, depth = 0, limit = { n: 0, max: 200000 }) {
  if (depth > 12 || limit.n > limit.max) return;
  let ents; try { ents = await fsp.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const fp = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) await walk(fp, cb, depth + 1, limit);
    else if (e.isFile()) { limit.n++; try { const st = await fsp.stat(fp); await cb(fp, st, e.name); } catch {} }
  }
}
async function scanCategory(c) {
  const items = []; let size = 0;
  for (const root of c.paths) {
    let st; try { st = await fsp.stat(root); } catch { continue; }
    if (st.isFile()) { items.push({ path: root, size: st.size }); size += st.size; continue; }
    await walk(root, (fp, s, name) => {
      if (c.pattern && !c.pattern.test(name)) return;
      if (c.sub && !fp.split(path.sep).includes(c.sub)) return;
      if (c.exclude && c.exclude.some(x => fp.includes(path.sep + x + path.sep))) return;
      items.push({ path: fp, size: s.size }); size += s.size;
    });
  }
  if (c.recycle && P === 'win32') { const r = await winRecycle(); return { id: c.id, group: c.group, size: r.size, count: r.count, items: [], recycle: true }; }
  items.sort((a, b) => b.size - a.size);
  return { id: c.id, group: c.group, size, count: items.length, items: items.slice(0, 300), recycle: !!c.recycle };
}
function ps(cmd) { return new Promise(r => execFile('powershell.exe', ['-NoProfile', '-Command', cmd], { windowsHide: true, timeout: 60000 }, (e, o) => r(e ? '' : o))); }
async function winRecycle() {
  const o = await ps("$s=(New-Object -ComObject Shell.Application).NameSpace(10).Items();$t=0;foreach($i in $s){$t+=$i.Size};\"$($s.Count) $t\"");
  const [count, size] = o.trim().split(' ').map(Number); return { count: count || 0, size: size || 0 };
}
async function scanAll() { const cs = categories(); return Promise.all(cs.map(scanCategory)); }

async function clean(ids) {
  const cs = categories().filter(c => ids.includes(c.id)); let freed = 0, removed = 0, skipped = 0;
  for (const c of cs) {
    if (c.recycle && P === 'win32') { const r = await winRecycle(); await ps('Clear-RecycleBin -Force -ErrorAction SilentlyContinue'); freed += r.size; removed += r.count; continue; }
    const full = { ...c }; const res = []; 
    for (const root of c.paths) { let st; try { st = await fsp.stat(root); } catch { continue; }
      if (st.isFile()) { res.push({ path: root, size: st.size }); continue; }
      await walk(root, (fp, s, name) => { if (c.pattern && !c.pattern.test(name)) return; if (c.sub && !fp.split(path.sep).includes(c.sub)) return; if (c.exclude && c.exclude.some(x => fp.includes(path.sep + x + path.sep))) return; res.push({ path: fp, size: s.size }); }); }
    for (const it of res) {
      if (!isSafe(it.path)) { skipped++; continue; }
      try { await fsp.unlink(it.path); freed += it.size; removed++; } catch { skipped++; } // locked/in-use files are skipped
    }
  }
  return { freed, removed, skipped };
}

// ---- Malware scanner (report only) ----
const SIGS = require('../assets/signatures.json');
const RISKY = /\.(exe|scr|bat|cmd|vbs|js|jse|ps1|hta|msi|com|pif|lnk|jar)$/i;
const DOUBLE = /\.(pdf|docx?|xlsx?|jpe?g|png|txt|mp4|zip)\.(exe|scr|bat|cmd|vbs|js|com|pif|hta)$/i;
function sha256(fp) { return new Promise((res, rej) => { const h = crypto.createHash('sha256'); fs.createReadStream(fp).on('data', d => h.update(d)).on('end', () => res(h.digest('hex'))).on('error', rej); }); }
async function malwareScan(dirs, onProgress) {
  dirs = dirs || [path.join(H, 'Downloads'), path.join(H, 'Desktop')];
  const findings = []; let scanned = 0;
  for (const d of dirs) await walk(d, async (fp, st, name) => {
    scanned++; if (onProgress && scanned % 25 === 0) onProgress(scanned);
    if (st.size < 64 * 1024 * 1024) { try { const h = await sha256(fp); if (SIGS.sha256[h]) findings.push({ path: fp, level: 'high', reason: 'sig', name: SIGS.sha256[h], hash: h }); } catch {} }
    if (DOUBLE.test(name)) findings.push({ path: fp, level: 'high', reason: 'double' });
    else if (/[\u202E\u200F]/.test(name)) findings.push({ path: fp, level: 'high', reason: 'rtlo' });
    else if (RISKY.test(name) && /(crack|keygen|patch|activator|loader)/i.test(name)) findings.push({ path: fp, level: 'medium', reason: 'crack' });
  }, 0, { n: 0, max: 20000 });
  return { scanned, findings, sigCount: Object.keys(SIGS.sha256).length };
}
async function quarantine(fp) {
  const q = path.join(H, '.dana-quarantine'); await fsp.mkdir(q, { recursive: true });
  const dest = path.join(q, Date.now() + '_' + path.basename(fp) + '.quarantined'); await fsp.rename(fp, dest).catch(async () => { await fsp.copyFile(fp, dest); await fsp.unlink(fp); });
  await fsp.appendFile(path.join(q, 'log.txt'), `${new Date().toISOString()}\t${fp}\t${dest}\n`); return dest;
}

async function startupItems() {
  const out = [];
  if (P === 'win32') {
    for (const hive of ['HKCU', 'HKLM']) {
      const o = await ps(`Get-ItemProperty '${hive}:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' | Select-Object * -ExcludeProperty PS* | ConvertTo-Json`);
      try { const j = JSON.parse(o || '{}'); for (const [k, v] of Object.entries(j)) out.push({ name: k, command: String(v), source: hive + '\\Run' }); } catch {}
    }
    const sf = path.join(env('APPDATA'), 'Microsoft/Windows/Start Menu/Programs/Startup');
    try { for (const f of await fsp.readdir(sf)) out.push({ name: f, command: path.join(sf, f), source: 'Startup folder' }); } catch {}
  } else {
    const dirs = P === 'darwin' ? [path.join(H, 'Library/LaunchAgents'), '/Library/LaunchAgents'] : [path.join(H, '.config/autostart'), '/etc/xdg/autostart'];
    for (const d of dirs) { try { for (const f of await fsp.readdir(d)) { let cmd = ''; try { const t = await fsp.readFile(path.join(d, f), 'utf8'); cmd = (t.match(/^Exec=(.*)$/m) || t.match(/<string>(\/[^<]+)<\/string>/) || [, ''])[1]; } catch {} out.push({ name: f.replace(/\.(desktop|plist)$/, ''), command: cmd, source: d }); } } catch {} }
  }
  return out.map(i => ({ ...i, suspicious: /\\temp\\|\/tmp\/|appdata\\roaming\\[^\\]+\.exe|powershell.*-enc/i.test(i.command) }));
}

async function largeFiles(dir = H, minMB = 100) {
  const r = []; await walk(dir, (fp, st) => { if (st.size >= minMB * 1048576) r.push({ path: fp, size: st.size, mtime: st.mtimeMs }); }, 0, { n: 0, max: 300000 });
  return r.sort((a, b) => b.size - a.size).slice(0, 200);
}
async function duplicates(dir = path.join(H, 'Downloads'), minKB = 100) {
  const bySize = new Map(); await walk(dir, (fp, st) => { if (st.size >= minKB * 1024) { const a = bySize.get(st.size) || []; a.push(fp); bySize.set(st.size, a); } }, 0, { n: 0, max: 100000 });
  const groups = [];
  for (const [size, files] of bySize) { if (files.length < 2) continue; const byHash = {}; for (const f of files) { try { const h = await sha256(f); (byHash[h] = byHash[h] || []).push(f); } catch {} }
    for (const [h, fs2] of Object.entries(byHash)) if (fs2.length > 1) groups.push({ hash: h, size, files: fs2, waste: size * (fs2.length - 1) }); }
  return groups.sort((a, b) => b.waste - a.waste);
}
async function deleteUserFile(fp) { const { shell } = require('electron'); await shell.trashItem(fp); return true; } // to Recycle Bin, never permanent

function health(scan, mal, start) {
  let s = 100; const junk = scan.reduce((a, c) => a + c.size, 0) / 1073741824;
  s -= Math.min(30, junk * 6); s -= Math.min(40, (mal?.findings?.filter(f => f.level === 'high').length || 0) * 20); s -= Math.min(10, (start?.filter(x => x.suspicious).length || 0) * 5);
  return Math.max(0, Math.round(s));
}
function disk() { try { const s = fs.statfsSync(P === 'win32' ? (env('SystemDrive', 'C:') + '\\') : '/'); return { total: s.blocks * s.bsize, free: s.bavail * s.bsize }; } catch { return null; } }
module.exports = { categories, scanAll, clean, malwareScan, quarantine, startupItems, largeFiles, duplicates, deleteUserFile, health, disk, isSafe };
