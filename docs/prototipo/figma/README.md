# Scripts de montagem das 14 telas no Figma

**As telas já estão montadas no arquivo do Figma** — ver "Situação" no fim deste documento
antes de rodar qualquer coisa, porque rodar de novo duplica as telas em vez de atualizá-las.

Escritos em **27/08/2026**, quando o `whoami` confirmou plano **Starter** e a cota estava
esgotada — nem escrita nem leitura passavam. A cota renovou no mesmo dia e as cinco chamadas
foram disparadas. O contexto completo está em [`CONTEXTO.md`](../../../CONTEXTO.md), seção 6.1.

---

## Por que os scripts existem

No Starter a cota do MCP é o recurso escasso, e uma chamada que falha é uma chamada
perdida: o `use_figma` é atômico, ou o script inteiro entra ou nada entra. Escrever as
telas ao vivo, uma por vez, esbarraria no teto antes da metade.

Então o trabalho foi invertido. Tudo o que não consome cota — decidir a estrutura,
escrever o código, testar — foi feito antes. A cota só é gasta no disparo.

Três decisões saem daí, e todas as três aparecem no código:

1. **Nada depende de ID de nó.** Estilos, fontes e a logo são procurados **por nome**,
   em tempo de execução. Não deu para ler o arquivo antes de escrever nele.
2. **Toda cor tem fallback declarado.** Se um estilo não for encontrado, entra o hex da
   seção 2.2 do CONTEXTO **e o aviso sobe no retorno**. A tela nunca sai silenciosamente
   com hex solto, que é justamente o que a seção 4.4 diz que não pode existir.
3. **Existe um simulador.** `verificar.js` roda os cinco scripts contra uma Plugin API
   falsa, em Node. Erro de digitação custa zero em vez de custar uma chamada.

---

## Como disparar

Cada chamada é o conteúdo de **um** arquivo, colado no parâmetro `code` do `use_figma`.
O `fileKey` é `lpg2qDhPuOmKfvLAPFOVKA`.

```bash
node docs/prototipo/figma/verificar.js
```

Rode isso primeiro. Se reprovar, **não gaste cota.**

Depois, monte o código de cada chamada. O `00` vai sozinho; os outros quatro precisam do
prelúdio na frente:

```bash
cat docs/prototipo/figma/_preludio.js docs/prototipo/figma/01-telas-1a4.js
```

| Ordem | Arquivo | Prelúdio? | O que faz |
|---|---|---|---|
| 1 | `00-diagnostico-e-quicksand.js` | **não** | Corrige a pendência 1 e devolve o inventário do arquivo |
| 2 | `01-telas-1a4.js` | sim | Entrada, Entrada com erro, Consentimento, Onboarding, Código de convite |
| 3 | `02-telas-5a8.js` | sim | Catálogo, Perfil e vínculo, Início do paciente, **Novo relato** |
| 4 | `03-telas-9a11.js` | sim | Tarefas, Conversa, Agenda |
| 5 | `04-telas-12a14.js` | sim | Cadastro com CRP, Lista de pacientes, Prontuário |

**Pare depois da chamada 1 e leia o retorno.** Ele traz `naoResolvidos`: a lista de nomes
de estilo que o prelúdio procurou e não achou. Se ela vier vazia, siga. Se vier com algo,
corrija o nome no `FALLBACK`/`acharEstilo` do prelúdio antes de continuar — senão as telas
saem com hex solto.

**Se a cota permitir só uma chamada de tela, dispare a 3.** É a que contém a tela 8.

---

## O que cada script decide, e por quê

### Contexto de cor

A seção 2.3 do CONTEXTO diz: verde no paciente, rosa no psicólogo, neutro antes do login.
O prelúdio traduz isso em três perfis, e `montarTela()` troca o perfil ativo antes de
montar cada tela.

| Contexto | Telas | Acento | Tinta sobre o acento |
|---|---|---|---|
| neutro | 1, 1b, 2, 3 | `Dark` | `Light +1` |
| paciente | 4 a 11 | `Secundário` | `Dark` |
| psicólogo | 12 a 14 | `Primário` | `Dark` |

**O botão primário do contexto neutro é Dark com texto claro**, e essa é a única
combinação com texto claro em todo o conjunto. A seção 3 mediu: sobre Dark o branco dá
17,01:1; sobre qualquer outra cor da paleta ele reprova. Nas telas de paciente e de
psicólogo, texto sobre cor é sempre Dark.

Isso resolve um problema que não tinha solução óbvia: as telas neutras não podem ser
verdes nem rosas, mas também precisam de um botão primário que se leia como primário.

### Tipografia aplicada como fonte, não como estilo

Os 15 estilos de texto do arquivo se chamam `* Quicksand`, incluindo `Parágrafo Quicksand`
e `Small Quicksand`, que são degraus de corpo. Aplicar esses estilos daria Quicksand no
corpo e contrariaria a decisão da seção 2.1. É a **pendência 4** da seção 7.

Enquanto ela não for resolvida, o prelúdio aplica família e tamanho direto, seguindo a
tabela da seção 2.1. Quando os estilos forem renomeados, dá para trocar o mapa `TIPO` por
`setTextStyleIdAsync` sem mexer em nenhuma tela.

### Branco é literal, e está certo

A paleta não tem estilo de branco, e a regra 1 da seção 2.3 pede fundo majoritariamente
branco. Então `Branco` é o único valor de cor escrito à mão no prelúdio. Não é exceção à
regra de amarrar tudo a estilos — é a ausência de um estilo que a paleta nunca teve.

---

## O que estes scripts resolvem das pendências da seção 7

| # | Pendência | Situação |
|---|---|---|
| 1 | `Contrastes Quicksand` com corpo em Poppins | resolvida pela chamada 1 |
| 4 | Estilos de texto chamados "* Quicksand" | **contornada**, não resolvida. Continua a decidir |
| 5 | Danger e Primário vizinhos demais | **fica visível** nas telas 13 e 14, que é onde o problema mora. Olhe e decida |
| 6 | Estado de erro do login não desenhado | resolvida pela tela 1b, com a mensagem genérica do CA-02.2 |
| 7 | Sem neutro aprovado para placeholder | contornada com `Dark +1`, que mede 6,3:1. Continua a decidir |

A tela **1b não aumenta o inventário**: é um estado da tela 1, não uma tela nova. A DP-04
continua congelada em 14.

---

## Numeração, atenção

O inventário congelado (seção 1.6 do [cronograma](../../planejamento/cronograma.md)) tem
**14 telas**. O [`wireframes.html`](../wireframes.html) tem **16**, porque inclui "Meus
relatos" e "Resumo da semana", que apareceram ao desenhar o fluxo e ficaram fora da DP-04.

Da tela 9 em diante os dois documentos divergem no número. **Ao comparar, use o nome da
tela, não o número.**

| Inventário | `wireframes.html` |
|---|---|
| 1 a 8 | 1 a 8 (iguais) |
| 9 Tarefas | 10 |
| 10 Conversa | 11 |
| 11 Agenda | 12 |
| 12 Cadastro com CRP | 13 |
| 13 Lista de pacientes | 14 |
| 14 Prontuário | 15 |
| — | 9 Meus relatos, 16 Resumo da semana (fora do inventário) |

---

## O que o simulador não garante

`verificar.js` pega erro de digitação, helper inexistente, `undefined` em parâmetro e
violação das regras de sizing do auto-layout — a família de erro mais comum da API.

Ele **não** sabe dizer se o texto estourou a caixa, se dois elementos se sobrepõem ou se a
tela ficou legível. Passar nele significa que a chamada não morre por bobagem, não que o
desenho está certo.

Por isso, **depois de cada chamada, tire um screenshot** dos frames criados e confira. Na
tela 8, confira as três coisas que o RNF-37 cobra: seletor acima do campo, visível sem
rolagem, e já marcado em Compartilhado.

---

## Situação: as telas já foram montadas

Em **27/08/2026** a cota renovou e as 15 telas foram criadas no arquivo. Os IDs dos frames
estão na seção 6 do [`CONTEXTO.md`](../../../CONTEXTO.md).

**Estes scripts criam telas novas, não atualizam as existentes.** Rodar de novo duplica tudo.
Se precisar refazer uma tela, apague o frame dela antes. O valor deles agora é servir de
reconstrução do zero e de registro de como as telas foram feitas.

Resultado real das cinco chamadas: **zero avisos, zero fallback de cor, zero texto colapsado.**
Todos os 18 nomes de estilo resolveram, e as três fontes carregadas foram exatamente
`Quicksand SemiBold`, `Poppins Regular` e `Poppins Medium`.

## O erro que custou uma chamada

A primeira montagem saiu com todo texto em largura 0 e altura absurda — um caractere por linha.
A causa não era lógica, era ordem:

> `textAutoResize = 'HEIGHT'` **trava a largura no valor que o nó tiver naquele instante**, e um
> nó recém-criado tem largura **zero**. Travar antes de escrever faz o texto quebrar a cada
> letra, e o `layoutSizingHorizontal = 'FILL'` aplicado depois **não refaz o fluxo**.

Ordem correta, que é a que está no `_preludio.js`:

```js
node.characters = spec.v;        // com WIDTH_AND_HEIGHT o nó ganha a largura do conteúdo
parent.appendChild(node);        // agora existe um pai com largura resolvida
node.layoutSizingHorizontal = 'FILL';
node.textAutoResize = 'HEIGHT';  // só agora trava, e trava na largura certa
```

Três defesas ficaram no código por causa disso, e nenhuma delas é decorativa:

1. **Rede de segurança no construtor.** Se um texto ainda sair com largura menor que 2, ele cai
   para largura fixa medida no pai e registra o aviso no retorno.
2. **Autoconferência em cada chamada.** Toda chamada de tela varre os próprios textos e devolve
   `colapsados`. Não depende de alguém lembrar de olhar.
3. **O simulador foi corrigido para reproduzir a armadilha**, e testado nos dois sentidos: com o
   código antigo acusa 12 textos colapsados, com o corrigido passa. Um simulador que não reprova
   o bug que já aconteceu não protege de nada — protege da sensação de estar protegido.

## O segundo defeito: contorno virando caixa

A barra de topo e a de abas saíram com contorno nos quatro lados, virando caixa flutuante em
vez de divisória. O prelúdio agora aceita `lado: 'baixo'` e `lado: 'cima'` no spec, que zera
três dos quatro pesos de contorno.

Esse o simulador não pegaria nunca — é julgamento visual, e por isso o screenshot depois de cada
chamada continua obrigatório.

---

## Atualização de 27/08 — cadastro, gradiente e protótipo

Três coisas entraram depois da primeira montagem.

### 1. O ramo do cadastro (`05-telas-cadastro.js`)

`01c · Escolha de perfil`, `01d · Cadastro · paciente` e `01e · Cadastro · psicologo`.

**Não aumentam o inventário.** O item 1 do inventário congelado sempre disse "Entrada: login
**e cadastro com escolha de perfil**". O cadastro estava lá desde o começo, só não tinha sido
desenhado.

`01d` e `01e` são duas telas com layout idêntico porque **um frame tem um destino só**, e o
protótipo precisa mostrar que paciente vai para o consentimento e psicólogo vai para o registro
no CRP. Na implementação é uma tela, com o roteamento decidido pelo perfil em memória.

### 2. O gradiente verde-rosa

As telas anteriores ao login eram preto e branco. Agora usam o estilo `Gradiente Verde-Rosa`,
gerado por `garantirGradiente()` a partir das cores de `Secundário` e `Primário`.

**A regra 5 da seção 2.3 continua valendo, não foi quebrada.** Ela proíbe revelar um lado antes
do login. Um degradê que funde as duas cores não escolhe — mostra as duas.

**Texto sobre o degradê é sempre `Dark`.** Branco reprova nos dois extremos: 2,34:1 no rosa,
1,40:1 no verde.

Este é o único lugar do arquivo onde a cor é **copiada** da paleta em vez de ligada a ela — um
paint não aponta para dois estilos ao mesmo tempo. Se `Secundário` ou `Primário` mudarem, rode
`garantirGradiente()` de novo.

### 3. As interações (`06-interacoes.js`)

41 ligações e dois pontos de partida. **É o único script da pasta que depende de IDs de nó**;
todos os outros resolvem tudo por nome. Se as telas forem reconstruídas do zero, os IDs mudam e
a tabela `ligacoes` precisa ser refeita.

Por isso ele fica fora do `verificar.js`: contra a API simulada todo ID daria "frame nao
existe". A proteção dele é outra — ele **nunca lança erro por link quebrado**. Cada falha entra
na lista `falhas` do retorno. Um seletor errado não derruba os outros 40 links junto.

### Ordem completa das chamadas, atualizada

| Ordem | Arquivo | Prelúdio? |
|---|---|---|
| 1 | `00-diagnostico-e-quicksand.js` | não |
| 2 | `01-telas-1a4.js` | sim |
| 3 | `02-telas-5a8.js` | sim |
| 4 | `03-telas-9a11.js` | sim |
| 5 | `04-telas-12a14.js` | sim |
| 6 | `05-telas-cadastro.js` | sim |
| 7 | `06-interacoes.js` | **não** — e por último, sempre |
