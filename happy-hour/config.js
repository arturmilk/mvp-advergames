/* =========================================================================
   Rover Happy Hour — configuração central
   Todo texto, cor, limiar, tempo e senha do jogo fica aqui.
   Depois de editar, basta recarregar a página (não há build).
   ========================================================================= */
const CONFIG = {
  // Branding
  mascotName: 'Dheep',
  companyName: 'Rover Distribuidora',
  foundedYear: '30+ anos', // troque para '1997' só depois da confirmação da Rover

  // Jogo (resolução lógica: a largura é fixa; a altura acompanha a tela do aparelho)
  canvasWidth: 360,
  canvasHeight: 640,     // altura de referência (a velocidade de queda é proporcional à altura real)
  characterY: 540,       // linha do piso na altura de referência (= altura - 100 px)
  characterWidth: 60,    // largura da hitbox do personagem
  characterSpeed: 330,   // px/s andando
  characterAccel: 2600,  // px/s² (arranque/frenagem suaves)

  // Itens e pontuação (w/h = hitbox em px lógicos; o desenho é maior: drawScale)
  items: {
    frango:    { name: 'Frango a passarinho', score: 10, rarity: 'common',   speedFactor: 1,   w: 30, h: 30, color: '#E8642C' },
    batata:    { name: 'Batata frita',        score: 15, rarity: 'common',   speedFactor: 1,   w: 30, h: 30, color: '#FFC21F' },
    cerveja:   { name: 'Cerveja gelada',      score: 25, rarity: 'rare',     speedFactor: 1.3, w: 30, h: 50, color: '#B8741A', every: [5, 10] },
    calabresa: { name: 'Calabresa',           score: 35, rarity: 'veryRare', speedFactor: 1.5, w: 30, h: 30, color: '#9E1B1B', every: [8, 12] }
  },
  itemDrawScale: 1.7,    // o sprite é desenhado 70% maior que a hitbox, para ficar legível no celular
  baseFallSpeed: 150,    // px/s na altura de referência, nível 1
  fallSpeedGrowth: 0.07, // +7% de velocidade de queda por degrau de dificuldade
  maxFallSpeedMult: 1.9, // teto do multiplicador da velocidade de queda

  // Dificuldade
  initialSpawnInterval: 1500,        // ms entre spawns (começa aqui)
  difficultyIncrementInterval: 10000, // aumenta a cada 10 s
  difficultyFactor: 0.85,            // multiplica o intervalo (diminui = mais rápido)
  minSpawnInterval: 300,             // teto de velocidade
  maxLevel: 10,                      // nível exibido no HUD (1 a 10)

  // Combo e bônus
  comboEvery: 3,                       // a cada 3 itens seguidos o multiplicador sobe
  comboSteps: [1, 1.5, 2, 2.5],        // x1 → x1.5 → x2 → x2.5 (teto)
  speedBonusMax: 0.5,                  // até +50% por item no nível máximo (linear)

  // Game Over
  missesAllowed: 5,
  gameDuration: 90000, // 90 s máx. Use 0 para jogar até perder os 5 itens

  // Metas por faixa de pontos (min = pontuação mínima)
  goals: [
    { min: 0,   name: 'Iniciante no Happy Hour' },
    { min: 50,  name: 'Aperitivo Aprovado' },
    { min: 150, name: 'Mestre da Comilança' },
    { min: 300, name: 'Campeão do Happy Hour' }
  ],

  // Admin  (/?admin=true ou segurar o logo da tela de título por 3 s)
  // Troque antes de publicar. Se preencher ADMIN_PASS_SHA256, ele tem prioridade e ADMIN_PASS pode ficar vazio.
  ADMIN_USER: 'admin',
  ADMIN_PASS: 'pito2026',
  ADMIN_PASS_SHA256: '',
  ADMIN_DELETE_PASSWORD: 'DELETE_ALL_2026', // exigida para o "Reset total"

  // Cores
  primaryRed: '#E30613',
  primaryOrange: '#FF6A13',
  primaryYellow: '#FFD21F',
  darkGray: '#2B2B2B',
  amber: '#FFA726',
  barBrown: '#8B6A47',
  gold: '#F2B33D',
  bronze: '#B87333',

  // Textos
  titleText: 'Chegou o Happy Hour',
  gameName: 'Rover Happy Hour',
  subtitleText: 'Coma o máximo que conseguir!',
  tutorialText: 'Use as setas para se mover. Colete frango, batata frita, cerveja e calabresa!',
  finalText: 'Rover Distribuidora — abastecendo o happy hour de Rondônia desde [foundedYear]',
  lore: 'Chegou a hora do happy hour em Porto Velho! {mascot}, o garoto da Rover, está no seu bar favorito quando começa a promoção da semana: comer o máximo de petiscos antes que o garçom leve tudo embora. Frango a passarinho, batata frita, calabresa e cerveja gelada não param de cair do balcão. {mascot} vai precisar de reflexo rápido, coragem e estômago de aço!',
  tutorialTips: [
    'Segure ◀ ou ▶ para andar. No computador, use as setas do teclado.',
    'Cada petisco vale pontos diferentes. Os mais raros caem mais rápido!',
    'Pegue 3 seguidos para subir o combo (até x2,5).',
    'Se 5 petiscos caírem no chão, {mascot} perde a fome e o jogo acaba.'
  ],
  gameOverTitle: '{mascot} não aguenta mais!',
  gameOverLines: [
    'O garçom recolheu as porções. Fica pra próxima rodada!',
    'Barriga cheia, coração feliz. Mas dava pra mais um petisco, hein?',
    'A promoção acabou, mas o happy hour continua!'
  ],
  timeUpTitle: 'Fim da promoção!',
  savedTitle: 'Parabéns!',
  about: {
    intro: 'A Rover Distribuidora é uma empresa de família de Porto Velho (RO), com mais de 30 anos de mercado. A matriz fica na R. Eduardo Lima e Silva, 1043, no bairro Agenor de Carvalho, e a empresa também opera o Rover Atacarejo.',
    reach: 'Atende mais de 3 mil clientes em Rondônia e em parte do Amazonas.',
    mission: 'Ser canal de distribuição especializado em produtos de qualidade, agregando valor aos negócios dos clientes.',
    vision: 'Ser reconhecida como empresa referência em distribuição de produtos de qualidade, fomentar a economia de Rondônia e gerar crescimento e satisfação de clientes e colaboradores.',
    values: ['Respeito aos clientes', 'Comprometimento', 'Rapidez e eficiência', 'Preços justos e éticos'],
    mascot: '{mascot} é a força jovem da Rover: começou na empresa aos 18 anos e cresceu nos bastidores. O personagem do jogo é uma versão em cartoon, inspirada nele.'
  },

  // Placar (localStorage) — nenhum dado sai do aparelho
  leaderboardMax: 100,
  publicTop: 50,
  nickPattern: '^[A-Z0-9-]{1,6}$', // depois de converter para maiúsculas
  storageKeys: {
    leaderboard: 'hh_leaderboard', // publicado no mesmo domínio que "Rover — A Entrega" (que usa 'leaderboard'); não troque
    stats: 'hh_stats',
    banned: 'hh_banned',
    player: 'hh_player',
    settings: 'hh_settings',
    tutorialSeen: 'hh_tut_seen'
  },
  // Filtro de apelidos (ignora maiúsculas, acentos, hífen, letras repetidas e números no lugar de letras)
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

  // Áudio (trilha e efeitos sintetizados no navegador)
  musicVolume: 0.32,
  sfxVolume: 0.6,
  musicTempo: 112 // BPM do sambinha de boteco
};
window.CONFIG = CONFIG;
