# 📚 Fauxcabulary

**Ten words. Some of them are fake.**

Fauxcabulary shows you an obscure-sounding word with a straight-faced definition.
You decide: **REAL** or **FAKE**. Ten words a game, one point each, score out of 10.

How many of the ten are genuine is random — every word flips its own coin, so a round
might hold three real words or eight, and counting won't help you. The rest were
invented for this game: plausible shape, plausible meaning, no dictionary.
After each guess you get the truth, plus a note: where the real word comes from, or
which real word the fake one is impersonating.

## Features

- 10 words per game with a random real/fake split, freshly shuffled.
- Three difficulty levels — Easy, Tricky and Fiendish — each with its own words and
  its own fakes. Your choice is remembered.
- Instant reveal after each answer — **Correct** or **Wrong**, the word's status, and
  a note with the etymology or the real word you were thinking of.
- Back and Forward buttons to step through the words you have already answered.
- Score out of 10 with a rank and a copyable emoji result grid.
- A per-word recap where any word can be tapped open for its definition, the note,
  the example sentence, the answer you gave, and a speaker to hear it again.
- Play again returns to the options, so difficulty and voice can be changed between
  games.
- Personal best saved per difficulty, and labelled with the level it was set at.
- A speaker button that reads the word aloud in a recorded British female voice —
  the same voice on every device, not the phone's robotic built-in one.
- Four voices to choose from — Emma, Isabella, Alice and Lily. Tapping one plays a
  word in it, and the choice is remembered.
- Every real word comes with an example sentence, shown whether you got it right or not.
- Keyboard play: `←` real, `→` fake, `S` to hear the word; once answered, the arrows
  move through your answers and `Enter` goes on.
- Light and dark themes, following whatever your phone is set to.
- No build step, no dependencies, no tracking. Two files and a stylesheet in the head.

Pronunciation uses the browser's built-in speech synthesis, so the exact voice depends
on the device. The game asks for `en-GB` and works down a list of the good British
female British voices that ship on common platforms — Google UK English Female on
Android and Chrome, Serena or Kate on Apple devices, Sonia or Libby on Windows — then
any British voice that is not obviously male, then any British voice at all. If the
device has none, no voice is set and it speaks in the owner's own default voice. A device with no speech support simply hides the
button.

## Installing it on a phone

The game ships a web manifest and icon set, so **Add to Home Screen** on iOS or
**Install app** on Android gives it a real icon and launches it without browser
chrome. The mark is an **F** whose middle arm has been forged in three pieces —
part of the letter is genuine, part fabricated, which is the game.

`icons/icon.svg` is the source. `icons/maskable.svg` is the same mark scaled into
Android's safe zone, since the circular mask crops the corners. The PNGs are rendered
from those two and flattened to opaque RGB, because iOS composites black behind any
transparency.

## Run it locally

It's a static site — double-click `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

This repo ships `.github/workflows/pages.yml`, which publishes the site on every
push to `main`. One-time setup: **Settings → Pages → Build and deployment → Source
→ GitHub Actions**. The site then lives at
`https://<your-username>.github.io/fauxcabulary/`.

## Tests and audits

```sh
node tests/run-all.js                         # seven suites, drive the real game logic
node tools/audit.js --dict dict.txt --freq freq.txt   # fairness audit of the word bank
```

Run the suites after touching `index.html`, and the audit after touching `words.js`.

## Building a different game on this

`RECIPE.md` is a self-contained brief for making another real-or-fake game in this
shape — fake laws, invented bird names, imaginary cocktails — including every content
rule that was learned the hard way here.

## Adding words

All the content is in `words.js` — two arrays, `REAL_WORDS` (447 entries) and
`FAKE_WORDS` (284 entries), 731 words in all, drawn from geology, weather, bookbinding,
cookery, hand tools, feeling and a light seasoning of sport. Each level holds 210 to
254 of them, which is around twenty-four games before a word comes round again.

No single subject should dominate. Sport is about 5% of the bank; when a category
starts to feel repetitive in play, the fix is to trim it and widen the rest rather
than to add more of the same.
Each entry looks like this:

```js
{
  w: "borborygmus",
  pos: "noun",
  def: "the rumbling noise made by gas moving through the intestines",
  note: "Real. From Greek <em>borborygmos</em> — the word is basically the sound.",
  ex: "The lecture hall fell silent just in time to hear the <em>borborygmus</em> from the back row.",
  lvl: 3
}
```

`lvl` is the difficulty: 1 Easy, 2 Tricky, 3 Fiendish. Real words were graded by how
often the word actually occurs in a large frequency corpus, split into thirds; fakes
were graded by how convincingly they are built, since for an invented word
plausibility *is* the difficulty. Both halves of a level have to match — an obvious
fake next to a rare real word gives the game away.

`ex` belongs on real words only — it is what makes the example sentence appear, so a
fake word must not have one.

The game works out real vs. fake from which array the word is in, so you never have
to set a flag. By convention a real word's note opens "Real" and an invented one's
opens "Fake word", matching the label shown on the card. Add as many as you like to either array; the game draws a random split
each round and won't repeat a word until it has worked through the pool.

### The word shapes have to match too

A player noticed that words ending in `-ine` were usually fake, and they were right:
41 of the 46 of them. The same held for `-ling`, `-ick` and `-ish`, while `-ous`,
`-ious` and `-al` almost always meant real. That is enough to win on without reading a
definition, and it came from habit — reaching for Latinate `-ine` when inventing and
picking `-ous` words when choosing real ones.

The fix runs both ways: real words in the fake-shaped endings (`hircine`, `corvine`,
`quisling`, `bailiwick`, `mawkish`, `noisome`) and invented ones in the real-shaped
endings (`glaucinous`, `ombrious`, `tacital`, `crepitic`). No suffix is now more than
30 points off the overall fake rate. There is a check for this alongside the
definition audit; run both after adding words.

### So do the word shapes in general

The suffix problem has a sibling: a word visibly made of two everyday words joined
together — `puddlewink`, `kettlehush` — was 69% likely to be fake, because that is
the easiest way to invent one. English has hundreds of genuine examples and the bank
had almost none, so the fix was to add them: `scuttlebutt`, `spindrift`, `wolfsbane`,
`gallowglass`, `slugabed`, `bellwether`, and a run of birds and plants — `wheatear`,
`stonechat`, `corncrake`, `foxglove`, `nightshade`. The eight most transparent fake
compounds were retired at the same time. Visible compounds are now 48% fake against a
39% base rate.

The general rule: **any surface feature a player can see without reading the
definition** — ending, shape, length, construction — has to appear at close to the
same rate on both sides. Three separate ones have leaked so far, each introduced by
unconscious habit while writing.

### The definitions have to match

The hardest part of this game is not inventing words, it is writing definitions that
give nothing away. A player who notices that real definitions are terse and fake ones
are lyrical can win without knowing a single word. An audit of an earlier version
found exactly that: 18% of real definitions contained a semicolon and 0% of fakes did,
because a semicolon means a second sense and only real words had been given one. Real
definitions used 'or' in 23% of cases against 1% of fakes, and at Easy the real
definitions averaged 5.5 words against the fakes' 8.6.

So fake definitions are written to the same distribution as real ones — second senses
after a semicolon, alternatives with 'or', the same share of terse three-word
definitions and long specific ones, the same rate of definite-article openings, and
matching average length **within each level**. Every marker is currently within four
percentage points. Worth re-checking after adding a batch of words, since it is easy
to drift.

Two more rules of thumb that keep the game honest:

1. **Check every real word in a dictionary before you add it.** If it isn't in
   Merriam-Webster, Collins or the OED, it belongs in `FAKE_WORDS` instead.
   Screening the whole bank against a large word list is the quick way to do this.
2. **Check every fake word too** — the funniest inventions have a habit of turning
   out to be real Scots dialect from 1740. Screening the bank against a large word
   list caught exactly this: <em>crepusculine</em> and <em>somnifuge</em> were both
   written as inventions and both turned out to be genuine words.

## Ideas for later

- Daily challenge: same ten words for everyone, seeded by the date.
- Difficulty tiers, and a timer for the brave.
- Streaks, and a stats screen behind the personal best.
- Sound, and a shareable link that carries your score.
