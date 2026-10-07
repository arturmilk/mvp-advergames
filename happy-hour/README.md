# Rover Happy Hour (advergame mobile)

Jogo de "pegar o que cai" (estilo *Food Falling* do Pou) para a **Rover Distribuidora** (Porto Velho, RO).
O jogador controla **Dheep**, que anda no piso do bar e precisa pegar frango a passarinho, batata frita, cerveja e calabresa
que caem do alto. A queda acelera a cada 10 s. Se 5 petiscos caírem no chão, o jogo acaba.

* 100% client-side: HTML + JS puro, Canvas 2D, sem dependências e sem nenhuma requisição externa.
* Estilo cartoon moderno (sem pixel art), com `image-rendering: auto` e sprites pré-escalados para a tela do aparelho.
* Placar e painel admin guardados em `localStorage`: nenhum dado sai do aparelho.

```
index.html              jogo completo (loop, física, colisão, telas, HUD, admin, áudio sintetizado)
config.js               TODA a configuração (textos, cores, limiares, tempos, senhas, nomes)
assets/                 sprites PNG + manifest.json + ícones do PWA
assets/_raw/            imagens originais geradas no Higgsfield (fonte para reprocessar)
tools/process_assets.py converte assets/_raw -> assets/*.png + assets/manifest.json
manifest.webmanifest, sw.js   PWA básico (instalar na tela inicial / offline depois da 1ª visita)
```

> Este jogo fica na pasta `happy-hour/`, separado do jogo anterior ("Rover — A Entrega", na raiz do repositório).

---

## 1. Como servir

O jogo precisa ser servido por HTTP (aberto direto do disco com `file://`, ele roda, mas com os desenhos provisórios,
porque o navegador bloqueia a leitura do `manifest.json`).

```bash
cd happy-hour
python -m http.server 8080
```

Abra `http://localhost:8080` (ou `http://IP-da-máquina:8080` na intranet).

**nginx** (copie a pasta `happy-hour` para `/var/www/rover-happy-hour`):

```nginx
server {
  listen 80;
  server_name jogo.dominio-da-rover.com.br;
  root /var/www/rover-happy-hour;
  index index.html;
  location ~* \.(png|json|js|webmanifest)$ { add_header Cache-Control "public, max-age=3600"; }
}
```

**Apache:** copie a pasta para o `DocumentRoot`. O domínio final ainda não foi definido.
Para o PWA/offline funcionar fora do `localhost`, use **HTTPS**.

**GitHub Pages:** publicado em https://arturmilk.github.io/mvp-advergames/happy-hour/ (branch `main`, raiz do repositório).
Como divide o domínio com o "Rover — A Entrega" (que usa a chave `leaderboard`), este jogo grava o placar em `hh_leaderboard`.

---

## 2. Como personalizar (`config.js`)

| O quê | Onde |
|---|---|
| Nome do personagem | `mascotName` (padrão "Dheep"). `{mascot}` nos textos é trocado por ele |
| Ano de fundação | `foundedYear`: hoje `'30+ anos'` → a frase final sai "há mais de 30 anos". Troque para `'1997'` **depois da confirmação da Rover** → "desde 1997" |
| Cores | `primaryRed`, `primaryOrange`, `primaryYellow`, `darkGray`, `amber`, `barBrown`, `gold`, `bronze` |
| Textos | `titleText`, `subtitleText`, `tutorialText`, `tutorialTips`, `lore`, `gameOverTitle`, `gameOverLines`, `timeUpTitle`, `savedTitle`, `finalText`, `about.*` |
| Pontos e frequência dos itens | `items.<item>.score`, `speedFactor`, `w`/`h` (hitbox) e `every` (cerveja a cada 5–10 itens, calabresa a cada 8–12) |
| Tamanho do desenho dos itens | `itemDrawScale` (1,7 = desenho 70% maior que a hitbox, para ler bem no celular) |
| Velocidade de queda | `baseFallSpeed`, `fallSpeedGrowth`, `maxFallSpeedMult` |
| Dificuldade | `initialSpawnInterval`, `difficultyIncrementInterval`, `difficultyFactor`, `minSpawnInterval`, `maxLevel` |
| Combo e bônus | `comboEvery`, `comboSteps`, `speedBonusMax` |
| Fim de jogo | `missesAllowed` (5), `gameDuration` (90000 ms; use `0` para jogar só até perder os 5 itens) |
| Metas (títulos) | `goals` (`min` = pontuação mínima de cada faixa) |
| Personagem | `characterY`, `characterWidth`, `characterSpeed`, `characterAccel` |
| Admin | `ADMIN_USER`, `ADMIN_PASS` (ou `ADMIN_PASS_SHA256`), `ADMIN_DELETE_PASSWORD` |
| Placar | `leaderboardMax` (100), `publicTop` (50), `nickPattern`, `storageKeys` |
| Filtro de apelidos | `nickFilter.contains` / `nickFilter.exact` |
| Áudio | `musicVolume`, `sfxVolume`, `musicTempo` |

Depois de editar, basta recarregar a página.

---

## 3. Mecânica

* **Controles:** setas de 64×64 px nos cantos inferiores (área de toque de 84×84). Segurar = andar sem parar, com arranque e frenagem suaves.
  No computador: ← → (ou A / D). `P`/`Esc` pausa, `M` liga/desliga o som.
* **Personagem:** fica no piso (100 px de altura, mais a safe-area do iPhone). A hitbox tem 60 px de largura e cobre do peito à boca.
* **Itens:** caem em linha reta, de um X aleatório. A velocidade de queda é proporcional à altura da tela, então o tempo de reação é o mesmo em qualquer celular.

| Item | Pontos | Frequência | Velocidade |
|---|---|---|---|
| Frango a passarinho | +10 | comum | 1× |
| Batata frita | +15 | comum | 1× |
| Cerveja | +25 | 1 a cada 5–10 itens | 1,3× |
| Calabresa | +35 | 1 a cada 8–12 itens | 1,5× |

* **Dificuldade (a cada 10 s):** o intervalo entre itens é multiplicado por 0,85 e a queda fica 7% mais rápida.
  Intervalos por nível: 1.500 → 1.275 → 1.084 → 921 → 783 → 666 → 566 → 481 → 409 → 347 → 300 ms (teto).
  O nível do HUD vai de 1 a 10. Com o limite de 90 s, a partida termina no nível 9. Para chegar ao teto de 300 ms, use `gameDuration: 0` ou ≥ 100 s.
* **Combo:** a cada 3 seguidos o multiplicador sobe x1 → x1,5 → x2 → x2,5 (teto). Deixar cair 1 item zera.
* **Bônus de velocidade:** +0% no nível 1 até +50% no nível 10 (linear). Pontos = `base × combo × (1 + bônus)`, arredondado.
* **Fim:** 5 itens perdidos ("Dheep não aguenta mais!") ou 90 s ("Fim da promoção!"). Na pausa, "Encerrar partida" também conta como fim.
* **Pausa automática** quando o app perde o foco ou a aba fica oculta. O áudio só começa depois do primeiro toque.
* **Efeitos:** brilho em todo item pego; confete, anel de estrelas e "cheers" nos raros (cerveja e calabresa); fumaça e "Ops!" quando um item cai.

---

## 4. Painel admin

* Acesse por `/?admin=true` **ou** segure o logo "R" da tela de título por **3 s** (um anel amarelo mostra o progresso).
* Login padrão: usuário **`admin`**, senha **`pito2026`**. A senha do "Reset total" é **`DELETE_ALL_2026`**. **Troque antes de publicar.**
* A senha é comparada por SHA-256 (implementado em JS puro, funciona também em `http://` na intranet).
  Para não deixar a senha em texto no `config.js`, gere o hash e preencha `ADMIN_PASS_SHA256` (e deixe `ADMIN_PASS: ''`):

  ```bash
  python -c "import hashlib;print(hashlib.sha256('NOVA-SENHA'.encode()).hexdigest())"
  ```

* Funções: estatísticas (partidas, melhor score, score médio, combo médio, duração média, distribuição por meta),
  placar completo (até 100), **Exportar CSV**, **Banir apelido** (pela linha da tabela ou digitando; remove as pontuações e bloqueia o apelido),
  **Limpar placar** (aviso com a quantidade e sugestão de backup, depois confirmação), **Reset total** (senha de limpeza + confirmação; apaga placar, estatísticas, banidos e recorde).
* CSV: campos `nickname;score;level;date;maxCombo;duration`, separador `;` e UTF-8 com BOM (abre direto no Excel em português).

> **Importante:** sem backend, o login é só uma barreira de interface (o `config.js` é público). Os dados ficam no navegador
> **daquele aparelho**: o painel mostra só as partidas jogadas nele (ideal para totem ou tablet em evento/loja). Exporte o CSV com frequência.
> Para juntar placares de vários aparelhos, seria preciso um endpoint (`POST /api/backup`), fora desta entrega.

---

## 5. `localStorage`

| Chave | Conteúdo |
|---|---|
| `hh_leaderboard` | Array (máx. 100, ordenado por pontos) de `{ id, nickname, score, level, date, maxCombo, duration }` |
| `hh_stats` | `{ games, totalScore, best, totalCombo, totalTime, goals: { "<meta>": n } }`, contando todas as partidas, salvas ou não |
| `hh_banned` | Array de apelidos banidos |
| `hh_player` | `{ nick, best, bestId, bestCombo }`: recorde pessoal e último apelido usado neste aparelho |
| `hh_settings` | `{ muted }` |
| `hh_tut_seen` | O tutorial já foi visto (ele aparece antes da 1ª partida; depois, pelo botão "Como jogar") |

Exemplo:

```json
{ "id": "muyhjuq99m51", "nickname": "DH-P1", "score": 580, "level": "Campeão do Happy Hour",
  "date": "2026-10-07T19:13:29.937Z", "maxCombo": 12, "duration": 37 }
```

* `nickname`: 1 a 6 caracteres `A–Z`, `0–9` ou `-`, salvo em maiúsculas. Acentos, espaços e símbolos são rejeitados, assim como palavrões
  (o filtro entende números no lugar de letras: `P3N1S`, `B0STA`) e apelidos banidos.
* `level`: meta alcançada (título da faixa). `maxCombo`: maior sequência de itens seguidos. `duration`: segundos. `id`: identificador interno.
* Ao passar de 100 entradas, a pior é removida.

---

## 6. Assets (Higgsfield) e como regenerar

Todos os visuais foram gerados no **Higgsfield** com o modelo `gpt_image_2_5` (`quality: high`, `resolution: 1k`, `background: transparent`)
e o mesmo bloco de estilo no fim de cada prompt:

> *Modern cartoon mobile game art, vibrant saturated colors, smooth rounded shapes, soft flat shading with subtle soft shadow, thin dark-brown outline (2px max), no pixel art, no text, no logos. Fully transparent background.*

| Bruto (`assets/_raw`) | Vira |
|---|---|
| `dheep_sheet_rembg.png` (5 poses, passou pelo `remove_background`) | `dheep.png`: tira de 5 quadros (parado, esquerda, direita, comendo, derrota), alinhados pelos pés |
| `food_sheet.png` | `frango.png`, `batata.png`, `cerveja.png`, `calabresa.png` |
| `ui_sheet.png` | `ui_left.png`, `ui_right.png`, `ui_combo.png`, `ui_timer.png`, `ui_star.png`, `ui_heart.png` |
| `fx_sheet.png` | `fx_confetti.png`, `fx_sparkle.png`, `fx_smoke.png`, `fx_stars.png` |
| `bg_bar.png` (opaco) | `bg_bar.png`: parallax camada 1 (salão com neon) |
| `bar_counter.png` | `bar_counter.png`: parallax camada 2 (balcão com garrafas sem rótulo) |
| `floor.png` (opaco) | `floor.png`: piso de ladrilhos |
| `logo_r.png` | `logo_r.png` + `icon-192.png` / `icon-512.png` |
| `title_banner.png` | `title_banner.png` (canecas brindando + petiscos) |

Os prompts completos e o id de cada geração estão em `assets/manifest.json` (`prompt`, `higgsfieldJob`) e em `tools/process_assets.py`.
O modelo **não aceita seed fixa**. Para manter a identidade, gere a versão nova usando a anterior como **imagem de referência**
(`medias: [{ role: "image_references", value: <job id> }]`), como foi feito com o Dheep.

**Sobre o Dheep:** a 1ª geração (`_raw/dheep_sheet_v1_kid.png`) saiu com cara de criança, o que não combina com um jogo que tem cerveja.
Ela foi refeita como adulto (barba por fazer, proporções de adulto), com a v1 como referência, e depois passou pelo `remove_background`,
que preservou melhor o contorno do que a transparência nativa do modelo (`_raw/dheep_sheet.png`).

Para regenerar um asset:

1. Gere no Higgsfield (`generate_image`, modelo `gpt_image_2_5`, `background: transparent`) com o prompt do manifest. Mantenha os quadros **numa única linha**, com espaço entre eles.
2. Salve em `assets/_raw/` com o mesmo nome.
3. Rode `python tools/process_assets.py` (requer `pip install pillow numpy`). Ele limpa o halo semitransparente que o modelo deixa em volta dos objetos,
   fatia as folhas pelas colunas vazias (e separa quadros encostados), recorta, redimensiona e reescreve `assets/manifest.json`.

Se algum PNG faltar, o jogo usa um **desenho provisório procedural** de mesmo id (definido no `index.html`), então nunca quebra por falta de imagem.
O áudio (sambinha de boteco com surdo, pandeiro, ganzá, cavaquinho e flauta, mais os efeitos "ding", "boop", "cheers", combo, nível e fim) é sintetizado
no navegador via WebAudio. O conector do Higgsfield só gera voz, não música nem efeitos.

---

## 7. Testes

Executados no navegador em viewport mobile. Para repetir sem jogar à mão, abra o console: `__hh` expõe `newGame()`, `step(segundos)`
(avança a simulação de forma determinística), `catchItem(tipo)`, `dropItem(tipo)`, `spawn(tipo, x)`, `G` (estado), `inp` (controles), `LB` (placar) e `exportCSV()`.

| # | Cenário | Como | Resultado |
|---|---|---|---|
| 1 | **Partida completa** | Sem tocar em nada; depois um "bot" que persegue o item mais baixo (4 partidas) | Parado: fim por 5 perdas em 13 s. Bot: 37 s, 49 s, 54 s e 81 s, com 580 a 3.894 pts, fim por 5 perdas, game over com pontos, meta, combo máx., itens, tempo e nível ✔ |
| 2 | **Pontos por item** | Pegar cada item com combo x1 no nível 1 | 10 / 15 / 25 / 35 ✔ |
| 3 | **Combo** | 13 frangos seguidos, depois deixar 1 cair | 10,10,10,15,15,15,20,20,20,25,25,25,25 (teto x2,5); após a perda: sequência 0, x1, próximo frango = 10 ✔ |
| 4 | **Dificuldade** | Intervalo por degrau de 10 s | 1500, 1275, 1084, 921, 783, 666, 566, 481, 409, 347, 300, 300 ✔ |
| 5 | **Bônus de velocidade** | Frango no nível 9 | 14 pts (+44%) ✔ |
| 6 | **Raridade** | 5.000 sorteios | Cerveja a cada 5–11 itens (o 11 acontece quando a calabresa "rouba" a vez), calabresa a cada 8–12 ✔ |
| 7 | **Salvar pontuação** | `vazio`, `ABCDEFG`, `JOÃO`, `A B`, `<x>`, `P3N1S`, `CU`, `b0sta`, depois `dh-p1` | Os 8 inválidos são recusados com mensagem; `DH-P1` é salvo e a tela "Parabéns!" mostra "#1 no ranking". Nomes comuns (PAULO, CUNHA, ESCUDO, ANALU, RO-VER…) passam ✔ |
| 8 | **Teto de 100** | Inserir 110 pontuações | Ficam 100; as piores saem ✔ |
| 9 | **Rankings** | Top 50 com a sua melhor | Linha do jogador destacada e rolada até a vista; rodapé "Sua melhor: 2.500 pts — #22" ✔ |
| 10 | **Login admin** | `/?admin=true` com senha errada e depois certa; segurar o logo 1,2 s e 3 s | Erro na senha errada; painel abre com 100 linhas e estatísticas. Soltar antes de 3 s não abre; 3 s abre ✔ |
| 11 | **Exportar CSV** | Botão "Exportar CSV" | Cabeçalho + 100 linhas, separador `;` ✔ |
| 12 | **Banir** | Banir `ANA3` pela tabela | Confirmação, registro removido, apelido bloqueado no save ✔ |
| 13 | **Limpar placar** | Cancelar, depois confirmar | O aviso cita "98 pontuações" e sugere backup. Cancelar mantém; confirmar zera ✔ |
| 14 | **Reset total** | Senha errada, depois `DELETE_ALL_2026` + "Tem certeza?" | Errada é recusada; a certa apaga placar, estatísticas e banidos ✔ |
| 15 | **Controles de toque** | Pointer events de toque nas setas (segurar, soltar, cancelar) | Anda enquanto segura, para ao soltar/cancelar, botão afunda ao tocar, para na borda sem o desenho sair da tela ✔ |
| 16 | **Pausa automática** | Disparar `blur` no meio da partida | Abre a pausa e o tempo congela; "Continuar" retoma ✔ |
| 17 | **Responsividade** | 360×740, 375×812, 430×932, 480×860 | Sem rolagem horizontal; título, tutorial, game over, salvo, ranking e pausa cabem numa tela; "Sobre" rola sem cortar o topo; nenhum botão visível abaixo de 44 px ✔ |
| 18 | **Desempenho** | 120 quadros de update + render com 11 itens e partículas, canvas 960×1720 (DPR 2) | ~3 ms por quadro no computador de teste ✔ |

Ainda não testado em aparelhos físicos (iPhone e Android médio): vale confirmar 60 fps, áudio depois do primeiro toque, safe-area do notch e multitoque.

---

## 8. Pendências de autorização (antes de publicar)

1. **Personagem Dheep:** é um personagem cartoon **inspirado** no Alyson "Dheep" Rover, não um retrato. Publicar só com a autorização expressa dele e da Rover.
2. **Ano de fundação:** hoje `foundedYear: '30+ anos'`. Trocar para `'1997'` só depois da confirmação da Rover.
3. **Ambientação de bar/happy hour** (cores, neon, decoração): não usa marcas. Confirmar se está ok.
4. **Logo:** o "R" é uma releitura em cartoon, não o arquivo oficial. Nenhum logo ou embalagem de terceiros (Aurora etc.) foi usado: garrafas e porções são genéricas.
5. **Senhas do admin**, **domínio** de publicação e **metas** (com combo e bônus, partidas típicas fazem de 500 a 4.000 pts, então a faixa "300+" é alcançada por quase todos;
   sugestão: 0 / 500 / 1.500 / 3.000 em `goals`).
