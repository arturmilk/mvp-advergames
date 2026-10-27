"""Servidor de TESTE da coleta de dados (substitui o Google Apps Script em localhost).

Implementa o mesmo contrato do analytics/apps-script/Code.gs:
  POST /exec            recebe {"v":1,"events":[...]} dos jogos
  GET  /exec?action=data&token=...   devolve partidas/marcos/eventos/qr para o dashboard
  GET  /exec?action=qr_new|qr_cancel&token=...   QR codes de uso único (dashboard)
  GET  /exec?action=qr_check|qr_use&qr=...&g=...&c=...   conferir/queimar o QR (jogos)
e serve os arquivos do repositório (jogos e dashboard) na mesma porta.

    python analytics/dev_server.py            -> http://localhost:8790/
    jogo:      http://localhost:8790/?analytics=http://localhost:8790/exec
    happy hour http://localhost:8790/happy-hour/?analytics=http://localhost:8790/exec
    dashboard: http://localhost:8790/dashboard/   (endpoint http://localhost:8790/exec, token "teste")

Os dados ficam em analytics/dev_data.json (fora do git). Só stdlib.
"""
import datetime as dt
import json
import os
import re
import secrets
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'analytics', 'dev_data.json')
TOKEN = os.environ.get('DASHBOARD_TOKEN', 'teste')
GAMES = {'rover': 'Rover — A Entrega', 'happy-hour': 'Rover Happy Hour'}
COLS = {
    'Partidas': ['session_id', 'jogo', 'player_id', 'apelido', 'inicio', 'fim', 'status', 'pontos', 'duracao_s', 'nivel', 'meta',
                 'motivo_fim', 'entregas', 'combo_max', 'itens', 'erros', 'salvo_ranking', 'apelido_ranking', 'posicao_ranking',
                 'dispositivo', 'sistema', 'tela', 'idioma', 'origem', 'utm_source', 'utm_campaign', 'versao', 'atualizado'],
    'Marcos': ['event_id', 'session_id', 'jogo', 'player_id', 'tipo', 'valor', 'segundos', 'pontos', 'data'],
    'Eventos': ['event_id', 'tipo', 'jogo', 'session_id', 'player_id', 'apelido', 'data', 'detalhe'],
    'QR': ['codigo', 'jogo', 'status', 'criado', 'usado_em', 'player_id', 'acesso', 'nota'],
}
ID_RE = re.compile(r'^[a-z0-9]{8,40}$', re.I)
QR_RE = re.compile(r'^[a-p]{18}$')
lock = Lock()


def load():
    try:
        with open(DATA, encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return {'partidas': [], 'marcos': [], 'eventos': [], 'qr': [], 'seen': []}


def save(db):
    db['seen'] = db['seen'][-5000:]
    with open(DATA, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False)


def now_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z')


def num(v, lo, hi):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return 0
    return min(hi, max(lo, round(v * 10) / 10))


def txt(v, n=100):
    if v is None:
        return ''
    return re.sub(r'[\x00-\x1f]', ' ', str(v)).strip()[:n]


def upsert(db, sid, fields, only_if_new=False, only_if_playing=False):
    row = next((r for r in db['partidas'] if r['session_id'] == sid), None)
    if row is None:
        row = {c: '' for c in COLS['Partidas']}
        row['session_id'] = sid
        db['partidas'].append(row)
    if only_if_playing and row['status'] == 'finalizada':
        return
    for k, v in fields.items():
        if k not in row or (only_if_new and row[k] not in ('', None)):
            continue
        row[k] = v


def handle(db, ev):
    g = str(ev.get('g') or '')
    if g not in GAMES:
        return False
    sid = ev.get('s') if ID_RE.match(str(ev.get('s') or '')) else ''
    pid = ev.get('p') if ID_RE.match(str(ev.get('p') or '')) else ''
    d = ev.get('d') if isinstance(ev.get('d'), dict) else {}
    ts, now, t = txt(ev.get('ts'), 40) or now_iso(), now_iso(), ev.get('t')
    if t in ('visit', 'register', 'share', 'tutorial'):
        det = {k: v for k, v in list(d.items())[:12]}
        db['eventos'].append({'event_id': ev['id'], 'tipo': t, 'jogo': g, 'session_id': sid, 'player_id': pid,
                              'apelido': txt(d.get('nick'), 12), 'data': ts, 'detalhe': json.dumps(det, ensure_ascii=False)[:400]})
        return True
    if not sid:
        return False
    if t == 'start':
        upsert(db, sid, {'jogo': g, 'player_id': pid, 'apelido': txt(d.get('nick'), 12), 'inicio': ts, 'status': 'jogando',
                         'pontos': 0, 'duracao_s': 0, 'dispositivo': txt(d.get('device'), 20), 'sistema': txt(d.get('os'), 20),
                         'tela': txt(d.get('screen'), 20), 'idioma': txt(d.get('lang'), 20), 'origem': txt(d.get('ref'), 80),
                         'utm_source': txt(d.get('utm_source'), 60), 'utm_campaign': txt(d.get('utm_campaign'), 60),
                         'versao': txt(ev.get('v'), 20), 'atualizado': now}, only_if_new=True)
    elif t == 'checkpoint':
        upsert(db, sid, {'jogo': g, 'player_id': pid, 'pontos': num(d.get('score'), 0, 1e7),
                         'duracao_s': num(d.get('sec'), 0, 86400), 'atualizado': now}, only_if_playing=True)
    elif t == 'milestone':
        db['marcos'].append({'event_id': ev['id'], 'session_id': sid, 'jogo': g, 'player_id': pid,
                             'tipo': 'nivel' if d.get('kind') == 'nivel' else 'pontos', 'valor': num(d.get('value'), 0, 1e7),
                             'segundos': num(d.get('sec'), 0, 86400), 'pontos': num(d.get('score'), 0, 1e7), 'data': ts})
    elif t == 'end':
        f = {'jogo': g, 'player_id': pid, 'fim': ts, 'status': 'finalizada', 'pontos': num(d.get('score'), 0, 1e7),
             'duracao_s': num(d.get('sec'), 0, 86400), 'nivel': num(d.get('level'), 0, 1000), 'meta': txt(d.get('title'), 60),
             'motivo_fim': txt(d.get('reason'), 30), 'atualizado': now}
        for src, dst, hi in (('deliveries', 'entregas', 1e5), ('maxCombo', 'combo_max', 1e5), ('items', 'itens', 1e6), ('misses', 'erros', 1e5)):
            if d.get(src) is not None:
                f[dst] = num(d.get(src), 0, hi)
        if d.get('nick'):
            f['apelido'] = txt(d.get('nick'), 12)
        upsert(db, sid, f)
    elif t == 'save':
        upsert(db, sid, {'jogo': g, 'player_id': pid, 'salvo_ranking': 'sim', 'apelido_ranking': txt(d.get('nick'), 12),
                         'apelido': txt(d.get('nick'), 12), 'posicao_ranking': num(d.get('rank'), 0, 1e6) if d.get('rank') else '',
                         'atualizado': now})
    else:
        return False
    return True


def qr_game(db, q, use):
    code, g, acc = q.get('qr', ''), q.get('g', ''), q.get('c', '')
    acc = acc if ID_RE.match(acc) else ''
    if not QR_RE.match(code) or g not in GAMES or (use and not acc):
        return {'ok': True, 'status': 'invalido'}
    row = next((r for r in db.setdefault('qr', []) if r['codigo'] == code), None)
    if row is None or row['jogo'] != g:
        return {'ok': True, 'status': 'invalido'}
    if row['status'] == 'usado':
        return {'ok': True, 'status': 'ok' if acc and row['acesso'] == acc else 'usado'}
    if row['status'] != 'novo':
        return {'ok': True, 'status': 'cancelado'}
    if not use:
        return {'ok': True, 'status': 'novo'}
    pid = q.get('p', '')
    row.update(status='usado', usado_em=now_iso(), player_id=pid if ID_RE.match(pid) else '', acesso=acc)
    return {'ok': True, 'status': 'ok'}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if urlparse(self.path).path != '/exec':
            return self.send_error(404)
        n = int(self.headers.get('Content-Length') or 0)
        try:
            body = json.loads(self.rfile.read(min(n, 1_000_000)).decode('utf-8'))
            events = body.get('events', [])[:100]
        except (ValueError, AttributeError):
            return self.send_json({'ok': False, 'error': 'json'})
        done = 0
        with lock:
            db = load()
            for ev in events:
                if not isinstance(ev, dict) or not ID_RE.match(str(ev.get('id') or '')) or ev['id'] in db['seen']:
                    continue
                if handle(db, ev):
                    db['seen'].append(ev['id'])
                    done += 1
            save(db)
        self.send_json({'ok': True, 'n': done})

    def do_GET(self):
        u = urlparse(self.path)
        if u.path != '/exec':
            return super().do_GET()
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        act = q.get('action')
        if act == 'ping':
            return self.send_json({'ok': True, 'games': GAMES})
        if act in ('qr_check', 'qr_use'):
            with lock:
                db = load()
                res = qr_game(db, q, act == 'qr_use')
                if act == 'qr_use':
                    save(db)
            return self.send_json(res)
        if q.get('token') != TOKEN:
            return self.send_json({'ok': False, 'error': 'token'})
        if act == 'qr_new':
            g = q.get('g', '')
            if g not in GAMES:
                return self.send_json({'ok': False, 'error': 'jogo'})
            try:
                n = max(1, min(50, int(float(q.get('n') or 1))))
            except ValueError:
                n = 1
            rows = [{'codigo': ''.join(chr(97 + secrets.randbelow(16)) for _ in range(18)), 'jogo': g, 'status': 'novo',
                     'criado': now_iso(), 'usado_em': '', 'player_id': '', 'acesso': '', 'nota': txt(q.get('nota'), 80)} for _ in range(n)]
            with lock:
                db = load()
                db.setdefault('qr', []).extend(rows)
                save(db)
            return self.send_json({'ok': True, 'qr': rows})
        if act == 'qr_cancel':
            with lock:
                db = load()
                row = next((r for r in db.setdefault('qr', []) if r['codigo'] == q.get('qr')), None)
                if row is None:
                    return self.send_json({'ok': False, 'error': 'codigo'})
                if row['status'] == 'novo':
                    row['status'] = 'cancelado'
                    save(db)
            return self.send_json({'ok': True, 'status': row['status']})
        with lock:
            db = load()
        self.send_json({'ok': True, 'sheetUrl': '', 'now': now_iso(), 'games': GAMES,
                        'partidas': db['partidas'], 'marcos': db['marcos'], 'eventos': db['eventos'], 'qr': db.get('qr', [])})

    def log_message(self, fmt, *args):
        if '/exec' in (args[0] if args else ''):
            sys.stderr.write('%s\n' % (fmt % args))


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
    print(f'Servidor de teste em http://localhost:{port}/  (dashboard: /dashboard/, token "{TOKEN}")')
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
