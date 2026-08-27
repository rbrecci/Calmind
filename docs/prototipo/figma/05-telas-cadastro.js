/* =============================================================================
   CHAMADA 6 — telas 01c, 01d e 01e: o ramo do cadastro.

   Concatene o _preludio.js na frente deste arquivo. Ver README.md.

   Por que estas telas existem, e por que NÃO aumentam o inventário:

   O item 1 do inventário congelado (seção 1.6 do cronograma) diz, na letra:
   "Entrada: login **e cadastro com escolha de perfil** (RF-01, RF-02)". O
   cadastro e a escolha de perfil sempre estiveram dentro do item 1 — só nunca
   tinham sido desenhados. A tela 01 mostrava a metade do login e nada da outra
   metade. Estas três telas fecham o item 1; não abrem um item 15.

   Por isso a numeração continua na família `01x`, como o estado de erro `01b`.

   Elas ficam numa segunda fileira, em y=972, logo abaixo da tela de entrada.
   O ramo do cadastro fica visualmente pendurado na tela que o origina.
   ============================================================================= */

const fontesCarregadas = await carregarFontes();
await garantirGradiente();

const X0 = 3504, Y0 = 972;      // alinhado sob a tela 01
const feitas = [];

/* -- 01c · Escolha de perfil ----------------------------------------------
   RF-01, CA-01.1. A conta fica presa ao perfil escolhido, então a tela avisa
   isso ANTES da escolha, não depois de consumada.

   As duas portas têm exatamente o mesmo peso visual: mesmo cartão, mesmo
   contorno, mesma tipografia. Nenhuma vem pré-selecionada e nenhuma recebe
   destaque. O sistema não pode empurrar ninguém para um lado — quem decide se
   é paciente ou psicólogo é a pessoa, e a decisão é irreversível.            */

feitas.push(await montarTela('01c', 'Escolha de perfil', 'neutro', X0, Y0, () => [
  statusBar(),
  topo('Criar conta', true),
  corpo([
    {t:'txt', v:'Como você vai usar o Calmind?', deg:'h5'},
    {t:'txt', v:'Essa escolha não muda depois: a conta fica presa ao perfil.',
     deg:'small', cor:'Dark +1'},
    {t:'col', nome:'opcao paciente', gap:8, pad:16, r:14, fill:'Branco',
     stroke:'Light -1', peso:1, children:[
      {t:'row', just:'SPACE_BETWEEN', align:'CENTER', gap:8, children:[
        {t:'txt', v:'Sou paciente', deg:'p+'},
        {t:'txt', v:'›', deg:'h4', hug:true}
      ]},
      {t:'txt', v:'Quero acompanhar meu processo, escrever relatos e falar com meu psicólogo.',
       deg:'small', cor:'Dark +1'}
    ]},
    {t:'col', nome:'opcao psicologo', gap:8, pad:16, r:14, fill:'Branco',
     stroke:'Light -1', peso:1, children:[
      {t:'row', just:'SPACE_BETWEEN', align:'CENTER', gap:8, children:[
        {t:'txt', v:'Sou psicólogo', deg:'p+'},
        {t:'txt', v:'›', deg:'h4', hug:true}
      ]},
      {t:'txt', v:'Tenho registro no CRP e quero atender pacientes pela plataforma.',
       deg:'small', cor:'Dark +1'}
    ]},
    empurra(),
    {t:'txt', v:'O registro no CRP passa por conferência antes de o perfil ir ao ar.',
     deg:'mini', cor:'Dark +1', align:'CENTER'}
  ], {gap:14})
]));

/* -- 01d e 01e · Cadastro -------------------------------------------------
   As duas telas são IGUAIS de propósito, como foi pedido. Só mudam duas
   coisas, e as duas por necessidade:

   1. O selo que confirma o perfil escolhido. Sem ele, a pessoa perde de vista
      qual conta está criando — e a escolha é irreversível (CA-01.1).
   2. O destino do botão. Paciente segue para o consentimento (tela 02);
      psicólogo vai direto para o registro no CRP (tela 12).

   Duas telas e não uma porque o protótipo precisa de dois destinos diferentes
   a partir do mesmo botão, e um frame só tem um destino. É limitação do
   protótipo, não decisão de produto: na implementação é uma tela só, com o
   roteamento decidido pelo perfil em memória.                                */

const cadastro = (perfil) => () => [
  statusBar(),
  topo('Criar conta', true),
  corpo([
    selo(perfil, 'destaque'),
    campo('Nome completo', 'Camila Souza'),
    campo('E-mail', 'camila@email.com'),
    campo('Data de nascimento', '14/03/2001'),
    campo('Senha', '••••••••'),
    campo('Confirmar senha', '••••••••'),
    {t:'txt', v:'Mínimo de 8 caracteres, com letra e número.', deg:'mini', cor:'Dark +1'},
    empurra(),
    botao('Criar conta')
  ], {gap:12})
];

/* O contexto de cor das duas é `neutro` — o degradê, não verde nem rosa. Mas o
   NOME do frame diz o perfil, senão ficam dois frames idênticos e indistinguíveis
   no painel de camadas, e ninguém sabe qual liga para onde. */
const t01d = await montarTela('01d', 'Cadastro', 'neutro', X0 + PASSO_X, Y0, cadastro('Paciente'));
t01d.name = '01d · Cadastro · paciente';
feitas.push(t01d);

const t01e = await montarTela('01e', 'Cadastro', 'neutro', X0 + PASSO_X * 2, Y0, cadastro('Psicólogo'));
t01e.name = '01e · Cadastro · psicologo';
feitas.push(t01e);

const colapsados = [];
for (const f of feitas) {
  for (const t of f.findAllWithCriteria({types:['TEXT']})) {
    if (t.width < 2 || t.height > 400) colapsados.push(f.name + ' :: ' + Math.round(t.width) + 'x' + Math.round(t.height));
  }
}

return {
  createdNodeIds: feitas.map(f => f.id),
  telas: feitas.map(f => f.name + ' @ ' + Math.round(f.x) + ',' + Math.round(f.y)),
  fontesCarregadas: fontesCarregadas,
  colapsados: colapsados,
  avisos: avisos,
  proximo: '06-interacoes.js'
};
