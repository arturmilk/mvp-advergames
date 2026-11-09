# Máquina do Mal em: Busão do Rock (advergame 3D mobile, na horizontal)

Jogo de direção arcade em 3D, no estilo "táxi maluco", para a **Máquina do Mal**. É fim de tarde e às 19:00 tem mega show
na loja. O Felipe, dono da loja, está atrasado e precisa levar o ônibus oficial da Máquina do Mal pela cidade para resgatar
**10 lendas do rock** e voltar para a loja antes do tempo acabar. **O jogo é jogado com o celular deitado (horizontal)**; em pé
aparece o aviso para girar e a partida pausa.

* `index.html` único com todo o JS (cidade, física, câmera, HUD, telas, admin, áudio). Única dependência externa:
  **Three.js r128** pelo CDN (`cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`). Sem o CDN o jogo mostra o aviso
  "Não foi possível carregar o motor 3D".
* Texturas geradas no **Higgsfield** e otimizadas em webp (`assets/`, ~460 KB no total). Se alguma não carregar, o jogo desenha
  uma reserva procedural em Canvas com o mesmo id e não quebra.
* **Personagens são placeholders**: as 10 lendas e o Felipe aparecem como um boneco simples (silhueta na cor do personagem, rosto
  com "?" e o nome escrito). As imagens finais entram pelo `config.js` (veja § 3).
* Áudio todo sintetizado com Web Audio: ronco do motor (acompanha a velocidade), buzina, riff de guitarra ao resgatar, sirene nos
  últimos segundos, contagem 3-2-1, trilha de rock e solo da vitória.
* Mesmo modo de operar dos outros jogos: apelido com o mesmo filtro de palavrões, placar local + planilha Google + dashboard, QR code
  de uso único (desligado por padrão), admin.

```
index.html              jogo completo (Three.js + HUD + telas + admin + áudio)
config.js               TODA a configuração (tempo, pontos, física, cidade, personagens e falas, HQ, textos, senhas)
assets/*.webp           texturas (asfalto, calçada, 3 fachadas, loja, céu, ônibus lateral/frente, árvore) + manifest.json
assets/_raw/            imagens originais do Higgsfield (webp q92), fonte para reprocessar
tools/process_textures.py   converte assets/_raw -> assets/*.webp (potência de 2) + ícones
analytics.js, ticket.js cópias idênticas dos arquivos da raiz (coleta de dados e QR code de uso único)
manifest.webmanifest, sw.js   PWA básico (tela cheia, horizontal)
```

Publicado (depois do merge no `main`): https://arturmilk.github.io/mvp-advergames/busao-do-rock/

---

## 1. Como jogar

**Abertura:** HQ em 3 quadros (fanzine, bordas pretas grossas, fundo em retícula). 1) Felipe abrindo a loja; 2) o cartaz
"SHOW DE ROCK HOJE ÀS 19H!" e o relógio marcando 18:00; 3) Felipe ligando o ônibus. O botão **[ COMEÇAR (TELA CHEIA) ]** liga a
tela cheia (e tenta travar na horizontal), libera o áudio e começa a contagem 3-2-1.

| Controle | Celular | Computador |
|---|---|---|
| Virar | segurar **◀** / **▶** (canto inferior esquerdo) | A / D ou ← / → |
| Acelerar | segurar o **pedal ACELERA** (canto inferior direito) | W ou ↑ |
| Freio / ré | segurar **FREIO RÉ** (ao lado do pedal); parado, dá ré | S ou ↓ |
| Buzina | 📯 no topo | H ou Espaço |
| Pausa / som | ⏸ e 🔊 no topo | P ou Esc / M |

Multitoque (virar e acelerar ao mesmo tempo), `touch-action: none` no jogo todo, área de toque maior que o botão, safe-area do
iPhone respeitada. Só toque e segurar, sem swipe. A partida pausa sozinha quando o app perde o foco.

### Regras
* **Tempo:** começa com **90 s** (`time.start`). Cada resgate soma **+15 s** (`time.bonus`) e **+500 pontos** (`points.rescue`).
* **Relógio do jogo:** começa em 18:00 e anda até 19:00, chegando a 19:00 exatamente quando o tempo zera (nunca volta, mesmo
  com o bônus). O céu, as luzes e os letreiros vão do pôr do sol para a noite junto com o relógio.
* **Seta:** seta 3D verde e amarela no topo da tela, girando para apontar o próximo alvo, com a distância em metros e o nome embaixo.
* **Resgate:** o alvo atual fica de pé na calçada, com uma **zona neon pulsante** no chão e uma coluna de luz visível de longe. Basta
  o ônibus encostar na zona (`pickup.radius`, 7,5 m; `pickup.maxSpeed: 0` = não precisa parar). Toca o riff, aparece o balão com a
  fala da lenda e a seta passa para o próximo.
* **Volta para a loja:** depois da 10ª lenda, a seta aponta para a fachada da Máquina do Mal ("TODO MUNDO A BORDO! Volta pra loja!").
* **Vitória:** chegar à zona em frente à loja antes do tempo zerar. A câmera gira em volta da loja com as 10 lendas pulando na
  calçada (o show) e o solo de guitarra. Bônus: **10 pontos por segundo que sobrou** (`points.winPerSecond`).
* **Derrota:** o tempo zera ("Deu 19:00..."). A tela de fim tem **TENTAR NOVAMENTE**.
* A rota (onde cada lenda está) é sorteada a cada partida, com 110 a 240 m entre um resgate e o próximo (`pickup.minDist/maxDist`).
  A cidade é sempre a mesma (`city.seed`), para o jogador aprender o caminho.
* Bater de frente num prédio faz o ônibus quicar para trás e tremer a tela; raspar de lado só freia um pouco.

### Pontos e títulos
500 por lenda + bônus de tempo na vitória. Títulos (`goals`): Motorista de Primeira Viagem (0), Roadie de Respeito (1.500),
Piloto do Apocalipse (3.500), Lenda da Estrada (5.000). Quem vence ganha **O Show Vai Começar!**

### Uma partida por abertura do link?
O briefing pede "tentar novamente", então o padrão aqui é **`onePlayPer: 'none'`** (pode jogar de novo). Para seguir o modelo dos
outros jogos (uma partida por abertura do link), troque para `'visit'`; o botão TENTAR NOVAMENTE some sozinho. `'device'` = uma
partida por aparelho.

---

## 2. Personalizar (`config.js`)

| O quê | Onde |
|---|---|
| Tempo inicial, bônus, aviso final, contagem, relógio | `time.*` |
| Pontos por resgate, bônus da vitória, títulos | `points.*`, `goals`, `winTitle` |
| Física do ônibus (velocidade, aceleração, freio, ré, esterço, inclinação, quique) | `bus.*` |
| Câmera (distância, altura, suavidade, campo de visão) | `camera.*` |
| Cidade (quarteirões, ruas, alturas, praças, postes, árvores, posição da loja, semente) | `city.*` |
| Zona de resgate e distância entre resgates | `pickup.*` |
| Desempenho (resolução máxima, neblina, antialias) | `render.*` |
| Personagens, ordem, cores, falas e imagens | `characters[]` |
| Felipe e a HQ | `felipe`, `comic.panels[]` (legenda, balão, cartaz), `comic.button` |
| Textos das telas | `texts.*` |
| Limite de partidas | `onePlayPer` |
| Admin | `ADMIN_USER`, `ADMIN_PASS` (ou `ADMIN_PASS_SHA256`), `ADMIN_DELETE_PASSWORD`. **Troque antes de divulgar** (o arquivo é público) |
| Apelidos | `nickPattern`, `nickFilter` (mesma lista dos outros jogos) |
| QR code de uso único | `ticket` |
| Áudio | `musicVolume`, `sfxVolume`, `engineVolume`, `musicTempo` |

Admin: `/?admin=true` ou segurar o título da HQ ("Busão do Rock") por 3 s. Mesmo painel dos outros jogos.

---

## 3. Trocar os placeholders pelas imagens finais

Cada lenda e o Felipe têm um campo `image` no `config.js`. Vazio = boneco provisório.

1. Salve a imagem em `busao-do-rock/assets/chars/<id>.webp` (ou `.png`): **personagem em pé, de frente, corpo inteiro, fundo
   transparente**, pés encostando na borda de baixo, sem sobra em volta. Proporção livre (o jogo usa a proporção da imagem; o
   placeholder é 1:2). Tamanho sugerido: 256 × 512 px, webp com transparência (fica com 20 a 60 KB).
2. No `config.js`, preencha o caminho:
   ```js
   { id: 'ozzy', name: 'Ozzy Osbourne', color: '#5B3A8C', image: 'assets/chars/ozzy.webp', line: '...' },
   felipe: { name: 'Felipe', color: '#2B2B2B', image: 'assets/chars/felipe.webp' },
   ```
3. Recarregue. A mesma imagem aparece em pé na calçada (sprite que sempre encara a câmera, estilo Doom), no balão de fala do
   resgate e no show final. A do Felipe aparece nos 3 quadros da HQ.

Se o arquivo não existir ou der erro, volta o placeholder (o jogo nunca quebra). Ids: `ozzy`, `raul`, `kurt`, `chorao`, `rita`,
`purple`, `slipknot`, `sepultura`, `angus`, `axl`, e `felipe`.

---

## 4. `localStorage` (prefixo `br_`)

| Chave | Conteúdo |
|---|---|
| `br_leaderboard` | até 100 `{ id, nickname, score, level, date, legends, duration, win }` |
| `br_stats` | `{ games, totalScore, best, totalLeg, totalTime, wins, goals }` |
| `br_banned`, `br_player`, `br_settings` | banidos, recorde/último apelido, som |
| `br_played` | só com `onePlayPer` `'visit'` (sessionStorage) ou `'device'` |
| `br_admin_session` | (sessionStorage) login do admin |

O `player_id` do analytics (`ra_pid`) é compartilhado de propósito com os outros jogos do domínio.

---

## 5. Texturas (Higgsfield) e como regenerar

Geradas no **Higgsfield** com `gpt_image_2_5` (`quality: high`, `resolution: 1k`), todas em vista ortográfica (sem perspectiva),
paleta de pôr do sol laranja e roxo, **sem logos nem marcas de terceiros** (os letreiros neon dos prédios são formas: raio, guitarra,
estrela, nota). Os únicos textos são o letreiro da própria loja ("Máquina do Mal") e o "SHOW 19H" no letreiro do ônibus.

| Textura | Uso | Arquivo |
|---|---|---|
| `asphalt` | ruas (repete a cada 8 m) | 512², 55 KB |
| `sidewalk` | calçadas | 512², 41 KB |
| `facade_a/b/c` | prédios de tijolo, residencial e escritório, com janelas que acendem à noite | 512×1024, 46 a 65 KB |
| `store` | fachada da Máquina do Mal (e fundo do quadro 1 da HQ) | 1024×512, 64 KB |
| `sky` | céu do crepúsculo em volta da cidade | 1024×512, 27 KB |
| `bus_side`, `bus_front` | ônibus preto e roxo com labaredas (a frente também é o quadro 3 da HQ e o ícone) | 1024×512 e 512², 44 e 39 KB |
| `tree` | árvores (dois planos cruzados) | 256², 16 KB |

Job id e prompt de cada uma ficam em `assets/manifest.json`. Para trocar: gere de novo no Higgsfield (o modelo não aceita seed; use a
geração anterior como imagem de referência para manter o estilo), salve em `assets/_raw/<id>.webp` e rode
`python tools/process_textures.py` (requer `pip install pillow`).

O ônibus é montado em 3D (caixa longa com frente achatada, janelas e labaredas nas laterais, para-brisa grande, rodado duplo atrás,
6 caixas de som no teto, traseira desenhada em Canvas), com farol no chão que acende ao anoitecer.

---

## 6. Dados, dashboard e QR code

* `analytics.game = 'busao-do-rock'`, mesmo endpoint `/exec` dos outros jogos. Eventos: `start` (ao tocar em COMEÇAR),
  `milestone` (cada lenda resgatada vira "nível" com o nome dela; pontos nos marcos 500, 1.500, 2.500, 3.500, 5.000 e 6.000),
  `end` e `save`.
* Colunas: `motivo_fim` = `vitoria`, `tempo` ou `encerrou`; `nivel` e `itens` = lendas resgatadas; `erros` = batidas de frente;
  `meta` = título.
* **Pendente (não feito neste PR, de propósito):** o `Code.gs` descarta ids desconhecidos. É preciso acrescentar
  `'busao-do-rock': 'Máquina do Mal em: Busão do Rock'` na constante `GAMES` do `analytics/apps-script/Code.gs` (e do
  `analytics/dev_server.py`), colar no Apps Script › salvar › **Implantar › Gerenciar implantações › ✏️ › Versão: Nova versão ›
  Implantar** (não "Nova implantação", para o URL `/exec` continuar o mesmo), rodar `setup` uma vez e incluir o jogo nos filtros do
  dashboard. Antes disso, as partidas deste jogo **não chegam na planilha**.
* `ticket.required` está **`false`**. Para exigir QR, troque para `true` só depois da nova versão do Apps Script.

---

## 7. Testes

Executados no Chromium oculto (WebGL por software) em viewport de celular deitado, com o Three.js r128 servido localmente no lugar
do CDN (o ambiente de teste não acessa o cdnjs). Para repetir, abra o console: `__bus` expõe `seed(n)`, `newGame()`,
`step(segundos)` (simulação determinística com passo fixo de 1/60 s), `skipCount()`, `press('gas'|'brake'|'left'|'right', true|false)`,
`teleport(x, z, rumo)`, `nearTarget(m)` (põe o ônibus na rua, m metros antes do alvo), `curTarget()`, `render()`, `drawCalls()`,
`G` (estado), `W` (mundo), `LB`, `exportCSV()`, `resetPlayed()`.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Abertura | HQ com os 3 quadros, balões e o botão COMEÇAR; toque real no botão inicia a contagem 3-2-1 (a tela cheia é recusada no navegador oculto, sem erro) ✔ |
| 2 | Aceleração e curva | Pedal no fundo: ~4 s até 97 km/h; segurar ▶ vira à direita e o ônibus inclina ✔ |
| 3 | Batida | De frente contra um quarteirão: 1 batida, o ônibus quica e não entra no prédio ✔ |
| 4 | Resgate dirigindo | Ônibus a 25 m, acelerando até a zona: +500 pts, +15 s, balão do Ozzy, seta passa para o Raul Seixas ✔ |
| 5 | Rota completa e vitória | 10 resgates, a seta aponta para a loja, chegada na zona: `vitoria`, bônus de tempo, câmera em volta da loja com as 10 lendas, tela de fim ✔ |
| 6 | Derrota | Sem dirigir: 60 s depois o relógio marca 18:40 e o céu escurece; aos 90 s "Deu 19:00...", relógio em 19:00, sirene nos 10 s finais, botão TENTAR NOVAMENTE ✔ |
| 7 | Apelidos | `P3N1S` recusado; `rock` gravado como ROCK, #1 ✔ |
| 8 | Dados | Com o servidor de teste aceitando `busao-do-rock`: `start`, 3 marcos de lenda, marcos de pontos, `end` (`motivo_fim = tempo`, `nivel = 3`, título) e `save` (apelido e posição) chegam ✔ |
| 9 | Responsividade (horizontal) | 740×360, 844×390, 932×430 e 1000×480: HQ, HUD, controles e tela de fim cabem sem rolagem horizontal; console limpo ✔ |
| 9b | Celular em pé | 390×844: aparece "Gire o celular para a horizontal" ✔ |
| 10 | Desempenho | 30 draw calls por quadro e ~19 mil triângulos (cidade inteira mesclada por material, rodas instanciadas, sem sombras dinâmicas, resolução máxima 1,5×) ✔ |
| 11 | Cache e QR | Service worker novo; pentest do QR (mesmos ataques da Fuga) | O `three.js` da cdnjs (149 KB) fica no cache do aparelho e a 2ª abertura funciona offline. QR: 1 partida por QR; sem QR o jogo é livre (`ticket.required: false`) ✔ |

**Não testado em celular físico** (iPhone e Android médio): falta confirmar fps, aquecimento, áudio depois do toque, tela cheia
(o iPhone não tem tela cheia de verdade no Safari; o jogo segue normal sem ela), safe-area e multitoque (virar e acelerar juntos).

---

## 8. Pendências antes de divulgar

1. **Pessoas reais e falas — conferir com o jurídico antes de circular.** O jogo usa nomes de artistas reais (Ozzy Osbourne,
   Raul Seixas, Kurt Cobain, Chorão, Rita Lee, Angus Young, Axl Rose) e de bandas (Charlie Brown Jr., Deep Purple, Slipknot,
   Sepultura, AC/DC) e atribui a eles **falas cômicas inventadas** num jogo publicitário. Vários já faleceram (direitos de imagem e
   de personalidade ficam com os herdeiros). As falas e os nomes ficam no `config.js` e podem virar personagens fictícios.
   As imagens finais dos personagens também precisam de autorização (nada de retrato fiel nem foto).
2. **Felipe:** pessoa real (dono da loja); confirmar a autorização para o personagem e o nome.
3. **Tom:** o balão do quadro 2 diz "Puta merda!" (texto do briefing). Ajustável em `comic.panels[1].line`.
4. **Apps Script:** registrar o id `busao-do-rock` em `GAMES`, publicar nova versão e incluir no dashboard (§ 6).
5. **Senhas do admin** (públicas no `config.js`).
6. **LGPD:** o jogo envia apelido (se gravado), pontos e tipo de aparelho, sem tela de privacidade, como os outros jogos.
7. **Dependência de CDN:** o Three.js vem do cdnjs; sem internet na primeira visita o jogo não abre (as texturas e o resto ficam
   no cache do PWA).
