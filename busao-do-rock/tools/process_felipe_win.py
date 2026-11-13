"""Gera assets/chars/felipe_win.webp (Felipe comemorando, sem fundo) a partir de assets/_raw/felipe_win_full.png.

Uso (na pasta busao-do-rock):  python tools/process_felipe_win.py
Requer: pip install pillow

O original é a geração do Higgsfield (gpt_image_2_5, corpo inteiro em fundo liso) já recortada pelo remove_background
do Higgsfield (PNG com alfa). Sai no MESMO canvas das lendas (1024x512, pés na borda de baixo; mesma função do
process_sprites.py), para o jogo desenhar o Felipe na mesma escala delas no palco da vitória e no cartão de fim.
"""
import os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from process_sprites import fit, QUALITY  # noqa: E402

ASSETS = os.path.join(HERE, '..', 'assets')
SRC = os.path.join(ASSETS, '_raw', 'felipe_win_full.png')
DST = os.path.join(ASSETS, 'chars', 'felipe_win.webp')


def main():
    out, s = fit(Image.open(SRC))
    out.save(DST, 'WEBP', quality=QUALITY, method=6, alpha_quality=90)
    print('chars/felipe_win.webp', out.size, round(os.path.getsize(DST) / 1024, 1), 'KB', 'escala', round(s, 3))


if __name__ == '__main__':
    main()
