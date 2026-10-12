// The daily puzzle: the same deck for everyone on a day, the first score kept,
// the streak, Past puzzles, the address, and the share text — all driven
// through the real page script with the clock pinned.
const { boot, bank } = require('./harness');
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };
const hidden = (els, id) => els[id].classList.contains('hidden');
const REAL = new Set(bank.r.map(x => x.w));
const lvlOf = new Map([...bank.r, ...bank.k].map(x => [x.w, x.lvl]));

// Play the game on screen through to the results, answering with `strategy(isReal)`.
function playThrough(els, strategy) {
  const words = [];
  for (let i = 0; i < 10; i++) {
    const w = els.word.textContent;
    words.push(w);
    els[strategy(REAL.has(w)) ? 'btn-real' : 'btn-fake'].handlers.click();
    els['btn-next'].handlers.click();
  }
  return words;
}
const click = (els, id) => els[id].handlers.click({ preventDefault() {} });

// --- opens straight into today's puzzle, with the daily line ---
let store = {};
let { els, history } = boot({ store, now: '2026-10-12' });
ok(!hidden(els, 'game') && hidden(els, 'start') && hidden(els, 'results'), 'the page should open on today\'s words, not a start screen');
ok(els['daily-text'].innerHTML === '<b>Daily No. 285</b> · Mon, Oct 12', 'daily line should name the day, got: ' + els['daily-text'].innerHTML);
ok(hidden(els, 'go-today') && !hidden(els, 'go-past') && !hidden(els, 'go-random'), 'a daily shows the Past and Random links');
ok(history.urls[history.urls.length - 1] === '?daily=2026-10-12', 'the address should carry the day, got: ' + history.urls.join(' '));

// --- the same seed gives the same deck; another day gives another ---
const dealt = playThrough(els, isReal => isReal);
const again = playThrough(boot({ now: '2026-10-12' }).els, isReal => isReal);
ok(dealt.join() === again.join(), 'two visits on one day must deal the same ten in the same order');
const other = playThrough(boot({ now: '2026-10-11' }).els, isReal => isReal);
ok(dealt.join() !== other.join(), 'a different day must deal a different deck');
ok(new Set(dealt).size === 10, 'no word may appear twice in a day');

// --- the daily mixes all three levels and both sides of the bank ---
const levels = new Set(), reals = new Set();
for (let d = 1; d <= 31; d++) {
  const day = boot({ now: '2026-07-' + String(d).padStart(2, '0') }).els;
  const words = playThrough(day, isReal => isReal);
  words.forEach(w => { levels.add(lvlOf.get(w)); reals.add(REAL.has(w)); });
}
ok(levels.size === 3, 'daily decks should draw from all three levels, saw: ' + [...levels].join());
ok(reals.size === 2, 'daily decks should hold both real and fake words');

// --- finishing a daily saves the record in the kit's shape and shows the daily results ---
const rec = JSON.parse(store['fauxcabulary:daily:2026-10-12']);
ok(rec.score === 10 && rec.max === 10, 'a perfect daily should be saved as 10 of 10, got ' + JSON.stringify(rec));
ok(rec.results.length === 10 && rec.results.every(r => r === 1), 'results should be one number per word');
ok(rec.recap.length === 10 && rec.recap.every((p, i) => p[0] === dealt[i] && p[1] === 1), 'recap should name the ten words with right or wrong');
ok(typeof rec.at === 'number', 'the record should carry when it was saved');
ok(!hidden(els, 'results') && hidden(els, 'game'), 'the results should show after the tenth word');
ok(String(els.final.textContent) === '10', 'the score should be large on the results');
ok(els.rank.textContent === 'Lexicographer', 'the game keeps its own rank line');
ok(els.saved.textContent === 'Saved as your score for today.' && els.saved.classList.contains('good') && !hidden(els, 'saved'),
   'the saved line should say the score was kept, got: ' + els.saved.textContent);
ok(hidden(els, 'streak'), 'one day is not a streak');
ok(els.split.textContent.startsWith('This round held'), 'a daily names no level in its split line, got: ' + els.split.textContent);
ok(els['btn-again'].textContent === 'Play random puzzles' && els['btn-share'].textContent === 'Share' &&
   els['btn-replay'].textContent === 'Play it again',
   'the buttons should read Play random puzzles, Share, Play it again, got: ' + [els['btn-again'].textContent, els['btn-share'].textContent, els['btn-replay'].textContent].join(' / '));
ok(els['best-line-2'].textContent === '', 'per-level bests belong to random puzzles, not a mixed daily');
ok(!('fauxcabulary:bests' in store), 'a daily must not touch the per-level bests');

// --- first score kept: a replay shows its own score but leaves the record alone ---
click(els, 'btn-replay');
ok(!hidden(els, 'game'), 'Play it again should deal the day again');
const replay = playThrough(els, isReal => !isReal);
ok(replay.join() === dealt.join(), 'the replay is the same deck');
ok(String(els.final.textContent) === '0', 'the replay shows the replay\'s score');
ok(JSON.parse(store['fauxcabulary:daily:2026-10-12']).score === 10, 'the first score must stay the kept one');
ok(els.saved.textContent === 'Your first score for this puzzle is the one that is kept.' && !els.saved.classList.contains('good'),
   'a replay says the first score is kept, got: ' + els.saved.textContent);

// --- a reload lands on today's results, redrawn from the record ---
({ els, history } = boot({ store, now: '2026-10-12' }));
ok(!hidden(els, 'results') && hidden(els, 'game'), 'a played day should reopen on its results');
ok(String(els.final.textContent) === '10', 'the kept score is the one shown');
ok(els.recap.innerHTML.split('<li>').length - 1 === 10, 'the recap should list the ten words');
dealt.forEach(w => ok(els.recap.innerHTML.includes('<span class="w">' + w + '</span>'), 'recap should name ' + w));
ok(els.recap.innerHTML.includes('You answered Real Word') || els.recap.innerHTML.includes('You answered Fake Word'), 'the recap details should be rebuilt from the bank');
ok(history.urls[history.urls.length - 1] === '?daily=2026-10-12', 'the address should still carry the day');

// --- the streak counts consecutive days ending today or yesterday ---
const record = (s, iso, score) => { s['fauxcabulary:daily:' + iso] = JSON.stringify({ score, max: 10, results: [], recap: [], at: 1 }); };
store = {}; record(store, '2026-10-11', 6); record(store, '2026-10-10', 7);
({ els } = boot({ store, now: '2026-10-12' }));
playThrough(els, isReal => isReal);
ok(els.streak.textContent === '3 days in a row' && !hidden(els, 'streak'), 'three consecutive days should read as a streak, got: ' + els.streak.textContent);
store = {}; record(store, '2026-10-10', 7);
({ els } = boot({ store, now: '2026-10-12' }));
playThrough(els, isReal => isReal);
ok(hidden(els, 'streak'), 'a gap breaks the streak');

// --- Past puzzles: the previous 100 days, newest first, today marked ---
store = {}; record(store, '2026-10-10', 7);
({ els, history } = boot({ store, now: '2026-10-12', search: '?past' }));
ok(!hidden(els, 'past') && hidden(els, 'game'), '?past should open the list');
const rows = els['past-list'].innerHTML.split('<li>').slice(1);
ok(rows.length === 101, 'today plus the previous 100 days, got ' + rows.length);
ok(rows[0].includes('class="today"') && rows[0].includes('No. 285') && rows[0].includes('Today, Oct 12'), 'today should be first and marked: ' + rows[0]);
ok(rows[1].includes('No. 284') && rows[1].includes('Not played'), 'an unplayed day says so: ' + rows[1]);
ok(rows[2].includes('No. 283') && rows[2].includes('7 / 10') && rows[2].includes('done'), 'a played day shows its kept score: ' + rows[2]);
ok(rows[100].includes('No. 185') && rows[100].includes('Jul 4'), 'the list ends 100 days back: ' + rows[100]);
ok(els['daily-text'].innerHTML.startsWith('<b>Past puzzles</b>'), 'the daily line names the list');
ok(!hidden(els, 'go-today') && hidden(els, 'go-past') && !hidden(els, 'go-random'), 'the list offers Today and Random');
// tapping a day opens it: an unplayed day deals, a played day shows its results
els['past-list'].handlers.click({ preventDefault() {}, target: { closest: () => ({ getAttribute: () => '2026-10-11' }) } });
ok(!hidden(els, 'game') && els['daily-text'].innerHTML === '<b>Daily No. 284</b> · Sun, Oct 11', 'tapping an unplayed day should deal it, got: ' + els['daily-text'].innerHTML);
click(els, 'go-past');
els['past-list'].handlers.click({ preventDefault() {}, target: { closest: () => ({ getAttribute: () => '2026-10-10' }) } });
ok(!hidden(els, 'results') && String(els.final.textContent) === '7', 'tapping a played day should show its kept score');
ok(els.saved.textContent === 'Your first score for this puzzle is the one that is kept.', 'an older day\'s results name the kept score');
ok(history.urls[history.urls.length - 1] === '?daily=2026-10-10', 'the address follows the day opened');

// --- the address decides where the page opens ---
({ els } = boot({ now: '2026-10-12', search: '?practice' }));
ok(!hidden(els, 'start') && hidden(els, 'game'), '?practice opens the random options');
ok(els['daily-text'].innerHTML === '<b>Random puzzles</b>' && !hidden(els, 'go-today') && !hidden(els, 'go-past') && hidden(els, 'go-random'),
   'random puzzles show Today and Past links');
({ els } = boot({ now: '2026-10-12', search: '?daily=2026-10-01' }));
ok(!hidden(els, 'game') && els['daily-text'].innerHTML === '<b>Daily No. 274</b> · Thu, Oct 1', 'a linked day opens that day, got: ' + els['daily-text'].innerHTML);
({ els } = boot({ now: '2026-10-12', search: '?daily=2026-12-25' }));
ok(!hidden(els, 'past'), 'a day in the future falls back to the list');
({ els } = boot({ now: '2026-10-12', search: '?daily=nonsense' }));
ok(!hidden(els, 'game') && els['daily-text'].innerHTML.includes('No. 285'), 'a bad date falls back to today');

// --- random puzzles stay random: bests per level, nothing saved as a daily ---
store = {};
({ els, history } = boot({ store, now: '2026-10-12', search: '?practice' }));
els['lvl-1'].handlers.click();
click(els, 'btn-start');
ok(els['daily-text'].innerHTML === '<b>Random puzzles</b>', 'a random game keeps the Random line');
const w1 = playThrough(els, isReal => isReal);
const w2 = playThrough((click(els, 'btn-again'), click(els, 'btn-start'), els), isReal => isReal);
ok(w1.join() !== w2.join(), 'random games differ');
ok(w1.concat(w2).every(w => lvlOf.get(w) === 1), 'random games respect the chosen level');
ok(JSON.parse(store['fauxcabulary:bests'])['1'] === 10, 'random games keep the per-level best');
ok(!Object.keys(store).some(k => k.includes(':daily:')), 'a random game must not write a daily record');
ok(els.split.textContent.startsWith('Easy — '), 'a random game names its level, got: ' + els.split.textContent);
ok(history.urls[history.urls.length - 1] === '?practice', 'the address says ?practice');
click(els, 'btn-replay');
ok(!hidden(els, 'game') && els['daily-text'].innerHTML.includes('No. 285'), 'Today\'s puzzle from random results opens today');

// --- the share text is the kit's ---
let copied = null;
const navigator = { clipboard: { writeText: t => { copied = t; return Promise.resolve(); } } };
({ els } = boot({ now: '2026-10-12', navigator }));
playThrough(els, isReal => (Math.random(), true));
const score = Number(els.final.textContent);
click(els, 'btn-share');
return Promise.resolve().then(() => {
  ok(copied !== null, 'Share should copy when there is no share sheet');
  const lines = copied.split('\n');
  ok(lines[0] === 'Fauxcabulary No. 285 · Oct 12', 'share head, got: ' + lines[0]);
  ok(lines[1].startsWith(score + '/10 ') && (lines[1].match(/🟩/g) || []).length === score && (lines[1].match(/⬜/g) || []).length === 10 - score,
     'share line should carry the score and a square per word, got: ' + lines[1]);
  ok(lines[2] === 'https://shozbot.com/fauxcabulary/', 'share should end with the address, got: ' + lines[2]);
  ok(els['btn-share'].textContent === 'Copied', 'the button should say Copied for a moment');
  console.log('all daily-puzzle checks passed');
});
