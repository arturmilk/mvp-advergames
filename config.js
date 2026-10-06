/* =====================================================================
   ROVER — CONFIGURAÇÃO ÚNICA DO JOGO
   Tudo que a Rover pode querer trocar (textos, cores, limiares,
   senhas, nomes) fica aqui. Não é preciso mexer no index.html.
   ===================================================================== */
window.CONFIG = {
  version: '1.0.0',

  /* ---------- Marca ---------- */
  brand: {
    name: 'Rover Distribuidora',
    slogan: 'Rover Distribuidora — mais perto de você.',
    // PENDENTE de confirmação da Rover: trocar para 'Desde 1997' se confirmado.
    foundedLabel: 'Mais de 30 anos',
    city: 'Porto Velho — RO',
    clients: 'mais de 3 mil clientes',
    // Logo oficial (opcional). Se a Rover fornecer o PNG, coloque em assets/ e
    // informe o caminho aqui (ex.: 'assets/logo-oficial.png'). Vazio = logo pixel art.
    officialLogo: ''
  },

  // Personagem estilizado (NÃO é retrato). Publicar só com autorização.
  mascotName: 'Dheep',
  // PENDENTE: nome do inimigo (Gerente Rival, Diretor, outro).
  bossName: 'Gerente Rival',

  /* ---------- Paleta ---------- */
  colors: {
    red: '#E30613',
    orange: '#FF6A13',
    yellow: '#FFD21F',
    graphite: '#2B2B2B',
    white: '#FFFFFF',
    amber: '#FFA726',
    blue: '#3BA7FF'
  },

  /* ---------- Textos ---------- */
  texts: {
    title: 'ROVER',
    subtitle: 'A Entrega',
    lore:
      'Em Rondônia, onde as estradas são longas e o calor não perdoa, {mascot} assumiu a missão de manter as prateleiras de mais de 3 mil clientes sempre cheias. ' +
      'Cada entrega no prazo mantém uma mercearia aberta, um restaurante servindo e uma família abastecida. ' +
      'Mas a estrada tem obstáculos: chuva amazônica, poeira, trânsito e pressa. ' +
      'Dê o seu melhor para fazer a entrega chegar — com rapidez, eficiência e preço justo.',
    tutorial: [
      '◀ ▶  Segure as setas para andar. Segurando, {mascot} acelera.',
      '⤒  Toque no PULO para subir pelas aberturas das vigas e saltar obstáculos.',
      'Suba até o topo e alcance o {boss} para concluir a entrega!',
      'Desvie de barris, caixas e garrafas. Cada batida custa 1 vida (você tem 3).',
      'Pegue caixas de alimentos (+10) e a rara moeda R (+50). A cada 5 coletas seguidas o combo sobe: x2 → x3 → x5.',
      'Power-ups (até 2 ao mesmo tempo): capa de chuva = escudo · nitro = velocidade 2x · ímã = puxa itens · preço justo = pontos x2.',
      'Entregue rápido e sem batidas para ganhar bônus de eficiência. Não deixe o tempo da entrega acabar!'
    ],
    about: [
      'A Rover Distribuidora é uma empresa de família de Porto Velho (RO), com mais de 30 anos de mercado.',
      'Atende mais de 3 mil clientes em Rondônia e parte do Amazonas, e opera também o Rover Atacarejo.',
      'Missão: ser canal de distribuição especializado em produtos de qualidade, agregando valor aos negócios dos clientes.',
      'Valores: respeito aos clientes, comprometimento, rapidez e eficiência, preços justos e éticos.'
    ],
    gameOver: [
      'A estrada foi dura hoje — mas amanhã tem mais entrega!',
      'Prateleira cheia é cliente feliz. Bora tentar de novo?',
      'Rapidez e eficiência se treinam. Mais uma rota?'
    ],
    deliveryDone: 'Entrega concluída!',
    consent:
      'Li e aceito a política de privacidade. Meus dados ficam só neste aparelho e podem ser apagados pela Rover.',
    privacy:
      'Este jogo não envia dados para servidores. O apelido e (se informado) o WhatsApp ficam salvos apenas no navegador deste aparelho, ' +
      'para montar o placar. O placar público mostra só apelido e pontos. A Rover pode apagar todos os dados a qualquer momento. ' +
      'Para pedir a exclusão, fale com a equipe Rover.'
  },
  // Link externo para a política (opcional). Vazio = abre o texto acima no próprio jogo.
  privacyPolicyUrl: '',

  /* ---------- Mundos / níveis (limiares de pontos) ---------- */
  levels: [
    { score: 0,    name: 'Centro de Distribuição', short: 'Centro',  theme: 'warehouse',
      intro: 'O galpão está a todo vapor. Hora de carregar!' },
    { score: 500,  name: 'BR-364',                 short: 'Rodovia', theme: 'highway',
      intro: 'Containers, caminhões e poeira na rodovia.' },
    { score: 1500, name: 'Interior de Rondônia',   short: 'Interior',theme: 'forest',
      intro: 'Passarela sobre a floresta. Cuidado com a chuva!' },
    { score: 3500, name: 'Margens do Rio Madeira', short: 'Madeira', theme: 'river',
      intro: 'Pontão no rio ao entardecer. Última parada!' }
  ],
  levelUpBonus: 100,

  // Títulos por faixa de pontuação
  ranks: [
    { score: 0,    title: 'Estagiário da Rota' },
    { score: 300,  title: 'Ajudante de Entrega' },
    { score: 1000, title: 'Motorista Rover' },
    { score: 2500, title: 'Supervisor de Rota' },
    { score: 5000, title: 'Mestre da Distribuição' }
  ],

  /* ---------- Pontuação ---------- */
  scoring: {
    food: 10,            // caixa/saco/leite/refri/congelado
    coin: 50,            // moeda R (rara)
    powerup: 20,
    jumpOver: 10,        // saltar por cima de um obstáculo
    comboEvery: 5,       // coletas seguidas para subir o multiplicador
    comboSteps: [1, 2, 3, 5], // teto configurável
    deliveryBase: 150,   // alcançar o inimigo no topo
    timeBonusPerSec: 2,  // bônus de rapidez (segundos restantes)
    noHitBonus: 100      // bônus de eficiência (entrega sem batidas)
  },

  /* ---------- Jogo ---------- */
  game: {
    lives: 3,
    deliveryTime: 50,    // segundos para chegar ao topo; zerou = perde 1 vida
    // Quantas partidas o jogador pode fazer:
    //   'visit'  = 1 partida cada vez que o link é aberto (recarregar a página na mesma aba NÃO libera outra)
    //   'device' = 1 partida por aparelho/navegador, para sempre (só o admin libera, com "Reset total")
    //   'none'   = sem limite (ex.: totem em loja)
    onePlayPer: 'visit',
    maxInventory: 2,     // power-ups diferentes ao mesmo tempo
    invulnTime: 1.6
  },

  /* ---------- Física (pixels lógicos; 1 px lógico ≈ 1,7 px de tela) ---------- */
  physics: {
    gravity: 1540,       // px/s²
    jumpVelocity: 510,   // => altura ~84 px lógicos, ~0,66 s no ar (vigas a cada ~74 px)
    walkSpeed: 58,
    walkSpeedMax: 84,    // segurando a seta
    accelTime: 0.6,
    coyoteTime: 0.08,
    jumpBuffer: 0.12
  },

  /* ---------- Dificuldade (curva contínua com teto) ---------- */
  difficulty: {
    curveScore: 4000,    // quanto maior, mais lenta a subida
    stepEvery: 500,      // degrau suave a cada X pontos
    stepAmount: 0.03,
    throwInterval: { start: [2.0, 3.0], end: [0.95, 1.5] },
    rollSpeed: { start: 26, end: 62 },
    bottleSpeed: { start: 115, end: 200 },
    objectGravity: { start: 480, end: 620 },
    // pesos dos tipos lançados: barril / caixa / garrafa
    weights: { start: [0.65, 0.3, 0.05], end: [0.45, 0.33, 0.22] }
  },

  /* ---------- Itens ---------- */
  items: {
    spawnEvery: { start: 2.2, end: 3.4 }, // itens ficam mais raros com a dificuldade
    maxOnScreen: 3,
    lifetime: 9,
    // pesos: alimento / moeda / power-up
    weights: { food: 0.72, coin: 0.06, power: 0.22 }
  },
  powerups: {
    shield: { label: 'Capa de chuva', duration: 0 },   // 0 = até absorver 1 batida
    nitro:  { label: 'Nitro', duration: 3, mult: 2 },
    magnet: { label: 'Ímã', duration: 6, radius: 70 },
    fair:   { label: 'Preço justo', duration: 8, mult: 2 }
  },

  /* ---------- Controles ---------- */
  // Setas [◀][▶] juntas no canto inferior esquerdo; [PULO] no canto inferior direito.
  controls: { size: 50, gap: 4, hitbox: 60 },  // px de tela (área de toque 60x60, maior que o visual)

  /* ---------- Sprites e tamanhos (pixels lógicos; 1 px lógico = 2 px de tela num celular de 430 px) ----------
     Os arquivos e quadros vêm de assets/manifest.json (dheep-96x96.png, boss-96x96.png).
     Célula de 48x48 lógicos = 96x96 px de tela em escala 2x. */
  sprites: {
    cell: 48,
    player: { hitW: 14, hitH: 34, hurtW: 10, hurtH: 26, startX: 196 },  // corpo (vigas), área de dano (menor, mais justa) e posição inicial
    boss:   { x: 194 }                               // o Gerente Rival fica no topo, à direita
  },

  /* ---------- Tela "Como jogar" ---------- */
  tutorial: {
    title: 'COMO JOGAR',
    lines: [
      'PULE ENTRE AS PLATAFORMAS',
      'DESVIE DOS OBSTÁCULOS',
      'COLETE ITENS E POWER-UPS',
      'CHEGUE AO FINAL DO CIRCUITO'
    ],
    cards: [
      { img: 'assets/tutorial-jump.png',  label: 'PULE',   color: '#FFD21F', alt: 'Dheep pulando de uma plataforma para outra' },
      { img: 'assets/tutorial-dodge.png', label: 'DESVIE', color: '#E30613', alt: 'Dheep desviando de um barril' },
      { img: 'assets/tutorial-win.png',   label: 'VENÇA',  color: '#1f9d55', alt: 'Dheep e o Gerente Rival comemorando no topo' }
    ],
    button: 'ENTENDIDO!',
    buttonPlay: 'ENTENDIDO! JOGAR'
  },

  /* ---------- Filtro de apelidos (palavrões e termos ofensivos) ----------
     A verificação ignora maiúsculas, acentos, hífen e letras repetidas, e entende troca de letras por
     números/símbolos (0=o, 1=i, 3=e, 4=a, 5=s, 7=t, 8=b, @=a, $=s). Ex.: "P3N1S", "naz1", "PINTOO", "b-u-n-d-a".
     contains = bloqueia se aparecer EM QUALQUER PARTE do apelido (use para palavras de 4+ letras).
     exact    = bloqueia só se o apelido for EXATAMENTE isso (palavras curtas como "cu", que estão dentro de nomes normais). */
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
      'tmnc', 'bct', 'ppk', 'cock', 'cum', 'ass', 'sex', 'anal', 'rape', 'kill', 'nazi', 'kkk', 'matar', 'mijar'
    ]
  },

  /* ---------- Placar (localStorage) ---------- */
  leaderboard: {
    max: 100,
    publicTop: 50,
    nickPattern: '^[A-Za-z0-9-]{1,6}$',
    nickMaxLen: 6
  },
  storageKeys: {
    leaderboard: 'leaderboard',
    stats: 'rover_stats',
    banned: 'rover_banned',
    player: 'rover_player',
    best: 'rover_best',
    settings: 'rover_settings'
  },

  /* ---------- Admin (/?admin=true ou segurar o logo por 3 s) ----------
     Senhas em SHA-256 (hex). Para gerar: veja o README.
     Padrão: usuário "rover" / senha "rover@2026" / senha de limpeza "limpar@2026".
     TROQUE ANTES DE PUBLICAR. */
  ADMIN_USER: 'rover',
  ADMIN_PASS_SHA256: 'e50151f7fd3e688b4006812be942b418595141c814a1ce331507cf3b8a3af05b',
  adminDeletePasswordSHA256: 'a5a89ffc350aab405d7ffab2bd6ff33af9ba50778bcdc822b9a6c3df78977ab8',
  csvSeparator: ';',

  /* ---------- Compartilhar ---------- */
  share: {
    // URL pública do jogo (ex.: https://jogo.dominio-da-rover.com.br). Vazio = URL atual.
    gameUrl: '',
    text: 'Fiz {score} pontos e cheguei ao mundo "{world}" no jogo da Rover! Consegue me passar? {url}'
  },

  /* ---------- Servidor ---------- */
  // Sem backend nesta entrega. Reservado para um futuro POST /api/backup.
  serverUrl: '',

  /* ---------- Técnico ---------- */
  render: { integerScaling: true },
  audio: { enabled: true, musicVolume: 0.22, sfxVolume: 0.5 },
  dev: { keyboard: false, showHitboxes: false }
};
