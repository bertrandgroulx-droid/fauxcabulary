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
- Score out of 10 with a rank, a per-word recap, and a copyable emoji result grid.
- Personal best saved in the browser.
- A speaker button that reads the word aloud, asking the device for a female British
  (`en-GB`) voice and falling back to whatever the platform offers.
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

## Adding words

All the content is in `words.js` — two arrays, `REAL_WORDS` (176 entries) and
`FAKE_WORDS` (138 entries), 314 words in all. Each level holds a little over 100 of
them, which is about nine games before a word comes round again.
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
to set a flag. Add as many as you like to either array; the game draws a random split
each round and won't repeat a word until it has worked through the pool.

Two rules of thumb that keep the game honest:

1. **Check every real word in a dictionary before you add it.** If it isn't in
   Merriam-Webster, Collins or the OED, it belongs in `FAKE_WORDS` instead.
2. **Check every fake word too** — the funniest inventions have a habit of turning
   out to be real Scots dialect from 1740. Screening the bank against a large word
   list caught exactly this: <em>crepusculine</em> and <em>somnifuge</em> were both
   written as inventions and both turned out to be genuine words.

## Ideas for later

- Daily challenge: same ten words for everyone, seeded by the date.
- Difficulty tiers, and a timer for the brave.
- Streaks, and a stats screen behind the personal best.
- Sound, and a shareable link that carries your score.
