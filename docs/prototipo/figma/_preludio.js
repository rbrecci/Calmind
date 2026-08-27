/* =============================================================================
   Calmind — prelúdio compartilhado dos scripts de tela do Figma.

   Este arquivo NÃO roda sozinho. Ele é concatenado na frente de cada
   `NN-telas-*.js` e o resultado inteiro vai no parâmetro `code` do use_figma.
   Ver README.md desta pasta.

   Por que existe: a cota do MCP no plano Starter é o recurso escasso. Cada
   chamada precisa carregar o máximo de trabalho possível, e nenhuma pode
   depender de um ID que não conseguimos ler antes. Por isso tudo aqui resolve
   estilo e fonte POR NOME, em tempo de execução, com fallback declarado.
   ============================================================================= */

const W = 393, H = 852;          // mesmo tamanho do frame "Login Page" (7:3)
const avisos = [];               // tudo que não saiu como o previsto sai no return

const norm = (s) => String(s).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

/* -- cor ------------------------------------------------------------------ */

/* Fallback vindo da seção 2.2 do CONTEXTO.md. Só entra em ação se o estilo
   não for encontrado pelo nome — e quando entra, grita no `avisos`, porque
   hex solto na tela é exatamente o que a seção 4.4 diz que não pode haver. */
const FALLBACK = {
  'primario -1':'A858A9', 'primario':'F07EF2', 'primario +1':'DFB3F2',
  'secundario -1':'5BA958','secundario':'82F27E','secundario +1':'D6F2C2',
  'light -1':'989898',    'light':'D9D9D9',    'light +1':'E4E4E4',
  'dark -1':'141414',     'dark':'1C1C1C',     'dark +1':'606060',
  'danger -1':'B24040',   'danger':'FF5C5C',   'danger +1':'FF8D8D',
  'success -1':'5FA2B2',  'success':'88E7FF',  'success +1':'ACEEFF'
};

const rgb = (hex) => ({
  r: parseInt(hex.slice(0,2),16)/255,
  g: parseInt(hex.slice(2,4),16)/255,
  b: parseInt(hex.slice(4,6),16)/255
});

let _paints = null;
async function acharEstilo(nome) {
  if (!_paints) _paints = await figma.getLocalPaintStylesAsync();
  const alvo = norm(nome);
  // 1) folha do caminho igual  2) nome inteiro igual  3) termina com
  return _paints.find(s => norm(s.name.split('/').pop()) === alvo)
      || _paints.find(s => norm(s.name) === alvo)
      || _paints.find(s => norm(s.name).endsWith(alvo))
      || null;
}

async function aplicarFill(node, nome) {
  if (nome === 'Branco') { node.fills = [{type:'SOLID', color:{r:1,g:1,b:1}}]; return; }
  if (nome === 'Nenhum') { node.fills = []; return; }
  const st = await acharEstilo(nome);
  if (st) { await node.setFillStyleIdAsync(st.id); return; }
  const hx = FALLBACK[norm(nome)];
  if (!hx) { avisos.push('cor sem estilo e sem fallback: ' + nome); return; }
  avisos.push('FALLBACK HEX usado em fill: ' + nome);
  node.fills = [{type:'SOLID', color: rgb(hx)}];
}

async function aplicarStroke(node, nome, peso) {
  node.strokeWeight = peso || 1;
  node.strokeAlign = 'INSIDE';
  const st = await acharEstilo(nome);
  if (st) { await node.setStrokeStyleIdAsync(st.id); return; }
  const hx = FALLBACK[norm(nome)];
  if (!hx) { avisos.push('contorno sem estilo e sem fallback: ' + nome); return; }
  avisos.push('FALLBACK HEX usado em stroke: ' + nome);
  node.strokes = [{type:'SOLID', color: rgb(hx)}];
}

/* -- tipografia ----------------------------------------------------------- */

/* Escala da seção 2.1. Aplicada como fonte direta, de propósito: os 15 estilos
   de texto do arquivo se chamam "* Quicksand", inclusive "Parágrafo Quicksand"
   e "Small Quicksand", que são corpo. Aplicar esses estilos daria Quicksand no
   corpo e contrariaria a decisão. É a pendência 4 da seção 7 do CONTEXTO.
   Quando ela for resolvida, dá para trocar isto por setTextStyleIdAsync. */
const TIPO = {
  h1:['Quicksand','SemiBold',40], h2:['Quicksand','SemiBold',34],
  h3:['Quicksand','SemiBold',28], h4:['Quicksand','SemiBold',24],
  h5:['Quicksand','SemiBold',18],
  p:['Poppins','Regular',16],     'p+':['Poppins','Medium',16],
  small:['Poppins','Regular',14], 'small+':['Poppins','Medium',14],
  mini:['Poppins','Regular',12],  'mini+':['Poppins','Medium',12]
};

let _fontes = null;
const FONTE = {};
async function temFonte(family, style) {
  if (!_fontes) _fontes = (await figma.listAvailableFontsAsync())
    .map(f => f.fontName.family + '|' + f.fontName.style);
  return _fontes.indexOf(family + '|' + style) >= 0;
}

/* "SemiBold" x "Semi Bold" é o footgun clássico. Resolvemos, não adivinhamos. */
async function resolverFonte(family, style) {
  if (await temFonte(family, style)) return {family: family, style: style};
  const mapa = {
    'SemiBold': ['Semi Bold','Bold','Medium','Regular'],
    'Medium'  : ['Regular','SemiBold','Semi Bold'],
    'Regular' : ['Book','Light']
  };
  const alts = mapa[style] || ['Regular'];
  for (const a of alts) {
    if (await temFonte(family, a)) {
      avisos.push(family + ' ' + style + ' ausente, usando ' + a);
      return {family: family, style: a};
    }
  }
  avisos.push(family + ' indisponível, caindo para Inter Regular');
  return {family:'Inter', style:'Regular'};
}

async function carregarFontes() {
  for (const k of Object.keys(TIPO)) {
    FONTE[k] = await resolverFonte(TIPO[k][0], TIPO[k][1]);
  }
  const unicas = {};
  for (const k of Object.keys(FONTE)) unicas[FONTE[k].family + '|' + FONTE[k].style] = FONTE[k];
  for (const k of Object.keys(unicas)) await figma.loadFontAsync(unicas[k]);
  return Object.keys(unicas);
}

/* -- contexto de cor por tela (seção 2.3, regras 4 e 5) -------------------- */

/* neutro    : telas anteriores ao login. Gradiente que funde verde e rosa.
   paciente  : verde.
   psicologo : rosa.

   Por que o neutro é um gradiente e não uma cor sólida: a regra 5 da seção 2.3
   diz que as telas anteriores ao login não podem revelar um lado. Um degradê
   que funde as duas cores não escolhe — mostra as duas. Preserva a intenção da
   regra e ainda dá identidade à entrada, que antes era preto e branco.

   A tinta sobre o gradiente é Dark nos três contextos, sem exceção. Branco
   reprova nos dois extremos do degradê: 2,34:1 no rosa e 1,40:1 no verde. */
const CTX = {
  neutro:    { acento:'Gradiente Verde-Rosa', tintaBotao:'Dark', linha:'Light -1' },
  paciente:  { acento:'Secundário', tintaBotao:'Dark',     linha:'Secundário -1' },
  psicologo: { acento:'Primário',   tintaBotao:'Dark',     linha:'Primário -1' }
};
let ctx = CTX.neutro;   // trocado por telaFrame() a cada tela

/* O gradiente é um estilo, não um paint solto em cada botão. Um paint não pode
   apontar para dois estilos ao mesmo tempo, então este é o único lugar do
   arquivo onde a cor é COPIADA da paleta em vez de ligada a ela: as paradas do
   degradê são lidas de Secundário e Primário no momento em que o estilo nasce.
   Se aquelas duas mudarem, este estilo precisa ser regerado à mão.

   Chame esta função uma vez, no começo de cada script que monte tela neutra. */
async function garantirGradiente() {
  const jaExiste = await acharEstilo('Gradiente Verde-Rosa');
  const verde = await acharEstilo('Secundário');
  const rosa  = await acharEstilo('Primário');
  if (!verde || !rosa) { avisos.push('Secundário ou Primário ausente, gradiente não gerado'); return null; }

  const degrade = {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[1, 0, 0], [0, 1, 0]],            // esquerda para a direita
    gradientStops: [
      { position: 0, color: Object.assign({}, verde.paints[0].color, { a: 1 }) },
      { position: 1, color: Object.assign({}, rosa.paints[0].color,  { a: 1 }) }
    ]
  };

  const st = jaExiste || figma.createPaintStyle();
  if (!jaExiste) {
    st.name = 'Gradiente Verde-Rosa';
    st.description =
      'Funde Secundario (paciente) e Primario (psicologo). Uso: acao primaria das telas ' +
      'anteriores ao login, que nao podem revelar um lado. Texto sobre ele e sempre Dark.';
    _paints = null;                                        // invalida o cache de estilos
  }
  st.paints = [degrade];
  return st.id;
}

/* -- construtor de nós ----------------------------------------------------- */

async function build(spec, parent) {
  let node;

  if (spec.t === 'txt') {
    const deg = spec.deg || 'p';
    node = figma.createText();
    node.fontName = FONTE[deg];
    node.fontSize = TIPO[deg][2];
    node.lineHeight = {unit:'PERCENT', value: deg.charAt(0) === 'h' ? 120 : 145};

    /* A ORDEM AQUI NÃO É ARBITRÁRIA, e errá-la custou uma chamada.
       `textAutoResize = 'HEIGHT'` trava a largura no valor que o nó tiver
       naquele instante. Um nó recém-criado tem largura ZERO. Se travarmos
       antes de escrever, o texto quebra a cada caractere e vira um fio
       vertical — e o FILL que vem depois não refaz o fluxo.
       Então: escrever primeiro (com WIDTH_AND_HEIGHT o nó ganha a largura do
       conteúdo), pendurar no pai, e só então trocar o modo. */
    node.characters = spec.v;
    if (spec.align) node.textAlignHorizontal = spec.align;
    node.name = spec.nome || spec.v.slice(0, 28);
    parent.appendChild(node);

    if (spec.hug) {
      node.layoutSizingHorizontal = 'HUG';
    } else {
      node.layoutSizingHorizontal = 'FILL';
      if (node.textAutoResize !== 'HEIGHT') node.textAutoResize = 'HEIGHT';
      /* Rede de segurança: se ainda assim a largura não resolveu, fixamos na
         medida interna do pai. Melhor uma largura fixa e um aviso do que uma
         tela colapsada e silenciosa. */
      if (node.width < 2) {
        const larg = Math.max(20, parent.width - (parent.paddingLeft || 0) - (parent.paddingRight || 0));
        node.layoutSizingHorizontal = 'FIXED';
        node.resize(larg, node.height);
        node.textAutoResize = 'HEIGHT';
        avisos.push('texto "' + node.name + '" precisou de largura fixa (' + Math.round(larg) + ')');
      }
    }
    await aplicarFill(node, spec.cor || 'Dark');
    if (spec.op != null) node.opacity = spec.op;

  } else if (spec.t === 'logo') {
    /* A Black é a variante escolhida na seção 2.5: é a que funciona sobre
       fundo branco com texto preto. Procuramos pelo nome porque não dá para
       ler o ID do nó antes de gastar chamada. Se ela sumir, entra um quadrado
       cinza e o aviso aparece no return — nunca uma tela silenciosamente sem
       marca. */
    /* Procura pelo nome pedido e, se não achar, aceita as outras variantes.
       A logo da tela de entrada foi trocada à mão para a `Clean Logo` colorida
       depois que o gradiente entrou, e um nome fixo aqui quebraria em silêncio. */
    const nomesAceitos = [spec.nome || 'Clean Logo', 'Clean Logo', 'Black Logo'];
    let alvo = null;
    for (const cand of nomesAceitos) {
      alvo = figma.currentPage.findOne(n => norm(n.name) === norm(cand));
      if (alvo) break;
    }
    if (alvo) {
      node = alvo.clone();
      const escala = (spec.w || 120) / node.width;
      node.rescale(escala);
      parent.appendChild(node);
    } else {
      avisos.push('logo "' + (spec.nome || 'Black Logo') + '" não encontrada na página');
      node = figma.createFrame();
      node.name = 'logo ausente';
      node.resize(spec.w || 120, spec.w || 120);
      node.cornerRadius = 16;
      await aplicarFill(node, 'Light');
      parent.appendChild(node);
    }

  } else if (spec.t === 'box') {
    node = figma.createFrame();
    node.name = spec.nome || 'box';
    node.resize(spec.w || 24, spec.h || 24);
    node.cornerRadius = spec.r != null ? spec.r : 0;
    node.clipsContent = false;
    await aplicarFill(node, spec.fill || 'Light');
    if (spec.stroke) await aplicarStroke(node, spec.stroke, spec.peso);
    parent.appendChild(node);
    if (spec.fill_h) node.layoutSizingHorizontal = 'FILL';

  } else {                                   // 'col' | 'row'
    node = figma.createAutoLayout(spec.t === 'row' ? 'HORIZONTAL' : 'VERTICAL');
    node.name = spec.nome || spec.t;
    node.itemSpacing = spec.gap != null ? spec.gap : 0;
    if (spec.pad != null) {
      const a = Array.isArray(spec.pad) ? spec.pad : [spec.pad, spec.pad, spec.pad, spec.pad];
      node.paddingTop = a[0]; node.paddingRight = a[1];
      node.paddingBottom = a[2]; node.paddingLeft = a[3];   // [topo, dir, baixo, esq]
    }
    if (spec.align) node.counterAxisAlignItems = spec.align;      // MIN|CENTER|MAX
    if (spec.just)  node.primaryAxisAlignItems = spec.just;       // MIN|CENTER|MAX|SPACE_BETWEEN
    node.cornerRadius = spec.r != null ? spec.r : 0;
    node.clipsContent = !!spec.corta;
    await aplicarFill(node, spec.fill || 'Nenhum');
    if (spec.stroke) {
      await aplicarStroke(node, spec.stroke, spec.peso);
      /* `lado` transforma o contorno em UMA linha. Sem isso, a barra de topo e
         a de abas ganham contorno nos quatro lados e viram caixa flutuante em
         vez de divisória — foi o que aconteceu na primeira montagem. */
      if (spec.lado === 'baixo') {
        node.strokeTopWeight = 0; node.strokeLeftWeight = 0;
        node.strokeRightWeight = 0; node.strokeBottomWeight = spec.peso || 1;
      } else if (spec.lado === 'cima') {
        node.strokeBottomWeight = 0; node.strokeLeftWeight = 0;
        node.strokeRightWeight = 0; node.strokeTopWeight = spec.peso || 1;
      }
    }

    parent.appendChild(node);
    if (spec.w) { node.resize(spec.w, node.height); node.layoutSizingHorizontal = 'FIXED'; }
    else if (spec.hug_h) node.layoutSizingHorizontal = 'HUG';
    else node.layoutSizingHorizontal = 'FILL';
    if (spec.h) { node.resize(node.width, spec.h); node.layoutSizingVertical = 'FIXED'; }
    else if (spec.cresce) node.layoutSizingVertical = 'FILL';
    if (spec.op != null) node.opacity = spec.op;

    for (const c of (spec.children || [])) { if (c) await build(c, node); }
  }
  return node;
}

/* -- partes que se repetem em várias telas --------------------------------- */

const statusBar = () => ({t:'row', nome:'status', pad:[10,20,2,20], just:'SPACE_BETWEEN', children:[
  {t:'txt', v:'9:41', deg:'mini+', hug:true},
  {t:'txt', v:'100%', deg:'mini+', hug:true, align:'RIGHT'}
]});

const topo = (titulo, voltar) => ({t:'row', nome:'topo', pad:[14,20,14,20], gap:12, align:'CENTER',
  stroke: ctx.linha, peso:1, lado:'baixo', children:[
    voltar ? {t:'txt', v:'‹', deg:'h4', hug:true} : null,
    {t:'txt', v:titulo, deg:'h5'}
  ]});

/* 56 pt de altura em campo e botão, e 44 pt mínimo em qualquer alvo tocável.
   É o piso do RNF-35 e já foi conferido na tela de login. */
const botao = (rotulo, tom) => {
  if (tom === 'fantasma') return {t:'row', nome:'botao ' + rotulo, h:56, r:12, just:'CENTER',
    align:'CENTER', fill:'Branco', stroke:ctx.acento, peso:2,
    children:[{t:'txt', v:rotulo, deg:'p+', align:'CENTER'}]};
  if (tom === 'fraco') return {t:'row', nome:'botao ' + rotulo, h:44, r:10, just:'CENTER',
    align:'CENTER', fill:'Light +1',
    children:[{t:'txt', v:rotulo, deg:'small+', align:'CENTER'}]};
  return {t:'row', nome:'botao ' + rotulo, h:56, r:12, just:'CENTER', align:'CENTER',
    fill:ctx.acento, children:[{t:'txt', v:rotulo, deg:'p+', cor:ctx.tintaBotao, align:'CENTER'}]};
};

const campo = (rotulo, valor, preenchido) => ({t:'col', gap:6, children:[
  rotulo ? {t:'txt', v:rotulo, deg:'small+'} : null,
  {t:'row', h:56, r:12, pad:[0,16,0,16], align:'CENTER', fill:'Branco',
   stroke: preenchido ? ctx.acento : 'Light -1', peso: preenchido ? 2 : 1,
   children:[{t:'txt', v:valor, deg:'p', cor: preenchido ? 'Dark' : 'Dark +1'}]}
]});

const cartao = (children, tom) => ({t:'col', gap:8, pad:16, r:14, fill:'Branco',
  stroke: tom === 'destaque' ? ctx.acento : 'Light -1', peso: tom === 'destaque' ? 2 : 1,
  children: children});

/* A tinta do selo de destaque acompanha o fundo, não é fixa em Dark. No
   contexto neutro o acento é a própria Dark, e Dark sobre Dark some. */
const selo = (texto, tom) => ({t:'row', hug_h:true, pad:[4,10,4,10], r:20,
  fill: tom === 'aviso' ? 'Danger +1' : (tom === 'destaque' ? ctx.acento : 'Light +1'),
  children:[{t:'txt', v:texto, deg:'mini+', hug:true,
             cor: tom === 'destaque' ? ctx.tintaBotao : 'Dark'}]});

const cab = (nome, marcador) => ({t:'row', gap:8, align:'CENTER', just:'SPACE_BETWEEN', children:[
  {t:'txt', v:nome, deg:'p+'}, marcador
]});

const chips = (itens, ativo) => ({t:'row', gap:8, corta:true, children:
  itens.map(i => ({t:'row', hug_h:true, pad:[8,12,8,12], r:20,
    fill: i === ativo ? ctx.acento : 'Branco', stroke: i === ativo ? null : 'Light -1', peso:1,
    children:[{t:'txt', v:i, deg:'small', hug:true,
               cor: i === ativo ? ctx.tintaBotao : 'Dark'}]}))});

const abas = (itens, ativa) => ({t:'row', nome:'abas', pad:[10,12,14,12], gap:4,
  stroke:ctx.linha, peso:1, lado:'cima', children: itens.map(i => ({t:'col', gap:4, align:'CENTER', h:48,
    just:'CENTER', children:[
      {t:'box', w:20, h:20, r:6, fill: i === ativa ? ctx.acento : 'Light'},
      {t:'txt', v:i, deg:'mini', align:'CENTER', op: i === ativa ? 1 : 0.6}
    ]}))});

/* linhas cinzas que representam texto corrido ainda não escrito */
const barras = (n) => ({t:'col', gap:6, children: Array.from({length:n}, (_, k) =>
  (k === n - 1) ? {t:'box', w:180, h:8, r:4, fill:'Light'}
                : {t:'box', h:8, r:4, fill:'Light', fill_h:true})});

const alerta = (texto) => ({t:'row', pad:12, r:10, fill:'Danger +1', stroke:'Danger -1', peso:1,
  children:[{t:'txt', v:texto, deg:'small'}]});

/* -- moldura da tela ------------------------------------------------------- */

/* Uma tela é sempre: status, topo opcional, corpo que cresce, abas opcionais.
   O corpo é quem estica, então nada depende de altura fixa somada à mão. */
async function telaFrame(numero, nome, contexto, x, y) {
  ctx = CTX[contexto];
  const f = figma.createAutoLayout('VERTICAL');
  f.name = String(numero).padStart(2, '0') + ' · ' + nome + ' · ' + contexto;
  f.resize(W, H);
  f.clipsContent = true;
  await aplicarFill(f, 'Branco');
  figma.currentPage.appendChild(f);
  f.x = x; f.y = y;
  return f;
}

/* `partes` é uma função, não um array: ela precisa ser avaliada DEPOIS de
   telaFrame() trocar o `ctx`, senão botão e topo saem com a cor da tela
   anterior. Foi o erro mais fácil de cometer aqui. */
async function montarTela(numero, nome, contexto, x, y, partes) {
  const f = await telaFrame(numero, nome, contexto, x, y);
  for (const p of partes()) { if (p) await build(p, f); }
  return f;
}

/* corpo da tela: é o que ocupa o espaço entre o topo e as abas */
const corpo = (children, opts) => {
  const o = opts || {};
  const spec = {t:'col', nome:'corpo', pad:[20,20,20,20], gap: o.gap != null ? o.gap : 14,
    cresce:true, corta:true, children: children};
  if (o.just) spec.just = o.just;
  return spec;
};

/* espaçador que empurra o que vem depois para o rodapé do corpo */
const empurra = () => ({t:'col', cresce:true, children:[]});

/* onde plantar as telas na página, sem cair em cima do que já existe */
function origemLivre() {
  let maxX = 0;
  for (const n of figma.currentPage.children) {
    const d = n.x + n.width;
    if (d > maxX) maxX = d;
  }
  return {x: maxX + 160, y: 0};
}
const PASSO_X = W + 60;
