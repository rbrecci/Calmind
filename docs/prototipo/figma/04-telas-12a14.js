/* =============================================================================
   CHAMADA 5 de 5 — telas 12 a 14, lado do psicólogo (rosa).

   Concatene o _preludio.js na frente deste arquivo. Ver README.md.

   ATENÇÃO, pendência 5 da seção 7: é aqui que Danger (#FF5C5C) e Primário
   (#F07EF2) se encostam. Os selos de aviso das telas 13 e 14 ficam a poucos
   pixels de elementos rosas. Olhe o resultado e decida se o Danger precisa
   escurecer — este é o lugar onde o problema aparece de verdade, e o momento
   de resolvê-lo é antes de o design system fechar, não depois.
   ============================================================================= */

const fontesCarregadas = await carregarFontes();
const o = origemLivre();
const feitas = [];

/* -- 12 · Cadastro com CRP ------------------------------------------------
   RF-33, RF-44, seção 6.3. Validação de formato, mais documento, mais
   aprovação humana — porque não existe consulta pública automatizada ao
   cadastro nacional do CFP e prometer verificação automática seria mentira.

   Enquanto o cadastro está pendente, publicar perfil e gerar convite ficam
   bloqueados (CA-33.4, CA-06.3). O texto acima do botão diz isso na tela, em
   vez de deixar o profissional descobrir depois que nada funciona.          */

feitas.push(await montarTela(12, 'Cadastro com CRP', 'psicologo', o.x, o.y, () => [
  statusBar(),
  topo('Seu registro no CRP'),
  corpo([
    campo('Região', '06 · São Paulo', true),
    campo('Número de registro', '123456', true),
    {t:'col', gap:6, children:[
      {t:'txt', v:'Documento comprobatório', deg:'small+'},
      {t:'row', h:96, r:12, just:'CENTER', align:'CENTER', fill:'Branco',
       stroke:'Light -1', peso:1,
       children:[{t:'txt', v:'Enviar arquivo ou foto', deg:'p', cor:'Dark +1', align:'CENTER'}]}
    ]},
    {t:'txt', v:'Seu cadastro passa por conferência antes de o perfil ir ao ar. Enquanto isso você não aparece no catálogo nem gera convites.',
     deg:'small', cor:'Dark +1'},
    empurra(),
    botao('Enviar para análise')
  ], {gap:16})
]));

/* -- 13 · Lista de pacientes ----------------------------------------------
   RF-35, RF-06. A lista responde uma pergunta: de quem cuidar primeiro. Por
   isso ordena por pendência e não por ordem alfabética, e por isso quem não
   tem novidade aparece por último e sem selo.

   A barra de abas é diferente da do paciente — mesmo aplicativo, dois lados
   (DEC-01). Junto com o rosa, é o que diz ao usuário em qual lado ele está.  */

feitas.push(await montarTela(13, 'Lista de pacientes', 'psicologo', o.x + PASSO_X, o.y, () => [
  statusBar(),
  topo('Pacientes'),
  corpo([
    cartao([
      cab('Camila S.', selo('2 não lidas', 'aviso')),
      {t:'txt', v:'3 relatos novos · consulta sexta, 15h', deg:'small', cor:'Dark +1'}
    ]),
    cartao([
      cab('Rodrigo M.', selo('tarefa vencida', 'aviso')),
      {t:'txt', v:'1 relato novo · sem consulta marcada', deg:'small', cor:'Dark +1'}
    ]),
    cartao([
      cab('Beatriz L.', null),
      {t:'txt', v:'Sem novidades desde 12/08', deg:'small', cor:'Dark +1'}
    ]),
    empurra(),
    botao('Gerar convite para novo paciente', 'fantasma')
  ], {gap:12}),
  abas(['Pacientes', 'Agenda', 'Perfil'], 'Pacientes')
]));

/* -- 14 · Prontuário ------------------------------------------------------
   RF-36, RF-37, RF-41, RF-42, RNF-08.

   O detalhe que a banca vai olhar: a contagem diz "2 relatos compartilhados no
   período" e NUNCA "2 de 3". Nada nesta tela pode denunciar que existe relato
   privado — nem por número, nem por lacuna na lista, nem por espaço reservado
   ou data faltando (CA-23.1, CA-23.2). Quem for implementar precisa entender
   que o filtro acontece na consulta, não na renderização.

   O botão de resumo é "Gerar", no imperativo do profissional: a análise por IA
   só roda quando ele pede, nunca por rotina (CA-41.2).

   O chip "Medicação" existe porque a aba faz parte do prontuário, mas as telas
   de medicação são Sprint 2 por decisão registrada. Não desenhe o conteúdo
   dela aqui.                                                                */

feitas.push(await montarTela(14, 'Prontuário', 'psicologo', o.x + PASSO_X * 2, o.y, () => [
  statusBar(),
  topo('Camila S.', true),
  corpo([
    chips(['Relatos', 'Tarefas', 'Consultas', 'Medicação'], 'Relatos'),
    cartao([
      cab('Terça, 18/08', null),
      {t:'txt', v:'Discussão no trabalho e voltei pensando naquilo a noite toda.',
       deg:'small', cor:'Dark +1'}
    ]),
    cartao([
      cab('Sábado, 15/08', null),
      {t:'txt', v:'Dia bom. Consegui sair de casa e encontrar a Marina.',
       deg:'small', cor:'Dark +1'}
    ]),
    {t:'txt', v:'2 relatos compartilhados no período', deg:'small', cor:'Dark +1', align:'CENTER'},
    empurra(),
    botao('Gerar resumo da semana'),
    botao('Atribuir tarefa', 'fraco')
  ], {gap:12}),
  abas(['Pacientes', 'Agenda', 'Perfil'], 'Pacientes')
]));

return {
  createdNodeIds: feitas.map(f => f.id),
  telas: feitas.map(f => f.name + ' @x=' + Math.round(f.x)),
  fontesCarregadas: fontesCarregadas,
  avisos: avisos,
  conferir: 'pendência 5: olhar os selos Danger ao lado do rosa nas telas 13 e 14',
  proximo: 'nenhum — as 14 telas estão montadas. Atualizar o CONTEXTO.md.'
};
