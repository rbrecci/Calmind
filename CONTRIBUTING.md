# Como contribuir no Calmind

Regra de commit e Pull Request do grupo. Vale para todo mundo, inclusive para quem só mexe em
documentação.

Ninguém aqui tinha usado PR antes deste documento. Ele foi escrito assumindo isso: explica o que
é, dá os comandos prontos e traz modelos onde você só troca os detalhes.

---

## 1. A regra, em uma frase

> **Ninguém escreve direto no `main`. Todo trabalho vai para um branch, vira PR, e outra pessoa
> do grupo aprova antes de entrar.**

Três motivos, e o terceiro é o que costuma convencer:

- **O `main` nunca quebra.** Se o seu trabalho der errado, quebra só o seu branch.
- **O grupo vê o que cada um fez** sem precisar perguntar no WhatsApp.
- **Vira prova de processo para a banca.** Histórico de PR mostra trabalho distribuído e
  revisado. Commit solto no `main` não mostra nada disso.

---

## 2. A mensagem de commit

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

### O teste para saber se a mensagem está boa

Leia assim, em voz alta:

> *"Se eu aplicar este commit, ele vai... **corrigir o contraste do botao entrar**."*

Se a frase fizer sentido, a mensagem está boa. Se ficar estranho, reescreva.

### Mensagens ruins, e por quê

| Não escreva | Motivo |
|---|---|
| `atualizacoes` | Atualização de quê? |
| `commit final` | Final de quê? Nunca é final. |
| `feat: mudanças` | Não diz nada que o `git log` já não diga sozinho |
| `Corrigi o Bug Do Botão.` | Acento, maiúscula no meio e ponto final |

---

## 3. O passo a passo

Copie e cole. Troque só o que está em MAIÚSCULO.

### Antes de começar qualquer coisa, atualize o seu main

```bash
git checkout main
git pull
```

> Faça isso **toda vez** que sentar para trabalhar. Se pular, você trabalha em cima de uma
> versão velha e depois dá conflito.

### Crie o branch do seu trabalho

```bash
git checkout -b TIPO/ASSUNTO-CURTO
```

O nome do branch usa o **mesmo tipo do commit**, barra, e o assunto em duas ou três palavras
com hífen:

```
feat/tela-relato
fix/contraste-botao
docs/cronograma-semana-6
```

### Trabalhe. Depois, salve

```bash
git add .
git commit -m "TIPO(escopo): o que mudou"
```

### Mande o branch para o GitHub

```bash
git push -u origin TIPO/ASSUNTO-CURTO
```

O terminal vai imprimir um link. **Clique nele** — ele abre o PR já preenchido pela metade.

### Depois que o PR entrar, volte para o main

```bash
git checkout main
git pull
```

---

## 4. O que é um PR, para quem nunca usou

**PR quer dizer Pull Request.** É um pedido: *"pessoal, terminei isso aqui no meu branch, deem
uma olhada e me digam se pode entrar no `main`."*

Não é prova nem cobrança. É uma página no GitHub onde ficam três coisas juntas: **o que você
fez**, **os arquivos que mudaram** e **os comentários de quem leu**.

O trabalho só entra no `main` quando alguém clica em aprovar. Até lá ele fica esperando no
branch, sem atrapalhar ninguém.

---

## 5. O modelo de PR

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

> **"O que ficou de fora" é a seção mais valiosa das quatro.** Ela evita que alguém abra o PR
> achando que está completo e descubra na apresentação que faltava metade.

---

## 6. Como revisar o PR de outra pessoa

Leva cinco minutos, não uma hora.

1. Abra o PR no GitHub e leia o corpo.
2. Clique na aba **"Files changed"**. Verde é o que entrou, vermelho é o que saiu.
3. Faça o que está escrito em **"Como conferir"**.
4. Escolha uma das três:

| Situação | O que fazer |
|---|---|
| Está bom | Aprovar, com um comentário curto: *"conferi as 4 telas, pode entrar"* |
| Tem algo errado | Comentar **na linha** onde está o problema, dizendo o que mudar |
| Não entendi | Perguntar. Não aprove o que você não entendeu |

**Você não precisa entender o código todo para revisar.** Se o PR é de documentação, leia o
texto. Se é de tela, olhe a tela. Revisar é conferir se a entrega bate com o que o PR prometeu.

---

## 7. Regras de convivência

1. **Um PR, um assunto.** Mexeu nas telas e no cronograma? São dois PRs. PR misturado ninguém
   consegue revisar.
2. **PR pequeno é aprovado rápido; PR gigante fica parado.** Prefira três PRs de quatro telas a
   um PR de doze.
3. **Precisa de uma aprovação** de outra pessoa do grupo. Não aprove o seu próprio.
4. **Quem abre o PR é quem faz o merge**, depois de aprovado. Assim ninguém entra em cima de
   trabalho que o autor ainda estava ajustando.
5. **PR parado mais de um dia?** Cobre no grupo. PR parado atrasa todo mundo.
6. **Deu conflito? Não force nada.** Chame no grupo. Conflito resolvido às pressas apaga
   trabalho dos outros.

---

## 8. Configuração inicial, uma vez por pessoa

Hoje o histórico tem a mesma pessoa aparecendo com dois nomes diferentes. Rode uma vez na sua
máquina:

```bash
git config --global user.name "SEU NOME COMPLETO"
git config --global user.email "SEU EMAIL DO GITHUB"
```

> **Um lembrete que vale para o grupo todo:** metade das pessoas ainda não tem nenhum commit
> aqui. Para a banca, um repositório com trabalho de três pessoas parece um projeto de três
> pessoas, independentemente de quem fez o quê fora do Git. Trabalho feito em Figma, Miro ou
> Word também deve virar pelo menos um commit de documentação, feito por quem fez.

---

## 9. Cola rápida

```bash
git checkout main && git pull                  # 1. atualiza
git checkout -b feat/assunto-curto             # 2. cria o branch
# ... trabalha ...
git add .                                      # 3. seleciona
git commit -m "feat(escopo): o que mudou"      # 4. salva
git push -u origin feat/assunto-curto          # 5. envia, e clica no link
```

**Tipos:** `feat` novo · `fix` correção · `docs` documentação · `chore` arrumação

**Sempre:** minúscula, sem acento, sem ponto final, no máximo 70 caracteres
