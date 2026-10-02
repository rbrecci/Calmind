# Definição de pronto

**O que significa "acabei".** Sem isso, "acabei" quer dizer coisa diferente para cada pessoa.

O projeto tem uma vantagem rara aqui: o critério de pronto **já existia antes do código**. A coleção
[`../api/Calmind.postman_collection.json`](../api/Calmind.postman_collection.json) traz 42
requisições com 104 asserções, escritas na Sprint 1. Enquanto o backend não existir, tudo fica
vermelho. Cada endpoint entregue acende um verde.

---

## 1. Bloco do backend

Um bloco está pronto quando as cinco linhas valem:

| # | Critério |
|---|----------|
| 1 | A **pasta correspondente da coleção do Postman está verde**, rodada pelo Runner |
| 2 | O teste de feature do bloco passa, **incluindo os casos negativos** |
| 3 | O `pint` passou e não há identificador fora do inglês (RNF-52) |
| 4 | O PR foi aberto no modelo do `CONTRIBUTING.md` e revisado por outra pessoa |
| 5 | A etapa foi registrada no [log](../planejamento/etapas-sprint2.md) com data |

As pastas e seus donos:

| Pasta da coleção | Bloco | Dono |
|------------------|-------|------|
| `01 Conta e autenticacao` | A | Rafael |
| `02 Consentimento` | B | Zanetti |
| `03 Cadastro profissional e aprovacao` | C | Zanetti |
| `04 Convite e vinculo` | D | Rafael |
| `05 Relatos e a garantia de privacidade` | E | Rafael |
| ainda não existe | F | Zanetti escreve, na primeira etapa |

**O bloco F não tem pasta ainda**, porque o contrato v1 para no bloco E. Escrever a v2 do contrato e
as requisições de tarefas é a primeira etapa do Zanetti — sem isso o bloco F não tem critério de
pronto, e bloco sem critério de pronto nunca está pronto.

---

## 2. O bloco E tem um critério a mais

O bloco E não está pronto só com a pasta verde. Ele exige o **teste automatizado do RNF-08**, que é
o teste mais importante do projeto inteiro porque é o único que verifica uma promessa ética em vez
de uma função.

Ele prova três coisas:

| Prova | O que verifica |
|-------|----------------|
| a | Para cada consulta disponível ao perfil psicólogo, com massa contendo relato privado e compartilhado, nenhum identificador de relato privado aparece — **inclusive em campo de contagem e agregação** |
| b | A rotina que monta o pacote enviado à IA só contém relato compartilhado (Sprint 3, mas a estrutura já não pode permitir o contrário) |
| c | Toda rotina de exportação passa pela mesma comparação |

E tem uma propriedade que vale escrever: **a suíte falha se uma consulta nova do perfil psicólogo
for adicionada sem caso de teste correspondente.** Não é teste que se escreve e esquece.

Duas requisições da coleção já cobrem isso e têm nome explícito:
`PROVA RNF-08: psicologo nao ve o relato privado` e
`PROVA CA-23.5: acesso direto ao relato privado`.

---

## 3. Tela do app

| # | Critério |
|---|----------|
| 1 | Bate com o PDF correspondente em [`../prototipo/telas-pdf/`](../prototipo/telas-pdf/) |
| 2 | Usa só componentes do design system, sem hex solto e sem componente criado ao lado (RNF-34) |
| 3 | Alvo de toque de **44 pontos** e rótulo de acessibilidade em todo controle (RNF-35) |
| 4 | Funciona com o mock, no formato exato do contrato |
| 5 | Nenhuma regra de negócio na tela (RNF-57) |
| 6 | Depois da primeira conexão: funciona contra a API real |

A tela 14, de novo porque importa: o marcador compartilhado/privado **visível sem rolagem**, padrão
em compartilhado (RNF-37, DEC-13).

---

## 4. Página da landing

| # | Critério |
|---|----------|
| 1 | Responsiva, conferida em largura de celular |
| 2 | Usa a paleta e a tipografia de [`../identidade-visual.md`](../identidade-visual.md) |
| 3 | **Sem preço, sem promoção, sem nota, sem estrela, sem ranking, sem promessa de resultado** (RNF-21, RNF-23) |
| 4 | Se citar profissional: nome completo e CRP, por força do art. 20 do Código de Ética |
| 5 | Declara que o projeto é acadêmico e opera só com dados fictícios (RNF-63) |

---

## 5. Seção do documento ABNT

| # | Critério |
|---|----------|
| 1 | Está no documento, não num rascunho à parte |
| 2 | Figura numerada e citada no texto, nunca imagem solta |
| 3 | Versionada em `docs/documento-final/` |
| 4 | Tem parágrafo de abertura dizendo o que o leitor está vendo |

---

## 6. Evidência de teste: a parte que quase todo grupo erra

A atividade pede "relatório das evidências dos primeiros testes executados". Isso não é a descrição
do teste: é a **saída datada da execução**.

A cada bloco concluído:

1. Rode a pasta no Runner do Postman.
2. Exporte o resultado.
3. Salve em `docs/testes/` com data no nome, por exemplo
   `2026-10-09-postman-bloco-a.json`.

O mesmo vale para a prova do modelo em
[`../diagramas/testes-do-modelo.sql`](../diagramas/testes-do-modelo.sql), cuja saída é evidência
dupla: prova o isolamento do relato privado na camada de dados **e**, como lê o banco por fora da
aplicação, prova a cifra em repouso do RNF-02 de graça.

> **Relatório de teste sem evidência de execução é redação.** Guarde a saída de cada rodada com
> data, desde a primeira.

---

## 7. A entrega inteira

Os três itens obrigatórios da atividade, com o que cada um exige:

| Item | Pronto quando |
|------|---------------|
| **Repositório** | Código de backend e frontend no `main`; README com visão geral, tecnologias e **instruções de execução**; histórico com commit de todos os seis integrantes |
| **Documentação ABNT** | Capa, folha de rosto e sumário; arquitetura e diagramas atualizados; seção de programação com as principais rotas e módulos; relatório de evidências dos testes. Em PDF ou Word, versionado |
| **Aplicação funcional** | Interface responsiva e acessível; comunicação app e painel contra backend e banco; CRUD integrado demonstrável |

A seção "instruções de execução" do README só pode existir depois do código, e ela sai quase direto
do [`setup-backend.md`](setup-backend.md) e do [`setup-frontend.md`](setup-frontend.md). Não escreva
duas vezes: aponte.
