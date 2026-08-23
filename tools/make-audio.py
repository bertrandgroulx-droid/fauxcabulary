#!/usr/bin/env python3
"""Generate one spoken clip per word in words.js.

The browser's own speech synthesis sounds robotic on most phones — iOS ships
"compact" voices by default — so the game ships its own audio instead. This
renders every word with Kokoro (Apache-2.0) in a British female voice and
writes audio/<word>.mp3.

Setup:
    pip install kokoro-onnx soundfile lameenc
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

Usage:
    python3 tools/make-audio.py [--model PATH] [--voices PATH] [--only WORD ...]

Existing clips are left alone, so adding words only renders the new ones.
"""

import argparse, os, re, sys
import numpy as np
import soundfile as sf
import lameenc
from kokoro_onnx import Kokoro

VOICE = "bf_emma"     # British female
SPEED = 0.9           # a shade slow: these words are unfamiliar
BITRATE = 64          # mono, plenty for a single spoken word

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def words_from_bank():
    src = open(os.path.join(ROOT, "words.js"), encoding="utf-8").read()
    return re.findall(r'\{ w: "([^"]+)"', src)


def trim_silence(audio, sr, threshold=0.01, pad_ms=60):
    """Kokoro leaves a beat of silence at each end; drop most of it."""
    loud = np.where(np.abs(audio) > threshold)[0]
    if len(loud) == 0:
        return audio
    pad = int(sr * pad_ms / 1000)
    return audio[max(0, loud[0] - pad):min(len(audio), loud[-1] + pad)]


def to_mp3(audio, sr, path):
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    with open(path, "wb") as fh:
        fh.write(enc.encode(pcm.tobytes()) + enc.flush())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="kokoro.onnx")
    ap.add_argument("--voices", default="voices.bin")
    ap.add_argument("--out", default=os.path.join(ROOT, "audio"))
    ap.add_argument("--only", nargs="*", help="render just these words")
    ap.add_argument("--force", action="store_true", help="re-render clips that already exist")
    args = ap.parse_args()

    words = args.only or words_from_bank()
    os.makedirs(args.out, exist_ok=True)
    kokoro = Kokoro(args.model, args.voices)

    made = skipped = 0
    for i, word in enumerate(words, 1):
        if not re.fullmatch(r"[a-z]+", word):
            print(f"  skipping {word!r}: not a plain lowercase word", file=sys.stderr)
            continue
        path = os.path.join(args.out, word + ".mp3")
        if os.path.exists(path) and not args.force:
            skipped += 1
            continue
        audio, sr = kokoro.create(word + ".", voice=VOICE, speed=SPEED, lang="en-gb")
        to_mp3(trim_silence(audio, sr), sr, path)
        made += 1
        if made % 25 == 0:
            print(f"  {i}/{len(words)}…", flush=True)

    print(f"done: {made} rendered, {skipped} already present, in {args.out}")


if __name__ == "__main__":
    main()
