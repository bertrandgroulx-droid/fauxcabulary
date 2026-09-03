#!/usr/bin/env python3
"""Draw the Fauxcabulary mark and rasterise the icon set.

The mark is an F whose middle arm is forged in three pieces — part of the letter
genuine, part fabricated, which is the game. Azure on near-black, so it sits well on
a light or a dark wallpaper.

The geometry lived twice, hand-written, in icons/icon.svg and icons/maskable.svg. It
lives here once now, so moving the middle arm cannot leave the two files disagreeing.
Running this reproduces both files byte for byte.

    pip install cairosvg pillow
    python3 tools/make-icons.py

Rasterise with cairosvg rather than screenshotting a browser: a headless capture
silently left the bottom of the canvas unpainted. Anything iOS touches is flattened
to opaque RGB, because iOS composites black behind transparency.
"""
import os

INK  = "#12141c"       # near-black ground
BLUE = "#5aa9ff"       # the game's azure
BOX  = 512
SAFE = 0.62            # Android crops to a circle of ~66% width

STEM   = (152, 112, 60, 288)     # x, y, w, h — the upright
ARM_T  = (152, 112, 216, 60)     # the top arm
ARM_M  = [(152, 226, 60, 60),    # the middle arm, in three pieces: one joined…
          (232, 226, 52, 60),    # …and two forged
          (304, 226, 52, 60)]
R      = 10                      # corner rounding

def rect(x, y, w, h, r=R):
    r = f' rx="{r}"' if r else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}"{r} fill="{BLUE}"/>'

def mark(indent):
    # the joined piece of the middle arm is square-cornered: it is part of the stem
    parts = [rect(*STEM), rect(*ARM_T), rect(*ARM_M[0], r=0), rect(*ARM_M[1]), rect(*ARM_M[2])]
    return "\n".join(indent + p for p in parts)

def icon_svg():
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {BOX} {BOX}">\n'
            f'  <rect width="{BOX}" height="{BOX}" fill="{INK}"/>\n'
            f'{mark("  ")}\n'
            f'</svg>\n')

def maskable_svg():
    c = BOX // 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {BOX} {BOX}">\n'
            f'  <!-- Android crops to a circle of ~66% width, so the mark sits inside that safe zone -->\n'
            f'  <rect width="{BOX}" height="{BOX}" fill="{INK}"/>\n'
            f'  <g transform="translate({c},{c}) scale({SAFE}) translate(-{c},-{c})">\n'
            f'{mark("    ")}\n'
            f'  </g>\n'
            f'</svg>\n')

# source svg -> output png, size, and whether the platform needs it opaque
PNGS = [
    ("icons/icon.svg",     "icons/apple-touch-icon.png",  180, True),   # iOS masks it itself
    ("icons/icon.svg",     "icons/icon-192.png",          192, True),
    ("icons/icon.svg",     "icons/icon-512.png",          512, True),
    ("icons/maskable.svg", "icons/icon-maskable-512.png", 512, True),
    ("icons/icon.svg",     "icons/favicon-32.png",         32, True),
    ("icons/icon.svg",     "icons/favicon-16.png",         16, True),
]

if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    open("icons/icon.svg", "w").write(icon_svg())
    open("icons/maskable.svg", "w").write(maskable_svg())
    print("icons/icon.svg, icons/maskable.svg")

    import cairosvg
    from PIL import Image
    for src, out, px, opaque in PNGS:
        cairosvg.svg2png(url=src, write_to=out, output_width=px, output_height=px)
        if opaque:
            im = Image.open(out)
            flat = Image.new("RGB", im.size, INK)
            flat.paste(im, mask=im.convert("RGBA").getchannel("A"))
            flat.save(out)
        print(f"  {out} ({px}px)")
