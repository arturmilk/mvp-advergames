/* =========================================================================
   Drink às Cegas — configuração central
   Todo texto, tempo, receita, ingrediente, nota e regra de conexão fica aqui.
   Depois de editar, basta recarregar a página (não há build).
   Este arquivo é PÚBLICO (GitHub Pages): nunca coloque token ou segredo aqui.
   ========================================================================= */
const CONFIG = {
  version: 'dc-1.0',
  clientName: '',                 // nome do bar/cliente que aparece no topo (vazio = não aparece)
  gameName: 'Drink às Cegas',
  tagline: 'Um lê a receita. O outro mistura sem saber o quê.',
  storagePrefix: 'dc_',           // prefixo de localStorage (próprio deste jogo)

  /* ---------- Partida ---------- */
  roundSeconds: 30,               // tempo da partida
  countdownSeconds: 3,            // 3, 2, 1 antes de começar
  roles: 'random',                // quem é o GUIA (vê a receita): 'random' | 'host' (quem foi chamado) | 'guest' (quem chamou)
  swapRolesOnRematch: true,       // na revanche os papéis se invertem
  allowUndo: true,                // o MISTURADOR tem o botão "Tirar o último"
  allowServeEarly: true,          // qualquer um pode apertar SERVIR antes do tempo acabar
  maxItemsInGlass: 14,            // a taça transborda: não aceita mais que isto
  mysteryTiles: 12,               // quantos ícones misteriosos o MISTURADOR vê (os da receita + distrações)
  guideSeesChecklist: false,      // true = o GUIA vê ✓ na receita conforme acerta (mais fácil)
  mixerSeesRealInGlass: true,     // a taça é a mesma para os dois: true = o MISTURADOR também vê o que caiu nela
  alcoholFree: false,             // true = só receitas sem álcool (ex.: evento com menor de idade / CONAR)

  /* ---------- Nota do drink (0 a 10) ----------
     acerto = (unidades certas − extraWeight × unidades a mais ou erradas) ÷ unidades da receita
     nota   = acerto × 10, arredondada em 0,5. Pontos = nota × 100 + bônus de tempo (só no drink perfeito). */
  scoring: {
    extraWeight: 0.75,            // cada unidade errada ou a mais desconta 0,75 de uma certa
    roundTo: 0.5,                 // nota arredondada de meio em meio ponto
    perfectTimeBonus: 300,        // drink perfeito: até +300 pontos pelo tempo que sobrou
    labels: [                     // do maior para o menor: a 1ª faixa com nota ≥ min vale
      { min: 10,  text: 'Drink perfeito!',        sub: 'Pode servir no balcão.' },
      { min: 8,   text: 'Bartender de respeito',  sub: 'Quase igual à receita.' },
      { min: 6,   text: 'Dá pra beber',           sub: 'O cliente toma, mas repara.' },
      { min: 4,   text: 'Meio estranho...',        sub: 'Tem algo fora do lugar.' },
      { min: 2,   text: 'Isso é um drink?',        sub: 'Bora treinar a comunicação.' },
      { min: 0,   text: 'Joga fora!',              sub: 'Nem o garçom encara.' }
    ]
  },

  /* ---------- Ingredientes (genéricos, sem marca) ----------
     icon: desenho do adesivo (bottle, wedge, cubes, ice, leaf, bubbles, slice, drop, can, berry, fruit)
     color: cor principal do adesivo; liquid: cor que o ingrediente dá ao líquido da taça (vazio = sólido, não pinta) */
  ingredients: [
    { id: 'cachaca',  name: 'Cachaça',            icon: 'bottle',  color: '#E9F3F7', liquid: '#E6EEF0', alcohol: true },
    { id: 'rum',      name: 'Rum',                icon: 'bottle',  color: '#C8792B', liquid: '#C9853F', alcohol: true },
    { id: 'vodka',    name: 'Vodka',              icon: 'bottle',  color: '#9FD4FF', liquid: '#DDEFFF', alcohol: true },
    { id: 'limao',    name: 'Limão',              icon: 'wedge',   color: '#7BC043', liquid: '' },
    { id: 'acucar',   name: 'Açúcar',             icon: 'cubes',   color: '#FFFFFF', liquid: '' },
    { id: 'gelo',     name: 'Gelo',               icon: 'ice',     color: '#BFEFFF', liquid: '' },
    { id: 'hortela',  name: 'Hortelã',            icon: 'leaf',    color: '#2FB36B', liquid: '' },
    { id: 'agua_gas', name: 'Água com gás',       icon: 'bubbles', color: '#8FE3FF', liquid: '#CFF3FF' },
    { id: 'laranja',  name: 'Suco de laranja',    icon: 'slice',   color: '#FF9F1C', liquid: '#FFA62B' },
    { id: 'groselha', name: 'Xarope de groselha', icon: 'drop',    color: '#E8336D', liquid: '#D61F55' },
    { id: 'cola',     name: 'Refrigerante de cola', icon: 'can',   color: '#6B3A2A', liquid: '#4A2418' },
    { id: 'morango',  name: 'Morango',            icon: 'berry',   color: '#F2384A', liquid: '' },
    { id: 'maracuja', name: 'Maracujá',           icon: 'fruit',   color: '#F7C948', liquid: '#F2B53A' }
  ],

  /* ---------- Receitas (quantidades em "unidades": cada toque do MISTURADOR põe 1) ----------
     glass: 'rocks' (copo baixo) | 'highball' (copo alto) | 'coupe' (taça) */
  recipes: [
    { id: 'caipirinha', name: 'Caipirinha',            glass: 'rocks',    alcohol: true,
      items: { cachaca: 2, limao: 2, acucar: 1, gelo: 2 } },
    { id: 'mojito',     name: 'Mojito',                glass: 'highball', alcohol: true,
      items: { rum: 2, hortela: 2, limao: 1, acucar: 1, agua_gas: 1, gelo: 1 } },
    { id: 'cubalibre',  name: 'Cuba Libre',            glass: 'highball', alcohol: true,
      items: { rum: 2, cola: 2, limao: 1, gelo: 2 } },
    { id: 'caipiroska', name: 'Caipiroska de Morango', glass: 'rocks',    alcohol: true,
      items: { vodka: 2, morango: 2, acucar: 1, gelo: 2 } },
    { id: 'hifi',       name: 'Hi-Fi',                 glass: 'highball', alcohol: true,
      items: { vodka: 1, laranja: 3, gelo: 2 } },
    { id: 'soda',       name: 'Soda de Groselha',      glass: 'highball', alcohol: false,
      items: { groselha: 2, agua_gas: 2, limao: 1, gelo: 2 } },
    { id: 'fizz',       name: 'Maracujá Fizz',         glass: 'coupe',    alcohol: false,
      items: { maracuja: 2, acucar: 1, agua_gas: 2, gelo: 1 } }
  ],

  /* ---------- Avatar (montado no celular; nada é enviado a servidor além do apelido e do desenho escolhido) ---------- */
  avatar: {
    colors: ['#E8336D', '#009F93', '#5D2A8E', '#FF9F1C', '#3DA5F4', '#F7C948'],
    faces: ['sorriso', 'piscada', 'oculos', 'surpreso', 'tranquilo', 'lingua'],
    hats: ['nenhum', 'festa', 'bone', 'coroa', 'laco', 'fone'],
    presets: [                    // "avatares padrão" (cor, rosto, acessório pelo índice das listas acima)
      { c: 0, f: 0, h: 1 }, { c: 1, f: 2, h: 0 }, { c: 2, f: 1, h: 3 },
      { c: 3, f: 5, h: 2 }, { c: 4, f: 4, h: 5 }, { c: 5, f: 3, h: 4 }
    ]
  },

  /* ---------- Conexão entre os dois celulares ----------
     mode 'peer'  = WebRTC (PeerJS). O servidor público e gratuito do PeerJS (0.peerjs.com) só apresenta os dois
                    celulares; depois os dados vão direto de um para o outro. Não usa chave nem segredo.
     mode 'local' = duas abas no MESMO navegador (BroadcastChannel), para teste. Também liga com ?local=1 na URL.
     ?bot=1 na URL libera o código BOT (parceiro simulado) para demonstração e teste. */
  net: {
    mode: 'peer',
    idPrefix: 'mtg-drinkcegas-',  // prefixo do id no servidor público (o código do jogador vem depois)
    codeLength: 4,
    codeAlphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', // sem 0/O, 1/I/L
    peerServer: null,             // null = servidor público do PeerJS; ou { host, port, path, secure } de um servidor próprio
    iceServers: null,             // null = padrão do PeerJS (STUN do Google + TURN do PeerJS)
    connectTimeoutMs: 12000,      // sem resposta nesse tempo = "não deu para conectar"
    stateEveryMs: 250             // de quanto em quanto tempo quem hospeda manda o relógio da partida
  },

  /* ---------- Compartilhar ---------- */
  share: {
    gameUrl: 'https://arturmilk.github.io/mvp-advergames/drink-as-cegas/',
    inviteText: 'Bora fazer um drink às cegas comigo? Meu código é {code}:'
  },

  /* ---------- Apelido (igual em todos os jogos do projeto) ---------- */
  nickPattern: '^[A-Z0-9-]{1,6}$',
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

  vibrateMs: 12,                  // vibração curta ao tocar em botão (0 = sem vibração)

  /* ---------- Selo "Produzido por Montaggio" (montaggio-selo.js) ---------- */
  montaggio: {
    enabled: true,
    byText: 'Produzido por',
    cta: true,
    ctaText: 'Quero um jogo para o meu negócio',
    whatsapp: '556993630689',
    message: 'Olá, quero um jogo para o meu negócio!',
    siteUrl: '',
    places: [
      { in: '#s-nick .foot', tone: 'light' },
      { in: '#s-lobby .foot', tone: 'light' },
      { in: '#s-result .foot', tone: 'light' }
    ]
  }
};
window.CONFIG = CONFIG;
