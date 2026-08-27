/* =============================================================================
   CHAMADA 2 de 5 — telas 1 a 4, mais o estado de erro do login.

   Concatene o _preludio.js na frente deste arquivo. Ver README.md.

   Contexto de cor (seção 2.3, regra 5): as telas 1, 2 e 3 acontecem ANTES de o
   sistema saber quem é a pessoa, então não podem ser verdes nem rosas. Elas usam
   o GRADIENTE que funde as duas cores — que não escolhe lado, mostra os dois.
   A tela 4 já é do paciente, e é onde a interface assume o verde sozinho.
   ============================================================================= */

const fontesCarregadas = await carregarFontes();
await garantirGradiente();   // telas 1 a 3 usam o degrade como acento
const o = origemLivre();
const feitas = [];

/* -- 1 · Entrada ----------------------------------------------------------
   Refação da tela de login sob as regras novas (seção 4.4). O que muda em
   relação à versão original: a palavra "Calmind" vira a logo, os rótulos e o
   link viram preto, e o botão "Entrar" sai do rosa chapado — onde o texto
   branco media 2,34:1 — para o gradiente verde-rosa com texto Dark. Sobre o
   degradê o Dark mede 7,28:1 no extremo rosa e 12,13:1 no verde: passa nos
   dois. Branco reprovaria nos dois.

   Não há escolha de perfil aqui, e isso é proposital: o CA-02.1 diz que o
   sistema abre a sessão e apresenta a tela do perfil, porque já sabe quem é
   pelas credenciais. A escolha pertence ao cadastro (RF-01).                */

feitas.push(await montarTela(1, 'Entrada', 'neutro', o.x, o.y, () => [
  statusBar(),
  corpo([
    {t:'col', gap:10, align:'CENTER', children:[
      {t:'logo', nome:'Clean Logo', w:132},
      {t:'txt', v:'Saúde Mental & Acolhimento', deg:'small', cor:'Dark +1', align:'CENTER'}
    ]},
    campo('E-mail', 'seu@email.com'),
    campo('Senha', '••••••••'),
    {t:'row', nome:'alvo 44pt', h:44, align:'CENTER', children:[
      {t:'txt', v:'Esqueci minha senha', deg:'small+'}
    ]},
    botao('Entrar'),
    {t:'row', gap:12, align:'CENTER', children:[
      {t:'box', h:1, fill:'Light', fill_h:true},
      {t:'txt', v:'ou', deg:'small', cor:'Dark +1', hug:true},
      {t:'box', h:1, fill:'Light', fill_h:true}
    ]},
    botao('Criar conta', 'fantasma'),
    {t:'txt', v:'No cadastro você escolhe se é paciente ou psicólogo. Em seguida você lê e aceita o termo de tratamento de dados.',
     deg:'small', cor:'Dark +1', align:'CENTER'}
  ], {gap:18, just:'CENTER'})
]));

/* -- 1b · Entrada, erro ---------------------------------------------------
   Pendência 6 da seção 7. O CA-02.2 exige mensagem genérica: ela não pode
   dizer se o errado foi o e-mail ou a senha, senão vira oráculo de quais
   e-mails existem cadastrados.

   Não é uma tela nova do inventário — é um estado da tela 1, e o inventário
   continua congelado em 14 pela DP-04.

   Repare que aqui o Danger convive com o degradê, e o extremo rosa dele fica
   longe do alerta. A pendência 5, de Danger e Primário serem vizinhos demais,
   morde mesmo é nas telas 12 a 14, que são rosa chapado.                     */

feitas.push(await montarTela('1b', 'Entrada · erro', 'neutro', o.x + PASSO_X, o.y, () => [
  statusBar(),
  corpo([
    {t:'col', gap:10, align:'CENTER', children:[
      {t:'logo', nome:'Clean Logo', w:132},
      {t:'txt', v:'Saúde Mental & Acolhimento', deg:'small', cor:'Dark +1', align:'CENTER'}
    ]},
    alerta('Não foi possível entrar. Confira o e-mail e a senha e tente de novo.'),
    campo('E-mail', 'camila@email.com', true),
    campo('Senha', '••••••••', true),
    {t:'row', nome:'alvo 44pt', h:44, align:'CENTER', children:[
      {t:'txt', v:'Esqueci minha senha', deg:'small+'}
    ]},
    botao('Entrar'),
    botao('Criar conta', 'fantasma')
  ], {gap:18, just:'CENTER'})
]));

/* -- 2 · Consentimento ----------------------------------------------------
   RF-03, RF-04, RNF-13. São dois consentimentos independentes, e o de IA vem
   separado por exigência do art. 11 da LGPD. Recusar o primeiro bloqueia as
   funções clínicas (CA-03.2), por isso ele é o cartão destacado.            */

feitas.push(await montarTela(2, 'Consentimento', 'neutro', o.x + PASSO_X * 2, o.y, () => [
  statusBar(),
  topo('Antes de começar'),
  corpo([
    {t:'txt', v:'Tratamento dos seus dados de saúde', deg:'h5'},
    barras(5),
    {t:'txt', v:'Versão 1.0, vigente desde 01/08/2026', deg:'small', cor:'Dark +1'},
    cartao([
      cab('Li e aceito o termo', selo('obrigatório', 'destaque'))
    ], 'destaque'),
    cartao([
      cab('Autorizo a análise por IA', selo('separado')),
      {t:'txt', v:'Seus relatos compartilhados podem ser resumidos por um serviço de IA, quando o seu psicólogo solicitar. Você pode revogar quando quiser.',
       deg:'small', cor:'Dark +1'}
    ]),
    {t:'txt', v:'Cada aceite grava data, hora e versão do termo.', deg:'mini', cor:'Dark +1'},
    empurra(),
    botao('Continuar')
  ], {gap:14})
]));

/* -- 3 · Onboarding -------------------------------------------------------
   Fluxo 3.1 do documento base: as duas portas de entrada do produto, uma como
   ferramenta de continuidade e outra como facilitador de acesso.            */

feitas.push(await montarTela(3, 'Como você chegou aqui', 'neutro', o.x + PASSO_X * 3, o.y, () => [
  statusBar(),
  corpo([
    {t:'txt', v:'Você já faz acompanhamento?', deg:'h5', align:'CENTER'},
    cartao([
      {t:'txt', v:'Tenho psicólogo', deg:'p+'},
      {t:'txt', v:'Use o código que ele te passou na sessão', deg:'small', cor:'Dark +1'}
    ], 'destaque'),
    cartao([
      {t:'txt', v:'Quero encontrar um profissional', deg:'p+'},
      {t:'txt', v:'Busque no catálogo e solicite o vínculo', deg:'small', cor:'Dark +1'}
    ]),
    {t:'txt', v:'Você pode mudar de ideia depois', deg:'small', cor:'Dark +1', align:'CENTER'}
  ], {gap:16, just:'CENTER'})
]));

/* -- 4 · Código de convite ------------------------------------------------
   RF-07, RNF-05. Primeira tela verde: daqui em diante o sistema já sabe que
   está do lado do paciente. A mensagem de erro é única para todas as causas e
   não revela de quem era o código (CA-07.2). O alfabeto não usa O, I, 0 nem 1
   porque o código é ditado em voz alta na sessão presencial.                */

feitas.push(await montarTela(4, 'Código de convite', 'paciente', o.x + PASSO_X * 4, o.y, () => [
  statusBar(),
  topo('Tenho psicólogo', true),
  corpo([
    {t:'txt', v:'Digite o código de 6 caracteres que o seu psicólogo passou.', deg:'p'},
    {t:'row', nome:'campo do código', h:72, r:12, just:'CENTER', align:'CENTER',
     fill:'Branco', stroke:ctx.acento, peso:2,
     children:[{t:'txt', v:'K 7 M 9 P Q', deg:'h4', align:'CENTER'}]},
    {t:'txt', v:'O código não usa as letras O e I nem os números 0 e 1, para não haver confusão ao anotar.',
     deg:'small', cor:'Dark +1'},
    botao('Vincular'),
    alerta('Código inválido, expirado ou já utilizado. Peça um novo ao seu psicólogo.'),
    empurra()
  ], {gap:16})
]));

return {
  createdNodeIds: feitas.map(f => f.id),
  telas: feitas.map(f => f.name + ' @x=' + Math.round(f.x)),
  fontesCarregadas: fontesCarregadas,
  avisos: avisos,
  proximo: '02-telas-5a8.js'
};
