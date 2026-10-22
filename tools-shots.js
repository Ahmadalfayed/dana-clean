const { app, BrowserWindow } = require('electron'); const fs = require('fs'), path = require('path');
const real = process.env.REAL === '1';
app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 1280, height: 820, show: true, useContentSize: true, webPreferences: real ? { backgroundThrottling: false, preload: path.join(__dirname, 'src/preload.js'), contextIsolation: true, sandbox: false } : { backgroundThrottling: false } });
  if (real) { const E = require('./src/engine'); const { ipcMain } = require('electron'); for (const [n, f] of Object.entries({ scan: E.scanAll, clean: async () => ({ freed: 0 }), startup: E.startupItems, large: E.largeFiles, dups: E.duplicates, malware: d => E.malwareScan(d), quarantine: async () => 1, trash: async () => 1, disk: E.disk, health: E.health, platform: () => process.platform, reveal: () => 0, pickDir: () => null })) ipcMain.handle(n, (_e, ...a) => f(...a)); }
  await w.loadFile('renderer/index.html'); await w.webContents.executeJavaScript('localStorage.clear()'); await w.loadFile('renderer/index.html');
  const js = s => w.webContents.executeJavaScript(s), sleep = ms => new Promise(r => setTimeout(r, ms));
  const snap = async n => { await sleep(2600); fs.writeFileSync(`shots/${n}.png`, (await w.webContents.capturePage()).toPNG()); console.log(n); };
  const steps = JSON.parse(process.env.STEPS);
  for (const [n, code] of steps) { await js(code); await snap(n); }
  app.quit();
});
