# Etapas da Sprint 2

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
**Calmind**: Saúde Mental & Acolhimento
Sprint encerrada na entrega de **23/10/2026**. Este é o log de quem concluiu o quê, que serve de relatório de contribuição.

Etapas: **B** e **Z** backend (Rafael e Zanetti), **F** app, **I** integração (I2 é a demonstração do RNF-61), **L** landing, **D** documentação e slides.

---

## Log de conclusão

| Etapa | Dono | Concluída em | PR | Observação |
|-------|------|--------------|----|------------|
| B0 | Rafael | 23/10/2026 | #18 | 25 migrations, view `shared_reports`, seeders. Suíte Feature com 197 testes e 3556 asserções, em `calmind_test` |
| Z0 | Zanetti | 23/10/2026 | #18 | Requisições do bloco F na coleção do Postman |
| B1 | Rafael | 23/10/2026 | #18 | Pasta A do Newman verde (9 requisições, 15 asserções) |
| Z1 | Zanetti | | | Não feito (não é mínimo). A demonstração usa aceite semeado e o runner grava o aceite como fixture local |
| Z2 | Zanetti | 23/10/2026 | #18 | Pasta C do Newman verde e painel admin em Blade navegável. Aprovar exige documento anexado (a Jane do seed não tem) |
| B2 | Rafael | 23/10/2026 | #18 | Pasta D do Newman verde |
| B3 | Rafael | 23/10/2026 | #18 | Pasta E do Newman verde e `ReportPrivacyTest` passando (RNF-08) |
| Z3 | Zanetti | 23/10/2026 | #18 | Pasta F do Newman verde |
| F0 | Caio | 02/10/2026 | #13 a #17 | Navegação por papel, módulo de API com mock, token seguro e design system |
| F1 | Caio | 23/10/2026 | #18 e #21 | Entrada com erro de login, escolha de perfil e cadastro do paciente com validação testada (66 testes no app). Verificado no Expo web |
| F2 | Caio | | | Não feito (não é mínimo) |
| F3 | Caio | | | Não feito (não é mínimo). Existe só a lista de tarefas do paciente |
| I0 | Caio e Rafael | 23/10/2026 | #18 | Login real do app contra a API, conferido no Expo web com o paciente Frodo. Não testado em celular físico |
| I1 | Caio | 23/10/2026 | #18 | `EXPO_PUBLIC_USE_MOCK=false` é o padrão em `app/.env.example` |
| I2 | Todos | 23/10/2026 | #21 | [Roteiro](../testes/2026-10-23-roteiro-i2.md): a aprovação no painel web fez a Jane Marple aparecer no catálogo do app (Expo web), com capturas. Exige documento anexado, aprovação e perfil publicado. Não testado em celular físico |
| L0 | Mariana | 23/10/2026 | #20 | Landing page em `landing/`. L1 e L2 não foram verificados nesta rodada |
| L1 | Mariana | | | |
| L2 | Mariana | | | |
| D0 | Nicoly e Isabela | | | |
| D1 | Nicoly e Isabela | | | |
| D2 | Nicoly e Isabela | 23/10/2026 | #19 e #21 | ABNT versionado, com o Rafael incluído na folha de aprovação e sumário atualizado. Texto da Sprint 2 revisado no #21 |
| D3 | Nicoly e Isabela | 23/10/2026 | #21 | MER, DER (4 blocos) e arquitetura como figuras numeradas e citadas no texto. Fonte em `docs/diagramas/img/` |
| D4 | Nicoly e Isabela | 23/10/2026 | #21 | Capítulo 15 com as 34 rotas da API, as 13 rotas web e os módulos do back-end e do app |
| D5 | Nicoly e Isabela | 23/10/2026 | #21 | Capítulo 20 com tabela de evidências e limites. Saídas brutas em `docs/testes/` |
