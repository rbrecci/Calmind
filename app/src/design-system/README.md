# Design system

Fonte de verdade: [`docs/identidade-visual.md`](../../../docs/identidade-visual.md). Onde este código e o documento divergirem, o documento vence.

**Toda tela importa daqui** (`import { Button, Screen, Text } from '@/design-system'`) e nunca usa `Text`, `TextInput` ou cor solta do React Native. Componente novo entra neste diretório, não ao lado dele (RNF-34).

| Arquivo | O que tem |
|---------|-----------|
| `tokens.ts` | Paleta (6 famílias × 3 tons), cores semânticas, cor de cada lado, gradiente, espaçamento |
| `typography.ts` | Escala H1 a H5, parágrafo e small, com Quicksand SemiBold e Poppins |
| `fonts.ts` | Carrega as fontes empacotadas no app |
| `text.tsx`, `button.tsx`, `text-field.tsx`, `screen.tsx`, `list-item.tsx` | Componentes base |
| `format-date.ts` | Formatação de data e hora para tela, na hora local do aparelho |
| `counts.ts` | Contagem de não lidas em texto (`formatUnread`) e contador de aba (`tabBadge`) |
| `confirmation.ts` | Variante dos botões de uma confirmação, comum ou destrutiva |

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
<Screen scroll stickToEnd footer={<Button label="Enviar mensagem" onPress={send} />}>{mensagens}</Screen>
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

## Datas

Toda data em tela passa por `format-date.ts`, nunca por `toLocaleString`, que mostra segundos. A hora é a local do aparelho, como o app avisa ao usuário.

| Função | Saída |
|--------|-------|
| `formatDateTime(iso)` | `qua, 25/11 às 15:00` (o ano aparece só se não for o atual: `qua, 31/12/2025 às 23:59`) |
| `formatWeekdayDate(iso)` | `qua, 25/11`, mesma regra de ano (`qua, 31/12/2025`). Cabeçalho de dia, como na agenda do paciente |
| `formatDate(iso)` | `25/11/2026` |
| `formatTime(iso)` | `15:00` |

Data sem hora (`2026-11-25`) é dia de calendário e não anda com o fuso. Valor nulo é decisão da tela ("Sem prazo", "Não informado"), por isso as funções recebem só texto.

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
