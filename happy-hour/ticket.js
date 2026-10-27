/* =====================================================================
   ROVER — QR CODE DE USO ÚNICO
   Mesmo arquivo nos dois jogos (raiz e happy-hour/). Carregar DEPOIS do
   analytics.js: usa o mesmo endereço do Apps Script (CONFIG.analytics.endpoint).

   O dashboard gera links ?qr=<código>. Ao abrir, o jogo confere o código
   (qr_check). No PRIMEIRO TOQUE na tela, o código é queimado no servidor
   (qr_use): a partir daí só esta aba pode jogar com ele; qualquer outra
   pessoa/aba que abrir o mesmo link vê "QR code já usado".
   Configuração: CONFIG.ticket (required, oneGame, offline, texts).
   ===================================================================== */
(() => {
  'use strict';
  const SKEY = 'rt_ticket', CODE_RE = /^[a-p]{18}$/;
  const T0 = {
    checking: 'Conferindo o seu QR code…',
    claiming: 'Validando o QR code…',
    usedTitle: 'QR code já usado',
    used: 'Este QR code já foi usado por outra pessoa. Cada QR code vale para uma pessoa só. Peça um novo na Rover.',
    invalidTitle: 'QR code inválido',
    invalid: 'Este QR code não existe ou é de outro jogo. Confira o link ou peça um novo na Rover.',
    cancelledTitle: 'QR code cancelado',
    cancelled: 'Este QR code foi cancelado pela Rover. Peça um novo.',
    missingTitle: 'Precisa de um QR code',
    missing: 'Para jogar, leia o QR code que a Rover entregou para você.',
    offlineTitle: 'Sem conexão',
    offline: 'Não foi possível conferir o QR code. Verifique a internet e tente de novo.',
    retry: 'Tentar de novo',
    back: 'Voltar',
    playedTitle: 'Partida concluída',
    played: 'Este QR code já valeu a sua partida. Obrigado por jogar! Para jogar de novo, peça um novo QR code.'
  };
  let cfg = {}, T = T0, game = '', tk = null, state = 'off', box = null, pending = null;

  const ss = {
    get() { try { return JSON.parse(sessionStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } },
    set(v) { try { sessionStorage.setItem(SKEY, JSON.stringify(v)); } catch (e) {} }
  };
  const rid = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, b => (b % 36).toString(36)).join(''); };
  const RA = () => window.RoverAnalytics || {};

  function api(action) {
    const ep = RA().endpoint || '';
    if (!ep) return Promise.reject(new Error('sem endpoint'));
    const q = new URLSearchParams({ action: 'qr_' + action, g: game, qr: tk.code, c: tk.acc, p: RA().playerId || '', _: Date.now() });
    const ctl = window.AbortController ? new AbortController() : null, to = ctl && setTimeout(() => ctl.abort(), 12000);
    return fetch(ep + (ep.includes('?') ? '&' : '?') + q, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(r => r.json()).then(j => { clearTimeout(to); if (!j || !j.ok) throw new Error((j && j.error) || 'erro'); return j.status; })
      .catch(e => { clearTimeout(to); throw e; });
  }

  /* ---------- tela por cima do jogo ---------- */
  function overlay(kind, retry, label) {
    if (!box) {
      box = document.createElement('div');
      box.id = 'rt-overlay';
      box.setAttribute('role', 'alertdialog'); box.setAttribute('aria-live', 'polite');
      box.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));background:rgba(20,20,20,.88);font:16px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#2B2B2B;touch-action:none';
      document.body.appendChild(box);
    }
    const c = cfg.color || '#E30613', wait = kind === 'checking' || kind === 'claiming';
    const title = wait ? '' : T[kind + 'Title'] || '', msg = T[kind] || '';
    box.innerHTML = `<div style="background:#fff;border-radius:16px;max-width:360px;width:100%;padding:22px 20px;text-align:center;box-shadow:0 10px 40px #0008;border-top:6px solid ${c}">
      ${wait ? `<div style="width:34px;height:34px;margin:4px auto 12px;border:4px solid #eee;border-top-color:${c};border-radius:50%;animation:rtspin .8s linear infinite"></div>` : `<div style="font-size:40px;line-height:1;margin-bottom:8px">${kind === 'offline' ? '📶' : kind === 'played' ? '🏁' : '🔒'}</div>`}
      ${title ? `<div role="heading" aria-level="2" style="margin:0 0 8px;font-size:21px;font-weight:800;color:#2B2B2B">${title}</div>` : ''}
      <p style="margin:0;font-size:15.5px;color:#444">${msg}</p>
      ${retry ? `<button type="button" id="rt-retry" style="margin-top:16px;min-height:48px;padding:10px 22px;border:0;border-radius:12px;background:${c};color:#fff;font:inherit;font-weight:700;cursor:pointer">${label || T.retry}</button>` : ''}
    </div><style>@keyframes rtspin{to{transform:rotate(360deg)}}</style>`;
    box.style.display = 'flex';
    const b = box.querySelector('#rt-retry'); if (b) b.onclick = e => { e.stopPropagation(); retry(); };
  }
  function hide() { if (box) box.style.display = 'none'; }
  function block(kind) { state = 'blocked'; overlay(kind); }

  /* ---------- 1) ao abrir: confere o código ---------- */
  function check() {
    state = 'checking'; overlay('checking');
    api('check').then(st => {
      if (st === 'ok') return granted();      // esta aba já tinha queimado (resposta perdida, recarga)
      if (st === 'novo') { state = 'ready'; hide(); return; }
      block(st === 'usado' ? 'used' : st === 'cancelado' ? 'cancelled' : 'invalid');
    }).catch(() => offline(check));
  }
  // sem internet: 'block' (padrão) não deixa jogar; 'allow' libera sem queimar o código
  function offline(retry) {
    if (cfg.offline === 'allow') { state = 'ok'; hide(); return replay(); }
    state = 'blocked'; overlay('offline', retry);
  }

  /* ---------- 2) primeiro toque: queima o código ---------- */
  function claim() {
    state = 'claiming'; overlay('claiming');
    api('use').then(st => {
      if (st === 'ok') return granted();
      pending = null;
      block(st === 'usado' ? 'used' : st === 'cancelado' ? 'cancelled' : 'invalid');
    }).catch(() => offline(claim));
  }
  function granted() { tk.used = true; ss.set(tk); state = 'ok'; hide(); replay(); }
  // repete o toque que queimou o código (ex.: o botão JOGAR), para o jogador não precisar tocar duas vezes
  function replay() { const el = pending; pending = null; if (el && el.isConnected && typeof el.click === 'function') el.click(); }

  function guard(e) {
    if (state === 'off' || state === 'ok') return;
    if (box && box.contains(e.target)) return;    // botão "Tentar de novo"
    e.preventDefault(); e.stopImmediatePropagation();
    if (state === 'ready' && (e.type === 'pointerdown' || e.type === 'keydown')) {
      pending = e.target && e.target.closest ? e.target.closest('button,a,[role="button"]') : null;
      claim();
    }
  }

  const RT = {
    get state() { return state; },
    get code() { return tk ? tk.code : ''; },
    init(C) {
      cfg = (C && C.ticket) || {}; T = Object.assign({}, T0, cfg.texts || {});
      game = (C && C.analytics && C.analytics.game) || '';
      const url = new URL(location.href), q = (url.searchParams.get('qr') || '').toLowerCase();
      if (url.searchParams.has('qr')) { url.searchParams.delete('qr'); try { history.replaceState(history.state, '', url.pathname + url.search + url.hash); } catch (e) {} }
      const saved = ss.get();
      if (CODE_RE.test(q)) tk = saved && saved.code === q ? saved : { code: q, acc: rid(), used: false, games: 0 };
      else if (saved && CODE_RE.test(saved.code || '')) tk = saved;   // recarregou a aba
      ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'].forEach(t => addEventListener(t, guard, { capture: true, passive: false }));
      if (!tk) {
        if (q) return block('invalid');
        // admin (?admin=true) e testes locais (localhost/?livre) não precisam de QR
        const free = url.searchParams.get('admin') === 'true' || (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && url.searchParams.has('livre'));
        if (cfg.required && !free) return block('missing');
        return; // sem QR e sem exigência: jogo livre
      }
      ss.set(tk);
      if (tk.used) { state = 'ok'; return; }
      check();
    },
    // chamar no começo de cada partida: false = não pode começar (a tela de aviso já aparece)
    allowStart() {
      if (state === 'off') return true;
      if (state !== 'ok') { if (state === 'ready') claim(); return false; }
      if (cfg.oneGame !== false && tk.games >= 1) { overlay('played', hide, T.back); return false; }
      tk.games++; ss.set(tk);
      return true;
    }
  };
  window.RoverTicket = RT;
})();
