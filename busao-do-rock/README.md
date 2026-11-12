# Máquina do Mal em: Busão do Rock (advergame 3D mobile, na horizontal)

Jogo de direção arcade em 3D, no estilo "táxi maluco", para a **Máquina do Mal**. É fim de tarde e às 19:00 tem mega show
na loja. O Felipe, dono da loja, está atrasado e precisa levar o ônibus oficial da Máquina do Mal pela cidade para resgatar
**10 lendas do rock** e voltar para a loja antes do tempo acabar. **O jogo é jogado com o celular deitado (horizontal)**; em pé
aparece o aviso para girar e a partida pausa.

* `index.html` único com todo o JS (cidade, física, câmera, HUD, telas, admin, áudio). Única dependência externa:
  **Three.js r128** pelo CDN (`cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`). Sem o CDN o jogo mostra o aviso
  "Não foi possível carregar o motor 3D".
* Texturas, fachada da loja e HQ de abertura geradas no **Higgsfield** e otimizadas em webp. Se alguma não carregar, o jogo desenha
  uma reserva procedural em Canvas com o mesmo id e não quebra.
* **Lendas:** 9 sprites recortados (pasta `sprites` do Felipe), padronizados no mesmo canvas em `assets/chars/*.webp` (veja § 3).
  A Rita Lee ainda não tem imagem e segue com o boneco provisório. O Felipe aparece só na HQ, já desenhado nos quadros.
* **Peso dos assets do jogo:** ~1,2 MB em webp (texturas ~420 KB, fachada nova 123 KB, sprites 330 KB, HQ 337 KB).
* **Som do motor:** segurando o acelerador o ronco sobe marcha a marcha (4 marchas, com a queda de giro e um estalo em cada troca) e
  só chega no pico depois de **10 s** (`engineSound.rampSec`, fatias de cada marcha em `engineSound.gears`). Soltando, o giro cai.
* **Trilha:** riff **original** de hard rock em Mi (power chords com palhetada abafada e galope, bateria cheia com bumbo em todo tempo,
  chimbal em semicolcheias, prato na virada e uma frase curta de guitarra solo, 176 bpm), no clima de
  banda pesada dos anos 70 pedido como referência, **sem copiar nenhuma música** (direito autoral). Volume em `musicVolume`, andamento
  em `musicTempo`; o botão de som da HUD tira tudo.
* Áudio todo sintetizado com Web Audio: ronco do motor (acompanha a velocidade), buzina, riff de guitarra ao resgatar, sirene nos
  últimos segundos, contagem 3-2-1, trilha de rock e solo da vitória.
* Mesmo modo de operar dos outros jogos: apelido com o mesmo filtro de palavrões, placar local + planilha Google + dashboard, QR code
  de uso único (desligado por padrão), admin.

```
index.html              jogo completo (Three.js + HUD + telas + admin + áudio)
config.js               TODA a configuração (tempo, pontos, física, cidade, personagens e falas, HQ, textos, senhas)
assets/*.webp           texturas (asfalto, calçada, 3 fachadas, loja, céu, ônibus lateral/frente, árvore) + manifest.json
assets/chars/*.webp     sprites das lendas (canvas 1024×512 igual para todos, fundo transparente)
assets/comic/p1..p3.webp  quadros da HQ de abertura (600×600)
assets/_raw/            originais (Higgsfield em webp q92, sprites em PNG com os nomes da pasta sprites), fonte para reprocessar
assets/_raw/refs/       fotos de referência do Felipe e da fachada (FORA do git, .gitignore: pessoa real)
tools/process_textures.py   converte assets/_raw -> assets/*.webp (potência de 2) + quadros da HQ + ícones
tools/process_sprites.py    padroniza assets/_raw/chars/*.png -> assets/chars/<id>.webp
analytics.js, ticket.js cópias idênticas dos arquivos da raiz (coleta de dados e QR code de uso único)
manifest.webmanifest, sw.js   PWA básico (tela cheia, horizontal)
```

Publicado (depois do merge no `main`): https://arturmilk.github.io/mvp-advergames/busao-do-rock/

---

## 1. Como jogar

**Abertura (atual):** a HQ é uma sequência de **3 slides**, um quadro por vez, com o botão **PRÓXIMO** (ou toque no quadro) até o
último, que vira **COMEÇAR**. Todo o texto (legendas, balões, o relógio às 18h45 e o cartaz **"WACKEN PVH ÀS 19H"**) está **desenhado
na própria arte** (`assets/comic/s1..s3.webp`, Higgsfield), para não depender de fonte nem do modo escuro do celular. 1) "Fim de
tarde."; 2) "Já são 18h45!"; 3) "Garagem da loja." com "VRUUUM!". Para mudar um texto é preciso gerar a imagem de novo (prompts no
`assets/manifest.json`). **"Wacken" é marca de um festival real: conferir com o jurídico antes de divulgar.**

**Felipe forte (09/11):** a pedido do Arthur, o Felipe ficou bem mais forte (ombros, braços e peito de super-herói, mesmo rosto, óculos e barba). A tela de girar o celular é a **referência oficial** do personagem (job no `assets/manifest.json`); os 3 slides foram refeitos a partir dela com o mesmo texto. As versões anteriores ficaram em `_raw/` com `_v1`.

**Celular em pé:** no lugar do aviso de texto, aparece o Felipe desenhado virando o celular: "Deita esse celular aí, roqueiro! Busão não
anda em pé." (`assets/rotate.webp`, texto na arte).

**Abertura (versão anterior, ainda no código como reserva):** HQ em 3 quadros no estilo Marvel anos 70/80 (traço preto grosso, cores chapadas, retícula Ben-Day e papel de
jornal impresso por cima), arte do Higgsfield em `assets/comic/`. 1) Felipe abrindo a Máquina do Mal ao pôr do sol, olhando o
relógio; 2) Felipe desesperado dentro da loja, com o cartaz "SHOW DE ROCK HOJE ÀS 19H!" e o relógio marcando 18:00; 3) o ônibus
saindo da garagem com o Felipe ao volante. Legendas, balões, cartaz e relógio são HTML por cima (texto editável no `config.js`,
nítido em qualquer tela). Sem a arte, volta o quadro montado com a fachada/ônibus e o boneco do Felipe. O botão **[ COMEÇAR (TELA CHEIA) ]** liga a
tela cheia (e tenta travar na horizontal), libera o áudio e começa a contagem 3-2-1.

| Controle | Celular | Computador |
|---|---|---|
| Virar | segurar as setas **esquerda / direita** (canto inferior esquerdo) | A / D ou ← / → |
| Acelerar | segurar o pedal com a **seta para cima** (canto inferior direito) | W ou ↑ |
| Freio / ré | segurar o pedal com a **seta para baixo** (ao lado); parado, dá ré | S ou ↓ |
| Buzina | 📯 no topo | H ou Espaço |
| Pausa / som | ⏸ e 🔊 no topo | P ou Esc / M |

Multitoque (virar e acelerar ao mesmo tempo), `touch-action: none` no jogo todo, área de toque maior que o botão, safe-area do
iPhone respeitada. Só toque e segurar, sem swipe. A partida pausa sozinha quando o app perde o foco.

### Regras
* **Tempo:** começa com **30 s** (`time.start`). Cada resgate soma **+10 s** (`time.bonus`) e **+10 pontos** (`points.rescue`).
  **O cronômetro só começa a contar depois que a 1ª lenda embarca** (`time.startOnFirstPickup: true`): até lá ele fica parado em 0:30 na
  HUD e o relógio do jogo parado em 18:00. A **1ª lenda** aparece mais perto da largada, a **60–120 m** (`pickup.firstMinDist/firstMaxDist`);
  as outras seguem a 110–240 m uma da outra (`pickup.minDist/maxDist`). Se ficar difícil demais, o ajuste mais suave é subir
  `time.start` para 40 ou baixar `pickup.maxDist`.
* **Calçada e batidas:** o ônibus pode subir na calçada (sobe 25 cm). O que bloqueia é o prédio (miolo do quarteirão), os **postes** e as
  **árvores**: bater de frente em qualquer um deles **para o ônibus** (`bus.hitStop`); raspar de lado só freia um pouco. Praças e o
  estacionamento da loja são livres (só as árvores e o prédio da loja bloqueiam).
* **Drift** (`drift`): acima de 55% da velocidade máxima (~53 km/h), virando e segurando o **freio**, a traseira escorrega (o bico vira mais
  rápido que a direção do movimento), o freio segura só 22% e os pneus chiam (ruído filtrado no Web Audio, volume pelo tamanho da derrapada).
* **Contagem:** antes de largar aparece 3, 2, 1 e VAI! numa placa preta de stencil com um estouro de raios girando (o VAI! em vermelho).
* **Provocações** (`taunts`): quando faltam **15, 8 e 3 s**, a próxima lenda a ser buscada aparece num balão amarelo com uma das
  frases da lista (sem repetir até usar todas). Se um resgate devolver tempo, o marco volta a valer.
* **Fim da partida:** quem zera vê "Parabéns! Você zerou o Busão do Rock!" (`texts.winTitle`). Quem não zera vê as lendas que
  ficaram para trás e a primeira delas reclama: "Me deixou aqui esperando? Aí não, né. Compra mais alguma coisa e tenta de novo."
  (`texts.missedLine`).
* **Relógio do jogo:** começa em 18:00 e anda até 19:00, chegando a 19:00 exatamente quando o tempo zera (nunca volta, mesmo
  com o bônus). O céu, as luzes e os letreiros vão do pôr do sol para a noite junto com o relógio.
* **Seta:** seta 3D verde e amarela no topo da tela, girando para apontar o próximo alvo, com a distância em metros e o nome embaixo.
* **Resgate:** o alvo atual fica de pé na calçada, com uma **zona neon pulsante** no chão e uma coluna de luz visível de longe. Basta
  o ônibus encostar na zona (`pickup.radius`, 7,5 m; `pickup.maxSpeed: 0` = não precisa parar). Toca o riff, aparece o balão com a
  fala da lenda e a seta passa para o próximo.
* **Volta para a loja:** depois da 10ª lenda, a seta aponta para a fachada da Máquina do Mal ("TODO MUNDO A BORDO! Volta pra loja!").
* **Vitória:** chegar à zona em frente à loja antes do tempo zerar. A câmera gira em volta da loja com as 10 lendas pulando na
  calçada (o show) e o solo de guitarra. Bônus: **1 ponto por segundo que sobrou** (`points.winPerSecond`).
* **Derrota:** o tempo zera ("Deu 19:00..."). A tela de fim tem **TENTAR NOVAMENTE**.
* A rota (onde cada lenda está) é sorteada a cada partida: a 1ª a 60–120 m da largada e as outras com 110 a 240 m entre um resgate e
  o próximo (`pickup.minDist/maxDist`). A **ordem** das lendas é a da lista `characters` do `config.js`: Raul Seixas primeiro e
  **Ozzy Osbourne por último**.
  A cidade é sempre a mesma (`city.seed`), para o jogador aprender o caminho.
* Bater de frente num prédio faz o ônibus quicar para trás e tremer a tela; raspar de lado só freia um pouco.

### Pontos e títulos
10 por lenda (máximo 100) + 1 ponto por segundo que sobrou na vitória. Títulos (`goals`): Motorista de Primeira Viagem (0),
Roadie de Respeito (30 = 3 lendas), Piloto do Apocalipse (60), Lenda da Estrada (100 = as 10 lendas). Quem vence ganha
**O Show Vai Começar!**

### Onde fica cada coisa na tela (a pista e o horizonte ficam sempre livres)
* **Alto, à esquerda:** logo, tempo (sem rótulo), barra de tempo, horário do jogo (18:00→19:00) e **velocímetro**.
* **Alto, à direita:** buzina, som, pausa, pontos e lendas.
* **Alto, no meio:** a seta 3D (menor, `hud.arrowScale`), a distância e, por 1,5 s, o letreiro do resgate. O aviso "TODO MUNDO A BORDO!"
  também aparece no alto.
* **Embaixo, no meio:** o nome do próximo alvo ("2/10 · RAUL SEIXAS") e, quando a lenda fala (resgate ou provocação), um balão compacto
  entre as setas e os pedais. Ele pode cobrir a traseira do ônibus por alguns segundos, mas nunca a pista à frente nem o horizonte.

### Tela cheia
`fullscreenOnTouch: true`: o primeiro toque em **qualquer lugar** da tela liga a tela cheia (e trava na horizontal onde o navegador deixa).
Funciona no Android (Chrome, Samsung Internet) e no computador. **No iPhone o Safari não tem tela cheia para páginas** (só para vídeo): lá
o jeito é o jogador tocar em Compartilhar › **Adicionar à Tela de Início** e abrir pelo ícone, que abre sem as barras do Safari (o
`manifest.webmanifest` e as metas `apple-mobile-web-app-*` já estão prontos). No iPad o Safari aceita a tela cheia normal.

### QR code
`ticket.quietWait: true`: o jogo confere e valida o QR **sem** a tela "Conferindo/Validando o QR code" (a regra de uma partida por QR e os
avisos de QR usado, inválido ou cancelado continuam iguais). A opção é nova no `ticket.js` (as 4 cópias continuam idênticas); nos outros
jogos ela fica desligada.

### HUD (visual)
Referência de clima: games de skate do fim dos anos 90 (pôster de show xerocado, fita crepe, stencil, letreiro de manobra), sem copiar
fonte, logo ou elemento de nenhum jogo. Sem gradiente "de app", sem vidro fosco, sem emoji: tudo chapado, com sombra dura e granulado.
* **Fontes** (Google Fonts, com reserva do sistema se não carregar): Anton para números e títulos, Special Elite (máquina de escrever)
  para rótulos, UnifrakturMaguntia para o logo provisório.
* **Esquerda:** logo da Máquina do Mal; placa de TEMPO inclinada com número grande (pisca em vermelho nos 10 s finais) e barra de tempo
  listrada (cheia = `time.meterMax`, 60 s); relógio 18:00→19:00 numa tira de fita crepe.
* **Direita:** buzina, som e pausa (ícones SVG desenhados à mão no código); PONTOS em número grande; LENDAS com 10 riscos de contagem.
* **Resgate:** letreiro de manobra embaixo no meio ("RESGATE: OZZY OSBOURNE", "+10 PTS +10 S"), o tempo e os pontos dão um tranco, e a
  fala da lenda aparece num flyer preso com fita.
* **Controles:** setas em placas pretas com contorno; pedais com etiqueta de fita amarela; velocímetro no meio, embaixo.
* **Telas** (HQ, como jogar, fim, ranking, pausa): botões e cartões com cantos secos, papel granulado e sombra dura.

### Logo
`config.js > logo`. Não havia arquivo do logo na pasta: por enquanto ele é **provisório**, o nome "Máquina do Mal" em letra gótica
(parecida com a do letreiro da loja) numa placa preta. Para usar o oficial: salve `assets/logo.png` (fundo transparente) e ponha
`logo: { image: 'assets/logo.png', text: 'Máquina do Mal' }`. Ele aparece na HUD e no título da tela inicial.

### Uma partida por abertura do link?
O briefing pede "tentar novamente", então o padrão aqui é **`onePlayPer: 'none'`** (pode jogar de novo). Para seguir o modelo dos
outros jogos (uma partida por abertura do link), troque para `'visit'`; o botão TENTAR NOVAMENTE some sozinho. `'device'` = uma
partida por aparelho.

---

## 2. Personalizar (`config.js`)

| O quê | Onde |
|---|---|
| Tempo inicial, bônus, aviso final, contagem, relógio, cronômetro só depois da 1ª lenda | `time.*` (`startOnFirstPickup`) |
| Pontos por resgate, bônus da vitória, títulos | `points.*`, `goals`, `winTitle` |
| Física do ônibus (velocidade, aceleração, freio, ré, esterço, inclinação, quique) | `bus.*` |
| Câmera (distância, altura, suavidade, campo de visão; mais alta e afastada desde 09/11, e **dinâmica**: com velocidade se afasta, sobe, olha mais à frente e abre o campo de visão — `speedDistance`, `speedHeight`, `speedLookAhead`, `speedFov`) | `camera.*` |
| Cidade (quarteirões, ruas, alturas, praças, postes, árvores, posição da loja, semente) | `city.*` |
| Zona de resgate, distância entre resgates e da 1ª lenda até a largada | `pickup.*` (`firstMinDist/firstMaxDist`) |
| Desempenho (resolução máxima, neblina, antialias) | `render.*` |
| Personagens, ordem, cores, falas e imagens | `characters[]` |
| Altura das lendas em pé na calçada | `charHeight` (m, padrão 4,2; o ônibus tem ~3,4) |
| Felipe e a HQ | `felipe`, `comic.panels[]` (legenda, `image`, balão, cartaz), `comic.button` |
| Textos das telas | `texts.*` |
| Limite de partidas | `onePlayPer` |
| Admin | `ADMIN_USER`, `ADMIN_PASS` (ou `ADMIN_PASS_SHA256`), `ADMIN_DELETE_PASSWORD`. **Troque antes de divulgar** (o arquivo é público) |
| Apelidos | `nickPattern`, `nickFilter` (mesma lista dos outros jogos) |
| QR code de uso único | `ticket` |
| Áudio | `musicVolume`, `sfxVolume`, `engineVolume`, `musicTempo` |

Admin: `/?admin=true` ou segurar o título da HQ ("Busão do Rock") por 3 s. Mesmo painel dos outros jogos.

---

### Selo "Produzido por Montaggio" (`montaggio`)

Rodapé discreto com o logotipo da Montaggio e, ao lado, o convite **"Quero um jogo para o meu negócio"**, que abre o
WhatsApp da Montaggio ((69) 9363-0689) com a mensagem pronta *"Olá, quero um jogo para o meu negócio!"* em nova aba.
Aparece só nas telas fora da partida (HQ de abertura (embaixo do botão, alinhado à esquerda), fim de jogo, nome gravado e ranking), no fim de cada tela, dentro do fluxo: não cobre o jogo, a HUD nem os
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

## 3. Sprites das lendas

Cada lenda tem um campo `image` no `config.js`. Vazio = boneco provisório (hoje só a **Rita Lee**).

| id | Nome | Arquivo original (pasta `sprites`) | Sprite |
|---|---|---|---|
| `ozzy` | Ozzy Osbourne | `ozzy.png` | 15 KB |
| `raul` | Raul Seixas | `raul seixas.png` | 20 KB |
| `kurt` | Kurt Cobain | `kurtcobain.png` | 27 KB |
| `chorao` | Chorão | `chorao.png` (o `chorao.jpg` de fundo verde é a mesma foto, não foi usado) | 21 KB |
| `soad` | System of a Down | `soad.png` | 64 KB |
| `slipknot` | Slipknot | `slipknot.png` | 89 KB |
| `sepultura` | Sepultura | `SEPULTURA.png` | 39 KB |
| `angus` | Angus Young | `angus young.png` | 33 KB |
| `axl` | Axl Rose | `axlr.png` | 20 KB |
| `rita` | Rita Lee | (falta) | boneco |

* **Deep Purple saiu** da lista (não havia sprite) e entrou o **System of a Down** no mesmo lugar da ordem, com a fala
  "Wake up! Esse busão demorou mais que fila de show!".
* **Padrão:** `python tools/process_sprites.py` recorta a sobra transparente, encaixa a figura num canvas **1024×512** igual para
  todos (potência de 2), centraliza, encosta os pés na borda de baixo e salva webp com alpha (q72). Como o canvas é o mesmo, todas
  as lendas saem na mesma escala no jogo (altura `charHeight`); bandas largas (Slipknot, SOAD) também ocupam a altura toda.
* **Para trocar ou acrescentar:** salve o PNG com fundo transparente em `assets/_raw/chars/`, ponha o par `id: 'arquivo.png'` em
  `SPRITES` no script, rode o script e preencha `image: 'assets/chars/<id>.webp'` no `config.js`.
* A mesma imagem aparece em pé na calçada (sprite que sempre encara a câmera), no retrato do balão de fala (recorte do meio, onde
  fica a pessoa) e no show final em frente à loja (em duas fileiras).
* Ozzy e Sepultura vieram recortados da cintura/joelho para cima: na calçada eles "brotam" do chão. Para ficar perfeito, use
  recortes de corpo inteiro.
* Os pontos de embarque não têm mais árvore na frente (a copa escondia a lenda). Isso tirou algumas árvores da calçada.

> **Atenção (direito de imagem):** os sprites são **fotos recortadas de artistas reais** (e fotos de terceiros). Nos outros jogos a
> regra é usar personagem estilizado, nunca retrato. Antes de divulgar, **conferir com o jurídico** o uso de nome e imagem desses
> artistas numa peça promocional da loja; a alternativa segura é trocar por versões caricatas/estilizadas.

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
| `store` | fachada da Máquina do Mal, refeita a partir da **foto da loja real** (letreiro gótico, vitrines com guitarras e discos, grafites genéricos no lugar dos murais) | 1024×512, 123 KB |
| `sky` | céu do crepúsculo em volta da cidade | 1024×512, 27 KB |
| `bus_side`, `bus_front` | ônibus preto e roxo com labaredas (a frente também é o quadro 3 da HQ e o ícone) | 1024×512 e 512², 44 e 39 KB |
| `tree` | árvores (dois planos cruzados) | 256², 16 KB |

**HQ de abertura** (`assets/comic/p1..p3.webp`, 600×600, ~100 a 125 KB cada): gerada com o mesmo modelo, usando 2 fotos do Felipe
e a foto da fachada como referência para o quadro 1; o quadro 1 escolhido serviu de referência para os quadros 2 e 3 e para a fachada
do jogo (o modelo não aceita seed). O Felipe é um personagem desenhado, não um retrato. Os murais reais da fachada (que têm
personagem de terceiros) foram trocados por grafite genérico. As fotos de referência ficam em `assets/_raw/refs/`, fora do git.

Job id e prompt de cada uma ficam em `assets/manifest.json` (`textures`, `comic` e `characters`). Para trocar: gere de novo no Higgsfield (o modelo não aceita seed; use a
geração anterior como imagem de referência para manter o estilo), salve em `assets/_raw/<id>.webp` e rode
`python tools/process_textures.py` (requer `pip install pillow`).

O ônibus não tem mais o letreiro "ROCK" na traseira. O ônibus é montado em 3D (caixa longa com frente achatada, janelas e labaredas nas laterais, para-brisa grande, rodado duplo atrás,
6 caixas de som no teto, traseira desenhada em Canvas), com farol no chão que acende ao anoitecer.

---

## 6. Dados, dashboard e QR code

* `analytics.game = 'busao-do-rock'`, mesmo endpoint `/exec` dos outros jogos. Eventos: `start` (ao tocar em COMEÇAR),
  `milestone` (cada lenda resgatada vira "nível" com o nome dela; pontos nos marcos 30, 60, 100 e 120),
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

### Testes da tirinha e dos sprites (09/11/2026)

Chromium (Playwright) e o navegador do app, deitado, com a coleta de dados **bloqueada no teste** (nada foi para a planilha).

| # | Cenário | Resultado |
|---|---|---|
| 11 | HQ com arte | 740×360, 932×430 e 1000×480: os 3 quadros carregam a arte, balões, cartaz e relógio legíveis e sem cobrir o rosto do Felipe, sem rolagem horizontal ✔ |
| 12 | Lenda na calçada | Ozzy em pé no ponto de embarque, visível de ~40 m (cerca de 8% da altura da tela) e de ~18 m ✔ |
| 13 | Balão de fala | Retrato do Ozzy recortado no meio do canvas, nome e fala ✔ |
| 14 | Show final | 10 resgates e chegada: as 9 lendas com sprite + Rita (boneco) em duas fileiras em frente à fachada nova ✔ |
| 15 | Console | Sem erros nem avisos nas 3 resoluções ✔ |

### Testes da dificuldade e da HUD nova (09/11/2026)

Chromium (Playwright), deitado, coleta de dados bloqueada no teste.

| # | Cenário | Resultado |
|---|---|---|
| 16 | Começo | `__bus.newGame()`: `timeLeft` = 40, pontos 0 ✔ |
| 17 | Ganho de tempo | Resgate dirigindo até a zona: +10 s e +10 pontos, letreiro "RESGATE: OZZY OSBOURNE +10 PTS +10 S", balão da fala ✔ |
| 18 | Fim do tempo | Sem dirigir: aos 30 s faltam 10 s (TEMPO pisca, barra vermelha); aos 40 s "Deu 19:00...", `motivo_fim = tempo`, relógio em 19:00 ✔ |
| 19 | Layout | 740×360, 932×430 e 1000×480: HUD, balão, letreiro, controles, HQ e tela de fim sem sobreposição e sem rolagem horizontal ✔ |
| 20 | Console | Sem erros nem avisos ✔ |

### Testes da rodada 3 (09/11/2026)

Chromium (Playwright), deitado, coleta de dados bloqueada no teste.

| # | Cenário | Resultado |
|---|---|---|
| 21 | Slides | Quadro 1 → PRÓXIMO → 2 → PRÓXIMO → 3 → COMEÇAR; textos legíveis na arte em 740×360, 932×430 e 1000×480 ✔ |
| 22 | Contagem | 3-2-1-VAI! com a placa e os raios ✔ |
| 23 | Provocações | Aos 15 s a próxima lenda (Ozzy) fala uma frase; aos 8 s outra, sem repetir ✔ |
| 24 | Fim sem zerar | 1 lenda: aparecem as 9 que faltaram e o Raul Seixas reclama; em telas baixas os números somem para caber ✔ |
| 25 | Vitória | "Parabéns! Você zerou o Busão do Rock!" ✔ |
| 26 | Celular em pé | 390×844: imagem do Felipe pedindo para deitar o celular ✔ |
| 27 | Motor | Acelerador seguro: troca de marcha em ~2, ~4 e ~7 s, pico em ~10 s; soltando, o giro cai (medido no navegador oculto, que roda mais devagar) ✔ |
| 28 | Console e rolagem | Sem erros, sem rolagem horizontal ✔ |

A música e o som do motor foram conferidos pelos números (marchas e tempos); **ninguém ouviu ainda**: vale escutar no celular.

### Testes da rodada 4 (09/11/2026)

| # | Cenário | Resultado |
|---|---|---|
| 29 | Layout | 740×360, 932×430 e 1000×480: balão da lenda embaixo entre os controles (ex. 740×360: x 205–534, y 247–329), nome do alvo embaixo, velocímetro no alto à esquerda, letreiro do resgate acima do horizonte; nada no meio da pista; sem rolagem horizontal ✔ |
| 30 | Drift | A 90% da velocidade, virando + freio: entra em drift, derrapagem de até ~28° ✔ |
| 31 | Poste | Ônibus a 15 m/s de frente para um poste: para com a frente no poste e conta a batida ✔ |
| 32 | Calçada | Ônibus em cima da calçada: sobe para 0,25 m; de frente contra o prédio, para ✔ |
| 33 | Console | Sem erros nem avisos ✔ |

Não testado: tela cheia de verdade (o navegador de teste não entra em tela cheia), som do drift e da música nova (ninguém ouviu), celular físico.

Corrigido junto: o `resize()` tentava posicionar a seta antes de ela existir (erro `reading 'tilt'` no console em alguns carregamentos).

**Não testado em celular físico** (iPhone e Android médio): falta confirmar fps, aquecimento, áudio depois do toque, tela cheia
(o iPhone não tem tela cheia de verdade no Safari; o jogo segue normal sem ela), safe-area e multitoque (virar e acelerar juntos).

---

### Testes do selo Montaggio (11/11/2026)

Chromium (Playwright), deitado 740×360, 844×390 e 932×430, QR desligado só no teste e coleta de dados bloqueada (nada foi para a planilha).
Selo presente em todas as telas listadas, sem rolagem horizontal, sem sobrepor nenhum botão ou campo, console limpo.
Durante a partida nenhum selo fica visível. Tocar no convite abre nova aba em
`https://wa.me/556993630689?text=Ol%C3%A1%2C%20quero%20um%20jogo%20para%20o%20meu%20neg%C3%B3cio!` e a tela do jogo não muda.
Não testado: celular físico (inclusive o app do WhatsApp abrindo de verdade) e iPhone com notch.


### Testes da ordem e do cronômetro (12/11/2026)

Chromium (Playwright) com WebGL por software, deitado, Three.js r128 servido localmente, coleta de dados interceptada no teste (nada foi
para a planilha). Simulação determinística com `__bus.seed/newGame/skipCount/step/nearTarget`.

| # | Cenário | Resultado |
|---|---|---|
| 35 | Ordem | Rota completa (seed 11): Raul, Kurt, Chorão, Rita, SOAD, Slipknot, Sepultura, Angus, Axl e **Ozzy em 10/10**, depois "VOLTA PRA LOJA" e vitória ✔ |
| 36 | 1ª lenda mais perto | 40 partidas (seeds 1–40): 1ª lenda entre 60 e 119 m da largada (antes, 30 seeds: 114 a 236 m) ✔ |
| 37 | Cronômetro parado | Depois do VAI!, 20 s sem pegar ninguém: `timeLeft` 30, HUD "0:30", relógio 18:00, sem sirene nem provocação ✔ |
| 38 | Cronômetro andando | Embarcou a 1ª: 30 + 10 = 40 s; 5 s depois, 35 s e relógio andando ✔ |
| 39 | Derrota | 15 s parado + 1ª lenda + 45 s: "tempo", relógio em 19:00, `elapsed` 56 s (duração real) e cronômetro 40 s ✔ |
| 40 | Dados | `start`, marcos `nivel` 1–10 com o Ozzy no 10, marcos de pontos e `end` (`vitoria`). O `sec` dos marcos e do `end` é a duração **real** da partida, contando o tempo antes da 1ª lenda ✔ |
| 41 | Layout | 740×360, 932×430 e 1000×480: HUD com 0:30 parado e "1/10 · RAUL SEIXAS", sem rolagem horizontal; console sem erros do jogo ✔ |

Não testado: celular físico. Observação: como o cronômetro só começa na 1ª lenda, quem nunca pega a primeira fica na partida sem
limite de tempo (dá para sair pela pausa).

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
