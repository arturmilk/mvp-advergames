/**
 * ROVER — COLETA DE DADOS DOS JOGOS (Google Apps Script)
 *
 * Recebe os eventos de "Rover — A Entrega", "Rover Happy Hour" e "Máquina do Mal em: Fuga do Poser" e grava nesta planilha:
 *   Partidas  1 linha por partida (início, fim, pontos, duração, nível, motivo do fim, aparelho...)
 *   Marcos    quando cada partida alcançou cada pontuação/nível (tempo de jogo em segundos)
 *   Eventos   visitas, cadastros, compartilhamentos
 *   Ranking / Resumo / Tempo até pontuação   abas com fórmulas que se atualizam sozinhas
 *   QR        QR codes de uso único gerados no dashboard (novo → usado no primeiro toque do jogo)
 *
 * O dashboard (dashboard/index.html) lê os dados por GET com o token secreto.
 * Painéis de cliente (ex.: painel-maquina-do-mal/) entram com usuário e senha (POST) e só recebem os jogos do cliente (PAINEIS).
 * Instalação passo a passo: analytics/README.md
 */

// Todos os jogos conhecidos. Uma planilha pode guardar só alguns: Propriedades do script › JOGOS = ids separados por vírgula
// (ex.: "fuga-do-poser,busao-do-rock" na planilha da Máquina do Mal). Sem JOGOS = todos. Ids fora da lista são descartados.
var GAMES = jogosDestaPlanilha_({ 'rover': 'Rover — A Entrega', 'happy-hour': 'Rover Happy Hour', 'fuga-do-poser': 'Máquina do Mal em: Fuga do Poser', 'busao-do-rock': 'Máquina do Mal em: Busão do Rock' });
function jogosDestaPlanilha_(todos) {
  var p = '';
  try { p = PropertiesService.getScriptProperties().getProperty('JOGOS') || ''; } catch (e) {}
  var ids = p.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return todos[x]; });
  if (!ids.length) return todos;
  var out = {}; ids.forEach(function (x) { out[x] = todos[x]; });
  return out;
}
var COLS = {
  Partidas: ['session_id', 'jogo', 'player_id', 'apelido', 'inicio', 'fim', 'status', 'pontos', 'duracao_s', 'nivel', 'meta',
    'motivo_fim', 'entregas', 'combo_max', 'itens', 'erros', 'salvo_ranking', 'apelido_ranking', 'posicao_ranking',
    'dispositivo', 'sistema', 'tela', 'idioma', 'origem', 'utm_source', 'utm_campaign', 'versao', 'atualizado', 'qr'],
  Marcos: ['event_id', 'session_id', 'jogo', 'player_id', 'tipo', 'valor', 'segundos', 'pontos', 'data'],
  Eventos: ['event_id', 'tipo', 'jogo', 'session_id', 'player_id', 'apelido', 'data', 'detalhe'],
  QR: ['codigo', 'jogo', 'status', 'criado', 'usado_em', 'player_id', 'acesso', 'nota', 'partida']
};
// Jogos que SÓ abrem com QR code (deixe igual ao ticket.required do config.js de cada jogo).
// Nesses jogos, partida que chega sem um QR válido é gravada como "bloqueada" e não entra no ranking nem no dashboard.
// Em qualquer jogo, um QR vale UMA partida: a 2ª partida com o mesmo QR também vira "bloqueada".
var QR_OBRIGATORIO = { 'rover': true, 'happy-hour': true };
var SIMPLE_EVENTS = ['visit', 'register', 'share', 'tutorial'];

/* ======================= INSTALAÇÃO ======================= */
// Rode UMA vez pelo editor (menu Executar > setup). Cria as abas e o token do dashboard.
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(COLS).forEach(function (name) { sheet_(ss, name); });
  formulas_(ss);
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('DASHBOARD_TOKEN')) props.setProperty('DASHBOARD_TOKEN', Utilities.getUuid().replace(/-/g, ''));
  var def = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
  Logger.log('Token do dashboard: ' + props.getProperty('DASHBOARD_TOKEN'));
}
// Para trocar o token (ex.: alguém que não devia ficou sabendo). Rode e use o novo no dashboard.
function novoToken() {
  var t = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('DASHBOARD_TOKEN', t);
  Logger.log('Novo token do dashboard: ' + t);
}

function sheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, COLS[name].length).setValues([COLS[name]]).setFontWeight('bold').setBackground('#2B2B2B').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  } else if (sh.getLastColumn() < COLS[name].length) {
    // coluna nova numa aba antiga (ex.: Partidas.qr, QR.partida): escreve só o cabeçalho que falta
    var n0 = sh.getLastColumn(), extra = COLS[name].slice(n0);
    sh.getRange(1, n0 + 1, 1, extra.length).setValues([extra]).setFontWeight('bold').setBackground('#2B2B2B').setFontColor('#FFFFFF');
  }
  return sh;
}

// Abas de leitura com fórmulas (setFormula usa sempre a sintaxe em inglês, com vírgulas).
function formulas_(ss) {
  var rk = ss.getSheetByName('Ranking') || ss.insertSheet('Ranking');
  rk.clear();
  rk.getRange('A1').setFormula('=QUERY(Partidas!A:AC, "select B, D, max(H), count(A), sum(I) where H is not null and D <> \'\' and G <> \'bloqueada\' ' +
    'group by B, D order by max(H) desc label B \'jogo\', D \'apelido\', max(H) \'melhor_pontuacao\', count(A) \'partidas\', sum(I) \'tempo_total_s\'", 1)');

  var rs = ss.getSheetByName('Resumo') || ss.insertSheet('Resumo');
  rs.clear();
  var head = ['jogo', 'partidas', 'jogadores_unicos', 'tempo_total_h', 'duracao_media_s', 'pontuacao_media', 'melhor_pontuacao', 'visitas', 'salvas_no_ranking'];
  rs.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  Object.keys(GAMES).forEach(function (g, i) {
    var r = i + 2, k = '"' + g + '"';
    rs.getRange(r, 1, 1, head.length).setFormulas([[
      '="' + g + '"',
      '=COUNTIF(Partidas!B2:B, ' + k + ')',
      '=IFERROR(COUNTUNIQUE(FILTER(Partidas!C2:C, Partidas!B2:B=' + k + ')), 0)',
      '=ROUND(SUMIF(Partidas!B2:B, ' + k + ', Partidas!I2:I)/3600, 2)',
      '=IFERROR(ROUND(AVERAGEIF(Partidas!B2:B, ' + k + ', Partidas!I2:I), 1), 0)',
      '=IFERROR(ROUND(AVERAGEIF(Partidas!B2:B, ' + k + ', Partidas!H2:H), 0), 0)',
      '=IFERROR(MAXIFS(Partidas!H2:H, Partidas!B2:B, ' + k + ', Partidas!G2:G, "<>bloqueada"), 0)',
      '=COUNTIFS(Eventos!B2:B, "visit", Eventos!C2:C, ' + k + ')',
      '=COUNTIFS(Partidas!B2:B, ' + k + ', Partidas!Q2:Q, "sim", Partidas!G2:G, "<>bloqueada")'
    ]]);
  });

  var tm = ss.getSheetByName('Tempo até pontuação') || ss.insertSheet('Tempo até pontuação');
  tm.clear();
  tm.getRange('A1').setFormula('=QUERY(Marcos!A:I, "select C, F, count(B), avg(G), min(G), max(G) where E = \'pontos\' group by C, F order by C, F ' +
    'label C \'jogo\', F \'pontuacao\', count(B) \'partidas_que_alcancaram\', avg(G) \'tempo_medio_s\', min(G) \'mais_rapido_s\', max(G) \'mais_lento_s\'", 1)');
}

/* ======================= RECEBER EVENTOS (jogos) ======================= */
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'json' }); }
  if (body && body.painel) return json_(painel_(body)); // painel do cliente (login com usuário e senha)
  var events = (body && Array.isArray(body.events)) ? body.events.slice(0, 100) : [];
  if (!events.length) return json_({ ok: true, n: 0 });

  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) { return json_({ ok: false, error: 'busy' }); }
  var n = 0;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet(), cache = CacheService.getScriptCache();
    var ctx = { ss: ss, sh: {}, rows: {}, append: { Marcos: [], Eventos: [] } };
    events.forEach(function (ev) {
      try {
        if (!ev || typeof ev.id !== 'string' || !/^[a-z0-9]{8,40}$/i.test(ev.id)) return;
        if (cache.get('ev_' + ev.id)) return; // repetido (reenvio da fila)
        if (handle_(ctx, ev)) { cache.put('ev_' + ev.id, '1', 21600); n++; }
      } catch (err) { console.error(err); }
    });
    ['Marcos', 'Eventos'].forEach(function (name) {
      var rows = ctx.append[name];
      if (rows.length) { var sh = get_(ctx, name); sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows); }
    });
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  return json_({ ok: true, n: n });
}

function handle_(ctx, ev) {
  var g = String(ev.g || '');
  if (!GAMES[g]) return false;
  var sid = /^[a-z0-9]{8,40}$/i.test(ev.s || '') ? ev.s : '';
  var pid = /^[a-z0-9]{8,40}$/i.test(ev.p || '') ? ev.p : '';
  var d = (ev.d && typeof ev.d === 'object') ? ev.d : {};
  var ts = date_(ev.ts), now = new Date();

  if (SIMPLE_EVENTS.indexOf(ev.t) >= 0) {
    var det = {}; Object.keys(d).slice(0, 12).forEach(function (k) { if (k !== 'whatsapp') det[k] = d[k]; });
    var row = [ev.id, ev.t, g, sid, pid, txt_(d.nick, 12), ts, txt_(JSON.stringify(det), 400)];
    ctx.append.Eventos.push(row);
    if (ev.t === 'register' && d.whatsapp) row[7] = txt_(JSON.stringify(Object.assign(det, { whatsapp: String(d.whatsapp).replace(/\D/g, '').slice(0, 13) })), 400);
    return true;
  }
  if (!sid) return false;

  // QR de uso único: a partida só vale se o QR foi queimado por esta mesma aba e ainda não tem outra partida
  if (ev.t === 'start') {
    var qr = String(d.qr || ''), useQr = QR_RE.test(qr);
    if (useQr || QR_OBRIGATORIO[g]) {
      var okQr = useQr && qrPlay_(ctx, qr, g, String(d.acc || ''), sid);
      upsert_(ctx, sid, { jogo: g, player_id: pid, apelido: txt_(d.nick, 12), inicio: ts, status: okQr ? 'jogando' : 'bloqueada', qr: useQr ? qr : '', atualizado: now });
      if (!okQr) return true;
    }
  } else if (['checkpoint', 'end', 'save'].indexOf(ev.t) >= 0 && QR_OBRIGATORIO[g] && !qrRowOk_(ctx, sid)) {
    upsert_(ctx, sid, { jogo: g, player_id: pid, status: 'bloqueada', atualizado: now }); // fim sem início válido (enviado à mão)
  }

  switch (ev.t) {
    case 'start':
      upsert_(ctx, sid, {
        jogo: g, player_id: pid, apelido: txt_(d.nick, 12), inicio: ts, status: 'jogando', pontos: 0, duracao_s: 0,
        dispositivo: txt_(d.device, 20), sistema: txt_(d.os, 20), tela: txt_(d.screen, 20), idioma: txt_(d.lang, 20),
        origem: txt_(d.ref, 80), utm_source: txt_(d.utm_source, 60), utm_campaign: txt_(d.utm_campaign, 60), versao: txt_(ev.v, 20), atualizado: now
      }, true);
      return true;
    case 'checkpoint':
      upsert_(ctx, sid, { jogo: g, player_id: pid, pontos: num_(d.score, 0, 1e7), duracao_s: num_(d.sec, 0, 86400), atualizado: now }, false, true);
      return true;
    case 'milestone':
      ctx.append.Marcos.push([ev.id, sid, g, pid, d.kind === 'nivel' ? 'nivel' : 'pontos', num_(d.value, 0, 1e7), num_(d.sec, 0, 86400), num_(d.score, 0, 1e7), ts]);
      return true;
    case 'end':
      var f = {
        jogo: g, player_id: pid, fim: ts, status: 'finalizada', pontos: num_(d.score, 0, 1e7), duracao_s: num_(d.sec, 0, 86400),
        nivel: num_(d.level, 0, 1000), meta: txt_(d.title, 60), motivo_fim: txt_(d.reason, 30), atualizado: now
      };
      if (d.deliveries != null) f.entregas = num_(d.deliveries, 0, 1e5);
      if (d.maxCombo != null) f.combo_max = num_(d.maxCombo, 0, 1e5);
      if (d.items != null) f.itens = num_(d.items, 0, 1e6);
      if (d.misses != null) f.erros = num_(d.misses, 0, 1e5);
      if (d.nick) f.apelido = txt_(d.nick, 12);
      upsert_(ctx, sid, f);
      return true;
    case 'save':
      upsert_(ctx, sid, { jogo: g, player_id: pid, salvo_ranking: 'sim', apelido_ranking: txt_(d.nick, 12), apelido: txt_(d.nick, 12),
        posicao_ranking: d.rank ? num_(d.rank, 0, 1e6) : '', atualizado: now });
      return true;
  }
  return false;
}

// Atualiza (ou cria) a linha da partida. onlyIfNew: não sobrescreve campos já preenchidos (start que chega atrasado).
function upsert_(ctx, sid, fields, onlyIfNew, onlyIfPlaying) {
  var sh = get_(ctx, 'Partidas'), cols = COLS.Partidas, r = ctx.rows[sid];
  if (!r) {
    var hit = sh.getRange('A:A').createTextFinder(sid).matchEntireCell(true).findNext();
    r = hit ? hit.getRow() : 0;
  }
  var row;
  if (r) row = sh.getRange(r, 1, 1, cols.length).getValues()[0];
  else { row = cols.map(function () { return ''; }); row[0] = sid; r = sh.getLastRow() + 1; }
  if (onlyIfPlaying && row[cols.indexOf('status')] === 'finalizada') { ctx.rows[sid] = r; return; }
  var blocked = row[cols.indexOf('status')] === 'bloqueada';
  Object.keys(fields).forEach(function (k) {
    var i = cols.indexOf(k); if (i < 0) return;
    if (blocked && (k === 'status' || k === 'salvo_ranking')) return; // partida bloqueada (QR) continua bloqueada
    if (onlyIfNew && row[i] !== '' && row[i] != null) return; // o start atrasado não apaga pontos/status já gravados
    row[i] = fields[k];
  });
  sh.getRange(r, 1, 1, cols.length).setValues([row]);
  ctx.rows[sid] = r;
}

function get_(ctx, name) { return ctx.sh[name] || (ctx.sh[name] = sheet_(ctx.ss, name)); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function num_(v, lo, hi) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v * 10) / 10)) : 0; }
// texto curto e sem fórmula (=, +, -, @ no começo viram texto)
function txt_(v, max) {
  if (v == null) return '';
  var s = String(v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 100);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function date_(v) {
  var d = new Date(v), now = new Date();
  if (isNaN(d.getTime()) || d > new Date(now.getTime() + 864e5) || d < new Date(2024, 0, 1)) return now;
  return d;
}

/* ======================= LER DADOS (dashboard) ======================= */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'ping') return json_({ ok: true, games: GAMES });
  if (p.action === 'qr_check' || p.action === 'qr_use') return json_(qrGame_(p, p.action === 'qr_use'));
  var token = PropertiesService.getScriptProperties().getProperty('DASHBOARD_TOKEN');
  if (!token || p.token !== token) return json_({ ok: false, error: 'token' });
  if (p.action === 'qr_new') return json_(qrNew_(p));
  if (p.action === 'qr_cancel') return json_(qrCancel_(p));
  var ss = SpreadsheetApp.getActiveSpreadsheet(), out = { ok: true, sheetUrl: ss.getUrl(), now: new Date().toISOString(), games: GAMES };
  Object.keys(COLS).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    out[name.toLowerCase()] = sh ? rows_(sh, COLS[name]) : [];
  });
  return json_(out);
}
function rows_(sh, cols) {
  var n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, cols.length).getValues().map(function (r) {
    var o = {};
    cols.forEach(function (c, i) { o[c] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
}

/* ======================= QR CODE DE USO ÚNICO ======================= */
// O dashboard gera (qr_new, com o token). O jogo confere ao abrir (qr_check) e queima no primeiro toque (qr_use).
// "acesso" = id aleatório da aba que queimou o código: a mesma aba pode recarregar; qualquer outra vê "usado".
var QR_RE = /^[a-p]{18}$/;
function qrCode_() {
  // 18 letras a–p (4 bits cada, 72 bits) tiradas de UUIDs aleatórios, sem os dígitos fixos de versão/variante
  var h = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''), out = '';
  for (var i = 0; i < h.length && out.length < 18; i++) if (i !== 12 && i !== 16 && i !== 44 && i !== 48) out += String.fromCharCode(97 + parseInt(h[i], 16));
  return out;
}
function qrFind_(sh, code) {
  var hit = sh.getRange('A:A').createTextFinder(code).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}
function qrNew_(p) {
  var g = String(p.g || '');
  if (!GAMES[g]) return { ok: false, error: 'jogo' };
  var n = Math.max(1, Math.min(50, Math.round(Number(p.n) || 1))), nota = txt_(p.nota, 80), now = new Date();
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return { ok: false, error: 'busy' }; }
  try {
    var sh = sheet_(SpreadsheetApp.getActiveSpreadsheet(), 'QR'), rows = [];
    for (var i = 0; i < n; i++) rows.push([qrCode_(), g, 'novo', now, '', '', '', nota]);
    sh.getRange(sh.getLastRow() + 1, 1, n, rows[0].length).setValues(rows);
    SpreadsheetApp.flush();
    return { ok: true, qr: rows.map(function (r) { return { codigo: r[0], jogo: g, status: 'novo', criado: now.toISOString(), nota: nota }; }) };
  } finally { lock.releaseLock(); }
}
function qrCancel_(p) {
  var code = String(p.qr || '');
  if (!QR_RE.test(code)) return { ok: false, error: 'codigo' };
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return { ok: false, error: 'busy' }; }
  try {
    var sh = sheet_(SpreadsheetApp.getActiveSpreadsheet(), 'QR'), r = qrFind_(sh, code);
    if (!r) return { ok: false, error: 'codigo' };
    var st = sh.getRange(r, 3).getValue();
    if (st === 'novo') sh.getRange(r, 3).setValue('cancelado');
    return { ok: true, status: st === 'novo' ? 'cancelado' : st };
  } finally { lock.releaseLock(); }
}
// status devolvido ao jogo: novo | ok (esta aba já queimou) | usado | cancelado | invalido
function qrGame_(p, use) {
  var code = String(p.qr || ''), g = String(p.g || ''), accIn = p.acc || p.c || '', acc = /^[a-z0-9]{8,40}$/i.test(accIn) ? accIn : '';
  if (!QR_RE.test(code) || !GAMES[g]) return { ok: true, status: 'invalido' };
  var lock = null;
  if (use) {
    if (!acc) return { ok: true, status: 'invalido' };
    lock = LockService.getScriptLock();
    try { lock.waitLock(20000); } catch (err) { return { ok: false, error: 'busy' }; }
  }
  try {
    var sh = sheet_(SpreadsheetApp.getActiveSpreadsheet(), 'QR'), r = qrFind_(sh, code);
    if (!r) return { ok: true, status: 'invalido' };
    var row = sh.getRange(r, 1, 1, COLS.QR.length).getValues()[0];
    if (row[1] !== g) return { ok: true, status: 'invalido' };
    if (row[2] === 'usado') return { ok: true, status: acc && row[6] === acc ? 'ok' : 'usado' };
    if (row[2] !== 'novo') return { ok: true, status: 'cancelado' };
    if (!use) return { ok: true, status: 'novo' };
    var pid = /^[a-z0-9]{8,40}$/i.test(p.p || '') ? p.p : '';
    sh.getRange(r, 3, 1, 5).setValues([['usado', row[3], new Date(), pid, acc]]); // status, criado, usado_em, player_id, acesso
    SpreadsheetApp.flush();
    return { ok: true, status: 'ok' };
  } finally { if (lock) lock.releaseLock(); }
}
// Chamado no evento start (já dentro do lock do doPost). Vale só se: QR deste jogo, queimado (usado) pela MESMA aba
// (acesso = acc) e sem outra partida ligada a ele. A primeira partida fica gravada na coluna "partida" do QR.
function qrPlay_(ctx, code, g, acc, sid) {
  if (!/^[a-z0-9]{8,40}$/i.test(acc)) return false;
  var sh = get_(ctx, 'QR'), r = qrFind_(sh, code);
  if (!r) return false;
  var row = sh.getRange(r, 1, 1, COLS.QR.length).getValues()[0];
  if (row[1] !== g || row[2] !== 'usado' || row[6] !== acc) return false;
  if (row[8] && row[8] !== sid) return false;            // este QR já teve a sua partida
  if (!row[8]) sh.getRange(r, 9).setValue(sid);
  return true;
}
// Partida já existe com status válido (começou com QR ok)? Usado para end/save que chegam sem o start.
function qrRowOk_(ctx, sid) {
  var sh = get_(ctx, 'Partidas'), cols = COLS.Partidas, r = ctx.rows[sid];
  if (!r) { var hit = sh.getRange('A:A').createTextFinder(sid).matchEntireCell(true).findNext(); r = hit ? hit.getRow() : 0; }
  if (!r) return false;
  ctx.rows[sid] = r;
  var row = sh.getRange(r, 1, 1, cols.length).getValues()[0];
  return row[cols.indexOf('status')] !== 'bloqueada' && /^[a-p]{18}$/.test(String(row[cols.indexOf('qr')] || ''));
}

/* ======================= PAINEL DO CLIENTE (usuário e senha) ======================= */
// Painel de um cliente (ex.: painel-maquina-do-mal/): entra com usuário e senha e o servidor só devolve os jogos da lista
// do painel (os outros nem saem daqui). As contas ficam nas Propriedades do script (PAINEL_USUARIOS), com a senha guardada
// só como hash com sal. Nenhuma senha vai para este arquivo (o repositório é público). Contas: analytics/README.md § 9.
var PAINEIS = {
  'maquina-do-mal': { nome: 'Máquina do Mal', jogos: ['fuga-do-poser', 'busao-do-rock'] }
};
var PAINEL_ITER = 1000;          // rodadas de SHA-256 no hash da senha
var PAINEL_DIAS = 7;             // a sessão vale 7 dias (trocar a senha derruba as outras sessões da conta)
var PAINEL_TENTATIVAS = 5;       // senhas erradas seguidas antes de bloquear a conta...
var PAINEL_BLOQUEIO_MIN = 15;    // ...por 15 minutos
var PAINEL_SENHA_MIN = 8;        // tamanho mínimo da senha nova

function painel_(b) {
  var acao = String(b.painel || '');
  if (acao === 'login') return painelEntrar_(b);
  var s = painelConferir_(b.sessao);
  if (!s) return { ok: false, error: 'sessao' };
  var cfg = PAINEIS[s.u.painel];
  if (acao === 'dados') return painelDados_(s, cfg);
  if (acao === 'senha') return painelTrocar_(s, b);
  if (acao === 'qr_new') return cfg.jogos.indexOf(String(b.g || '')) < 0 ? { ok: false, error: 'jogo' } : qrNew_({ g: b.g, n: b.n, nota: b.nota });
  if (acao === 'qr_cancel') return painelQrCancel_(cfg, b);
  if (acao === 'usuarios' || acao === 'redefinir') {
    if (!s.u.admin) return { ok: false, error: 'admin' };
    return acao === 'usuarios' ? painelLista_(s.u.painel) : painelRedefinir_(s, b);
  }
  return { ok: false, error: 'acao' };
}

function painelUsuarios_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('PAINEL_USUARIOS') || '{}'); } catch (e) { return {}; }
}
function painelGravar_(users) { PropertiesService.getScriptProperties().setProperty('PAINEL_USUARIOS', JSON.stringify(users)); }
function painelNome_(login) { return String(login || '').trim().toLowerCase().slice(0, 80); }
function hex_(bytes) { return bytes.map(function (x) { return ('0' + ((x + 256) % 256).toString(16)).slice(-2); }).join(''); }
// hash = SHA-256(sal + ":" + senha), repetido PAINEL_ITER vezes sobre os bytes
function painelHash_(senha, sal, iter) {
  var A = Utilities.DigestAlgorithm.SHA_256, h = Utilities.computeDigest(A, sal + ':' + senha, Utilities.Charset.UTF_8);
  for (var i = 1; i < (iter || PAINEL_ITER); i++) h = Utilities.computeDigest(A, h);
  return hex_(h);
}
function igual_(a, b) {
  a = String(a); b = String(b);
  var d = a.length ^ b.length;
  for (var i = 0; i < a.length && i < b.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function painelSal_() { return Utilities.getUuid().replace(/-/g, ''); }
function painelSegredo_() {
  var p = PropertiesService.getScriptProperties(), s = p.getProperty('PAINEL_SEGREDO');
  if (!s) { s = painelSal_() + painelSal_(); p.setProperty('PAINEL_SEGREDO', s); }
  return s;
}
// sessão = login(base64) . validade . assinatura HMAC (com a versão da senha: trocar a senha invalida as sessões antigas)
function painelAssinar_(login, exp, ver) { return hex_(Utilities.computeHmacSha256Signature(login + '|' + exp + '|' + ver, painelSegredo_())).slice(0, 40); }
function painelSessao_(login, u) {
  var exp = Date.now() + PAINEL_DIAS * 864e5;
  return Utilities.base64EncodeWebSafe(login, Utilities.Charset.UTF_8) + '.' + exp + '.' + painelAssinar_(login, exp, u.ver || 0);
}
function painelConferir_(sessao) {
  var p = String(sessao || '').split('.');
  if (p.length !== 3 || p[0].length > 200) return null;
  var login;
  try { login = Utilities.newBlob(Utilities.base64DecodeWebSafe(p[0])).getDataAsString('UTF-8'); } catch (e) { return null; }
  var exp = Number(p[1]);
  if (!(exp > Date.now())) return null;
  var u = painelUsuarios_()[login];
  if (!u || !PAINEIS[u.painel] || !igual_(p[2], painelAssinar_(login, exp, u.ver || 0))) return null;
  return { login: login, u: u };
}
function painelPublico_(login, u) {
  return { login: login, nome: u.nome || login, admin: !!u.admin, trocar: !!u.trocar, painel: u.painel, painelNome: (PAINEIS[u.painel] || {}).nome || '' };
}
function painelChave_(login) { return 'pt_' + hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, login, Utilities.Charset.UTF_8)).slice(0, 40); }

function painelEntrar_(b) {
  var login = painelNome_(b.login), senha = String(b.senha || '').slice(0, 200);
  if (!login || !senha) return { ok: false, error: 'senha' };
  var cache = CacheService.getScriptCache(), key = painelChave_(login), n = Number(cache.get(key) || 0);
  if (n >= PAINEL_TENTATIVAS) return { ok: false, error: 'bloqueado', minutos: PAINEL_BLOQUEIO_MIN };
  var u = painelUsuarios_()[login];
  var h = painelHash_(senha, u ? u.sal : 'x', u ? u.iter : PAINEL_ITER); // calcula mesmo sem conta (mesmo tempo de resposta)
  if (!u || !PAINEIS[u.painel] || !igual_(h, u.hash)) {
    cache.put(key, String(n + 1), PAINEL_BLOQUEIO_MIN * 60);
    return n + 1 >= PAINEL_TENTATIVAS ? { ok: false, error: 'bloqueado', minutos: PAINEL_BLOQUEIO_MIN } : { ok: false, error: 'senha', restam: PAINEL_TENTATIVAS - n - 1 };
  }
  cache.remove(key);
  return { ok: true, sessao: painelSessao_(login, u), usuario: painelPublico_(login, u) };
}

// Dados só dos jogos do painel (filtrados aqui no servidor). Sem link da planilha e sem o id de aba dos QR.
function painelDados_(s, cfg) {
  var games = {};
  cfg.jogos.forEach(function (g) { if (GAMES[g]) games[g] = GAMES[g]; });
  var ss = SpreadsheetApp.getActiveSpreadsheet(), out = { ok: true, now: new Date().toISOString(), games: games, usuario: painelPublico_(s.login, s.u) };
  Object.keys(COLS).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    var rows = sh ? rows_(sh, COLS[name]).filter(function (r) { return games.hasOwnProperty(r.jogo); }) : [];
    if (name === 'QR') rows.forEach(function (r) { delete r.acesso; });
    out[name.toLowerCase()] = rows;
  });
  return out;
}
function painelQrCancel_(cfg, b) {
  var code = String(b.qr || '');
  if (!QR_RE.test(code)) return { ok: false, error: 'codigo' };
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QR'), r = sh ? qrFind_(sh, code) : 0;
  if (!r || cfg.jogos.indexOf(sh.getRange(r, 2).getValue()) < 0) return { ok: false, error: 'codigo' };
  return qrCancel_({ qr: code });
}

function painelFraca_(nova) {
  if (nova.length < PAINEL_SENHA_MIN) return 'curta';
  if (nova.length > 100) return 'longa';
  if (/^(.)\1+$/.test(nova) || /^\d+$/.test(nova) && nova.length < 12 || /^(senha|password|12345678|qwerty)/i.test(nova)) return 'fraca';
  return '';
}
function painelTrocar_(s, b) {
  var atual = String(b.atual || ''), nova = String(b.nova || '');
  if (!igual_(painelHash_(atual, s.u.sal, s.u.iter), s.u.hash)) return { ok: false, error: 'atual' };
  if (atual === nova) return { ok: false, error: 'igual' };
  var e = painelFraca_(nova);
  if (e) return { ok: false, error: e };
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return { ok: false, error: 'busy' }; }
  try {
    var users = painelUsuarios_(), u = users[s.login];
    u.sal = painelSal_(); u.iter = PAINEL_ITER; u.hash = painelHash_(nova, u.sal, u.iter);
    u.ver = (u.ver || 0) + 1; u.trocar = false; u.alterado = new Date().toISOString();
    painelGravar_(users);
    return { ok: true, sessao: painelSessao_(s.login, u), usuario: painelPublico_(s.login, u) };
  } finally { lock.releaseLock(); }
}
function painelLista_(painel) {
  var users = painelUsuarios_();
  return { ok: true, usuarios: Object.keys(users).filter(function (k) { return users[k].painel === painel; }).map(function (k) {
    var u = users[k]; return { login: k, nome: u.nome || k, admin: !!u.admin, trocar: !!u.trocar, alterado: u.alterado || '' };
  }) };
}
// Conta de administrador do painel gera uma senha provisória para outra conta do mesmo painel (ex.: o cliente esqueceu a senha).
function painelRedefinir_(s, b) {
  var alvo = painelNome_(b.alvo);
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return { ok: false, error: 'busy' }; }
  try {
    var users = painelUsuarios_(), u = users[alvo];
    if (!u || u.painel !== s.u.painel || alvo === s.login) return { ok: false, error: 'alvo' };
    var abc = 'abcdefghjkmnpqrstuvwxyz23456789', h = painelSal_() + painelSal_(), senha = '';
    for (var i = 0; i < 10; i++) senha += abc[parseInt(h.substr(i * 2, 2), 16) % abc.length];
    u.sal = painelSal_(); u.iter = PAINEL_ITER; u.hash = painelHash_(senha, u.sal, u.iter);
    u.ver = (u.ver || 0) + 1; u.trocar = true; u.alterado = new Date().toISOString();
    painelGravar_(users);
    CacheService.getScriptCache().remove(painelChave_(alvo)); // desbloqueia a conta, se estava bloqueada
    return { ok: true, login: alvo, senha: senha };
  } finally { lock.releaseLock(); }
}

/* ---- contas do painel pelo editor (Executar) ---- */
// Cria ou substitui uma conta. "senha" pode ser o texto da senha OU { sal, hash } já calculado (assim a senha não fica escrita).
// Ex. (num arquivo .gs temporário, apague depois de rodar): painelConta_('fulano@cliente', 'senha-boa', { nome: 'Fulano', painel: 'maquina-do-mal' })
function painelConta_(login, senha, opt) {
  login = painelNome_(login); opt = opt || {};
  if (!login || !PAINEIS[opt.painel]) throw new Error('Informe o login e um painel que exista em PAINEIS.');
  var users = painelUsuarios_(), old = users[login] || {}, u = { nome: opt.nome || login, painel: opt.painel, admin: !!opt.admin, trocar: !!opt.trocar,
    ver: (old.ver || 0) + 1, iter: PAINEL_ITER, alterado: new Date().toISOString() };
  if (typeof senha === 'string') { u.sal = painelSal_(); u.hash = painelHash_(senha, u.sal, u.iter); }
  else { u.sal = senha.sal; u.hash = senha.hash; u.iter = senha.iter || PAINEL_ITER; }
  users[login] = u;
  painelGravar_(users);
  Logger.log('Conta do painel gravada: ' + login + ' (' + opt.painel + (u.admin ? ', administrador' : '') + ')');
}
// Mostra as contas no Registro de execução (sem senha nem hash).
function painelContas() {
  var users = painelUsuarios_();
  Object.keys(users).forEach(function (k) { var u = users[k]; Logger.log(k + ' · ' + u.painel + (u.admin ? ' · administrador' : '') + (u.trocar ? ' · senha provisória' : '') + ' · ' + (u.alterado || '')); });
  if (!Object.keys(users).length) Logger.log('Nenhuma conta de painel criada.');
}
// Apaga uma conta: troque o login abaixo e rode.
function painelApagarConta() { var login = 'troque-pelo-login', users = painelUsuarios_(); delete users[login]; painelGravar_(users); painelContas(); }
// Desconecta todas as sessões de todos os painéis (troca o segredo das assinaturas).
function painelSairTodos() { PropertiesService.getScriptProperties().setProperty('PAINEL_SEGREDO', painelSal_() + painelSal_()); Logger.log('Todas as sessões dos painéis foram encerradas.'); }
