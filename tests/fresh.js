// How many games can a player get through before any word comes round again?
const { boot } = require('./harness');
const { els } = boot();

const seen = new Set(); let games = 0, firstRepeat = null;
while (games < 60) {
  els['btn-start'].handlers.click();
  games++;
  for (let i = 0; i < 10; i++) {
    const w = els.word.textContent;
    if (seen.has(w) && firstRepeat === null) firstRepeat = games;
    seen.add(w);
    els['btn-real'].handlers.click();
    els['btn-next'].handlers.click();
  }
}
console.log('first repeated word appeared in game', firstRepeat, '— distinct words seen over 60 games:', seen.size);
