# Cronograma detalhado

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
**Calmind** — Saúde Mental & Acolhimento
Plataforma de apoio à relação paciente/psicólogo
Montado em 18/08/2026 (terça).

> Plano único, do jeito que o projeto vai acontecer. A comparação entre aplicação web e app React Native foi feita em 19/08/2026 e resultou no React Native: o cenário web e o quadro da decisão saíram deste documento na limpeza de 20/08. Quem precisar dessa análise, ela está no histórico do Git.

---

## 0. Parâmetros deste plano

### 0.1 Equipe e disponibilidade

| Pessoa | Papel | Disponibilidade |
|--------|-------|-----------------|
| Rafael Brecci | Product Owner e dev backend | Quase todo dia |
| Caio Yuri | Scrum Master e dev frontend | Quase todo dia |
| Eduardo Zanetti | Dev backend | Quase todo dia |
| Mariana Chaves | Dev fullstack de suporte | Principalmente quinta e sexta |
| Nicoly Ribeiro | Documentação e slides | Principalmente quinta e sexta |
| Isabela Puzenato | Documentação e slides | Principalmente quinta e sexta |

**Consequência de projeto:** metade do grupo só produz em 2 dias por semana. Toda tarefa de Mariana, Nicoly e Isabela precisa caber em bloco de quinta ou sexta, com entrada e saída definidas, senão trava esperando o dia seguinte de aula. Rafael, Caio e Zanetti carregam segunda a quarta.

### 0.2 Calendário

Aulas em período integral às **quintas e sextas**. Sprint 1 entrega **sexta 21/08, fim da tarde**. Apresentação final entre meados de novembro e começo de dezembro.

| Sprint | Início | Entrega | Semanas | Dias de aula |
|--------|--------|---------|---------|--------------|
| Sprint 1 | já em curso | **sexta 21/08** | esta semana | 2 (20 e 21/08) |
| Sprint 2 | segunda 24/08 | **sexta 02/10** | 6 | 12 |
| Sprint 3 | segunda 05/10 | **sexta 13/11** | 6 | 12 |
| Preparação e apresentação | 16/11 em diante | a confirmar | folga | |

**Por que fechar a Sprint 3 em 13/11 e não em 20/11:** 20/11 é sexta e feriado nacional (Consciência Negra), ou seja, não há aula nem entrega possível nesse dia. E se a apresentação cair em meados de novembro, terminar em 13/11 é o que salva. Se a apresentação for só em dezembro, a folga vira ensaio, que nenhum grupo tem.

**Feriados no caminho:** 07/09, 12/10 e 02/11 caem em segunda-feira. Não atingem dia de aula, mas cortam um dia de trabalho da trinca que produz durante a semana. Já estão descontados na distribuição abaixo.

### 0.3 Premissa de stack

O backend é **Laravel com MySQL**, porque é o conhecimento real do grupo e porque o RNF-57 exige um único serviço central com um único banco. Essa premissa nunca esteve em disputa: a decisão de 19/08 mudou apenas o cliente, que passou a ser app React Native em vez de aplicação web responsiva.

---

# PARTE 1: SPRINT 1, ENTREGA NESTA SEXTA

Nada nesta parte dependeu da decisão entre web e mobile, e isso foi proposital: os wireframes foram desenhados **mobile-first**, formato que serviria às duas rotas. É o que permitiu a Sprint 1 rodar inteira com a plataforma ainda em aberto.

## 1.1 O que falta entregar

| Entregável exigido | Estado | Responsável |
|--------------------|--------|-------------|
| Documento de Requisitos | **Pronto**, 48 RF e 68 RNF | Rafael |
| Coleta e análise dos requisitos (a pesquisa escrita) | Não iniciado | Nicoly e Isabela |
| Diagramas iniciais (MER, DER e outros) | Não iniciado | Rafael e Zanetti |
| Wireframes da interface | Não iniciado | Caio e Mariana |

## 1.2 Terça 18/08 (hoje, à noite, trinca disponível)

| Quem | Tarefa | Pronto quando |
|------|--------|---------------|
| Rafael | Fechar as 4 decisões de modelagem: DP-02 (entidade Usuário com papel), DP-03 (MySQL relacional), DP-06 (isolamento do relato privado) e DP-14 (idioma do código). Escrever as 4 em uma nota de 10 linhas e mandar no grupo | As 4 decisões estão escritas e ninguém precisa perguntar de novo |
| Rafael e Zanetti | Levantar a lista de entidades do MER a partir dos RF Must. Mínimo esperado: Usuario, Paciente, Psicologo, Vinculo, Convite, Relato, Tarefa, Consulta, Medicacao, ConfirmacaoMedicacao, Mensagem, Analise, Termo, AceiteTermo, DocumentoCRP, Auditoria | Lista de entidades com os atributos principais, ainda sem diagrama bonito |
| Caio | Congelar o inventário de telas (DP-04) usando a lista da seção 1.6 abaixo, e abrir o arquivo de protótipo com o kit de componentes escolhido (DP-09) | Arquivo criado, 14 quadros vazios nomeados, link compartilhado com o grupo |

**Não fazer hoje:** diagrama bonito, escolha de cores, discussão de stack. Hoje é só destravar.

## 1.3 Quarta 19/08 (trinca)

| Quem | Tarefa | Pronto quando |
|------|--------|---------------|
| Rafael e Zanetti | MER completo: entidades, atributos, relacionamentos e cardinalidades. Atenção aos três pontos que a banca olha: o vínculo com no máximo 1 ativo por paciente (RF-12), o ciclo de estados da medicação (RF-27 a RF-29) e o isolamento do relato privado conforme decidido em DP-06 | MER desenhado e revisado pelos dois |
| Rafael e Zanetti | DER a partir do MER: tabelas, chaves primárias e estrangeiras, tipos, campos obrigatórios e índices | DER exportado em imagem |
| Caio | Wireframes do bloco 1, telas 1 a 7 da lista de 1.6 (entrada, consentimento, convite, catálogo, vínculo) | 7 quadros com conteúdo, média fidelidade |

## 1.4 Quinta 20/08 (aula integral, grupo completo)

**08h00 a 08h40, todos:** revisão coletiva do MER e do DER. Cada um tenta furar o modelo com um caso: "onde fica o relato privado", "como o sistema impede o segundo vínculo ativo", "onde está a versão do termo aceita". Correção na hora.

**08h40 a 09h00, Rafael:** perguntar ao professor as duas coisas que só ele responde:
1. Uma aplicação **somente web**, sem app mobile, atende o item 2.2 da regulamentação? O item 1.1 diz "web e/ou mobile", mas o item 2.2 fala em sincronização do mobile com a aplicação web. Essa resposta sustenta por escrito a escolha do app mobile, tomada em 19/08.
2. Existe versão mais nova deste escopo? O rodapé do PDF diz "2024" e o arquivo diz 2026.

| Quem | Tarefa do dia | Pronto quando |
|------|---------------|---------------|
| Rafael e Zanetti | Ajustes do DER pós revisão, mais o diagrama de arquitetura (dois clientes ou um cliente sobre backend Laravel único com MySQL, conforme RNF-57) e o diagrama de estados de Vinculo e Medicacao (RNF-50) | 3 diagramas exportados |
| Caio e Mariana | Wireframes do bloco 2, telas 8 a 14 (relato, tarefas, chat, agenda, lado do psicólogo) | 7 quadros com conteúdo |
| Mariana (bloco da tarde) | Diagrama de casos de uso, derivado direto dos RF Must. Atores: Paciente, Psicólogo, Administrador. O serviço de IA não é ator, é acionado pelo psicólogo (DEC-04) | Diagrama exportado |
| Nicoly e Isabela | Formalizar a pesquisa de campo (DP-07): roteiro aplicado, síntese das 3 entrevistadas sem identificação nominal, e 2 personas, uma paciente e uma psicóloga. Insumo pronto na seção 1 do `documento-base-sprint1.md` | Documento de 3 a 4 páginas |
| Nicoly e Isabela | Montar o esqueleto do documento de entrega: capa, sumário, e as seções na ordem em que os artefatos vão entrar | Arquivo criado com as seções vazias nomeadas |

## 1.5 Sexta 21/08 (aula integral, entrega no fim da tarde)

| Horário | Quem | Tarefa |
|---------|------|--------|
| 08h00 a 10h00 | Caio e Mariana | Fechar os quadros que faltaram e passar o mesmo padrão visual em todos os 14 |
| 08h00 a 10h00 | Rafael e Zanetti | Revisão final dos 5 diagramas e legenda em cada um |
| 08h00 a 11h00 | Nicoly e Isabela | Montar o corpo do documento: pesquisa, requisitos, diagramas, wireframes, cada seção com um parágrafo de abertura explicando o que o leitor está vendo |
| 10h00 a 11h00 | Todos | Revisão cruzada: cada pessoa revisa o artefato que **não** produziu |
| 11h00 a 13h00 | Rafael | Consolidar o pacote final e gerar o PDF |
| 13h00 a 14h00 | Nicoly e Isabela | Revisão de texto, numeração de figuras e sumário |
| 14h00 | Todos | **Entrega.** Duas horas de folga antes do fim da tarde, de propósito |
| 14h30 a 16h00 | Todos | Reunião de planejamento da Sprint 2 e confirmação da rota React Native, com a resposta do professor em mãos |

## 1.6 Inventário de telas para o protótipo (14 telas)

Só o que é preciso para a Sprint 1. As telas de medicação e do administrador ficam para a Sprint 2, e isso é decisão consciente, não esquecimento.

**Lado do paciente**
1. Entrada: login e cadastro com escolha de perfil (RF-01, RF-02)
2. Termo de consentimento com aceite destacado (RF-03) e consentimento específico de IA (RF-04)
3. Onboarding: "tenho psicólogo" ou "buscar profissional" (fluxo 3.1 do documento base)
4. Inserir código de convite (RF-07)
5. Catálogo com filtros, sem preço e sem nota (RF-09)
6. Perfil do profissional e solicitação de vínculo (RF-10)
7. Home do paciente: vínculo, pendências da semana
8. Novo relato com o marcador compartilhado ou privado visível antes de enviar (RF-22, RNF-37)
9. Tarefas em cards, pendentes e concluídas (RF-25)
10. Chat (RF-15)
11. Agenda de consultas (RF-26)

**Lado do psicólogo**
12. Cadastro com CRP e envio de documento (RF-33)
13. Lista de pacientes com pendências (RF-35)
14. Prontuário, com atribuição de tarefa e o botão de solicitar análise (RF-36, RF-37, RF-41, RF-42)

**Detalhe que vale nota na tela 8:** o marcador de privacidade precisa aparecer sem rolagem e já vir marcado como compartilhado (DEC-13, RNF-37). É o requisito mais característico do produto e a banca vai olhar para ele.

## 1.7 Plano de corte, se a quinta terminar atrasada

Cortar nesta ordem, e avisar no documento o que ficou para a Sprint 2:
1. Diagrama de estados (o MER, DER e casos de uso já atendem "MER, DER e outros diagramas")
2. Telas 10 e 11 do protótipo (chat e agenda), que são padrão e fáceis de defender depois
3. A segunda persona

**Não cortar em hipótese alguma:** MER, DER e as telas 1, 2, 5, 8 e 14. São o que prova que o grupo entendeu o próprio produto.

---

# PARTE 2: O PLANO — APP MOBILE EM REACT NATIVE

**Stack:** React Native no cliente, Laravel e MySQL no servidor, painel administrativo web em Blade e Bootstrap, mais a landing page.
**Produto:** app mobile único atendendo paciente e psicólogo por papel, com painel web do administrador.

## 2.1 A jogada que salva o item 2.2

Faça o **painel do administrador em web** (RF-44, RF-45, RF-46). São 3 requisitos, cerca de 4 telas simples em Blade e Bootstrap, reutilizando o mesmo backend e o mesmo banco.

Com isso o projeto passa a ter aplicação mobile e aplicação web compartilhando dados, que é exatamente o que o item 2.2 da regulamentação pede na Integração e nas Funcionalidades Básicas. O RNF-61 já define o critério de verificação: o admin aprova um psicólogo no painel web e o psicólogo passa a aparecer no app mobile, na mesma sessão de demonstração. É o custo mais baixo possível para fechar a exigência.

## 2.2 Divisão de frentes

| Frente | Quem | Escopo |
|--------|------|--------|
| Backend Laravel como API | Rafael e Zanetti | Migrations, autenticação por token, endpoints, regras de negócio |
| App React Native | Caio e Mariana | Telas, navegação, consumo da API, notificações locais |
| Painel admin web | Zanetti (semanas 5 e 6) | Blade e Bootstrap sobre o mesmo backend |
| Documentação e slides | Nicoly e Isabela | Trilha da Parte 3 |

## 2.3 Sprint 2, semanas 1 a 6 (24/08 a 02/10)

| Semana | Período | Backend (Rafael, Zanetti) | App RN (Caio, Mariana) | Entrega da semana |
|--------|---------|---------------------------|------------------------|-------------------|
| 1 | 24 a 28/08 | Projeto Laravel como API, migrations do DER, seeders, autenticação por token (RF-01, RF-02, RF-05) | **Semana de fundação, e ela é obrigatória:** ambiente RN rodando na máquina dos dois, navegação, e um **build de APK instalado em celular físico** já nesta semana | Login pelo app real, no celular, contra a API |
| 2 | 31/08 a 04/09 | Consentimento versionado (RF-03, RF-04), cadastro com CRP e upload (RF-33) | Telas de entrada, consentimento e cadastro | Psicólogo se cadastra pelo app |
| 3 | 07 a 11/09 (feriado dia 07) | Convite (RF-06, RF-07), vínculo com regra de 1 ativo (RF-10 a RF-13), catálogo (RF-09) | Telas de convite, catálogo e solicitação | Paciente entra pelos dois caminhos |
| 4 | 14 a 18/09 | Relato com privacidade na camada de dados (RF-22, RF-23, RF-24), decisão do DP-06 implementada | Telas de relato e listagem, com o marcador de privacidade | **Marco crítico:** teste automatizado do RNF-08 passando |
| 5 | 21 a 25/09 | Tarefas (RF-25, RF-37) e chat (RF-15). Zanetti começa o painel admin web (RF-44) | Telas de tarefa e chat | Ciclo semanal navegável |
| 6 | 28/09 a 02/10 | Agenda (RF-26, RF-40). Painel admin web concluído | Calendário e **notificação local agendada**, prova de conceito | **Entrega da Sprint 2**, com a sincronização entre app e painel web demonstrada |

## 2.4 Sprint 3, semanas 7 a 12 (05/10 a 13/11)

A espinha é a mesma que valeria numa aplicação web. O que muda por ser app nativo está marcado na última coluna:

| Semana | Período | Foco | O que muda por ser app nativo |
|--------|---------|------|-----------------------------------|
| 7 | 05 a 09/10 | Medicação completa (RF-38, RF-27, RF-29, RF-43) | Igual |
| 8 | 12 a 16/10 (feriado dia 12) | Lembrete de adesão (RF-28) e serviço de IA | **O lembrete usa notificação local agendada no aparelho, não push.** É mais simples, funciona sem servidor de push e sem internet no horário do lembrete. Push fica só para chat e tarefa (RF-16), e é opcional |
| 9 | 19 a 23/10 | Análise de IA (RF-41, RF-42), prontuário (RF-36), auditoria (RF-17) | Igual |
| 10 | 26 a 30/10 | **Congelamento em 30/10.** Acessibilidade, alvo de toque e contraste (RNF-35) | Mais crítico aqui: alvo de toque de 44 pontos é critério de avaliação de usabilidade |
| 11 | 02 a 06/11 (feriado dia 02) | Testes, correções, landing page | Somar aqui a **geração do APK final assinado** e a instalação em pelo menos 2 aparelhos diferentes |
| 12 | 09 a 13/11 | ABNT, manual, slides, 2 ensaios | O ensaio precisa ser com o APK instalado, não com emulador no notebook |

## 2.5 Riscos específicos do app React Native

| Risco | Gravidade | Mitigação |
|-------|-----------|-----------|
| Ninguém no grupo tem experiência real com React Native | Alta | A semana 1 existe só para isso. Se na sexta 28/08 não houver APK instalado em celular, **volte para o plano de aplicação web na hora**, sem discussão. Esse é o ponto de não retorno |
| Build de APK deixado para o fim | Alta | Build já na semana 1 e outro na semana 6. Um terceiro na semana 11. Nunca só no fim |
| Notificação agendada não dispara com o app fechado | Média | Testar na semana 6, não na 8. Se falhar, o lembrete vira aviso na abertura do app, e o RF-28 é reescrito com a limitação declarada |
| Dois clientes (app e painel) com regra de negócio duplicada | Média | O RNF-57 proíbe. A regra vive no Laravel; o app e o painel só chamam |

> **O plano de aplicação web não foi perdido, foi arquivado.** Ele saiu deste documento na limpeza de 20/08/2026, junto com o comparativo `decisao-cenarios.html`. Enquanto o marco M2 de 28/08 não passar, esse plano continua sendo a contingência real do projeto. Para trazer os dois de volta:
>
> ```bash
> git show f91e4de:docs/planejamento/cronograma.md > cronograma-com-plano-web.md
> git show f91e4de:docs/planejamento/decisao-cenarios.html > decisao-cenarios.html
> ```

---

# PARTE 3: TRILHA DE DOCUMENTAÇÃO

Responsáveis: Nicoly e Isabela. Trabalham quinta e sexta, então cada bloco abaixo é uma tarefa de um dia de aula.

| Quando | Tarefa | Por que nesta data |
|--------|--------|--------------------|
| Quinta 20/08 | Pesquisa de campo formalizada e esqueleto do documento | Entregável da Sprint 1 |
| Sexta 21/08 | Montagem e revisão do pacote da Sprint 1 | Entrega |
| Semana 1 da Sprint 2 | Montar o **esqueleto ABNT** do documento final: capa, folha de rosto, sumário automático, seções, referências (DP-17) | Feito agora, os documentos entram como seções ao longo do semestre em vez de serem refeitos em novembro |
| Semanas 2 a 6 | A cada dia de aula, escrever o trecho do **manual do usuário** das telas que ficaram prontas na semana | Tela pronta rende meia página em 15 minutos. Vinte telas prontas rendem uma noite perdida |
| Semanas 2 a 6 | Registrar as decisões técnicas que forem tomadas, alimentando o histórico do RNF-54 | A banca pergunta "por que vocês escolheram isso" |
| Semanas 7 a 9 | Documento de **detalhamento de programação e codificação** (item 2.1), destacando as partes principais: autenticação, isolamento do relato privado, ciclo da medicação, integração com IA | Exigência que ninguém do grupo estava olhando |
| Semana 10 | Primeira versão dos **slides** e roteiro da apresentação | Congelamento das funcionalidades é dia 30/10: dali em diante o produto não muda mais e o slide não precisa ser refeito |
| Semana 11 | **Relatório de testes**, escrito junto com os devs. Esqueleto pronto nos RNF-08 e RNF-53 | Os testes acontecem nesta semana |
| Semana 12 | Fechamento ABNT, sumário, figuras numeradas, revisão final, 2 ensaios cronometrados | Entrega |

**Regra que evita o desastre clássico:** nenhum documento é escrito na última semana. A semana 12 é só montagem e revisão do que já existe.

---

# PARTE 4: RITOS DA SPRINT

Como a unidade curricular avalia metodologia ágil, o processo precisa deixar rastro.

| Rito | Quando | Duração | Quem conduz |
|------|--------|---------|-------------|
| Daily assíncrona | Todo dia útil, no grupo, por escrito | 2 minutos por pessoa | Caio (Scrum Master) |
| Daily presencial | Quinta e sexta, início da aula | 10 minutos | Caio |
| Revisão de meio de sprint | Semanas 3 e 9, na sexta | 40 minutos | Caio |
| Review da sprint | 02/10 e 13/11 | 1 hora | Rafael (PO) apresenta o incremento |
| Retrospectiva | Mesmo dia do review | 40 minutos | Caio |
| Refinamento do backlog | Toda quinta, fim da aula | 30 minutos | Rafael |

**Evidência para a banca:** board com as tarefas movendo, histórico de commits seguindo o padrão do RNF-51 e as atas curtas de retrospectiva. Isso vale nota no eixo de processo e custa 10 minutos por semana.

---

# PARTE 5: MARCOS DE CONTROLE

Cinco datas em que o grupo para e verifica. Se um marco falhar, o escopo é cortado no mesmo dia, e o que sai vira "evolução futura" no documento final, com justificativa, exatamente como foi feito com o limite de uso de aplicativos.

| Marco | Data | Critério objetivo | Se falhar |
|-------|------|-------------------|-----------|
| M1 Sprint 1 entregue | 21/08 | Requisitos, diagramas e wireframes no pacote | Entregar o que existe e declarar o que falta |
| M2 Fundação de pé | 28/08 | Login funcionando contra o banco e APK instalado em celular | Volta para o plano de aplicação web, recuperado do histórico do Git |
| M3 Coração do produto | 18/09 | Relato com privacidade funcionando e teste do RNF-08 passando | Reduzir escopo da agenda e do chat |
| M4 Sprint 2 entregue | 02/10 | Ciclo semanal navegável ponta a ponta | Reprioriza: medicação vira Should, IA continua Must |
| M5 Congelamento | 30/10 | Nenhuma funcionalidade nova a partir daqui | Cortar as funcionalidades incompletas e documentar o corte |

---

# PARTE 6: O QUE AINDA PRECISA SER RESPONDIDO

| # | Pendência | Quem responde | Quando |
|---|-----------|---------------|--------|
| 1 | Web sozinho atende o item 2.2 da regulamentação? | Professor | Quinta 20/08 |
| 2 | Data exata da apresentação final | Professor | Quinta 20/08 |
| 3 | Existe versão 2026 do escopo, com pesos de nota? | Professor | Quinta 20/08 |
| 4 | Formato exato da entrega da Sprint 1 (PDF único, repositório, board) | Professor | Quinta 20/08 |
