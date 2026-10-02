# Design system

Fonte de verdade: [`docs/identidade-visual.md`](../../../docs/identidade-visual.md). Onde este código e o documento divergirem, o documento vence.

**Toda tela importa daqui** (`import { Button, Screen, Text } from '@/design-system'`) e nunca usa `Text`, `TextInput` ou cor solta do React Native. Componente novo entra neste diretório, não ao lado dele (RNF-34).

| Arquivo | O que tem |
|---------|-----------|
| `tokens.ts` | Paleta (6 famílias × 3 tons), cores semânticas, cor de cada lado, gradiente, espaçamento |
| `typography.ts` | Escala H1 a H5, parágrafo e small, com Quicksand SemiBold e Poppins |
| `fonts.ts` | Carrega as fontes empacotadas no app |
| `text.tsx`, `button.tsx`, `text-field.tsx`, `screen.tsx` | Componentes base |

## Regras que os testes protegem

- **Texto sobre cor é sempre `Dark`, nunca branco.** Branco reprova o contraste de 4,5:1 (RNF-35).
- **Mensagem de erro fica abaixo do campo**, no fundo branco. Dentro do cinza do campo ela reprova por pouco (4,46:1).
- **Nenhum degrau da escala tipográfica desce abaixo de 14** (RNF-34).
- **Alvo de toque de 44 pontos** em botão e campo (RNF-35).
- **Só tema claro**: a identidade não define paleta escura.

```bash
npm test    # inclui as medições de contraste de tokens.test.ts
```
