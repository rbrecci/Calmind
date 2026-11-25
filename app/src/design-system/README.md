# Design system

Fonte de verdade: [`docs/identidade-visual.md`](../../../docs/identidade-visual.md). Onde este código e o documento divergirem, o documento vence.

**Toda tela importa daqui** (`import { Button, Screen, Text } from '@/design-system'`) e nunca usa `Text`, `TextInput` ou cor solta do React Native. Componente novo entra neste diretório, não ao lado dele (RNF-34).

| Arquivo | O que tem |
|---------|-----------|
| `tokens.ts` | Paleta (6 famílias × 3 tons), cores semânticas, cor de cada lado, cores de etiqueta de status, gradiente, espaçamento |
| `typography.ts` | Escala H1 a H5, parágrafo e small, com Quicksand SemiBold e Poppins |
| `fonts.ts` | Carrega as fontes empacotadas no app |
| `text.tsx`, `button.tsx`, `text-field.tsx`, `screen.tsx`, `list-item.tsx` | Componentes base |
| `choice-group.tsx` | Escolha de uma opção entre poucas, em chips; a escolhida fica cheia na cor do lado |
| `message-composer.tsx` | Rodapé das conversas: campo e botão "Enviar" na mesma linha |
| `format-date.ts` | Formatação de data e hora para tela, na hora local do aparelho, e a linha de prazo da tarefa (`formatTaskDate`) |
| `counts.ts` | Contagem de não lidas em texto (`formatUnread`) e contador de aba (`tabBadge`) |
| `confirmation.ts` | Variante dos botões de uma confirmação, comum ou destrutiva |
| `status-tag.tsx`, `status-kind.ts` | Status de consulta, tarefa, relato ou vínculo em pílula de fundo claro; `statusTagKind` diz o tipo (neutro, atenção, positivo, negativo) |
| `logo.tsx` | O símbolo da Calmind (`Logo`), decorativo; `animated` faz a entrada única do login |
| `illustration.tsx` | Ilustração decorativa por nome (`Illustration`), 360:260, que entra e depois respira devagar |
| `empty-state.tsx` | Tela inteira vazia (`EmptyState`): ilustração, título curto, descrição e ação opcionais |
| `loading.tsx` | Carregando de tela inteira (`Loading`): logo pequeno pulsando e o texto "Carregando" |
| `appear.tsx` | `Appear`, caixa que esmaece ao montar (cartões; `rise` sobe 8 pontos, nas mensagens), e `SkipInitialAppear`, que deixa parado o que já estava ali |
| `motion.ts` | Curvas de movimento (ease-out e ease-in-out) nos dois formatos que o Reanimated pede |

## Tela: conteúdo começa no topo

`Screen` põe o conteúdo a partir do topo. `center` centraliza na vertical e serve só para tela de conteúdo único e curto (carregando, aviso de espera). Em lista ou formulário, centralizar deixa a metade de cima vazia quando há pouco item.

A área segura do aparelho entra só onde ninguém mais a desconta: a de cima, quando a tela não tem cabeçalho; a de baixo, quando a tela não está numa aba. Aplicada duas vezes, ela deixa uma faixa branca que corta o conteúdo rolado, e isso só aparece no celular, não na web.

As outras props valem com `scroll`:

| Prop | O que faz | Quem usa |
|------|-----------|----------|
| `refreshing`, `onRefresh` | Arrastar para baixo recarrega a tela (`RefreshControl`). Substitui botão de "Atualizar"; o "Tentar de novo" do erro continua na tela | Início, tarefas e agenda do paciente |
| `footer` | Fica fixo embaixo, fora da rolagem e acima do teclado (`KeyboardAvoidingView`). Numa aba ele para acima da barra de abas | Campo de mensagem das duas conversas |
| `stickToEnd` | Rolagem abre no fim e volta para ele quando o conteúdo cresce ou o teclado abre | As duas conversas |

```tsx
<Screen scroll stickToEnd footer={<MessageComposer tone="patient" value={draft} onChangeText={setDraft} onSend={send} />}>{mensagens}</Screen>
```

## Qual botão usar

| Variante | Visual | Quando usar | Exemplo |
|----------|--------|-------------|---------|
| `primary` (padrão) | Cheio na cor do lado (`tone`) ou no gradiente | A ação principal da tela. Uma por tela, de preferência | Entrar, Salvar, Aceito, Confirmar |
| `secondary` | Contorno Dark +1, texto Dark | Ação alternativa, que não destrói nada | Voltar, Cancelar edição, Sair da conta, Tentar de novo |
| `destructive` | Contorno e texto Danger -1 | Ação que encerra, apaga ou recusa algo, e o botão que confirma essa ação | Encerrar vínculo, Cancelar consulta, Recusar, Não aceito |

- Sem `variant`, o botão é `primary`: os usos antigos não mudam.
- `secondary` e `destructive` ignoram o `tone`. As cores de lado reprovam como texto ou borda sobre o branco, então o contorno é neutro nos dois lados.
- Destrutivo é contorno, não cheio, para não competir com a ação principal. Ação destrutiva pede confirmação antes de executar.
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
| `formatTaskDate(tarefa)` | `Prazo ter, 24/11`, `Sem prazo` ou, na concluída, `em qui, 19/11`. Vai ao lado da etiqueta de status |
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
- **Mensagem de erro fica abaixo do campo**, no fundo branco. Dentro do cinza do campo ela reprova por pouco (4,46:1).
- **Nenhum degrau da escala tipográfica desce abaixo de 14** (RNF-34).
- **Texto de botão AA e borda de contorno a 3:1** sobre o fundo da tela. O texto destrutivo é Danger -1, porque a base reprova no branco (3,0:1).
- **Alvo de toque de 44 pontos** em botão, item de menu e campo (RNF-35).
- **Só tema claro**: a identidade não define paleta escura.

```bash
npm test    # inclui as medições de contraste de tokens.test.ts e as datas de format-date.test.ts
```
