const { contextBridge, ipcRenderer } = require('electron');
const i = (n) => (...a) => ipcRenderer.invoke(n, ...a);
contextBridge.exposeInMainWorld('api', { scan: i('scan'), clean: i('clean'), startup: i('startup'), large: i('large'), dups: i('dups'), malware: i('malware'), quarantine: i('quarantine'), trash: i('trash'), disk: i('disk'), health: i('health'), platform: i('platform'), reveal: i('reveal'), pickDir: i('pickDir'), onMal: cb => ipcRenderer.on('mal-progress', (_e, n) => cb(n)) });
