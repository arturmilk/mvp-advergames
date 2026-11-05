/* =========================================================================
   Máquina do Mal em: Busão do Rock — configuração central
   Todo texto, tempo, pontuação, física, personagem e senha do jogo fica aqui.
   Depois de editar, basta recarregar a página (não há build).
   Este arquivo é PÚBLICO (GitHub Pages): nunca coloque token ou segredo aqui.
   ========================================================================= */
const CONFIG = {
  version: 'br-1.0',
  clientName: 'Máquina do Mal',
  gameName: 'Busão do Rock',

  /* ---------- Tempo e relógio ---------- */
  time: {
    start: 90,           // segundos no começo da partida
    bonus: 15,           // segundos ganhos a cada resgate
    warnAt: 10,          // a partir daqui o cronômetro pisca e a sirene toca a cada segundo
    countdown: 3,        // contagem 3-2-1 antes de largar
    clockStart: 18 * 60, // relógio do jogo: 18:00 ...
    clockEnd: 19 * 60    // ... até 19:00 (chega às 19:00 exatamente quando o tempo zera)
  },

  /* ---------- Pontos ---------- */
  points: {
    rescue: 500,         // por lenda resgatada
    winPerSecond: 10     // bônus na vitória: pontos por segundo que sobrou no cronômetro
  },
  goals: [               // título no fim da partida (min = pontuação mínima)
    { min: 0,    name: 'Motorista de Primeira Viagem' },
    { min: 1500, name: 'Roadie de Respeito' },
    { min: 3500, name: 'Piloto do Apocalipse' },
    { min: 5000, name: 'Lenda da Estrada' }
  ],
  winTitle: 'O Show Vai Começar!',

  /* ---------- Cidade ---------- */
  city: {
    blocks: 7,           // quarteirões por lado (7×7)
    blockSize: 46,       // tamanho do quarteirão em metros (com a calçada)
    roadWidth: 16,       // largura da rua (duas faixas)
    sidewalk: 3.5,       // largura da calçada
    minH: 14, maxH: 44,  // altura dos prédios (m)
    parkChance: 0.12,    // chance de um quarteirão virar praça com árvores
    lampEvery: 20,       // um poste a cada N metros de calçada
    treeEvery: 15,       // uma árvore a cada N metros (alternando com os postes)
    storeBlock: [3, 4],  // quarteirão da loja Máquina do Mal [coluna, linha] (0 = canto)
    seed: 7,             // semente da cidade (a cidade é sempre a mesma; a rota dos resgates muda a cada partida)
    texMeters: 18        // largura (m) que uma textura de fachada cobre antes de repetir
  },

  /* ---------- Ônibus (física arcade; metros e segundos) ---------- */
  bus: {
    length: 12, width: 2.7, height: 3.3,
    maxSpeed: 27,        // m/s (≈ 97 km/h)
    maxReverse: 9,       // m/s de ré
    accel: 9,            // aceleração com o pedal no fundo (≈ 4 s até a velocidade máxima)
    brake: 26,           // freio (pedal de freio com o ônibus andando pra frente)
    drag: 2.2,           // desaceleração sem pedal
    wheelBase: 7,
    steerMax: 0.55,      // rad: esterço máximo das rodas
    steerSpeed: 4,       // quão rápido o volante vira
    steerAtTop: 0.45,    // em velocidade máxima o esterço cai para 45% (estabilidade)
    lean: 0.07,          // inclinação lateral nas curvas
    bounce: 0.35,        // quanto da velocidade sobra ao bater num prédio
    hornCooldown: 0.4
  },

  /* ---------- Câmera ---------- */
  camera: { distance: 15, height: 7, lookAhead: 8, lookHeight: 2, follow: 5, fov: 62 },

  /* ---------- Resgates ---------- */
  pickup: {
    radius: 7.5,         // raio da zona neon (m): encostou o ônibus, embarcou
    maxSpeed: 0,         // 0 = embarca em qualquer velocidade; ex.: 8 = precisa passar devagar (até 8 m/s)
    minDist: 110,        // distância mínima (m, em linha reta) entre um resgate e o próximo
    maxDist: 240,        // distância máxima
    lineTime: 3.4        // segundos que o balão de fala fica na tela
  },

  /* ---------- Gráficos (desempenho no celular) ---------- */
  render: {
    maxPixelRatio: 1.5,  // telas retina renderizam no máximo a 1,5× (economiza bateria)
    fogNear: 60, fogFar: 230,
    antialias: true
  },

  /* ---------- Personagens (PLACEHOLDERS) ----------
     image: caminho da imagem final (PNG/webp com fundo transparente, em pé, de frente), ex.: 'assets/chars/ozzy.webp'.
     Vazio = boneco provisório simples na cor `color` com o nome escrito.
     line = fala cômica no balão quando embarca. A ordem da lista é a ordem dos resgates. */
  characters: [
    { id: 'ozzy',     name: 'Ozzy Osbourne', color: '#5B3A8C', image: '', line: 'Eu tava procurando um morcego... tava com fome, entende?... SHAROOOON!' },
    { id: 'raul',     name: 'Raul Seixas',   color: '#8C5A2B', image: '', line: 'Tentei outra vez e você finalmente chegou!' },
    { id: 'kurt',     name: 'Kurt Cobain',   color: '#C23A2B', image: '', line: 'Que cheiro é esse? Ah, é espírito de busão!' },
    { id: 'chorao',   name: 'Chorão',        color: '#2B7AC2', image: '', line: 'O skate me ensinou a chegar até atrasado, truta!' },
    { id: 'rita',     name: 'Rita Lee',      color: '#E0572B', image: '', line: 'Ovelha negra da família, mas passageira VIP desse busão!' },
    { id: 'purple',   name: 'Deep Purple',   color: '#7A2BC2', image: '', line: 'Fumaça na água, fogo no céu... e eu aqui no ponto!' },
    { id: 'slipknot', name: 'Slipknot',      color: '#C2702B', image: '', line: 'Tô de máscara pra ninguém ver que eu esperei uma hora no ponto.' },
    { id: 'sepultura',name: 'Sepultura',     color: '#3A7A2B', image: '', line: 'Roots, bloody roots! Raiz mesmo é esperar ônibus no sol!' },
    { id: 'angus',    name: 'Angus Young',   color: '#1F3F8C', image: '', line: 'Cuidado, motorista, essa avenida é uma Highway to Hell!' },
    { id: 'axl',      name: 'Axl Rose',      color: '#B0151B', image: '', line: 'Welcome to the jungle, baby! Selva mesmo é esse trânsito!' }
  ],

  /* ---------- Felipe (protagonista, aparece só na HQ) — PLACEHOLDER ---------- */
  felipe: { name: 'Felipe', color: '#2B2B2B', image: '' },

  /* ---------- HQ de abertura (3 quadros) ---------- */
  comic: {
    title: 'Máquina do Mal em: Busão do Rock',
    panels: [
      { caption: 'Fim de tarde, centro da cidade.', line: 'Mais um dia na Máquina do Mal... espera aí...' },
      { caption: '18:00 em ponto.', poster: 'SHOW DE ROCK HOJE ÀS 19H!', line: 'Puta merda! O show é logo ao anoitecer e as bandas ainda tão espalhadas pela cidade!' },
      { caption: 'Garagem da loja.', line: 'Bora botar o ônibus na pista e juntar essa galera!' }
    ],
    button: 'COMEÇAR (TELA CHEIA)'
  },

  /* ---------- Partidas ---------- */
  // 'none'   = pode tentar de novo quantas vezes quiser (padrão, como pede o briefing)
  // 'visit'  = 1 partida cada vez que o link é aberto (recarregar a aba NÃO libera outra)
  // 'device' = 1 partida por aparelho, para sempre
  onePlayPer: 'none',

  /* ---------- Textos ---------- */
  texts: {
    tagline: 'Resgate as 10 lendas e chegue à loja antes das 19:00!',
    howTitle: 'Como jogar',
    howTips: [
      'Siga a SETA verde e amarela no topo da tela: ela aponta para a próxima lenda e mostra a distância.',
      'Passe o ônibus pela zona neon no chão para embarcar a lenda: +15 segundos e +500 pontos.',
      'Depois da 10ª lenda, a seta aponta de volta para a loja Máquina do Mal. Chegue lá antes do tempo zerar!',
      'Celular: ◀ ▶ à esquerda para virar; à direita, o pedal grande acelera e o FREIO/RÉ freia e dá ré. Teclado: W A S D ou setas; H buzina.'
    ],
    goStore: 'TODO MUNDO A BORDO! Volta pra loja!',
    winTitle: 'O show vai começar!',
    winLine: 'As 10 lendas subiram no palco da Máquina do Mal. Que noite!',
    loseTitle: 'Deu 19:00...',
    loseLines: [
      'O show começou sem as bandas. A galera tá tocando air guitar.',
      'O público cantou à capela e o Felipe ainda tá no trânsito.',
      'Faltou banda no palco. Bora tentar de novo?'
    ],
    quitTitle: 'Viagem encerrada',
    retry: 'TENTAR NOVAMENTE',
    savedTitle: 'Nome gravado!',
    playedMsg: 'Valeu por jogar! É uma partida por vez que o link é aberto. Confira o ranking.',
    playedMsgDevice: 'Valeu por jogar! Cada aparelho tem direito a uma partida. Confira o ranking.',
    footer: 'Um jogo da Máquina do Mal. Personagens provisórios.'
  },

  /* ---------- Admin (/?admin=true ou segurar o título da HQ por 3 s) ---------- */
  // Troque antes de publicar. Se preencher ADMIN_PASS_SHA256, ele tem prioridade e ADMIN_PASS pode ficar vazio.
  ADMIN_USER: 'admin',
  ADMIN_PASS: 'busao2026',
  ADMIN_PASS_SHA256: '',
  ADMIN_DELETE_PASSWORD: 'DELETE_ALL_2026',

  /* ---------- Coleta de dados (dashboard + planilha Google) ---------- */
  // endpoint = URL do Web App do Apps Script (termina em /exec). Vazio = não envia nada. Veja ../analytics/README.md
  // ATENÇÃO: 'busao-do-rock' ainda precisa entrar na constante GAMES do Code.gs (e o Apps Script, ganhar nova versão).
  analytics: {
    game: 'busao-do-rock', // não troque: é a chave deste jogo na planilha
    endpoint: 'https://script.google.com/macros/s/AKfycbyOZORbDFYrL_rfN4JM_fgma4S2ReeeZjYA6e11ZdyVexaaIVB5ZD8KOt95Q3QTCNpJhA/exec',
    milestones: [500, 1500, 2500, 3500, 5000, 6000]
  },

  /* ---------- QR code de uso único (ticket.js) ----------
     required: false = o link normal é livre; só os links ?qr= do dashboard são de uso único.
               true  = só abre com QR do dashboard. Ligue SÓ depois de publicar a nova versão do Apps Script
                       (com 'busao-do-rock' na constante GAMES), senão todo QR aparece como inválido. */
  ticket: {
    required: false,
    oneGame: true,
    offline: 'block',
    color: '#B0151B',
    texts: {
      used: 'Este QR code já foi usado por outra pessoa. Cada QR code vale para uma pessoa só.',
      invalid: 'Este QR code não existe ou é de outro jogo. Confira o link.',
      cancelled: 'Este QR code foi cancelado. Peça um novo.',
      missing: 'Para jogar, leia o QR code que você recebeu.'
    }
  },

  /* ---------- Placar local (o ranking geral fica na planilha) ---------- */
  leaderboardMax: 100,
  publicTop: 50,
  nickPattern: '^[A-Z0-9-]{1,6}$', // depois de converter para maiúsculas
  storageKeys: {           // prefixo br_ (o domínio é dividido com os outros jogos; não troque)
    leaderboard: 'br_leaderboard',
    stats: 'br_stats',
    banned: 'br_banned',
    player: 'br_player',
    settings: 'br_settings',
    played: 'br_played',
    admin: 'br_admin_session'
  },
  // Filtro de apelidos (mesmo dos outros jogos: ignora maiúsculas, acentos, hífen, letras repetidas e números no lugar de letras)
  nickFilter: {
    contains: [
      'morte', 'nazi', 'hitler', 'pinto', 'penis', 'xoxota', 'xota', 'buceta', 'boceta', 'bunda', 'bosta', 'merda',
      'porra', 'caralh', 'carai', 'foda', 'fode', 'fuder', 'puta', 'puto', 'viado', 'viad', 'cacete', 'piroca', 'xereca',
      'punhet', 'boquet', 'estupr', 'pedof', 'porno', 'sexo', 'cuzao', 'cuzin', 'arromb', 'otario', 'babaca', 'macaco',
      'crioul', 'fuck', 'shit', 'bitch', 'dick', 'porn', 'nigg', 'suicid', 'cocain', 'maconh', 'rapariga', 'vagabund',
      'safad', 'corno', 'broxa', 'brocha', 'peido', 'cagar', 'cagao', 'mijo'
    ],
    exact: [
      'cu', 'ku', 'cus', 'pau', 'rola', 'pica', 'xana', 'xxt', 'kct', 'krl', 'crl', 'fdp', 'vsf', 'tnc', 'pqp', 'vtnc',
      'tmnc', 'bct', 'ppk', 'cock', 'cum', 'ass', 'sex', 'anal', 'rape', 'kill', 'kkk', 'matar', 'mijar'
    ]
  },

  /* ---------- Áudio (tudo sintetizado no navegador com Web Audio) ---------- */
  musicVolume: 0.2,
  sfxVolume: 0.6,
  engineVolume: 0.16,
  musicTempo: 150
};
window.CONFIG = CONFIG;
