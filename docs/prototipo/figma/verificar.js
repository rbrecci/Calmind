/* =============================================================================
   Simulador da Plugin API do Figma, para rodar os scripts ANTES de gastar cota.

       node docs/prototipo/figma/verificar.js

   Por que isto existe: no plano Starter cada chamada do MCP é escassa, e uma
   chamada que falha é uma chamada perdida — o script é atômico, ou tudo entra
   ou nada entra. Um `cartao` escrito errado custaria o mesmo que uma tela
   inteira. Aqui o erro sai de graça.

   O que ele pega: nome de helper errado, propriedade inexistente, `undefined`
   passando por parâmetro, e — o mais útil — violação das regras de sizing do
   auto-layout, que é a família de erro mais comum da API.

   O que ele NÃO pega: se a tela ficou bonita, se o texto estourou a caixa, se
   dois elementos se sobrepõem. Isso só o screenshot depois de rodar de verdade
   responde. Passar aqui não é garantia de acerto, é garantia de que a chamada
   não morre por bobagem.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const ler = (f) => fs.readFileSync(path.join(AQUI, f), 'utf8');

/* -- o falso Figma -------------------------------------------------------- */

let seq = 0;
const problemas = [];

const AUTO = ['FRAME', 'COMPONENT'];

function noBase(tipo) {
  const n = {
    id: (++seq) + ':' + seq,
    type: tipo,
    name: '',
    x: 0, y: 0, width: 100, height: 100,
    children: [],
    parent: null,
    layoutMode: 'NONE',
    fills: [], strokes: [],
    _fillStyle: null, _strokeStyle: null,
    strokeWeight: 1, strokeAlign: 'INSIDE',
    cornerRadius: 0, clipsContent: false, opacity: 1,
    itemSpacing: 0,
    paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
    counterAxisAlignItems: 'MIN', primaryAxisAlignItems: 'MIN',
    primaryAxisSizingMode: 'AUTO', counterAxisSizingMode: 'AUTO',

    resize(w, h) {
      if (typeof w !== 'number' || typeof h !== 'number' || isNaN(w) || isNaN(h))
        problemas.push('resize com valor inválido em "' + n.name + '": ' + w + ',' + h);
      n.width = w; n.height = h;
    },
    appendChild(c) {
      if (!c) { problemas.push('appendChild(undefined) em "' + n.name + '"'); return; }
      if (c.parent) c.parent.children = c.parent.children.filter(x => x !== c);
      c.parent = n; n.children.push(c);
    },
    clone() {
      const c = noBase(n.type);
      c.name = n.name + ' (cópia)'; c.width = n.width; c.height = n.height;
      return c;
    },
    rescale(f) {
      if (!(f > 0)) problemas.push('rescale com fator inválido em "' + n.name + '": ' + f);
      n.width *= f; n.height *= f;
    },
    async setFillStyleIdAsync(id) { n._fillStyle = id; },
    async setStrokeStyleIdAsync(id) { n._strokeStyle = id; },
    findAll(fn) {
      const saida = [];
      (function anda(no) { for (const c of no.children) { if (fn(c)) saida.push(c); anda(c); } })(n);
      return saida;
    },
    findOne(fn) { return n.findAll(fn)[0] || null; },
    findAllWithCriteria(cri) { return n.findAll(c => cri.types.indexOf(c.type) >= 0); },
    async screenshot() { return null; }
  };

  /* As regras de valor de layoutSizing são a fonte número um de erro da API.
     Reproduzimos a validação para que o erro apareça aqui, e não lá. */
  let sh = 'FIXED', sv = 'FIXED';
  Object.defineProperty(n, 'layoutSizingHorizontal', {
    get: () => sh,
    set: (v) => {
      const paiAuto = n.parent && n.parent.layoutMode && n.parent.layoutMode !== 'NONE';
      const euAuto = n.layoutMode && n.layoutMode !== 'NONE';
      if (v === 'FILL' && !paiAuto)
        problemas.push('FILL em "' + n.name + '" (' + n.type + ') cujo pai não é auto-layout');
      if (v === 'HUG' && !euAuto && n.type !== 'TEXT')
        problemas.push('HUG em "' + n.name + '" (' + n.type + ') que não é auto-layout nem TEXT');
      if (v === 'FILL' && paiAuto) {
        const p = n.parent;
        const interna = p.layoutMode === 'HORIZONTAL'
          ? Math.max(20, p.width - p.paddingLeft - p.paddingRight - p.itemSpacing * Math.max(0, p.children.length - 1))
          : Math.max(20, p.width - p.paddingLeft - p.paddingRight);
        if (n.type === 'TEXT') n._aplicarFill(interna);
        else n.width = interna;
      }
      sh = v;
    }
  });
  Object.defineProperty(n, 'layoutSizingVertical', {
    get: () => sv,
    set: (v) => {
      const paiAuto = n.parent && n.parent.layoutMode && n.parent.layoutMode !== 'NONE';
      if (v === 'FILL' && !paiAuto)
        problemas.push('FILL vertical em "' + n.name + '" cujo pai não é auto-layout');
      if (v === 'AUTO')
        problemas.push('layoutSizingVertical="AUTO" em "' + n.name + '" — o enum certo é HUG');
      sv = v;
    }
  });
  return n;
}

/* O nó de texto é o mais traiçoeiro da API, e a simulação precisa reproduzir a
   armadilha em vez de contorná-la:

   - um nó recém-criado tem largura ZERO;
   - `textAutoResize = 'HEIGHT'` TRAVA a largura no valor daquele instante;
   - com a largura travada em zero, escrever quebra a cada caractere;
   - e `layoutSizingHorizontal = 'FILL'` depois disso NÃO refaz o fluxo.

   Foi exatamente essa sequência que colapsou as cinco primeiras telas. Se o
   simulador não reproduz isso, ele aprova o que o Figma reprova. */
function noTexto() {
  const n = noBase('TEXT');
  n.width = 0; n.height = 0;
  let chars = '', fonte = { family: 'Inter', style: 'Regular' }, modo = 'WIDTH_AND_HEIGHT';

  const refluir = () => {
    const larguraDoTexto = chars.length * 7;
    if (modo === 'WIDTH_AND_HEIGHT') {
      n.width = larguraDoTexto;
      n.height = chars.length ? 20 : 0;
    } else {                                  // HEIGHT: largura travada, altura acompanha
      const util = Math.max(n.width, 0.0001);
      n.height = 20 * Math.max(1, Math.ceil(larguraDoTexto / util));
    }
  };

  Object.defineProperty(n, 'fontName', {
    get: () => fonte,
    set: (v) => {
      if (!v || !v.family || !v.style) { problemas.push('fontName inválido em texto: ' + JSON.stringify(v)); return; }
      if (!FONTES_CARREGADAS.has(v.family + '|' + v.style))
        problemas.push('fonte não carregada antes do uso: ' + v.family + ' ' + v.style);
      fonte = v;
    }
  });
  Object.defineProperty(n, 'characters', {
    get: () => chars,
    set: (v) => {
      if (typeof v !== 'string') { problemas.push('characters não é string em "' + n.name + '": ' + v); return; }
      if (!FONTES_CARREGADAS.has(fonte.family + '|' + fonte.style))
        problemas.push('escrita com fonte não carregada: ' + fonte.family + ' ' + fonte.style);
      chars = v;
      refluir();
    }
  });
  Object.defineProperty(n, 'textAutoResize', {
    get: () => modo,
    set: (v) => { modo = v; refluir(); }
  });

  /* FILL num TEXT só resolve a largura se o modo ainda for WIDTH_AND_HEIGHT.
     Se a largura já foi travada em zero, o FILL é aceito e a largura continua
     zero — que é o bug real, e o que o teste precisa enxergar. */
  n._aplicarFill = (larguraDisponivel) => {
    if (modo === 'WIDTH_AND_HEIGHT') { n.width = larguraDisponivel; modo = 'HEIGHT'; refluir(); }
  };

  n.fontSize = 16;
  n.lineHeight = { unit: 'AUTO' };
  n.textAlignHorizontal = 'LEFT';
  n.getStyledTextSegments = () => [{ fontName: fonte, characters: chars }];
  return n;
}

const FONTES_CARREGADAS = new Set(['Inter|Regular']);

/* Um arquivo plausível: os 18 estilos da seção 2.2 e as fontes da seção 2.1. */
const ESTILOS = ['Primário', 'Secundário', 'Light', 'Dark', 'Danger', 'Success']
  .flatMap(f => [f + ' -1', f, f + ' +1'])
  .map((nome, i) => ({
    id: 'S:' + i, name: nome,
    /* `garantirGradiente` lê a cor de Secundário e Primário para montar as
       paradas do degradê, então os estilos simulados precisam ter paints. */
    paints: [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }]
  }));

const DISPONIVEIS = []
  .concat(['Light', 'Regular', 'Medium', 'SemiBold', 'Bold'].map(s => ({ fontName: { family: 'Quicksand', style: s } })))
  .concat(['Regular', 'Medium', 'SemiBold', 'Bold'].map(s => ({ fontName: { family: 'Poppins', style: s } })))
  .concat([{ fontName: { family: 'Inter', style: 'Regular' } }]);

function novaPagina() {
  const p = noBase('PAGE');
  p.name = 'Page 1';
  p.layoutMode = 'NONE';
  /* dois frames que já existem no arquivo, para origemLivre() ter o que evitar */
  const login = noBase('FRAME'); login.name = 'Login Page'; login.width = 393; login.height = 852;
  const logo = noBase('FRAME'); logo.name = 'Black Logo'; logo.width = 200; logo.height = 80;
  const logos = noBase('FRAME'); logos.name = 'Logos'; logos.x = 500; logos.width = 402; logos.height = 547;
  p.appendChild(login); p.appendChild(logos); logos.appendChild(logo);
  return p;
}

function novoFigma() {
  const pagina = novaPagina();
  return {
    mixed: Symbol('mixed'),
    currentPage: pagina,
    root: { children: [pagina] },
    createFrame: () => noBase('FRAME'),
    createText: () => noTexto(),
    createAutoLayout: (dir, props) => {
      const f = noBase('FRAME');
      f.layoutMode = (typeof dir === 'string' ? dir : 'HORIZONTAL');
      Object.assign(f, (typeof dir === 'object' ? dir : props) || {});
      return f;
    },
    async loadFontAsync(f) { FONTES_CARREGADAS.add(f.family + '|' + f.style); },
    async listAvailableFontsAsync() { return DISPONIVEIS; },
    async getLocalPaintStylesAsync() { return ESTILOS; },
    createPaintStyle() {
      const st = { id: 'S:novo' + (++seq), name: '', description: '', paints: [] };
      ESTILOS.push(st);
      return st;
    },
    async getLocalTextStylesAsync() {
      return ['H1', 'H2', 'H3', 'H4', 'H5', 'Parágrafo', 'Small']
        .map(n => ({ name: n + ' Quicksand', fontName: { family: 'Quicksand', style: 'SemiBold' }, fontSize: 16 }));
    },
    async getNodeByIdAsync(id) {
      if (id === '44:2') {
        const s = noBase('FRAME'); s.name = 'Contrastes Quicksand';
        const t = noTexto(); t.name = 'Parágrafo - 16px';
        FONTES_CARREGADAS.add('Poppins|Regular');
        t.fontName = { family: 'Poppins', style: 'Regular' };
        s.appendChild(t);
        return s;
      }
      return null;
    },
    async setCurrentPageAsync() {},
    notify() { throw new Error('figma.notify() não é implementado'); }
  };
}

/* -- roda cada chamada ---------------------------------------------------- */

const preludio = ler('_preludio.js');
const CHAMADAS = [
  ['00-diagnostico-e-quicksand.js', false],
  ['01-telas-1a4.js', true],
  ['02-telas-5a8.js', true],
  ['03-telas-9a11.js', true],
  ['04-telas-12a14.js', true],
  ['05-telas-cadastro.js', true]
  /* 06-interacoes.js fica DE FORA de proposito: ele depende de IDs de no do
     arquivo vivo, e contra a API simulada todo ID daria "frame nao existe".
     A protecao dele e outra — ele nunca lanca erro por link quebrado, devolve
     a lista `falhas` no retorno. */
];

(async () => {
  let falhou = false;

  for (const [arquivo, precisaPreludio] of CHAMADAS) {
    problemas.length = 0;
    FONTES_CARREGADAS.clear(); FONTES_CARREGADAS.add('Inter|Regular');
    seq = 0;

    const codigo = (precisaPreludio ? preludio + '\n' : '') + ler(arquivo);
    const tamanho = codigo.length;
    const figma = novoFigma();

    let saida = null, erro = null;
    try {
      const fn = new Function('figma', '"use strict"; return (async () => {\n' + codigo + '\n})();');
      saida = await fn(figma);
    } catch (e) {
      erro = e;
    }

    const limite = tamanho > 50000 ? '  ESTOUROU o limite de 50000 caracteres do use_figma!' : '';
    console.log('\n=== ' + arquivo + '  (' + tamanho + ' caracteres)' + limite);
    if (tamanho > 50000) falhou = true;

    if (erro) {
      falhou = true;
      console.log('  FALHOU: ' + erro.message);
      console.log('  ' + String(erro.stack).split('\n').slice(1, 4).join('\n  '));
      continue;
    }
    if (problemas.length) {
      falhou = true;
      console.log('  ' + problemas.length + ' violação(ões) de regra da API:');
      for (const p of [...new Set(problemas)]) console.log('    - ' + p);
    }

    const criados = (saida && saida.createdNodeIds) || [];
    if (saida && saida.telas) for (const t of saida.telas) console.log('  ok  ' + t);
    if (saida && saida.avisos && saida.avisos.length) {
      console.log('  avisos do próprio script:');
      for (const a of [...new Set(saida.avisos)]) console.log('    ! ' + a);
    }
    if (saida && saida.pendencia1) {
      console.log('  pendência 1, corrigidos: ' + JSON.stringify(saida.pendencia1.corrigidos));
      console.log('  nomes não resolvidos: ' + JSON.stringify(saida.naoResolvidos));
    }

    /* conferência estrutural das telas montadas */
    for (const id of criados) {
      const tela = figma.currentPage.children.find(c => c.id === id);
      if (!tela) continue;
      const n = tela.findAll(() => true).length;
      if (n < 8) { falhou = true; console.log('  tela "' + tela.name + '" tem só ' + n + ' nós — algo não montou'); }
      if (tela.width !== 393 || tela.height !== 852) {
        falhou = true;
        console.log('  tela "' + tela.name + '" está ' + tela.width + 'x' + tela.height + ', não 393x852');
      }
      const semTexto = tela.findAll(c => c.type === 'TEXT' && !c.characters).length;
      if (semTexto) { falhou = true; console.log('  tela "' + tela.name + '" tem ' + semTexto + ' texto(s) vazio(s)'); }

      /* A conferência que faltava: texto com largura ~0 é o fio vertical. */
      const colapsados = tela.findAll(c => c.type === 'TEXT' && c.width < 2);
      if (colapsados.length) {
        falhou = true;
        console.log('  tela "' + tela.name + '" tem ' + colapsados.length + ' texto(s) COLAPSADO(s) em largura 0:');
        for (const c of colapsados.slice(0, 4)) console.log('      "' + c.characters.slice(0, 40) + '"');
      }
      const altosDemais = tela.findAll(c => c.type === 'TEXT' && c.height > 400);
      if (altosDemais.length) {
        falhou = true;
        console.log('  tela "' + tela.name + '" tem ' + altosDemais.length + ' texto(s) com altura absurda — sinal de quebra por caractere');
      }
    }
  }

  console.log('\n' + (falhou ? 'REPROVOU — corrija antes de gastar cota.'
                             : 'Passou. Os ' + CHAMADAS.length + ' scripts rodam sem erro contra a API simulada.'));
  process.exit(falhou ? 1 : 0);
})();
