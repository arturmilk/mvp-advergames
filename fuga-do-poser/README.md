# Máquina do Mal em: Fuga do Poser (advergame mobile, na horizontal)

Auto-runner de perseguição em 2D para a **Máquina do Mal**. Um headbanger de corpsepaint desce do ônibus da banda e precisa fugir
do **Poser** (camisa com rosa, bermuda cargo, óculos na nuca), que vem andando pelo canto esquerdo da tela soltando pérolas em
balões de fala. A tela corre sozinha e acelera a cada 30 s. Se o herói tropeçar, ficar preso num amplificador ou cair num buraco
e o Poser alcançar, acabou. As camisas de banda espalhadas pelo caminho dão poderes, atrapalham ou dão pontos. A do Judas Priest
(Painkiller) vence o jogo. **O jogo é jogado com o celular deitado (horizontal)**; em pé aparece o aviso para girar e a
partida pausa.

* 100% client-side: HTML + JS puro, Canvas 2D, sem dependências. A única requisição externa é a coleta de dados (opcional).
* Mesmo modo de operar dos outros jogos: **uma partida por abertura do link** (sem "jogar de novo"), pop-up de tutorial antes de
  cada partida, apelido no fim com o mesmo filtro de palavrões, placar local + planilha Google + dashboard, QR code de uso único.

```
index.html              jogo completo (loop, física, fase procedural, telas, HUD, admin, áudio sintetizado)
config.js               TODA a configuração (textos, falas do Poser, camisas, velocidades, obstáculos, senhas)
assets/                 sprites PNG/JPG + manifest.json + ícones do PWA
assets/logos/           logos oficiais das bandas (<id>.webp, fundo transparente) + logos.json com a lista dos que existem
assets/_raw/            imagens originais geradas no Higgsfield (fonte para reprocessar)
tools/process_assets.py converte assets/_raw -> assets/*.webp (q90) + assets/manifest.json
analytics.js, ticket.js cópias idênticas dos arquivos da raiz (coleta de dados e QR code de uso único)
manifest.webmanifest, sw.js   PWA básico
```

Publicado (depois do merge no `main`): https://arturmilk.github.io/mvp-advergames/fuga-do-poser/

---

## 1. Como jogar

| Controle | Celular | Computador |
|---|---|---|
| Pular | toque em **▲ PULAR** (canto inferior direito) | Espaço, ↑ ou W |
| Pulo duplo | toque de novo no ar | aperte de novo no ar |
| Pulo curto | solte o botão logo | solte a tecla logo |
| Deslizar | **segure ▼ DESLIZAR** (canto inferior esquerdo) | segure ↓ ou S |
| Descer rápido | segure DESLIZAR no ar | segure ↓ no ar |

Botões grandes (132×82 px, com área de toque 14 px maior em volta), só toque e segurar, sem swipe. `P`/`Esc` pausa, `M` liga/desliga o som.
A partida pausa sozinha quando o app perde o foco.

### Intro (2 s)
O ônibus da Máquina do Mal chega freando, o herói aparece na porta, pula do degrau e sai correndo. O Poser entra pela esquerda
gritando "Ei, cara! Peraí!". A arte do ônibus foi adaptada da foto enviada (preto, chamas, placa cromada "Máquina do Mal" em letra gótica).

### Perseguição
* O herói tem uma posição "confortável" na tela (`hero.homeX`, 56% da largura). Quando perde terreno, corre até 1,35× a velocidade da
  tela para recuperar (`hero.catchup`).
* **Derrota:** se o herói for empurrado até a borda do Poser (`poser.reach`), o Poser puxa papo ("Peraí! Cita 3 músicas da sua banda
  favorita então…") e a partida termina. O medidor **POSER** no HUD mostra o quanto ele está perto, e a borda esquerda fica vermelha.
* **Velocidade:** começa em 220 px/s (40 km/h no velocímetro) e sobe 12% a cada 30 s, até 2× (`speed`).

### Obstáculos (fase procedural, sorteada a cada partida)
| Obstáculo | Tipo | O que fazer | Se errar |
|---|---|---|---|
| Amplificadores empilhados | sólido | pular (dá para ficar em cima) | trava o herói até ele pular; a tela empurra para o Poser |
| Caixa de retorno estourando | sólido (baixo) | pular | idem |
| Cabos no chão | tropeço | pular | tropeça 0,35 s (anda a 25% da velocidade) |
| Pedestal caído | tropeço | pular | idem |
| Treliça com refletores | por cima | **deslizar** | bate a cabeça e tropeça |
| Buraco sem fundo | buraco | pular (os largos têm uma plataforma no meio) | cai, leva 0,45 s para sair do outro lado |
| Plataformas (cases) | — | degraus com camisas em cima | — |

O primeiro perigo de toda partida é sempre um cabo (tropeço), nunca um buraco. Entre um perigo e outro há sempre pelo menos 0,72 s
na velocidade atual (`level.reaction`).

### Camisas
Cada camisa leva o **logo oficial da banda** no peito, e quando o jogador pega uma, o logo aparece grande no canto de cima à
esquerda, atrás do herói (área que já passou, não atrapalha), junto com o efeito, por 2,2 s (`logoTime`).
Os logos ficam em `assets/logos/<id>.webp` (fundo transparente) e precisam estar listados em `assets/logos/logos.json`
(ex.: `["slayer", "mayhem"]`). Banda sem arquivo aparece com o nome escrito no lugar.
Todas as camisas são pretas, como merch de verdade (só a do Judas é vermelha). Logos pretos no original foram invertidos
para branco, para ler na camisa preta.

**Logos incluídos (12)** — baixados do Wikimedia Commons em 05/11/2026, convertidos para webp com fundo transparente:
Judas Priest (`Judas Priest logo.png`), Meshuggah (`Meshuggah logo.svg`), Sodom (`Sodom-logo.svg`), Sepultura
(`Sepultura logo.png`), Slayer (`Slayer wordmark.svg`), Black Sabbath (`Black Sabbath logo.svg`), AC/DC (`Logo ACDC pwrup.svg`),
Aerosmith (`Aerosmith-logo.png`), Deep Purple (`Deep-Purple-logo.svg`), Megadeth (`MegadethLogoDileo.png`),
Beatles (`The Beatles logo.svg`), Oasis (`Oasis Logo.svg`).

**Faltam (5, aparecem com o nome escrito):** Mayhem, Venom, Saxon, Opeth e Mastodon. Não há logo deles no Commons nem
na Wikipédia (o "Mayhem" e o "Venom" do Commons são outras coisas). Para incluir, basta salvar o PNG/webp transparente em
`assets/logos/<id>.webp` e acrescentar o id em `logos.json`.
Versão com logos publicada no GitHub Pages em 05/11/2026.

| Camisa | Efeito |
|---|---|
| **Judas Priest — Painkiller** | Vitória: solo triunfal, o Poser sai voando e o jogo termina com "Metal God Ascended" (+20 como qualquer camisa). Só aparece depois de 90 s, raramente, num lugar alto (pulo duplo) |
| Mayhem ("envenenada") | Lentidão por 4 s: o herói não consegue acompanhar a tela e o Poser se aproxima (≈ -30%) |
| Meshuggah | "Ritmo polirrítmico": quebra qualquer obstáculo à frente por 5 s |
| Black Sabbath | Aura protetora: ignora (e destrói) o próximo impacto |
| AC/DC / Aerosmith / Deep Purple | High Voltage Jump por 8 s: pulo 16% mais alto |
| Sodom / Sepultura / Slayer / Venom / Saxon / Opeth / Mastodon / Megadeth | "Trve Metal": camisa de coleção, sem efeito |
| Beatles / Oasis | Vinheta acústica: a trilha vira violão e os botões PULAR/DESLIZAR trocam de função por 2 s |

### Pontos
**100 pontos a cada 10 s de fuga + 20 por camisa** (qualquer camisa, boa ou ruim). Ajuste em `timePoints`, `timeEvery` e `shirtPoints`.
Títulos (`goals`): Poser em Treinamento (0), Headbanger de Respeito (400), Guerreiro do Corpsepaint (1.000), Lenda do Underground (2.000).
Quem pega a Painkiller ganha o título **Metal God Ascended**.

### HUD
Pontos, metros, velocímetro (km/h), camisa equipada (com a barra do tempo restante do efeito), e o medidor de proximidade do Poser, tudo numa linha só no topo.
Botões: DESLIZAR no canto de baixo à esquerda (antes do Poser) e PULAR no canto de baixo à direita.

---

## 2. Personalizar (`config.js`)

| O quê | Onde |
|---|---|
| Textos do tutorial, títulos, frases do fim | `texts.*` |
| Falas do Poser (balões) e a fala final | `poser.lines`, `poser.caughtLine`, `poser.lineEvery`, `poser.lineTime` |
| Velocidade e aceleração | `speed.base`, `speed.stepEvery` (30 s), `speed.stepFactor` (1,12), `speed.maxMult` |
| Física do herói | `hero.*` (pulo, gravidade, hitbox, tropeço, tempo no buraco, recuperação) |
| Obstáculos | `obstacles.<tipo>` (`w`/`h` hitbox, `drawH` desenho, `weight` frequência) |
| Fase | `level.*` (chances de buraco, plataforma, sequência dupla, camisas) |
| Camisas | `shirts.<id>` (`name`, `color` da camisa lisa, `effect`, `points`, `weight`) e `effects.<efeito>` (tempos e intensidades) |
| Camisa sagrada | `sacredAfter` (s), `sacredChance` |
| Intro | `intro.duration`, `intro.busW`, `intro.poserShout` |
| Limite de partidas | `onePlayPer`: `'visit'` (padrão), `'device'` ou `'none'` |
| Admin | `ADMIN_USER`, `ADMIN_PASS` (ou `ADMIN_PASS_SHA256`), `ADMIN_DELETE_PASSWORD`. **Troque antes de divulgar** (o arquivo é público) |
| Apelidos | `nickPattern`, `nickFilter` (mesma lista dos outros jogos) |
| QR code de uso único | `ticket` (veja § 5) |
| Áudio | `musicVolume`, `sfxVolume`, `musicTempo` |

Admin: `/?admin=true` ou segurar o ônibus da tela de título por 3 s. Mesmo painel dos outros jogos (estatísticas, placar, CSV,
banir, limpar, reset total; o reset também libera a "partida já jogada" do aparelho).

---

### Selo "Produzido por Montaggio" (`montaggio`)

Rodapé discreto com o logotipo da Montaggio e, ao lado, o convite **"Quero um jogo para o meu negócio"**, que abre o
WhatsApp da Montaggio ((69) 9363-0689) com a mensagem pronta *"Olá, quero um jogo para o meu negócio!"* em nova aba.
Aparece só nas telas fora da partida (início (embaixo do menu), fim de jogo, nome gravado e ranking), no fim de cada tela, dentro do fluxo: não cobre o jogo, a HUD nem os
controles de toque, e respeita a safe-area (fica dentro do padding das telas). Quando não cabe numa linha, empilha
(logo em cima, convite embaixo). O código é `montaggio-selo.js`, **idêntico** na raiz e nas pastas dos jogos (como o
`analytics.js`; os painéis usam o da raiz). O logotipo é SVG (Bricolage Grotesque ExtraBold), não depende de fonte nem de internet.

| Chave | Para quê |
|---|---|
| `montaggio.enabled` | `false` tira o selo |
| `montaggio.cta` | `false` deixa só o logo, sem o convite |
| `montaggio.ctaText` / `message` | texto do convite / mensagem que já vem escrita no WhatsApp |
| `montaggio.whatsapp` | número só com dígitos (55 + DDD) |
| `montaggio.siteUrl` | se preenchido, o logo vira link |
| `montaggio.places` | em quais telas entra (`in`), tom do texto (`tone`: `light`/`dark`) e `align: 'left'` |

### Tela cheia (`fullscreen`)

Padrão de todos os jogos, explicado em [`TELA-CHEIA.md`](../TELA-CHEIA.md) (`fullscreen.js` idêntico em todas as pastas).
Android e iPad: tela cheia de verdade no 1º toque e no botão de começar, travando na horizontal (no computador não muda nada: `devices: 'touch'`).
iPhone/Safari: não existe tela cheia para páginas; lá entra a tela cheia suave (abaixo).
Nenhum aviso de "Adicionar à Tela de Início" aparece, em momento algum.
Opções em `CONFIG.fullscreen` (`enabled`, `onFirstTouch`, `devices`, `orientation`, `blockZoom`).

### Tela cheia suave no iPhone (`softFullscreen`)

`soft-fullscreen.js` (idêntico nos jogos deitados; padrão em [`TELA-CHEIA.md`](../TELA-CHEIA.md#tela-cheia-suave-no-iphone-jogos-deitados)).
Só no iPhone (Safari e outros navegadores do iOS sem Fullscreen API), fora da Tela de Início e fora de Instagram/Facebook/TikTok:
com a barra do Safari à mostra, o jogo fica parado com a dica "Deslize para cima para jogar em tela cheia"; o jogador desliza, a
barra recolhe e o jogo liga. Se a barra voltar, a partida pausa (e retoma sozinha quando ela recolhe de novo); em pé, aparece o aviso
de girar do próprio jogo. Se o som ainda estiver travado, aparece "Toque para começar". Android, iPad e computador: nada muda.
Não é tela cheia de verdade: pode sobrar uma faixa com o domínio e a barra pode voltar com um gesto do sistema.
Opções em `CONFIG.softFullscreen` (`enabled`, textos, `container`, `rotateSelector`, `threshold`, `screenTolerance`, `extraScroll`, `rotateDelay`).

## 3. `localStorage` (prefixo `fp_`)

| Chave | Conteúdo |
|---|---|
| `fp_leaderboard` | até 100 `{ id, nickname, score, level, date, distance, shirts, duration, win }` |
| `fp_stats` | `{ games, totalScore, best, totalDist, totalTime, wins, goals }` |
| `fp_banned`, `fp_player`, `fp_settings` | banidos, recorde/último apelido, som |
| `fp_played` | (sessionStorage com `onePlayPer: 'visit'`) a partida desta abertura já foi jogada |
| `fp_admin_session` | (sessionStorage) login do admin |

O `player_id` do analytics (`ra_pid`) é compartilhado de propósito com os outros jogos do domínio.

---

## 4. Assets (Higgsfield) e como regenerar

Gerados no **Higgsfield** com `gpt_image_2_5` (`quality: high`, `resolution: 1k`, `aspect_ratio: 3:2`, `background: transparent`),
com o bloco de estilo:

> *Retro 1990s hand-drawn theatrical cartoon animation style, bold squash-and-stretch, thick black ink outlines, flat cel shading with one soft shadow tone, satirical caricature, no text, no logos, no brand marks. Fully transparent background.*

| Bruto (`assets/_raw`) | Vira |
|---|---|
| `hero_sheet.png` | `hero.png`: 6 quadros (corrida 1-3, pulo, deslize, derrota) |
| `poser_sheet.png` | `poser.png`: 5 quadros (andar 1-3, explicando, derrotado) |
| `bus.png` | `bus.png` (intro; porta a 89% da largura, `doorX` no manifest) |
| `obstacles_sheet.png` | `ob_amps`, `ob_cables`, `ob_monitor`, `ob_stand`, `ob_truss` |
| `shirts_sheet.png` | `shirt_black/white/red/grey/purple/green` (lisas; o nome da banda é escrito pelo jogo) |
| `fx_sheet.png` | `fx_aura`, `fx_dust`, `fx_bolt`, `fx_notes`, `fx_debris`, `fx_holy` |
| `bg_far.png` | `bg_far.jpg` (festival à noite, parallax que repete espelhado) |

Job id e prompt de cada um ficam em `assets/manifest.json` e em `tools/process_assets.py`.

**Pronto para spritesheets novos:** o jogo lê `frames`, `frameW` e `frameH` do `manifest.json`. Para trocar por uma animação com mais
quadros, gere a folha (quadros numa linha, com espaço entre eles), salve em `assets/_raw/` com o mesmo nome e rode
`python tools/process_assets.py` (requer `pip install pillow numpy scipy`). Ele separa os quadros por regiões conectadas (um pé que
invade o quadro vizinho não é cortado), alinha pelos pés e regrava o manifest. Se algum PNG faltar, o jogo usa um desenho provisório
procedural com o mesmo id e nunca quebra. O modelo não aceita seed: para manter a identidade dos personagens, use a geração anterior
como imagem de referência.

Trilha (riff de metal em Mi com bateria, e a versão "violãozinho" das camisas Beatles/Oasis), solo da vitória e efeitos são
sintetizados no navegador (WebAudio).

---

## 5. Dados, dashboard e QR code

* `analytics.game = 'fuga-do-poser'`, mesmo endpoint `/exec` dos outros jogos. Eventos: `start` (no começo da intro), `milestone`
  (pontos e cada degrau de velocidade como "Fase"), `end` e `save`.
* Coluna `motivo_fim`: `poser` (o Poser alcançou), `vitoria` (Judas Priest) ou `encerrou`. `itens` = camisas pegas,
  `erros` = batidas + quedas, `combo_max` = camisas pegas, `nivel` = fase de velocidade.
* **O Apps Script precisa de nova versão** para aceitar o jogo novo (o `Code.gs` descarta ids desconhecidos):
  cole o `analytics/apps-script/Code.gs` atualizado › salve › **Implantar › Gerenciar implantações › ✏️ › Versão: Nova versão ›
  Implantar** (não "Nova implantação", para o URL `/exec` continuar o mesmo). Depois rode a função `setup` uma vez para a aba
  **Resumo** ganhar a linha do jogo novo. Antes disso, as partidas deste jogo não chegam na planilha.
* `ticket.required` está **`false`**: o link normal é livre, e os links `?qr=` gerados no dashboard são de uso único (1 partida).
  Para exigir QR como nos jogos da Rover, troque para `true` **depois** de publicar a nova versão do Apps Script.

---

## 6. Testes

Executados no Chromium oculto em viewport de celular, com o servidor de teste (`python analytics/dev_server.py`, porta 8790,
token `teste`). Para repetir, abra o console: `__fp` expõe `seed(n)`, `newGame()`, `step(segundos)` (simulação determinística),
`skipIntro()`, `press('jump'|'slide', true|false)`, `shirt(id, dx, y)`, `obstacle(tipo, dx)`, `pit(dx, w)`, `clearLevel()`,
`resetPlayed()`, `G` (estado), `LB`, `exportCSV()`.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Intro | Dura 2,0 s: ônibus chega, herói na porta, pulo do degrau, corrida; o Poser entra com o balão ✔ |
| 2 | Sem tocar em nada | O primeiro perigo é um cabo; o Poser alcança depois de alguns tropeços (`motivo_fim = poser`) ✔ |
| 3 | Amplificador sem pular / pulando | Sem pular, trava e o Poser alcança; pulando, 0 batidas ✔ |
| 4 | Treliça em pé / deslizando | 1 batida em pé, 0 deslizando ✔ |
| 5 | Buraco | Cai, sai do outro lado e a partida continua; pulando, 0 quedas ✔ |
| 6 | Alturas de pulo | simples 141 px, duplo 249 px, curto (soltar cedo) 67 px, High Voltage 191 px ✔ |
| 7 | Camisas | Mayhem: 4 s de lentidão, perde ~40 px a cada 3,5 s. Meshuggah: quebrou amplificador, treliça e cabo, 0 batidas. Slayer: +20 e o logo aparece no canto. Black Sabbath: absorveu o amplificador e a aura sumiu. Beatles: botões trocados ("DESLIZAR?"/"PULAR?") por 2 s e voltam. Judas Priest: vitória, Poser voando, título Metal God Ascended ✔ |
| 8 | Aceleração | 220 → 246 (30 s) → 276 (60 s) → teto 440 px/s ✔ |
| 9 | Bot simples (6 sementes, 844×390) | Partidas de 19 s a 106 s, 3 a 43 camisas, 160 a 1.860 pontos ✔ |
| 9b | Pontuação | 4,3 s + 2 camisas = 40; 10 s = +100 com o "+100" sobre o herói; Painkiller = +20 e vitória ✔ |
| 10 | Apelidos | vazio, `ABCDEFG`, `JOÃO`, `A B`, `<x>`, `P3N1S`, `CU`, `b0sta`, `NAZ1` recusados; `TRVE` gravado como #1 ✔ |
| 11 | Uma partida por abertura | Sem "jogar de novo"; depois da partida o título mostra "✔ PARTIDA JÁ JOGADA", inclusive após recarregar ✔ |
| 12 | Dados | `visit`, `start`, `end` e `save` chegam no servidor de teste com `jogo = fuga-do-poser`, `motivo_fim`, título e posição no ranking ✔ |
| 13 | QR code de uso único | Mesmo link em dois navegadores: A toca em JOGAR e vai para o tutorial; B vê "QR code já usado" ✔ |
| 14 | Responsividade (horizontal) | 740×360, 844×390, 932×430, 860×480 e 1280×720: sem rolagem horizontal; título em duas colunas, tutorial e fim de jogo (resultado à esquerda, apelido à direita) cabem na tela; console limpo ✔ |
| 14b | Celular em pé | 390×844: aparece "Gire o celular para a horizontal" e a partida pausa ✔ |
| 15 | Pentest do QR | Ataques testados com `analytics/dev_server.py` (script de pentest em Chromium, 09/11/2026): mesmo aparelho jogando de novo, F5, aba duplicada, outro celular com o mesmo link, link sem `?qr=`, `?admin=true`, `ticket.js` bloqueado, contadores zerados no DevTools, pontuação forjada direto no Apps Script (sem QR, com QR e id de aba adivinhado), dois aparelhos tocando ao mesmo tempo | Com QR: 1 partida por QR (F5, aba duplicada, outro celular e corrida bloqueados; a 2ª partida pelo DevTools chega como `bloqueada`). Sem QR o jogo é livre porque `ticket.required` é `false` aqui: para exigir QR, troque para `true` e ponha `'fuga-do-poser': true` em `QR_OBRIGATORIO` no `Code.gs` ✔ |
| 16 | Peso e velocidade | Chromium, 740×360 a 1037×480, 3G simulado (1,6 Mbps, 300 ms) | Sprites, efeitos e fundo em WebP (q90, alfa sem perda): 2.062 → 842 KB por abertura (o resto são os logos das bandas); pronto em 5,6 s no 3G (antes 11,6 s). DPR máximo 2 (`maxPixelRatio`). Console limpo ✔ |

**Não testado em celular físico** (iPhone e Android médio): falta confirmar 60 fps, áudio depois do primeiro toque, safe-area e
multitoque (segurar DESLIZAR e tocar PULAR ao mesmo tempo).

---

### Testes do selo Montaggio (11/11/2026)

Chromium (Playwright), deitado 740×360, 844×390 e 932×430, QR desligado só no teste e coleta de dados bloqueada (nada foi para a planilha).
Selo presente em todas as telas listadas, sem rolagem horizontal, sem sobrepor nenhum botão ou campo, console limpo.
Durante a partida nenhum selo fica visível. Tocar no convite abre nova aba em
`https://wa.me/556993630689?text=Ol%C3%A1%2C%20quero%20um%20jogo%20para%20o%20meu%20neg%C3%B3cio!` e a tela do jogo não muda.
Não testado: celular físico (inclusive o app do WhatsApp abrindo de verdade) e iPhone com notch.

### Testes da tela cheia (12/11/2026)

Chromium (Playwright), deitado 740×360, 844×390 e 932×430, QR e coleta de dados como no `config.js` (nada foi para a planilha), simulação por hooks.
User-agent de Android: um toque pede tela cheia **uma vez**, com `navigationUI: 'hide'`. User-agent de iPhone sem Fullscreen API:
nenhum pedido, nenhum erro e nenhum aviso na tela (inclusive como Instagram e como app instalado). Sem rolagem horizontal, console limpo, partida simulada sem erro.
Não testado: Safari de verdade num iPhone e Android físico.

### Testes da tela cheia suave no iPhone (12/11/2026)

Chromium (Playwright), deitado 740×360, 844×390 e 932×430, envios para o Apps Script
interceptados no teste (nada foi para a planilha), simulação por hooks (`__fp`). A barra do Safari foi simulada mudando a altura
da janela (por exemplo 340 → 390 px), com `screen` de iPhone (390×844).

| Cenário | Resultado |
|---|---|
| Computador, Android, iPhone com Fullscreen API, iPad com Fullscreen API, iPhone pela Tela de Início, iPhone no Instagram | módulo desligado, nada na tela, CSS do jogo intacto; no Android o 1º toque continua pedindo tela cheia (`navigationUI: 'hide'`) ✔ |
| iPhone (iOS 18 e 26), Chrome do iPhone, iPad sem Fullscreen API | liga e mostra a dica ✔ |
| Barra à mostra | dica "Deslize para cima...", página rolável (+200 px), toque atravessa o jogo, loop congelado (o tempo do jogo não anda) ✔ |
| Barra recolhe (+50 px) | `softfs:live`, dica some, `resize` disparado, canvas no tamanho novo, toques voltam ao jogo, `touchmove` bloqueado ✔ |
| Áudio travado | "Toque para começar" aparece; o toque chama `Sound.unlock()` e some ✔ |
| Barra volta no meio da partida | `softfs:idle`, partida pausada, dica de volta, página volta ao topo; recolheu de novo = partida retoma ✔ |
| Celular em pé | aviso de girar do próprio jogo, partida pausada; deitou de novo = `baseH` recalibrado e dica de volta ✔ |
| Abriu já sem barra | liga direto ✔ |
| 740×360 e 932×430 | jogo e canvas na tela toda, sem rolagem horizontal; console sem erros do jogo ✔ |

Não testado: Safari de verdade num iPhone (a checklist manual está no `TELA-CHEIA.md`) e Android físico.

## 7. Pendências antes de divulgar

1. **Marcas de terceiros — conferir com o jurídico antes de circular.** O jogo usa nomes de bandas reais (Judas Priest, Mayhem,
   Meshuggah, Sodom, Sepultura, Slayer, Black Sabbath, AC/DC, Aerosmith, Deep Purple, Venom, Saxon, Opeth, Mastodon, Megadeth,
   Beatles, Oasis) **com os logos oficiais** nas camisas e na tela (decisão do Arthur em 05/11/2026, ciente do risco de marca
   num jogo publicitário público), e as falas do Poser citam Slipknot, Rock in Rio, Iron Maiden e Sweet Child O' Mine. A camisa do Poser tem só uma rosa genérica, sem o nome do
   Guns N' Roses (pedido original). Os nomes ficam em `config.js` e podem ser trocados por bandas fictícias.
2. **Tom:** o tutorial usa "desgraçado" e a Mayhem é tratada como "camisa envenenada" (piada interna do pedido). Ajustável em `texts`.
3. **Senhas do admin** (públicas no `config.js`) e domínio de publicação.
4. **Apps Script:** publicar a nova versão (§ 5) e rodar `setup`.
5. **LGPD:** o jogo envia apelido (se gravado), pontos e tipo de aparelho, sem tela de privacidade, como o Happy Hour.
