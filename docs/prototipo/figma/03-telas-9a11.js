/* =============================================================================
   CHAMADA 4 de 5 — telas 9 a 11, fim do lado do paciente (verde).

   Concatene o _preludio.js na frente deste arquivo. Ver README.md.

   Numeração: são as telas 9, 10 e 11 do inventário congelado (seção 1.6 do
   cronograma) — tarefas, chat e agenda. No `wireframes.html` elas aparecem
   como 10, 11 e 12, porque aquele arquivo tem duas telas a mais que ficaram
   fora da DP-04. Ao comparar os dois, use o NOME da tela, não o número.
   ============================================================================= */

const fontesCarregadas = await carregarFontes();
const o = origemLivre();
const feitas = [];

/* -- 9 · Tarefas ----------------------------------------------------------
   RF-25. Pendentes separadas das concluídas, com o prazo visível em cada card.
   Concluir grava data e hora, e concluir de novo não duplica (CA-25.3).     */

feitas.push(await montarTela(9, 'Tarefas', 'paciente', o.x, o.y, () => [
  statusBar(),
  topo('Tarefas'),
  corpo([
    {t:'txt', v:'Pendentes', deg:'small+'},
    cartao([
      cab('Registrar gatilhos de ansiedade', selo('hoje', 'aviso')),
      {t:'txt', v:'Anote a situação e a intensidade, de 0 a 10.', deg:'small', cor:'Dark +1'},
      botao('Marcar como concluída', 'fraco')
    ]),
    cartao([cab('Exercício de respiração', selo('até 22/08'))]),
    {t:'txt', v:'Concluídas', deg:'small+'},
    Object.assign(cartao([cab('Ler o texto sobre sono', selo('feita 16/08'))]), {op:0.6}),
    empurra()
  ], {gap:12}),
  abas(['Início', 'Relatos', 'Tarefas', 'Conversa', 'Agenda'], 'Tarefas')
]));

/* -- 10 · Conversa --------------------------------------------------------
   RF-15. Canal assíncrono dentro do vínculo ativo, com histórico por data.

   Não é atendimento em tempo real e a plataforma não hospeda sessão (DEC-08).
   Por isso não há indicador de "digitando", nem chamada de vídeo, nem status
   de presença: pôr qualquer um deles no wireframe prometeria o que a decisão
   registrada diz que o produto não faz.                                     */

const balao = (texto, meu) => ({t:'row', just: meu ? 'MAX' : 'MIN', children:[
  {t:'col', w:280, pad:[10,14,10,14], r:14, fill: meu ? ctx.acento : 'Light +1',
   children:[{t:'txt', v:texto, deg:'small'}]}
]});

feitas.push(await montarTela(10, 'Conversa', 'paciente', o.x + PASSO_X, o.y, () => [
  statusBar(),
  topo('Ana Paula Ribeiro', true),
  corpo([
    {t:'txt', v:'Segunda, 17/08', deg:'mini', cor:'Dark +1', align:'CENTER'},
    balao('Camila, conseguiu fazer o registro dos gatilhos?', false),
    balao('Consegui em dois dias, nos outros esqueci', true),
    balao('Tudo bem. A gente vê isso na quinta.', false),
    empurra(),
    {t:'row', gap:8, align:'CENTER', children:[
      {t:'row', h:56, r:12, pad:[0,16,0,16], align:'CENTER', fill:'Branco',
       stroke:'Light -1', peso:1,
       children:[{t:'txt', v:'Escreva uma mensagem', deg:'p', cor:'Dark +1'}]},
      {t:'row', nome:'enviar', w:56, h:56, r:12, just:'CENTER', align:'CENTER', fill:ctx.acento,
       children:[{t:'txt', v:'›', deg:'h4', cor:ctx.tintaBotao, align:'CENTER', hug:true}]}
    ]}
  ], {gap:10})
]));

/* -- 11 · Agenda ----------------------------------------------------------
   RF-26. O paciente só visualiza: criar, alterar e cancelar é atribuição do
   psicólogo (CA-26.3). Não existe botão de marcar consulta nesta tela, e a
   ausência dele é o requisito, não um esquecimento.

   O calendário é montado como 6 linhas de 7 células em vez de auto-layout com
   quebra, porque quebra automática depende da largura calculada e aqui a
   grade precisa ser previsível.                                             */

const cel = (rotulo, tom) => ({t:'row', w:44, h:36, r:8, just:'CENTER', align:'CENTER',
  fill: tom === 'hoje' ? ctx.acento : (tom === 'marcado' ? 'Secundário +1' : 'Nenhum'),
  stroke: tom === 'marcado' ? ctx.linha : null, peso:1,
  children: rotulo ? [{t:'txt', v:String(rotulo), deg:'small', align:'CENTER',
    cor: tom === 'hoje' ? ctx.tintaBotao : 'Dark', hug:true}] : []});

const semana = (celulas) => ({t:'row', gap:4, children: celulas});

feitas.push(await montarTela(11, 'Agenda', 'paciente', o.x + PASSO_X * 2, o.y, () => [
  statusBar(),
  topo('Agenda'),
  corpo([
    {t:'txt', v:'Agosto de 2026', deg:'h5'},
    {t:'col', nome:'calendário', gap:4, children:[
      semana(['D','S','T','Q','Q','S','S'].map(d => ({t:'row', w:44, h:24, just:'CENTER',
        align:'CENTER', children:[{t:'txt', v:d, deg:'mini+', cor:'Dark +1', align:'CENTER', hug:true}]}))),
      semana([null, null, null, null, null, 1, 2].map(d => cel(d))),
      semana([3, 4, 5, 6, 7, 8, 9].map(d => cel(d))),
      semana([10, 11, 12, 13, 14, 15, 16].map(d => cel(d, d === 15 ? 'marcado' : null))),
      semana([17, 18, 19, 20, 21, 22, 23].map(d =>
        cel(d, d === 19 ? 'hoje' : (d === 21 ? 'marcado' : null)))),
      semana([24, 25, 26, 27, 28, 29, 30].map(d => cel(d, d === 28 ? 'marcado' : null)))
    ]},
    {t:'txt', v:'Próximas', deg:'small+'},
    cartao([
      cab('Sexta, 21/08 às 15h', selo('confirmada', 'destaque')),
      {t:'txt', v:'Online', deg:'small', cor:'Dark +1'}
    ]),
    {t:'txt', v:'Cancelamento e reagendamento chegam por notificação.', deg:'mini', cor:'Dark +1'},
    empurra()
  ], {gap:12}),
  abas(['Início', 'Relatos', 'Tarefas', 'Conversa', 'Agenda'], 'Agenda')
]));

return {
  createdNodeIds: feitas.map(f => f.id),
  telas: feitas.map(f => f.name + ' @x=' + Math.round(f.x)),
  fontesCarregadas: fontesCarregadas,
  avisos: avisos,
  proximo: '04-telas-12a14.js'
};
