# Divisão de trabalho

**Quem é dono de quê, na Sprint 2.** Fechada em 02/10/2026.

Este arquivo existe por um motivo prático: as quatro pessoas que codificam usam ferramenta de IA, e
isso produz muito código em pouco tempo. Sem dono declarado por arquivo, dois assistentes reescrevem
o mesmo `Controller` na mesma tarde e ninguém percebe até o merge.

---

## 1. As frentes

| Pessoa | Frente | Papel |
|--------|--------|-------|
| **Rafael Brecci** | Backend: fundação, blocos A, D e E | Product Owner |
| **Eduardo Zanetti** | Backend: blocos B, C e F, mais o painel admin | Dev backend |
| **Caio Yuri** | App React Native: fundação, design system e telas | Scrum Master |
| **Mariana Chaves** | Landing page, até a entrega | Dev |
| **Nicoly Ribeiro** | Slides (prioridade) e documento ABNT | Documentação |
| **Isabela Puzenato** | Slides (prioridade) e documento ABNT | Documentação |

---

## 2. Backend: os seis blocos

A divisão é **por bloco vertical, não por camada.** "Um faz Controllers, outro faz Models" colocaria
os dois no mesmo arquivo toda hora. Bloco inteiro por pessoa — migration, Model, FormRequest,
Controller, arquivo de rota e teste — significa arquivos disjuntos.

| Bloco | O que é | RF | Dono | Arquivo de rota |
|-------|---------|----|------|-----------------|
| **A** | Autenticação por token e `/me` | RF-01, 02, 05 | Rafael | `routes/api/auth.php` |
| **B** | Consentimento versionado | RF-03, 04 | Zanetti | `routes/api/consent.php` |
| **C** | Cadastro com CRP, aprovação e **painel admin** | RF-33, 34, 44 | Zanetti | `routes/api/psychologist.php` + `web.php` |
| **D** | Convite e vínculo, 1 ativo por paciente | RF-06 a 13 | Rafael | `routes/api/bonds.php` |
| **E** | Relato com privacidade na camada de dados | RF-22, 23, 24 | Rafael | `routes/api/reports.php` |
| **F** | Tarefas, CRUD completo | RF-25, 37 | Zanetti | `routes/api/tasks.php` |

**Por que o bloco E é do PO:** é o núcleo ético do produto e carrega o teste do RNF-08, que é o
único teste do projeto que verifica uma promessa, não uma função. É o que a banca olha primeiro.

**Por que o bloco C é o mais pesado do Zanetti:** ele carrega o painel admin em Blade, e é o painel
que prova web e mobile sobre o mesmo banco — o critério escrito no RNF-61. Com o app tendo uma
pessoa só, **o painel passa a ser a prova robusta de integração ponta a ponta da entrega.**

---

## 3. A fundação, que não paraleliza

Antes de qualquer bloco, alguém precisa criar o terreno. **Isso é uma pessoa, sozinha.** Dois
assistentes de IA na mesma fundação produzem duas fundações incompatíveis em duas horas, e cada um
produz rápido demais para o outro acompanhar.

| Fundação | Dono | O que inclui |
|----------|------|--------------|
| Backend | **Rafael** | Projeto Laravel, Sanctum, as 25 migrations, a view `shared_reports`, seeders, handler de erro, Model base (data), Collection base (`meta`), `api.php` |
| App | **Caio** | Projeto RN, decisão FE-01, navegação por papel, módulo de API com a chave de mock, armazenamento seguro do token, **design system** |

**O que o Zanetti faz enquanto a fundação do backend acontece:** a **v2 do contrato da API** e as
requisições do Postman do bloco F. A coleção atual para no bloco E, e o bloco F não tem contrato
nem teste — ou seja, hoje ele não tem critério de pronto. Trabalho útil, arquivos disjuntos, zero
colisão com a fundação.

---

## 4. Arquivos compartilhados, e a regra sobre eles

Quase nada é compartilhado, de propósito. O que é:

| Arquivo | Quem escreve | Regra |
|---------|-------------|-------|
| `routes/api.php` | Rafael, na fundação | Escrito uma vez, não se toca mais |
| Model base, Collection base, handler de erro | Rafael, na fundação | Mudança aqui afeta os dois: avisa antes |
| `composer.json` | Quem precisar de pacote | Avisa no grupo, porque gera conflito de `lock` |
| `.env.example` | Quem adicionar configuração | Nunca com valor preenchido |
| Design system do app | Caio, na fundação | Componente novo entra nele, não ao lado dele (RNF-34) |

**A regra, em uma frase: você não edita arquivo do bloco de outra pessoa.** Precisa de uma mudança
lá? Pede. Toma dois minutos e evita o merge que ninguém sabe resolver.

---

## 5. Frontend e landing

| Pessoa | Escopo | Observação |
|--------|--------|------------|
| Caio | Fundação, design system e todas as telas dos blocos A, B, D, E e F | Trabalha com **mock** até a etapa de primeira conexão |
| Mariana | Landing page, estrutura ao conteúdo ao responsivo | Até a entrega |

**Duas consequências registradas, para ficarem explícitas no documento:**

1. O app fica com **uma pessoa**, e ninguém no grupo tem experiência prévia com React Native. Por
   isso a lista de etapas marca o mínimo do app — login real e uma tela de CRUD consumindo a API —
   como item que não se corta.
2. A **landing não é entregável da Sprint 2** (ela está na semana 11 do cronograma, Sprint 3). É
   trabalho adiantado, não trabalho que pontua nos três itens obrigatórios desta entrega. Decisão
   do grupo, registrada.

A landing herda as restrições do catálogo, que não são preferência do grupo e sim exigência do
Conselho Federal de Psicologia: sem preço, sem promoção, sem nota, sem ranking, sem promessa de
resultado terapêutico. O contexto está em [`../../landing/README.md`](../../landing/README.md).

---

## 6. Documentação

| Pessoa | Prioridade 1 | Prioridade 2 |
|--------|-------------|--------------|
| Nicoly | Slides da Sprint 1 finalizados e esqueleto dos da Sprint 2 | Documento ABNT |
| Isabela | idem | idem |

**Dois pontos de atenção, sem rodeio:**

O **documento ABNT é entregável obrigatório** desta sprint; os slides são da Sprint 3, semana 10 do
cronograma. A prioridade escolhida é do grupo, mas o documento precisa estar pronto no dia 23/10 de
qualquer forma.

E o documento **hoje vive fora do repositório** — `docs/documento-final/` tem só um README. Ele
precisa ser versionado lá, em PDF ou Word, antes da entrega: é entregável e é a forma de o trabalho
das duas aparecer no histórico de contribuição, que é item avaliado.

Idem para os slides, em `docs/apresentacao/`.

---

## 7. Histórico de contribuição, que é item avaliado

A atividade pede "histórico de commits e/ou relatório de contribuição de **todos** os integrantes".
O retrato em 02/10/2026:

| Pessoa | Commits |
|--------|---------|
| Rafael | 37 |
| Zanetti | 5 |
| Mariana | 5 |
| Caio | 2 |
| Nicoly | 2 |
| **Isabela** | **0** |

A solução não é commit cosmético: é cada pessoa ter uma frente própria chegando no `main` por PR,
que é exatamente o que a divisão acima garante. Trabalho de documentação e de slides commitado nas
pastas de `docs/` conta igual a código.

O [log de etapas](../planejamento/etapas-sprint2.md) registra quem concluiu o quê e quando, e serve
de relatório de contribuição pronto na hora da entrega.
