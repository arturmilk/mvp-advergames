# Drink às Cegas

Jogo cooperativo para **dois celulares** (retrato, 360–480 px). Um jogador é o **GUIA** e vê a receita. O outro é o **MISTURADOR** e vê ícones misteriosos, sem saber qual ingrediente é cada um. Os dois veem a mesma taça e conversam em voz alta, fora do app. A partida dura **45 segundos**. O sommelier **Bigode** comenta a taça nos dois celulares, e os ingredientes caem com física 2D. No fim, os dois veem o drink esperado, o que foi para a taça (cada ícone e o ingrediente de verdade) e uma **nota de 0 a 10**.

- URL futura: `https://arturmilk.github.io/mvp-advergames/drink-as-cegas/`
- QR code: `qr/qr-drink-as-cegas.png` e `.svg` (gerar de novo com `python drink-as-cegas/tools/make_qr.py [url]`)
- Tudo o que é ajustável fica no `config.js`: tempo, receitas, ingredientes, nota, avatar, conexão e textos.
- Sem planilha, Apps Script nem dashboard por enquanto (não carrega `analytics.js` e não tem id em `GAMES`).
- `localStorage` com prefixo próprio `dc_` (`dc_player`, `dc_code`).

## Fluxo

1. **Apelido**: 1 a 6 caracteres `A–Z 0–9 -`, com o mesmo `nickFilter` dos outros jogos.
2. **Avatar**: 6 avatares prontos, ou monte com cor, rosto e acessório (adesivos SVG desenhados no código).
3. **Códigos**: "Seu código" (4 caracteres, sem 0/O e 1/I/L) e "Colocar código". Quem digita o código do outro chama para a partida. "Convidar" compartilha o link `…/drink-as-cegas/?c=CÓDIGO`, que já chama ao abrir.
4. **Partida encontrada**: o jogo sorteia quem é o GUIA (`roles`) e explica o papel. Os dois apertam "Estou pronto", aí vem a contagem 3, 2, 1.
5. **Partida (45 s)**:
   - GUIA: card da receita (rosa) e a taça.
   - MISTURADOR: a taça, 12 ícones misteriosos (glifo e cor sorteados a cada partida), "Tirar o último" e "Servir!".
   - A taça é a mesma para os dois e mostra o que caiu nela (`mixerSeesRealInGlass`).
6. **Resultado**: nota e estrelas, a tabela "receita × feito", "o que foi para a taça" (ícone = ingrediente) e Revanche (os papéis trocam) ou Sair.

## Sommelier Bigode (`CONFIG.sommelier`)

É uma **cabeça gigante em cartoon simples**, de traço preto grosso e cor chapada, com topete, óculos redondos, bigodão e gravata-borboleta. Fica à direita, atrás da taça, olhando para o drink, na mesma posição para o guia e para o misturador.

- Foi desenhado à mão em SVG, dentro do `index.html` (`sommelierSVG()`), e não pesa nada a mais.
- As expressões trocam por classe: `neutral`, `hmm` (sobrancelha levantada e olhos semicerrados), `happy`, `disgust` e `surprised`. A boca abre e fecha enquanto ele fala (`talking`).
- Ele pisca sozinho e balança a cabeça de leve.
- Ingrediente certo deixa ele feliz, ingrediente errado dá cara de nojo e passar da quantidade dá cara de surpresa.

- **Uma fala por ingrediente:** todo ingrediente que cai na taça é anunciado pelo nome ("Limão!"), por no máximo 1 s (`nameMs`).
- **Observações:** ele também solta comentários como "É uma mistura bem... arrojada.". Saem logo depois do nome, quando não chega outro ingrediente, e dependem do momento: no início, depois de um ingrediente errado, quando passa da quantidade, ao tirar o último ou ao acaso. As frases e as chances ficam em `sommelier.lines` e `*Chance`.
- **Iguais nos dois:** quem hospeda escolhe a fala, com sorteio pela semente da partida, e manda junto com o estado da taça.

## Visual

- Cards no estilo **letreiro neon**: um tubo claro com brilho colorido, mais um filete interno.
- Raios proporcionais: card com 24 px, filete com 18 px (24 − 6) e elementos internos com 8 px (24 − 16 de respiro).
- Fundo de parede de tijolo bem sutil. O título acende como neon e os cards piscam ao acender.
- Botão principal sólido, com degrau embaixo (sem gradiente).
- Resultado: "Jogar de novo" (mesmo parceiro, papéis trocados) fica fixo no rodapé da tela. Sem contador de itens na taça, sem a linha de acertos e pontos e sem o card "O que foi para a taça" (a tabela "receita × feito" já mostra o que entrou).
- Tela cheia (`fullscreen.js`, igual aos outros jogos) no primeiro toque em qualquer botão (Android/iPad; o iPhone não permite tela cheia em página).
- Na partida, "Tirar o último" (com ícone de voltar) ocupa 70% da largura e "Servir" 30%.

## Física (`CONFIG.physics`, Matter.js 0.20)

- Os sólidos (limão, gelo, hortelã, morango, açúcar) caem do topo da tela, quicam e se empilham na taça.
- Os líquidos caem como gota. Ao chegar na superfície, fazem **splash**: uma coroa de gotas da cor do líquido, um anel na superfície e os sólidos próximos dão um pulinho. Depois viram camada.
- Paredes invisíveis sobem acima da borda e são grossas, para nada atravessar nem quicar para fora.
- "Tirar o último" remove o corpo.
- O Matter.js (`vendor/matter.min.js`, MIT, 26 KB com gzip) carrega com `defer`, sem atrasar a primeira tela. Se não carregar, a taça volta para o desenho estático.
- No máximo 14 corpos e um único canvas, com nitidez limitada a 2×.
- Cada celular simula a física por conta própria. A taça tem o mesmo conteúdo nos dois, mas a posição exata de cada item pode variar um pouco.

**Peso da página (com gzip):** cerca de 165 KB no total, contando HTML, PeerJS, Matter.js, sommelier e fontes.

## Nota do drink (`CONFIG.scoring`)

`acerto = (unidades certas − 0,75 × unidades erradas ou a mais) ÷ unidades da receita`, e `nota = acerto × 10`, arredondada em 0,5. Só o drink idêntico à receita tira 10. Pontos = nota × 100, mais até +300 pelo tempo que sobrou, só no drink perfeito. Os pontos já estão prontos para um ranking futuro, mas ainda não são enviados para lugar nenhum. As frases de cada faixa ficam em `scoring.labels`.

## Conexão entre os dois celulares

**Escolha: WebRTC com PeerJS** (`vendor/peerjs.min.js` 1.5.4, licença MIT, copiado para o repositório, sem npm e sem build).

- O código do jogador é o id dele no **servidor público e gratuito do PeerJS** (`0.peerjs.com`), com o prefixo `mtg-drinkcegas-`. Não usa chave nem segredo.
- O servidor só apresenta os dois celulares. Depois, os dados (toques, taça, relógio) vão direto de um celular para o outro.
- Quem **foi chamado** hospeda a partida: sorteia a receita e os ícones, controla o relógio e calcula a nota. Quem chamou só envia os toques e mostra o que recebe, então os dois sempre veem a mesma taça e o mesmo resultado.

**Limitações:**

- O servidor público e os servidores TURN do PeerJS não têm garantia (SLA). Se caírem, ninguém consegue criar código. Para evento grande, suba um `peerjs-server` próprio (é grátis, mas precisa de hospedagem) e preencha `net.peerServer`.
- Algumas redes bloqueiam conexão direta (4G com CGNAT, Wi-Fi de empresa). Nesses casos o PeerJS passa pelo TURN público dele, que pode ser lento ou falhar. A mensagem do jogo sugere "os dois no 4G ou no mesmo Wi-Fi".
- Se um celular bloquear a tela ou trocar de app, a conexão pode cair. Depois de 10 s sem sinal, o outro volta para a tela de códigos.
- Não existe ranking nem servidor próprio. A pontuação fica só na tela.

**Modos de teste:**

- `?local=1`: duas **abas do mesmo navegador** conversam por `BroadcastChannel`, sem internet. Cada aba é um "celular" (usa `sessionStorage`).
- `?bot=1`: libera o código `BOT`, um parceiro simulado. Quando o BOT é o guia, ele "fala" em balões. Quando é o misturador, acerta cerca de 75% das vezes. Serve para demonstração com uma pessoa só. Dá para combinar os dois: `?local=1&bot=1`.

## Ganchos de teste (`window.__dc`)

`__dc.step(s)` avança o relógio e a física manualmente (o modo determinístico; os temporizadores reais param de contar). `__dc.fx()` mostra os corpos e quantos estão dentro da taça, e `__dc.talk()` mostra a fala atual do sommelier. Também há `__dc.seed(n)` (fixa o sorteio de receita e ícones no lado que hospeda), `__dc.tap(id)` (toca no ícone misterioso desse ingrediente), `__dc.recipe()`, `__dc.role()`, `__dc.state()`, `__dc.score(recipe, glass, leftMs)` e `__dc.setPlayer(nick)`.

## Testes feitos (18/11/2026, sommelier + física + 45 s)

`tools/teste-playwright.js`, 41 verificações, rodado 5 vezes seguidas sem falha:

- O sommelier fala o nome do último ingrediente, com o mesmo texto e o mesmo número de fala nos dois celulares.
- Depois de assentar, todos os sólidos ficam dentro da taça nos dois (guia e misturador).
- Os líquidos viram camada.
- "Tirar o último" remove o corpo.
- O tempo esgota em 45 s.
- Partida com BOT, 360/430/480 px sem rolagem horizontal e console limpo.

## Testes anteriores (17/11/2026)

`tools/teste-playwright.js` (Chromium headless, duas abas `?local=1`, viewport de celular, 37 verificações, rodado 3 vezes seguidas sem falha):

- O apelido `B0STA` é barrado. `ANA` passa para o avatar.
- Código curto é recusado e código inexistente avisa "não encontrado".
- B digita o código de A: os dois entram na partida com papéis diferentes. O guia não vê os ícones e o misturador não vê a receita nem o nome dos ingredientes.
- Receita completa com 1 erro, "Tirar o último" e acerto: o relógio fica igual nos dois, "Servir!" dá **nota 10** e o resultado é idêntico nos dois.
- Na revanche os papéis trocam. Com o tempo esgotado e a taça incompleta, a nota é 1,5.
- Quando um sai, o outro volta para a tela de códigos.
- 360, 430 e 480 px sem rolagem horizontal nas 6 telas.
- Partida contra o BOT termina. Console limpo.

Para rodar: `python -m http.server 8811` na raiz do repositório e `node drink-as-cegas/tools/teste-playwright.js <pasta-das-fotos>`.

**Não testado:**

- **celular físico**
- **conexão real entre dois celulares pelo PeerJS** (o ambiente de teste não acessa o `0.peerjs.com`)
- iPhone/Safari
- vibração
- fontes e performance em aparelho fraco

## Arquivos

- `index.html`: telas, desenhos SVG (adesivos), rede e lógica
- `config.js`: tudo o que é ajustável
- `vendor/peerjs.min.js`: PeerJS (MIT)
- `assets/fonts/`: Space Grotesk e Plus Jakarta Sans (OFL), servidas pelo próprio site
- `assets/icon-*.png`: gerados por `tools/make_icons.py`
- `qr/`: QR code (`tools/make_qr.py`, requer `pip install segno`)
- `montaggio-selo.js`: cópia idêntica à dos outros jogos

## Pendências

- Decidir sobre bebida alcoólica (CONAR, possível público menor de idade). `alcoholFree: true` deixa só receitas sem álcool.
- LGPD: não há tela de privacidade. Hoje nada sai do celular além do apelido e do avatar, que vão só para o parceiro.
- Testar em dois celulares de verdade, em 4G e em Wi-Fi.
- Se for usado em evento grande, ter um servidor PeerJS próprio.
- Depois: analytics (id novo em `GAMES` no `Code.gs`, nova versão do Apps Script, filtro no dashboard) e ranking.
