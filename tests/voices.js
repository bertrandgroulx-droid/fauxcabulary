// The voice chips must pick the voice, preview it, and re-point the clip mid-game.
const { boot } = require('./harness');

// a fake Audio that records what the page asked for
const made = [];
function Audio(src){ made.push(src); this.src=src; this.preload=''; this.currentTime=0;
  this.play=function(){ this.played=true; return {catch(){}}; }; this.pause=function(){}; }

// Opened on the random-puzzles options, where no word is on screen yet. (Today's
// daily opens straight into its first word, and preloads that word's clip.)
const { els, store } = boot({ Audio, search: '?practice' });

const ok=(c,m)=>{ if(!c) throw new Error('FAIL: '+m); };
const NAMES=['emma','isabella','alice','lily'];

// default voice, nothing played at startup
ok(els['voice-emma'].getAttribute('aria-pressed')==='true', 'Emma should be the default');
ok(made.length===0, 'no audio should load before the player asks for it');

// tapping a chip selects it, previews it, and deselects the others
NAMES.forEach(v => {
  made.length = 0;
  els['voice-'+v].handlers.click();
  ok(els['voice-'+v].getAttribute('aria-pressed')==='true', v+' should read as selected');
  NAMES.filter(o=>o!==v).forEach(o =>
    ok(els['voice-'+o].getAttribute('aria-pressed')==='false', 'only one voice may be selected'));
  ok(made.some(s => s === 'audio/'+v+'/petrichor.mp3'), v+' should preview a word: got '+JSON.stringify(made));
  ok(JSON.parse(store['fauxcabulary:voice'])===v, v+' should be remembered');
});

// in play, the clip for the word on screen comes from the chosen voice
els['voice-alice'].handlers.click();
made.length = 0;
els['btn-start'].handlers.click();
const word = els.word.textContent;
ok(made.some(s => s === 'audio/alice/'+word+'.mp3'),
   'clip should be loaded from the chosen voice, got '+JSON.stringify(made));

// switching voice mid-game re-points the current word straight away
made.length = 0;
els['voice-lily'].handlers.click();
ok(made.some(s => s === 'audio/lily/'+word+'.mp3'),
   'changing voice mid-game should reload the current word, got '+JSON.stringify(made));

// and the next card follows the new voice too
els['btn-real'].handlers.click();
made.length = 0;
els['btn-next'].handlers.click();
const next = els.word.textContent;
ok(made.some(s => s === 'audio/lily/'+next+'.mp3'), 'later cards should use the chosen voice');

console.log('all voice-selection checks passed');
