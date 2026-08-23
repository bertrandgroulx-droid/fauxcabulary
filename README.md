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
- Instant reveal after each answer, with etymology or the real word you were thinking of.
- Score out of 10 with a rank, a per-word recap, and a copyable emoji result grid.
- Personal best saved in the browser.
- Keyboard play: `←` real, `→` fake, `Enter` next.
- Light and dark themes, following whatever your phone is set to.
- No build step, no dependencies, no tracking. Two files and a stylesheet in the head.

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

All the content is in `words.js` — two arrays, `REAL_WORDS` and `FAKE_WORDS`.
Each entry looks like this:

```js
{
  w: "borborygmus",
  pos: "noun",
  def: "the rumbling noise made by gas moving through the intestines",
  note: "Real. From Greek <em>borborygmos</em> — the word is basically the sound."
}
```

The game works out real vs. fake from which array the word is in, so you never have
to set a flag. Add as many as you like to either array; the game draws a random split
each round and won't repeat a word until it has worked through the pool.

Two rules of thumb that keep the game honest:

1. **Check every real word in a dictionary before you add it.** If it isn't in
   Merriam-Webster, Collins or the OED, it belongs in `FAKE_WORDS` instead.
2. **Check every fake word too** — the funniest inventions have a habit of turning
   out to be real Scots dialect from 1740.

## Ideas for later

- Daily challenge: same ten words for everyone, seeded by the date.
- Difficulty tiers, and a timer for the brave.
- Streaks, and a stats screen behind the personal best.
- Sound, and a shareable link that carries your score.
