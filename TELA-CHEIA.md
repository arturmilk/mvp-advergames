# Tela cheia em todos os jogos (padrão, inclusive iPhone/Safari)

Vale para todos os jogos deste repositório e para os próximos. O código é o `fullscreen.js`, **idêntico** na raiz e em
cada pasta de jogo (como o `analytics.js` e o `montaggio-selo.js`: se mudar um, copie para os outros). As opções ficam
em `CONFIG.fullscreen` no `config.js` de cada jogo.

## Por que "tela cheia no Safari" não é uma coisa só

| Onde | O que o navegador deixa | O que o jogo faz |
|---|---|---|
| Android (Chrome, Samsung Internet), iPad, computador | Fullscreen API de verdade, só dentro de um toque | Pede tela cheia no **1º toque em qualquer lugar** e no botão de começar; trava a orientação do jogo (Android) |
| iPhone no Safari | **Não existe** tela cheia para páginas, só para `<video>`. O antigo `scrollTo(0, 1)` não esconde a barra há anos, e um jogo sem rolagem não a recolhe | **Pseudo tela cheia**: o jogo ocupa 100% da área visível, por baixo do entalhe, sem rolagem nem zoom de pinça |

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

## Cuidados

* **Se alguém instalar por conta própria** pela Tela de Início (o manifest e as metas continuam prontos, sem nenhum
  aviso), o jogo abre sem barras. No iPhone esse app guarda os dados separados do Safari: quem joga pelo ícone ganha outro `player_id`, outro recorde e outro
  "já jogou" (armazenamento separado). Conta como outro jogador na planilha.
* **Nada disso foi testado em iPhone ou Android físico.** Os testes simulam os navegadores no Chromium.
