# Identidade da marca e branding

**Calmind** — Saúde Mental & Acolhimento
Trabalho de Conclusão de Curso · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo · 2026

> Este documento é o entregável de identidade da Sprint 1. Ele reúne num só lugar o nome, o
> propósito, o público-alvo, o logotipo, a paleta e a tipografia, e é a referência que vale para
> o aplicativo, a landing page, a capa do documento final e os slides.
>
> O raciocínio de design por trás de cada decisão, com o histórico de quando e por que mudou,
> está em [`CONTEXTO.md`](../CONTEXTO.md). Onde os dois divergirem, **este arquivo vence** — o
> outro é diário de sessão, este é a especificação.

---

## 1. Nome e assinatura

| | |
|---|---|
| **Nome** | Calmind |
| **Slogan** | Saúde Mental & Acolhimento |
| **Assinatura completa** | Calmind — Saúde Mental & Acolhimento |
| **Identificador do pacote** | `com.<grupo>.calmind`, ainda em aberto (ver [`planejamento/arranque-react-native.md`](planejamento/arranque-react-native.md)) |

O nome é a junção de **calm** e **mind**. Não é sigla, não tem acento e não se traduz: escreve-se
`Calmind` em qualquer idioma, sempre com C maiúsculo e o resto minúsculo. Nunca `CalMind`,
`CALMIND` nem `Callmind`.

O slogan acompanha o nome nas peças de apresentação (capa, landing page, slides) e pode ser omitido
dentro do aplicativo, onde o contexto já é evidente.

---

## 2. Propósito de marca

**A Calmind cuida do intervalo entre uma sessão de terapia e a seguinte.**

A hipótese central do produto é que a qualidade do tratamento depende tanto do que acontece *na*
sessão quanto do que acontece *entre* as sessões — e é justamente esse intervalo que hoje não tem
ferramenta nenhuma. A pesquisa de campo com duas psicólogas e duas pacientes, sem relação entre si,
convergiu de forma independente para as mesmas dores: comunicação fragmentada, agendamento manual
sujeito a esquecimento, baixa adesão às tarefas prescritas e tempo de sessão gasto em recapitulação
em vez de trabalho clínico.

A marca se posiciona nesse vão. Não é uma clínica, não é um marketplace de terapia e não é um app
de autoajuda: é a **ponte de continuidade** entre duas pessoas que já têm, ou querem ter, um
vínculo terapêutico.

Do que isso exige da marca, em tom e em desenho:

| O que a marca é | O que a marca não é |
|---|---|
| Acolhedora: o app é lido em dia ruim, não em dia de festa | Animada, comemorativa ou motivacional |
| Discreta: dado de saúde à vista de quem passa pelo lado é vazamento | Chamativa, com notificação que revela conteúdo |
| Calma: tipografia arredondada, cor em detalhe, muito branco | Densa, saturada, com cor em grandes áreas |
| Honesta: diz o que faz com o dado, e o que a IA fez | Automática, opaca, "mágica" |
| Sóbria quanto à profissão: sem nota, sem estrela, sem ranking | Competitiva ou comercial na escolha do profissional |

Os quatro compromissos que sustentam esse posicionamento — a IA nunca age sozinha, o relato privado
não sai do escopo do paciente, a plataforma não prescreve e a escolha de tratamento não vira ranking
comercial — estão detalhados em [`modelo-de-negocio-calmind.md`](modelo-de-negocio-calmind.md) e
amarrados a requisitos verificáveis na seção 8.1 de
[`documento-requisitos.md`](documento-requisitos.md).

---

## 3. Público-alvo

### 3.1 Os dois públicos que usam o aplicativo

**Paciente em acompanhamento psicológico, a partir de 12 anos.**
O piso de 12 anos é decisão de produto (DEC-16): relato escrito, tarefa e chat pressupõem autonomia
de escrita. Abaixo de 18 anos o cadastro exige contato de um responsável legal, que **não tem conta
e não acessa conteúdo clínico** (DEC-17). Divide-se em dois recortes, que entram no produto por
portas diferentes:

- **quem já tem psicólogo** e entra por código de convite — é o público principal, e o que valida a
  hipótese central;
- **quem ainda não tem** e chega pelo catálogo de profissionais para iniciar o vínculo.

**Psicólogo com registro ativo no CRP.**
Profissional de atendimento particular, autônomo ou em consultório pequeno, que hoje administra a
semana dos pacientes em caderno, bloco de notas e mensagens de aplicativo pessoal. Busca preparar a
sessão em menos tempo e sem depender da memória do paciente. Precisa de sigilo defensável e de
registro documental, exigências da Resolução CFP nº 9/2024.

### 3.2 Quem explicitamente não é público

Declarado para que a marca não prometa o que o produto não faz:

| Não é público | Por quê |
|---|---|
| Responsável legal de paciente menor | Não tem conta nem acesso, por decisão de produto (DEC-17) |
| Médico e psiquiatra | A plataforma **não prescreve**; apenas registra medicação já prescrita fora dela (DEC-10) |
| Clínica com gestão financeira | Não há pagamento, honorário nem cobrança na plataforma (DEC-07) |
| Quem busca terapia por vídeo | O produto atua entre as sessões, não nelas (DEC-08) |
| Quem busca autoajuda sem profissional | Todo conteúdo do produto existe dentro de um vínculo terapêutico |

### 3.3 Público das peças de divulgação

A landing page e os slides falam com um terceiro público, que não usa o app: **a banca avaliadora e
visitantes do projeto**. Para eles a marca precisa comunicar, em ordem, o problema do intervalo
entre sessões, os quatro compromissos éticos e a existência de pesquisa de campo real por trás das
decisões.

---

## 4. Logotipo

O símbolo reúne três elementos num círculo: uma **muda brotando** (o processo, que leva tempo), um
**perfil de rosto** (a pessoa) e uma **mão aberta embaixo** (o acolhimento, e o fato de que alguém
sustenta o processo). O círculo fecha a composição e dá o recorte de ícone de aplicativo.

A cor do símbolo é o **Gradiente Verde-Rosa**, que funde as duas cores de contexto do produto — o
verde do lado do paciente e o rosa do lado do psicólogo. A marca não escolhe lado: mostra os dois.

<p align="center">
  <img src="prototipo/assets/callmind-logo-fullHD-sem-textura.png" alt="Logotipo Calmind: muda brotando, perfil de rosto e mão aberta dentro de um círculo, em gradiente verde-rosa" width="260">
</p>

### 4.1 Variantes e quando usar cada uma

| Arquivo | Fundo | Uso |
|---|---|---|
| [`prototipo/assets/callmind-logo-fullHD-sem-textura.png`](prototipo/assets/callmind-logo-fullHD-sem-textura.png) | branco, sem transparência | **Variante principal.** Documento, slide, README, landing page |
| [`prototipo/assets/calmind-logo-cores-transparente.png`](prototipo/assets/calmind-logo-cores-transparente.png) | transparente | Sobre fundo claro de cor variável; ícone do aplicativo |
| [`prototipo/assets/calmind-logo-cores-transparente-textura-leve.png`](prototipo/assets/calmind-logo-cores-transparente-textura-leve.png) | transparente, com textura de papel | Peça impressa e capa, onde a textura tem escala para aparecer |
| [`prototipo/assets/callmind-logo-placeholder-light.png`](prototipo/assets/callmind-logo-placeholder-light.png) | transparente, cinza claro monocromático | Sobre fundo escuro; marca de água; estado desabilitado |
| [`prototipo/assets/callmind-logo-placeholder-dark.png`](prototipo/assets/callmind-logo-placeholder-dark.png) | transparente, cinza escuro monocromático | Sobre fundo claro em uma cor só; impressão em preto e branco |

> **Três dos cinco arquivos estão grafados `callmind`, com dois L.** É erro de digitação no nome do
> arquivo, não variação da marca — a marca é `Calmind`. Os nomes serão corrigidos junto com a
> exportação em vetor; até lá os caminhos acima são os que funcionam. O arquivo chamado `fullHD`
> tem 500 × 500 px, não resolução Full HD.

### 4.2 Regras de uso

1. **Não redesenhar.** Não alterar proporção entre os elementos, não separar a mão do círculo, não
   trocar a cor do gradiente por uma cor plana.
2. **Margem de respiro** de no mínimo 10% da largura do símbolo em todos os lados.
3. **Tamanho mínimo** de 32 px de largura em tela. Abaixo disso a mão e o perfil viram borrão — use
   a variante monocromática.
4. **Não aplicar a variante colorida sobre fundo saturado.** O gradiente é claro e perde contorno.
   Sobre cor, use `placeholder-light` ou `placeholder-dark`, o que tiver mais contraste.
5. **A palavra "Calmind" escrita ao lado do símbolo** é composta em Quicksand SemiBold, nunca em
   outra fonte, e sempre em `Dark` ou em branco — nunca em rosa, nunca em verde.

### 4.3 Pendências do ativo

| # | Pendência |
|---|---|
| 1 | Exportar o símbolo em **SVG**. Hoje só existe PNG, e a landing page precisa de vetor |
| 2 | Corrigir `callmind` para `calmind` nos três nomes de arquivo |
| 3 | Gerar o **ícone do aplicativo** nas densidades do Android e do iOS, com o recorte redondo e o quadrado |
| 4 | Montar o **lockup horizontal** (símbolo mais a palavra) como arquivo único, para cabeçalho e slide |

---

## 5. Paleta

A fonte de verdade da paleta são os **estilos de cor do arquivo do Figma**. São 6 famílias em 3
tons cada, 18 estilos no total: as variantes `-1` e `+1` foram geradas misturando a base 30% em
direção ao preto e ao branco, respectivamente.

### 5.1 Cores primária e secundária

| Papel | Família | `-1` (escura) | **Base** | `+1` (clara) |
|---|---|---|---|---|
| **Primária** · lado do psicólogo | Primário | `#A858A9` | **`#F07EF2`** | `#DFB3F2` |
| **Secundária** · lado do paciente | Secundário | `#5BA958` | **`#82F27E`** | `#D6F2C2` |

A primária é o rosa-lilás e a secundária é o verde. A escolha de qual é primária e qual é secundária
não implica hierarquia de importância entre os dois lados do produto: as duas têm o mesmo peso
visual, e cada lado do app roda com a sua como cor única.

### 5.2 Cores de apoio

| Família | `-1` | Base | `+1` | Uso |
|---|---|---|---|---|
| Light | `#989898` | `#D9D9D9` | `#E4E4E4` | Borda, divisória, fundo de campo, estado desabilitado |
| Dark | `#141414` | `#1C1C1C` | `#606060` | Texto, ícone, contorno |
| Danger | `#B24040` | `#FF5C5C` | `#FF8D8D` | Erro, recusa, ação destrutiva |
| Success | `#5FA2B2` | `#88E7FF` | `#ACEEFF` | Confirmação, estado concluído |

### 5.3 Gradiente Verde-Rosa

Funde `Secundário` e `Primário`. É a cor da marca e das telas anteriores ao login — as que
acontecem antes de o sistema saber se a pessoa é paciente ou psicólogo e que, por isso, não podem
escolher lado.

> É o único lugar do arquivo do Figma onde a cor é **copiada** da paleta em vez de ligada a ela: um
> preenchimento não aponta para dois estilos ao mesmo tempo. Se `Primário` ou `Secundário` mudarem,
> o gradiente precisa ser regerado.

### 5.4 Contraste medido, e a regra que sai dele

Medição de cada cor base contra texto branco e contra texto `Dark`:

| Fundo | Texto branco | Texto `Dark` |
|---|---|---|
| Primário | **2,34:1** reprova | 7,28:1 aprova |
| Secundário | 1,40:1 reprova | 12,13:1 aprova |
| Light | 1,41:1 reprova | 12,07:1 aprova |
| Dark | 17,01:1 aprova | — |
| Danger | **3,03:1** reprova | 5,62:1 aprova |
| Success | 1,41:1 reprova | 12,12:1 aprova |
| Gradiente, extremo rosa | 2,34:1 reprova | 7,28:1 aprova |
| Gradiente, extremo verde | 1,40:1 reprova | 12,13:1 aprova |

**Nesta paleta, texto sobre cor é sempre `Dark`, nunca branco.** O RNF-35 exige 4,5:1 para texto
comum, e o branco só passa sobre `Dark`. A regra já corrigiu um erro real: o botão "Entrar" da tela
de login estava com texto branco sobre o rosa, a 2,34:1 — menos da metade do mínimo.

### 5.5 Regras de aplicação nas telas

1. **Fundo majoritariamente branco.**
2. **Texto preferencialmente `Dark`.**
3. **Primária e secundária entram em botão, hover, sombra, contorno, linha e detalhe** — nunca em
   grandes áreas de fundo.
4. **A cor indica o contexto:** verde no lado do paciente, rosa no lado do psicólogo. É pista de
   orientação, não decoração: a pessoa sabe em qual lado do produto está pela cor.
5. **Telas anteriores ao login não escolhem lado** e usam o Gradiente Verde-Rosa.

| Contexto | Telas | Cor | Texto sobre a cor |
|---|---|---|---|
| Neutro, antes do login | entrada, escolha de perfil, cadastro, consentimento, onboarding | Gradiente Verde-Rosa | `Dark` |
| Paciente | convite, catálogo, perfil e vínculo, início, relato, tarefas, conversa, agenda | `Secundário` | `Dark` |
| Psicólogo | cadastro com CRP, lista de pacientes, prontuário | `Primário` | `Dark` |

---

## 6. Tipografia

**Quicksand nos títulos, Poppins no texto de corpo.** Quicksand é geométrica de terminais
arredondados, e é ela que carrega o tom de calma da marca; Poppins sustenta a leitura em bloco de
texto corrido, onde a Quicksand cansa.

| Degrau | Tamanho | Fonte |
|---|---|---|
| H1 | 40 px | Quicksand SemiBold |
| H2 | 34 px | Quicksand SemiBold |
| H3 | 28 px | Quicksand SemiBold |
| H4 | 24 px | Quicksand SemiBold |
| H5 | 18 px | Quicksand SemiBold |
| Parágrafo | 16 px | Poppins Regular |
| Small | 14 px | Poppins Regular |

Pesos disponíveis no arquivo: Quicksand em Light, Regular, Medium, SemiBold e Bold; Poppins na
família completa. **Atenção ao nome exato do peso: é `SemiBold`, sem espaço** — os scripts de
montagem das telas falham em silêncio com `Semi Bold`.

O corpo de texto nunca desce abaixo de 14 px, piso exigido pelo RNF-34. As duas famílias são
abertas, disponíveis no Google Fonts, e entram no aplicativo empacotadas em vez de carregadas da
rede.

---

## 7. Onde os ativos vivem

| Ativo | Lugar |
|---|---|
| Arquivo de design, telas e estilos | Figma: `figma.com/design/lpg2qDhPuOmKfvLAPFOVKA/Calmind` |
| Logotipo, 5 variantes em PNG | [`prototipo/assets/`](prototipo/assets/) |
| Telas em PDF, uma por arquivo | [`prototipo/telas-pdf/`](prototipo/telas-pdf/) |
| Wireframes navegáveis das 16 telas | [`prototipo/wireframes.html`](prototipo/wireframes.html) |
| Mapa de UX do fluxo entre as telas | [`prototipo/fluxo-ux.html`](prototipo/fluxo-ux.html) |
| Scripts que montam as telas no Figma | [`prototipo/figma/`](prototipo/figma/) |
| Histórico e justificativa das decisões de design | [`../CONTEXTO.md`](../CONTEXTO.md) |

---

## 8. Pendências de identidade abertas ao fim da Sprint 1

| # | Pendência | Responsável |
|---|---|---|
| 1 | Logo em SVG, nomes de arquivo corrigidos, ícone do app e lockup horizontal (seção 4.3) | Zanetti |
| 2 | A paleta não tem neutro aprovado para *placeholder* e texto desabilitado. Hoje o placeholder usa `Dark +1`, que passa a 6,3:1 — funciona, mas não foi decidido, foi herdado | Grupo |
| 3 | A tela de login ainda tem rótulos, link e a palavra "Calmind" em rosa. Pela regra da seção 5.5 tudo isso vira `Dark` e a marca vira a variante monocromática, porque a tela é anterior ao login | Caio |
| 4 | Definir o identificador do pacote, `com.<grupo>.calmind` | Grupo |
