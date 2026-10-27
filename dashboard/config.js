/* Configuração do painel. Este arquivo é público: nunca coloque aqui o token nem outro segredo.
   Para usar o painel com outro cliente, copie a pasta dashboard/ e troque só este arquivo. */
window.DASH_CONFIG = {
  // Nome do cliente, mostrado no topo e na tela de entrada. Vazio = só "Painel dos jogos".
  client: '',
  title: 'Painel dos jogos',
  // Prefixo dos arquivos baixados (CSV e PNG dos QR codes). Vazio = usa o nome do cliente ou "jogos".
  filePrefix: '',
  // Site publicado onde ficam os jogos. Só é usado quando o painel é aberto direto do arquivo (file://);
  // no site, o painel usa a pasta acima dele (../).
  siteUrl: 'https://arturmilk.github.io/mvp-advergames/',
  // Um item por jogo, na ordem em que aparecem nos filtros (a ordem também fixa a cor de cada jogo).
  // A chave é o id do jogo na planilha (constante GAMES do Code.gs). O nome completo vem do Apps Script;
  // "name" aqui só serve de reserva. "path" = pasta do jogo a partir de siteUrl; "levelLabel" = como o jogo chama o nível.
  // Um jogo que o Apps Script conhece e que não está aqui aparece com o nome do Apps Script e a pasta "<id>/".
  games: {
    'rover': { short: 'A Entrega', path: '', levelLabel: 'Mundo' },
    'happy-hour': { short: 'Happy Hour', path: 'happy-hour/', levelLabel: 'Nível' }
  },
  // Textos dos motivos de fim de partida (o jogo grava a chave na coluna motivo_fim).
  endReasons: {
    vidas: 'Perdeu as vidas', perdeu_itens: 'Deixou cair 5 itens', tempo: 'Fim do tempo', encerrou: 'Encerrou na pausa'
  }
};
