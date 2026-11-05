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
tools/process_assets.py converte assets/_raw -> assets/*.png + assets/manifest.json
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

**Não testado em celular físico** (iPhone e Android médio): falta confirmar 60 fps, áudio depois do primeiro toque, safe-area e
multitoque (segurar DESLIZAR e tocar PULAR ao mesmo tempo).

---

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
