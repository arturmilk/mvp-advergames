/* Tela cheia em todos os navegadores (padrão dos jogos: Rover, Máquina do Mal e os próximos).
 * Arquivo idêntico em todos os jogos (como o analytics.js e o montaggio-selo.js): se mudar um, copie para os outros.
 * Carregue depois do config.js: <script src="fullscreen.js"></script>. As opções vêm de CONFIG.fullscreen.
 *
 * O que cada navegador permite:
 *  1. Android, iPad e computador: a Fullscreen API existe. Pedimos tela cheia no primeiro toque de verdade
 *     (o navegador só aceita dentro de um toque) e, se der, travamos a orientação do jogo.
 *  2. iPhone no Safari: NÃO existe tela cheia para páginas (só para <video>). O que dá para fazer é
 *     "pseudo tela cheia": o jogo ocupa 100% da área visível, por baixo do entalhe (viewport-fit=cover + safe-area),
 *     sem rolagem e sem zoom de pinça. Isso o CSS de cada jogo já faz; aqui travamos o zoom de pinça.
 *     Nos jogos deitados, o soft-fullscreen.js (se carregado) faz a "tela cheia suave" no iPhone e este arquivo
 *     não pede tela cheia enquanto ele estiver ligado.
 *
 * Opções (CONFIG.fullscreen):
 *   enabled        false desliga tudo
 *   onFirstTouch   true pede tela cheia no primeiro toque em qualquer lugar
 *   devices        'touch' (só celular/tablet) ou 'all' (também no computador)
 *   orientation    'portrait' | 'landscape' | '' trava a orientação depois de entrar em tela cheia (só Android)
 *   blockZoom      true bloqueia zoom de pinça e de gesto (o iPhone ignora user-scalable=no)
 * API: GameFullscreen.enter() (chame no botão de começar), GameFullscreen.exit(), GameFullscreen.info() (para teste). */
(function () {
  'use strict';
  var C = (window.CONFIG && window.CONFIG.fullscreen) || {};
  var opt = {
    enabled: C.enabled !== false,
    onFirstTouch: C.onFirstTouch !== false,
    devices: C.devices || 'touch',
    orientation: C.orientation || '',
    blockZoom: C.blockZoom !== false
  };
  var d = document, de = d.documentElement, ua = navigator.userAgent || '';

  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  function standalone() {
    try { if (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches) return true; } catch (e) {}
    return navigator.standalone === true;
  }
  function apiOk() { return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled) && !!(de.requestFullscreen || de.webkitRequestFullscreen); }
  function isFull() { return !!(d.fullscreenElement || d.webkitFullscreenElement); }
  function deviceOk() {
    if (opt.devices === 'all') return true;
    try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; }
  }

  function lockOrientation() {
    if (!opt.orientation) return;
    try { var o = screen.orientation; if (o && o.lock) o.lock(opt.orientation).catch(function () {}); } catch (e) {}
  }
  var pending = false; // um toque dispara pointerup + touchend + click: pede uma vez só
  function request() {
    if (pending || !opt.enabled || isFull() || standalone() || !apiOk() || !deviceOk()) return;
    if (window.SoftFullscreen && SoftFullscreen.isEnabled()) return; // iPhone: quem cuida é o soft-fullscreen.js
    try {
      var req = de.requestFullscreen || de.webkitRequestFullscreen;
      var p = req.call(de, { navigationUI: 'hide' });
      if (p && p.then) { pending = true; p.then(lockOrientation).catch(function () {}).then(function () { pending = false; }); } else lockOrientation();
    } catch (e) { pending = false; }
  }
  function exit() {
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    try { if (d.exitFullscreen && d.fullscreenElement) d.exitFullscreen().catch(function () {}); else if (d.webkitExitFullscreen && d.webkitFullscreenElement) d.webkitExitFullscreen(); } catch (e) {}
  }
  function info() { return { ios: isIOS, standalone: standalone(), api: apiOk(), full: isFull(), touch: deviceOk(), options: opt }; }

  // classes no <html> para o CSS do jogo, se quiser: fs-ios, fs-standalone, fs-on (em tela cheia agora)
  function mark() {
    de.classList.toggle('fs-ios', isIOS);
    de.classList.toggle('fs-standalone', standalone());
    de.classList.toggle('fs-on', isFull());
  }
  mark();
  d.addEventListener('fullscreenchange', mark);
  d.addEventListener('webkitfullscreenchange', mark);

  window.GameFullscreen = { enter: request, exit: exit, info: info };
  if (!opt.enabled) return;

  // 1) tela cheia no primeiro toque de verdade (Android/iPad/computador)
  if (opt.onFirstTouch) {
    var onTap = function (e) {
      if (!e.isTrusted || (navigator.userActivation && !navigator.userActivation.isActive)) return;
      request();
    };
    ['pointerup', 'touchend', 'click'].forEach(function (t) { addEventListener(t, onTap, { capture: true, passive: true }); });
  }

  // 2) sem zoom de pinça/gesto (o iPhone ignora user-scalable=no); um dedo continua livre para os controles
  if (opt.blockZoom) {
    var stop = function (e) { if (e.cancelable) e.preventDefault(); };
    d.addEventListener('gesturestart', stop, { passive: false });
    d.addEventListener('gesturechange', stop, { passive: false });
    d.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1 && e.cancelable) e.preventDefault(); }, { passive: false });
  }
})();
