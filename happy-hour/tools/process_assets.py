"""
Pós-processamento dos assets gerados no Higgsfield -> sprites do jogo + assets/manifest.json

Entrada: assets/_raw/*.png (imagens originais do Higgsfield, PNG com fundo transparente)
Saída:   assets/*.png (sprites recortados, redimensionados) + assets/manifest.json

Passos: limpa o halo semitransparente que o modelo deixa em volta dos objetos -> fatia as folhas
pelas colunas vazias -> recorta cada quadro -> redimensiona -> grava o manifest.

Uso:  python tools/process_assets.py      (requer: pip install pillow numpy)
"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'assets', '_raw')
OUT = os.path.join(ROOT, 'assets')

MODEL = 'gpt_image_2_5 (Higgsfield), quality=high, resolution=1k, background=transparent'
STYLE = ('Modern cartoon mobile game art, vibrant saturated colors, smooth rounded shapes, soft flat shading with subtle '
         'soft shadow, thin dark-brown outline (2px max), no pixel art, no text, no logos. Fully transparent background.')

SOURCES = {  # arquivo bruto -> job do Higgsfield + prompt (para regenerar)
    # v2 (adulto). Gerado com a v1 (job 0ae443cc-5935-415f-af8f-d3eb1aa9b0ef, arquivo dheep_sheet_v1_kid.png, que parecia
    # uma criança) como imagem de referência; depois passou pelo remove_background (job b063fd54-8d1d-43cd-9fe8-ab9fb32c7468).
    'dheep_sheet_rembg.png': ('36d760ce-3552-435a-8e05-0f002dda3016', '21:9',
        'Redraw this character sprite sheet as a clearly ADULT man, about 25-28 years old: defined jawline, light stubble beard, '
        'adult proportions (about 4.5 heads tall, broad shoulders, slightly chubby friendly build), NOT a child. 5 full-body poses in one '
        'horizontal row, same scale, feet on the same baseline. Short dark wavy hair, big expressive happy eyes, wide smile, bright purple t-shirt, teal knee-length shorts, '
        'white casual sneakers, small orange wristband. Poses: 1) idle, hands on belly, mouth open ready to eat; 2) stepping LEFT; '
        '3) stepping RIGHT; 4) happy eating, cheeks full, arms up celebrating; 5) defeated, stuffed and dizzy, hands on round belly, swirly eyes.'),
    'food_sheet.png': ('8ae188ac-d922-4c54-a189-dc8b983b9bd6', '21:9',
        '4 separate food and drink items in one horizontal row: 1) Brazilian frango a passarinho (crispy fried chicken bites), '
        'orange-red golden crust, garlic bits; 2) bunch of golden french fries, no container; 3) amber glass beer bottle with white '
        'foam on top, NO label, generic; 4) pile of round sliced calabresa sausage, dark red, grilled, onion rings. No plates.'),
    'bg_bar.png': ('6d59a74a-1780-4358-99a3-08d9611ce507', '9:16',
        'Vertical mobile game background, interior of a cheerful Brazilian boteco at night during happy hour. Neon tubes in orange, '
        'purple and blue (star, wave, beer mug outline, NO letters), string lights, pendant lamps, tables, wooden chairs, blurred '
        'friends toasting. Center uncluttered. Bottom 25% simple warm empty wall. No text, no logos, no brands. (opaque)'),
    'bar_counter.png': ('9a3da1ad-bfe4-4cf0-9df8-16f7071ca492', '21:9',
        'Long wooden bar counter, front view, back shelf with rows of generic glass bottles (amber, green, clear, NO labels), '
        'glasses and mugs, a small potted plant. Spans the full width. No text, no logos, no brands.'),
    'floor.png': ('cc31a187-4a77-4984-9e42-15184a020024', '21:9',
        'Seamless horizontal tileable floor texture for a cartoon bar: terracotta and cream checkered ceramic tiles, soft shading, '
        'thin dark wooden baseboard strip along the top edge. (opaque)'),
    'ui_sheet.png': ('d83b466d-5e34-4ee3-b60a-a43d30153a58', '21:9',
        '6 UI icons in one row: glossy round orange-red button with white LEFT arrow; same with RIGHT arrow; cartoon fire flame '
        '(combo); stopwatch/timer in amber and white; shiny golden star with sparkles; red cartoon heart. No text, no numbers.'),
    'logo_r.png': ('409b75ad-d17c-462c-9ce4-25a496c31bfb', '1:1',
        'Cartoon emblem: single bold stylized capital letter R built from three thick smooth curved ribbon stripes in red #E30613, '
        'orange #FF6A13 and yellow #FFD21F, rounded ends, glossy, bubbly. Just the R symbol, no words.'),
    'fx_sheet.png': ('a3811b0f-61ef-4eae-bf8f-d9715f879aab', '21:9',
        '4 game VFX in one row: burst of colorful confetti and streamers; bright white-golden sparkle burst; soft puff of grey-white '
        'cartoon smoke; golden ring of small stars.'),
    'title_banner.png': ('bde67c0c-39cb-49ce-bba7-1d0e43ccc0f7', '16:9',
        'Happy hour title banner illustration (NO text): two frosty generic beer mugs clinking with splashing droplets, basket of '
        'french fries, fried chicken bites and sliced grilled sausage, little stars, blank curved ribbon banner in red-orange-yellow.'),
}

manifest = []


def load(name):
    return Image.open(os.path.join(RAW, name)).convert('RGBA')


def clean_alpha(im, lo=70, hi=150):
    """Remove o brilho semitransparente em volta dos objetos e firma a borda (mantém antisserrilhado)."""
    a = np.array(im)
    al = a[:, :, 3].astype(np.float32)
    al = np.clip((al - lo) / (hi - lo), 0, 1) * 255
    a[:, :, 3] = al.astype(np.uint8)
    a[a[:, :, 3] == 0, :3] = 0
    return Image.fromarray(a)


def soft_alpha(im, lo=25, gamma=1.6):
    """Para efeitos (brilho/fumaça): mantém a transparência suave, só tira o véu mais fraco."""
    a = np.array(im)
    al = a[:, :, 3].astype(np.float32) / 255
    al = np.clip((al - lo / 255) / (1 - lo / 255), 0, 1) ** gamma
    a[:, :, 3] = (al * 255).astype(np.uint8)
    return Image.fromarray(a)


def slice_frames(im, count, min_gap=6):
    """Divide a folha em `count` quadros usando colunas vazias; une os pedaços soltos mais próximos."""
    al = np.array(im)[:, :, 3]
    filled = (al > 8).sum(axis=0) > 0
    runs, start = [], None
    for x, f in enumerate(list(filled) + [False]):
        if f and start is None: start = x
        if not f and start is not None: runs.append([start, x]); start = None
    # junta runs separados por menos de min_gap
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < min_gap: merged[-1][1] = r[1]
        else: merged.append(r)
    runs = merged
    while len(runs) > count:  # une o menor pedaço ao vizinho mais próximo
        i = min(range(len(runs)), key=lambda k: runs[k][1] - runs[k][0])
        if i == 0: j = 1
        elif i == len(runs) - 1: j = i - 1
        else: j = i - 1 if runs[i][0] - runs[i - 1][1] < runs[i + 1][0] - runs[i][1] else i + 1
        a, b = sorted((i, j)); runs[a] = [runs[a][0], runs[b][1]]; del runs[b]
    cover = (al > 8).sum(axis=0)
    while len(runs) < count:  # quadros encostados (ex.: pés da corrida): corta o mais largo na coluna mais vazia do meio
        i = max(range(len(runs)), key=lambda k: runs[k][1] - runs[k][0])
        x0, x1 = runs[i]; a0, a1 = x0 + (x1 - x0) * 3 // 10, x0 + (x1 - x0) * 7 // 10
        cut = a0 + int(np.argmin(cover[a0:a1]))
        runs[i:i + 1] = [[x0, cut], [cut, x1]]
    assert len(runs) == count, f'esperava {count} quadros, achei {len(runs)}'
    frames = []
    for x0, x1 in runs:
        part = im.crop((x0, 0, x1, im.height))
        bb = part.getbbox()
        frames.append(part.crop(bb))
    return frames


def fit(im, max_w=None, max_h=None):
    s = 1.0
    if max_w: s = min(s, max_w / im.width)
    if max_h: s = min(s, max_h / im.height)
    if s < 1: im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    return im


def save(im, name, aid, usage, src, **extra):
    path = os.path.join(OUT, name)
    if im.mode == 'RGB': im.save(path, optimize=True)
    else: im.save(path, optimize=True)
    job, ar, prompt = SOURCES[src]
    entry = {'id': aid, 'file': name, 'w': im.width, 'h': im.height, 'frames': 1, 'usage': usage,
             'source': 'assets/_raw/' + src, 'higgsfieldJob': job, 'aspect': ar, 'prompt': prompt}
    entry.update(extra)
    manifest.append(entry)
    print(f'{name:22s} {im.width}x{im.height}  {os.path.getsize(path) // 1024} KB')


# ---- Dheep: 5 quadros numa tira, células iguais, alinhados pelos pés ----
# mesma escala para todos os quadros: usa a escala do mais alto
raw = slice_frames(clean_alpha(load('dheep_sheet_rembg.png')), 5)
s = 300 / max(f.height for f in raw)
frames = [f.resize((round(f.width * s), round(f.height * s)), Image.LANCZOS) for f in raw]
cw, ch = max(f.width for f in frames) + 8, max(f.height for f in frames) + 4
strip = Image.new('RGBA', (cw * 5, ch), (0, 0, 0, 0))
for i, f in enumerate(frames):
    strip.paste(f, (i * cw + (cw - f.width) // 2, ch - f.height - 2), f)
save(strip, 'dheep.png', 'dheep', 'Personagem jogável (Dheep). Quadros: parado, esquerda, direita, comendo/feliz, derrota. Ancorado pelos pés.',
     'dheep_sheet_rembg.png', frames=5, frameW=cw, frameH=ch, frameNames=['idle', 'left', 'right', 'eat', 'defeat'], anchor='bottom-center')

# ---- Comidas ----
foods = slice_frames(clean_alpha(load('food_sheet.png')), 4)
for f, (aid, use) in zip(foods, [('frango', 'Item que cai: frango a passarinho (+10)'), ('batata', 'Item que cai: batata frita (+15)'),
                                 ('cerveja', 'Item que cai: cerveja (+25, rara)'), ('calabresa', 'Item que cai: calabresa (+35, muito rara)')]):
    save(fit(f, 200, 200), aid + '.png', aid, use, 'food_sheet.png')

# ---- UI ----
ui = slice_frames(clean_alpha(load('ui_sheet.png')), 6)
for f, (aid, size, use) in zip(ui, [('ui_left', 192, 'Botão seta esquerda (toque)'), ('ui_right', 192, 'Botão seta direita (toque)'),
                                    ('ui_combo', 128, 'Ícone de combo (HUD)'), ('ui_timer', 128, 'Ícone de tempo (HUD)'),
                                    ('ui_star', 128, 'Ícone de nível / estrela'), ('ui_heart', 96, 'Ícone de fome (5 vidas) no HUD')]):
    save(fit(f, size, size), aid + '.png', aid, use, 'ui_sheet.png')

# ---- Efeitos (transparência suave) ----
fxs = clean_alpha(load('fx_sheet.png'), lo=40, hi=120)
for f, (aid, use) in zip(slice_frames(fxs, 4), [('fx_confetti', 'Efeito: confete ao pegar item raro'), ('fx_sparkle', 'Efeito: brilho ao pegar item'),
                                                 ('fx_smoke', 'Efeito: fumaça ao deixar um item cair'), ('fx_stars', 'Efeito: anel de estrelas (item raro)')]):
    save(fit(f, 220, 220), aid + '.png', aid, use, 'fx_sheet.png')

# ---- Logo, banner, cenário ----
logo = clean_alpha(load('logo_r.png')); logo = logo.crop(logo.getbbox())
save(fit(logo, 256, 256), 'logo_r.png', 'logo_r', 'Símbolo "R" cartoon (releitura, não é o arquivo oficial). Splash, título, favicon.', 'logo_r.png')
ban = clean_alpha(load('title_banner.png')); ban = ban.crop(ban.getbbox())
save(fit(ban, 720), 'title_banner.png', 'title_banner', 'Ilustração da tela de título (canecas brindando + petiscos).', 'title_banner.png')
ctr = clean_alpha(load('bar_counter.png')); ctr = ctr.crop(ctr.getbbox())
save(fit(ctr, 1080), 'bar_counter.png', 'bar_counter', 'Parallax camada 2: balcão com garrafas sem rótulo (move 10% do deslocamento do Dheep).', 'bar_counter.png')
bg = load('bg_bar.png').convert('RGB')
save(fit(bg, 600), 'bg_bar.png', 'bg_bar', 'Parallax camada 1: salão do bar com neon (move 4% do deslocamento do Dheep).', 'bg_bar.png')
fl = load('floor.png').convert('RGB')
save(fit(fl, 1080), 'floor.png', 'floor', 'Piso de ladrilhos (faixa inferior de ~100 px onde o Dheep fica).', 'floor.png')

# ---- Ícones do PWA ----
for size in (192, 512):
    icon = Image.new('RGBA', (size, size), (255, 214, 160, 255))
    d = np.array(icon); yy, xx = np.mgrid[:size, :size]
    r = np.hypot(xx - size / 2, yy - size * .42) / size
    d[:, :, 0] = np.clip(255 - r * 40, 0, 255); d[:, :, 1] = np.clip(225 - r * 120, 0, 255); d[:, :, 2] = np.clip(170 - r * 160, 0, 255)
    icon = Image.fromarray(d)
    lg = fit(logo, int(size * .72), int(size * .72))
    icon.paste(lg, ((size - lg.width) // 2, (size - lg.height) // 2), lg)
    icon.save(os.path.join(OUT, f'icon-{size}.png'), optimize=True)

with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as fp:
    json.dump({'version': 1, 'generator': MODEL, 'style': STYLE,
               'note': 'Assets ausentes caem no placeholder procedural de mesmo id (index.html). Seed fixa não é suportada pelo modelo; '
                       'para manter a identidade, regenere usando o job anterior como imagem de referência.',
               'assets': manifest}, fp, ensure_ascii=False, indent=2)
print('manifest.json:', len(manifest), 'assets')
