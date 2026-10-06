# Rover — A Entrega (advergame 16-bit, mobile)

Jogo de plataforma estilo *Donkey Kong* para a **Rover Distribuidora** (Porto Velho, RO).
O jogador controla **Dheep**, que sobe as vigas de um circuito fixo até alcançar o **Gerente Rival** no topo,
desviando dos barris, caixas e garrafas que ele lança. Quando chega ao topo, a entrega é concluída
e um novo ciclo começa, mais difícil. O jogo tem 4 mundos que são liberados conforme a pontuação.

* 100% client-side: HTML + JS puro, Canvas 2D, sem dependências e sem requisições externas.
* Resolução lógica de 216×300 px, com escala inteira (nearest-neighbor) e `image-rendering: pixelated`.
* Placar e painel admin guardados em `localStorage` (nenhum dado sai do aparelho).

```
index.html            jogo completo (motor, física, telas, admin, áudio chiptune sintetizado)
config.js             TODA a configuração (textos, cores, limiares, senhas, nomes)
assets/               sprites e cenários (PNG) + manifest.json + ícones do PWA
assets/_raw/          imagens originais em HD geradas no Higgsfield (fonte para reprocessar)
tools/process_assets.py   converte assets/_raw -> assets/*.png + manifest.json
manifest.webmanifest, sw.js   PWA básico (instalar na tela inicial / offline após 1ª visita)
```

---

## 1. Como servir o jogo

O jogo precisa ser servido por HTTP. Abrindo o `index.html` direto (`file://`), ele ainda roda, mas com os sprites provisórios, porque o navegador bloqueia a leitura do `manifest.json` nesse modo.

```bash
python -m http.server 8080
```

Depois abra `http://localhost:8080` (ou `http://IP-da-máquina:8080` na intranet).

**nginx** (copie a pasta para `/var/www/rover`):

```nginx
server {
  listen 80;
  server_name jogo.dominio-da-rover.com.br;
  root /var/www/rover;
  index index.html;
  location ~* \.(png|json|js|webmanifest)$ { add_header Cache-Control "public, max-age=3600"; }
}
```

**Apache:** basta copiar a pasta para o `DocumentRoot`.

> O domínio final ainda não foi definido (item [9] do briefing). Depois de definido, preencha `CONFIG.share.gameUrl`,
> para que o link compartilhado no WhatsApp aponte para o endereço público. Para o PWA/offline funcionar fora do `localhost`, use **HTTPS**.

---

## 2. Como personalizar (`config.js`)

| O quê | Onde |
|---|---|
| Nome do mascote / inimigo | `mascotName` (padrão "Dheep"), `bossName` (padrão "Gerente Rival") |
| Selo de fundação | `brand.foundedLabel` → hoje "Mais de 30 anos"; troque para "Desde 1997" **após confirmação da Rover** |
| Logo oficial | coloque o PNG em `assets/` e informe em `brand.officialLogo` |
| Cores | `colors` (vermelho `#E30613`, laranja `#FF6A13`, amarelo `#FFD21F`, grafite `#2B2B2B`, âmbar `#FFA726`) |
| Lore (aparece em "Sobre a Rover"), detalhes do tutorial, game over, privacidade | `texts.*` (`{mascot}` e `{boss}` são substituídos automaticamente) |
| Mundos e limiares | `levels` → `[0, 500, 1500, 3500]` + nome, tema e frase de abertura de cada mundo |
| Títulos por pontuação | `ranks` (Estagiário da Rota … Mestre da Distribuição) |
| Pontos, combo, bônus | `scoring` (`comboSteps: [1,2,3,5]` é o teto do multiplicador) |
| Vidas, tempo da entrega, inventário | `game` |
| Física (pulo, velocidade) | `physics` |
| Curva de dificuldade | `difficulty` (início → fim, com teto) |
| Itens / power-ups | `items`, `powerups` |
| Botões (tamanho, espaço, área de toque) | `controls` → `size: 50`, `gap: 4`, `hitbox: 60` (px de tela) |
| Tamanho e colisão dos personagens | `sprites` → célula 48×48 lógica, corpo `hitW/hitH`, área de dano `hurtW/hurtH`, posições do Dheep e do Boss |
| Limite de partidas | `game.onePlayPer` → `'visit'` (1 partida por abertura do link, padrão), `'device'` (1 por aparelho, para sempre) ou `'none'` (sem limite, ex.: totem) |
| Filtro de palavrões nos apelidos | `nickFilter.contains` (bloqueia se aparecer em qualquer parte) e `nickFilter.exact` (só se o apelido for exatamente a palavra, para termos curtos como "cu") |
| Tela "Como jogar" | `tutorial` → título, as 4 linhas, os 3 cards (imagem, rótulo, cor, texto alternativo) e o texto do botão |
| Texto do WhatsApp | `share.text` (`{score}`, `{world}`, `{url}`) |
| Política de privacidade externa | `privacyPolicyUrl` (vazio = abre o texto interno) |

---

## 3. Como jogar (resumo da mecânica)

**Fluxo:** título → **JOGAR** → cadastro rápido (só na primeira vez) → **pop-up "Como jogar"** (aparece sempre antes da partida; o botão "ENTENDIDO! JOGAR" começa o jogo) → partida → fim de jogo (salvar nome, ver ranking, compartilhar).

**Uma partida por vez que o link é aberto** (`game.onePlayPer: 'visit'`):
* Não existe botão "Jogar de novo". Depois da partida, o botão JOGAR do título vira "✔ PARTIDA JÁ JOGADA".
* A partida conta assim que começa. Recarregar a página na mesma aba **não** libera outra (a marcação fica no `sessionStorage` da aba).
* Abrir o link de novo (aba nova ou outra visita) libera uma nova partida.
* Na pausa, "Encerrar partida" pede confirmação e vale como fim de jogo, com a pontuação atual.
* Para travar de vez por aparelho, use `'device'` (fica no `localStorage`; só o "Reset total" do admin libera).
  Sem servidor, não dá para impedir alguém de abrir o link numa aba anônima ou em outro aparelho.

**Filtro de apelidos:** além do formato (1–6 letras, números ou hífen), o apelido é recusado se tiver palavrão ou termo ofensivo,
tanto no cadastro quanto ao salvar no placar. A comparação ignora maiúsculas, acentos, hífen e letras repetidas, e entende números no lugar de letras
(`P3N1S` → penis, `NAZ1` → nazi, `B0STA` → bosta, `CU-1` / `C-U` / `CUU` → cu, `PINTOO` → pinto).
Palavras curtas ficam na lista `exact` para não bloquear nomes normais (`PAULO`, `CUNHA`, `ESCUDO`, `PICOLE` e `ANALU` passam).

* **Controles:** setas **[◀] [▶]** juntas no canto inferior esquerdo (polegar esquerdo) e **[PULO]** no canto inferior direito (polegar direito), com som e pausa logo acima dele.
  Os botões têm 50×50 px, 4 px de espaço entre eles e área de toque de 60×60. Ficam grafite parados e laranja/vermelho quando tocados (com a opacidade baixando no toque).
  Segurando uma seta, o Dheep acelera levemente. O pulo tem altura fixa (~0,66 s no ar) e não há pulo duplo.
* **Circuito:** são 4 vigas em zigue-zague, espaçadas ~74 px para caber os personagens SD (96×96 px de tela num celular de 430 px).
  O Dheep começa no chão, à direita. As vigas são sólidas por baixo: para subir, pule pela **abertura** na ponta da viga de cima.
  Se a cabeça bater na viga, o pulo para no ponto mais alto por um instante. Nas duas primeiras entregas, uma seta amarela indica a abertura.
  A caixa de dano do Dheep é menor que o desenho (padrão de jogos de plataforma), por isso dá para pular por cima de um barril mesmo debaixo de uma viga.
* **Barris e caixas mantêm o embalo da queda:** ao cair por uma abertura, continuam na mesma direção até a parede, quicam e só então rolam ladeira abaixo (como no Donkey Kong).
  Assim não existe canto seguro na tela. Ao sair pela direita do chão, deixam a tela sem quicar.
* O **Gerente Rival** fica no topo, à direita. Ele é feliz e brincalhão: às vezes grita "VAMOS!" antes de lançar e pula comemorando, soltando corações, quando acerta o Dheep ou quando a entrega é concluída. Ele lança a cada ~2–3 s (cada vez mais rápido):
  **barril** (vermelho, rola pelas vigas e cai pelas aberturas), **caixa** (laranja, quica com leve curva),
  **garrafa** (azul, cai reto e rápido; um "!" avisa onde ela vai cair).
* Bater = −1 vida (são 3) e o combo zera. Pular por cima de um obstáculo vale pontos.
* Itens: alimentos (+10), **moeda R** (+50, rara), power-ups (no máximo 2 diferentes ao mesmo tempo; um terceiro substitui o mais antigo):
  capa de chuva (escudo contra 1 batida), nitro (velocidade 2× por 3 s), ímã (puxa itens), preço justo (pontos 2×).
  Os power-ups ativos aparecem como ícones pequenos sobre a cabeça do Dheep, além do halo azul do escudo e das faíscas do nitro.
* **Entrega** = alcançar o inimigo no topo. Vale +150, mais o bônus de rapidez (2 pts por segundo restante) e +100 se não houver nenhuma batida (bônus de eficiência).
* Cada entrega tem um tempo limite (50 s). Se o tempo zerar, o jogador perde 1 vida e o relógio reinicia. Foi assim que interpretamos a regra
  "atingir o topo sem alcançar o inimigo (teto)" do briefing. Se não for isso, é fácil ajustar.
* Mundos: 1 Centro de Distribuição (0) → 2 BR-364 (500) → 3 Interior de Rondônia (1.500) → 4 Margens do Rio Madeira (3.500).
  A cada troca de mundo há banner, música nova e +100 de bônus. Depois do mundo 4, o jogo segue infinito, com a dificuldade subindo até o teto.

---

## 4. Painel admin

* Acesse por `/?admin=true` **ou** segure o logo da tela de título por **3 s**.
* Login padrão: usuário **`rover`**, senha **`rover@2026`**. A senha de limpeza (reset total) é **`limpar@2026`**.
  **Troque as senhas antes de publicar.**
* As senhas ficam em `config.js` como hash SHA-256 (`ADMIN_PASS_SHA256`, `adminDeletePasswordSHA256`). Para gerar um hash novo:

  ```bash
  python -c "import hashlib;print(hashlib.sha256('NOVA-SENHA'.encode()).hexdigest())"
  ```

  Também dá para gerar pelo próprio navegador (console, com o jogo aberto): `__rover.sha256('NOVA-SENHA')`.
  Se preferir, defina `ADMIN_PASS: 'texto'` (senha em texto puro), que tem prioridade sobre o hash.
* Funções do painel: ranking completo (até 100), **Exportar CSV** (separador `;`, UTF-8 com BOM, abre direto no Excel),
  **Banir apelido** (remove as pontuações e bloqueia novos cadastros com esse apelido), **Limpar placar** (pede confirmação),
  **Reset total** (exige a senha de limpeza e apaga placar, estatísticas, banidos e recorde) e **Estatísticas** (partidas, melhor pontuação, médias e distribuição por mundo).

> **Importante:** como não há backend, o login do admin é só uma barreira de interface. Os dados ficam no navegador
> **daquele aparelho**: o painel mostra apenas as partidas jogadas nele (ideal para totem ou tablet em loja ou evento). Exporte o CSV
> com frequência como backup. Para consolidar placares de vários aparelhos, será preciso um endpoint (`POST /api/backup`, fora do escopo).

---

## 5. Estrutura do `localStorage`

| Chave | Conteúdo |
|---|---|
| `leaderboard` | Array (máx. 100, ordenado por pontos desc.) de `{ nickname, score, level, date, duration?, deliveries?, whatsapp? }` |
| `rover_stats` | `{ games, totalScore, best, totalTime, levels: { "1": n, "2": n, ... } }`, contando todas as partidas, salvas ou não |
| `rover_banned` | Array de apelidos banidos (maiúsculas) |
| `rover_player` | Cadastro do jogador atual `{ nick, whatsapp, consent, consentDate }` |
| `rover_best` | Recorde pessoal neste aparelho |
| `rover_settings` | `{ muted }` |
| `rover_tut_seen` | Indica que o tutorial já foi visto |

Exemplo de entrada no placar:

```json
{ "nickname": "DHEEP", "score": 3725, "level": 4, "date": "2026-10-06T18:28:40.613Z", "duration": 212, "deliveries": 6 }
```

* `nickname`: 1 a 6 caracteres `A–Z`, `0–9` ou `-`, salvo em maiúsculas. Caracteres inválidos (acentos, espaços, símbolos) são rejeitados com mensagem de erro.
* `level`: mundo alcançado (1–4). `date`: ISO 8601.
* `whatsapp`: só é gravado se o jogador informou o número **e** aceitou a política. Ele **nunca** aparece no placar público, só no CSV do admin.
* Quando o placar chega a 100 entradas, a pior é removida.

---

## 6. Assets (Higgsfield) e como regenerar

Todos os sprites e cenários foram gerados no **Higgsfield** com o modelo `gpt_image_2_5`, usando o mesmo sufixo de estilo em todos os prompts:

> *16-bit SNES-era pixel art, limited palette, crisp pixels, no anti-aliasing, no blur, no text, clean silhouette, flat shading with 1px dark outline. Flat solid pure magenta #FF00FF background.*

| Arquivo bruto (`assets/_raw`) | Formato | Resultado no jogo |
|---|---|---|
| `dheep_v2_sheet.png` | 21:9, SD, 7 quadros: parado, corrida 1/2, no ar, pouso, vitória, susto | `dheep-96x96.png` (7 células de 48×48 lógicos = 96×96 px de tela em escala 2×) |
| `boss_v2_sheet.png` | 16:9, SD feliz, 4 quadros: parado (braços abertos), preparando ("vamos!"), arremessando, comemorando | `boss-96x96.png` (4 células de 48×48, espelhado para olhar para a esquerda) |
| `tutorial_jump.png`, `tutorial_dodge.png`, `tutorial_win.png` | 1:1, diagramas da tela "Como jogar" (sem texto: os rótulos PULE / DESVIE / VENÇA ficam no HTML) | `tutorial-*.png` (256×256) |
| `hazards_sheet.png` | barril, caixa, garrafa | `barrel.png`, `box.png`, `bottle.png` |
| `food_sheet.png` | caixa, saco de arroz, leite, fardo de refrigerante, congelado (genéricos, sem marca) | `food_*.png` |
| `power_sheet.png` | moeda R, capa de chuva, nitro, ímã, etiqueta "preço justo" | `coin.png` (giro em 4 quadros), `pw_*.png` |
| `truck.png` | caminhão baú vermelho/laranja/amarelo, sem logos | `truck.png` |
| `bg_*.png` | 3:4, galpão, BR-364, interior (pasto e castanheiras), Rio Madeira ao pôr do sol | `bg_*_far.png` (232×300, escurecidos para dar contraste) |

As versões v1 (`dheep_sheet.png`, `boss_sheet.png`) continuam em `assets/_raw` como histórico, mas não são mais usadas.

Os prompts completos estão em `assets/manifest.json` (campos `prompt` e `style`). O modelo **não aceita seed fixa**.
Para manter a identidade dos personagens, cada versão nova é gerada com a anterior como **imagem de referência**
(`medias: [{ role: "image_references", value: <job id> }]`). O Dheep v2 e o Boss v2 usaram as gerações v1, e os tutoriais usaram o Dheep v2 e o Boss v2.
A qualidade usada nos personagens e nos tutoriais foi `high` (~1,5 crédito por imagem). Para regenerar:

1. Gere a imagem no Higgsfield (`generate_image`, modelo `gpt_image_2_5`) com o prompt do manifest. Mantenha **fundo magenta** e **quadros numa única linha**.
2. Salve em `assets/_raw/` com o mesmo nome.
3. Rode `python tools/process_assets.py` (requer `pip install pillow`). Ele faz o chroma key do magenta, fatia os quadros,
   aplica uma escala comum alinhada pelos pés, reduz a paleta, refaz o contorno de 1 px e reescreve `assets/manifest.json`.

Usamos fundo magenta + recorte local em vez do `remove_background` porque assim a borda do pixel art sai sem halo.
Qualquer asset ausente em `assets/` é substituído automaticamente pelo **placeholder procedural** de mesmo id (desenhado no `index.html`),
então o jogo nunca quebra por falta de imagem. Logo "R" pixel art, corações, efeitos (poeira, brilho, explosão de pontos, confete),
camadas animadas do parallax (luzes do galpão, caminhão na rodovia, folhagem/chuva, vaga-lumes no rio) e todo o áudio chiptune
(trilha por mundo e efeitos sonoros, via WebAudio) são procedurais.

---

## 7. Testes

Cada cenário abaixo foi executado no navegador em viewport mobile. Para repetir sem jogar à mão, abra o console:
o objeto `__rover` expõe `newGame()`, `step(segundos)` (avança a simulação de forma determinística), `G` (estado), `inp` (controles) e `LB` (placar).

| # | Cenário | Como verificar | Resultado |
|---|---|---|---|
| 1 | **Partida completa** | Subir os 3 andares pelas aberturas (esquerda, direita, esquerda) até o Gerente Rival. Depois forçar a pontuação a 495/1.495/3.495 e coletar um item. Por fim, receber 4 batidas, sendo a primeira com a capa de chuva ativa. | Entrega concluída (+328 com bônus) com o Boss comemorando e soltando corações, mundos 2→3→4 nos limiares, escudo absorve a 1ª batida, o Boss comemora a cada batida, 3 vidas perdidas → tela de game over ✔ |
| 2 | **Salvar pontuação** | No game over, tentar `ABCDEFG`, `JOÃO`, `A B`, `<x>` e vazio; depois `dh-p1` | Os 5 inválidos são rejeitados com mensagem. `DH-P1` é salvo em `localStorage['leaderboard']` e aparece como "#1 no ranking" ✔ |
| 3 | **Teto de 100** | Inserir 110 pontuações | Ficam 100, e as piores são removidas ✔ |
| 4 | **Login admin** | `/?admin=true`, primeiro com senha errada e depois com `rover` / `rover@2026` | Erro "Usuário ou senha incorretos"; depois o painel abre com as 100 linhas e as estatísticas ✔ |
| 5 | **Exportar CSV** | Botão "Exportar CSV" | Arquivo `rover-placar-AAAA-MM-DD.csv` com cabeçalho e 100 linhas ✔ |
| 6 | **Banir** | Banir `P50` | Confirmação, 1 registro removido e o apelido entra na lista de banidos ✔ |
| 7 | **Limpar placar** | Clicar em "Limpar" e depois em Cancelar; repetir e Confirmar | O aviso cita a quantidade e sugere backup. Cancelar mantém os 99 registros; confirmar zera o placar ✔ |
| 8 | **Reset total** | Senha de limpeza errada, depois `limpar@2026` | Senha errada é rejeitada; a certa (após confirmação) apaga tudo ✔ |
| 9 | **Responsividade** | 360×740, 430×900, 480×860 | Escala inteira 3×, 4× e 4×, sem rolagem horizontal, controles visíveis e dentro da safe-area ✔ |
| 10 | **Cadastro** | Apelido inválido, depois válido sem aceitar a política, depois com o aceite | Erros claros; só avança com apelido válido e o aceite marcado ✔ |
| 11 | **Tela "Como jogar"** | Abrir pelo título em 360 e 480 px | Título em fonte pixel, 4 linhas, 3 imagens quadradas (104 px em 360, 128 px em 480) com rótulos e botão "ENTENDIDO!" de 50 px, tudo numa tela só, sem rolagem ✔ |
| 12 | **Controles** | Medir os botões e simular toques (pointer events) segurando e soltando | [◀][▶] 50×50 com 4 px de espaço no canto inferior esquerdo e [PULO] 104×50 no canto inferior direito. Toque 4–5 px fora do desenho ainda conta (área de 60×60). O botão fica laranja com opacidade 0,75 enquanto tocado e volta ao grafite ao soltar. Andar e pular ao mesmo tempo (dois toques) funciona ✔ |
| 13 | **Pular barril debaixo de viga** | Barril rolando no chão a 26/45/62 px/s, Dheep andando contra ele, testando o pulo a várias distâncias | Pulo seguro numa janela de 10 a 24 px de distância (antes do ajuste da caixa de dano era só 1 posição) ✔ |
| 14 | **Tamanho dos personagens** | 430 e 480 px | Dheep e Boss com 96×96 px de tela ✔ |

| 15 | **Filtro de palavrões** | 34 apelidos ofensivos (MORTE, NAZI, CU, PINTO, PENIS, P3NIS, P3N1S, XXT, XOXOTA, BUCETA, BUNDA, BOSTA, NAZISM, NAZ1, CU-1, C-U, CUU, PINTOO, B0STA, BUND4, M0RTE, N4Z1, PORRA, P0RR4, MERDA, HITLER, FDP, KRL, PUT4, C4R4LH, XOT4, P1CA, PICA, KU) e 25 nomes comuns (PAULO, PEDRO, CUNHA, ESCUDO, PICOLE, ANALU, CUBO, SEXTA…) | Todos os 34 recusados, com mensagem, no cadastro e ao salvar. Nenhum dos 25 nomes comuns foi bloqueado ✔ |
| 16 | **Pop-up "Como jogar"** | Tocar em JOGAR (com e sem cadastro); abrir pelo botão "Como jogar" | Sempre aparece antes da partida, com o botão "ENTENDIDO! JOGAR". Pelo menu, o botão "ENTENDIDO!" só fecha. Cabe numa tela de 360×740 ✔ |
| 17 | **Uma partida por abertura** | Jogar até o fim → Menu → JOGAR; recarregar a página; simular nova abertura; encerrar pela pausa | Sem "Jogar de novo". Depois da partida, JOGAR fica desativado ("PARTIDA JÁ JOGADA"), inclusive após recarregar. Uma sessão nova libera. "Encerrar partida" pede confirmação e leva ao fim de jogo ✔ |
| 18 | **Sem esconderijo nos cantos** | Dheep parado 40 s (2 rodadas) em cada canto e no meio de cada andar, sem invencibilidade | Antes da correção, o canto inferior esquerdo levava 0 batidas (o meio do chão levava 5). Agora: chão esq. 6,5 / dir. 3,5 / meio 4,0; 1º andar dir. 8,5 / meio 7,5; 2º andar esq. 10,5 / meio 10,0 ✔ |
| 19 | **Obstáculos não se acumulam** | 3 minutos de lançamentos | Entre 7 e 13 obstáculos na tela, estável, e 47 saíram pela direita do chão ✔ |

Os testes 2 a 8 foram feitos na v1. O código do placar e do admin não mudou na v2.

Ainda não testado em aparelhos físicos (iPhone e Android médio): vale confirmar 60 fps, áudio após o primeiro toque, safe-area do notch e multitoque (andar e pular ao mesmo tempo).

---

## 8. Pendências de autorização (antes de publicar)

1. **Personagem Dheep:** é um personagem estilizado (boné e camiseta nas cores da Rover), **não** um retrato. Precisa da aprovação do Alyson "Dheep" Rover e da Rover.
2. **Ano de fundação:** o selo diz "Mais de 30 anos". Trocar para "Desde 1997" só depois da confirmação (`brand.foundedLabel`).
3. **Nome do inimigo:** hoje é "Gerente Rival" (`bossName`). Confirmar ou trocar (Diretor, outro).
4. **Logo oficial:** o "R" atual é uma releitura em pixel art. Se a Rover enviar o arquivo oficial, use `brand.officialLogo`.
5. **Domínio de publicação** e **política de privacidade** oficial (`share.gameUrl`, `privacyPolicyUrl`).
6. Nenhum logo ou embalagem de terceiros (Aurora etc.) foi usado: todos os produtos são genéricos.
