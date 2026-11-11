/* Selo "Produzido por Montaggio" + convite "Quero um jogo para o meu negócio" (WhatsApp da Montaggio).
 * Arquivo idêntico em todos os jogos e painéis (como o analytics.js): se mudar um, copie para os outros.
 * Uso: MontaggioSelo.mount(opcoes). Nos jogos as opções vêm de CONFIG.montaggio; nos painéis, de DASH_CONFIG.montaggio.
 *   enabled   false esconde tudo
 *   places    [{ in: '#title', tone: 'light' | 'dark' | 'inherit', align: 'left', replace: 'seletor' }] onde o selo entra:
 *             no fim do elemento, dentro do fluxo (nunca por cima do jogo); replace troca um filho existente pelo selo
 *   cta       true mostra o convite ao lado do logo (só nos jogos)
 *   ctaText   texto do convite
 *   whatsapp  número só com dígitos, com 55 + DDD
 *   message   mensagem que já vem escrita no WhatsApp
 *   byText    texto antes do logo
 *   siteUrl   se preenchido, o logo vira link para o site
 * O logo é o logotipo "montaggio" (Bricolage Grotesque ExtraBold) desenhado em SVG: não depende de fonte nem de internet. */
(function () {
  'use strict';
  var WM = '<svg class="mtg-wm" viewBox="40 -775 4950 975" role="img" aria-label="Montaggio"><path fill="currentColor" d="M62 0V-341V-528H189L191 -373H211Q225 -430 248 -468Q271 -505 304 -524Q337 -542 381 -542Q427 -542 458 -522Q488 -503 506 -466Q524 -428 530 -373H547Q563 -432 589 -470Q615 -507 651 -524Q687 -542 729 -542Q774 -542 808 -524Q841 -507 864 -472Q886 -438 897 -386Q908 -335 908 -267V0H746V-247Q746 -300 738 -335Q729 -370 711 -388Q693 -405 665 -405Q633 -405 610 -384Q588 -363 576 -326Q564 -288 564 -241V0H406V-244Q406 -299 396 -334Q387 -369 368 -387Q350 -405 322 -405Q290 -405 268 -384Q246 -363 234 -326Q223 -288 223 -241V0ZM1223 14Q1143 14 1082 -17Q1020 -48 985 -110Q950 -172 950 -265Q950 -358 985 -420Q1020 -481 1082 -512Q1144 -542 1224 -542Q1304 -542 1366 -511Q1428 -480 1463 -418Q1498 -357 1498 -264Q1498 -169 1462 -107Q1426 -45 1364 -16Q1301 14 1223 14ZM1228 -103Q1264 -103 1288 -120Q1312 -136 1324 -170Q1336 -204 1336 -254Q1336 -307 1323 -344Q1310 -380 1284 -400Q1259 -419 1219 -419Q1185 -419 1160 -402Q1136 -386 1124 -352Q1112 -318 1112 -267Q1112 -185 1142 -144Q1173 -103 1228 -103ZM1547 0V-318V-528H1677L1679 -373H1699Q1712 -429 1736 -467Q1760 -505 1797 -524Q1834 -542 1884 -542Q1977 -542 2026 -477Q2074 -412 2074 -270V0H1912V-252Q1912 -334 1888 -372Q1865 -409 1819 -409Q1781 -409 1756 -386Q1732 -363 1720 -325Q1708 -287 1708 -240V0ZM2351 13Q2258 13 2214 -36Q2170 -86 2170 -195V-402H2095L2098 -527H2152Q2184 -528 2200 -537Q2217 -546 2221 -571L2234 -645H2325V-528H2452V-397H2325V-202Q2325 -168 2342 -152Q2358 -136 2392 -136Q2411 -136 2428 -140Q2445 -144 2456 -151V-2Q2424 8 2398 10Q2371 13 2351 13ZM2630 14Q2586 14 2552 -4Q2518 -21 2499 -54Q2480 -88 2480 -136Q2480 -181 2498 -210Q2515 -240 2548 -258Q2582 -275 2629 -286Q2676 -298 2736 -307Q2765 -312 2784 -316Q2804 -321 2814 -331Q2824 -341 2824 -360Q2824 -385 2806 -403Q2788 -421 2748 -421Q2720 -421 2698 -411Q2675 -401 2659 -382Q2643 -363 2635 -336L2493 -378Q2506 -420 2530 -451Q2553 -482 2586 -502Q2619 -523 2662 -532Q2704 -542 2752 -542Q2832 -542 2882 -516Q2933 -491 2958 -438Q2982 -384 2982 -300V-219Q2982 -183 2984 -146Q2985 -110 2988 -74Q2990 -37 2994 0H2852Q2848 -23 2844 -56Q2840 -88 2838 -122H2819Q2805 -84 2778 -52Q2752 -21 2714 -4Q2677 14 2630 14ZM2703 -100Q2721 -100 2740 -106Q2758 -113 2775 -124Q2792 -136 2806 -153Q2820 -170 2827 -190L2825 -269L2847 -264Q2828 -252 2805 -245Q2782 -238 2758 -234Q2735 -230 2712 -226Q2690 -221 2672 -214Q2655 -207 2645 -195Q2635 -183 2635 -162Q2635 -134 2654 -117Q2673 -100 2703 -100ZM3269 185Q3181 185 3124 172Q3068 158 3042 132Q3016 105 3016 67Q3016 21 3052 -8Q3089 -37 3160 -41V-62Q3105 -62 3076 -73Q3046 -84 3046 -114Q3046 -142 3075 -165Q3104 -188 3171 -201V-222Q3110 -227 3074 -262Q3038 -298 3038 -356Q3038 -405 3066 -446Q3094 -486 3150 -510Q3206 -535 3290 -535H3564V-414L3397 -436V-412Q3462 -403 3490 -382Q3518 -361 3518 -323Q3518 -283 3490 -252Q3463 -221 3413 -204Q3363 -186 3294 -186Q3282 -186 3268 -187Q3253 -188 3214 -192Q3198 -178 3189 -168Q3180 -159 3180 -151Q3180 -145 3185 -141Q3190 -137 3200 -136Q3209 -134 3220 -134H3381Q3401 -134 3434 -132Q3466 -129 3498 -116Q3531 -103 3554 -74Q3576 -45 3576 9Q3576 68 3543 108Q3510 147 3442 166Q3374 185 3269 185ZM3290 57Q3348 57 3380 51Q3412 45 3424 32Q3437 19 3437 0Q3437 -18 3430 -28Q3423 -39 3412 -43Q3401 -47 3390 -48Q3378 -49 3370 -49H3241Q3204 -49 3186 -32Q3169 -14 3169 9Q3169 28 3181 38Q3193 49 3220 53Q3246 57 3290 57ZM3283 -266Q3326 -266 3348 -289Q3369 -312 3369 -347Q3369 -385 3347 -410Q3325 -434 3284 -434Q3243 -434 3220 -410Q3197 -385 3197 -347Q3197 -324 3207 -306Q3217 -287 3236 -276Q3255 -266 3283 -266ZM3831 185Q3743 185 3686 172Q3630 158 3604 132Q3578 105 3578 67Q3578 21 3614 -8Q3651 -37 3722 -41V-62Q3667 -62 3638 -73Q3608 -84 3608 -114Q3608 -142 3637 -165Q3666 -188 3733 -201V-222Q3672 -227 3636 -262Q3600 -298 3600 -356Q3600 -405 3628 -446Q3656 -486 3712 -510Q3768 -535 3852 -535H4126V-414L3959 -436V-412Q4024 -403 4052 -382Q4080 -361 4080 -323Q4080 -283 4052 -252Q4025 -221 3975 -204Q3925 -186 3856 -186Q3844 -186 3830 -187Q3815 -188 3776 -192Q3760 -178 3751 -168Q3742 -159 3742 -151Q3742 -145 3747 -141Q3752 -137 3762 -136Q3771 -134 3782 -134H3943Q3963 -134 3996 -132Q4028 -129 4060 -116Q4093 -103 4116 -74Q4138 -45 4138 9Q4138 68 4105 108Q4072 147 4004 166Q3936 185 3831 185ZM3852 57Q3910 57 3942 51Q3974 45 3986 32Q3999 19 3999 0Q3999 -18 3992 -28Q3985 -39 3974 -43Q3963 -47 3952 -48Q3940 -49 3932 -49H3803Q3766 -49 3748 -32Q3731 -14 3731 9Q3731 28 3743 38Q3755 49 3782 53Q3808 57 3852 57ZM3845 -266Q3888 -266 3910 -289Q3931 -312 3931 -347Q3931 -385 3909 -410Q3887 -434 3846 -434Q3805 -434 3782 -410Q3759 -385 3759 -347Q3759 -324 3769 -306Q3779 -287 3798 -276Q3817 -266 3845 -266ZM4180 0V-528H4341V0ZM4261 -602Q4215 -602 4190 -622Q4166 -641 4166 -677Q4166 -715 4190 -734Q4215 -754 4261 -754Q4308 -754 4332 -734Q4357 -715 4357 -678Q4357 -641 4332 -622Q4308 -602 4261 -602ZM4664 14Q4584 14 4522 -17Q4461 -48 4426 -110Q4391 -172 4391 -265Q4391 -358 4426 -420Q4461 -481 4523 -512Q4585 -542 4665 -542Q4745 -542 4807 -511Q4869 -480 4904 -418Q4939 -357 4939 -264Q4939 -169 4903 -107Q4867 -45 4804 -16Q4742 14 4664 14ZM4669 -103Q4705 -103 4729 -120Q4753 -136 4765 -170Q4777 -204 4777 -254Q4777 -307 4764 -344Q4751 -380 4726 -400Q4700 -419 4660 -419Q4626 -419 4602 -402Q4577 -386 4565 -352Q4553 -318 4553 -267Q4553 -185 4584 -144Q4614 -103 4669 -103Z"/></svg>';
  var CSS = [
    '.mtg-selo{all:initial;box-sizing:border-box;display:flex;flex:none;flex-wrap:wrap;align-items:center;justify-content:center;column-gap:10px;row-gap:0;',
    'width:100%;max-width:420px;margin:14px auto 0;padding:0;font:600 10px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;',
    'letter-spacing:.02em;color:#F3EEE4;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;pointer-events:auto}',
    '.mtg-selo *{box-sizing:border-box}',
    '.mtg-selo.mtg-dark{color:#121212}',
    /* tom claro sobre fundo de jogo (às vezes claro e com textura): sombra leve para ler sem aumentar o selo */
    '.mtg-selo:not(.mtg-dark):not(.mtg-inherit){text-shadow:0 1px 2px rgba(0,0,0,.6)}.mtg-selo:not(.mtg-dark):not(.mtg-inherit) svg{filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.6))}',
    '.mtg-selo.mtg-inherit{color:inherit}.mtg-inherit .mtg-by{opacity:.9}.mtg-inherit .mtg-cta{opacity:.9}',
    '.mtg-selo.mtg-left{width:auto;max-width:none;margin:0;justify-content:flex-start}',
    '.mtg-by{all:unset;display:inline-flex;align-items:center;gap:5px;padding:6px 0;color:inherit;opacity:.55;white-space:nowrap;text-decoration:none}',
    'a.mtg-by{cursor:pointer}',
    '.mtg-k{text-transform:uppercase;letter-spacing:.09em;font-size:8.5px;font-weight:700}',
    '.mtg-wm{display:block;height:11px;width:auto;margin-top:1px}',
    '.mtg-sep{width:1px;height:11px;background:currentColor;opacity:.25}',
    '.mtg-cta{all:unset;display:inline-flex;align-items:center;gap:4px;padding:6px 2px;color:inherit;opacity:.72;cursor:pointer;white-space:nowrap;',
    'font-size:10px;font-weight:600;text-decoration:underline;text-decoration-color:rgba(127,127,127,.55);text-underline-offset:2px}',
    '.mtg-cta:hover,.mtg-cta:focus-visible{opacity:1}',
    '.mtg-cta:focus-visible{outline:2px solid currentColor;outline-offset:2px;border-radius:3px}',
    '.mtg-cta svg{width:9px;height:9px;flex:none}',
    /* área de toque maior que o texto, sem mudar o visual */
    '.mtg-cta{position:relative}.mtg-cta::after{content:"";position:absolute;inset:-8px -6px}',
    /* quando não cabe numa linha: empilha (logo em cima, convite embaixo), sem o separador solto */
    '.mtg-selo.mtg-stack{flex-direction:column}.mtg-stack .mtg-sep{display:none}.mtg-stack .mtg-by{padding-bottom:0}.mtg-stack.mtg-left{align-items:flex-start}'
  ].join('');
  var ARROW = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 2.5h6v6M9.5 2.5 2.5 9.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function waLink(num, msg) {
    var n = String(num || '').replace(/\D/g, '');
    return n ? 'https://wa.me/' + n + (msg ? '?text=' + encodeURIComponent(msg) : '') : '';
  }
  function build(o, tone, align) {
    var el = document.createElement('div');
    el.className = 'mtg-selo' + (tone === 'dark' ? ' mtg-dark' : tone === 'inherit' ? ' mtg-inherit' : '') + (align === 'left' ? ' mtg-left' : '');
    var by = '<span class="mtg-k">' + esc(o.byText || 'Produzido por') + '</span>' + WM;
    var html = o.siteUrl
      ? '<a class="mtg-by" href="' + esc(o.siteUrl) + '" target="_blank" rel="noopener">' + by + '</a>'
      : '<span class="mtg-by">' + by + '</span>';
    var href = o.cta ? waLink(o.whatsapp, o.message) : '';
    if (href) html += '<span class="mtg-sep" aria-hidden="true"></span><a class="mtg-cta" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(o.ctaText || 'Quero um jogo para o meu negócio') + ARROW + '</a>';
    el.innerHTML = html;
    /* o toque no convite não pode virar toque no jogo (atalhos de tela, segurar para admin etc.) */
    ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    return el;
  }
  var MS = {
    waLink: waLink,
    mount: function (o) {
      o = o || {};
      if (o.enabled === false) return [];
      if (!document.getElementById('mtg-selo-css')) {
        var st = document.createElement('style'); st.id = 'mtg-selo-css'; st.textContent = CSS; document.head.appendChild(st);
      }
      var out = [];
      (o.places || []).forEach(function (p) {
        var host = typeof p === 'string' ? document.querySelector(p) : document.querySelector(p.in);
        if (!host || host.querySelector(':scope > .mtg-selo')) return;
        var el = build(o, p.tone, p.align);
        if (p.replace) { var old = host.querySelector(p.replace); if (old) { host.replaceChild(el, old); out.push(el); return; } }
        host.appendChild(el); out.push(el);
      });
      out.forEach(fit);
      if (window.ResizeObserver) { var ro = new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); }); out.forEach(function (el) { ro.observe(el); }); }
      else window.addEventListener('resize', function () { out.forEach(fit); });
      return out;
    }
  };
  /* empilha se o convite cairia na linha de baixo (mede na horizontal e decide na mesma hora, sem piscar) */
  function fit(el) {
    var cta = el.querySelector('.mtg-cta'); if (!cta || !el.offsetWidth) return;
    el.classList.remove('mtg-stack');
    var by = el.querySelector('.mtg-by');
    if (cta.offsetTop > by.offsetTop + 4) el.classList.add('mtg-stack');
  }
  window.MontaggioSelo = MS;
  /* monta sozinho com CONFIG.montaggio (jogos) ou DASH_CONFIG.montaggio (painéis) */
  function auto() { var c = (window.CONFIG && window.CONFIG.montaggio) || (window.DASH_CONFIG && window.DASH_CONFIG.montaggio); if (c) MS.mount(c); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
