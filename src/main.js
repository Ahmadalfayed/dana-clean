// Dana Clean — © Watan Al-Nahar. All rights reserved.
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path'), E = require('./engine');
let win;
function create() {
  win = new BrowserWindow({ width: 1280, height: 820, minWidth: 1000, minHeight: 680, backgroundColor: '#0b1020', title: 'دانة · Dana Clean', icon: path.join(__dirname, '../assets/icon.png'), autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: false } });
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  if (process.env.DANA_SHOTS) require('./shots')(win);
}
const h = (n, f) => ipcMain.handle(n, (_e, ...a) => f(...a));
h('scan', E.scanAll); h('clean', E.clean); h('startup', E.startupItems); h('large', E.largeFiles); h('dups', E.duplicates);
h('malware', d => E.malwareScan(d, n => win && win.webContents.send('mal-progress', n)));
h('quarantine', E.quarantine); h('trash', E.deleteUserFile); h('disk', E.disk); h('health', E.health);
h('platform', () => process.platform); h('reveal', p => shell.showItemInFolder(p));
h('pickDir', async () => { const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] }); return r.canceled ? null : r.filePaths[0]; });
app.whenReady().then(create); app.on('window-all-closed', () => app.quit());
