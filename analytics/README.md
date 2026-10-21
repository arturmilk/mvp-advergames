# Dados dos jogos: planilha Google + dashboard do dono

Os dois jogos (**Rover — A Entrega** e **Rover Happy Hour**) mandam os dados de cada partida para uma **planilha do Google Sheets**
da Rover. O **dashboard** (`dashboard/index.html`) lê essa planilha e mostra ranking, jogadores, tempo jogado,
quanto tempo cada jogador leva para chegar a cada pontuação, etc. Tudo de todos os aparelhos, não só de um.

```
analytics.js                 coletor (o mesmo arquivo está em happy-hour/analytics.js)
analytics/apps-script/Code.gs  "servidor": Google Apps Script que grava na planilha e entrega os dados ao dashboard
analytics/dev_server.py      servidor de TESTE local (mesma API, sem conta Google)
dashboard/index.html         dashboard do dono (login com endereço + token)
```

Não há servidor para manter: a planilha e o script ficam na conta Google da Rover, de graça.

---

## 1. Instalação (uma vez, uns 10 minutos)

Faça com a conta Google **da Rover** (é ela que vai ser dona dos dados).

1. Crie uma planilha nova em <https://sheets.new> e dê um nome (ex.: "Jogos Rover — dados").
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

Filtros por jogo (todos / A Entrega / Happy Hour) e período (hoje, 7 dias, 30 dias, tudo). Atualiza sozinho a cada minuto.

* **Números do topo:** jogadores únicos, partidas, tempo total jogado, duração média e mediana, pontuação média, recorde (com apelido),
  visitas e quantas viraram partida, partidas salvas no ranking.
* **Partidas por dia** e **horário das partidas**.
* **Quanto tempo leva para chegar a cada pontuação:** para cada marco (100, 250, 500, 1.000 pts…), quantas partidas chegaram lá,
  a mediana, a média, o mais rápido (com apelido) e a faixa típica (25%–75%). O tempo é de jogo, sem contar pausas.
* **Distribuição de pontuação** e **duração das partidas**.
* **Até onde chegam** (mundo na A Entrega, nível no Happy Hour), **como as partidas terminam** (vidas, itens, tempo, encerrou, abandonou)
  e **aparelhos/origem** (celular/computador, Android/iOS, WhatsApp/Instagram/link direto/`utm_source`).
* **Ranking geral** (melhor pontuação de cada jogador, todos os aparelhos), **jogadores** e **lista de partidas** com busca por apelido.
* Botão **Ver com dados de exemplo** na tela de login, para conhecer o painel antes de ter dados reais.

## 3. Google Sheets e exportação

Os dados **já estão no Google Sheets**: o botão **Abrir planilha no Google Sheets** (topo do dashboard) leva direto para ela.

| Aba | Conteúdo |
|---|---|
| `Partidas` | 1 linha por partida: `session_id, jogo, player_id, apelido, inicio, fim, status, pontos, duracao_s, nivel, meta, motivo_fim, entregas, combo_max, itens, erros, salvo_ranking, apelido_ranking, posicao_ranking, dispositivo, sistema, tela, idioma, origem, utm_source, utm_campaign, versao, atualizado` |
| `Marcos` | quando cada partida alcançou cada pontuação (`tipo = pontos`) e cada mundo/nível (`tipo = nivel`): `valor`, `segundos` de jogo e `pontos` no momento |
| `Eventos` | visitas (`visit`), cadastros (`register`, A Entrega) e compartilhamentos no WhatsApp (`share`) |
| `Ranking` | fórmula: melhor pontuação por jogo e apelido |
| `Resumo` | fórmulas: partidas, jogadores únicos, horas jogadas, médias, recorde, visitas, salvas no ranking (por jogo) |
| `Tempo até pontuação` | fórmula: média/mínimo/máximo de segundos até cada pontuação |

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
* Dashboard: <http://localhost:8790/dashboard/> (endereço `http://localhost:8790/exec`, token `teste`)

O parâmetro `?analytics=` só funciona em `localhost`. Os dados de teste ficam em `analytics/dev_data.json` (fora do git); apague o arquivo para zerar.
