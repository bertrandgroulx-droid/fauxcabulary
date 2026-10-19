// The share icon in the daily line: the link it carries in every state, the
// title beside it, the three ways it hands the link over, and the How to play
// dialog it sits beside.
const { boot, bank, makeEl } = require('./harness');
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };
const hidden = (els, id) => els[id].classList.contains('hidden');
const REAL = new Set(bank.r.map(x => x.w));
const click = (els, id) => els[id].handlers.click({ preventDefault() {} });

// Every share goes through navigator.share when it exists; this one records what it was given.
function sheet() {
  const calls = [];
  return { calls, navigator: { share: data => { calls.push(data); return Promise.resolve(); } } };
}
function shareFrom(opts) {
  const s = sheet();
  const out = boot(Object.assign({ navigator: s.navigator }, opts));
  out.calls = s.calls;
  out.last = () => { click(out.els, 'btn-share-link'); return s.calls[s.calls.length - 1]; };
  return out;
}
function playThrough(els) {
  for (let i = 0; i < 10; i++) {
    els[REAL.has(els.word.textContent) ? 'btn-real' : 'btn-fake'].handlers.click();
    els['btn-next'].handlers.click();
  }
}

// --- today's puzzle, in play: the dated link ---
let t = shareFrom({ now: '2026-10-12' });
ok(!hidden(t.els, 'game'), 'should open on today\'s words');
let link = t.last();
ok(link.url === 'https://shozbot.com/fauxcabulary/?daily=2026-10-12', 'today in play shares the dated link, got: ' + link.url);
ok(link.title === 'Fauxcabulary · Daily No. 285', 'the title names the day, got: ' + link.title);

// --- today's results: still the dated link ---
playThrough(t.els);
ok(!hidden(t.els, 'results'), 'should be on the results');
link = t.last();
ok(link.url === 'https://shozbot.com/fauxcabulary/?daily=2026-10-12' && link.title === 'Fauxcabulary · Daily No. 285',
   'today\'s results share the dated link, got: ' + link.url + ' / ' + link.title);

// --- a past day, opened from its address, in play and on its saved results ---
t = shareFrom({ now: '2026-10-12', search: '?daily=2026-10-03' });
link = t.last();
ok(link.url === 'https://shozbot.com/fauxcabulary/?daily=2026-10-03' && link.title === 'Fauxcabulary · Daily No. 276',
   'a past day in play shares its own date, got: ' + link.url + ' / ' + link.title);
const store = {};
store['fauxcabulary:daily:2026-10-03'] = JSON.stringify({ score: 7, max: 10, results: [1,1,1,1,1,1,1,0,0,0], recap: [], at: 1 });
t = shareFrom({ now: '2026-10-12', search: '?daily=2026-10-03', store });
ok(!hidden(t.els, 'results'), 'a played day opens on its results');
link = t.last();
ok(link.url === 'https://shozbot.com/fauxcabulary/?daily=2026-10-03' && link.title === 'Fauxcabulary · Daily No. 276',
   'a past day\'s saved results share its date, got: ' + link.url);

// --- a past day reached from the list shares that day ---
t = shareFrom({ now: '2026-10-12', search: '?past' });
link = t.last();
ok(link.url === 'https://shozbot.com/fauxcabulary/' && link.title === 'Fauxcabulary', 'the Past puzzles list shares the plain address, got: ' + link.url + ' / ' + link.title);
t.els['past-list'].handlers.click({ preventDefault() {}, target: { closest: () => ({ getAttribute: () => '2026-10-10' }) } });
link = t.last();
ok(link.url === 'https://shozbot.com/fauxcabulary/?daily=2026-10-10' && link.title === 'Fauxcabulary · Daily No. 283',
   'a day tapped in the list shares that day, got: ' + link.url);

// --- random puzzles: the plain address on the options, in play and on the results ---
t = shareFrom({ now: '2026-10-12', search: '?practice' });
ok(!hidden(t.els, 'start'), 'should open on the options');
link = t.last();
ok(link.url === 'https://shozbot.com/fauxcabulary/' && link.title === 'Fauxcabulary', 'the options share the plain address, got: ' + link.url + ' / ' + link.title);
click(t.els, 'btn-start');
link = t.last();
ok(link.url === 'https://shozbot.com/fauxcabulary/' && link.title === 'Fauxcabulary', 'a random deck in play shares the plain address, got: ' + link.url);
playThrough(t.els);
link = t.last();
ok(link.url === 'https://shozbot.com/fauxcabulary/' && link.title === 'Fauxcabulary', 'random results share the plain address, got: ' + link.url);
ok(!('url' in link) || !/practice/.test(link.url), 'no random-puzzle seed is ever shared');

// --- leaving a daily for random puzzles drops the date; coming back restores it ---
t = shareFrom({ now: '2026-10-12' });
click(t.els, 'go-random');
ok(t.last().url === 'https://shozbot.com/fauxcabulary/', 'Random puzzles shares the plain address');
click(t.els, 'go-today');
ok(t.last().url === 'https://shozbot.com/fauxcabulary/?daily=2026-10-12', 'Today\'s puzzle shares the dated link again');

// --- the address comes from the canonical link, never from where the file was loaded ---
t = shareFrom({ now: '2026-10-12', canonical: 'https://example.test/faux/' });
ok(t.last().url === 'https://example.test/faux/?daily=2026-10-12', 'the link is built from the canonical href, got: ' + t.last().url);

// --- a laptop: no share sheet, so the link is copied and a toast says so ---
const copied = [];
let b = boot({ now: '2026-10-12', navigator: { clipboard: { writeText: s => { copied.push(s); return Promise.resolve(); } } } });
ok(!b.els.toast || !b.els.toast.classList.contains('show'), 'the toast starts hidden');
click(b.els, 'btn-share-link');
ok(copied[0] === 'https://shozbot.com/fauxcabulary/?daily=2026-10-12', 'the clipboard gets the dated link, got: ' + copied[0]);
const settle = () => new Promise(r => setTimeout(r, 0));
(async () => {
  await settle();
  ok(b.els.toast.textContent === 'Link copied' && b.els.toast.classList.contains('show'), 'the toast should say Link copied, got: ' + b.els.toast.textContent);
  await new Promise(r => setTimeout(r, 1900));
  ok(!b.els.toast.classList.contains('show'), 'the toast should be gone after about 1.8 seconds');

  // --- a clipboard that refuses falls back to showing the link ---
  b = boot({ now: '2026-10-12', navigator: { clipboard: { writeText: () => Promise.reject(new Error('denied')) } } });
  click(b.els, 'btn-share-link');
  await settle();
  ok(b.els.toast.textContent === 'https://shozbot.com/fauxcabulary/?daily=2026-10-12' && b.els.toast.classList.contains('show'),
     'a refused clipboard shows the link in the toast, got: ' + b.els.toast.textContent);

  // --- neither share sheet nor clipboard: the toast shows the link itself ---
  b = boot({ now: '2026-10-12', search: '?practice', navigator: {} });
  click(b.els, 'btn-share-link');
  ok(b.els.toast.textContent === 'https://shozbot.com/fauxcabulary/' && b.els.toast.classList.contains('show'),
     'with nothing to copy with, the toast shows the link, got: ' + b.els.toast.textContent);

  // --- the share sheet is given the title and the link, not text ---
  t = shareFrom({ now: '2026-10-12' });
  const given = t.last();
  ok(Object.keys(given).sort().join() === 'title,url', 'the share sheet gets title and url only, got: ' + Object.keys(given).join());

  // --- How to play opens a dialog from the daily line and Got it closes it ---
  const d = t.els.help || (t.els.help = makeEl('help'));   // the stub makes elements on first use
  let opened = 0, closed = 0;
  d.showModal = () => { opened++; d.open = true; };
  d.close = () => { closed++; d.open = false; };
  click(t.els, 'go-help');
  ok(opened === 1 && d.open === true, 'How to play should open the dialog');
  ok(d.scrollTop === 0, 'the dialog should open scrolled to the top');
  // keys belong to the dialog while it is up: Enter must not start a random game
  click(t.els, 'go-random');
  click(t.els, 'go-help');
  t.docHandlers.keydown({ key: 'Enter', preventDefault() {} });
  ok(!hidden(t.els, 'start'), 'Enter with the rules up must not deal a random deck');
  click(t.els, 'btn-help-close');
  ok(closed === 1 && d.open === false, 'Got it should close the dialog');
  t.docHandlers.keydown({ key: 'Enter', preventDefault() {} });
  ok(!hidden(t.els, 'game'), 'Enter with the rules closed still deals a random deck');
  // without showModal (an old browser) the open attribute does the job
  delete d.showModal; delete d.close; d.open = undefined;
  click(t.els, 'go-help');
  ok(d.getAttribute('open') === '', 'without showModal the dialog is opened by attribute');
  click(t.els, 'btn-help-close');
  ok(d.getAttribute('open') === undefined, 'and closed by removing it');

  console.log('all share-link checks passed');
})().catch(e => { console.error(e.message); process.exit(1); });
