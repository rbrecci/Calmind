/* =============================================================================
   CHAMADA 1 de 5 — diagnóstico do arquivo + pendência 1 do CONTEXTO.

   Este script é AUTÔNOMO: NÃO leve o _preludio.js junto.

   Faz duas coisas de uma vez, porque cada chamada é cara:

   a) Termina a seção `Contrastes Quicksand` (nó 44:2). Os degraus H1 a H5 já
      estão em Quicksand; Parágrafo e Small continuam em Poppins e por isso as
      duas seções de contraste são hoje idênticas no corpo e não servem para
      comparar as fontes. É a pendência 1 da seção 7.

   b) Devolve o inventário de que os scripts 01 a 04 dependem: os nomes exatos
      dos estilos de cor, os nomes exatos dos estilos de texto, as variações de
      Quicksand e Poppins instaladas, e os frames que já existem na página.

   Sem (b) não dá para conferir se `acharEstilo()` do prelúdio vai encontrar o
   que procura. Leia o retorno ANTES de disparar o 01.
   ============================================================================= */

const norm = (s) => String(s).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

const relato = { corrigidos: [], mutatedNodeIds: [], avisos: [] };

/* -- (a) Contrastes Quicksand -------------------------------------------- */

const secao = await figma.getNodeByIdAsync('44:2');
if (!secao) {
  relato.avisos.push('nó 44:2 (Contrastes Quicksand) não encontrado — pendência 1 não foi tocada');
} else {
  const textos = secao.findAllWithCriteria({ types: ['TEXT'] });

  /* Alvo: os degraus de corpo. Batemos pelo nome do nó, que na seção declara o
     degrau ("Parágrafo - 16px", "Small - 14px"), e só mexemos no que ainda
     estiver em Poppins — rodar duas vezes não estraga nada. */
  const alvos = textos.filter(t => {
    const n = norm(t.name);
    if (!(n.indexOf('paragrafo') >= 0 || n.indexOf('small') >= 0)) return false;
    return t.getStyledTextSegments(['fontName'])
            .some(s => s.fontName.family !== 'Quicksand');
  });

  for (const t of alvos) {
    for (const s of t.getStyledTextSegments(['fontName'])) {
      await figma.loadFontAsync(s.fontName);       // regra canônica: carregar a fonte ATUAL
    }
  }
  await figma.loadFontAsync({ family: 'Quicksand', style: 'Regular' });

  for (const t of alvos) {
    t.fontName = { family: 'Quicksand', style: 'Regular' };
    relato.corrigidos.push(t.name);
    relato.mutatedNodeIds.push(t.id);
  }
  if (alvos.length === 0) relato.avisos.push('nenhum texto de corpo em Poppins dentro de 44:2 — talvez já esteja corrigido');
}

/* -- (b) inventário ------------------------------------------------------- */

const paints = await figma.getLocalPaintStylesAsync();
const textos = await figma.getLocalTextStylesAsync();

/* Confere se os 18 nomes que o prelúdio procura realmente resolvem. Se algum
   sair como false, o script 01 vai cair no FALLBACK hex e sujar as telas. */
const procurados = [];
for (const fam of ['Primário','Secundário','Light','Dark','Danger','Success']) {
  for (const suf of [' -1', '', ' +1']) procurados.push(fam + suf);
}
const resolucao = procurados.map(nome => {
  const alvo = norm(nome);
  const achado = paints.find(s => norm(s.name.split('/').pop()) === alvo)
              || paints.find(s => norm(s.name) === alvo)
              || paints.find(s => norm(s.name).endsWith(alvo));
  return { procurado: nome, achado: achado ? achado.name : null };
});

const fontes = (await figma.listAvailableFontsAsync())
  .filter(f => f.fontName.family === 'Quicksand' || f.fontName.family === 'Poppins')
  .map(f => f.fontName.family + ' ' + f.fontName.style);

const naPagina = figma.currentPage.children.map(n =>
  ({ id: n.id, nome: n.name, tipo: n.type, x: Math.round(n.x), y: Math.round(n.y),
     w: Math.round(n.width), h: Math.round(n.height) }));

return {
  pendencia1: relato,
  estilosDeCor: paints.map(s => s.name),
  resolucaoDosNomes: resolucao,
  naoResolvidos: resolucao.filter(r => !r.achado).map(r => r.procurado),
  estilosDeTexto: textos.map(s => s.name + '  [' + s.fontName.family + ' ' + s.fontName.style + ' ' + s.fontSize + ']'),
  fontesInstaladas: fontes,
  logosNaPagina: figma.currentPage.findAll(n => norm(n.name).indexOf('logo') >= 0)
                   .map(n => n.name + ' (' + n.id + ')'),
  naPagina: naPagina,
  bordaDireita: naPagina.reduce((m, n) => Math.max(m, n.x + n.w), 0)
};
