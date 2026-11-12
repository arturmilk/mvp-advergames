# Tela cheia em todos os jogos (padrão, inclusive iPhone/Safari)

Vale para todos os jogos deste repositório e para os próximos. O código é o `fullscreen.js`, **idêntico** na raiz e em
cada pasta de jogo (como o `analytics.js` e o `montaggio-selo.js`: se mudar um, copie para os outros). As opções ficam
em `CONFIG.fullscreen` no `config.js` de cada jogo.

## Por que "tela cheia no Safari" não é uma coisa só

| Onde | O que o navegador deixa | O que o jogo faz |
|---|---|---|
| Android (Chrome, Samsung Internet), iPad, computador | Fullscreen API de verdade, só dentro de um toque | Pede tela cheia no **1º toque em qualquer lugar** e no botão de começar; trava a orientação do jogo (Android) |
| iPhone no Safari | **Não existe** tela cheia para páginas, só para `<video>`. O antigo `scrollTo(0, 1)` não esconde a barra há anos, e um jogo sem rolagem não a recolhe | **Pseudo tela cheia**: o jogo ocupa 100% da área visível, por baixo do entalhe, sem rolagem nem zoom de pinça |
| iPhone no Safari, jogo **deitado** | Igual acima. A barra só recolhe quando o próprio jogador rola a página | **Tela cheia suave** (`soft-fullscreen.js`, seção abaixo): a página fica rolável, o jogador desliza para cima, a barra recolhe e o jogo liga |

A referência analisada (tese3.com/arcade.html, 12/11/2026) faz exatamente isso: no iPhone, o painel do jogo é
`position: fixed; inset: 0; height: 100dvh; overflow: hidden`, esconde cabeçalho/rodapé/menus do site e usa
`viewport-fit=cover` + safe-area. Ela chama `requestFullscreen` em try/catch (funciona no Android e não faz nada no iPhone),
bloqueia zoom de pinça só durante o jogo. Não há API escondida.

**Regra do Arthur (12/11/2026):** nenhum jogo mostra aviso ou convite de "Adicionar à Tela de Início" (nem "abra no
Safari"), em momento algum. Não acrescente isso em jogos novos.

## Checklist para um jogo novo

1. **Copie `fullscreen.js`** para a pasta do jogo e carregue logo depois do `config.js`:
   `<script src="config.js"></script>` → `<script src="fullscreen.js"></script>`.
2. **`<head>`** (já é o padrão dos jogos):
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
   <meta name="theme-color" content="#COR_DO_FUNDO">
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   <meta name="apple-mobile-web-app-title" content="Nome curto">
   <link rel="manifest" href="manifest.webmanifest">
   <link rel="apple-touch-icon" href="assets/icon-192.png">
   ```
3. **`manifest.webmanifest`**: `"display": "fullscreen"`, `"display_override": ["fullscreen", "standalone"]`,
   `"orientation"` do jogo, `background_color`/`theme_color` iguais ao fundo, ícones 192 e 512.
4. **CSS da pseudo tela cheia** (o que faz o iPhone parecer tela cheia):
   ```css
   html, body { margin: 0; height: 100%; overflow: hidden; overscroll-behavior: none; background: #COR; }
   #app { position: fixed; inset: 0; overflow: hidden; touch-action: none;
          user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
   /* HUD e botões: padding com env(safe-area-inset-top/right/bottom/left) */
   ```
   Nada de `100vh` no contêiner principal (no iPhone ele inclui a barra escondida); `inset: 0` ou `100dvh`.
   Redesenhe o canvas no `resize` e no `visualViewport.resize` (a área muda quando a tela cheia liga no Android).
5. **Botão de começar**: chame `GameFullscreen.enter()` dentro do toque.
6. **`config.js`**: copie o bloco `fullscreen` de um jogo existente e ajuste `orientation`.
7. **Teste**: Chromium em 360/430/480 (retrato) ou 740×360/844×390/932×430 (paisagem), com user-agent de Android (1 pedido
   de tela cheia por toque, `navigationUI: 'hide'`) e de iPhone sem Fullscreen API (nenhum pedido, nenhum erro, nada
   aparece na tela). No console: `GameFullscreen.info()`.

## Opções (`CONFIG.fullscreen`)

| Chave | Padrão | Para quê |
|---|---|---|
| `enabled` | `true` | `false` desliga tudo |
| `onFirstTouch` | `true` | tela cheia no 1º toque em qualquer lugar (senão, só no `enter()`) |
| `devices` | `'touch'` | `'touch'` só celular/tablet; `'all'` também no computador |
| `orientation` | do jogo | `'portrait'`/`'landscape'` trava depois de entrar em tela cheia (Android); `''` não trava |
| `blockZoom` | `true` | bloqueia pinça e gesto de zoom (o iPhone ignora `user-scalable=no`); um dedo segue livre |

O `<html>` ganha as classes `fs-ios`, `fs-standalone` (aberto pela Tela de Início) e `fs-on` (em tela cheia agora), se o
CSS do jogo quiser reagir.

## Tela cheia suave no iPhone (jogos deitados)

Pedido do Arthur (12/11/2026). Arquivo `soft-fullscreen.js`, **idêntico** em cada jogo deitado (hoje `busao-do-rock/` e
`fuga-do-poser/`), carregado logo depois do `fullscreen.js`. Opções em `CONFIG.softFullscreen`. Os jogos em pé (A Entrega e
Happy Hour) não carregam o arquivo e não mudam.

**Quando liga (todas as condições):** aparelho de toque; iPhone/iPod, ou iPad **sem** Fullscreen API; sem Fullscreen API
(`fullscreenEnabled`/`webkitFullscreenEnabled` + `requestFullscreen`, o mesmo teste do `fullscreen.js`); fora do modo Tela de
Início (`navigator.standalone`, `display-mode: standalone/fullscreen`); fora de navegador de rede social pelo user agent
(Instagram, Facebook, TikTok, Snapchat, Pinterest, LinkedIn, WhatsApp, Line, KakaoTalk, WeChat). Se qualquer uma falhar, o módulo
não faz nada. Nada de aviso de "Adicionar à Tela de Início" (a regra continua).

**Como funciona:**
1. `#sf-spacer` no fim do `<body>` com `calc(100dvh + 200px)`: a página fica rolável para o Safari recolher a barra.
   O CSS injetado tira o `overflow: hidden`/`height: 100%` do `html, body` dos jogos **só nesse modo** (`html.sf-on`).
   O módulo nunca usa `overflow: hidden` nem `position: fixed` no `body` para travar a rolagem.
2. O contêiner do jogo (`container`, `#app`) fica `position: fixed; height: 100dvh` por cima. Com a barra à mostra
   (`html.sf-idle`), ele e os filhos ficam com `pointer-events: none`: o dedo atravessa e rola a página.
3. Dica fixa com `pointer-events: none`: seta animada + "Deslize para cima para jogar em tela cheia", só deitado.
4. Medida: `visualViewport.height` (ou `innerHeight`). `baseH` = menor altura vista. **Ligado** quando a altura passa de
   `baseH + threshold` (30 px) ou fica a até `screenTolerance` (24 px) da tela inteira (abriu já sem barra). Desliga quando volta
   para menos de `baseH + threshold/2`. Ouve `visualViewport.resize`, `resize` e `scroll` (passivo). Com o teclado aberto
   (campo de apelido) não mede nada.
5. Ligado (`html.sf-live`): dica some, o jogo volta a receber toques, `touch-action: none` e `touchmove` bloqueado
   (`passive: false`) para a página não rolar de volta. Listas com rolagem própria (ranking, telas longas) continuam rolando.
6. Barra voltou: desliga, mostra a dica de novo, o jogo pausa e a página volta ao topo (para o próximo deslize ter o que rolar).
7. Em pé (`html.sf-portrait`): usa o aviso de girar do próprio jogo (`rotateSelector`, `#rotate`) ou, se não houver, um
   "Gire o celular para jogar" do módulo; o jogo fica pausado. Ao girar, `baseH` volta a `Infinity` e mede de novo depois de
   `rotateDelay` (350 ms).
8. Áudio: rolar a página não conta como toque no iOS. Depois de ligar, se o jogo informou que o áudio está travado, aparece
   "Toque para começar"; o toque chama o `unlock()` do jogo (que faz o `AudioContext.resume()`) direto no `touchend`.

**API:** `SoftFullscreen.isActive()` (barra recolhida), `isEnabled()` (módulo rodando neste aparelho), `canPlay()`
(`!isEnabled() || isActive()`), `audio({ locked, unlock })`, `info()` (para o console). Eventos no `window`:
`softfs:live` e `softfs:idle`. No `live` e em cada mudança de tamanho o módulo dispara `window` `resize`.
O `fullscreen.js` não pede tela cheia enquanto o módulo estiver ligado (trava de segurança; no iPhone a API já não existe).

**Para ligar num jogo deitado novo:**
1. Copie `soft-fullscreen.js` e carregue depois do `fullscreen.js`.
2. Copie o bloco `softFullscreen` do `config.js` do Busão e ajuste `container`/`rotateSelector`.
3. Conecte a pausa (o padrão dos dois jogos):
   ```js
   let sfPaused = false;
   addEventListener('softfs:idle', () => { if (G && G.state === 'play') { pauseGame(); sfPaused = true; } Sound.suspend(true); });
   addEventListener('softfs:live', () => { Sound.suspend(false); if (sfPaused && G && G.state === 'paused') resumeGame(); sfPaused = false; });
   if (window.SoftFullscreen) SoftFullscreen.audio({ locked: () => !Sound.ctx || Sound.ctx.state !== 'running', unlock: () => Sound.unlock() });
   // no loop: if (window.SoftFullscreen && !SoftFullscreen.canPlay()) acc = 0;  (congela contagem/intro sem destruir nada)
   ```
4. O `resize()` do jogo deve medir o contêiner (não `100vh`) e limitar o `devicePixelRatio` a 2.

**Limitações (não prometa mais que isso):** não é tela cheia de verdade; pode sobrar uma faixa fina com o domínio; o Safari pode
mostrar a barra de novo com um gesto do sistema e não há como impedir (o jogo só pausa); **não confirmado em iPhone real**.

### Checklist manual no iPhone (Safari, iOS 18 e iOS 26)

Abra pelo link normal (não pela Tela de Início), em cada jogo deitado:

- [ ] Em pé: aparece o aviso de girar do jogo; nada de dica de deslizar.
- [ ] Deitado, com a barra à mostra: aparece "Deslize para cima para jogar em tela cheia" com a seta, e o jogo fica parado por baixo.
- [ ] Deslizar o dedo para cima: a barra recolhe, a dica some e o jogo responde aos toques (botões e menus).
- [ ] Logo depois de ligar aparece "Toque para começar"; ao tocar, a música e os efeitos tocam.
- [ ] Durante a partida, segurar os controles não rola a página nem traz a barra de volta.
- [ ] Fazer a barra voltar (tocar no rodapé/topo da tela ou puxar para baixo): o jogo pausa e a dica reaparece; deslizar de novo: a partida continua de onde parou.
- [ ] Girar para em pé no meio da partida: aviso de girar, partida pausada; deitar de novo: dica, deslizar, a partida volta.
- [ ] HUD, botões de pausa/som e controles não ficam embaixo do entalhe nem da barrinha de baixo (testar deitado para os dois lados).
- [ ] Ranking e telas com rolagem própria continuam rolando com o dedo.
- [ ] Fim de partida: digitar o apelido (teclado abre e fecha) e salvar sem a dica atrapalhar.
- [ ] Anotar se sobra faixa com o domínio no topo e quantos pixels mais ou menos (para ajustar `screenTolerance`).
- [ ] Instagram (abrir o link pelo direct): nenhuma dica; o jogo funciona como antes.
- [ ] Android (Chrome) e computador: nenhuma dica; no Android o 1º toque continua entrando em tela cheia.
- [ ] No console do Safari (Mac + cabo), `SoftFullscreen.info()` mostra `enabled: true` e `live` mudando.

## Cuidados

* **Se alguém instalar por conta própria** pela Tela de Início (o manifest e as metas continuam prontos, sem nenhum
  aviso), o jogo abre sem barras. No iPhone esse app guarda os dados separados do Safari: quem joga pelo ícone ganha outro `player_id`, outro recorde e outro
  "já jogou" (armazenamento separado). Conta como outro jogador na planilha.
* **Nada disso foi testado em iPhone ou Android físico.** Os testes simulam os navegadores no Chromium (a barra do Safari foi
  simulada mudando a altura da janela).
