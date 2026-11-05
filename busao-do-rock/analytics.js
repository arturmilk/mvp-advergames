/* =====================================================================
   ROVER — COLETA DE DADOS DAS PARTIDAS
   Mesmo arquivo nos dois jogos (raiz e happy-hour/). Manda os eventos para
   o Web App do Google Apps Script (analytics/apps-script/Code.gs), que grava
   tudo na planilha do Google. Sem CONFIG.analytics.endpoint, não envia nada.

   Eventos: visit, register, start, milestone, checkpoint, end, save, share.
   Os eventos ficam numa fila no localStorage e só saem em poucos momentos
   (início, fim, salvar, aba oculta), para gastar poucas requisições.
   Se a internet cair, a fila é reenviada na próxima visita.
   ===================================================================== */
(() => {
  'use strict';
  const QKEY = 'ra_queue', PKEY = 'ra_pid', OVR = 'ra_endpoint', MAXQ = 300;
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const uid = () => (Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6));
  const r1 = n => Math.round((+n || 0) * 10) / 10;

  let cfg = {}, game = '', version = '', endpoint = '', pid = '', sess = null, sending = false;

  // Em localhost dá para apontar para o servidor de teste: ?analytics=http://localhost:8790/exec
  function resolveEndpoint(url) {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if (local) {
      try {
        const q = new URLSearchParams(location.search).get('analytics');
        if (q != null) sessionStorage.setItem(OVR, q);
        const o = sessionStorage.getItem(OVR);
        if (o != null) return o;
      } catch (e) {}
    }
    return url || '';
  }

  function device() {
    const ua = navigator.userAgent || '';
    const os = /android/i.test(ua) ? 'Android' : /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /windows/i.test(ua) ? 'Windows'
      : /mac os/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Outro';
    const mobile = /mobi|android|iphone|ipad|ipod/i.test(ua) || (navigator.maxTouchPoints > 1 && /mac os/i.test(ua));
    const q = new URLSearchParams(location.search);
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    if (ref === location.hostname) ref = '';
    return {
      device: mobile ? 'celular' : 'computador', os, screen: screen.width + 'x' + screen.height,
      lang: navigator.language || '', ref, utm_source: q.get('utm_source') || '', utm_campaign: q.get('utm_campaign') || ''
    };
  }

  // A fila é relida a cada operação: as duas abas/jogos do mesmo domínio dividem a mesma fila.
  function push(type, data, sid) {
    if (!endpoint) return;
    const q = ls.get(QKEY, []);
    q.push({ id: uid(), t: type, g: game, s: sid != null ? sid : (sess ? sess.id : ''), p: pid, v: version, ts: new Date().toISOString(), d: data || {} });
    ls.set(QKEY, q.slice(-MAXQ));
  }
  function drop(ids) { const set = new Set(ids); ls.set(QKEY, ls.get(QKEY, []).filter(e => !set.has(e.id))); }

  function flush(beacon) {
    if (!endpoint) return;
    const batch = ls.get(QKEY, []).slice(0, 60);
    if (!batch.length) return;
    const body = JSON.stringify({ v: 1, events: batch }), ids = batch.map(e => e.id);
    if (beacon && navigator.sendBeacon) {
      try { if (navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain;charset=utf-8' }))) drop(ids); } catch (e) {}
      return;
    }
    if (sending) return;
    sending = true;
    // text/plain + no-cors = sem preflight (é o que o Apps Script aceita de outro domínio)
    fetch(endpoint, { method: 'POST', mode: 'no-cors', keepalive: body.length < 60000, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body })
      .then(() => { sending = false; drop(ids); if (ls.get(QKEY, []).length) setTimeout(flush, 500); })
      .catch(() => { sending = false; });
  }

  const RA = {
    get enabled() { return !!endpoint; },
    get sessionId() { return sess ? sess.id : ''; },
    get endpoint() { return endpoint; },   // usado também pelo ticket.js (QR code de uso único)
    get playerId() { return pid; },
    init(c) {
      cfg = (c && c.analytics) || {};
      game = cfg.game || ''; version = (c && c.version) || '';
      endpoint = resolveEndpoint(cfg.endpoint);
      if (!endpoint) return;
      pid = ls.get(PKEY, ''); if (!pid) { pid = uid(); ls.set(PKEY, pid); }
      push('visit', device(), '');
      flush();
      document.addEventListener('visibilitychange', () => { if (document.hidden) { RA.checkpoint(); flush(true); } });
      addEventListener('pagehide', () => { RA.checkpoint(); flush(true); });
    },
    // nova partida
    start(info) {
      sess = { id: uid(), next: 0, score: 0, sec: 0, ended: false };
      push('start', Object.assign(device(), info || {}));
      flush();
    },
    // chamado a cada ponto ganho: registra quando cada marco de pontuação é alcançado
    progress(score, sec) {
      if (!sess || sess.ended) return;
      sess.score = score; sess.sec = sec;
      const ms = cfg.milestones || [];
      while (sess.next < ms.length && score >= ms[sess.next]) {
        push('milestone', { kind: 'pontos', value: ms[sess.next], sec: r1(sec), score });
        sess.next++;
      }
    },
    // mudança de mundo/nível
    level(n, sec, name, score) {
      if (!sess || sess.ended) return;
      if (score != null) sess.score = score;
      push('milestone', { kind: 'nivel', value: n, sec: r1(sec), score: sess.score, name: name || '' });
    },
    // aba oculta/fechada no meio da partida: guarda até onde o jogador chegou
    checkpoint() {
      if (!sess || sess.ended) return;
      push('checkpoint', { score: sess.score, sec: r1(sess.sec) });
    },
    end(data) {
      if (!sess || sess.ended) return;
      sess.ended = true;
      const d = Object.assign({}, data); if (d.sec != null) d.sec = r1(d.sec);
      push('end', d);
      flush();
    },
    saved(data) { if (!sess) return; push('save', data || {}); flush(); },
    event(type, data) { push(type, data || {}, sess ? sess.id : ''); flush(); }
  };
  window.RoverAnalytics = RA;
})();
