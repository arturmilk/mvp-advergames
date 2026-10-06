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
| Lore, tutorial, "Sobre", game over, privacidade | `texts.*` (`{mascot}` e `{boss}` são substituídos automaticamente) |
| Mundos e limiares | `levels` → `[0, 500, 1500, 3500]` + nome, tema e frase de abertura de cada mundo |
| Títulos por pontuação | `ranks` (Estagiário da Rota … Mestre da Distribuição) |
| Pontos, combo, bônus | `scoring` (`comboSteps: [1,2,3,5]` é o teto do multiplicador) |
| Vidas, tempo da entrega, inventário | `game` |
| Física (pulo, velocidade) | `physics` |
| Curva de dificuldade | `difficulty` (início → fim, com teto) |
| Itens / power-ups | `items`, `powerups` |
| Tamanho dos botões | `controls.size` (px; mínimo recomendado 44) |
| Texto do WhatsApp | `share.text` (`{score}`, `{world}`, `{url}`) |
| Política de privacidade externa | `privacyPolicyUrl` (vazio = abre o texto interno) |

---

## 3. Como jogar (resumo da mecânica)

* **◀ ▶** (segurar): anda; segurando, acelera levemente. **⤒**: pulo de altura fixa (~0,56 s no ar), sem pulo duplo.
* As vigas são sólidas por baixo. Para subir, pule pela **abertura** na ponta da viga de cima (a abertura alterna de lado a cada andar, em zigue-zague). Nas duas primeiras entregas, uma seta amarela indica onde fica a abertura.
* O **Gerente Rival** lança a cada ~2–3 s (cada vez mais rápido):
  **barril** (vermelho, rola pelas vigas e cai pelas aberturas), **caixa** (laranja, quica com leve curva),
  **garrafa** (azul, cai reto e rápido; um "!" avisa onde ela vai cair).
* Bater = −1 vida (são 3) e o combo zera. Pular por cima de um obstáculo vale pontos.
* Itens: alimentos (+10), **moeda R** (+50, rara), power-ups (no máximo 2 diferentes ao mesmo tempo; um terceiro substitui o mais antigo):
  capa de chuva (escudo contra 1 batida), nitro (velocidade 2× por 3 s), ímã (puxa itens), preço justo (pontos 2×).
* **Entrega** = alcançar o inimigo no topo. Vale +150, mais o bônus de rapidez (2 pts por segundo restante) e +100 se não houver nenhuma batida (bônus de eficiência).
* Cada entrega tem um tempo limite (75 s). Se o tempo zerar, o jogador perde 1 vida e o relógio reinicia. Foi assim que interpretamos a regra
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
| `dheep_sheet.png` | 16:9, 6 quadros: parado, andando 1/2, pulo, vitória, derrota | `dheep.png` (6 × 18×23) |
| `boss_sheet.png` | 16:9, 4 quadros: parado, preparando, arremessando, tonto | `boss.png` (4 × 28×31) |
| `hazards_sheet.png` | barril, caixa, garrafa | `barrel.png`, `box.png`, `bottle.png` |
| `food_sheet.png` | caixa, saco de arroz, leite, fardo de refrigerante, congelado (genéricos, sem marca) | `food_*.png` |
| `power_sheet.png` | moeda R, capa de chuva, nitro, ímã, etiqueta "preço justo" | `coin.png` (giro em 4 quadros), `pw_*.png` |
| `truck.png` | caminhão baú vermelho/laranja/amarelo, sem logos | `truck.png` |
| `bg_*.png` | 3:4, galpão, BR-364, interior (pasto e castanheiras), Rio Madeira ao pôr do sol | `bg_*_far.png` (232×300, escurecidos para dar contraste) |

Os prompts completos estão em `assets/manifest.json` (campos `prompt` e `style`). Os modelos de imagem **não aceitam seed fixa**:
a consistência vem do sufixo de estilo idêntico e da descrição fixa do personagem. Para regenerar:

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
| 1 | **Partida completa** | Subir os 5 andares pelas aberturas (direita, esquerda, …) até o inimigo. Depois forçar a pontuação a 495/1.495/3.495 e coletar um item. Por fim, receber 4 batidas, sendo a primeira com a capa de chuva ativa. | Entrega concluída (+366 com bônus), mundos 2→3→4 nos limiares (+100 cada), escudo absorve a 1ª batida, 3 vidas perdidas → tela de game over com pontos, mundo, duração e ranking ✔ |
| 2 | **Salvar pontuação** | No game over, tentar `ABCDEFG`, `JOÃO`, `A B`, `<x>` e vazio; depois `dh-p1` | Os 5 inválidos são rejeitados com mensagem. `DH-P1` é salvo em `localStorage['leaderboard']` e aparece como "#1 no ranking" ✔ |
| 3 | **Teto de 100** | Inserir 110 pontuações | Ficam 100, e as piores são removidas ✔ |
| 4 | **Login admin** | `/?admin=true`, primeiro com senha errada e depois com `rover` / `rover@2026` | Erro "Usuário ou senha incorretos"; depois o painel abre com as 100 linhas e as estatísticas ✔ |
| 5 | **Exportar CSV** | Botão "Exportar CSV" | Arquivo `rover-placar-AAAA-MM-DD.csv` com cabeçalho e 100 linhas ✔ |
| 6 | **Banir** | Banir `P50` | Confirmação, 1 registro removido e o apelido entra na lista de banidos ✔ |
| 7 | **Limpar placar** | Clicar em "Limpar" e depois em Cancelar; repetir e Confirmar | O aviso cita a quantidade e sugere backup. Cancelar mantém os 99 registros; confirmar zera o placar ✔ |
| 8 | **Reset total** | Senha de limpeza errada, depois `limpar@2026` | Senha errada é rejeitada; a certa (após confirmação) apaga tudo ✔ |
| 9 | **Responsividade** | 360×740, 430×900, 480×860 | Escala inteira 3×, 4× e 4×, sem rolagem horizontal, botões com 50 px e controles visíveis ✔ |
| 10 | **Cadastro** | Apelido inválido, depois válido sem aceitar a política, depois com o aceite | Erros claros; só avança com apelido válido e o aceite marcado ✔ |

Ainda não testado em aparelhos físicos (iPhone e Android médio): vale confirmar 60 fps, áudio após o primeiro toque, safe-area do notch e multitoque (andar e pular ao mesmo tempo).

---

## 8. Pendências de autorização (antes de publicar)

1. **Personagem Dheep:** é um personagem estilizado (boné e camiseta nas cores da Rover), **não** um retrato. Precisa da aprovação do Alyson "Dheep" Rover e da Rover.
2. **Ano de fundação:** o selo diz "Mais de 30 anos". Trocar para "Desde 1997" só depois da confirmação (`brand.foundedLabel`).
3. **Nome do inimigo:** hoje é "Gerente Rival" (`bossName`). Confirmar ou trocar (Diretor, outro).
4. **Logo oficial:** o "R" atual é uma releitura em pixel art. Se a Rover enviar o arquivo oficial, use `brand.officialLogo`.
5. **Domínio de publicação** e **política de privacidade** oficial (`share.gameUrl`, `privacyPolicyUrl`).
6. Nenhum logo ou embalagem de terceiros (Aurora etc.) foi usado: todos os produtos são genéricos.
