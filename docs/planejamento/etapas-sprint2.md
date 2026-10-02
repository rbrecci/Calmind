# Etapas da Sprint 2

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
**Calmind** — Saúde Mental & Acolhimento
Montado em 02/10/2026. Entrega em **23/10/2026**.

> **Este plano não tem datas internas, e isso é de propósito.** Decisão do grupo em 02/10/2026:
> planejar etapas, não dias. Quando uma etapa fecha, registra-se a data no log da seção 8 e passa-se
> para a seguinte. O que sai disso é um histórico real do que aconteceu, em vez de um calendário que
> se descola da realidade na primeira semana — foi exatamente o que aconteceu com o
> [`cronograma.md`](cronograma.md), montado sobre uma entrega da Sprint 1 em 21/08 que virou 24/09.
>
> **O que o plano por etapas não muda:** o dia 23/10 é fixo. Por isso a coluna *mínimo* existe —
> para que, se o tempo apertar, o corte seja escolha consciente e não descoberta de última hora.

---

## 1. O que esta sprint entrega

Três peças, um backend só:

| Peça | Quem | O que é |
|------|------|---------|
| **Backend Laravel + MySQL** | Rafael e Zanetti | API `/api/v1` sobre as 25 tabelas do `schema.sql` |
| **Painel do administrador** | Zanetti | Blade + Bootstrap, dentro do mesmo Laravel |
| **App React Native** | Caio | Telas por papel, começando com mock |
| Landing page | Mariana | Trabalho adiantado da Sprint 3 |

Escopo funcional: blocos **A a F**, detalhados em
[`../engenharia/divisao-de-trabalho.md`](../engenharia/divisao-de-trabalho.md).

**Fora do escopo, cortado de forma consciente e declarada no documento:** chat (RF-15), agenda
(RF-26), medicação inteira, análise por IA, prontuário consolidado e auditoria. Tudo já era Sprint 3
ou estava na borda.

---

## 2. A regra que faz isto funcionar

**Uma etapa = um PR = uma linha no log.**

Etapa não tem data de início nem de fim planejada. Tem **dono**, **pré-requisito** e **critério de
pronto**. Quando o critério é atendido, o PR entra no `main` e a data vai para o log.

O critério de pronto de cada tipo de etapa está em
[`../engenharia/definicao-de-pronto.md`](../engenharia/definicao-de-pronto.md).

---

## 3. Backend

| Etapa | O que é | Dono | Pré-requisito | Pronto quando | Mínimo |
|-------|---------|------|---------------|---------------|:------:|
| **B0** | **Fundação.** Projeto Laravel, Sanctum, as 25 migrations, a view `shared_reports`, seeders, handler de erro, Model base com a data do contrato, Collection base com o `meta` do contrato, `api.php` | Rafael | — | `migrate --seed` roda limpo e a API sobe | **sim** |
| **Z0** | **Contrato v2 e Postman do bloco F.** As requisições de tarefas não existem na coleção; sem elas o bloco F não tem critério de pronto | Zanetti | — | Contrato atualizado e requisições na coleção | **sim** |
| **B1** | **Bloco A** · autenticação por token e `/me` | Rafael | B0 | Pasta `01 Conta e autenticacao` verde | **sim** |
| **Z1** | **Bloco B** · consentimento versionado | Zanetti | B0 | Pasta `02 Consentimento` verde | não |
| **Z2** | **Bloco C** · cadastro com CRP, aprovação e **painel admin em Blade** | Zanetti | B0 | Pasta `03 Cadastro profissional` verde e painel navegável | **sim** |
| **B2** | **Bloco D** · convite e vínculo, com a regra de 1 ativo no banco | Rafael | B0 | Pasta `04 Convite e vinculo` verde, segundo vínculo ativo devolvendo 409 | **sim** |
| **B3** | **Bloco E** · relato com privacidade na camada de dados | Rafael | B0, B2 | Pasta `05 Relatos` verde **e o teste do RNF-08 passando** | **sim** |
| **Z3** | **Bloco F** · tarefas, CRUD completo | Zanetti | B0, Z0 | Pasta do bloco F verde | **sim** |

**B0 é a única etapa que trava todas as outras do backend**, e é a que não paraleliza: duas pessoas
com dois assistentes nela produzem duas fundações incompatíveis. O Z0 existe para o Zanetti produzir
trabalho útil nesse intervalo, em arquivos que não cruzam com a fundação.

**Por que Z1 não é mínimo:** o consentimento é Must (RNF-12) e precisa existir, mas numa demonstração
o aceite pode vir do seeder. O que não se corta é o registro existir na base antes de qualquer dado
clínico ser gravado.

---

## 4. App React Native

| Etapa | O que é | Dono | Pré-requisito | Pronto quando | Mínimo |
|-------|---------|------|---------------|---------------|:------:|
| **F0** | **Fundação.** Decisão FE-01 (Expo ou CLI), projeto, navegação por papel, módulo de API com a chave de mock, armazenamento seguro do token, **design system** a partir da identidade visual | Caio | — | App abre, navega entre papéis, design system em arquivo | **sim** |
| **F1** | Telas do **bloco A**: entrada, erro de login, escolha de perfil, cadastro do paciente (telas 01 a 04) | Caio | F0 | Telas batem com o PDF, rodando com mock | **sim** |
| **F2** | Tela de **consentimento** (06) e telas do **bloco D**: como você chegou aqui, código de convite, catálogo, perfil e vínculo (07 a 10) | Caio | F0 | idem | não |
| **F3** | **Novo relato** (14), tarefas (15) e início do paciente (12) | Caio | F0 | idem, com o marcador de privacidade visível sem rolagem | não |

O app tem **uma pessoa**, e ninguém no grupo tem experiência prévia com React Native. Por isso o
mínimo do app é deliberadamente curto: fundação, as telas de entrada e a primeira conexão
funcionando. O resto é ganho, não obrigação.

Se F2 ou F3 caírem, o **painel admin em Blade** (Z2) continua provando interface responsiva e
integração ponta a ponta — é o seguro desta sprint.

---

## 5. Integração

| Etapa | O que é | Dono | Pré-requisito | Pronto quando | Mínimo |
|-------|---------|------|---------------|---------------|:------:|
| **I0** | **Primeira conexão.** Login real do app contra a API e o banco. Decidir DA-01 (IP da LAN, túnel ou emulador) e DA-03 aqui | Caio e Rafael | B1, F1 | Login no app autentica contra o banco e devolve token | **sim** |
| **I1** | A partir daqui, **toda tela nova consome a API real**, não o mock | Caio | I0 | `USE_MOCK=false` é o padrão | não |
| **I2** | **Demonstração cruzada do RNF-61:** o admin aprova um psicólogo no painel web e ele aparece no app, na mesma sessão | Todos | Z2, I0 | Roteiro executado de ponta a ponta | **sim** |

A etapa I0 é onde aparecem os erros clássicos — token no cabeçalho, formato de erro, CORS, o celular
não enxergando o `localhost`. É esperado que ela não passe de primeira: por isso ela é uma etapa
própria, e não um detalhe de outra.

**I2 é a etapa que fecha a exigência de "web e/ou mobile" com dados compartilhados.** É o critério
de verificação escrito no próprio RNF-61.

---

## 6. Landing page

| Etapa | O que é | Dono | Pronto quando | Mínimo |
|-------|---------|------|---------------|:------:|
| **L0** | Estrutura e conteúdo | Mariana | Página navegável com o conteúdo definido | não |
| **L1** | Responsividade e acessibilidade | Mariana | Confere em largura de celular, contraste da paleta | não |
| **L2** | Revisão contra as restrições do CFP | Mariana | Sem preço, nota, ranking ou promessa de resultado; projeto declarado como acadêmico | não |

A landing é trabalho adiantado da Sprint 3 e não pontua nos três entregáveis obrigatórios desta
sprint. Registrado como decisão do grupo em 02/10/2026.

---

## 7. Documentação e slides

| Etapa | O que é | Dono | Pronto quando | Mínimo |
|-------|---------|------|---------------|:------:|
| **D0** | Slides da Sprint 1 finalizados e detalhados | Nicoly e Isabela | Versionados em `docs/apresentacao/` | não |
| **D1** | Esqueleto dos slides da Sprint 2 | Nicoly e Isabela | Seções nomeadas, em `docs/apresentacao/` | não |
| **D2** | **ABNT versionado no repositório**, com capa, folha de rosto e sumário | Nicoly e Isabela | Documento em `docs/documento-final/`, em PDF ou Word | **sim** |
| **D3** | Arquitetura e diagramas atualizados, como figuras numeradas | Nicoly e Isabela | MER, DER e arquitetura no documento, citados no texto | **sim** |
| **D4** | Seção de **programação e codificação**: principais rotas e módulos | Nicoly e Isabela | Sai quase direto do `contrato-api.md` e de `../engenharia/` | **sim** |
| **D5** | **Relatório de evidências dos testes** | Nicoly e Isabela, com os devs | Saídas datadas do Runner do Postman em `docs/testes/` | **sim** |

O documento ABNT hoje vive fora do repositório: `docs/documento-final/` tem só um README. **D2 é a
etapa que corrige isso**, e ela é entregável obrigatório — ao contrário dos slides, que são da
Sprint 3.

---

## 8. Log de conclusão

**Preencher aqui quando cada etapa fechar.** Esta tabela é o histórico do projeto e serve de
**relatório de contribuição** na hora da entrega, que é item avaliado pela atividade.

| Etapa | Dono | Concluída em | PR | Observação |
|-------|------|--------------|----|------------|
| B0 | Rafael | | | |
| Z0 | Zanetti | | | |
| B1 | Rafael | | | |
| Z1 | Zanetti | | | |
| Z2 | Zanetti | | | |
| B2 | Rafael | | | |
| B3 | Rafael | | | |
| Z3 | Zanetti | | | |
| F0 | Caio | | | |
| F1 | Caio | | | |
| F2 | Caio | | | |
| F3 | Caio | | | |
| I0 | Caio e Rafael | | | |
| I1 | Caio | | | |
| I2 | Todos | | | |
| L0 | Mariana | | | |
| L1 | Mariana | | | |
| L2 | Mariana | | | |
| D0 | Nicoly e Isabela | | | |
| D1 | Nicoly e Isabela | | | |
| D2 | Nicoly e Isabela | | | |
| D3 | Nicoly e Isabela | | | |
| D4 | Nicoly e Isabela | | | |
| D5 | Nicoly e Isabela | | | |

A coluna *observação* é para o que vale lembrar depois: o que foi cortado, o que deu trabalho
inesperado, a decisão tomada no meio. É dali que sai metade do texto de "decisões técnicas" do
documento final.

---

## 9. O mínimo exigível, numa lista só

Se tudo apertar, **estas onze etapas são o que não se corta**, porque são elas que atendem os três
entregáveis obrigatórios da atividade:

`B0` · `Z0` · `B1` · `Z2` · `B2` · `B3` · `Z3` · `F0` · `F1` · `I0` · `I2`
mais `D2`, `D3`, `D4` e `D5` na trilha de documentação.

Lido em português: backend de pé com autenticação, vínculo, relato com privacidade comprovada e
CRUD de tarefas; painel admin funcionando; app com fundação e telas de entrada consumindo a API de
verdade; e o documento ABNT com as evidências de teste.

**Qualquer corte fora dessa lista é aceitável e vira "evolução futura" no documento final, com
justificativa** — exatamente como foi feito com o limite de uso de aplicativos na Sprint 1.

---

## 10. Riscos desta sprint

| Risco | Gravidade | Mitigação |
|-------|-----------|-----------|
| 6 semanas de plano original comprimidas em 3 | Alta | Escopo cortado na seção 1, mínimo declarado na seção 9 |
| O app tem uma pessoa, sem experiência em RN | Alta | Mínimo curto para o app; painel Blade como prova alternativa de integração |
| Primeira conexão falhar e comer dias | Média | I0 é etapa própria, com DA-01 e DA-03 decididas nela |
| Quatro pessoas com IA produzindo quatro padrões | Média | [`../engenharia/regras-inviolaveis.md`](../engenharia/regras-inviolaveis.md) colado no contexto, e um arquivo de rota por bloco |
| Documento ABNT em segundo plano atrás dos slides | Média | D2 a D5 marcadas como mínimo exigível |
| Evidência de teste deixada para o fim | Média | Saída do Runner salva **a cada** bloco concluído, não na última semana |
