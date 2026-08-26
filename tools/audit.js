#!/usr/bin/env node
/* Fairness audit for the word bank.
 *
 * The game is only honest if a player cannot tell real from fake without reading
 * the definition. Three separate leaks have happened here, each introduced by
 * habit rather than decision:
 *
 *   - definition style: real words had semicolons and second senses, fakes never did
 *   - word endings:     -ine was 89% fake, -ous was 84% real
 *   - word shape:       a visible two-word compound was 69% fake
 *
 * Run this after adding words. Anything a player can see without reading the
 * definition should appear at close to the same rate on both sides.
 *
 *   node tools/audit.js [--dict words.txt] [--freq freq.txt]
 *
 * --dict  a large English word list; every fake is checked against it, because
 *         invented words have a habit of turning out to be real
 * --freq  a frequency list ("word count" per line), used to judge which halves of
 *         a compound are everyday words
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const arg = name => { const i = process.argv.indexOf(name); return i === -1 ? null : process.argv[i + 1]; };
const bank = new Function(fs.readFileSync(path.join(ROOT, 'words.js'), 'utf8') +
  '; return {real: REAL_WORDS, fake: FAKE_WORDS};')();

const all = [...bank.real, ...bank.fake];
const base = bank.fake.length / all.length;
const pct = n => Math.round(100 * n);
const share = (arr, test) => pct(arr.filter(test).length / arr.length);
const words = x => x.def.split(/\s+/).length;
let problems = 0;
const flag = msg => { problems++; console.log('  ** ' + msg); };

console.log(`BANK: ${bank.real.length} real + ${bank.fake.length} fake = ${all.length} (${pct(base)}% fake)`);
[1, 2, 3].forEach(l => {
  const r = bank.real.filter(x => x.lvl === l).length, k = bank.fake.filter(x => x.lvl === l).length;
  console.log(`  level ${l}: ${r} real + ${k} fake`);
});

console.log('\nINTEGRITY');
const names = all.map(x => x.w);
const dupes = names.filter((w, i) => names.indexOf(w) !== i);
if (dupes.length) flag('duplicate words: ' + dupes.join(', '));
const bad = all.filter(x => !x.w || !x.pos || !x.def || !x.note || !x.lvl);
if (bad.length) flag('entries missing a field: ' + bad.map(x => x.w || '??').join(', '));
const noEx = bank.real.filter(x => !x.ex);
if (noEx.length) flag('real words with no example: ' + noEx.map(x => x.w).join(', '));
const fakeEx = bank.fake.filter(x => x.ex);
if (fakeEx.length) flag('fake words carrying an example: ' + fakeEx.map(x => x.w).join(', '));
const odd = names.filter(w => !/^[a-z]+$/.test(w));
if (odd.length) flag('words that are not plain lowercase (audio filenames break): ' + odd.join(', '));
const notes = bank.fake.filter(x => !/^Fake word/.test(x.note));
if (notes.length) flag('fake notes not opening "Fake word": ' + notes.map(x => x.w).join(', '));
if (!problems) console.log('  clean');

const dictPath = arg('--dict');
if (dictPath && fs.existsSync(dictPath)) {
  const dict = new Set(fs.readFileSync(dictPath, 'utf8').split('\n').map(s => s.trim()).filter(Boolean));
  const real = bank.fake.filter(x => dict.has(x.w));
  console.log('\nDICTIONARY SCREEN');
  if (real.length) flag('invented words that are real: ' + real.map(x => x.w).join(', '));
  else console.log(`  none of the ${bank.fake.length} invented words appear in the list`);
  const unconfirmed = bank.real.filter(x => !dict.has(x.w));
  console.log(`  real words not in the list (judge these yourself): ${unconfirmed.map(x => x.w).join(', ') || 'none'}`);
}

console.log('\nDEFINITION STYLE                real  fake   gap');
const markers = [
  ['starts "the "', x => /^the /i.test(x.def)],
  ['starts "a "/"an "', x => /^an? /i.test(x.def)],
  ['starts "to "', x => /^to /.test(x.def)],
  ['starts "of "', x => /^of /.test(x.def)],
  ['contains a semicolon', x => x.def.includes(';')],
  ['contains "or"', x => /\bor\b/.test(x.def)],
  ['contains a comma', x => x.def.includes(',')],
  ['under 6 words', x => words(x) < 6],
  ['over 12 words', x => words(x) > 12],
];
markers.forEach(([label, test]) => {
  const r = share(bank.real, test), k = share(bank.fake, test), gap = Math.abs(r - k);
  console.log(`  ${label.padEnd(28)} ${String(r).padStart(4)} ${String(k).padStart(5)} ${String(gap).padStart(5)}${gap > 10 ? '  **' : ''}`);
  if (gap > 10) problems++;
});
[1, 2, 3].forEach(l => {
  const r = bank.real.filter(x => x.lvl === l), k = bank.fake.filter(x => x.lvl === l);
  const rm = r.reduce((a, c) => a + words(c), 0) / r.length;
  const km = k.reduce((a, c) => a + words(c), 0) / k.length;
  const gap = Math.abs(rm - km);
  console.log(`  level ${l} mean words`.padEnd(30) + `${rm.toFixed(1).padStart(4)} ${km.toFixed(1).padStart(5)} ${gap.toFixed(1).padStart(5)}${gap > 1.5 ? '  **' : ''}`);
  if (gap > 1.5) problems++;
});

console.log('\nWORD ENDINGS (8+ words, more than 30 points off the base rate)');
const counts = {};
const tally = (w, side) => {
  for (const n of [2, 3, 4]) {
    if (w.length <= n + 2) continue;
    const s = w.slice(-n);
    counts[s] = counts[s] || { real: 0, fake: 0 };
    counts[s][side]++;
  }
};
bank.real.forEach(x => tally(x.w, 'real'));
bank.fake.forEach(x => tally(x.w, 'fake'));
const skewed = Object.entries(counts)
  .filter(([, c]) => c.real + c.fake >= 8)
  .map(([s, c]) => ({ s, ...c, share: c.fake / (c.real + c.fake) }))
  .filter(x => Math.abs(x.share - base) > 0.3)
  .sort((a, b) => b.share - a.share);
if (skewed.length) skewed.forEach(x => flag(`-${x.s}: ${x.real} real / ${x.fake} fake = ${pct(x.share)}% fake`));
else console.log('  none');

const freqPath = arg('--freq');
if (freqPath && fs.existsSync(freqPath)) {
  const top = new Set();
  fs.readFileSync(freqPath, 'utf8').split('\n').slice(0, 12000).forEach(line => {
    const w = line.split(' ')[0];
    if (w && w.length >= 4) top.add(w);
  });
  const compound = w => {
    for (let i = 4; i <= w.length - 4; i++) if (top.has(w.slice(0, i)) && top.has(w.slice(i))) return true;
    return false;
  };
  const r = bank.real.filter(x => compound(x.w)).length, k = bank.fake.filter(x => compound(x.w)).length;
  const s = k / (r + k);
  console.log('\nWORD SHAPE');
  console.log(`  visible two-word compounds: ${r} real / ${k} fake = ${pct(s)}% fake (base ${pct(base)}%)`);
  if (Math.abs(s - base) > 0.15) flag('compounds lean too far one way — add real ones, or retire invented ones');
}

console.log(problems ? `\n${problems} thing(s) to fix` : '\nnothing to fix');
process.exit(problems ? 1 : 0);
