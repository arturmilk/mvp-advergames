/* Configuração do painel do cliente Máquina do Mal. Este arquivo é público: nunca coloque aqui senha, token nem outro segredo.
   As contas (usuário e senha) ficam no Apps Script, que só devolve os jogos do painel "maquina-do-mal" (constante PAINEIS do Code.gs).
   Veja analytics/README.md § 9. */
window.DASH_CONFIG = {
  client: 'Máquina do Mal',
  title: 'Painel dos jogos',
  filePrefix: 'maquina_do_mal',
  // URL do Web App do Apps Script (o mesmo /exec que está no config.js dos jogos; não é segredo)
  endpoint: 'https://script.google.com/macros/s/AKfycbw24WT-cKnY3N0KLAg3jOtrtRoG_r1i0uLnizYLvMfOCgadOSZQYExGAKBKfH20pk5Y1Q/exec',
  // Contato mostrado em "Esqueci a senha"
  supportText: 'Fale com a Montaggio: ela gera uma senha provisória para você entrar e escolher uma nova.',
  siteUrl: 'https://arturmilk.github.io/mvp-advergames/',
  // Só estes jogos aparecem (o servidor também só manda estes). A ordem fixa a cor de cada jogo.
  games: {
    'fuga-do-poser': { short: 'Fuga do Poser', path: 'fuga-do-poser/', levelLabel: 'Fase',
      endReasons: { vitoria: 'Vitória (camisa do Judas Priest)' } },
    'busao-do-rock': { short: 'Busão do Rock', path: 'busao-do-rock/', levelLabel: 'Lendas',
      endReasons: { vitoria: 'Vitória (chegou ao show)' } }
  },
  endReasons: {
    vidas: 'Perdeu as vidas', tempo: 'Fim do tempo', encerrou: 'Encerrou na pausa', poser: 'O Poser alcançou', vitoria: 'Vitória'
  }
};
