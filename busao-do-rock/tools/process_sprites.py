"""Padroniza os sprites dos personagens (assets/_raw/chars/*.png) em assets/chars/<id>.webp.

Uso (na pasta busao-do-rock):  python tools/process_sprites.py
Requer: pip install pillow

Todos saem no MESMO canvas (CANVAS, potência de 2 para o WebGL não redimensionar), fundo transparente,
proporção preservada, sem cortar: recorta a sobra transparente, encaixa a figura pela altura (ou pela
largura, se for um grupo muito largo), centraliza na horizontal e encosta os pés na borda de baixo.
Como o canvas é igual para todos, o jogo desenha todos na mesma escala (config.js > charHeight).
"""
import json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
RAW = os.path.join(ASSETS, '_raw', 'chars')
OUT = os.path.join(ASSETS, 'chars')

CANVAS = (1024, 512)   # 2:1, cabe pessoa sozinha e banda inteira na mesma altura
MARGIN_TOP = 6         # px livres em cima
QUALITY = 72           # webp com alpha
ALPHA_CUT = 12         # pixels com alpha abaixo disso contam como transparentes no recorte

# id do jogo (config.js) : arquivo original (nome dado na pasta sprites)
SPRITES = {
    'ozzy':      'ozzy.png',
    'raul':      'raul seixas.png',
    'kurt':      'kurtcobain.png',
    'chorao':    'chorao.png',
    'slipknot':  'slipknot.png',
    'sepultura': 'SEPULTURA.png',
    'angus':     'angus young.png',
    'axl':       'axlr.png',
    'soad':      'soad.png',
}


def fit(im):
    im = im.convert('RGBA')
    mask = im.getchannel('A').point(lambda a: 255 if a >= ALPHA_CUT else 0)
    im = im.crop(mask.getbbox())
    cw, ch = CANVAS[0], CANVAS[1] - MARGIN_TOP
    s = min(cw / im.width, ch / im.height)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    out = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    out.alpha_composite(im, ((CANVAS[0] - im.width) // 2, CANVAS[1] - im.height))
    return out, s


def main():
    os.makedirs(OUT, exist_ok=True)
    report = []
    for cid, src in SPRITES.items():
        out, s = fit(Image.open(os.path.join(RAW, src)))
        dst = os.path.join(OUT, cid + '.webp')
        out.save(dst, 'WEBP', quality=QUALITY, method=6, alpha_quality=90)
        kb = round(os.path.getsize(dst) / 1024, 1)
        report.append({'id': cid, 'file': 'chars/' + cid + '.webp', 'source': '_raw/chars/' + src,
                       'w': CANVAS[0], 'h': CANVAS[1], 'scale': round(s, 3), 'kb': kb})
        print(cid, kb, 'KB', 'escala', round(s, 2))
    man_path = os.path.join(ASSETS, 'manifest.json')
    with open(man_path, encoding='utf-8') as f:
        man = json.load(f)
    man['characters'] = {
        'note': 'Sprites dos personagens: canvas igual para todos, fundo transparente, pés na borda de baixo. '
                'Originais em _raw/chars (nomes da pasta sprites). Gere de novo com python tools/process_sprites.py.',
        'canvas': list(CANVAS),
        'items': report,
    }
    with open(man_path, 'w', encoding='utf-8') as f:
        json.dump(man, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('total', round(sum(r['kb'] for r in report), 1), 'KB')


if __name__ == '__main__':
    main()
