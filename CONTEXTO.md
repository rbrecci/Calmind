# Contexto de trabalho — design system e wireframes

**Calmind** — Saúde Mental & Acolhimento
Registro da sessão de **27/08/2026 (quinta)**.

> Este arquivo existe para que qualquer pessoa do grupo, ou uma sessão futura de IA, retome o trabalho de design sem precisar reconstruir o raciocínio. Ele documenta o que foi feito, **por que** foi feito, e o que ficou pendente.
>
> Quando um item aqui for concluído ou mudar, atualize este arquivo. Documento de contexto desatualizado é pior que documento nenhum, porque ele mente com confiança.

---

## 1. Onde o trabalho vive

| Ferramenta | Endereço | Conta | Situação |
|---|---|---|---|
| **Figma** | `https://www.figma.com/design/lpg2qDhPuOmKfvLAPFOVKA/Calmind` | `rafael.b.souza12@aluno.senai.br` | Plano Starter, assento "View". Cota renovou e as 14 telas foram montadas — ver seção 6.1 |
| **Miro** | `https://miro.com/app/board/uXjVHxripSc=/` | `fbrecci@gmail.com` | Os 6 do grupo como editores |

**Atenção às duas contas.** O Figma está sob a conta do SENAI e o Miro sob a conta do Gmail. Não são a mesma pessoa do ponto de vista das ferramentas: um arquivo compartilhado com uma não aparece na outra.

**Sobre o assento "View" do Figma:** apesar de a conta reportar assento de leitura, a escrita via MCP funcionou normalmente. O que bloqueou foi outra coisa — ver a seção 8.

---

## 2. Decisões fechadas nesta sessão

### 2.1 Tipografia

**Quicksand nos títulos, Poppins no texto de corpo.**

| Degrau | Tamanho | Fonte |
|---|---|---|
| H1 | 40 px | Quicksand SemiBold |
| H2 | 34 px | Quicksand SemiBold |
| H3 | 28 px | Quicksand SemiBold |
| H4 | 24 px | Quicksand SemiBold |
| H5 | 18 px | Quicksand SemiBold |
| Parágrafo | 16 px | Poppins Regular |
| Small | 14 px | Poppins Regular |

Estilos disponíveis no arquivo: Quicksand em Light, Regular, Medium, SemiBold e Bold; Poppins na família completa. Atenção ao nome exato: é `SemiBold`, sem espaço.

### 2.2 Paleta

**A fonte de verdade são os estilos de cor do Figma, não a grade de swatches.** Isso foi decidido explicitamente depois que as duas divergiram: a grade tinha uma paleta azul-marinho e os estilos tinham outra. Valem os estilos.

A paleta foi de 8 para 18 estilos. As variantes `-1` e `+1` foram geradas misturando a base 30% em direção ao preto e ao branco.

| Família | -1 | Base | +1 |
|---|---|---|---|
| Primário | `#A858A9` | `#F07EF2` | `#DFB3F2` |
| Secundário | `#5BA958` | `#82F27E` | `#D6F2C2` |
| Light | `#989898` | `#D9D9D9` | `#E4E4E4` |
| Dark | `#141414` | `#1C1C1C` | `#606060` |
| Danger | `#B24040` | `#FF5C5C` | `#FF8D8D` |
| Success | `#5FA2B2` | `#88E7FF` | `#ACEEFF` |

Os nomes `Primário claro` e `Secundário Claro` foram renomeados para `Primário +1` e `Secundário +1`, para a convenção ficar uniforme nas seis famílias.

> **Por que não copiamos os degraus da grade antiga:** a grade usava soma fixa por canal, simétrica em torno da base. Funciona com cores escuras, mas as bases novas são claras — somar em `#88E7FF` estoura o valor máximo e o `+1` sairia idêntico ao base.

### 2.3 Regras de aplicação de cor nas telas

1. **Fundo majoritariamente branco.**
2. **Texto preferencialmente preto** (`Dark`).
3. **Primária e Secundária entram em botão, hover, sombra, contorno, linha e detalhe** — não em grandes áreas de fundo.
4. **A cor indica o contexto:** **verde no lado do paciente, rosa no lado do psicólogo.**
5. **Telas anteriores ao login não escolhem lado.** Entrada, cadastro, consentimento e onboarding acontecem antes de o sistema saber quem é a pessoa, então não podem ser verdes nem rosas. **Elas usam o `Gradiente Verde-Rosa`**, que funde as duas cores: não escolhe lado, mostra os dois. A interface assume uma cor sozinha no momento em que o perfil é conhecido.

> **Emenda de 27/08/2026.** A regra 5 dizia "são neutras", e as telas nasceram em preto e branco. A troca para o degradê preserva a intenção original — não revelar um lado — e resolve o que a versão preto e branco não resolvia: uma tela de entrada sem identidade nenhuma. O `Gradiente Verde-Rosa` é um **estilo** do arquivo, com as paradas lidas de `Secundário` e `Primário`.
>
> É o único lugar do arquivo onde a cor é **copiada** da paleta em vez de ligada a ela: um paint não pode apontar para dois estilos ao mesmo tempo. Se `Secundário` ou `Primário` mudarem, o gradiente precisa ser regerado à mão — a função `garantirGradiente()` do prelúdio faz isso.
>
> **A tinta sobre o degradê é sempre `Dark`.** Branco reprova nos dois extremos: 2,34:1 no rosa e 1,40:1 no verde. Dark passa nos dois, a 7,28:1 e 12,13:1.

### 2.4 Divisão das 14 telas por contexto

| Contexto | Telas |
|---|---|
| Neutro | 1 entrada · **1c escolha de perfil · 1d/1e cadastro** · 2 consentimento · 3 onboarding |
| Verde, paciente | 4 convite · 5 catálogo · 6 perfil e vínculo · 7 home · 8 relato · 9 tarefas · 10 chat · 11 agenda |
| Rosa, psicólogo | 12 cadastro CRP · 13 lista de pacientes · 14 prontuário |

> **Cuidado com a numeração.** O [`wireframes.html`](docs/prototipo/wireframes.html) tem 16
> telas, não 14: ele inclui "Meus relatos" e "Resumo da semana", que apareceram ao desenhar
> o fluxo e ficaram fora da DP-04. Da tela 9 em diante os números dos dois documentos
> divergem. **Ao comparar os dois, use o nome da tela, não o número.** A tabela de
> equivalência está no [README dos scripts](docs/prototipo/figma/README.md).

### 2.5 Logo

O arquivo tem um frame **Logos** com quatro variantes: `Gray Logo`, `Black Logo`, `Textured logo` e `Clean Logo`.

**A escolhida passou a ser a `Clean Logo`**, colorida. A `Black` era a escolha enquanto as telas de entrada eram preto e branco; quando o gradiente entrou, a versão colorida passou a ser a coerente. A troca foi feita à mão no arquivo, em 27/08.

> Os scripts procuram a logo **por nome**, aceitando `Clean Logo` e caindo para `Black Logo` se aquela não existir. Um nome fixo quebraria em silêncio numa próxima troca.

---

## 3. Achado de acessibilidade que manda no desenho

Contraste medido de cada cor base contra texto branco e texto Dark:

| Fundo | Texto branco | Texto Dark |
|---|---|---|
| Primário | **2,34:1** reprova | 7,28:1 aprova |
| Secundário | 1,40:1 reprova | 12,13:1 aprova |
| Light | 1,41:1 reprova | 12,07:1 aprova |
| Dark | 17,01:1 aprova | — |
| Danger | **3,03:1** reprova | 5,62:1 aprova |
| Success | 1,41:1 reprova | 12,12:1 aprova |

**Regra que sai daí: nesta paleta, texto sobre cor é sempre Dark, nunca branco.** O RNF-35 exige 4,5:1 para texto comum, e o branco só passa sobre a Dark.

Isso já corrigiu um erro real: o botão "Entrar" da tela de login estava com texto branco sobre o rosa, a 2,34:1 — menos da metade do mínimo.

---

## 4. O que foi feito no arquivo do Figma

### 4.1 Estrutura da página

Página única (`Page 1`) com três frames:

| Frame | ID | Tamanho | Conteúdo |
|---|---|---|---|
| Login Page | `7:3` | 393 × 852 | Tela de login montada |
| Tipografia | `7:280` | 2756 × 1481 | Escalas, Cores, Contrastes |
| Logos | `13:478` | 402 × 547 | Quatro variantes da marca |

### 4.2 Seção de Cores — reconstruída

- Os 18 swatches foram **amarrados aos estilos**. Antes, três estavam com cor de rascunho e nenhum estilo: o Primário base estava magenta `#EE04F2`, o Secundário base estava lilás `#B799BF`.
- Nomes e códigos hex passaram a ser lidos do próprio estilo. **Editar um estilo atualiza a grade sozinha.**
- Os códigos hex escolhem texto claro ou escuro conforme a luminância do swatch, para nenhum sumir no fundo.
- A grade foi alinhada a uma malha rígida: colunas em x 73 / 199 / 325, linhas a cada 145 px a partir de y 308. O código hex fica centralizado dentro do quadrado, o nome centralizado abaixo. Antes cada rótulo era posicionado à mão, com desalinhamento de até 27 px.
- Removida uma legenda duplicada sobreposta e corrigido um acento.

### 4.3 Seção de Contrastes — duplicada, uma por fonte

Eram três cartões demonstrando a escala sobre fundos diferentes, ainda com as cores da paleta antiga. Agora:

- Os três cartões são **Light**, **Primário** e **Dark**, amarrados aos estilos.
- O texto é **Dark** nos dois primeiros e **Light** no terceiro — a regra da seção 3, demonstrada em vez de escrita.
- Removidos **sete textos duplicados** empilhados exatamente sobre o cartão do meio.
- Os tamanhos foram forçados a bater com o degrau que cada nó declara no nome. Vários diziam "H3 - 28px" e renderizavam noutro tamanho, ou seja, a seção mentia sobre a própria escala.
- A seção foi duplicada: **`Contrastes Poppins`** (`7:428`) e **`Contrastes Quicksand`** (`44:2`, em x 1689).

> **PENDENTE:** a seção `Contrastes Quicksand` está pela metade. Os H1 a H5 já estão em Quicksand, mas **o Parágrafo e o Small continuam em Poppins**, porque a chamada que faria a troca foi barrada pelo limite do plano. Nesse estado as duas seções são idênticas nos degraus de corpo e não servem para comparar as fontes. É a primeira coisa a corrigir quando o acesso voltar.

### 4.4 Tela de login

Montada e depois reamarrada aos estilos — **não há um único código hex solto nela**. Estrutura em auto-layout: bloco de marca, formulário com dois campos, link de recuperação, botão primário, divisor e botão secundário, mais a nota de rodapé.

Alvos de toque conferidos: campos e botões com 56 pt, link de recuperação dentro de área de 44 pt. Atende o mínimo de 44 × 44 do RNF-35.

**Decisão de requisito registrada:** não há escolha de perfil na tela de login, e isso é proposital. O CA-02.1 diz que o sistema abre a sessão e apresenta a tela inicial correspondente ao perfil — ele já sabe quem é pelas credenciais. Perguntar seria redundante e ainda revelaria quais perfis existem. A escolha de perfil pertence ao cadastro, RF-01.

**O rodapé aponta para a etapa de consentimento** em vez de dizer "ao continuar você concorda", porque o RF-03 e o RF-04 exigem aceite explícito e destacado, que é a tela 2.

> **A tela precisa ser refeita** sob as regras da seção 2.3. Hoje os rótulos "E-mail" e "Senha", o link "Esqueci minha senha", o "Mostrar" e a palavra "Calmind" estão em rosa. Pela regra nova, tudo isso vira preto, a marca vira a logo Black, e a tela passa a ser neutra por ser anterior ao login.

---

## 5. O que foi feito no Miro

O board **Calmind** passou a ser o quadro de Scrum do grupo, o que responde a decisão **DA-05** de `docs/planejamento/decisoes-abertas.md`.

- Foi criada a tabela **"Hoje — quinta 27/08"** em formato kanban, agrupada por Status, com **as quatro frentes do dia**: entrevistas, início da ABNT, tipografia e telas no Figma, e slides. Cada card traz "Pronto quando" e "Cuidados" em vez de passo a passo.
- Os responsáveis estão atribuídos de verdade, pelo campo de pessoa do Miro.

> **PENDENTE, e precisa ser feito à mão:** existe ainda no board uma tabela antiga de **19 cards**, criada antes e substituída pela de 4 frentes. O MCP do Miro não expõe apagar linha nem apagar widget — só criar e atualizar. **Alguém precisa selecionar essa tabela no Miro e deletar.** A tabela original de 4 linhas, no topo do board, não foi tocada.

### Mapeamento de contas do Miro

| Pessoa | Conta |
|---|---|
| Rafael | `fbrecci@gmail.com` (dono) |
| Caio | `caioyl15.ask@gmail.com` |
| Zanetti | `eduardozanettiluis@gmail.com` |
| Ribeiro | `niick.rib01@gmail.com` |
| Mariana | `marianacribeiro1012@gmail.com` |
| Isabela | `isabellatropicopuzenato@gmail.com` |

Duas identificações **não confirmadas**: Zanetti tem duas contas no board (`eduardo.zanetti3006@gmail.com` é a outra) e foi usada a segunda; e a conta da Mariana traz "ribeiro" no endereço, o que pode ser confusão com a da Ribeiro. Conferir antes de confiar nas atribuições.

---

## 6. Próximo passo

**As 14 telas do inventário estão montadas no Figma, e o protótipo está navegável.** São 18
frames no total: as 14 telas, o estado de erro do login e as três do ramo do cadastro. Foram
criados em 27/08/2026, à direita do frame `Logos`, começando em x=3504. Cada frame se chama
`NN · Nome · contexto`, então dá para achar pelo nome no painel de camadas.

| Frame | Tela | Contexto |
|---|---|---|
| `70:2` | 01 Entrada | neutro |
| `70:29` | 1b Entrada · erro | neutro |
| `100:2` | 01c Escolha de perfil | neutro |
| `100:24` | 01d Cadastro · paciente | neutro |
| `100:58` | 01e Cadastro · psicólogo | neutro |
| `70:53` | 02 Consentimento | neutro |
| `70:83` | 03 Como você chegou aqui | neutro |
| `70:96` | 04 Código de convite | paciente |
| `71:2` | 05 Catálogo | paciente |
| `71:49` | 06 Perfil e vínculo | paciente |
| `71:80` | 07 Início do paciente | paciente |
| `71:122` | **08 Novo relato** | paciente |
| `72:2` | 09 Tarefas | paciente |
| `72:46` | 10 Conversa | paciente |
| `72:70` | 11 Agenda | paciente |
| `73:2` | 12 Cadastro com CRP | psicólogo |
| `73:25` | 13 Lista de pacientes | psicólogo |
| `73:61` | 14 Prontuário | psicólogo |

As três telas em `100:*` ficam numa **segunda fileira**, em y=972, logo abaixo da tela de
entrada — o ramo do cadastro fica pendurado na tela que o origina.

**O inventário continua em 14.** A `1b` é um estado da tela 1. E as telas `01c`, `01d` e `01e`
fecham o item 1 do inventário congelado, que sempre disse, na letra: *"Entrada: login **e
cadastro com escolha de perfil** (RF-01, RF-02)"*. O cadastro sempre esteve dentro do item 1 —
só nunca tinha sido desenhado. A tela `01` mostrava a metade do login e nada da outra metade.
A DP-04 segue congelada.

### O protótipo está navegável

**41 ligações**, com transição direcional: ida empurra para a esquerda, volta para a direita.
Dois pontos de partida, `Entrada e cadastro` (70:2) e `Lado do psicólogo` (73:2) — sem eles o
Figma começaria pelo frame mais à esquerda da página, que é a tela de login antiga.

O caminho completo que dá para percorrer clicando:

```
01 Entrada ─ Criar conta ─→ 01c Escolha de perfil
                              ├─ Sou paciente  ─→ 01d ─ Criar conta ─→ 02 Consentimento
                              │                                          ↓
                              │                       03 Onboarding ←────┘
                              │                         ├─ Tenho psicologo ─→ 04 Convite ─→ 07 Inicio
                              │                         └─ Quero encontrar ─→ 05 Catalogo ─→ 06 Perfil ─→ 07
                              └─ Sou psicologo ─→ 01e ─ Criar conta ─→ 12 CRP ─→ 13 Pacientes ─→ 14 Prontuario

07 Inicio ─ Escrever relato ─→ 08 Novo relato, e as abas circulam entre 07, 09, 10 e 11
```

**Duas coisas ficaram sem destino, de propósito:** a aba "Relatos" do paciente e o botão "Gerar
convite" do psicólogo. As telas que elas abririam — a listagem de relatos e o gerador de código
— estão fora do inventário de 14. Não é esquecimento: é o inventário congelado aparecendo como
buraco no protótipo. Se a banca clicar ali, a resposta é a DP-04.

**A tela de cadastro é uma só na implementação.** No Figma são duas (`01d` e `01e`) porque um
frame tem um destino só, e o protótipo precisa mostrar que paciente e psicólogo seguem por
caminhos diferentes. Layout idêntico; muda o selo do perfil e o destino do botão.

**A tela 8 foi conferida contra o RNF-37 e passa nos três pontos:** o seletor está acima do
campo de texto, aparece sem rolagem, e já vem marcado em Compartilhado — com fundo verde e
texto Dark a 12,13:1, não só uma borda. O que falta nela é o teste de usabilidade com 3 pessoas
externas, que é o critério de verificação do requisito e não se resolve no Figma.

### O que ainda precisa de olho humano

1. **Abrir as 15 telas e olhar.** O construtor garante que nada colapsou e que nenhuma cor saiu
   de fallback, mas não sabe dizer se um texto ficou apertado ou se dois blocos se acotovelam.
2. **Decidir a pendência 5.** Ela deixou de ser hipótese: na tela 13, os selos `Danger +1`
   ficam a poucos pixels do botão rosa e do indicador de aba rosa, e não se distinguem rápido.
   É o momento de escurecer o Danger, antes de o design system fechar.
3. **Decidir a pendência 4.** Os estilos de texto estão piores do que se pensava — ver seção 7.

### Regras de cor que as telas passaram a seguir

A seção 2.3 dizia verde no paciente, rosa no psicólogo, neutro antes do login. Faltava dizer o
que é o botão primário de uma tela neutra, já que ela não pode ser verde nem rosa:

| Contexto | Telas | Acento | Tinta sobre o acento |
|---|---|---|---|
| neutro | 1, 1b, 2, 3 | `Dark` | `Light +1` |
| paciente | 4 a 11 | `Secundário` | `Dark` |
| psicólogo | 12 a 14 | `Primário` | `Dark` |

**O botão primário do contexto neutro é Dark com texto claro, e é a única combinação com texto
claro em todo o conjunto.** A seção 3 mediu: sobre Dark o branco dá 17,01:1; sobre qualquer
outra cor da paleta ele reprova. Nas telas de paciente e de psicólogo, texto sobre cor é sempre
Dark, sem exceção.

### 6.1 A questão do plano do Figma — resolvida na prática, não no plano

**O plano NÃO subiu.** O `whoami` continua devolvendo:

```
handle: Brecci   ·   email: rafael.b.souza12@aluno.senai.br
plano:  RAFAEL BRECCI DE SOUZA's team
seat:   View     ·   tier: starter
```

A conta de estudante, se foi registrada, não chegou ao MCP. Vale a pena concluir a
verificação no site do Figma com o e-mail `@aluno.senai.br` — é de graça e resolve na raiz.

**Mas a cota renovou, e isso bastou.** As 14 telas foram montadas em 6 chamadas de escrita,
não nas 15 a 20 que se temia. O que fez a diferença foi a estratégia da rajada: cada chamada
carrega o construtor inteiro mais 3 a 5 telas, e resolve estilo e fonte por nome em tempo de
execução, sem depender de nenhum ID lido antes.

Se a cota esgotar de novo antes de terminar algo, o caminho está pronto em
[`docs/prototipo/figma/`](docs/prototipo/figma/README.md). Rode o simulador antes de gastar
chamada:

```bash
node docs/prototipo/figma/verificar.js
```

#### O erro que custou uma chamada, e como não repeti-lo

A primeira montagem das telas 1 a 4 saiu **colapsada**: todo texto com largura 0 e altura
absurda, um caractere por linha. A causa é de ordem, não de lógica:

> `textAutoResize = 'HEIGHT'` **trava a largura no valor que o nó tiver naquele instante**, e
> um nó recém-criado tem largura **zero**. Travar antes de escrever faz o texto quebrar a cada
> letra — e o `layoutSizingHorizontal = 'FILL'` aplicado depois **não refaz o fluxo**.

A ordem correta, que está no `_preludio.js`: escrever os caracteres primeiro, pendurar no pai,
e só então trocar o modo para `HEIGHT`.

Duas lições ficaram no repositório, não só na cabeça:

1. O construtor tem **rede de segurança**: se um texto ainda sair com largura menor que 2, ele
   cai para largura fixa medida no pai e registra o aviso no retorno.
2. Toda chamada de tela termina **conferindo a si mesma** — varre os textos e devolve
   `colapsados`. Nas cinco chamadas boas isso voltou vazio.
3. O simulador foi corrigido para reproduzir a armadilha. Testado nos dois sentidos: com o
   código antigo ele acusa 12 textos colapsados, com o corrigido ele passa. **Simulador que
   não reprova o bug conhecido não serve para nada.**

## 7. Pendências em aberto

| # | Pendência | Quem decide |
|---|---|---|
| 1 | ~~`Contrastes Quicksand` com Parágrafo e Small em Poppins~~ | **RESOLVIDA.** 6 nós corrigidos: `44:6`, `44:7`, `44:16`, `44:17`, `44:24`, `44:25`. As duas seções agora comparam de verdade |
| 2 | **Concluir a verificação de estudante no site do Figma.** Testado duas vezes: o `tier` continua `starter`. A cota renovou e deu para trabalhar, mas o teto baixo volta a incomodar na Sprint 2 | Rafael |
| 3 | Apagar à mão a tabela antiga de 19 cards no Miro | Caio, Scrum Master |
| 4 | **Pior do que se pensava.** Além de "Parágrafo Quicksand" e "Small Quicksand" serem corpo em Quicksand, os degraus de título estão em **Quicksand Regular**, não SemiBold: `H1 Quicksand [Quicksand Regular 40]`, `H3 Quicksand [Quicksand Regular 28]`. Só o H2 é Medium. Ou seja, **nenhum dos 15 estilos bate com a tabela da seção 2.1**. Existe ainda um `Tin Quicksand [Bold 24]` sem degrau correspondente. As telas contornaram aplicando fonte direta; quando os estilos forem consertados, dá para trocar o mapa `TIPO` do prelúdio por `setTextStyleIdAsync` sem tocar em nenhuma tela | Grupo |
| 5 | **CONFIRMADA na tela 13** (`73:25`). Os selos `Danger +1` de "2 não lidas" e "tarefa vencida" ficam ao lado do botão rosa e do indicador de aba rosa, e não se distinguem rápido. Deixou de ser hipótese — escurecer o Danger antes de fechar o design system | Grupo |
| 6 | ~~Estado de erro do login não desenhado~~ | **RESOLVIDA.** Tela `1b` (`70:29`), com a mensagem genérica do CA-02.2. É estado da tela 1, não tela nova |
| 7 | A paleta não tem neutro aprovado para placeholder e texto desabilitado. Hoje o placeholder usa `Dark +1`, que passa a 6,3:1 | Grupo |
| 8 | Confirmar as duas contas duvidosas do Miro, Zanetti e Mariana | Grupo |

---

## 8. Como retomar

1. Ler este arquivo inteiro.
2. **Abrir os 18 frames no Figma e olhar um por um, e depois percorrer o protótipo clicando.**
   É o que falta e é trabalho de gente: o construtor garante estrutura, não julgamento visual, e
   o simulador não enxerga sobreposição nem texto apertado. A lista de frames está na seção 6.
3. Decidir as pendências 4, 5 e 7 da seção 7. As três são de cor e tipografia, as três estão
   maduras, e as três travam o fechamento do design system.
4. **Não rodar os scripts de `docs/prototipo/figma/` de novo sem necessidade** — eles criam
   telas novas, não atualizam as existentes. Se precisar refazer uma tela, apague o frame dela
   primeiro. Os scripts servem para reconstruir do zero, ou como referência de como as telas
   foram feitas.
5. Atualizar este arquivo ao final.

**Documentos que mandam mais que este aqui:** os requisitos em [`docs/documento-requisitos.md`](docs/documento-requisitos.md), o inventário de telas e o cronograma em [`docs/planejamento/cronograma.md`](docs/planejamento/cronograma.md), e as decisões abertas em [`docs/planejamento/decisoes-abertas.md`](docs/planejamento/decisoes-abertas.md). Onde este arquivo divergir deles, eles vencem — e este aqui é que precisa ser corrigido.
