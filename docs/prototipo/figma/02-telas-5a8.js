/* =============================================================================
   CHAMADA 3 de 5 — telas 5 a 8, todas do lado do paciente (verde).

   Concatene o _preludio.js na frente deste arquivo. Ver README.md.

   A tela 8 é a que vale nota. Se sobrar cota para uma chamada só, é esta.
   ============================================================================= */

const fontesCarregadas = await carregarFontes();
const o = origemLivre();
const feitas = [];

/* -- 5 · Catálogo ---------------------------------------------------------
   RF-09, art. 20 do Código de Ética. Nome completo e CRP sempre visíveis.

   O que esta tela NÃO pode ter, e a banca vai procurar: nota, estrela, preço e
   ordenação por reputação (CA-09.3, DEC-06). Se alguém "melhorar" o wireframe
   acrescentando estrelinhas, quebra a restrição de divulgação do CFP. O aviso
   no rodapé da tela existe para lembrar quem for implementar.               */

feitas.push(await montarTela(5, 'Catálogo', 'paciente', o.x, o.y, () => [
  statusBar(),
  topo('Encontrar profissional', true),
  corpo([
    campo(null, 'Buscar por nome ou abordagem'),
    chips(['Online', 'Presencial', 'Ansiedade', 'TCC', 'São Paulo'], 'Online'),
    cartao([
      cab('Ana Paula Ribeiro', selo('CRP 06/123456')),
      {t:'txt', v:'Terapia cognitivo comportamental · Online', deg:'small', cor:'Dark +1'}
    ]),
    cartao([
      cab('Marcos Vinícius Alves', selo('CRP 06/654321')),
      {t:'txt', v:'Psicanálise · Online e presencial', deg:'small', cor:'Dark +1'}
    ]),
    cartao([
      cab('Juliana Torres', selo('CRP 05/998877')),
      {t:'txt', v:'Terapia sistêmica · Presencial', deg:'small', cor:'Dark +1'}
    ]),
    empurra(),
    {t:'txt', v:'Sem preço, sem nota, sem estrela e sem ordenação por reputação — art. 20 do Código de Ética.',
     deg:'mini', cor:'Dark +1'}
  ], {gap:12}),
  abas(['Buscar', 'Conta'], 'Buscar')
]));

/* -- 6 · Perfil e solicitação de vínculo ----------------------------------
   RF-10, RF-34, Nota Técnica CFP 1/2022. A apresentação é escrita e publicada
   pelo próprio profissional, nunca gerada pela plataforma (CA-34.3) — por isso
   ela aparece como texto corrido dele, e não como campos que a plataforma
   preencheria. A solicitação cria vínculo pendente até ele responder.       */

feitas.push(await montarTela(6, 'Perfil e vínculo', 'paciente', o.x + PASSO_X, o.y, () => [
  statusBar(),
  topo('Perfil', true),
  corpo([
    {t:'row', gap:14, align:'CENTER', children:[
      {t:'box', w:64, h:64, r:32, fill:'Light'},
      {t:'col', gap:2, children:[
        {t:'txt', v:'Ana Paula Ribeiro', deg:'p+'},
        {t:'txt', v:'CRP 06/123456', deg:'small', cor:'Dark +1'}
      ]}
    ]},
    chips(['Ansiedade', 'TCC', 'Online', 'São Paulo']),
    {t:'txt', v:'Apresentação', deg:'small+'},
    barras(4),
    {t:'txt', v:'Texto escrito pela própria profissional.', deg:'small', cor:'Dark +1'},
    empurra(),
    botao('Solicitar vínculo'),
    {t:'txt', v:'Ela precisa aceitar antes de vocês começarem', deg:'small', cor:'Dark +1', align:'CENTER'}
  ], {gap:14})
]));

/* -- 7 · Início do paciente -----------------------------------------------
   Ciclo 3.3 do documento base. A tela responde uma pergunta só: o que falta de
   mim esta semana. Por isso a ação principal é escrever relato — é o que
   alimenta a sessão seguinte — e não uma grade de atalhos.                  */

feitas.push(await montarTela(7, 'Início do paciente', 'paciente', o.x + PASSO_X * 2, o.y, () => [
  statusBar(),
  topo('Olá, Camila'),
  corpo([
    cartao([
      cab('Ana Paula Ribeiro', selo('vínculo ativo', 'destaque')),
      {t:'txt', v:'Próxima consulta: quinta, 22/08, às 15h', deg:'small', cor:'Dark +1'}
    ], 'destaque'),
    {t:'txt', v:'Esta semana', deg:'small+'},
    cartao([cab('2 tarefas pendentes', selo('1 vence hoje', 'aviso'))]),
    cartao([
      cab('3 relatos escritos', null),
      {t:'txt', v:'Último há 2 dias', deg:'small', cor:'Dark +1'}
    ]),
    empurra(),
    botao('Escrever relato')
  ], {gap:12}),
  abas(['Início', 'Relatos', 'Tarefas', 'Conversa', 'Agenda'], 'Início')
]));

/* -- 8 · Novo relato ------------------------------------------------------
   RF-22, DEC-12, DEC-13, RNF-37 (Must). A tela mais característica do produto.

   Três coisas precisam ser verdade no desenho, e todas as três são checáveis
   olhando o frame:

   1. O seletor fica ACIMA do campo de texto. Está logo abaixo do topo, é o
      primeiro elemento do corpo.
   2. Ele é visível SEM ROLAGEM. O corpo tem 852 de altura e o seletor termina
      por volta de y=210, então não existe altura de conteúdo que o empurre
      para fora: o campo de texto é que estica, não ele.
   3. Já vem marcado em COMPARTILHADO, e o estado escolhido é inequívoco — a
      metade ativa tem fundo de cor e peso de fonte maior, não só uma borda.

   O verde do estado ativo leva texto Dark, a 12,13:1. A regra da seção 3 diz
   que nesta paleta texto sobre cor é sempre Dark; aqui ela não é só uma
   preferência, é o que mantém o marcador legível — e o RNF-37 é avaliado por
   teste de usabilidade em que 3 pessoas precisam identificar o estado antes de
   enviar.

   Depois de salvo, privado não vira compartilhado (CA-22.3). A escolha
   acontece no momento da postagem e só ali.                                 */

feitas.push(await montarTela(8, 'Novo relato', 'paciente', o.x + PASSO_X * 3, o.y, () => [
  statusBar(),
  topo('Novo relato', true),
  corpo([
    {t:'txt', v:'Quem pode ver', deg:'small+'},
    {t:'row', nome:'RNF-37 · seletor de privacidade', gap:4, pad:4, r:14, fill:'Light +1', children:[
      {t:'row', nome:'estado ativo · compartilhado', h:48, r:10, just:'CENTER', align:'CENTER',
       fill:ctx.acento,
       children:[{t:'txt', v:'Compartilhado', deg:'p+', cor:ctx.tintaBotao, align:'CENTER'}]},
      {t:'row', nome:'estado inativo · privado', h:48, r:10, just:'CENTER', align:'CENTER',
       fill:'Nenhum',
       children:[{t:'txt', v:'Só para mim', deg:'p', cor:'Dark +1', align:'CENTER'}]}
    ]},
    {t:'txt', v:'Compartilhado: sua psicóloga lê. Só para mim: ninguém além de você, nunca.',
     deg:'small', cor:'Dark +1'},
    {t:'col', nome:'campo do relato', cresce:true, pad:16, r:12, fill:'Branco',
     stroke:'Light -1', peso:1, children:[
      {t:'txt', v:'Terça foi difícil. Discussão no trabalho e voltei pensando naquilo a noite toda.', deg:'p'}
    ]},
    botao('Salvar relato')
  ], {gap:12})
]));

return {
  createdNodeIds: feitas.map(f => f.id),
  telas: feitas.map(f => f.name + ' @x=' + Math.round(f.x)),
  fontesCarregadas: fontesCarregadas,
  avisos: avisos,
  conferir: 'tela 8: seletor acima do campo, sem rolagem, já em Compartilhado (RNF-37)',
  proximo: '03-telas-9a11.js'
};
