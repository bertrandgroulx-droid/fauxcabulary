// Personal best is tracked and labelled per difficulty level.
const { boot } = require('./harness');
const harness = store => boot({ store }).els;
const ok=(c,m)=>{ if(!c) throw new Error('FAIL: '+m); };
const playGame = (els, answerReal) => {
  els['btn-start'].handlers.click();
  let right = 0;
  for (let i=0;i<10;i++){
    els[answerReal ? 'btn-real' : 'btn-fake'].handlers.click();
    if (els['ruling-text'].textContent === 'Correct') right++;
    els['btn-next'].handlers.click();
  }
  return right;
};

// --- a fresh player sees nothing ---
let store = {};
let els = harness(store);
ok(els['best-line'].textContent === '', 'a new player should see no best, got: ' + els['best-line'].textContent);

// --- a score at Tricky is recorded and labelled ---
els['lvl-2'].handlers.click();
const scored2 = playGame(els, true);
ok(JSON.parse(store['fauxcabulary:bests'])['2'] === scored2, 'the Tricky score should be stored under the prefixed key, level 2');
const expect2 = 'Personal best at Tricky — ' + scored2 + '/10';
ok(els['best-line'].textContent === expect2, 'expected "'+expect2+'", got "'+els['best-line'].textContent+'"');
ok(els['best-line-2'].textContent === expect2, 'the results screen should show it too');

// --- switching to a level never played shows nothing, not the other level's score ---
els['lvl-3'].handlers.click();
ok(els['best-line'].textContent === '', 'an unplayed level should not borrow another level\'s best, got: ' + els['best-line'].textContent);
els['lvl-2'].handlers.click();
ok(els['best-line'].textContent === expect2, 'returning to Tricky should show its best again');

// --- a worse score at the same level does not overwrite ---
els['lvl-2'].handlers.click();
const again = playGame(els, false);
const kept = JSON.parse(store['fauxcabulary:bests'])['2'];
ok(kept === Math.max(scored2, again), 'the best should be the higher of the two: ' + kept);

// --- each level keeps its own record ---
els['lvl-3'].handlers.click();
const scored3 = playGame(els, true);
const bests = JSON.parse(store['fauxcabulary:bests']);
ok(bests['3'] === scored3 && bests['2'] === kept, 'levels should not overwrite each other: ' + JSON.stringify(bests));
ok(els['best-line'].textContent === 'Personal best at Fiendish — ' + scored3 + '/10', 'Fiendish should be labelled');

// --- a score saved before levels existed is kept, without claiming a level ---
els = harness({ 'fauxcabulary.best': '9' });
ok(els['best-line'].textContent === 'Earlier best 9/10',
   'a legacy best should show unlabelled, got: ' + els['best-line'].textContent);

// --- keys saved under the old unprefixed names move to the shozbot-wide prefix ---
store = { 'fauxcabulary.bests': '{"2":8}', 'fauxcabulary.level': '3', 'fauxcabulary.voice': '"lily"', 'fauxcabulary.seen': '["aglet"]' };
els = harness(store);
ok(store['fauxcabulary:bests'] === '{"2":8}' && store['fauxcabulary:level'] === '3' && store['fauxcabulary:voice'] === '"lily"' && JSON.parse(store['fauxcabulary:seen'])[0] === 'aglet',
   'old keys should be copied to the prefixed names: ' + JSON.stringify(store));
ok(!('fauxcabulary.bests' in store) && !('fauxcabulary.level' in store), 'old keys should be removed once moved');
ok(els['lvl-3'].getAttribute('aria-pressed') === 'true', 'the migrated level should be the one selected');
ok(els['voice-lily'].getAttribute('aria-pressed') === 'true', 'the migrated voice should be the one selected');
els['lvl-2'].handlers.click();
ok(els['best-line'].textContent === 'Personal best at Tricky — 8/10', 'the migrated best should show, got: ' + els['best-line'].textContent);

// --- but a prefixed key already there wins over a stale old one ---
store = { 'fauxcabulary.bests': '{"2":8}', 'fauxcabulary:bests': '{"2":9}' };
els = harness(store);
ok(store['fauxcabulary:bests'] === '{"2":9}', 'an existing prefixed key must not be overwritten by the old one');

console.log('all personal-best checks passed');
