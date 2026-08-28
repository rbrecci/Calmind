# Como contribuir no Calmind

Regra de commit e Pull Request do grupo. Vale para todo mundo, inclusive para quem só mexe em
documentação.

Ninguém aqui tinha usado PR antes deste documento. Ele foi escrito assumindo isso: explica o que
é, dá os comandos prontos e traz modelos onde você só troca os detalhes.

---

## 1. A mensagem de commit

### O modelo

```
tipo(escopo): o que mudou, em minusculo e sem ponto final
```

Exemplo real, já no repositório:

```
feat(prototipo): 16 wireframes do fluxo principal, mobile-first
```

### Os quatro tipos. Não invente outros

| Tipo | Quando usar | Exemplo |
|---|---|---|
| `feat` | Criou algo novo | `feat(figma): telas 1 a 4 do fluxo de entrada` |
| `fix` | Corrigiu algo errado | `fix(prototipo): contraste do botao entrar` |
| `docs` | Mexeu só em documentação | `docs: atualiza cronograma da semana 6` |
| `chore` | Arrumação, limpeza, organização de pastas | `chore: remove arquivos de teste antigos` |

### O escopo é opcional

Diz **onde** você mexeu. Use uma destas, que são as pastas que já existem:

`prototipo` · `api` · `pesquisa` · `modelagem` · `planejamento` · `figma`

Se mexeu em várias, deixe sem escopo.

### Três regras que valem sempre

1. **Sem acento.** É o padrão que já está em todos os commits do repositório. Evita texto
   embaralhado no terminal do Windows. Escreva `prototipo`, `documentacao`, `usuario`.
2. **Tudo minúsculo, sem ponto final.**
3. **No máximo 70 caracteres**, que é o que cabe na tela do GitHub sem cortar.

### Mensagens ruins, e por quê

| Não escreva | Motivo |
|---|---|
| `atualizacoes` | Atualização de quê? |
| `commit final` | Final de quê? Nunca é final. |
| `feat: mudanças` | Não diz nada que o `git log` já não diga sozinho |
| `Corrigi o Bug Do Botão.` | Acento, maiúscula no meio e ponto final |

---

## 2. O modelo de PR

**Título do PR:** exatamente igual à mensagem do commit principal.

```
feat(figma): telas 1 a 4 do fluxo de entrada
```

**Corpo do PR:** este repositório tem um modelo automático em
[`.github/pull_request_template.md`](.github/pull_request_template.md). Quando você abrir o PR,
ele já vem preenchido com as quatro perguntas abaixo — é só responder.

```markdown
## O que fiz
DUAS OU TRES LINHAS, EM PORTUGUES NORMAL, DIZENDO O QUE MUDOU.

## Por que
QUAL DECISAO, REQUISITO OU TAREFA DO MIRO ISSO ATENDE.

## Como conferir
ONDE A PESSOA OLHA PARA VER SE FICOU BOM.

## O que ficou de fora
O QUE EU SABIA QUE FALTAVA E DEIXEI PARA DEPOIS.
Se nao ficou nada de fora, escreva "nada".
```

### Exemplo preenchido

```markdown
## O que fiz
Montei as telas 1 a 4 no Figma, mais o estado de erro do login.
Todas as cores estao amarradas aos estilos, nenhuma tem hex solto.

## Por que
Tarefa de quinta, frente de telas. A tela 1 refaz o login sob as
regras novas de cor.

## Como conferir
Abrir o Figma e olhar os frames 01, 1b, 02, 03 e 04, a direita
do frame Logos.

## O que ficou de fora
As telas do psicologo. Entram no proximo PR.
```

---
