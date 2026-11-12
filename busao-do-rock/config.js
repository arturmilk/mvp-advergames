/* =========================================================================
   Máquina do Mal em: Busão do Rock — configuração central
   Todo texto, tempo, pontuação, física, personagem e senha do jogo fica aqui.
   Depois de editar, basta recarregar a página (não há build).
   Este arquivo é PÚBLICO (GitHub Pages): nunca coloque token ou segredo aqui.
   ========================================================================= */
const CONFIG = {
  version: 'br-1.0',
  clientName: 'Máquina do Mal',
  // logo da loja na HUD e na tela inicial. image vazio = logo provisório em letra gótica com o texto abaixo.
  // Para usar o logo oficial: salve em assets/logo.png (fundo transparente) e ponha image: 'assets/logo.png'.
  logo: { image: '', text: 'Máquina do Mal' },
  gameName: 'Busão do Rock',

  /* ---------- Tempo e relógio ---------- */
  time: {
    start: 30,           // segundos no começo da partida
    startOnFirstPickup: true, // true = o cronômetro fica parado no valor cheio até buscar a 1ª lenda (o relógio 18:00 também)
    bonus: 10,           // segundos ganhos a cada resgate
    meterMax: 60,        // tempo que enche a barra de tempo da HUD
    warnAt: 10,          // a partir daqui o cronômetro pisca e a sirene toca a cada segundo
    countdown: 3,        // contagem 3-2-1 antes de largar
    clockStart: 18 * 60, // relógio do jogo: 18:00 ...
    clockEnd: 19 * 60    // ... até 19:00 (chega às 19:00 exatamente quando o tempo zera)
  },

  /* ---------- Pontos ---------- */
  points: {
    rescue: 8,           // por lenda resgatada (10 lendas = 80)
    delivery: 20,        // ao levar as 10 lendas até a loja Máquina do Mal (80 + 20 = 100)
    winPerSecond: 0      // bônus por segundo que sobrou na vitória: 0 = desligado, o máximo é 100 (pedido do Arthur, 12/11)
  },
  goals: [               // título no fim da partida (min = pontuação mínima)
    { min: 0,   name: 'Motorista de Primeira Viagem' },   // 8 pts por lenda: 24 = 3 lendas
    { min: 24,  name: 'Roadie de Respeito' },             // 3 lendas
    { min: 48,  name: 'Piloto do Apocalipse' },           // 6 lendas
    { min: 80,  name: 'Lenda da Estrada' }                // as 10 lendas, sem chegar à loja (quem chega ganha winTitle)
  ],
  winTitle: 'O Show Vai Começar!',

  /* ---------- Provocações quando o tempo está acabando ----------
     Quando faltar cada um destes segundos, a PRÓXIMA lenda a ser buscada fala uma frase da lista (sem repetir até usar todas). */
  taunts: {
    at: [15, 8, 3],
    showSec: 2.6,
    lines: [
      'Vem me buscar logo, seu poser! Tô atrasado e a culpa é sua.',
      'Mesmo com uma seta gigante você ainda consegue se perder... MEU DEUS.',
      'Vamo logo, cara, é só um jogo de celular.',
      'Não tá querendo ganhar prêmio nenhum desse jeito, né?'
    ]
  },

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
    bounce: 0.35,        // (só com hitStop: false) quanto da velocidade sobra ao bater num prédio
    hitStop: true,       // bater de frente num prédio, poste ou árvore PARA o ônibus. A calçada é livre (sobe nela)
    hornCooldown: 0.4
  },

  /* ---------- Drift ----------
     Rápido (acima de minSpeed × velocidade máxima) + virando + FREIO = a traseira escorrega e os pneus chiam. */
  drift: {
    enabled: true,
    minSpeed: 0.55,      // fração da velocidade máxima para começar a escorregar (≈ 53 km/h)
    grip: 2.2,           // aderência durante o drift (menor = escorrega mais)
    normalGrip: 9,       // aderência normal
    steerBoost: 1.7,     // o bico vira mais rápido durante o drift
    brake: 0.22,         // no drift o freio segura só 22% (o ônibus desliza em vez de parar)
    volume: 0.22         // volume do chiado
  },

  /* ---------- HUD ---------- */
  hud: { arrowScale: 0.5 },   // tamanho da seta 3D (era 0.72)

  /* ---------- Câmera ---------- */
  // distance/height = parado; com velocidade a câmera se afasta (speedDistance), sobe (speedHeight), olha mais à frente
  // (speedLookAhead) e abre o campo de visão (speedFov). speedFollow = quão rápido ela acompanha a mudança de velocidade.
  camera: { distance: 18, height: 10, lookAhead: 9, lookHeight: 1.5, follow: 7, fov: 62,
            speedDistance: 3, speedHeight: 2, speedLookAhead: 8, speedFov: 9, speedFollow: 1.2 },

  /* ---------- Resgates ---------- */
  pickup: {
    radius: 7.5,         // raio da zona neon (m): encostou o ônibus, embarcou
    maxSpeed: 0,         // 0 = embarca em qualquer velocidade; ex.: 8 = precisa passar devagar (até 8 m/s)
    minDist: 110,        // distância mínima (m, em linha reta) entre um resgate e o próximo
    maxDist: 240,        // distância máxima
    firstMinDist: 60,    // só a 1ª lenda: distância mínima (m, em linha reta) da largada do ônibus
    firstMaxDist: 120,   // só a 1ª lenda: distância máxima (antes era a mesma dos outros, 110–240 m)
    lineTime: 3.4        // segundos que o balão de fala fica na tela
  },

  /* ---------- Gráficos (desempenho no celular) ---------- */
  render: {
    maxPixelRatio: 1.5,  // telas retina renderizam no máximo a 1,5× (economiza bateria)
    fogNear: 60, fogFar: 230,
    antialias: true
  },

  /* ---------- Personagens ----------
     image: caminho da imagem final (PNG/webp com fundo transparente, em pé, de frente), ex.: 'assets/chars/ozzy.webp'.
     Vazio = boneco provisório simples na cor `color` com o nome escrito.
     Todas as imagens têm o MESMO canvas (1024×512, pés na borda de baixo; tools/process_sprites.py), então saem na mesma escala.
     line = fala cômica no balão quando embarca. A ordem da lista é a ordem dos resgates (o Ozzy fica por último). */
  charHeight: 4.2,   // altura (m) do sprite em pé na calçada; o ônibus tem ~3,4 m. Maior = reconhece de mais longe
  characters: [
    { id: 'raul',     name: 'Raul Seixas',   color: '#8C5A2B', image: 'assets/chars/raul.webp', line: 'Tentei outra vez e você finalmente chegou!' },
    { id: 'kurt',     name: 'Kurt Cobain',   color: '#C23A2B', image: 'assets/chars/kurt.webp', line: 'Que cheiro é esse? Ah, é espírito de busão!' },
    { id: 'chorao',   name: 'Chorão',        color: '#2B7AC2', image: 'assets/chars/chorao.webp', line: 'O skate me ensinou a chegar até atrasado, truta!' },
    { id: 'rita',     name: 'Rita Lee',      color: '#E0572B', image: '', line: 'Ovelha negra da família, mas passageira VIP desse busão!' },
    { id: 'soad',     name: 'System of a Down', color: '#7A2BC2', image: 'assets/chars/soad.webp', line: 'Wake up! Esse busão demorou mais que fila de show!' },
    { id: 'slipknot', name: 'Slipknot',      color: '#C2702B', image: 'assets/chars/slipknot.webp', line: 'Tô de máscara pra ninguém ver que eu esperei uma hora no ponto.' },
    { id: 'sepultura',name: 'Sepultura',     color: '#3A7A2B', image: 'assets/chars/sepultura.webp', line: 'Roots, bloody roots! Raiz mesmo é esperar ônibus no sol!' },
    { id: 'angus',    name: 'Angus Young',   color: '#1F3F8C', image: 'assets/chars/angus.webp', line: 'Cuidado, motorista, essa avenida é uma Highway to Hell!' },
    { id: 'axl',      name: 'Axl Rose',      color: '#B0151B', image: 'assets/chars/axl.webp', line: 'Welcome to the jungle, baby! Selva mesmo é esse trânsito!' },
    { id: 'ozzy',     name: 'Ozzy Osbourne', color: '#5B3A8C', image: 'assets/chars/ozzy.webp', line: 'Eu tava procurando um morcego... tava com fome, entende?... SHAROOOON!' }
  ],

  /* ---------- Felipe (protagonista, aparece só na HQ) — PLACEHOLDER ---------- */
  felipe: { name: 'Felipe', color: '#2B2B2B', image: '' },

  /* ---------- HQ de abertura (3 quadros) ----------
     image = arte do quadro (Higgsfield, estilo Marvel com retícula; Felipe já desenhado). Vazio = quadro montado com a fachada/ônibus + Felipe. */
  comic: {
    title: 'Máquina do Mal em: Busão do Rock',
    // slides: true = um quadro por vez com o botão PRÓXIMO. Os textos (legenda, balão, cartaz "WACKEN PVH ÀS 19H") estão
    // DESENHADOS na arte (Higgsfield), para não depender de fonte nem do modo escuro do celular. Para mudar um texto é preciso
    // gerar a imagem de novo; caption/line abaixo ficam só como registro (e reserva se a imagem não carregar).
    slides: true,
    next: 'PRÓXIMO',
    panels: [
      { caption: 'Fim de tarde.', image: 'assets/comic/s1.webp', line: 'Mais um dia na Máquina do Mal... espera aí...' },
      { caption: 'Já são 18h45!', image: 'assets/comic/s2.webp', poster: 'WACKEN PVH ÀS 19H', line: 'Puta merda! O show é logo ao anoitecer e as bandas ainda tão espalhadas pela cidade!' },
      { caption: 'Garagem da loja.', image: 'assets/comic/s3.webp', line: 'Bora botar o ônibus na pista e juntar essa galera!' }
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
      'Você tem só 30 segundos, mas o tempo só começa a contar depois que a 1ª lenda embarca. Passe o ônibus pela zona neon no chão para embarcar a lenda: +10 segundos e +8 pontos.',
      'Depois da 10ª lenda, a seta aponta de volta para a loja Máquina do Mal. Chegue lá antes do tempo zerar: a entrega vale +20 pontos e fecha os 100!',
      'Celular: setas à esquerda para virar; à direita, o pedal com seta para cima acelera e o com seta para baixo freia e dá ré. Rápido, virando e freando, o busão faz drift! Pode subir na calçada, mas poste, árvore e prédio param o ônibus. Teclado: W A S D ou setas; H buzina.'
    ],
    goStore: 'TODO MUNDO A BORDO! Volta pra loja!',
    deliveryTag: 'ENTREGA NA MÁQUINA DO MAL', // letreiro dos pontos da entrega (points.delivery)
    winTitle: 'Parabéns! Você zerou o Busão do Rock!',
    winLine: 'As 10 lendas subiram no palco da Máquina do Mal. Que noite!',
    loseTitle: 'Deu 19:00...',
    // fim sem zerar: aparecem as lendas que faltaram e a primeira delas diz isto
    missedLine: 'Me deixou aqui esperando? Aí não, né. Compra mais alguma coisa e tenta de novo.',
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
    footer: 'Um jogo da Máquina do Mal.'
  },

  /* ---------- Admin (/?admin=true ou segurar o título da HQ por 3 s) ---------- */
  // Troque antes de publicar. Se preencher ADMIN_PASS_SHA256, ele tem prioridade e ADMIN_PASS pode ficar vazio.
  ADMIN_USER: 'admin',
  ADMIN_PASS: 'busao2026',
  ADMIN_PASS_SHA256: '',
  ADMIN_DELETE_PASSWORD: 'DELETE_ALL_2026',

  /* ---------- Coleta de dados (dashboard + planilha Google) ---------- */
  // endpoint = URL do Web App do Apps Script (termina em /exec). Vazio = não envia nada. Veja ../analytics/README.md
  analytics: {
    game: 'busao-do-rock', // não troque: é a chave deste jogo na planilha
    endpoint: 'https://script.google.com/macros/s/AKfycbw24WT-cKnY3N0KLAg3jOtrtRoG_r1i0uLnizYLvMfOCgadOSZQYExGAKBKfH20pk5Y1Q/exec',
    milestones: [24, 48, 80, 100]
  },

  /* ---------- QR code de uso único (ticket.js) ----------
     required: false = o link normal é livre; só os links ?qr= do dashboard são de uso único.
               true  = só abre com QR do dashboard (o Apps Script publicado já conhece 'busao-do-rock'). */
  ticket: {
    required: false,
    quietWait: true,     // confere e valida o QR sem a tela 'Conferindo/Validando o QR code' (os avisos de QR usado/inválido continuam)
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
  // motor: segurando o acelerador o som sobe marcha a marcha até o pico em rampSec; gears = fatia de tempo de cada marcha (soma 1)
  engineSound: { rampSec: 10, gears: [0.18, 0.22, 0.27, 0.33], dropRate: 2.5 },
  musicTempo: 176,     // trilha original de hard rock (riff em Mi com galope, bateria cheia); volume em musicVolume

  /* ---------- Tela cheia (fullscreen.js; igual em todos os jogos) ----------
     Android/iPad/computador: tela cheia de verdade no 1º toque. iPhone/Safari não tem tela cheia para páginas:
     lá o jogo ocupa a tela toda (pseudo tela cheia), sem zoom de pinça. */
  fullscreen: {
    enabled: true,
    onFirstTouch: true,        // pede tela cheia no primeiro toque em qualquer lugar
    devices: 'all',          // 'touch' = só celular/tablet; 'all' = também no computador
    orientation: 'landscape',   // trava depois de entrar em tela cheia (só Android); '' = não trava
    blockZoom: true            // sem zoom de pinça (o iPhone ignora user-scalable=no)
  },

  /* ---------- Tela cheia suave no iPhone (soft-fullscreen.js; igual nos jogos deitados) ----------
     Só no iPhone (Safari e outros navegadores do iOS sem Fullscreen API), fora da Tela de Início e fora de
     Instagram/Facebook/TikTok. O jogador desliza o dedo para cima, o Safari recolhe a barra e o jogo liga;
     se a barra voltar, o jogo pausa. Android, computador e iPad seguem com o fullscreen.js de sempre. */
  softFullscreen: {
    enabled: true,
    hintText: 'Deslize para cima para jogar em tela cheia',
    rotateText: 'Gire o celular para jogar',   // só se o jogo não tiver o próprio aviso (rotateSelector)
    tapText: 'Toque para começar',             // aparece se o som do iPhone ainda estiver travado
    container: '#app',          // contêiner do jogo (fica fixo por cima da página)
    rotateSelector: '#rotate',  // aviso de girar do próprio jogo; '' = usa o do módulo
    threshold: 30,              // px a mais que a menor altura vista = barra recolhida
    screenTolerance: 24,        // altura a até 24 px da tela inteira = já está sem barra; 0 desliga
    extraScroll: 200,           // px de rolagem extra da página (o Safari precisa rolar para recolher a barra)
    rotateDelay: 350            // ms para medir de novo depois de girar
  },

  /* ---------- Selo "Produzido por Montaggio" (montaggio-selo.js) ----------
     Aparece só nas telas fora da partida, no fim de cada tela (não cobre o jogo nem os controles).
     cta = convite "Quero um jogo para o meu negócio", que abre o WhatsApp da Montaggio com a mensagem pronta. */
  montaggio: {
    enabled: true,
    byText: 'Produzido por',
    cta: true,
    ctaText: 'Quero um jogo para o meu negócio',
    whatsapp: '556993630689',          // (69) 9363-0689, só dígitos com 55 + DDD
    message: 'Olá, quero um jogo para o meu negócio!',
    siteUrl: '',                       // vazio = o logo não é link
    places: [
      { in: '#comic .c-foot', tone: 'dark', align: 'left' },
      { in: '#gameover', tone: 'light' },
      { in: '#saved', tone: 'light' },
      { in: '#rankings', tone: 'light' }
    ]
  }
};
window.CONFIG = CONFIG;
