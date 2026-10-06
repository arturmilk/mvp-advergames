"""
Pós-processamento dos assets gerados no Higgsfield -> sprites do jogo.

Entrada: assets/_raw/*.png (imagens HD com fundo magenta #FF00FF)
Saída:   assets/*.png (sprites em pixels lógicos, fundo transparente) + assets/manifest.json

Passos: chroma key do magenta -> fatiar quadros por colunas vazias -> escala comum por folha
(alinhando os quadros pelos pés) -> redução por média (BOX) -> alpha binário ->
quantização para paleta limitada -> contorno escuro de 1 px.

Uso:  python tools/process_assets.py
"""
import json, os
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'assets', '_raw')
OUT = os.path.join(ROOT, 'assets')
STYLE = ('16-bit SNES-era pixel art, limited palette, crisp pixels, no anti-aliasing, no blur, no text, '
         'clean silhouette, flat shading with 1px dark outline. Flat solid pure magenta #FF00FF background.')

FONT = {'0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111',
        '4': '101101111001001', '6': '111100111101111', 'B': '110101110101110', 'R': '110101110101101'}


def is_magenta(r, g, b):
    return r > 170 and b > 170 and g < 110 and abs(r - b) < 60


def is_fringe(r, g, b):
    # mistura do magenta com o contorno escuro (anti-aliasing da IA); não pega roxo/azul das roupas
    return r > 70 and b > 70 and g < min(r, b) * .55 and abs(r - b) < 45


def key(im):
    """Remove o fundo magenta e as franjas rosadas coladas nele (sem apagar roupas roxas)."""
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    bg = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_magenta(r, g, b):
                bg[y][x] = True
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                px[x, y] = (0, 0, 0, 0)
                continue
            r, g, b, a = px[x, y]
            if is_fringe(r, g, b) and any(0 <= x + dx < w and 0 <= y + dy < h and bg[y + dy][x + dx]
                                          for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = (0, 0, 0, 0)
    return im


def slice_frames(im, min_gap=12, min_w=20):
    """Divide a folha em quadros usando colunas totalmente transparentes."""
    w, h = im.size
    a = im.getchannel('A').load()
    cols = [any(a[x, y] > 0 for y in range(0, h, 2)) for x in range(w)]
    runs, start, gap = [], None, 0
    for x, c in enumerate(cols + [False] * (min_gap + 1)):
        if c:
            if start is None:
                start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap > min_gap:
                end = x - gap
                if end - start >= min_w:
                    runs.append((start, end + 1))
                start, gap = None, 0
    frames = []
    for x0, x1 in runs:
        sub = im.crop((x0, 0, x1, h))
        bb = sub.getbbox()
        frames.append(sub.crop(bb) if bb else sub)
    return frames


def feet_center(f):
    """Centro horizontal dos pixels nos 8% inferiores (pés), para alinhar a animação."""
    w, h = f.size
    a = f.getchannel('A').load()
    xs = [x for y in range(int(h * .92), h) for x in range(w) if a[x, y] > 0]
    return (min(xs) + max(xs)) / 2 if xs else w / 2


def shrink(f, scale, colors=20):
    w, h = f.size
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    # premultiplica para a média não puxar cor do fundo transparente
    small = f.resize((nw, nh), Image.BOX)
    alpha = small.getchannel('A').point(lambda v: 255 if v > 110 else 0)
    rgb = small.convert('RGB').quantize(colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    return out


def add_outline(im, col=(20, 20, 20, 255)):
    w, h = im.size
    big = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0))
    big.paste(im, (1, 1))
    px = big.load()
    src = [[px[x, y][3] > 0 for x in range(w + 2)] for y in range(h + 2)]
    for y in range(h + 2):
        for x in range(w + 2):
            if src[y][x]:
                continue
            if (x > 0 and src[y][x - 1]) or (x < w + 1 and src[y][x + 1]) or (y > 0 and src[y - 1][x]) or (y < h + 1 and src[y + 1][x]):
                px[x, y] = col
    return big


def sheet(frames, scale, anchor='feet', colors=20, outline=True, min_cell=0, flip=False):
    """Monta uma tira horizontal com células iguais, quadros alinhados pela base e pelos pés."""
    small = [shrink(f, scale, colors) for f in frames]
    if flip:
        small = [s.transpose(Image.FLIP_LEFT_RIGHT) for s in small]
    if outline:
        small = [add_outline(s) for s in small]
    cx = [feet_center(s) if anchor == 'feet' else s.size[0] / 2 for s in small]
    left = max(c for c in cx)
    right = max(s.size[0] - c for s, c in zip(small, cx))
    cw, ch = max(min_cell, int(round(left + right)) + 1), max(min_cell, max(s.size[1] for s in small))
    if cw % 2:
        cw += 1
    strip = Image.new('RGBA', (cw * len(small), ch), (0, 0, 0, 0))
    for i, (s, c) in enumerate(zip(small, cx)):
        strip.paste(s, (i * cw + int(round(cw / 2 - c)), ch - s.size[1]), s)
    return strip, cw, ch


def ptext(img, text, cx, y, col=(255, 255, 255, 255)):
    px = img.load()
    x = int(cx - (len(text) * 4 - 1) / 2)
    for ch in text:
        g = FONT.get(ch)
        if g:
            for i, bit in enumerate(g):
                if bit == '1':
                    px[x + i % 3, y + i // 3] = col
        x += 4


manifest = []


def save(name, im, file=None, **meta):
    file = file or name + '.png'
    im.save(os.path.join(OUT, file))
    entry = {'id': name, 'file': file, 'width': im.size[0], 'height': im.size[1], 'runtime': True}
    entry.update(meta)
    manifest.append(entry)
    print(f'{name:22s} {im.size}')


def raw(name):
    return Image.open(os.path.join(RAW, name))


# ---------- personagens (v2: super deformed, célula 48x48 lógica = 96x96 px de tela em escala 2x) ----------
CELL = 48
fr = slice_frames(key(raw('dheep_v2_sheet.png')))
assert len(fr) == 7, f'dheep: {len(fr)} quadros'
img, cw, ch = sheet(fr, 42 / fr[0].size[1], min_cell=CELL)
save('dheep', img, file='dheep-96x96.png', kind='sprite', frameWidth=cw, frameHeight=ch,
     frames=['idle', 'run1', 'run2', 'jump', 'land', 'win', 'hurt'], runFrames=[1, 0],
     usage='Jogador (CONFIG.mascotName), estilo SD. Personagem estilizado, não é retrato. '
           'Os quadros run1/run2 vieram quase iguais da IA, por isso a corrida alterna run1 e idle (runFrames).',
     source='higgsfield:gpt_image_2_5 (quality high, referência: geração v1 do Dheep)',
     prompt='Game sprite sheet, exactly 7 frames in ONE horizontal row ... 1 idle, 2-3 running, 4 jumping, 5 landing, '
            '6 happy victory, 7 surprised hurt. Young male courier based on the reference image (red cap with yellow brim), '
            'super deformed proportions (head ~35%), orange t-shirt with thin red and yellow stripe, dark graphite gray pants, '
            'yellow sneakers, minimalist 3-4 pixel eyes and mouth. ' + STYLE)

fr = slice_frames(key(raw('boss_v2_sheet.png')))
assert len(fr) == 4, f'boss: {len(fr)} quadros'
# a IA desenhou olhando para a direita; no jogo ele fica no topo à direita, olhando para a esquerda
img, cw, ch = sheet(fr, 46 / fr[0].size[1], min_cell=CELL, flip=True)
save('boss', img, file='boss-96x96.png', kind='sprite', frameWidth=cw, frameHeight=ch,
     frames=['idle', 'prep', 'throw', 'celebrate'],
     usage='Gerente Rival (CONFIG.bossName) no topo: feliz e brincalhão, lança obstáculos e comemora.',
     source='higgsfield:gpt_image_2_5 (quality high, referência: geração v1 do Boss)',
     prompt="Game sprite sheet, exactly 4 frames ... 1 idle proud with arms open and big smile ^_^, 2 throw preparation arm "
            "raised (let's go!), 3 throwing arm extended, 4 celebrating jumping arms up laughing. Happy friendly rival manager "
            "based on the reference image (black slicked hair, mustache), super deformed (head ~40%), purple shirt with rolled "
            "sleeves, light blue tie, gray pants. No aggressive features. " + STYLE)

# ---------- obstáculos ----------
fr = slice_frames(key(raw('hazards_sheet.png')))
assert len(fr) == 3, f'hazards: {len(fr)}'
b = add_outline(shrink(fr[0], 17 / fr[0].size[0], 12))
bar = Image.new('RGBA', (b.size[0] * 2, b.size[1]), (0, 0, 0, 0))
bar.paste(b, (0, 0)); bar.paste(b.transpose(Image.FLIP_TOP_BOTTOM), (b.size[0], 0))
save('barrel', bar, kind='sprite', frameWidth=b.size[0], frameHeight=b.size[1], frames=['roll1', 'roll2'],
     usage='Obstáculo vermelho que rola pelas vigas.', source='higgsfield:gpt_image_2_5')
save('box', add_outline(shrink(fr[1], 15 / fr[1].size[0], 12)), kind='sprite', frames=['box'],
     usage='Obstáculo laranja (caixa) que quica.', source='higgsfield:gpt_image_2_5')
save('bottle', add_outline(shrink(fr[2], 18 / fr[2].size[1], 10)), kind='sprite', frames=['bottle'],
     usage='Obstáculo azul (garrafa) que cai rápido em linha reta.', source='higgsfield:gpt_image_2_5')

# ---------- itens ----------
fr = slice_frames(key(raw('food_sheet.png')))
assert len(fr) == 5, f'food: {len(fr)}'
for name, f in zip(['caixa', 'saco', 'leite', 'fardo', 'congelado'], fr):
    sc = 15 / max(f.size)
    save('food_' + name, add_outline(shrink(f, sc, 12)), kind='sprite', frames=[name],
         usage='Item coletável de alimento (+10).', source='higgsfield:gpt_image_2_5')

fr = slice_frames(key(raw('power_sheet.png')))
assert len(fr) == 5, f'power: {len(fr)}'
coin = add_outline(shrink(fr[0], 14 / max(fr[0].size), 10))
w, h = coin.size
strip = Image.new('RGBA', (w * 4, h), (0, 0, 0, 0))
for i, sx in enumerate([1.0, .6, .2, .6]):  # giro da moeda (achatamento horizontal)
    nw = max(2, round(w * sx))
    strip.paste(coin.resize((nw, h), Image.NEAREST), (i * w + (w - nw) // 2, 0))
save('coin', strip, kind='sprite', frameWidth=w, frameHeight=h, frames=['spin1', 'spin2', 'spin3', 'spin4'],
     usage='Moeda R (bônus raro, +50).', source='higgsfield:gpt_image_2_5')
for name, f in zip(['shield', 'nitro', 'magnet', 'fair'], fr[1:]):
    save('pw_' + name, add_outline(shrink(f, 16 / max(f.size), 12)), kind='sprite', frames=[name],
         usage={'shield': 'Capa de chuva: escudo contra 1 batida.', 'nitro': 'Nitro: velocidade 2x por 3 s.',
                'magnet': 'Ímã: puxa itens próximos.', 'fair': 'Preço justo: pontos x2.'}[name],
         source='higgsfield:gpt_image_2_5')

fr = slice_frames(key(raw('truck.png')))
t = add_outline(shrink(fr[0], 46 / fr[0].size[0], 16))
save('truck', Image.merge('RGBA', t.split()), kind='sprite', frameWidth=t.size[0], frameHeight=t.size[1], frames=['drive'],
     usage='Caminhão baú Rover (cenário da rodovia e decoração).', source='higgsfield:gpt_image_2_5')

# ---------- cenários (camada de fundo, 232x300) ----------
LW, H = 232, 300
for theme, dark in [('warehouse', .62), ('highway', .55), ('forest', .58), ('river', .62)]:
    im = raw(f'bg_{theme}.png').convert('RGB')
    nh = round(im.size[1] * LW / im.size[0])
    im = im.resize((LW, nh), Image.BOX)
    top = (nh - H) // 2
    im = im.crop((0, top, LW, top + H))
    im = im.quantize(48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    im = ImageEnhance.Color(im).enhance(.85)
    im = ImageEnhance.Brightness(im).enhance(dark)  # escurece para destacar vigas e sprites
    im = im.convert('RGBA')
    if theme == 'highway':  # placa da BR-364 (texto aplicado no jogo, não pela IA)
        ptext(im, 'BR', 196, 144)
        ptext(im, '364', 196, 151)
    save(f'bg_{theme}_far', im, kind='layer', usage=f'Camada de fundo (parallax lento) do mundo "{theme}".',
         source='higgsfield:gpt_image_2_5')

# ---------- ilustrações do tutorial (256x256) ----------
TUT = [('tutorial-jump', 'tutorial_jump.png', 'PULE: Dheep pulando de uma plataforma para a outra, seta amarela para cima.'),
       ('tutorial-dodge', 'tutorial_dodge.png', 'DESVIE: Dheep desviando de um barril, círculo e placa vermelha de aviso.'),
       ('tutorial-win', 'tutorial_win.png', 'VENÇA: Dheep e o Gerente Rival comemorando no topo, troféu e check verde.')]
for name, src, desc in TUT:
    if not os.path.exists(os.path.join(RAW, src)):
        print('faltando', src)
        continue
    im = raw(src).convert('RGB').resize((256, 256), Image.BOX)
    im = im.quantize(40, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGBA')
    save(name, im, kind='ui', runtime=False, usage='Tela "Como jogar": ' + desc,
         source='higgsfield:gpt_image_2_5 (quality high, referências: Dheep v2 / Boss v2)',
         prompt='16-bit pixel art instructional diagram ... ' + desc + ' Clean light gray background, no text. '
                '16-bit SNES-era pixel art, clean lines, no anti-aliasing, instructional diagram, flat colors.')

json.dump({
    'version': 1,
    'style': STYLE,
    'model': 'gpt_image_2_5 (Higgsfield)',
    'note': 'Sprites em pixels lógicos (o jogo escala por inteiro, nearest-neighbor). '
            'Entradas com runtime=true são carregadas pelo jogo e substituem os placeholders procedurais de mesmo id. '
            'Camadas "mid"/"near" dos cenários e efeitos (poeira, brilho, confete) são procedurais no index.html.',
    'assets': manifest
}, open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('manifest.json ok:', len(manifest), 'assets')
