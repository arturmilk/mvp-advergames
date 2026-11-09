"""
Pós-processamento dos assets gerados no Higgsfield -> sprites do jogo + assets/manifest.json
(Máquina do Mal em: Fuga do Poser)

Entrada: assets/_raw/*.png (originais do Higgsfield, PNG com fundo transparente; bg_far.png é opaco)
Saída:   assets/*.png (sprites recortados e redimensionados) + assets/manifest.json

Uso:  python tools/process_assets.py      (requer: pip install pillow numpy scipy)

Para trocar um sprite: gere a folha nova no Higgsfield com o MESMO número de quadros, numa única linha e com espaço
entre eles, salve em assets/_raw/ com o mesmo nome e rode este script. O jogo lê frames/frameW/frameH do manifest,
então quantidade e tamanho de quadros podem mudar sem mexer no index.html (só os nomes de quadro em frameNames).
"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'assets', '_raw')
OUT = os.path.join(ROOT, 'assets')

MODEL = 'gpt_image_2_5 (Higgsfield), quality=high, resolution=1k, aspect_ratio=3:2, background=transparent'
STYLE = ('Retro 1990s hand-drawn theatrical cartoon animation style, bold squash-and-stretch, thick black ink outlines, flat cel '
         'shading with one soft shadow tone, satirical caricature, no text, no logos, no brand marks. Fully transparent background.')

SOURCES = {  # arquivo bruto -> (job do Higgsfield, prompt resumido; o prompt completo termina com STYLE)
    'hero_sheet.png': ('792ccd6b-567c-469f-a72b-495ee63377da',
        '6 poses of the SAME character in ONE horizontal row, side view facing RIGHT, same ground line. Skinny young black metal '
        'headbanger, classic corpsepaint, long black hair, black studded leather vest over a plain black t-shirt with no print, ripped '
        'black jeans, tall combat boots, spiked wristbands. Poses: run 1, run 2, run looking back panicked, jump tucked, low slide feet '
        'first, defeated/bored.'),
    'poser_sheet.png': ('3fadc731-c916-4753-acfb-8d2ad8e5671b',
        '5 poses of the SAME character in ONE horizontal row, side view facing RIGHT. Cheesy middle-aged rock poser, goatee, smug, '
        'sunglasses on the BACK of his head, black t-shirt with a generic red rose graphic and NO lettering, khaki cargo shorts, white tube '
        'socks, chunky sneakers. Poses: walk, walk pointing, walk talking, finger raised explaining, blasted backwards dizzy.'),
    'bus.png': ('2ee8185d-aaae-42fa-8b41-d5a106429a83',
        'Long sinister black heavy metal tour bus, side view facing RIGHT, chrome trim, red/orange flame stripes, front door OPEN with '
        'steps, silver sign panel with "Máquina do Mal" in gothic blackletter chrome (adaptado da foto do ônibus enviada pelo cliente).'),
    'obstacles_sheet.png': ('f2fc19ca-cdaf-4e06-aa48-55851954e80f',
        '5 obstacles in ONE row: two stacked guitar amp cabinets (no brand plates); low tangled pile of audio cables; stage monitor '
        'wedge blasting a feedback shockwave; fallen microphone stand; low hanging truss bar with two spotlights.'),
    'shirts_sheet.png': ('c41834b1-d597-49d7-a8f5-7402d3c4364d',
        '6 plain BLANK t-shirts, front view, ONE row: black, white, dark blood red, charcoal grey, deep purple, forest green. No print. '
        '(o nome da banda é escrito por cima no jogo, em texto genérico — nada de logo oficial)'),
    'bg_far.png': ('72d9c713-2a9c-492f-ab93-1f64d79fa3ec',
        'Wide side-scrolling background: night outside a heavy metal festival backstage, purple/red sky, full moon, distant stage with '
        'red/white beams, crowd silhouettes, pine trees. Bottom third dark and empty. No text, no banners with words. (opaco)'),
    'fx_sheet.png': ('c9e3c113-0c37-466c-91f4-3ef47a95184d',
        '6 effects in ONE row: purple protective aura bubble with runes; dust puff; yellow lightning bolt; pastel acoustic music notes '
        'with hearts and flowers; burst of debris; golden heavenly light burst.'),
}

manifest = []


def load(name):
    return Image.open(os.path.join(RAW, name)).convert('RGBA')


def clean_alpha(im, lo=70, hi=150):
    a = np.array(im)
    al = a[:, :, 3].astype(np.float32)
    a[:, :, 3] = (np.clip((al - lo) / (hi - lo), 0, 1) * 255).astype(np.uint8)
    a[a[:, :, 3] == 0, :3] = 0
    return Image.fromarray(a)


def slice_frames(im, count, min_gap=6):
    """Divide a folha em `count` quadros pelas colunas vazias (une pedaços soltos, corta quadros encostados)."""
    al = np.array(im)[:, :, 3]
    filled = (al > 8).sum(axis=0) > 0
    runs, start = [], None
    for x, f in enumerate(list(filled) + [False]):
        if f and start is None: start = x
        if not f and start is not None: runs.append([start, x]); start = None
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < min_gap: merged[-1][1] = r[1]
        else: merged.append(r)
    runs = merged
    while len(runs) > count:
        i = min(range(len(runs)), key=lambda k: runs[k][1] - runs[k][0])
        if i == 0: j = 1
        elif i == len(runs) - 1: j = i - 1
        else: j = i - 1 if runs[i][0] - runs[i - 1][1] < runs[i + 1][0] - runs[i][1] else i + 1
        a, b = sorted((i, j)); runs[a] = [runs[a][0], runs[b][1]]; del runs[b]
    cover = (al > 8).sum(axis=0)
    while len(runs) < count:
        i = max(range(len(runs)), key=lambda k: runs[k][1] - runs[k][0])
        x0, x1 = runs[i]; a0, a1 = x0 + (x1 - x0) * 3 // 10, x0 + (x1 - x0) * 7 // 10
        cut = a0 + int(np.argmin(cover[a0:a1]))
        runs[i:i + 1] = [[x0, cut], [cut, x1]]
    assert len(runs) == count, f'esperava {count} quadros, achei {len(runs)}'
    out = []
    for x0, x1 in runs:
        part = im.crop((x0, 0, x1, im.height))
        out.append(part.crop(part.getbbox()))
    return out


def slice_components(im, count, min_area=40):
    """Quadros que se sobrepõem na horizontal (pé de um quadro embaixo do braço do outro): separa por regiões conectadas.
    Os `count` maiores pedaços são os quadros; os pedaços pequenos (estrelinhas, óculos voando) vão para o quadro mais próximo.
    Cada quadro leva só os próprios pixels (máscara), sem pegar pedaço do vizinho."""
    from scipy import ndimage
    a = np.array(im)
    lab, n = ndimage.label(a[:, :, 3] > 8)
    objs = ndimage.find_objects(lab)
    comps = []
    for i, sl in enumerate(objs):
        area = int((lab[sl] == i + 1).sum())
        if area >= min_area: comps.append((area, i + 1, sl))
    comps.sort(reverse=True)
    mains = sorted(comps[:count], key=lambda c: c[2][1].start)
    groups = [[m[1]] for m in mains]
    def dist(sl, ml):
        dx = max(0, ml[1].start - sl[1].stop, sl[1].start - ml[1].stop)
        dy = max(0, ml[0].start - sl[0].stop, sl[0].start - ml[0].stop)
        return dx * dx + dy * dy
    for area, lid, sl in comps[count:]:
        k = min(range(count), key=lambda j: dist(sl, mains[j][2]))
        groups[k].append(lid)
    out = []
    for g in groups:
        m = np.isin(lab, g)
        b = a.copy(); b[~m] = 0
        f = Image.fromarray(b)
        out.append(f.crop(f.getbbox()))
    return out


def fit(im, max_w=None, max_h=None):
    s = 1.0
    if max_w: s = min(s, max_w / im.width)
    if max_h: s = min(s, max_h / im.height)
    if s < 1: im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    return im


def strip(frames, height, pad=6):
    """Tira de quadros com células iguais, mesma escala para todos, alinhados pelos pés (base)."""
    s = height / max(f.height for f in frames)
    fr = [f.resize((max(1, round(f.width * s)), max(1, round(f.height * s))), Image.LANCZOS) for f in frames]
    cw, ch = max(f.width for f in fr) + pad, max(f.height for f in fr) + 2
    st = Image.new('RGBA', (cw * len(fr), ch), (0, 0, 0, 0))
    for i, f in enumerate(fr):
        st.paste(f, (i * cw + (cw - f.width) // 2, ch - f.height - 1), f)
    return st, cw, ch


def save(im, name, aid, usage, src, **extra):
    # WebP com perda leve (q90, alfa sem perda): ~4x menor que PNG, sem diferença visível no celular
    name = os.path.splitext(name)[0] + '.webp'
    path = os.path.join(OUT, name)
    im.save(path, 'WEBP', quality=90, alpha_quality=100, method=6)
    job, prompt = SOURCES[src]
    entry = {'id': aid, 'file': name, 'w': im.width, 'h': im.height, 'frames': 1, 'usage': usage,
             'source': 'assets/_raw/' + src, 'higgsfieldJob': job, 'prompt': prompt}
    entry.update(extra)
    manifest.append(entry)
    print(f'{name:20s} {im.width}x{im.height}  {os.path.getsize(path) // 1024} KB')


# ---- Protagonista: 6 quadros ----
hero = slice_components(clean_alpha(load('hero_sheet.png')), 6)
st, cw, ch = strip(hero, 260)
save(st, 'hero.png', 'hero', 'Protagonista (headbanger). Quadros: corrida 1-3, pulo, deslize, derrota. Ancorado pelos pés.', 'hero_sheet.png',
     frames=6, frameW=cw, frameH=ch, frameNames=['run1', 'run2', 'run3', 'jump', 'slide', 'defeat'], anchor='bottom-center')

# ---- Poser: 5 quadros ----
poser = slice_components(clean_alpha(load('poser_sheet.png')), 5)
st, cw, ch = strip(poser, 280)
save(st, 'poser.png', 'poser', 'O Poser (perseguidor). Quadros: andar 1-3, explicando, derrotado.', 'poser_sheet.png',
     frames=5, frameW=cw, frameH=ch, frameNames=['walk1', 'walk2', 'walk3', 'talk', 'blasted'], anchor='bottom-center')

# ---- Ônibus ----
bus = clean_alpha(load('bus.png')); bus = bus.crop(bus.getbbox())
save(fit(bus, 900), 'bus.png', 'bus', 'Ônibus da Máquina do Mal (intro de 2 s). A porta aberta fica a ~89% da largura.', 'bus.png', doorX=0.89)

# ---- Obstáculos ----
obs = slice_components(clean_alpha(load('obstacles_sheet.png')), 5)
for f, (aid, use) in zip(obs, [('ob_amps', 'Obstáculo: amplificadores empilhados (pular)'),
                               ('ob_cables', 'Obstáculo: cabos no chão (pular; prende se tocar)'),
                               ('ob_monitor', 'Obstáculo: caixa de retorno estourando (pular)'),
                               ('ob_stand', 'Obstáculo: pedestal caído (pular)'),
                               ('ob_truss', 'Obstáculo: treliça baixa com refletores (deslizar por baixo)')]):
    save(fit(f, 320, 320), aid + '.png', aid, use, 'obstacles_sheet.png')

# ---- Camisas (base lisa; o nome da banda é escrito no jogo) ----
shirts = slice_frames(clean_alpha(load('shirts_sheet.png')), 6)
for f, col in zip(shirts, ['black', 'white', 'red', 'grey', 'purple', 'green']):
    save(fit(f, 160, 160), f'shirt_{col}.png', f'shirt_{col}', f'Camisa lisa ({col}). O jogo escreve o nome da banda em texto genérico.', 'shirts_sheet.png')

# ---- Efeitos ----
fxs = slice_frames(clean_alpha(load('fx_sheet.png'), lo=30, hi=110), 6)
for f, (aid, use) in zip(fxs, [('fx_aura', 'Aura protetora (Black Sabbath)'), ('fx_dust', 'Poeira (pulo/aterrissagem/tropeço)'),
                               ('fx_bolt', 'Raio (High Voltage Jump)'), ('fx_notes', 'Notas acústicas (Beatles/Oasis: controles invertidos)'),
                               ('fx_debris', 'Destroços (Meshuggah quebra obstáculo)'), ('fx_holy', 'Luz dourada (camisa sagrada / vitória)')]):
    save(fit(f, 220, 220), aid + '.png', aid, use, 'fx_sheet.png')

# ---- Cenário (opaco) ----
bg = load('bg_far.png').convert('RGB')
save(fit(bg, 1024), 'bg_far.jpg', 'bg_far', 'Parallax de fundo (festival à noite). Repete espelhado na horizontal.', 'bg_far.png')

# ---- Ícones do PWA: rosto do protagonista sobre vermelho escuro ----
face = hero[5]; face = face.crop((0, 0, face.width, int(face.height * .32)))
for size in (192, 512):
    icon = Image.new('RGBA', (size, size), (0, 0, 0, 255))
    d = np.array(icon); yy, xx = np.mgrid[:size, :size]
    r = np.clip(np.hypot(xx - size / 2, yy - size / 2) / (size * .7), 0, 1)
    d[:, :, 0] = (150 * (1 - r) + 20 * r).astype(np.uint8); d[:, :, 1] = (10 * (1 - r)).astype(np.uint8); d[:, :, 2] = (20 * (1 - r)).astype(np.uint8)
    icon = Image.fromarray(d)
    lg = fit(face, int(size * .8), int(size * .8))
    icon.paste(lg, ((size - lg.width) // 2, (size - lg.height) // 2), lg)
    icon.save(os.path.join(OUT, f'icon-{size}.png'), optimize=True)

with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as fp:
    json.dump({'version': 1, 'generator': MODEL, 'style': STYLE,
               'note': 'Assets ausentes caem no desenho provisório procedural de mesmo id (index.html). O modelo não aceita seed fixa: '
                       'para manter a identidade, regenere usando o job anterior como imagem de referência.',
               'assets': manifest}, fp, ensure_ascii=False, indent=2)
print('manifest.json:', len(manifest), 'assets')
