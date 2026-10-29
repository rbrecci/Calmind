# Codex - Rafael: backend Laravel

**Leia antes:** [00-instrucoes-gerais.md](00-instrucoes-gerais.md) (regras de git, Regra 0 sobre travessão, formato de conclusão e relatório). Este arquivo só acrescenta o que é específico do backend.

**Branch:** `codex/rafael-backend`. **Relatório:** `instrucoes/relatorio-rafael.md`.

## Missão

Implementar no Laravel, **à risca**, tudo que a seção 3.8 de [docs/api/contrato-api.md](../docs/api/contrato-api.md) descreve. Dois outros Codex estão construindo os apps agora, contra mocks que seguem esse texto. Se você se desviar do contrato, o app quebra na integração. Cumprir o contrato vale mais que a sua preferência de desenho.

Você é dono de `backend/**` e `docs/api/**`. Mais ninguém toca nesses caminhos.

## Antes de escrever código (15 minutos, não mais)

Leia, nesta ordem: [backend/README.md](../backend/README.md), [docs/engenharia/setup-backend.md](../docs/engenharia/setup-backend.md), [docs/engenharia/arquitetura-backend.md](../docs/engenharia/arquitetura-backend.md), [docs/engenharia/regras-inviolaveis.md](../docs/engenharia/regras-inviolaveis.md), [docs/engenharia/convencoes-de-codigo.md](../docs/engenharia/convencoes-de-codigo.md).

Depois leia, como **modelo do padrão da casa**, o bloco de tarefas inteiro: [PatientTaskController.php](../backend/app/Http/Controllers/Api/V1/PatientTaskController.php), [PsychologistTaskController.php](../backend/app/Http/Controllers/Api/V1/PsychologistTaskController.php), [TaskService.php](../backend/app/Services/TaskService.php), [TaskResource.php](../backend/app/Http/Resources/TaskResource.php), [ListTasksRequest.php](../backend/app/Http/Requests/ListTasksRequest.php), [routes/api/tasks.php](../backend/routes/api/tasks.php) e [TaskTest.php](../backend/tests/Feature/TaskTest.php). Todo código novo copia essa estrutura: Controller fino, regra no Service, `ApiException` para erro de regra, `FormRequest` para validação, `Resource` com `$wrap = null` para objeto único, lista com `{data, meta}`.

Confira também [ReportPrivacyTest.php](../backend/tests/Feature/ReportPrivacyTest.php). A suíte **falha** se existir rota nova de `/psychologist` ou `/admin` que não esteja no mapa `ROUTES` do teste. Toda rota nova do psicólogo que você criar entra nesse mapa, como `self::NONE`, **no mesmo commit** em que a rota nasce. Nenhum código novo pode citar o Model `Report` (a varredura estática da prova (c) confere).

## Ambiente

Dentro de `backend/`: `composer install` se `vendor/` estiver ausente, `.env` a partir de `.env.example`, MySQL do XAMPP ligado, banco de teste `calmind_test` (é o que o `phpunit.xml` usa). Bateria da frente:

```bash
php artisan test            # suíte completa, tem que ficar verde em todo commit
vendor/bin/pint             # formata; depois confira com vendor/bin/pint --test
```

Em PowerShell com XAMPP, o PHP pode ser `C:/xampp2/php/php.exe` (foi assim na máquina do Saker; confira a sua). Nunca rode `migrate:fresh` no banco `calmind` de desenvolvimento sem necessidade: use o banco de teste.

## Lista de trabalho (nesta ordem)

Cada item termina com: testes do item (incluindo **casos negativos**) + `php artisan test` completo verde + pint + varredura de travessão + commit + push. Escreva o teste das regras de negócio **antes** do código e guarde a saída da falha para o relatório.

### P1: o que os apps mais precisam

**R1. Consentimento (contrato 3.8.1, bloco B).**
`GET /consent-terms/current`, `POST /consent-acceptances`, `POST /consent-acceptances/{id}/revoke`, em [routes/api/consent.php](../backend/routes/api/consent.php) (está vazio de propósito, é o bloco B). Reutilize a definição de "termo vigente" que `ReportService` e `TaskService` já têm; extraia para um lugar só **se** isso evitar a terceira cópia, sem mexer no comportamento dos dois (os testes deles têm que continuar verdes). Casos negativos obrigatórios: termo que não é o vigente, tipo inválido, `ai_analysis` por psicólogo, aceite de outro usuário na revogação, aceite repetido (idempotência), reaceitar após revogar, revogar o geral e voltar a bloquear criação de relato (403).

**R2. Perfil, vínculos e lista de pacientes (contrato 3.8.2).**
`GET /psychologist/profile`, `GET /patient/bonds`, `GET /psychologist/bond-requests`, `GET /psychologist/patients`, `GET /psychologist/patients/{id}`. Os contadores de `/psychologist/patients` (`unread_messages`, `overdue_tasks`, `next_appointment_at`) dependem das tabelas de mensagem, tarefa e consulta; as tabelas existem desde as migrations, então faça a consulta já agora e valide com dados criados no teste (as rotas de escrita de chat e agenda saem em R3 e R4). Casos negativos: psicólogo não aprovado, vínculo de outro psicólogo (404), paciente com vínculo encerrado (aparece só em `status=ended`), nenhuma chave nem contagem derivada de relato.

**R3. Chat (contrato 3.8.3).**
Rotas em arquivo novo `routes/api/messages.php`, registrado em [routes/api.php](../backend/routes/api.php). `GET`, `POST` e `POST .../read`. Corpo cifrado (cast `encrypted` já existe no Model `Message`). Casos negativos: quem não participa do vínculo (404), vínculo pendente ou encerrado ao enviar (409), paciente sem aceite do termo (403), corpo vazio ou acima de 2000 (422), `after_id` devolvendo só os novos, `read` só marcando mensagens da outra parte, leitura em vínculo encerrado permitida. Prove em teste que o `body` no banco não é texto puro (como `ReportTest` faz com o relato).

**R4. Agenda (contrato 3.8.4).**
Rotas em arquivo novo `routes/api/appointments.php`. Os 5 endpoints. A janela de conflito de 60 minutos é **configuração** (por exemplo uma chave em `config/`), não número solto. Casos negativos: data no passado, vínculo alheio (404), vínculo não ativo (409), conflito sem `confirm_conflict` (422 em `errors.confirm_conflict`) e com `confirm_conflict: true` (201), reagendar muda o status para `rescheduled`, cancelar é idempotente, `done` não cancela (409), paciente tentando `POST /psychologist/appointments` (403), paciente vendo consulta de vínculo alheio (não aparece).

### P2: fecha o ciclo

**R5. Notificações (contrato 3.8.5) e eventos.**
Rotas em arquivo novo `routes/api/notifications.php`. Os três endpoints, mais a **geração** das linhas nos pontos certos, listados na tabela do contrato: solicitação, aceite e recusa de vínculo (`BondService`), tarefa criada (`TaskService::create`), mensagem enviada, consulta criada, reagendada e cancelada. Uma classe pequena de serviço para gravar a notificação é suficiente. A linha carrega **só tipo e id**, nunca texto de mensagem, de relato ou de tarefa. Teste cada ponto de geração e confira que os testes antigos de vínculo e tarefa seguem verdes.

**R6. Dados de demonstração.**
Amplie os seeders **sem quebrar os existentes** (a suíte tem que continuar verde): uma solicitação de vínculo pendente dirigida à psicóloga seed, mensagens entre a paciente e a psicóloga já vinculadas, duas consultas futuras e uma passada, uma notificação não lida para cada lado. Tudo fictício (RNF-63). Esses dados são o que a integração usa para conferir os apps contra o servidor real. Registre no relatório os e-mails e o que cada conta tem.

**R7. Coleção do Postman.**
Em [Calmind.postman_collection.json](../docs/api/Calmind.postman_collection.json), acrescente pastas para consentimento (a pasta `02 Consentimento` já existe e está sem implementação: faça-a verde), chat, agenda, notificações, lista de pacientes e perfil, com asserções positivas e negativas. Edite com cuidado: é um JSON grande e frágil. Só diga que o Newman passou se você **rodou** (veja [rodar-newman-sprint2.ps1](../docs/api/rodar-newman-sprint2.ps1)); se não deu para rodar, diga que as requisições foram escritas e não executadas.

### P3: se sobrar tempo

**R8. Consentimento do responsável legal (contrato 3.8.1, final, RF-49).** `POST` e `GET /psychologist/patients/{id}/guardian-consent`. As duas rotas já estão no mapa do `ReportPrivacyTest`. Leia o RF-49 e os CA-49.1 a CA-49.5 em [documento-requisitos.md](../docs/documento-requisitos.md) antes. Só acrescenta, nunca edita registro.

**R9. Auditoria de acesso ao prontuário (RF-17, Should).** Se o `AuditService` já resolver em poucas linhas, grave um registro em `GET /psychologist/patients/{id}` (resultado `allowed` e, para tentativa negada, `denied`). Se exigir mais que isso, **não faça** e diga no relatório.

## Como lidar com dúvida de contrato

O contrato foi escrito sem ver o código das rotas novas. Se achar um **conflito real** (a regra do contrato contradiz uma regra inviolável ou uma regra que já existe no código), faça o menor ajuste que preserve a regra inviolável, **atualize também o texto da seção 3.8** para refletir o que foi implementado, e liste o ajuste em "Desvios do contrato" no relatório com o motivo. Os apps já estão sendo escritos pelo texto original, então desvio é caro: use-o só quando for inevitável. Em dúvida de detalhe (mensagem de erro, ordem de campos), siga o texto, não invente.

Decisões já tomadas no contrato que você **não** reabre: ids de paciente são `users.id`; `crp` no formato `06/000001`; janela de conflito de 60 minutos; polling no lugar de websocket; sem prontuário como rota; erro de conflito de agenda como 422 em `errors.confirm_conflict`.

## Fora do escopo desta frente

Medicação, IA, push, preferências de notificação, painel Blade novo, qualquer coisa em `app/`. Não corrija bug que você achar nos apps: anote em "Dependências abertas" do relatório.

## Pronto

Os itens R1 a R5 verdes (P1 e P2 de rotas), seeders de R6, Postman de R7 escrito. No final: `php artisan test` completo com a saída colada no relatório (número de testes e asserções), `vendor/bin/pint --test` limpo, varredura de travessão limpa, relatório em dia, `git push`. Salve a saída bruta da suíte também em `docs/testes/2026-10-29-php-artisan-test-fechamento.txt` (ajuste a data se for outro dia).

## Prompt de partida (cole no Codex)

> Você é o Codex do Rafael no projeto Calmind (repositório já clonado). Faça `git fetch origin` e `git checkout -b codex/rafael-backend origin/integracao/fechamento-30-10`. Leia `instrucoes/00-instrucoes-gerais.md` e depois `instrucoes/codex-rafael-backend.md`, e execute a lista de trabalho na ordem, sem esperar nenhuma outra frente, com commit e push a cada item e o relatório sempre em dia. Siga a Regra 0 (nenhum travessão) e rode a varredura antes de cada commit.
