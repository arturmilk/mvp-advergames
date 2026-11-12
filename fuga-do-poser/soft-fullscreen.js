/* Tela cheia suave no iPhone (jogos em paisagem: Busão do Rock, Fuga do Poser e os próximos).
 * Arquivo idêntico em todos os jogos em paisagem (como o fullscreen.js): se mudar um, copie para os outros.
 * Carregue logo depois do fullscreen.js: <script src="soft-fullscreen.js"></script>. Opções em CONFIG.softFullscreen.
 *
 * Por que existe: o Safari do iPhone não tem Fullscreen API para páginas. O mais perto disso, sem instalar nada,
 * é o jogador deslizar o dedo para cima para o Safari recolher a barra de endereço. NÃO é tela cheia de verdade:
 * pode sobrar uma faixa com o domínio e a barra pode voltar a qualquer momento. O jogo só reage (pausa e retoma).
 *
 * Só liga quando TODAS as condições valem; senão não faz nada e o jogo segue como antes (Android, computador, iPad):
 *   toque + iPhone/iPod (ou iPad sem Fullscreen API) · sem Fullscreen API · fora do modo Tela de Início ·
 *   fora de navegador embutido de rede social (Instagram, Facebook, TikTok...).
 *
 * Como funciona:
 *   - um #sf-spacer no fim do <body> deixa a página rolável (100dvh + 200px), para o Safari ter o que rolar;
 *   - o jogo fica fixo por cima (position: fixed; height: 100dvh). Desligado, ele não recebe toques
 *     (pointer-events: none) e o dedo rola a página por baixo; aparece a dica "Deslize para cima..." (só em paisagem);
 *   - ligado = a altura visível (visualViewport.height) passou da menor altura vista (baseH) + threshold.
 *     Aí a dica some, o jogo volta a receber toques e o touchmove fica bloqueado para a página não rolar de volta;
 *   - a barra voltou (altura perto de baseH) ou celular em pé: desliga de novo e o jogo pausa.
 *   - não usa overflow:hidden nem position:fixed no body (isso faz o Safari mostrar a barra de novo).
 *
 * API: SoftFullscreen.isActive()  true = barra recolhida, pode jogar
 *      SoftFullscreen.isEnabled() true = o módulo está rodando neste aparelho
 *      SoftFullscreen.canPlay()   true = pode jogar (módulo desligado ou barra recolhida)
 *      SoftFullscreen.audio({ locked: fn, unlock: fn })  mostra "Toque para começar" se o áudio estiver travado
 *      SoftFullscreen.info()      estado, para teste no console
 * Eventos no window: 'softfs:live' (pode jogar) e 'softfs:idle' (pausar). No 'live' e a cada mudança de tamanho
 * o módulo dispara window 'resize' para o jogo redimensionar o canvas. */
(function () {
  'use strict';
  var C = (window.CONFIG && window.CONFIG.softFullscreen) || {};
  var num = function (v, def) { return typeof v === 'number' && isFinite(v) ? v : def; };
  var opt = {
    enabled: C.enabled !== false,
    container: C.container || '#app',
    rotateSelector: C.rotateSelector == null ? '#rotate' : C.rotateSelector,
    hintText: C.hintText || 'Deslize para cima para jogar em tela cheia',
    rotateText: C.rotateText || 'Gire o celular para jogar',
    tapText: C.tapText || 'Toque para começar',
    threshold: num(C.threshold, 30),
    screenTolerance: num(C.screenTolerance, 24),
    extraScroll: num(C.extraScroll, 200),
    rotateDelay: num(C.rotateDelay, 350),
    zIndex: num(C.zIndex, 2147483000),
    inApp: C.inApp || 'FBAN|FBAV|FB_IAB|FBIOS|Instagram|TikTok|musical_ly|Bytedance|Twitter|Snapchat|Pinterest|LinkedInApp|KAKAOTALK|MicroMessenger|WhatsApp|\\bLine\\/'
  };
  var w = window, d = document, de = d.documentElement, ua = navigator.userAgent || '';

  /* ---------- quando ligar ---------- */
  var isIPhone = /iPhone|iPod/.test(ua);
  var isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in w;
  var fsApi = !!(d.fullscreenEnabled || d.webkitFullscreenEnabled) && !!(de.requestFullscreen || de.webkitRequestFullscreen);
  function standalone() {
    if (navigator.standalone === true) return true;
    try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches; } catch (e) { return false; }
  }
  var inApp = false;
  try { inApp = new RegExp(opt.inApp, 'i').test(ua); } catch (e) {}
  var reason = !opt.enabled ? 'desligado no config'
    : !touch ? 'sem toque'
    : !(isIPhone || isIPad) ? 'não é iPhone/iPad'
    : fsApi ? 'tem Fullscreen API'
    : standalone() ? 'aberto pela Tela de Início'
    : inApp ? 'navegador de rede social'
    : '';
  var on = !reason;

  var live = false, portrait = false, baseH = Infinity, lastH = 0, lastW = 0, needTap = false, audio = null;
  var api = {
    isEnabled: function () { return on; },
    isActive: function () { return on && live; },
    canPlay: function () { return !on || live; },
    audio: function (a) { audio = a || null; if (on && live) later(checkAudio, 450); },
    recheck: function () { if (on) check(); },
    info: function () {
      return { enabled: on, reason: reason || 'ligado', live: live, portrait: portrait, baseH: baseH, height: vh(),
        needTap: needTap, ua: { iPhone: isIPhone, iPad: isIPad, touch: touch, fullscreenApi: fsApi, standalone: standalone(), inApp: inApp }, options: opt };
    }
  };
  w.SoftFullscreen = api;
  if (!on) return;

  /* ---------- CSS (injetado; só vale com html.sf-on) ---------- */
  var S = opt.container, Z = opt.zIndex;
  var css =
    'html.sf-on,html.sf-on body{height:auto!important;min-height:100%;overflow:visible!important;overscroll-behavior:auto!important}' +
    '#sf-spacer{display:block;width:1px;height:calc(100vh + ' + opt.extraScroll + 'px);height:calc(100dvh + ' + opt.extraScroll + 'px);pointer-events:none}' +
    'html.sf-on ' + S + '{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:auto!important;width:100%!important;height:100vh!important;height:100dvh!important}' +
    'html.sf-idle ' + S + ',html.sf-idle ' + S + ' *{pointer-events:none!important}' +
    'html.sf-live ' + S + '{touch-action:none}' +
    'html.sf-live ' + S + ' *{overscroll-behavior:contain}' +
    '.sf-layer{position:fixed;inset:0;z-index:' + Z + ';display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;' +
      'padding:calc(env(safe-area-inset-top,0px) + 12px) calc(env(safe-area-inset-right,0px) + 16px) calc(env(safe-area-inset-bottom,0px) + 12px) calc(env(safe-area-inset-left,0px) + 16px);' +
      'color:#fff;text-align:center;font:800 18px/1.25 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-shadow:0 2px 0 #000;' +
      '-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    '#sf-hint{pointer-events:none;background:rgba(8,4,12,.84)}' +
    '#sf-hint b{max-width:320px;font-size:20px}' +
    '#sf-hint i{font-style:normal;display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:#FFD21F;color:#120B0E;' +
      'text-shadow:none;font-size:34px;line-height:1;border:3px solid #000;box-shadow:3px 3px 0 #000;animation:sf-up 1.2s ease-in-out infinite}' +
    '@keyframes sf-up{0%{transform:translateY(16px);opacity:.2}40%{opacity:1}100%{transform:translateY(-16px);opacity:.2}}' +
    '#sf-rotate{pointer-events:none;background:#000}' +
    '#sf-tap{pointer-events:auto;background:rgba(0,0,0,.6);cursor:pointer;touch-action:manipulation}' +
    '#sf-tap b{background:#FFD21F;color:#120B0E;text-shadow:none;border:3px solid #000;border-radius:14px;padding:12px 22px;box-shadow:4px 4px 0 #000}' +
    'html.sf-idle:not(.sf-portrait) #sf-hint{display:flex}' +
    'html.sf-portrait #sf-rotate{display:flex}' +
    'html.sf-live.sf-needtap #sf-tap{display:flex}' +
    '@media (prefers-reduced-motion:reduce){#sf-hint i{animation:none}}';
  var st = d.createElement('style'); st.id = 'sf-style'; st.textContent = css; (d.head || de).appendChild(st);
  de.classList.add('sf-on', 'sf-idle');

  /* ---------- elementos ---------- */
  var spacer, hint, rot, tap;
  function layer(id, html) { var el = d.createElement('div'); el.id = id; el.className = 'sf-layer'; el.innerHTML = html; d.body.appendChild(el); return el; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function build() {
    spacer = d.createElement('div'); spacer.id = 'sf-spacer'; spacer.setAttribute('aria-hidden', 'true');
    hint = layer('sf-hint', '<i aria-hidden="true">⬆</i><b>' + esc(opt.hintText) + '</b>');
    hint.setAttribute('role', 'status');
    // em pé: usa o aviso de girar do próprio jogo (rotateSelector) se ele existir; senão, o do módulo
    if (!(opt.rotateSelector && d.querySelector(opt.rotateSelector))) {
      rot = layer('sf-rotate', '<i style="font-style:normal;font-size:44px" aria-hidden="true">📱↻</i><b>' + esc(opt.rotateText) + '</b>');
      rot.setAttribute('role', 'alert');
    }
    tap = layer('sf-tap', '<b>' + esc(opt.tapText) + '</b>');
    tap.setAttribute('role', 'button');
    // o áudio do iOS só destrava dentro de um toque: resume() roda direto aqui (rolar a página não conta como toque)
    var onTap = function (e) {
      if (!needTap) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      try { if (audio && audio.unlock) audio.unlock(); } catch (err) {}
      setNeedTap(false);
      later(checkAudio, 700);
    };
    tap.addEventListener('touchend', onTap, { passive: false });
    tap.addEventListener('click', onTap);
    d.body.appendChild(spacer); // por último: é ele que dá altura à página
  }

  /* ---------- medida ---------- */
  function vh() { var v = w.visualViewport; return Math.round(v && v.height ? v.height : w.innerHeight); }
  function vw() { var v = w.visualViewport; return Math.round(v && v.width ? v.width : w.innerWidth); }
  function isPortrait() { try { return matchMedia('(orientation: portrait)').matches; } catch (e) { return w.innerHeight > w.innerWidth; } }
  function shortSide() { return Math.min(screen.width || 0, screen.height || 0); }
  function typing() { var a = d.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable); }
  var timers = {};
  function later(fn, ms) { clearTimeout(timers[fn.name]); timers[fn.name] = setTimeout(fn, ms); }
  var firing = false;
  function fireResize() {
    lastH = vh(); lastW = vw();
    firing = true; try { w.dispatchEvent(new Event('resize')); } catch (e) {} firing = false;
  }
  function emit(name) { try { w.dispatchEvent(new Event(name)); } catch (e) {} }

  function setNeedTap(v) { needTap = v; de.classList.toggle('sf-needtap', v); }
  function checkAudio() {
    var locked = false;
    try { locked = !!(audio && audio.locked && audio.locked()); } catch (e) {}
    setNeedTap(live && locked);
  }

  function setLive(v) {
    if (v === live) return;
    live = v;
    de.classList.toggle('sf-live', v); de.classList.toggle('sf-idle', !v);
    if (v) {
      emit('softfs:live');
      fireResize(); later(fireResize, opt.rotateDelay); // o 100dvh do Safari às vezes atualiza um pouco depois
      later(checkAudio, 450);
    } else {
      setNeedTap(false);
      emit('softfs:idle');
      // barra voltou com a página já rolada até o fim: volta ao topo para o próximo deslize ter o que rolar
      if (!portrait && (w.scrollY || w.pageYOffset || 0) > 2) { try { w.scrollTo(0, 0); } catch (e) {} }
    }
  }

  var settleUntil = 0;
  function rotated() { // girou: recalibra baseH e só mede de novo depois de rotateDelay (a tela ainda está mudando)
    baseH = Infinity; settleUntil = Date.now() + opt.rotateDelay;
    later(check, opt.rotateDelay + 20);
  }
  function check() {
    if (typing()) return; // teclado aberto (apelido): não mexe em nada
    var p = isPortrait();
    if (p !== portrait) { portrait = p; de.classList.toggle('sf-portrait', p); rotated(); }
    if (portrait) { setLive(false); return; }
    if (Date.now() < settleUntil) return;
    var h = vh();
    if (h < baseH) baseH = h;
    var full = opt.screenTolerance > 0 && shortSide() > 0 && h >= shortSide() - opt.screenTolerance; // já abriu sem barra
    if (!live && (h >= baseH + opt.threshold || full)) setLive(true);
    else if (live && h < baseH + opt.threshold / 2 && !full) setLive(false);
    else if (live && !firing && (h !== lastH || vw() !== lastW)) fireResize();
  }

  /* ---------- ligado: a página não rola de volta (listas com rolagem própria continuam rolando) ---------- */
  function inScroller(el) {
    var root = d.querySelector(S);
    for (; el && el !== d.body && el !== de; el = el.parentElement) {
      if (el === root) return false;
      var oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) return true;
    }
    return false;
  }
  d.addEventListener('touchmove', function (e) {
    if (live && e.cancelable && !inScroller(e.target)) e.preventDefault();
  }, { passive: false });

  /* ---------- liga tudo ---------- */
  function start() {
    build();
    portrait = isPortrait(); de.classList.toggle('sf-portrait', portrait);
    check();
    var onChange = function () { if (!firing) check(); };
    if (w.visualViewport) w.visualViewport.addEventListener('resize', onChange);
    w.addEventListener('resize', onChange);
    w.addEventListener('scroll', onChange, { passive: true });
    w.addEventListener('orientationchange', rotated);
    d.addEventListener('focusout', function () { later(check, opt.rotateDelay); });
    w.addEventListener('pageshow', function (e) { if (e.persisted) rotated(); }); // voltou do cache do Safari
  }
  if (d.body) start(); else d.addEventListener('DOMContentLoaded', start);
})();
