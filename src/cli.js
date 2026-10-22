#!/usr/bin/env node
// Dana Clean CLI — © Watan Al-Nahar. All rights reserved.
const E = require('./engine'); const [cmd, ...rest] = process.argv.slice(2);
const fmt = b => b > 1073741824 ? (b / 1073741824).toFixed(2) + ' GB' : (b / 1048576).toFixed(1) + ' MB';
(async () => {
  if (cmd === 'scan') { const r = await E.scanAll(); r.forEach(c => console.log(c.id.padEnd(10), fmt(c.size).padStart(10), c.count + ' files')); console.log('TOTAL', fmt(r.reduce((a, c) => a + c.size, 0))); }
  else if (cmd === 'clean') { if (!rest.includes('--yes')) return console.log('Add --yes to confirm. Categories:', rest.filter(x => x !== '--yes').join(',') || 'sysTemp'); const ids = rest.filter(x => x !== '--yes'); console.log(await E.clean(ids.length ? ids : ['sysTemp'])); }
  else if (cmd === 'malware') { const r = await E.malwareScan(rest.length ? rest : undefined); console.log(`scanned ${r.scanned}, findings ${r.findings.length}`); r.findings.forEach(f => console.log(f.level, f.reason, f.path)); }
  else if (cmd === 'startup') console.table(await E.startupItems());
  else if (cmd === 'large') (await E.largeFiles(rest[0], +rest[1] || 100)).forEach(f => console.log(fmt(f.size).padStart(10), f.path));
  else if (cmd === 'dups') (await E.duplicates(rest[0])).forEach(g => console.log(fmt(g.waste), g.files.join(' | ')));
  else console.log('Dana Clean CLI\n  dana scan | clean <ids> --yes | malware [dirs] | startup | large [dir] [MB] | dups [dir]');
})();
