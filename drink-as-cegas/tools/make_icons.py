"""Gera assets/icon-192.png e icon-512.png (taça adesivo rosa + bolinha turquesa no fundo #0C0C0D). Requer Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'assets'
S = 4  # supersampling

def icon(size):
    W = size * S
    im = Image.new('RGBA', (W, W), '#0C0C0D')
    d = ImageDraw.Draw(im)
    u = W / 200
    glass = [(44 * u, 62 * u), (156 * u, 62 * u), (142 * u, 168 * u), (58 * u, 168 * u)]
    d.polygon(glass, fill='#FFFFFF')
    d.line(glass + [glass[0]], fill='#FFFFFF', width=int(16 * u), joint='curve')
    inner = [(54 * u, 70 * u), (146 * u, 70 * u), (134 * u, 160 * u), (66 * u, 160 * u)]
    d.polygon(inner, fill='#E8336D')
    d.rectangle([54 * u, 70 * u, 146 * u, 84 * u], fill='#FF8FB1')
    for cx, cy, r, c in [(138, 58, 26, '#009F93'), (70, 120, 12, '#F2E9FC')]:
        d.ellipse([(cx - r - 7) * u, (cy - r - 7) * u, (cx + r + 7) * u, (cy + r + 7) * u], fill='#FFFFFF')
        d.ellipse([(cx - r) * u, (cy - r) * u, (cx + r) * u, (cy + r) * u], fill=c)
    return im.resize((size, size), Image.LANCZOS)

for s in (192, 512):
    icon(s).save(OUT / f'icon-{s}.png', optimize=True)
    print('ok', s)
