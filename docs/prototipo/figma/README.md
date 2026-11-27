# Scripts de montagem das telas no Figma

**As telas já foram montadas (27/08/2026). Estes scripts criam telas novas, não atualizam as existentes: rodar de novo duplica tudo.** O protótipo vigente é o [de 25/11](../telas-25-11/), feito depois. A pasta serve para reconstruir do zero ou consultar como foi feito.

Arquivo do Figma: `lpg2qDhPuOmKfvLAPFOVKA`. Regras de cor e tipografia: [identidade visual](../../identidade-visual.md), seções 5 e 6.

## Como disparar

```bash
node docs/prototipo/figma/verificar.js
```

Se reprovar, não gaste cota. Cada chamada é o conteúdo de um arquivo no parâmetro `code` do `use_figma`, nesta ordem:

| Ordem | Arquivo | Leva `_preludio.js` na frente? | O que faz |
|---|---|---|---|
| 1 | `00-diagnostico-e-quicksand.js` | não | Diagnóstico do arquivo. Leia `naoResolvidos` no retorno antes de seguir |
| 2 | `01-telas-1a4.js` | sim | Entrada, erro, consentimento, onboarding, convite |
| 3 | `02-telas-5a8.js` | sim | Catálogo, perfil, início do paciente, novo relato |
| 4 | `03-telas-9a11.js` | sim | Tarefas, conversa, agenda |
| 5 | `04-telas-12a14.js` | sim | Cadastro com CRP, pacientes, prontuário |
| 6 | `05-telas-cadastro.js` | sim | Escolha de perfil e cadastro |
| 7 | `06-interacoes.js` | não, e por último | 41 ligações. Depende de IDs de nó |

Depois de cada chamada, tire um screenshot: o simulador pega erro de código, não sobreposição nem texto apertado.

**Armadilha:** `textAutoResize = 'HEIGHT'` trava a largura que o nó tem naquele instante, e um nó novo tem largura zero. Escreva o texto e pendure no pai antes de mudar o modo.

## IDs dos frames montados em 27/08

| Frame | Tela | Frame | Tela |
|---|---|---|---|
| `70:2` | 01 Entrada | `71:80` | 07 Início do paciente |
| `70:29` | 1b Entrada, erro | `71:122` | 08 Novo relato |
| `100:2` | 01c Escolha de perfil | `72:2` | 09 Tarefas |
| `100:24` | 01d Cadastro, paciente | `72:46` | 10 Conversa |
| `100:58` | 01e Cadastro, psicólogo | `72:70` | 11 Agenda |
| `70:53` | 02 Consentimento | `73:2` | 12 Cadastro com CRP |
| `70:83` | 03 Como você chegou aqui | `73:25` | 13 Lista de pacientes |
| `70:96` | 04 Código de convite | `73:61` | 14 Prontuário |
| `71:2` | 05 Catálogo | | |
| `71:49` | 06 Perfil e vínculo | | |

**Numeração:** o [`wireframes.html`](../wireframes.html) tem 16 telas porque inclui "Meus relatos" e "Resumo da semana". Da 9 em diante os números divergem destes: compare pelo nome.
