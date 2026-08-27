/* =============================================================================
   CHAMADA 7 — as interações do protótipo.

   Este script é AUTÔNOMO: NÃO leve o _preludio.js junto.

   Ele liga botões, cartões, setas de voltar e abas, transformando 18 frames
   soltos em um protótipo navegável, e define dois pontos de partida.

   ATENÇÃO: este é o único script da pasta que depende de IDs de nó do arquivo
   vivo. Todos os outros resolvem tudo por nome. Se as telas forem reconstruídas
   do zero, os IDs mudam e a tabela `ligacoes` abaixo precisa ser refeita — os
   IDs atuais estão na seção 6 do CONTEXTO.md.

   Por isso ele também não roda no `verificar.js`: contra a API simulada, todo
   ID daria "frame nao existe", e o teste não diria nada. A proteção dele é
   outra: ele NUNCA lança erro por link quebrado. Cada falha entra na lista
   `falhas` do retorno, e a chamada termina. Assim um seletor errado não
   derruba os outros 40 links junto.
   ============================================================================= */

/* Ida empurra para a esquerda, volta empurra para a direita. É a convenção de
   navegação de celular, e faz o protótipo parecer um app em vez de slides. */
const IDA     = { type:'PUSH', direction:'LEFT',  matchLayers:false, easing:{type:'EASE_OUT'}, duration:0.25 };
const VOLTA   = { type:'PUSH', direction:'RIGHT', matchLayers:false, easing:{type:'EASE_OUT'}, duration:0.25 };
const SIMPLES = { type:'DISSOLVE', easing:{type:'EASE_OUT'}, duration:0.2 };

const ok = [], falhas = [];
const cache = {};
async function tela(id) {
  if (!(id in cache)) cache[id] = await figma.getNodeByIdAsync(id);
  return cache[id];
}

/* Sobe do texto até o filho direto do corpo: quem precisa ser clicável é o
   cartão inteiro, não a palavra dentro dele. */
function ateOCorpo(no) {
  let n = no;
  while (n && n.parent && n.parent.name !== 'corpo') n = n.parent;
  return (n && n.parent && n.parent.name === 'corpo') ? n : null;
}

function resolver(frame, sel) {
  const tipo = sel[0], arg = sel[1];
  if (tipo === 'nome')   return frame.findOne(n => n.name === arg);
  if (tipo === 'voltar') return frame.findOne(n => n.type === 'TEXT' && n.characters === '‹');
  if (tipo === 'cartao') {
    const t = frame.findOne(n => n.type === 'TEXT' && String(n.characters).indexOf(arg) >= 0);
    return t ? ateOCorpo(t) : null;
  }
  if (tipo === 'aba') {
    const abas = frame.findOne(n => n.name === 'abas');
    if (!abas) return null;
    return abas.children.find(c =>
      c.findOne && c.findOne(n => n.type === 'TEXT' && n.characters === arg)) || null;
  }
  return null;
}

async function ligar(origemId, sel, destinoId, sentido) {
  const rotulo = origemId + ' [' + sel.join(':') + '] -> ' + destinoId;
  const frame = await tela(origemId);
  if (!frame) { falhas.push(rotulo + ' | frame de origem nao existe'); return; }
  if (!(await tela(destinoId))) { falhas.push(rotulo + ' | destino nao existe'); return; }

  const no = resolver(frame, sel);
  if (!no) { falhas.push(rotulo + ' | no nao encontrado'); return; }

  const acao = (transicao) => ([{
    trigger: { type: 'ON_CLICK' },
    actions: [{
      type: 'NODE', destinationId: destinoId, navigation: 'NAVIGATE',
      transition: transicao, preserveScrollPosition: false
    }]
  }]);

  try {
    await no.setReactionsAsync(acao(sentido === 'volta' ? VOLTA : IDA));
    ok.push(rotulo);
  } catch (e) {
    /* Se a transição direcional for recusada, o link vale mais que o enfeite:
       cai para dissolve em vez de perder a ligação. */
    try {
      await no.setReactionsAsync(acao(SIMPLES));
      ok.push(rotulo + ' (dissolve)');
    } catch (e2) {
      falhas.push(rotulo + ' | ' + e2.message);
    }
  }
}

/* -- o mapa do fluxo ------------------------------------------------------
   origem, seletor, destino, sentido                                        */
const ligacoes = [
  /* entrada e cadastro */
  ['70:2',   ['nome','botao Entrar'],       '71:80', 'ida'],
  ['70:2',   ['nome','botao Criar conta'],  '100:2', 'ida'],
  ['70:29',  ['nome','botao Entrar'],       '71:80', 'ida'],
  ['70:29',  ['nome','botao Criar conta'],  '100:2', 'ida'],

  ['100:2',  ['nome','opcao paciente'],     '100:24','ida'],
  ['100:2',  ['nome','opcao psicologo'],    '100:58','ida'],
  ['100:2',  ['voltar'],                    '70:2',  'volta'],

  ['100:24', ['nome','botao Criar conta'],  '70:53', 'ida'],
  ['100:24', ['voltar'],                    '100:2', 'volta'],
  ['100:58', ['nome','botao Criar conta'],  '73:2',  'ida'],
  ['100:58', ['voltar'],                    '100:2', 'volta'],

  /* consentimento e onboarding */
  ['70:53',  ['nome','botao Continuar'],    '70:83', 'ida'],
  ['70:83',  ['cartao','Tenho psicólogo'],  '70:96', 'ida'],
  ['70:83',  ['cartao','Quero encontrar'],  '71:2',  'ida'],

  /* vínculo */
  ['70:96',  ['nome','botao Vincular'],     '71:80', 'ida'],
  ['70:96',  ['voltar'],                    '70:83', 'volta'],
  ['71:2',   ['cartao','Ana Paula'],        '71:49', 'ida'],
  ['71:2',   ['cartao','Marcos'],           '71:49', 'ida'],
  ['71:2',   ['cartao','Juliana'],          '71:49', 'ida'],
  ['71:2',   ['voltar'],                    '70:83', 'volta'],
  ['71:49',  ['nome','botao Solicitar vínculo'], '71:80', 'ida'],
  ['71:49',  ['voltar'],                    '71:2',  'volta'],

  /* ciclo semanal do paciente */
  ['71:80',  ['nome','botao Escrever relato'], '71:122', 'ida'],
  ['71:80',  ['aba','Tarefas'],             '72:2',  'ida'],
  ['71:80',  ['aba','Conversa'],            '72:46', 'ida'],
  ['71:80',  ['aba','Agenda'],              '72:70', 'ida'],
  ['71:122', ['nome','botao Salvar relato'],'71:80', 'volta'],
  ['71:122', ['voltar'],                    '71:80', 'volta'],
  ['72:2',   ['aba','Início'],              '71:80', 'volta'],
  ['72:2',   ['aba','Conversa'],            '72:46', 'ida'],
  ['72:2',   ['aba','Agenda'],              '72:70', 'ida'],
  ['72:46',  ['voltar'],                    '71:80', 'volta'],
  ['72:70',  ['aba','Início'],              '71:80', 'volta'],
  ['72:70',  ['aba','Tarefas'],             '72:2',  'ida'],
  ['72:70',  ['aba','Conversa'],            '72:46', 'ida'],

  /* lado do psicólogo */
  ['73:2',   ['nome','botao Enviar para análise'], '73:25', 'ida'],
  ['73:25',  ['cartao','Camila S.'],        '73:61', 'ida'],
  ['73:25',  ['cartao','Rodrigo M.'],       '73:61', 'ida'],
  ['73:25',  ['cartao','Beatriz L.'],       '73:61', 'ida'],
  ['73:61',  ['voltar'],                    '73:25', 'volta'],
  ['73:61',  ['aba','Pacientes'],           '73:25', 'volta']
];

for (const l of ligacoes) await ligar(l[0], l[1], l[2], l[3]);

/* Dois pontos de partida: quem abrir o protótipo escolhe por qual lado entrar.
   Sem isso o Figma começa pelo frame mais à esquerda da página, que é a tela de
   login antiga. */
let partida = 'nao definido';
try {
  figma.currentPage.flowStartingPoints = [
    { nodeId: '70:2', name: 'Entrada e cadastro' },
    { nodeId: '73:2', name: 'Lado do psicólogo' }
  ];
  partida = 'definidos';
} catch (e) { partida = 'falhou: ' + e.message; }

return { ligadas: ok.length, falhas: falhas, pontosDePartida: partida, detalhe: ok };
