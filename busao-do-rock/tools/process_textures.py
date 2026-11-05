"""Converte as imagens brutas do Higgsfield (assets/_raw/*.webp, q92) nas texturas leves do jogo (assets/*.webp).

Uso (na pasta busao-do-rock):  python tools/process_textures.py
Requer: pip install pillow
As texturas saem em potência de 2 (repetição sem costura no WebGL) e em webp (poucos KB cada).
"""
import json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
RAW = os.path.join(ASSETS, '_raw')

# id: (arquivo bruto, recorte (x0,y0,x1,y1) ou None, tamanho final, qualidade webp)
JOBS = {
    'asphalt':   ('asphalt.webp',   None,                 (512, 512),  72),
    'sidewalk':  ('sidewalk.webp',  None,                 (512, 512),  72),
    'facade_a':  ('facade_a.webp',  None,                 (512, 1024), 74),
    'facade_b':  ('facade_b.webp',  None,                 (512, 1024), 74),
    'facade_c':  ('facade_c.webp',  None,                 (512, 1024), 74),
    'store':     ('store.webp',     (16, 14, 1018, 636),  (1024, 512), 80),
    'sky':       ('sky.webp',       None,                 (1024, 512), 74),
    'bus_side':  ('bus_side.webp',  None,                 (1024, 512), 80),
    'bus_front': ('bus_front.webp', None,                 (512, 512),  80),
    'tree':      ('tree.webp',      None,                 (256, 256),  80),
}

def main():
    out = {}
    for tid, (src, crop, size, q) in JOBS.items():
        im = Image.open(os.path.join(RAW, src))
        im = im.convert('RGBA' if im.mode == 'RGBA' else 'RGB')
        if crop:
            im = im.crop(crop)
        im = im.resize(size, Image.LANCZOS)
        dst = os.path.join(ASSETS, tid + '.webp')
        im.save(dst, 'WEBP', quality=q, method=6)
        out[tid] = {'file': tid + '.webp', 'w': size[0], 'h': size[1], 'kb': round(os.path.getsize(dst) / 1024, 1)}
        print(tid, out[tid])
    # ícones do PWA: frente do ônibus
    front = Image.open(os.path.join(RAW, 'bus_front.webp')).convert('RGB')
    w, h = front.size
    sq = front.crop(((w - h) // 2, 0, (w - h) // 2 + h, h))
    for s in (192, 512):
        sq.resize((s, s), Image.LANCZOS).quantize(128).save(os.path.join(ASSETS, f'icon-{s}.png'), optimize=True)
    with open(os.path.join(ASSETS, 'manifest.json'), encoding='utf-8') as f:
        man = json.load(f)
    for t in man['textures']:
        if t['id'] in out:
            t.update({k: out[t['id']][k] for k in ('file', 'w', 'h')})
    with open(os.path.join(ASSETS, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(man, f, ensure_ascii=False, indent=2)
        f.write('\n')

if __name__ == '__main__':
    main()
