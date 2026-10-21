/**
 * ROVER — COLETA DE DADOS DOS JOGOS (Google Apps Script)
 *
 * Recebe os eventos de "Rover — A Entrega" e "Rover Happy Hour" e grava nesta planilha:
 *   Partidas  1 linha por partida (início, fim, pontos, duração, nível, motivo do fim, aparelho...)
 *   Marcos    quando cada partida alcançou cada pontuação/nível (tempo de jogo em segundos)
 *   Eventos   visitas, cadastros, compartilhamentos
 *   Ranking / Resumo / Tempo até pontuação   abas com fórmulas que se atualizam sozinhas
 *
 * O dashboard (dashboard/index.html) lê os dados por GET com o token secreto.
 * Instalação passo a passo: analytics/README.md
 */

var GAMES = { 'rover': 'Rover — A Entrega', 'happy-hour': 'Rover Happy Hour' };
var COLS = {
  Partidas: ['session_id', 'jogo', 'player_id', 'apelido', 'inicio', 'fim', 'status', 'pontos', 'duracao_s', 'nivel', 'meta',
    'motivo_fim', 'entregas', 'combo_max', 'itens', 'erros', 'salvo_ranking', 'apelido_ranking', 'posicao_ranking',
    'dispositivo', 'sistema', 'tela', 'idioma', 'origem', 'utm_source', 'utm_campaign', 'versao', 'atualizado'],
  Marcos: ['event_id', 'session_id', 'jogo', 'player_id', 'tipo', 'valor', 'segundos', 'pontos', 'data'],
  Eventos: ['event_id', 'tipo', 'jogo', 'session_id', 'player_id', 'apelido', 'data', 'detalhe']
};
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
  }
  return sh;
}

// Abas de leitura com fórmulas (setFormula usa sempre a sintaxe em inglês, com vírgulas).
function formulas_(ss) {
  var rk = ss.getSheetByName('Ranking') || ss.insertSheet('Ranking');
  rk.clear();
  rk.getRange('A1').setFormula('=QUERY(Partidas!A:AB, "select B, D, max(H), count(A), sum(I) where H is not null and D <> \'\' ' +
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
      '=IFERROR(MAXIFS(Partidas!H2:H, Partidas!B2:B, ' + k + '), 0)',
      '=COUNTIFS(Eventos!B2:B, "visit", Eventos!C2:C, ' + k + ')',
      '=COUNTIFS(Partidas!B2:B, ' + k + ', Partidas!Q2:Q, "sim")'
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
  Object.keys(fields).forEach(function (k) {
    var i = cols.indexOf(k); if (i < 0) return;
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
  var token = PropertiesService.getScriptProperties().getProperty('DASHBOARD_TOKEN');
  if (!token || p.token !== token) return json_({ ok: false, error: 'token' });
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
