/* =========================================================================
   Máquina do Mal em: Fuga do Poser — configuração central
   Todo texto, cor, tempo, velocidade, camisa e senha do jogo fica aqui.
   Depois de editar, basta recarregar a página (não há build).
   Este arquivo é PÚBLICO (GitHub Pages): nunca coloque token ou segredo aqui.
   ========================================================================= */
const CONFIG = {
  version: 'fp-1.0',
  clientName: 'Máquina do Mal',
  gameName: 'Fuga do Poser',
  heroName: 'o headbanger',

  /* ---------- Tela (resolução lógica: largura fixa de 360; a altura acompanha o aparelho) ---------- */
  canvasWidth: 360,
  canvasHeight: 640,     // altura de referência
  floorFromBottom: 132,  // distância do chão até a base da tela (área dos botões fica abaixo do chão)
  pxPerMeter: 20,        // 20 px lógicos = 1 metro (distância e velocímetro)

  /* ---------- Velocidade (auto-scroll) ---------- */
  speed: {
    base: 220,           // px/s no começo (≈ 40 km/h no velocímetro)
    stepEvery: 30,       // a cada 30 s a tela acelera...
    stepFactor: 1.12,    // ...12%
    maxMult: 2.0         // teto: 2× a velocidade inicial
  },

  /* ---------- Protagonista ---------- */
  hero: {
    homeX: 0.56,         // posição "confortável" na tela (fração da largura)
    catchup: 1.35,       // corre até 1,35× a velocidade da tela para voltar à posição confortável
    drawH: 92,           // altura do desenho (px lógicos)
    w: 28, h: 66, slideH: 28, // hitbox em pé / deslizando
    gravity: 2500,
    jumpV: 860,          // pulo simples ≈ 148 px de altura
    doubleJumpV: 760,    // segundo pulo no ar (+115 px)
    jumpCut: 0.45,       // soltar o botão cedo corta o pulo (pulo curto)
    coyote: 0.09,        // ainda pode pular logo depois de sair da beirada
    jumpBuffer: 0.12,    // toque um pouco antes de aterrissar ainda vale
    stumbleTime: 0.35,   // tropeço (cabos, pedestal, treliça na cabeça)
    stumbleSpeed: 0.25,  // durante o tropeço anda a 25% da velocidade da tela
    pitClimb: 0.45       // caiu no buraco: tempo para escalar e sair do outro lado
  },

  /* ---------- O Poser ---------- */
  poser: {
    x: 34,               // centro do desenho na tela (canto esquerdo)
    reach: 62,           // se o herói chegar a esta distância da borda esquerda, o Poser alcança
    drawH: 104,
    lineEvery: [4.5, 7.5], // segundos entre um balão de fala e outro
    lineTime: 3.4,       // quanto tempo cada balão fica na tela
    lines: [
      'Adoro Slipknot, mas só as que não têm gritaria!',
      'Rock in Rio é o melhor festival de rock pesado do mundo.',
      'Aquele baixista do Iron Maiden só toca com três dedos, mó fácil.',
      'Curto muito metal, minha favorita é Sweet Child O\' Mine.',
      'Ei! Cita 3 músicas da sua banda preferida aí!',
      'Esse corpsepaint aí é fantasia de Halloween?',
      'Eu ia no show, mas tava muito alto.',
      'Metal bom é balada romântica, o resto é barulho.'
    ],
    caughtLine: 'Peraí! Cita 3 músicas da sua banda favorita então…'
  },

  /* ---------- Obstáculos e fases ---------- */
  // w/h = hitbox (px lógicos). kind: 'solid' bloqueia (precisa pular), 'trip' faz tropeçar, 'overhead' precisa deslizar.
  obstacles: {
    amps:    { kind: 'solid',    w: 46, h: 88, drawH: 96, weight: 3 },
    monitor: { kind: 'solid',    w: 48, h: 50, drawH: 74, weight: 3 },
    cables:  { kind: 'trip',     w: 56, h: 14, drawH: 26, weight: 3 },
    stand:   { kind: 'trip',     w: 62, h: 18, drawH: 36, weight: 2 },
    truss:   { kind: 'overhead', w: 86, h: 92, drawH: 106, gap: 48, weight: 2 } // gap = vão livre do chão até a parte de baixo
  },
  level: {
    startClear: 420,     // px sem obstáculos depois da intro
    reaction: 0.72,      // tempo mínimo (s) entre um perigo e o próximo, na velocidade atual
    extraGap: [0.25, 0.9], // folga extra sorteada (s)
    pitW: [70, 120],     // buraco simples (px), cresce com a velocidade
    pitPlatW: [180, 240],// buraco largo com plataforma no meio
    pitChance: 0.2,
    pitPlatChance: 0.1,
    platRowChance: 0.12, // degraus de plataformas com camisas em cima
    doubleChance: 0.18,  // dois obstáculos em sequência curta (a partir da fase 2)
    shirtChance: 0.6     // chance de vir uma camisa depois de cada perigo
  },

  /* ---------- Camisas ----------
     O nome aparece escrito na camisa em texto genérico (nada de logo oficial).
     effect: 'win' | 'slow' | 'break' | 'dash' | 'shield' | 'voltage' | 'collect' | 'invert'
     weight = frequência relativa; color = cor da camisa (black, white, red, grey, purple, green) */
  shirts: {
    judas:     { name: 'Judas Priest', sub: 'PAINKILLER', color: 'red',    effect: 'win',     points: 1000, weight: 0 },
    mayhem:    { name: 'Mayhem',       color: 'black',  effect: 'slow',    points: 0,   weight: 8 },
    meshuggah: { name: 'Meshuggah',    color: 'grey',   effect: 'break',   points: 40,  weight: 7 },
    sodom:     { name: 'Sodom',        color: 'black',  effect: 'dash',    points: 40,  weight: 4 },
    sepultura: { name: 'Sepultura',    color: 'green',  effect: 'dash',    points: 40,  weight: 4 },
    slayer:    { name: 'Slayer',       color: 'red',    effect: 'dash',    points: 40,  weight: 4 },
    sabbath:   { name: 'Black Sabbath',color: 'purple', effect: 'shield',  points: 40,  weight: 8 },
    acdc:      { name: 'AC/DC',        color: 'black',  effect: 'voltage', points: 60,  weight: 5 },
    aerosmith: { name: 'Aerosmith',    color: 'white',  effect: 'voltage', points: 60,  weight: 4 },
    purple:    { name: 'Deep Purple',  color: 'purple', effect: 'voltage', points: 60,  weight: 4 },
    venom:     { name: 'Venom',        color: 'black',  effect: 'collect', points: 150, weight: 5 },
    saxon:     { name: 'Saxon',        color: 'grey',   effect: 'collect', points: 150, weight: 5 },
    opeth:     { name: 'Opeth',        color: 'green',  effect: 'collect', points: 150, weight: 5 },
    mastodon:  { name: 'Mastodon',     color: 'white',  effect: 'collect', points: 150, weight: 5 },
    megadeth:  { name: 'Megadeth',     color: 'red',    effect: 'collect', points: 150, weight: 5 },
    beatles:   { name: 'Beatles',      color: 'white',  effect: 'invert',  points: 0,   weight: 6 },
    oasis:     { name: 'Oasis',        color: 'white',  effect: 'invert',  points: 0,   weight: 5 }
  },
  effects: {
    slow:    { time: 4,   factor: 0.67, label: 'CAMISA ENVENENADA! -30% de velocidade' },
    break:   { time: 5,   label: 'RITMO POLIRRÍTMICO! Quebra tudo' },
    dash:    { time: 1.3, mult: 2.0, maxX: 0.8, label: 'DASH BRUTAL!' },
    shield:  { time: 0,   label: 'AURA PROTETORA! Ignora o próximo impacto' },
    voltage: { time: 8,   jumpMult: 1.16, scoreMult: 1.5, label: 'HIGH VOLTAGE JUMP!' },
    collect: { multStep: 0.25, multMax: 4, label: 'TRVE METAL! Multiplicador' },
    invert:  { time: 2,   label: 'Vinheta acústica… controles trocados!' },
    win:     { label: 'METAL GOD ASCENDED' }
  },
  // A camisa sagrada (Judas Priest — Painkiller) só aparece depois de sacredAfter segundos,
  // com sacredChance por camisa sorteada, sempre num lugar difícil (alto, pede pulo duplo).
  sacredAfter: 90,
  sacredChance: 0.05,

  /* ---------- Pontuação ---------- */
  pointsPerMeter: 1,     // pontos por metro corrido (× multiplicador Trve Metal)
  goals: [               // título no fim da partida (min = pontuação mínima)
    { min: 0,    name: 'Poser em Treinamento' },
    { min: 1000, name: 'Headbanger de Respeito' },
    { min: 3000, name: 'Guerreiro do Corpsepaint' },
    { min: 8000, name: 'Lenda do Underground' }
  ],
  winTitle: 'Metal God Ascended',

  /* ---------- Intro (jogador descendo do ônibus) ---------- */
  intro: {
    duration: 2.0,       // segundos
    busW: 330,           // largura do ônibus na tela
    poserShout: 'Ei, cara! Peraí!'
  },

  /* ---------- Partidas ---------- */
  // 'visit'  = 1 partida cada vez que o link é aberto (recarregar a aba NÃO libera outra)
  // 'device' = 1 partida por aparelho, para sempre  |  'none' = sem limite (ex.: totem)
  onePlayPer: 'visit',

  /* ---------- Textos ---------- */
  texts: {
    tagline: 'Fuja do poser. Pegue as camisas.',
    tutorialTitle: 'Máquina do Mal em: Fuga do Poser',
    tutorial: 'O seu papel é fugir desse poser chato que fica te pedindo pra citar 3 músicas da sua banda preferida. Foge desse desgraçado e pegue todas as camisas que conseguir!',
    tutorialTips: [
      'Toque em PULAR para pular. Toque de novo no ar para o pulo duplo.',
      'Segure DESLIZAR para passar por baixo das treliças.',
      'Cada camisa tem um efeito: umas ajudam, outras atrapalham. A do Judas Priest (Painkiller) vence o jogo!'
    ],
    caughtTitle: 'O Poser te alcançou!',
    caughtLines: [
      'Agora aguenta 40 minutos de papo sobre a "fase pesada" do Bon Jovi.',
      'Ele pediu 3 músicas. Você travou. Fim de papo.',
      'Mais um "curto metal, mas só as lentas". Fica pra próxima fuga.'
    ],
    winLine: 'O solo triunfal ecoou e o Poser sumiu do mapa!',
    quitTitle: 'Fuga encerrada',
    savedTitle: 'Nome gravado!',
    playedMsg: 'Valeu por jogar! É uma partida por vez que o link é aberto. Confira o ranking.',
    playedMsgDevice: 'Valeu por jogar! Cada aparelho tem direito a uma partida. Confira o ranking.',
    footer: 'Um jogo da Máquina do Mal.'
  },

  /* ---------- Admin (/?admin=true ou segurar o título por 3 s) ---------- */
  // Troque antes de publicar. Se preencher ADMIN_PASS_SHA256, ele tem prioridade e ADMIN_PASS pode ficar vazio.
  ADMIN_USER: 'admin',
  ADMIN_PASS: 'poser2026',
  ADMIN_PASS_SHA256: '',
  ADMIN_DELETE_PASSWORD: 'DELETE_ALL_2026',

  /* ---------- Coleta de dados (dashboard + planilha Google) ---------- */
  // endpoint = URL do Web App do Apps Script (termina em /exec). Vazio = não envia nada. Veja ../analytics/README.md
  analytics: {
    game: 'fuga-do-poser', // não troque: é a chave deste jogo na planilha (constante GAMES do Code.gs)
    endpoint: 'https://script.google.com/macros/s/AKfycbyOZORbDFYrL_rfN4JM_fgma4S2ReeeZjYA6e11ZdyVexaaIVB5ZD8KOt95Q3QTCNpJhA/exec',
    milestones: [100, 250, 500, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000]
  },

  /* ---------- QR code de uso único (ticket.js) ----------
     required: false = o link normal é livre; só os links ?qr= do dashboard são de uso único.
               true  = só abre com QR do dashboard. Ligue SÓ depois de publicar a nova versão do Apps Script
                       (com 'fuga-do-poser' na constante GAMES), senão todo QR aparece como inválido.
     oneGame: cada QR vale UMA partida | offline: 'block' ou 'allow' | texts: troque os textos das telas de aviso */
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
  storageKeys: {           // prefixo fp_ (o domínio é dividido com os outros jogos; não troque)
    leaderboard: 'fp_leaderboard',
    stats: 'fp_stats',
    banned: 'fp_banned',
    player: 'fp_player',
    settings: 'fp_settings',
    played: 'fp_played',
    admin: 'fp_admin_session'
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

  /* ---------- Cores ---------- */
  colors: { blood: '#B0151B', fire: '#FF5A1F', bone: '#F2EBDD', night: '#140A1A', chrome: '#C9CED6', tacky: '#FFD21F' },

  /* ---------- Áudio (riff e efeitos sintetizados no navegador) ---------- */
  musicVolume: 0.26,
  sfxVolume: 0.6,
  musicTempo: 168
};
window.CONFIG = CONFIG;
