"""Gera o QR code do jogo (qr/qr-drink-as-cegas.png e .svg) apontando para CONFIG.share.gameUrl.
Uso: python drink-as-cegas/tools/make_qr.py [url]   (requer: pip install segno)"""
import re, sys
from pathlib import Path
import segno

ROOT = Path(__file__).resolve().parent.parent
url = sys.argv[1] if len(sys.argv) > 1 else re.search(r"gameUrl:\s*'([^']+)'", (ROOT / 'config.js').read_text(encoding='utf-8')).group(1)
qr = segno.make(url, error='h')
out = ROOT / 'qr'
out.mkdir(exist_ok=True)
qr.save(out / 'qr-drink-as-cegas.png', scale=16, border=4, dark='#0C0C0D', light='#FFFFFF')
qr.save(out / 'qr-drink-as-cegas.svg', scale=10, border=4, dark='#0C0C0D', light='#FFFFFF')
print('QR para', url, '->', out)
