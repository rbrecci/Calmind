# Plano de execução: MVP da Sprint 2

Data: 2026-10-22
Estado: Fase 1 implementada e testada em backend e HTTP; validação visual no dispositivo e fechamento da entrega pendentes
Entrega: 2026-10-23

## Problema e critério de entrega

O backend começou o dia com os blocos A, D e E. O trabalho da Fase 1 acrescentou painel, tarefas e integração do app com a API real no código, com um ciclo de tarefa verificado por HTTP e pela página web. Falta conferir a interface no dispositivo e fechar a preparação da entrega.

O [enunciado da atividade](../../EscopoSCRUM%20DEV4%C2%BAS_2026.pdf), páginas 2 e 3, pede primeiras funcionalidades de backend e frontend e primeiros testes na Sprint 2. A documentação ABNT final e o relatório completo pertencem à Sprint 3. O [plano interno da Sprint 2](etapas-sprint2.md) antecipou esses documentos e ampliou o mínimo. A prioridade de hoje é cumprir primeiro o enunciado, depois fechar o máximo possível do mínimo interno, sem declarar pronto o que não foi demonstrado.

## Estado verificado em 22/10, após a implementação

| Item | Estado e evidência | Falta para aceitar |
|---|---|---|
| B0, B1, B2, B3 | MySQL do XAMPP iniciado; banco de teste `calmind_test` criado. A suíte backend completa passou com 195 testes e 3545 asserções. | Conferir inclusão de todos os arquivos do backend no PR. O Newman A/D/E anterior permanece registrado em `docs/testes/2026-10-21-newman-blocos-a-d-e.txt`. |
| Z0 e Z3 | Contrato F publicado em `docs/api/contrato-api.md`; API, testes e pasta F da coleção implementados. Newman F passou com 15 requisições e 27 asserções. | Preservar evidência datada do Runner e conferir o diff final. |
| Z2 | Cadastro profissional, aprovação administrativa e painel Blade implementados; rotas web integradas. | Conferir navegação e layout em largura de celular. |
| F0 e F1 | Fluxo inicial e tarefas no app implementados; `npm test` passou 33 testes, `npm run lint` e `npx tsc --noEmit` passaram. | Conferir telas e interação em dispositivo ou emulador. |
| I0 e I2 | Autenticação e ciclo de tarefa no banco comum demonstrados por HTTP e pela página web: tarefa 4 criada no formulário web, concluída pela API do paciente e exibida como concluída na web. | Repetir o ciclo pela interface do app com `USE_MOCK=false`. RNF-61 segue parcial porque a consulta não integra o MVP desta sprint. |
| D2 a D5 | Documento ABNT inicial e evidência de testes existem. | Revisar texto de arquitetura e rotas para não apresentar funções futuras como implementadas. |

## Registro de execução e desvios

- O MySQL inicialmente recusou conexão em `127.0.0.1:3306`. O serviço foi iniciado e o banco isolado `calmind_test` foi criado antes da rodada final de testes.
- A primeira execução Newman F encontrou uma asserção incorreta: o script lia `idVinculo` da coleção, enquanto o valor usado na execução estava no ambiente. A leitura foi corrigida para `pm.variables.get('idVinculo')`; a repetição passou com 15 requisições e 27 asserções.
- A suíte backend completa passou com 195 testes e 3545 asserções. O app passou 33 testes, lint e verificação TypeScript. A prova cruzada por formulário web, API e página web concluiu a tarefa 4 e mostrou seu estado atualizado.
- A interface em dispositivo ou emulador ainda não foi verificada. O roteiro literal do RNF-61 também inclui criar e mostrar uma consulta, fora do escopo desta Sprint 2. Por isso, RNF-61 permanece parcial.
- Fase 1 tem implementação e testes automatizados; o aceite visual e o fechamento da entrega continuam abertos. PR, merge e publicação em `main` não foram feitos.

## Escopo e decisões

- Entregar autenticação real, painel web, um CRUD de tarefas integrado, app com login e uma operação real sobre tarefas, banco comum e execução datada de testes. Preservar os testes de privacidade de relatos.
- O bloco B completo, F2/F3 completos, landing page, chat, agenda, medicação, IA e prontuário consolidado ficam fora da execução de hoje. O aceite de consentimento já semeado serve à demonstração; nenhum fluxo clínico novo deve gravar dados sem aceite vigente. Registrar essa limitação.
- O cadastro no app precisa enviar `birth_date`: `app/src/api/types.ts:13` omite o campo exigido em `backend/app/Http/Requests/RegisterUserRequest.php:42`. O mock deve usar o mesmo contrato.
- A demonstração I2 do plano interno usa aprovação no painel e visualização no app. Ela comprova banco compartilhado, mas **não comprova literalmente RNF-61**. `docs/documento-requisitos.md:1017` exige também tarefa e consulta criadas na web, tarefa concluída no mobile e estado refletido na web. Como agenda foi excluída da Sprint 2 em `etapas-sprint2.md:32`, registrar RNF-61 como parcial e demonstrar o ciclo completo da tarefa, sem alegar conformidade total.
- Não atualizar o log de etapas como concluído antes de haver saída de teste e revisão. Não fazer commit, merge ou push sem pedido explícito.

## Contratos de integração a fechar antes do trabalho paralelo

1. Z0 publica no `docs/api/contrato-api.md` e na coleção a rota, campos, respostas e erros das tarefas. Backend e app implementam somente esse contrato. A fonte de dados é a tabela em `backend/database/migrations/2026_10_21_000013_create_tasks_table.php:11`.
2. A URL do app deve apontar para o endereço da máquina acessível pelo dispositivo ou emulador, nunca para `localhost` do telefone. `USE_MOCK=false` na demonstração. Token Sanctum via cabeçalho `Authorization: Bearer`.
3. O agente do painel usa arquivos próprios sob `backend/app/Http/Controllers/` e `backend/resources/views/admin/`. O agente de tarefas usa arquivos próprios sob `backend/app/Http/Controllers/Api/V1/`, `backend/resources/views/psychologist/` e `backend/routes/api/tasks.php`. `backend/routes/web.php` e `backend/tests/Feature/ReportPrivacyTest.php` ficam com o integrador para evitar edição concorrente.

## Fase 1: MVP executável de hoje, detalhada

As tasks abaixo registram o escopo e as decisões de execução definidos antes do desenvolvimento. O estado verificado após a implementação está na tabela e no registro de desvios acima. A Fase 1 ainda depende da conferência visual no dispositivo para seu aceite final.

### Épico 1.1: desbloquear ambiente e contrato

#### Task 1.1.1: estabelecer linha de base, integrador

- **Contexto:** `backend/routes/api.php` registra A, D e E; o log Newman em `docs/testes/` é de 21/10. `git status` mostra o backend não rastreado. `artisan migrate:status` retornou conexão recusada em `127.0.0.1:3306`.
- **Visão de implementação:** iniciar o MySQL do XAMPP, conferir a configuração local sem expor segredos, usar banco de teste isolado, rodar migrations com seed e suíte existente. Caso a base local contenha dados úteis, não usar `migrate:fresh` nela. Identificar falhas anteriores aos novos agentes. Não reescrever B0, A, D e E sem uma falha reproduzida.
- **Arquivos:** criar: nenhum; alterar: somente configuração local ignorada, se necessária; testar: `backend/tests/Feature/`.
- **Verificação:** `C:/xampp2/php/php.exe artisan migrate:status`, `C:/xampp2/php/php.exe artisan test` e `C:/xampp2/php/php.exe artisan route:list --path=api/v1` dentro de `backend/`; guardar saídas e códigos de saída.
- **Pronto quando:** MySQL responde, migrations e testes existentes passam, e há inventário dos arquivos não rastreados que precisarão entrar na entrega.

#### Task 1.1.2: fechar Z0, integrador, em paralelo ao preparo do app e do painel

- **Contexto:** `docs/api/contrato-api.md:153` posterga tarefas e a coleção em `docs/api/Calmind.postman_collection.json` só cobre A a E.
- **Visão de implementação:** fixar endpoints de listar, criar, ler, editar, excluir e concluir tarefa sobre a tabela existente, incluindo dono do vínculo, campos obrigatórios, estados, respostas 401, 403, 404, 409 e 422 que de fato se aplicarem. Adicionar requisições positivas e negativas à pasta F do Postman. Não alterar contratos A a E.
- **Arquivos:** criar: nenhum; alterar: `docs/api/contrato-api.md`, `docs/api/Calmind.postman_collection.json`; testar: a coleção Postman.
- **Verificação:** conferir que a coleção importa, a pasta F contém o CRUD e cada requisição tem asserções; diff restrito à seção F.
- **Pronto quando:** agente de tarefas e agente do app recebem o mesmo contrato publicado no repositório.

### Épico 1.2: três frentes simultâneas após contrato e linha de base

#### Task 1.2.1: cadastro profissional e painel, agente C

- **Contexto:** `backend/routes/api/psychologist.php:1` está vazio; `backend/routes/web.php:5` só exibe welcome; `backend/routes/api/bonds.php:20` já oferece catálogo filtrado para profissionais aprovados e publicados.
- **Visão de implementação:** implementar os endpoints C previstos em `docs/api/contrato-api.md:92`, com validação de CRP e aprovação administrativa, mais páginas Blade mínimas para listar pendentes, aprovar e publicar perfil. Proteger sessão web e papel de admin. Não duplicar a regra de aprovação na view. Casos críticos: não admin recebe 403; profissional pendente não aparece no catálogo; profissional aprovado e publicado aparece; CRP inválido recebe erro de validação.
- **Arquivos:** criar: controllers, requests, views e testes próprios do bloco C sob `backend/`; alterar: `backend/routes/api/psychologist.php`; testar: nova suíte Feature do bloco C. O integrador é dono de `backend/routes/web.php`.
- **Verificação:** `C:/xampp2/php/php.exe artisan test --filter=Psychologist` e pasta 03 do Postman, com casos positivos e negativos; abrir painel em largura de celular.
- **Pronto quando:** admin aprova e publica pelo painel e o catálogo da API retorna o mesmo profissional.

#### Task 1.2.2: CRUD de tarefas e página web, agente F

- **Contexto:** `backend/routes/api/tasks.php:1` está vazio; `backend/database/migrations/2026_10_21_000013_create_tasks_table.php:11` e o Model `backend/app/Models/Task.php:7` existem. `backend/tests/Feature/ReportPrivacyTest.php:48` exige classificar toda rota de psicólogo e admin.
- **Visão de implementação:** seguir o contrato Z0. Psicólogo só manipula tarefa de paciente com vínculo ativo; paciente só lê e conclui a própria tarefa. Criar página web mínima para psicólogo listar, criar e ver conclusão. Testar acesso cruzado, vínculo encerrado, tarefa inexistente e transição de conclusão. Não consultar relatos privados em rota de tarefa. Entregar ao integrador a lista de rotas novas para o teste de privacidade.
- **Arquivos:** criar: controller, requests, service apenas se a regra exigir, view e teste Feature próprios; alterar: `backend/routes/api/tasks.php`; testar: testes de tarefa e pasta F do Postman. O integrador é dono de `backend/routes/web.php` e `ReportPrivacyTest.php`.
- **Verificação:** `C:/xampp2/php/php.exe artisan test --filter=Task`, pasta F do Postman e operação de criar e concluir no mesmo banco.
- **Pronto quando:** o CRUD web/API persiste tarefa e bloqueia acesso de outro vínculo; a conclusão no app poderá ser observada na página web.

#### Task 1.2.3: F0, F1 e I0, agente app

- **Contexto:** tela de entrada provisória em `app/src/app/(auth)/index.tsx:10`; navegação e SecureStore já existem; `app/.env.example:7` usa mock. O mock de cadastro omite `birth_date`.
- **Visão de implementação:** instalar dependências declaradas com lockfile, concluir entrada, erro de login, escolha de papel e cadastro paciente conforme telas 01 a 04; alinhar tipo, mock e formulário ao request Laravel. Definir URL de API acessível e demonstrar login real com token persistido. Depois do contrato F, adicionar uma tela mínima de tarefas do paciente para listar e concluir; não tentar reproduzir F2/F3 completos. Controles com rótulo e área de toque de 44 pontos, conforme `docs/engenharia/definicao-de-pronto.md:64`.
- **Arquivos:** criar: telas necessárias em `app/src/app/`; alterar: `app/src/api/types.ts`, `app/src/api/mock.ts`, `app/src/api/http.ts`, `app/src/app/(auth)/index.tsx` e configuração local; testar: testes existentes do app e sessão manual em dispositivo ou emulador.
- **Verificação:** `npm ci`, `npm test`, `npm run lint`, `npx tsc --noEmit`, login real e conclusão de tarefa com `USE_MOCK=false`.
- **Pronto quando:** app entra com usuário do banco, mostra tarefa real e conclui uma tarefa que a web depois mostra como concluída.

### Épico 1.3: integração e prova, integrador

#### Task 1.3.1: unir rotas e executar roteiro cruzado

- **Contexto:** `backend/routes/web.php:5` é compartilhado; `backend/tests/Feature/ReportPrivacyTest.php:48` precisa classificar rotas novas; o plano interno descreve I2 em `etapas-sprint2.md:97`.
- **Visão de implementação:** registrar rotas web dos dois agentes, classificar rotas novas no teste de privacidade, rodar suíte completa. Roteiro: admin aprova e publica psicólogo, app o encontra no catálogo se essa tela couber; psicólogo cria tarefa na web, paciente lê e conclui no app, web mostra conclusão após atualizar. Priorizar o ciclo de tarefa se faltar tempo. Não marcar RNF-61 como completo sem o ciclo de consulta.
- **Arquivos:** criar: evidência datada em `docs/testes/`; alterar: `backend/routes/web.php`, `backend/tests/Feature/ReportPrivacyTest.php`, log em `docs/planejamento/etapas-sprint2.md` somente para etapas comprovadas; testar: suíte backend, pasta F e roteiro manual.
- **Verificação:** `C:/xampp2/php/php.exe artisan test`, `npm test`, `npm run lint`, `npx tsc --noEmit`, Runner Postman A/D/E/C/F e registro datado do roteiro, com resultado e ambiente.
- **Pronto quando:** uma tarefa nasce na web, é concluída no app real e reaparece concluída na web, sem regressão no RNF-08; saídas de teste ficam versionáveis.

## Fase 2: fechamento da entrega, detalhar após a Fase 1

Próximas ações imediatas antes de aceitar a Fase 1:

1. Abrir o app em dispositivo ou emulador com `USE_MOCK=false`, fazer login com conta do banco, criar uma nova tarefa pela web, concluir pela interface do app e atualizar a web para confirmar a conclusão.
2. Abrir o painel administrativo e a página de tarefas em largura de celular, conferir navegação, mensagens de erro, foco e controles.
3. Guardar saídas datadas do backend, app, lint, TypeScript, Newman F e roteiro visual. Identificar RNF-61 como parcial no registro de entrega.
4. Revisar diff, arquivos não rastreados e segredos antes de preparar PR. Merge e publicação em `main` continuam pendentes de revisão.

**Épico 2.1: evidência e documentação.** Atualizar README com comandos reais de execução, registrar saídas de testes em `docs/testes/` e corrigir afirmações do DOCX sobre funcionalidades ainda futuras. Se houver tempo, completar arquitetura, rotas e evidências no DOCX, que são D3 a D5 do plano interno, embora a versão final seja da Sprint 3 no enunciado.

**Épico 2.2: revisão e entrega.** Conferir diff, arquivos obsoletos e segredos, revisar acessibilidade e executar a demonstração na máquina que será usada amanhã. Só depois preparar PR e histórico com os integrantes, conforme a política de commits do projeto e mediante pedido explícito para commitar.

## Ordem de despacho e pontos de corte

Janela de execução sugerida a partir de 19h, horário de Brasília: até 19h40 para MySQL e Z0; 19h40 a 22h para as três frentes paralelas; 22h a 23h para integração; 23h a 23h45 para regressão, evidências e preparação da demonstração. São limites para decidir cortes, não uma promessa de duração. Se o ambiente consumir a primeira janela inteira sem ficar verde, reduzir o escopo de UI imediatamente e proteger a rodada final de testes.

1. Integrador executa 1.1.1 e 1.1.2. O agente app pode iniciar a parte de UI de 1.2.3 enquanto isso. O agente C pode preparar seu trabalho sem tocar arquivos comuns.
2. Com MySQL e Z0 disponíveis, despachar C, F e app em paralelo. O integrador reserva `web.php` e `ReportPrivacyTest.php` e acompanha contrato, testes e evidências.
3. Integrar primeiro o ciclo de tarefas, depois catálogo e acabamento visual. Parar novas features quando faltar tempo para uma rodada completa de testes e demonstração.
4. Se MySQL continuar indisponível após três tentativas distintas, registrar comandos e erros, procurar outra instância ou ambiente limpo e não declarar integração comprovada. Se F atrasar, demonstrar A/D/E e aprovação/catalogo, mas registrar CRUD de tarefa e I2 como pendentes.

## Riscos observáveis

| Risco | Sinal | Ação |
|---|---|---|
| MySQL indisponível | `migrate:status` retorna conexão recusada | Corrigir serviço e porta antes de feature dependente de banco; preservar log da falha. |
| Backend não entra na entrega | `git status` continua mostrando `backend/app/`, migrations e testes como não rastreados | Conferir inclusão no PR antes do fechamento, sem incluir `.env` ou dados locais. |
| Mock mascara contrato quebrado | Cadastro passa no mock e retorna 422 na API | Alinhar `birth_date` e verificar cadastro real. |
| Tarefa expõe dado de outro paciente | Teste de autorização ou RNF-08 falha | Bloquear leitura/escrita pelo vínculo ativo e reexecutar suíte completa. |
| Documento promete sistema completo | DOCX descreve agenda, chat ou IA no presente | Identificar como proposta futura na revisão documental. |

## Ponto de parada em 22/10/2026

A implementação do MVP foi interrompida após a integração e a regressão para preservar a entrega nesta sessão. O backend registrou 195 testes aprovados e o app, 33; lint, TypeScript, Pint, Newman F e migração com seed também passaram. A tarefa 4 foi criada no formulário web, concluída pela API da paciente e exibida como concluída na página do psicólogo. Os registros estão em `docs/testes/2026-10-22-sprint2.txt` e `docs/testes/2026-10-22-newman-bloco-f.txt`.

Próximo passo: abrir o app em dispositivo ou emulador com a API local, executar login e conclusão pela interface e conferir as telas web em largura de celular. O fluxo completo de consentimento do bloco B e o ciclo de consulta exigido literalmente pelo RNF-61 continuam pendentes. Não apresentar esses itens como concluídos na entrega.
