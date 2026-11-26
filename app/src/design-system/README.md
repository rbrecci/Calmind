# Design system

Fonte de verdade: [`docs/identidade-visual.md`](../../../docs/identidade-visual.md). Onde este código e o documento divergirem, o documento vence.

**Toda tela importa daqui** (`import { Button, Screen, Text } from '@/design-system'`) e nunca usa `Text`, `TextInput` ou cor solta do React Native. Componente novo entra neste diretório, não ao lado dele (RNF-34).

| Arquivo | O que tem |
|---------|-----------|
| `index.ts` | O único ponto de importação (`@/design-system`): componente novo é exportado aqui |
| `tokens.ts` | Paleta (6 famílias × 3 tons), cores semânticas, cor de cada lado (base, tom claro e tom escuro), cores de etiqueta de status, gradiente, fundo das telas (`ScreenGradients`), espaçamento |
| `typography.ts` | Escala H1 a H5, parágrafo e small, com Quicksand SemiBold e Poppins |
| `fonts.ts` | Carrega as fontes empacotadas no app |
| `text.tsx`, `button.tsx`, `text-field.tsx`, `screen.tsx`, `list-item.tsx` | Componentes base |
| `choice-group.tsx` | Escolha de uma opção entre poucas, em chips, em trilho segmentado (`segmented`) ou em abas de conteúdo (`tabs`); a escolhida fica cheia na cor do lado |
| `message-composer.tsx` | Rodapé das conversas: campo branco e botão quadrado com a seta na mesma linha |
| `conversation.tsx`, `message-days.ts` | Balão de mensagem (`MessageBubble`), grupo de um dia com o separador (`MessageDay`) e o agrupamento das mensagens por dia (`groupMessagesByDay`) |
| `expandable-card.tsx` | Cartão compacto que abre no lugar (`ExpandableCard`): título e etiqueta fechado, o resto aberto |
| `check-card.tsx` | Aceite em cartão tocável inteiro (`CheckCard`), com caixa de marcar e etiqueta opcional |
| `choice-card.tsx` | Cartão grande tocável para escolher um caminho (`ChoiceCard`), do branco ao tom claro do lado |
| `back-header.tsx` | Seta de voltar e título numa linha (`BackHeader`), nas etapas do cadastro antes do login |
| `error-banner.tsx` | Erro do formulário inteiro em bloco no topo dele (`ErrorBanner`), como a falha do login |
| `format-date.ts` | Formatação de data e hora para tela, na hora local do aparelho, a linha de prazo da tarefa (`formatTaskDate`) e a etiqueta de prazo (`taskDeadlineTag`) |
| `counts.ts` | Contagem de não lidas em texto (`formatUnread`) e contador de aba (`tabBadge`) |
| `confirmation.ts` | Variante dos botões de uma confirmação, comum ou destrutiva |
| `status-tag.tsx`, `status-kind.ts` | Status de consulta, tarefa, relato ou vínculo em pílula de fundo claro; `statusTagKind` diz o tipo (neutro, atenção, positivo, negativo) |
| `logo.tsx` | O símbolo da Calmind (`Logo`), decorativo; `animated` faz a entrada única do login |
| `illustration.tsx` | Ilustração decorativa por nome (`Illustration`), 360:260, que entra e depois respira devagar |
| `empty-state.tsx` | Tela inteira vazia (`EmptyState`): ilustração, título curto, descrição e ação opcionais |
| `loading.tsx` | Carregando de tela inteira (`Loading`): logo pequeno pulsando e o texto "Carregando" |
| `appear.tsx` | `Appear`, caixa que esmaece ao montar (cartões; `rise` sobe 8 pontos, nas mensagens), e `SkipInitialAppear`, que deixa parado o que já estava ali |
| `motion.ts` | Curvas de movimento (ease-out e ease-in-out) nos dois formatos que o Reanimated pede |
| `app-header.tsx` | Cabeçalho das telas depois do login (`AppHeader`): barra na cor do lado com a base arredondada, ícone e título no centro, avatar ou voltar à esquerda, sino e engrenagem à direita |
| `tab-bar.tsx` | Barra de abas flutuante (`TabBar`), que entra no `tabBar` dos layouts de abas |
| `icon.tsx` | Ícones Phosphor com peso `regular`, iguais no Android, iOS e web. Imports individuais para evitar carregar o catálogo inteiro. Sempre decorativos |
| `avatar.tsx`, `initials.ts` | Círculo com a foto (`uri`, com `headers` para rota autenticada) ou as iniciais em Dark sobre o tom claro do lado. Foto que não carrega também cai para as iniciais |
| `cover.tsx` | Faixa de capa (`Cover`): a imagem quando houver; sem ela, ou se não carregar, o degradê do tom claro à cor do lado |
| `image-source.ts` | `useImageSource`: fonte de imagem estável entre renderizações, para a web não buscar a foto de novo a cada uma |
| `profile-header.tsx` | Topo das telas de perfil (`ProfileHeader`): capa, avatar sobreposto e nome com uma linha abaixo (CRP) |
| `cover-card.tsx` | Cartão tocável com capa, avatar, nome, etiqueta e uma linha (`CoverCard`), como "Seu vínculo" |
| `person-card.tsx` | Cartão tocável de pessoa em lista (`PersonCard`): avatar pequeno, nome, etiqueta à direita e linha de resumo |
| `chip.tsx` | Pílula curta (`Chip`): filtro que liga e desliga (com `onPress`) ou atributo do perfil (sem) |
| `shortcut.tsx` | Atalho do início (`Shortcut`): ícone no tom escuro do lado, rótulo em Dark e contador opcional |
| `hero.tsx` | Bloco de destaque do início (`Hero`), colado ao cabeçalho de base reta, com o logo grande e decorativo |
| `code-field.tsx` | Campo grande de código curto (`CodeField`), letras espaçadas e centralizadas, como o código de convite |

## Cabeçalho e barra de abas

Depois do login, toda tela com cabeçalho usa o `AppHeader`. Quem o liga ao roteador e à sessão é o
`SideHeader` (`src/navigation/side-header.tsx`), usado no `header` dos layouts de cada lado; a
contagem do sino vem do `UnreadNotificationsProvider`, no layout do lado, numa busca só para todos
os cabeçalhos.

| Onde | Esquerda | Direita |
|------|----------|---------|
| Tela raiz de aba | Avatar de quem está logado | Sino (com contador) e engrenagem (Conta) |
| Tela empilhada | Seta de voltar | Sino e engrenagem |
| Formulário (novo relato, código de convite, convite para paciente), Notificações, Conta e Meu perfil | Seta de voltar | nada |
| Login, cadastro, consentimento e demais portões | sem cabeçalho colorido | |

- A barra cobre a área da barra de status, em degradê da base do lado com o tom claro no alto e no
  centro, e tem a base arredondada (`Radius.lg`, 24). Texto e ícones em Dark, nunca branco.
- O contador do sino é branco com número Dark: na cor do lado ele sumiria.
- A barra de abas é um cartão branco solto das bordas, ícone de contorno e rótulo embaixo. A aba
  ativa ganha a pílula no tom claro do lado atrás do ícone, e o ícone no tom escuro (a base some
  sobre a pílula). O rótulo ativo é Dark no peso dos títulos, porque verde e rosa reprovam como
  texto no branco.
- Paciente: Início, Relatos, Tarefas, Conversa. Psicólogo: Pacientes, Agenda, Perfil. Agenda do
  paciente e notificações do psicólogo são telas empilhadas.
- O avatar mostra a foto da sessão (`avatarUrl`, guardada como o nome). No paciente ele é botão e
  abre "Meu perfil"; no psicólogo é só imagem, porque o perfil já é uma aba.
- No início do paciente a base é reta (`flush`): o `Hero` continua a cor logo abaixo e fecha com a
  borda branca arredondada.
- O cabeçalho mostra o `title` da tela; o `TabBar` mostra o `tabBarLabel` quando houver e, sem ele,
  o mesmo `title`. A Conversa do paciente usa os dois: o cabeçalho troca "Conversa" pelo nome da
  profissional (a tela define o título), e a aba e o leitor de tela continuam dizendo "Conversa".
- O título cabe numa linha de 390 pontos com os dois cantos, que têm largura fixa mesmo sem sino e
  engrenagem: uns 14 caracteres com o ícone. Acima disso ele corta com reticências, então o título
  é a palavra curta ("Profissionais", "Convite", "Solicitações"). Só nome de pessoa pode cortar.

## Foto e capa

- As imagens vêm de rota autenticada: quem mostra passa `headers={imageHeaders()}` (de `@/api`), com
  o Bearer e o aviso do ngrok. Sem eles a rota responde 401, ou o ngrok devolve uma página HTML.
- Sem foto, iniciais; sem capa, degradê do lado. Nunca foto de banco de imagem.
- O avatar ao lado do nome é decorativo; o nome escrito é que vai para o leitor de tela.
- Troca e remoção ficam em `src/profile/` (`useProfileImages`, `ProfileImageActions`): recorte
  quadrado para a foto, 16:9 para a capa, qualidade 0,7, e acima de 2 MB o envio nem sai.

## Fundo das telas

O `Screen` pinta um degradê vertical muito suave, do branco a um tom claro do lado com
transparência (`ScreenGradients`). O tom vem do `ScreenToneContext`, declarado uma vez no layout de
cada lado; sem ele o fundo é o neutro, verde no topo e rosa no fim. A prop `tone` troca o tom de uma
tela só, como os consentimentos, que são neutros dentro do lado. A transparência é o teto em que o
texto de apoio e o de erro ainda passam 4,5:1 no ponto mais colorido.

## Tela: conteúdo começa no topo

`Screen` põe o conteúdo a partir do topo. `center` centraliza na vertical e serve só para tela de conteúdo único e curto (carregando, aviso de espera). Em lista ou formulário, centralizar deixa a metade de cima vazia quando há pouco item.

A área segura do aparelho entra só onde ninguém mais a desconta: a de cima, quando a tela não tem cabeçalho; a de baixo, quando a tela não está numa aba. Aplicada duas vezes, ela deixa uma faixa branca que corta o conteúdo rolado, e isso só aparece no celular, não na web.

A barra de abas flutua por cima da tela. O `Screen` lê a altura dela (`BottomTabBarHeightContext`,
que o `TabBar` informa ao medir-se) e soma ao fim do conteúdo rolado, para o último item passar da
barra. Com `footer`, quem sobe é a moldura inteira, e o campo de mensagem fica logo acima da barra.

As outras props valem com `scroll`:

| Prop | O que faz | Quem usa |
|------|-----------|----------|
| `refreshing`, `onRefresh` | Arrastar para baixo recarrega a tela (`RefreshControl`). Substitui botão de "Atualizar"; o "Tentar de novo" do erro continua na tela | Início, tarefas e agenda do paciente |
| `footer` | Fica fixo embaixo, fora da rolagem e acima do teclado (`KeyboardAvoidingView`), sem faixa nem borda, sobre o fundo da tela. Numa aba ele para acima da barra de abas | Campo de mensagem das duas conversas; botão principal dos formulários (cadastro, CRP, consentimento, novo relato) |
| `stickToEnd` | Rolagem abre no fim e volta para ele quando o conteúdo cresce ou o teclado abre | As duas conversas |

```tsx
<Screen scroll stickToEnd footer={<MessageComposer tone="patient" value={draft} onChangeText={setDraft} onSend={send} />}>{mensagens}</Screen>
```

## Qual botão usar

| Variante | Visual | Quando usar | Exemplo |
|----------|--------|-------------|---------|
| `primary` (padrão) | Cheio na cor do lado (`tone`). No `neutral`, contorno em degradê verde-rosa com o texto também em degradê, sobre branco | A ação principal da tela. Uma por tela, de preferência | Entrar, Criar conta, Continuar do consentimento (neutros); Salvar relato, Confirmar (lados) |
| `secondary` | Contorno Dark +1, texto Dark | Ação alternativa, que não destrói nada | Voltar, Cancelar edição, Sair da conta, Tentar de novo |
| `destructive` | Contorno e texto Danger -1 | Ação que encerra, apaga ou recusa algo, e o botão que confirma essa ação | Encerrar vínculo, Cancelar consulta, Recusar, Não aceito |

- Sem `variant`, o botão é `primary`: os usos antigos não mudam.
- `secondary` e `destructive` ignoram o `tone`. As cores de lado reprovam como texto ou borda sobre o branco, então o contorno é neutro nos dois lados.
- Destrutivo é contorno, não cheio, para não competir com a ação principal. Ação destrutiva pede confirmação antes de executar.
- O `primary` neutro é exceção ao contraste AA, decidida pelo dono do projeto em 25/11 para seguir o protótipo: a borda usa as bases das duas famílias e o texto os tons -1, e mesmo assim o verde -1 fica em 2,9:1 no branco. O texto em degradê é máscara (`@react-native-masked-view/masked-view`); na web a máscara não recorta, e o texto fica sólido no rosa -1, que passa 4,5:1. Os `primary` dos lados continuam cheios.
- A confirmação de uma ação destrutiva passa `kind="destructive"` (paciente) ou `'destructive'` no `ask` (psicólogo): o Confirmar sai destrutivo e o Cancelar, secundário (`confirmationVariants`).

## Item de menu

`ListItem` é a linha que leva a outra tela: título, descrição opcional, contador opcional (`badge`) e seta à direita. Use no lugar de texto solto tocável, que não parece botão.

```tsx
<ListItem tone="patient" title="Notificações" badge={2} onPress={() => router.push('/notifications')} />
```

O leitor de tela lê a linha inteira como um botão, com o contador no nome ("Notificações, 2").

Duas props opcionais cobrem o item que resume algo:

- `detail`: segunda linha curta abaixo da descrição, como "1 tarefa vencida" no paciente do início.
- `unread`: ponto Dark à esquerda e título no peso dos títulos. O estado não entra sozinho no nome lido, então quem usa passa um `accessibilityLabel` com "não lida".

## Escolha entre opções

`ChoiceGroup` substitui a fila de botões iguais com uma linha "Modalidade: X" em cima: a opção escolhida fica cheia na cor do lado e o estado se vê sem ler texto. Cada chip é um `radio` com `checked` para o leitor de tela.

```tsx
<ChoiceGroup tone="psychologist" label="Modalidade" value={modality} onChange={setModality}
  options={[{ value: 'online', label: 'Online' }, { value: 'presencial', label: 'Presencial' }]} />
```

| `variant` | Visual | Leitor de tela | Quem usa |
|-----------|--------|----------------|----------|
| `chips` (padrão) | Chips soltos com contorno Dark +1 | `radiogroup` e `radio` com `checked` | Modalidade da agenda |
| `segmented` | Opções coladas num trilho cinza; a solta sem borda, texto de apoio | `radiogroup` e `radio` com `checked` | "Compartilhado \| Só para mim" do novo relato |
| `tabs` | Chips em pílula, sem rótulo visível: o `label` vira o nome do grupo | `tablist` e `tab` com `selected` | Relatos, Tarefas e Consultas no prontuário |

`tabs` troca o conteúdo na mesma tela, sem navegar: as três listas do prontuário carregam juntas,
e a aba só escolhe qual aparece.

## Campo de texto

`TextField` é branco com borda fina Dark +1, cantos `Radius.md`, 56 de altura e o rótulo acima. A
borda cinza dos cartões (`Colors.border`) fica em 2,9:1 no branco e não desenharia o campo; a Dark
+1 passa 3:1 contra o branco de dentro e contra todo ponto do fundo da tela (`FieldColors`). Com
`multiline`, vira área de texto, com a altura das `numberOfLines` pedidas e o texto começando no alto.

O erro de um campo continua **abaixo dele**, perto de quem errou. No branco ele até passaria dentro,
mas se confundiria com o que a pessoa digitou. Erro do formulário inteiro (login recusado, falha do
servidor) vai em `ErrorBanner`, no topo do formulário: fundo no tom claro do Danger, texto Dark.

## Conversa

- Separador de dia centralizado entre os grupos, "Segunda, 17/11" (`formatDayHeading`).
  `groupMessagesByDay` junta as mensagens seguidas do mesmo dia local, na ordem que a conversa já
  tem.
- No balão (`MessageBubble`) a hora fica pequena no canto, sem a data. "Lida" ou "Enviada" só na
  última mensagem minha. A data completa e o estado vão no nome lido pelo leitor de tela.
- A hora no meu balão é Dark: o cinza de apoio reprova sobre o rosa (2,7:1).
- O rodapé (`MessageComposer`) é o campo branco com borda e o botão quadrado de 56 na cor do lado,
  com a seta em Dark e o nome "Enviar". Sem texto e sem conteúdo, o botão fica desabilitado.

## Tarefas do paciente

Seções "Pendentes" e "Concluídas", sem contador no título (R2). Cada tarefa é um `ExpandableCard`:
fechado, o título e a etiqueta de prazo; aberto, a descrição e "Marcar como concluída". A primeira
pendente começa aberta, tocar em outra abre aquela e tocar na aberta fecha. A concluída tem o título
em cinza, e não transparência, que derrubaria o contraste.

| Situação | Etiqueta (`taskDeadlineTag`) |
|----------|------------------------------|
| Pendente com prazo hoje | `hoje`, negativa |
| Pendente com prazo passado | `vencida`, negativa |
| Pendente com prazo futuro | `até 22/11`, neutra |
| Pendente sem prazo | `sem prazo`, neutra |
| Concluída | `feita 16/11`, neutra (nunca vencida) |

A comparação é por dia de calendário: o prazo de hoje continua "hoje" até a meia-noite.

## Movimento

O app é lido em dia ruim, não em dia de festa (identidade, seção 2). Movimento aqui é curto, suave e
com propósito: confirma um toque, apresenta o que chegou ou mostra que algo está andando. **Nada é
comemorativo**: sem confete, quique, overshoot, pulo, brilho ou chacoalhar.

| O que anima | Quanto | Curva | Por quê |
|-------------|--------|-------|---------|
| `Button` ao toque | escala 0,97 em 120 ms, volta ao soltar | ease-out | Confirma o toque sem mudar o alvo, que continua do tamanho do Pressable. Desabilitado não anima |
| `ListItem` ao toque | fundo vai a `Colors.surface` em 120 ms | ease-out | Linha larga encolhendo parece tremer; a cor basta. O texto continua passando o contraste nesse fundo |
| `Logo animated` (login) | opacidade 0 a 1 e escala 0,96 a 1, uma vez, 500 ms | ease-out | A marca chega devagar na primeira tela |
| `Illustration` | entrada de opacidade e 8 pontos para cima em 400 ms; depois translateY de 0 a -4 e volta, 4 s por ida, sem fim | ease-out na entrada, ease-in-out no respiro | O respiro é o que tira a tela vazia do "morto" sem chamar atenção |
| `Loading` | opacidade do logo entre 1 e 0,4, 1,2 s por ida, sem fim | ease-in-out | Mostra que algo anda; o texto "Carregando" segue para o leitor de tela |
| `Card` (os de lista do paciente e do psicólogo) | opacidade de 0 a 1 em 220 ms ao montar | ease-out | O conteúdo que chega não aparece de estalo. Só na montagem: recarregar a mesma lista com as mesmas keys não repete |
| Mensagem nova na conversa | opacidade e 8 pontos para cima em 200 ms | ease-out | Marca o que acabou de chegar. As que já estavam na conversa ao abrir não animam (`SkipInitialAppear`) |

| O que não anima | Por quê |
|-----------------|---------|
| Troca de aba | Acontece dezenas de vezes por dia e precisa ser imediata |
| Tela inteira, entrada e saída de tela | Mesma razão; a navegação já tem a transição do sistema |
| Cartão que muda de seção (tarefa concluída) | As seções são listas separadas, então o cartão remonta e já esmaece no lugar novo. Transição de layout faria todos os cartões deslizarem a cada "Carregando..." do topo |

**Reduzir movimento.** Com o ajuste ligado no aparelho, fica só o esmaecimento (opacity). Saem o
deslocamento, a escala e o loop: o botão não encolhe, a ilustração só esmaece e não respira, o
logo do carregando fica parado. Os componentes leem `useReducedMotion()`; o esmaecimento dos
cartões e das mensagens usa `ReduceMotion.Never` justamente por ser só opacidade.

**Curvas.** Ficam em `motion.ts`. O Reanimated 4.5 rejeita o texto `'cubic-bezier(...)'`: em
estilo CSS a curva é `cubicBezier(...)`, nas animações de entrada é `Easing.bezier(...)`.

## Ilustrações

- Os SVG de origem estão em `docs/prototipo/assets/ilustracoes/`, com o `gerar.py` que exporta os
  PNG para `app/assets/images/illustrations/`. Ilustração nova nasce lá e entra no mapa de
  `illustration.tsx`.
- A ilustração é **sempre decorativa**: fica fora do leitor de tela, e o título ao lado é que diz o
  que importa.
- Só entra em tela inteira vazia (`EmptyState`) ou em momento de espera (vínculo pendente, primeiro
  acesso no início do paciente). Nunca em lista com conteúdo, e nunca em seção pequena vazia, que
  continua texto.

## Datas

Toda data em tela passa por `format-date.ts`, nunca por `toLocaleString`, que mostra segundos. A hora é a local do aparelho, como o app avisa ao usuário.

| Função | Saída |
|--------|-------|
| `formatDateTime(iso)` | `qua, 25/11 às 15:00` (o ano aparece só se não for o atual: `qua, 31/12/2025 às 23:59`) |
| `formatWeekdayDate(iso)` | `qua, 25/11`, mesma regra de ano (`qua, 31/12/2025`). Cabeçalho de dia, como na agenda do paciente |
| `formatShortDate(iso)` | `25/11`, mesma regra de ano (`31/12/2025`). "desde 24/11" no prontuário |
| `formatTaskDate(tarefa)` | `Prazo ter, 24/11`, `Sem prazo` ou, na concluída, `em qui, 19/11`. Vai ao lado da etiqueta de status (tarefas no prontuário) |
| `formatDayHeading(iso)` | `Segunda, 23/11`, mesma regra de ano. Separador de dia da conversa e data do relato no prontuário |
| `taskDeadlineTag(tarefa)` | `{ kind, label }` da etiqueta de prazo das tarefas do paciente: `hoje`, `vencida`, `até 22/11`, `sem prazo`, `feita 16/11` |
| `formatDate(iso)` | `25/11/2026` |
| `formatTime(iso)` | `15:00` |

Data sem hora (`2026-11-25`) é dia de calendário e não anda com o fuso. Valor nulo é decisão da tela ("Sem prazo", "Não informado"), por isso as funções recebem só texto.

## Texto na tela

Cada tela tem de ser entendida de relance, sem ler frase de explicação (Nielsen 6 e 8, proximidade da Gestalt, lei de Fitts).

| Regra | Antes | Depois |
|-------|-------|--------|
| **R1. Um título por tela.** Sem linha de marca e sem frase explicativa abaixo do título quando o título e o conteúdo já dizem o que é | "Calmind · Paciente", "Minhas tarefas", "Atividades combinadas com seu psicólogo." | "Minhas tarefas" |
| **R2. Zero não aparece.** Contador zerado some; maior que zero vira `badge` ou texto curto, nunca "Rótulo: valor" | "Mensagens não lidas: 0", "Tarefas vencidas: 2" | nada; "2 tarefas vencidas" |
| **R3. O que é do mesmo item fica numa linha**, separado por " · ". Status vai em `StatusTag` ao lado | "Hermione Granger" e "Online" em duas linhas, "Agendada" numa terceira | "15:00 [Agendada]" e "Hermione Granger · Online" |
| **R4. Cartão que leva a outra tela é tocável inteiro** (`ListItem`) | cartão do paciente com o botão "Abrir prontuário" dentro | o item do paciente abre o prontuário |
| **R5. Rótulo de campo curto.** O formato vai só no placeholder | rótulo "Data da consulta (DD/MM/AAAA)" | rótulo "Data", placeholder "DD/MM/AAAA" |
| **R6. Estado se mostra pela forma, não por frase.** Não lida = ponto e título forte; ativo, privado ou compartilhado = `StatusTag` | "Não lida · qua, 25/11 às 15:00"; título "Privado" | ponto e "qua, 25/11 às 15:00"; [Privado] ao lado da data |
| **R7. Ação rara não compete com o conteúdo.** Variante `secondary`, e só aparece quando tem efeito | "Marcar todas como lidas" cheio, sempre visível | contorno, só com alguma não lida |
| **R8. Data curta.** Sem ano quando é o ano atual (`formatWeekdayDate`, `formatDateTime`, `formatTaskDate`) | "Prazo: 24/11/2026" | "Prazo ter, 24/11" |

O que sai da tela e importa para quem usa leitor de tela vai para o `accessibilityLabel` do item: o "não lida" da notificação, o número de mensagens do paciente.

## Regras que os testes protegem

- **Texto sobre cor é sempre `Dark`, nunca branco.** Branco reprova o contraste de 4,5:1 (RNF-35).
- **Erro de um campo fica abaixo dele; erro do formulário inteiro fica no `ErrorBanner`, no topo.** São dois casos, como em "Campo de texto": o do campo é texto de erro sobre o fundo da tela, o do formulário é texto Dark sobre o tom claro do Danger. Sobre o cinza (`Colors.surface`) o texto de erro reprova por pouco (4,46:1), e o teste guarda essa medição.
- **Campo branco com borda Dark +1**: valor e placeholder passam 4,5:1 no branco, e a borda passa 3:1 no branco e em todo ponto do fundo das telas. A borda cinza dos cartões reprova (2,9:1) e por isso não é a do campo. O `ErrorBanner` tem texto Dark que passa sobre o tom claro do Danger.
- **Nenhum degrau da escala tipográfica desce abaixo de 14** (RNF-34).
- **Texto de botão AA e borda de contorno a 3:1** sobre o fundo da tela, em todo botão menos o `primary` neutro (item abaixo). O texto destrutivo é Danger -1, porque a base reprova no branco (3,0:1).
- **Exceção registrada: o `primary` neutro.** O teste fixa que o texto dele usa os tons -1 e que a borda usa as bases, e mede que o verde -1 reprova no branco e que as bases não chegam a 3:1. Assim a exceção não passa por acidente para outro botão. O texto sólido da web passa 4,5:1.
- **Texto, texto de apoio e erro passam em todo ponto do fundo das telas**, e Dark passa sobre o tom claro de cada lado (pílula da aba, avatar).
- **Alvo de toque de 44 pontos** em botão, item de menu e campo (RNF-35).
- **Só tema claro**: a identidade não define paleta escura.

```bash
npm test    # inclui as medições de contraste de tokens.test.ts, as datas e a etiqueta de prazo de format-date.test.ts e o agrupamento por dia de message-days.test.ts
```
