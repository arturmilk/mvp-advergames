# Dados dos jogos: planilha Google + dashboard do dono

Os jogos (hoje **Rover — A Entrega**, **Rover Happy Hour**, **Máquina do Mal em: Fuga do Poser** e **Máquina do Mal em: Busão do Rock**) mandam os dados de cada partida para uma **planilha do Google Sheets**
do cliente. O **dashboard** (`dashboard/index.html`, identidade visual da Montaggio) lê essa planilha e mostra ranking, jogadores, tempo jogado,
quanto tempo cada jogador leva para chegar a cada pontuação, etc. Tudo de todos os aparelhos, não só de um.

```
analytics.js                 coletor (o mesmo arquivo está em happy-hour/analytics.js)
analytics/apps-script/Code.gs  "servidor": Google Apps Script que grava na planilha e entrega os dados ao dashboard
analytics/dev_server.py      servidor de TESTE local (mesma API, sem conta Google)
ticket.js                    QR code de uso único (o mesmo arquivo está em happy-hour/ticket.js)
dashboard/index.html         dashboard do dono (login com endereço + token)
dashboard/config.js          nome do cliente e lista de jogos do dashboard (público: nada de token aqui)
painel-maquina-do-mal/       painel do cliente Máquina do Mal (usuário e senha; só Fuga do Poser e Busão do Rock), § 9
```

Não há servidor para manter: a planilha e o script ficam na conta Google do cliente, de graça.

---

## 1. Instalação (uma vez, uns 10 minutos)

Faça com a conta Google **do cliente** (é ela que vai ser dona dos dados).

1. Crie uma planilha nova em <https://sheets.new> e dê um nome (ex.: "Jogos — dados").
2. Na planilha: **Extensões › Apps Script**. Apague o que estiver no editor, cole todo o conteúdo de
   `analytics/apps-script/Code.gs` e salve (ícone de disquete).
3. No topo do editor, escolha a função **`setup`** e clique em **Executar**. O Google pede autorização
   ("Este app não foi verificado" › Avançado › Acessar). Isso cria as abas e o **token do dashboard**.
   O token aparece em **Registro de execução** (embaixo). Guarde-o: é a senha do dashboard.
4. **Implantar › Nova implantação** › engrenagem › **App da Web**:
   * Executar como: **Eu**
   * Quem pode acessar: **Qualquer pessoa** (os jogos precisam conseguir enviar sem login)
   * Clique em **Implantar** e copie o **URL do app da Web** (termina em `/exec`).
5. Cole esse URL nos dois `config.js`:
   * `config.js` (raiz) › `analytics.endpoint`
   * `happy-hour/config.js` › `analytics.endpoint`
   e publique os jogos de novo (ex.: commit no GitHub Pages).
6. Abra o dashboard (`/dashboard/` no mesmo site dos jogos, ou o arquivo direto), informe o URL e o token. Pronto.
   O navegador lembra o login; o botão **Sair** apaga.

> **Atualizar o script depois** (ex.: nova versão do `Code.gs`): cole o código novo, salve e use
> **Implantar › Gerenciar implantações › ✏️ › Versão: Nova versão › Implantar**. Assim o URL continua o mesmo.
> Se fizer "Nova implantação", o URL muda e é preciso atualizar os `config.js`.
>
> **Trocar o token:** rode a função `novoToken` no editor e use o novo no dashboard.

---

## 2. O que o dashboard mostra

Visual da Montaggio (creme, tinta preta, laranja e verde-limão; fontes Bricolage Grotesque e JetBrains Mono, do Google Fonts), em tela clara ou escura conforme o aparelho. Funciona no computador e no celular (testado em 360, 430, 480 e 1280 px, sem rolagem lateral; tabelas largas rolam dentro do próprio quadro).

Filtros por jogo (todos ou um) e período (hoje, 7 dias, 30 dias, tudo). Atualiza sozinho a cada minuto (a cada 10 s enquanto houver um QR disponível na tela). O dono não precisa abrir a planilha: tudo aparece no dashboard e sai em CSV. Horários aparecem com hora, minuto e segundo (a data completa fica no balão ao passar o mouse). No celular, tocar num pedaço de gráfico mostra o balão.

De cima para baixo, do mais importante para o mais específico:

1. **Visão geral:** uma frase-resumo ("28 pessoas jogaram 420 partidas nos últimos 7 dias"), quatro números grandes
   (jogadores únicos, partidas e quantas estão acontecendo agora, tempo jogado, visita que vira partida) e quatro menores
   (duração média e mediana, recorde de cada jogo com apelido, partidas salvas no ranking, QR codes usados no período).
   Logo abaixo: **partidas por dia** (barras por jogo) e quatro roscas: **como as partidas terminam**, **partidas por jogo**,
   **quem volta a jogar** (1, 2 a 4, 5 a 9, 10 ou mais partidas por jogador) e **de onde vêm** (WhatsApp, Instagram, link direto ou `utm_source`).
2. **QR codes de uso único** (§ 7): contadores, gerador e lista.
3. **Ranking e jogadores:** ranking geral (melhor pontuação de cada jogador, todos os aparelhos), jogadores e lista de partidas com busca por apelido.
4. **Detalhes das partidas:** horário das partidas, até onde chegam (mundo/nível), quanto tempo leva para chegar a cada pontuação
   (quantas partidas chegaram, mediana, média, o mais rápido com apelido e a faixa 25%–75%; tempo de jogo, sem pausas),
   distribuição de pontuação e de duração, e os botões de CSV.

As colunas `meta`, `dispositivo`, `sistema`, `tela` e `idioma` continuam sendo gravadas na planilha, mas o dashboard não as mostra.
O botão **Ver com dados de exemplo** na tela de entrada (ou `?demo` no endereço) mostra o painel com dados inventados.

### Usar com outro cliente (`dashboard/config.js`)

O dashboard não tem o nome de nenhum cliente no código. Tudo o que muda de um cliente para outro fica em `dashboard/config.js`:

| Chave | O que faz |
|---|---|
| `client` | nome do cliente no topo e na tela de entrada (vazio = só o título) |
| `title` | título do painel (padrão "Painel dos jogos") |
| `filePrefix` | começo do nome dos CSV e PNG (vazio = nome do cliente ou `jogos`) |
| `siteUrl` | site dos jogos, usado só quando o dashboard é aberto direto do arquivo |
| `games` | um item por jogo, na ordem dos filtros e das cores: `short` (nome curto), `path` (pasta do jogo), `levelLabel` (Mundo, Nível, Fase, Lendas…) e `endReasons` (texto de um motivo de fim só para aquele jogo, ex.: `vitoria`). A chave é o id do jogo no `Code.gs` |
| `endReasons` | texto de cada motivo de fim de partida (`vidas`, `tempo`…) |

O nome completo de cada jogo vem do Apps Script (constante `GAMES` do `Code.gs`), então um jogo novo aparece no dashboard assim que o
`Code.gs` o conhece, mesmo antes de entrar no `config.js` (com a pasta `<id>/`). O arquivo é público: nunca coloque o token nele.

## 3. Google Sheets e exportação

Os dados ficam no Google Sheets da conta do Apps Script (o dashboard não tem link para ela; o dono não precisa abri-la).

| Aba | Conteúdo |
|---|---|
| `Partidas` | 1 linha por partida: `session_id, jogo, player_id, apelido, inicio, fim, status, pontos, duracao_s, nivel, meta, motivo_fim, entregas, combo_max, itens, erros, salvo_ranking, apelido_ranking, posicao_ranking, dispositivo, sistema, tela, idioma, origem, utm_source, utm_campaign, versao, atualizado` |
| `Marcos` | quando cada partida alcançou cada pontuação (`tipo = pontos`) e cada mundo/nível (`tipo = nivel`): `valor`, `segundos` de jogo e `pontos` no momento |
| `Eventos` | visitas (`visit`), cadastros (`register`, A Entrega) e compartilhamentos no WhatsApp (`share`) |
| `Ranking` | fórmula: melhor pontuação por jogo e apelido |
| `Resumo` | fórmulas: partidas, jogadores únicos, horas jogadas, médias, recorde, visitas, salvas no ranking (por jogo) |
| `Tempo até pontuação` | fórmula: média/mínimo/máximo de segundos até cada pontuação |
| `QR` | QR codes de uso único gerados no dashboard (§ 7) |

Não edite as abas `Partidas`, `Marcos` e `Eventos` à mão (o script procura as partidas pela coluna A).
Para fazer as suas análises, crie abas novas ou use **Arquivo › Fazer uma cópia**. Dá para baixar tudo em
**Arquivo › Fazer download** (.xlsx, .csv).

O dashboard também baixa **CSV** de cada visão (respeitando os filtros): partidas, tempo até cada pontuação, marcos, ranking,
jogadores, resumo por dia e eventos. Os arquivos usam vírgula, UTF-8, datas `AAAA-MM-DD HH:MM:SS` e números inteiros,
para o Google Sheets reconhecer em qualquer idioma (**Arquivo › Importar › Fazer upload**).

## 4. Como os dados são coletados

* **Jogador** = um aparelho/navegador (`player_id` aleatório guardado no `localStorage`). Os dois jogos no mesmo domínio
  dividem o mesmo `player_id`, então dá para ver quem jogou os dois. Limpar os dados do navegador gera um jogador novo.
* **Partida:** `start` quando começa, `milestone` a cada pontuação de `analytics.milestones` (no `config.js` de cada jogo) e a cada
  mundo/nível, `end` no fim e `save` quando o jogador salva o nome no ranking.
* **Abandono:** se a aba fica oculta no meio da partida, o jogo manda um `checkpoint` com pontos e tempo até ali.
  Se a partida não terminar em 30 minutos, o dashboard a mostra como **abandonada**.
* Os eventos ficam numa fila no aparelho e saem em poucas requisições (início, fim, salvar, aba oculta).
  Sem internet, a fila é reenviada na próxima visita. O script ignora eventos repetidos.
* Com `analytics.endpoint` vazio, nada é enviado e os jogos funcionam como antes.

## 5. Limites e cuidados

* **O endereço de envio é público** (está no `config.js`). Alguém mal-intencionado consegue mandar partidas falsas para a planilha.
  O script limita os valores, mas não há como provar que uma pontuação veio de uma partida real num jogo 100% no navegador.
  Antes de premiar alguém, confira a partida (duração, marcos e tempo até cada pontuação compatíveis com a pontuação).
* **Leitura protegida por token:** sem o token, o Web App não devolve nada. O dashboard em si é uma página pública, mas vazia sem o token.
* **Cotas do Google** (conta gratuita): sobra para uma campanha de advergame (cada partida gasta 2 a 4 chamadas).
  Uma planilha aguenta 10 milhões de células: perto de 100 mil partidas (depois, faça uma cópia e limpe as abas de dados).
* **LGPD:** os textos de consentimento e privacidade da A Entrega já dizem que os dados das partidas vão para a Rover.
  O **WhatsApp não é enviado** (`analytics.sendWhatsapp: false`). Se ligar, ajuste antes os textos em `config.js`.
  O Happy Hour não tem tela de cadastro: envia apelido (se salvo), pontos e tipo de aparelho.

## 6. Testar sem conta Google

```bash
python analytics/dev_server.py
```

* Jogo: <http://localhost:8790/?analytics=http://localhost:8790/exec>
* Happy Hour: <http://localhost:8790/happy-hour/?analytics=http://localhost:8790/exec>
* Fuga do Poser: <http://localhost:8790/fuga-do-poser/?analytics=http://localhost:8790/exec>
* Busão do Rock: <http://localhost:8790/busao-do-rock/?analytics=http://localhost:8790/exec>
* Dashboard: <http://localhost:8790/dashboard/> (endereço `http://localhost:8790/exec`, token `teste`)
* Painel do cliente: <http://localhost:8790/painel-maquina-do-mal/?api=http://localhost:8790/exec> (contas de teste
  `admin@teste` / `teste1234` e `cliente@teste` / `123456`; só existem no servidor de teste e voltam ao padrão quando ele reinicia)

O parâmetro `?analytics=` só funciona em `localhost`. Os dados de teste ficam em `analytics/dev_data.json` (fora do git); apague o arquivo para zerar.
Os QR codes gerados no dashboard de teste já levam o `?analytics=` no link, então funcionam direto em `localhost`.

**Testes do dashboard (27/10/2026, Chromium oculto):** em 360, 430, 480 e 1280 px, com dados de exemplo e com o servidor de teste
(6 partidas enviadas pelo contrato dos jogos), sem rolagem lateral e com o console limpo; entrar com `teste`, filtros por jogo,
gerar QR, queimar com `qr_use` e ver o carimbo "QR CODE USADO" aparecer sozinho em até 10 s; tema escuro conferido no computador.
Não testado em celular físico.

## 7. QR codes de uso único

No dashboard, o quadro **QR codes de uso único** gera um QR code (ou vários, até 50 de uma vez) para qualquer jogo da lista (**A Entrega**, **Happy Hour**, **Fuga do Poser**, **Busão do Rock**),
com uma nota opcional de onde vai ser usado (ex.: "Loja Centro"). Cada QR leva a um link com um código aleatório de 18 letras
(`?qr=…`, 72 bits, impossível de adivinhar). Dá para mostrar na tela, copiar o link, baixar o PNG (com o nome do jogo embaixo) ou imprimir todos numa folha.

**Como funciona no jogo** (`ticket.js`, o mesmo arquivo na raiz e em `happy-hour/`):

1. Ao abrir o link, o jogo confere o código na planilha (`qr_check`) e tira o `?qr=` da barra de endereço.
2. No **primeiro toque na tela**, o código é queimado (`qr_use`): a aba QR da planilha passa de `novo` para `usado`, com data,
   `player_id` e um id aleatório da aba (`acesso`). O toque é repetido no botão tocado, para o jogador não precisar tocar duas vezes.
3. Quem abrir o mesmo link depois (outro celular, outra aba, ou o mesmo link mandado no WhatsApp) vê **"QR code já usado"**.
   Se duas pessoas abrirem antes de alguém tocar, quem tocar primeiro fica com ele; a outra vê o aviso.
4. Recarregar a mesma aba não bloqueia (o id da aba fica no `sessionStorage`).

Na lista do dashboard aparecem todos os códigos com a situação (disponível, usado, cancelado), quando foram usados e o botão
**Cancelar** (para um QR impresso que se perdeu). Os QR mostrados na tela ganham o carimbo **"QR CODE USADO às HH:MM:SS"** sozinhos, em até 10 s depois do primeiro toque, sem recarregar a página. Na planilha, a aba é `QR` (`codigo, jogo, status, criado, usado_em, player_id, acesso, nota`).

Configuração em `config.js` › `ticket` (cada jogo):

| Chave | Padrão | O que faz |
|---|---|---|
| `required` | `true` | `true`: o jogo **só abre com QR** (sem código mostra "Precisa de um QR code"). `false`: o link normal do jogo continua livre e só os links com `?qr=` são de uso único |
| `oneGame` | `true` | Cada QR vale uma partida. No Happy Hour, "Jogar de novo" mostra "Partida concluída" (A Entrega já é 1 partida por abertura) |
| `offline` | `'block'` | Sem internet não dá para conferir o código: `'block'` mostra "Sem conexão" com "Tentar de novo"; `'allow'` deixa jogar sem queimar |
| `texts` | `{}` | Troca qualquer texto dos avisos (nomes no começo do `ticket.js`: `used`, `usedTitle`, `invalid`, `missing`, `offline`, `played`…) |

**Uma partida por QR, conferida no servidor** (desde 09/11/2026):

* O início de cada partida (`start`, no `analytics.js`) leva o código do QR e o id da aba que o queimou. O `Code.gs` só aceita
  a partida se o QR é deste jogo, foi queimado por **esta mesma aba** e ainda não tem partida; a primeira fica gravada na coluna
  `partida` da aba QR, e o código vai na coluna `qr` da aba Partidas.
* Qualquer outra (2ª partida com o mesmo QR, id de aba errado, pontuação mandada direto para o `/exec`) entra na aba Partidas com
  status **`bloqueada`**: não aparece no Ranking, no Resumo nem no dashboard (o quadro de QR mostra quantas foram bloqueadas).
* `QR_OBRIGATORIO`, no começo do `Code.gs`, lista os jogos que **só** aceitam partida com QR (hoje `rover` e `happy-hour`,
  iguais ao `ticket.required: true` dos `config.js`). Se mudar o `required` de um jogo, mude aqui também; senão as partidas
  sem QR desse jogo vão aparecer como bloqueadas.
* No aparelho: `?admin=true` só abre o painel (para **jogar** continua precisando de QR), "duplicar aba" não dá partida extra
  (o contador também fica no `localStorage`) e, se o `ticket.js` não carregar, um jogo com `required: true` não começa.

**Limites:**

* Precisa de internet no aparelho: a validação é na planilha. Sem internet, com `offline: 'block'`, o jogo não abre.
* Quem já abriu e tocou pode manter a aba aberta (e recarregar) pelo tempo que quiser, mas só a primeira partida conta.
* Para testar em `localhost` sem QR (ganchos `__rover`/`__hh`), abra com `?livre`.
* Com `required: false` (hoje Fuga do Poser e Busão do Rock), quem receber um QR já usado pode apagar o `?qr=` do link e jogar pelo
  link normal. Para valer de verdade, use `required: true` e ponha o jogo em `QR_OBRIGATORIO`.
* O jogo roda no navegador: quem sabe usar o DevTools consegue abrir a tela do jogo de novo no próprio aparelho. Essa partida
  chega na planilha como `bloqueada` e não conta. A pontuação em si continua sendo informada pelo aparelho: antes de premiar,
  confira duração e marcos como em § 5.

**Pentest (09/11/2026, `dev_server.py` + Chromium):** 11 ataques no Happy Hour (jogar de novo, F5, aba duplicada, outro celular,
link sem `?qr=`, `?admin=true`, `ticket.js` bloqueado, contadores zerados no DevTools, 3 pontuações forjadas direto no `/exec`,
corrida de dois aparelhos). Antes: 7 barrados. Depois: 11 barrados, com exatamente 1 partida válida por QR na planilha.

**Depois de atualizar o `Code.gs`** (este recurso precisa da versão nova): cole o código novo, salve e use
**Implantar › Gerenciar implantações › ✏️ › Versão: Nova versão › Implantar**. Não use "Nova implantação" (o URL `/exec` mudaria).
A aba `QR` é criada sozinha no primeiro QR gerado. Depois de colar o `Code.gs` de 09/11/2026, rode **`setup`** uma vez pelo editor (Executar › setup): ele refaz as fórmulas do Ranking e do Resumo para ignorar partidas `bloqueada` e mantém o token. As colunas novas (`qr` em Partidas, `partida` em QR) aparecem sozinhas. Publique primeiro os jogos (push) e só depois a versão nova do Apps Script. Sem a versão nova, o botão do dashboard avisa que o Apps Script precisa ser publicado.

## 8. Colocar um jogo novo no painel

Feito assim para o **Fuga do Poser** e o **Busão do Rock** (05/11/2026). O id do jogo é o `analytics.game` do `config.js` do jogo
(ex.: `busao-do-rock`) e precisa ser igual nos quatro lugares abaixo.

1. **`analytics/apps-script/Code.gs`**: incluir o id e o nome completo na constante `GAMES`. É a mesma lista que vale para o QR de
   uso único (`qr_new`/`qr_check`/`qr_use` recusam ids que não estão nela) e para a coleta (ids desconhecidos são descartados).
2. **`analytics/dev_server.py`**: o mesmo id na constante `GAMES` (servidor de teste).
3. **`dashboard/config.js`** › `games`: `short`, `path` (pasta do jogo) e `levelLabel`; `endReasons` se algum motivo de fim
   precisar de texto próprio do jogo (ex.: `vitoria`). O jogo entra sozinho nos filtros, no ranking e no gerador de QR.
4. **Apps Script** (projeto "jogos"): colar o `Code.gs` novo, salvar e publicar em
   **Implantar › Gerenciar implantações › ✏️ (a implantação do `/exec` que está nos jogos) › Versão: Nova versão › Implantar**.
   Nunca "Nova implantação". Depois rodar `setup` uma vez (cria a linha do jogo na aba `Resumo`).
5. Testar: uma partida de teste chega na aba `Partidas`, o jogo aparece no painel, um QR gerado para ele abre o jogo e fica "usado"
   no primeiro toque. Apagar as linhas de teste (abas `Partidas`, `Marcos`, `Eventos`, `QR`).

O QR obrigatório (`ticket.required` no `config.js` do jogo) fica desligado até a versão nova do Apps Script estar publicada.

**Busão do Rock (05/11/2026), servidor de teste:** partida (2 lendas, fim por tempo) aparece no painel com o filtro "Busão do Rock",
nível "Lendas 2" e motivo "Fim do tempo"; QR gerado para o Busão abre o jogo, tira o `?qr=` do link, fica `usado` no primeiro
toque e o mesmo link em outra aba mostra "QR code já usado". Não testado em celular físico.

## 9. Painel do cliente (Máquina do Mal)

<https://arturmilk.github.io/mvp-advergames/painel-maquina-do-mal/> é uma cópia do dashboard para o cliente **Máquina do Mal**
(Felipe), com o mesmo visual da Montaggio. Diferenças:

* **Entrada com usuário e senha** (não com URL + token). Duas contas: a do Arthur (administrador) e a do Felipe.
* **Só os jogos Fuga do Poser e Busão do Rock.** O filtro é feito **no Apps Script**: o servidor nem envia as partidas, marcos,
  eventos e QR da A Entrega, do Happy Hour ou de qualquer outro jogo. A página ainda descarta qualquer linha de outro jogo (segunda trava).
  O gerador de QR só aceita os dois jogos, e só dá para cancelar QR desses jogos. Sem link da planilha.
* **Trocar senha** (botão com a chave no topo): pede a senha atual e a nova (mínimo 8 caracteres, não só números).
  Trocar a senha desconecta os outros aparelhos dessa conta.
* **Senha provisória:** a conta do Felipe começa com a senha que o Arthur escolheu e marcada como provisória: no primeiro acesso o painel
  já abre "Trocar senha" (dá para clicar em "Agora não"; uma faixa verde fica lembrando até ele trocar).
* **Esqueci a senha:** não há e-mail para recuperação. O Arthur entra na conta dele › **Contas** › **Gerar senha provisória**
  para a conta do Felipe. A senha antiga deixa de valer na hora; o Felipe entra com a provisória e escolhe uma nova.
* O `?demo` no endereço continua mostrando dados de exemplo (só dos dois jogos).

**Segurança**

* Nenhuma senha fica no repositório (que é público). As contas ficam nas **Propriedades do script** (`PAINEL_USUARIOS`), com
  a senha guardada só como hash SHA-256 com sal (1.000 rodadas). O `painel-maquina-do-mal/config.js` só tem o URL `/exec`, que já era público.
* A sessão é um código assinado pelo servidor (HMAC com `PAINEL_SEGREDO`, que fica nas Propriedades) e vale 7 dias. Trocar ou
  redefinir a senha invalida as sessões antigas. A senha vai no corpo de um POST, nunca no endereço.
* **5 senhas erradas seguidas bloqueiam a conta por 15 minutos** (isso também impede adivinhar senha por tentativa).
* Limites: não há verificação em duas etapas nem recuperação por e-mail.
  Quem conseguir a senha vê os dados dos dois jogos e gera QR codes deles, mas não vê os outros jogos nem a planilha.

**Instalação (uma vez, com a conta Google dona do projeto "jogos")**

1. Abra o projeto "jogos" no Apps Script, apague o conteúdo de `Code.gs`, cole o `analytics/apps-script/Code.gs` novo e salve.
2. Rode **`setup`** uma vez (Executar › setup). Mantém o token e atualiza as fórmulas (necessário também para o QR de uso único de 09/11).
3. **Contas:** o arquivo privado `contas-apps-script.gs.txt` (fora do git; entregue no projeto do Claude) cria as duas contas só com o hash
   das senhas. Crie um arquivo de script novo no editor, cole, rode `instalarContasMaquinaDoMal`, confira no Registro de execução e apague o arquivo.
   Para criar outra conta: num arquivo temporário, `painelConta_('login', 'senha', { nome: 'Nome', painel: 'maquina-do-mal' })`, rode e apague.
   `painelContas` lista as contas (sem senha); `painelSairTodos` desconecta todo mundo.
4. **Implantar › Gerenciar implantações › ✏️ › Versão: Nova versão › Implantar.** Nunca "Nova implantação" (o URL `/exec` mudaria).
5. Abra o painel e entre com as duas contas.

Até a versão nova estar publicada, a tela de entrada mostra "O servidor ainda não tem o painel do cliente".

**Outro cliente:** acrescente um painel em `PAINEIS` (no `Code.gs`) com a lista de jogos, copie a pasta `painel-maquina-do-mal/`,
troque o `config.js` (nome, jogos) e crie as contas com `painel: '<id do painel>'`.

**Testes (10/11/2026):** `Code.gs` rodado em Node com os serviços do Google simulados (34 verificações: login certo e errado, bloqueio
na 5ª tentativa, sessão adulterada ou de outro login recusada, dados só dos dois jogos, sem `acesso` dos QR, troca e redefinição de senha
derrubando a sessão antiga, cliente sem acesso a "Contas", QR da Rover recusado, coleta dos jogos intacta) e conferência do arquivo de contas
com as duas senhas reais. Painel com `dev_server.py` + Chromium oculto em 360, 430, 480 e 1280 px (28 verificações: só "Fuga do Poser" e
"Busão do Rock" nos filtros e nenhum texto da Rover na página, primeiro acesso pedindo troca de senha, senha fraca recusada, troca, sair e
entrar, sessão mantida ao recarregar, senha provisória pelo administrador, bloqueio, sem rolagem lateral, console limpo).
Não testado com o Apps Script de verdade (depende do passo 4) nem em celular físico.

## 10. Duas planilhas: Rover e Máquina do Mal (10/11/2026)

Os dados da Máquina do Mal ficam numa planilha separada, também na conta emailmontaggio@gmail.com:

| Planilha | Projeto do Apps Script | Jogos (propriedade `JOGOS`) | Quem usa o `/exec` |
|---|---|---|---|
| **Jogos Rover — dados** | `jogos` | `rover,happy-hour` | `config.js` (A Entrega), `happy-hour/config.js`, `dashboard/` (token) |
| **Máquina do Mal — jogos (dados)** | `jogos - Máquina do Mal` | `fuga-do-poser,busao-do-rock` | `fuga-do-poser/config.js`, `busao-do-rock/config.js`, `painel-maquina-do-mal/` (usuário e senha) |

* Os dois projetos rodam o **mesmo `Code.gs`**. A diferença é só a propriedade do script `JOGOS` (Configurações do projeto ›
  Propriedades do script): o servidor só aceita, guarda, mostra e gera QR para os jogos dessa lista. Sem `JOGOS`, aceita todos.
* Cada projeto tem o próprio token do dashboard e as próprias contas do painel. As contas do Arthur e do Felipe estão no projeto
  da Máquina do Mal (as do projeto `jogos` não são mais usadas).
* **Histórico:** o Fuga do Poser e o Busão do Rock foram copiados da planilha antiga para a nova (Marcos 137 linhas, Eventos 137,
  QR 75, com os QR ainda disponíveis valendo na planilha nova). A aba Partidas da planilha antiga já estava vazia, então não havia
  partidas para copiar. Nada foi apagado da planilha antiga; as linhas antigas da Máquina do Mal continuam lá, mas o projeto `jogos` não as mostra.
* Para ver os jogos da Máquina do Mal no `dashboard/` do dono, entre nele com o `/exec` da Máquina do Mal e o token desse projeto
  (aparece no Registro de execução ao rodar `setup` ou `novoToken` no projeto `jogos - Máquina do Mal`).
* Atualizar o `Code.gs`: cole nos **dois** projetos e publique em cada um (Gerenciar implantações › Nova versão).
