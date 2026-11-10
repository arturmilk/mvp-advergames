"""Servidor de TESTE da coleta de dados (substitui o Google Apps Script em localhost).

Implementa o mesmo contrato do analytics/apps-script/Code.gs:
  POST /exec            recebe {"v":1,"events":[...]} dos jogos
  GET  /exec?action=data&token=...   devolve partidas/marcos/eventos/qr para o dashboard
  GET  /exec?action=qr_new|qr_cancel&token=...   QR codes de uso único (dashboard)
  GET  /exec?action=qr_check|qr_use&qr=...&g=...&c=...   conferir/queimar o QR (jogos)
  POST /exec {"painel": "login"|"dados"|"senha"|"qr_new"|"qr_cancel"|"usuarios"|"redefinir", ...}   painel do cliente
e serve os arquivos do repositório (jogos e dashboard) na mesma porta.

    python analytics/dev_server.py            -> http://localhost:8790/
    jogo:      http://localhost:8790/?analytics=http://localhost:8790/exec
    happy hour http://localhost:8790/happy-hour/?analytics=http://localhost:8790/exec
    fuga poser http://localhost:8790/fuga-do-poser/?analytics=http://localhost:8790/exec
    busao rock http://localhost:8790/busao-do-rock/?analytics=http://localhost:8790/exec
    dashboard: http://localhost:8790/dashboard/   (endpoint http://localhost:8790/exec, token "teste")
    painel do cliente: http://localhost:8790/painel-maquina-do-mal/?api=http://localhost:8790/exec
        contas de teste (só neste servidor, voltam ao padrão quando ele reinicia):
        admin@teste / teste1234 (administrador)   cliente@teste / 123456 (pede para trocar a senha)

Os dados ficam em analytics/dev_data.json (fora do git). Só stdlib.
"""
import base64
import datetime as dt
import hashlib
import hmac
import time
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
GAMES = {'rover': 'Rover — A Entrega', 'happy-hour': 'Rover Happy Hour', 'fuga-do-poser': 'Máquina do Mal em: Fuga do Poser', 'busao-do-rock': 'Máquina do Mal em: Busão do Rock'}
COLS = {
    'Partidas': ['session_id', 'jogo', 'player_id', 'apelido', 'inicio', 'fim', 'status', 'pontos', 'duracao_s', 'nivel', 'meta',
                 'motivo_fim', 'entregas', 'combo_max', 'itens', 'erros', 'salvo_ranking', 'apelido_ranking', 'posicao_ranking',
                 'dispositivo', 'sistema', 'tela', 'idioma', 'origem', 'utm_source', 'utm_campaign', 'versao', 'atualizado', 'qr'],
    'Marcos': ['event_id', 'session_id', 'jogo', 'player_id', 'tipo', 'valor', 'segundos', 'pontos', 'data'],
    'Eventos': ['event_id', 'tipo', 'jogo', 'session_id', 'player_id', 'apelido', 'data', 'detalhe'],
    'QR': ['codigo', 'jogo', 'status', 'criado', 'usado_em', 'player_id', 'acesso', 'nota', 'partida'],
}
# igual ao QR_OBRIGATORIO do Code.gs (jogos que só abrem com QR)
QR_OBRIGATORIO = {'rover', 'happy-hour'}
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
    blocked = row.get('status') == 'bloqueada'
    for k, v in fields.items():
        if k not in row or (only_if_new and row[k] not in ('', None)):
            continue
        if blocked and k in ('status', 'salvo_ranking'):
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
    # QR de uso único (mesma regra do Code.gs): 1 QR = 1 partida, só na aba que queimou o QR
    if t == 'start':
        qr = str(d.get('qr') or '')
        use_qr = bool(QR_RE.match(qr))
        if use_qr or g in QR_OBRIGATORIO:
            ok = use_qr and qr_play(db, qr, g, str(d.get('acc') or ''), sid)
            upsert(db, sid, {'jogo': g, 'player_id': pid, 'apelido': txt(d.get('nick'), 12), 'inicio': ts,
                             'status': 'jogando' if ok else 'bloqueada', 'qr': qr if use_qr else '', 'atualizado': now})
            if not ok:
                return True
    elif t in ('checkpoint', 'end', 'save') and g in QR_OBRIGATORIO:
        row = next((r for r in db['partidas'] if r['session_id'] == sid), None)
        if not row or row.get('status') == 'bloqueada' or not QR_RE.match(str(row.get('qr') or '')):
            upsert(db, sid, {'jogo': g, 'player_id': pid, 'status': 'bloqueada', 'atualizado': now})
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


def qr_play(db, code, g, acc, sid):
    row = next((r for r in db.setdefault('qr', []) if r['codigo'] == code), None)
    if not ID_RE.match(acc) or row is None or row['jogo'] != g or row['status'] != 'usado' or row.get('acesso') != acc:
        return False
    if row.get('partida') and row['partida'] != sid:
        return False
    row['partida'] = sid
    return True


def qr_game(db, q, use):
    code, g, acc = q.get('qr', ''), q.get('g', ''), q.get('acc', q.get('c', ''))
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


# ---- painel do cliente (mesmas regras do Code.gs › PAINEL DO CLIENTE) ----
PAINEIS = {'maquina-do-mal': {'nome': 'Máquina do Mal', 'jogos': ['fuga-do-poser', 'busao-do-rock']}}
P_ITER, P_DIAS, P_TENT, P_BLOQ_MIN, P_MIN = 1000, 7, 5, 15, 8
P_SEGREDO = secrets.token_hex(32)
P_FALHAS = {}  # login -> (n, até quando)


def p_hash(senha, sal, it=P_ITER):
    x = hashlib.sha256((sal + ':' + senha).encode('utf-8')).digest()
    for _ in range(1, it):
        x = hashlib.sha256(x).digest()
    return x.hex()


def p_conta(login, senha, **opt):
    sal = secrets.token_hex(16)
    return {'nome': opt.get('nome', login), 'painel': opt['painel'], 'admin': opt.get('admin', False), 'trocar': opt.get('trocar', False),
            'ver': 1, 'iter': P_ITER, 'sal': sal, 'hash': p_hash(senha, sal), 'alterado': now_iso()}


P_USERS = {
    'admin@teste': p_conta('admin@teste', 'teste1234', nome='Admin (teste)', painel='maquina-do-mal', admin=True),
    'cliente@teste': p_conta('cliente@teste', '123456', nome='Cliente (teste)', painel='maquina-do-mal', trocar=True),
}


def p_sign(login, exp, ver):
    return hmac.new(P_SEGREDO.encode(), f'{login}|{exp}|{ver}'.encode(), hashlib.sha256).hexdigest()[:40]


def p_sessao(login, u):
    exp = int(time.time() * 1000) + P_DIAS * 86400000
    return base64.urlsafe_b64encode(login.encode()).decode() + f'.{exp}.' + p_sign(login, exp, u['ver'])


def p_conferir(sessao):
    parts = str(sessao or '').split('.')
    if len(parts) != 3:
        return None
    try:
        login, exp = base64.urlsafe_b64decode(parts[0].encode()).decode(), int(parts[1])
    except (ValueError, UnicodeDecodeError):
        return None
    u = P_USERS.get(login)
    if exp < time.time() * 1000 or not u or not hmac.compare_digest(parts[2], p_sign(login, exp, u['ver'])):
        return None
    return login, u


def p_publico(login, u):
    return {'login': login, 'nome': u['nome'], 'admin': u['admin'], 'trocar': u['trocar'], 'painel': u['painel'],
            'painelNome': PAINEIS[u['painel']]['nome']}


def p_fraca(nova):
    if len(nova) < P_MIN:
        return 'curta'
    if len(nova) > 100:
        return 'longa'
    if re.fullmatch(r'(.)\1+', nova) or (nova.isdigit() and len(nova) < 12) or re.match(r'(senha|password|12345678|qwerty)', nova, re.I):
        return 'fraca'
    return ''


def p_novo_hash(u, senha, trocar):
    u.update(sal=secrets.token_hex(16), iter=P_ITER, ver=u['ver'] + 1, trocar=trocar, alterado=now_iso())
    u['hash'] = p_hash(senha, u['sal'])


def painel(b):
    acao = str(b.get('painel') or '')
    if acao == 'login':
        login, senha = str(b.get('login') or '').strip().lower()[:80], str(b.get('senha') or '')[:200]
        n, ate = P_FALHAS.get(login, (0, 0))
        if ate < time.time():
            n = 0
        if n >= P_TENT:
            return {'ok': False, 'error': 'bloqueado', 'minutos': P_BLOQ_MIN}
        u = P_USERS.get(login)
        if not u or not hmac.compare_digest(p_hash(senha, u['sal'], u['iter']), u['hash']):
            P_FALHAS[login] = (n + 1, time.time() + P_BLOQ_MIN * 60)
            if n + 1 >= P_TENT:
                return {'ok': False, 'error': 'bloqueado', 'minutos': P_BLOQ_MIN}
            return {'ok': False, 'error': 'senha', 'restam': P_TENT - n - 1}
        P_FALHAS.pop(login, None)
        return {'ok': True, 'sessao': p_sessao(login, u), 'usuario': p_publico(login, u)}
    s = p_conferir(b.get('sessao'))
    if not s:
        return {'ok': False, 'error': 'sessao'}
    login, u = s
    jogos = PAINEIS[u['painel']]['jogos']
    if acao == 'dados':
        with lock:
            db = load()
        ok = {g: GAMES[g] for g in jogos if g in GAMES}
        qr = [{k: v for k, v in r.items() if k != 'acesso'} for r in db.get('qr', []) if r['jogo'] in ok]
        return {'ok': True, 'now': now_iso(), 'games': ok, 'usuario': p_publico(login, u),
                'partidas': [r for r in db['partidas'] if r['jogo'] in ok], 'marcos': [r for r in db['marcos'] if r['jogo'] in ok],
                'eventos': [r for r in db['eventos'] if r['jogo'] in ok], 'qr': qr}
    if acao == 'senha':
        atual, nova = str(b.get('atual') or ''), str(b.get('nova') or '')
        if not hmac.compare_digest(p_hash(atual, u['sal'], u['iter']), u['hash']):
            return {'ok': False, 'error': 'atual'}
        if atual == nova:
            return {'ok': False, 'error': 'igual'}
        e = p_fraca(nova)
        if e:
            return {'ok': False, 'error': e}
        p_novo_hash(u, nova, False)
        return {'ok': True, 'sessao': p_sessao(login, u), 'usuario': p_publico(login, u)}
    if acao == 'qr_new':
        if b.get('g') not in jogos:
            return {'ok': False, 'error': 'jogo'}
        return qr_new({'g': b.get('g'), 'n': b.get('n'), 'nota': b.get('nota')})
    if acao == 'qr_cancel':
        with lock:
            db = load()
        row = next((r for r in db.get('qr', []) if r['codigo'] == b.get('qr')), None)
        if row is None or row['jogo'] not in jogos:
            return {'ok': False, 'error': 'codigo'}
        return qr_cancel({'qr': b.get('qr')})
    if acao in ('usuarios', 'redefinir'):
        if not u['admin']:
            return {'ok': False, 'error': 'admin'}
        if acao == 'usuarios':
            return {'ok': True, 'usuarios': [{'login': k, 'nome': v['nome'], 'admin': v['admin'], 'trocar': v['trocar'], 'alterado': v['alterado']}
                                             for k, v in P_USERS.items() if v['painel'] == u['painel']]}
        alvo = str(b.get('alvo') or '').strip().lower()
        t = P_USERS.get(alvo)
        if not t or t['painel'] != u['painel'] or alvo == login:
            return {'ok': False, 'error': 'alvo'}
        senha = ''.join(secrets.choice('abcdefghjkmnpqrstuvwxyz23456789') for _ in range(10))
        p_novo_hash(t, senha, True)
        P_FALHAS.pop(alvo, None)
        return {'ok': True, 'login': alvo, 'senha': senha}
    return {'ok': False, 'error': 'acao'}


def qr_new(q):
    g = q.get('g', '')
    if g not in GAMES:
        return {'ok': False, 'error': 'jogo'}
    try:
        n = max(1, min(50, int(float(q.get('n') or 1))))
    except (TypeError, ValueError):
        n = 1
    rows = [{'codigo': ''.join(chr(97 + secrets.randbelow(16)) for _ in range(18)), 'jogo': g, 'status': 'novo',
             'criado': now_iso(), 'usado_em': '', 'player_id': '', 'acesso': '', 'nota': txt(q.get('nota'), 80)} for _ in range(n)]
    with lock:
        db = load()
        db.setdefault('qr', []).extend(rows)
        save(db)
    return {'ok': True, 'qr': rows}


def qr_cancel(q):
    with lock:
        db = load()
        row = next((r for r in db.setdefault('qr', []) if r['codigo'] == q.get('qr')), None)
        if row is None:
            return {'ok': False, 'error': 'codigo'}
        if row['status'] == 'novo':
            row['status'] = 'cancelado'
            save(db)
    return {'ok': True, 'status': row['status']}


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
            if isinstance(body, dict) and body.get('painel'):
                return self.send_json(painel(body))
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
            return self.send_json(qr_new(q))
        if act == 'qr_cancel':
            return self.send_json(qr_cancel(q))
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
    print(f'Painel do cliente: http://localhost:{port}/painel-maquina-do-mal/?api=http://localhost:{port}/exec  (admin@teste / teste1234, cliente@teste / 123456)')
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
