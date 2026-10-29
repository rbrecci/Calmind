# Contrato da API

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
**Calmind**: Saúde Mental & Acolhimento
Versão 1, de 19/08/2026. Cobre os blocos que as semanas 1 a 4 da Sprint 2 implementam. A seção 3.8 (contrato v2, de 29/10/2026) acrescenta as rotas do fechamento de 30/10: consentimento, perfil e lista de pacientes, chat, agenda e notificações.

> A versão executável deste contrato é a coleção `Calmind.postman_collection.json`, na mesma pasta. Este documento traz o que a coleção não expressa bem: as convenções que valem para **todos** os endpoints.
>
> Atende o RNF-58, que exige contrato único, versionado e documentado, consumido pelo app e pelo painel web.

---

## 1. Para que serve

O app React Native e o Laravel são construídos por pessoas diferentes, ao mesmo tempo. Sem contrato, o Caio não escreve uma tela enquanto o endpoint não existir, e o trabalho vira fila. Com o contrato, ele monta a tela na segunda mesmo que o endpoint só saia na quarta, porque já sabe o que vai receber.

O contrato também trava, de uma vez, quatro decisões que de outro modo seriam tomadas quarenta vezes de formas diferentes: formato de erro, formato de data, formato de lista e como o token viaja.

---

## 2. Convenções que valem para todo endpoint

### 2.1 Prefixo e versão

Toda rota começa com `/api/v1`. A versão no caminho existe porque o RNF-58 exige que mudança que quebra o contrato declare nova versão, e porque o aplicativo instalado no celular **não atualiza junto com o servidor**. Um app antigo continuará chamando `v1` depois de o `v2` existir.

### 2.2 Autenticação

Token por sessão, enviado em toda requisição autenticada:

```
Authorization: Bearer <token>
```

O token é devolvido pelo login e guardado no armazenamento seguro do aparelho. Nunca aparece em log, em URL ou em corpo de resposta que não seja o do próprio login (RNF-07). A sessão expira por inatividade (RNF-09).

### 2.3 Formato de erro, igual em todos os endpoints

```json
{
  "message": "Mensagem em português, para o usuário ler",
  "errors": {
    "email": ["Este campo é obrigatório."]
  }
}
```

`errors` só aparece em erro de validação. A mensagem nunca expõe detalhe interno, nome de tabela nem trecho de exceção (RNF-10, RNF-40).

| Código | Quando usar |
|--------|-------------|
| 200 | Deu certo |
| 201 | Deu certo e criou recurso |
| 401 | Sem token, token inválido ou expirado |
| 403 | Autenticado, mas o papel não pode fazer isso |
| 404 | Recurso não existe, **ou não pode existir para quem perguntou** |
| 409 | Conflito de estado, por exemplo tentar um segundo vínculo ativo |
| 422 | Dados inválidos |

**A linha do 404 é regra de privacidade, não de estilo.** Quando o psicólogo pede um relato privado pelo identificador, a resposta é 404 e não 403. O 403 confirmaria que existe alguma coisa ali, e o CA-23.5 exige que nem a existência seja perceptível.

### 2.4 Datas

Sempre no formato ISO 8601 com fuso, por exemplo `2026-08-19T21:30:00-03:00`. Nunca `19/08/2026`: formatar para o usuário é trabalho da tela, não do servidor.

### 2.5 Listas

```json
{
  "data": [ ... ],
  "meta": { "total": 42, "page": 1, "per_page": 20 }
}
```

**Cuidado com `meta.total` nas listas de relato:** ele conta apenas o que aquele perfil pode ver. Um total que somasse relatos privados denunciaria a existência deles e quebraria o CA-23.2.

---

## 3. Índice de endpoints

Cada linha tem os testes correspondentes na coleção do Postman.

### 3.1 Conta e autenticação

| Método | Rota | Requisito |
|--------|------|-----------|
| POST | `/auth/register` | RF-01 |
| POST | `/auth/login` | RF-02 |
| POST | `/auth/logout` | RNF-09 |
| GET | `/me` | RF-05 |

### 3.2 Consentimento

| Método | Rota | Requisito |
|--------|------|-----------|
| GET | `/consent-terms/current?type=general\|ai_analysis` | RF-03, RF-04 |
| POST | `/consent-acceptances` | RF-03, RNF-13 |
| POST | `/consent-acceptances/{id}/revoke` | RF-04 |
| POST | `/psychologist/patients/{id}/guardian-consent` | RF-49 |
| GET | `/psychologist/patients/{id}/guardian-consent` | RF-49 |

### 3.3 Cadastro profissional e administração

| Método | Rota | Requisito |
|--------|------|-----------|
| POST | `/psychologist/registration` | RF-33 |
| PUT | `/psychologist/profile` | RF-34 |
| POST | `/psychologist/profile/publish` | RF-34 |
| GET | `/admin/registrations?status=pending` | RF-44 |
| POST | `/admin/registrations/{id}/approve` | RF-44 |
| POST | `/admin/registrations/{id}/reject` | RF-44 |

### 3.4 Convite e vínculo

| Método | Rota | Requisito |
|--------|------|-----------|
| POST | `/psychologist/invitations` | RF-06, RNF-05 |
| DELETE | `/psychologist/invitations/{id}` | RF-08 |
| POST | `/patient/bonds/redeem-invitation` | RF-07 |
| GET | `/catalog/psychologists` | RF-09 |
| POST | `/patient/bonds/requests` | RF-10 |
| POST | `/psychologist/bond-requests/{id}/accept` | RF-11 |
| POST | `/psychologist/bond-requests/{id}/reject` | RF-11 |
| POST | `/bonds/{id}/end` | RF-13 |

### 3.5 Relatos

| Método | Rota | Requisito |
|--------|------|-----------|
| POST | `/patient/reports` | RF-22 |
| GET | `/patient/reports` | RF-22 |
| POST | `/patient/reports/{id}/unpublish` | RF-24 |
| GET | `/psychologist/patients/{id}/reports` | RF-23, RNF-08 |

---

### 3.6 Tarefas terapêuticas

Todas as rotas abaixo usam token Sanctum. Tarefas pertencem ao vínculo (`bond_id`), nunca diretamente ao paciente. A leitura inclui vínculos ativos e encerrados, mas omite tarefas arquivadas. O vínculo encerrado fica em modo somente leitura.

| Método | Rota | Papel | Resultado |
|--------|------|-------|-----------|
| GET | `/patient/tasks?page=1&per_page=20` | paciente | lista das próprias tarefas, pendentes antes das concluídas |
| GET | `/patient/tasks/{id}` | paciente | uma tarefa própria |
| POST | `/patient/tasks/{id}/complete` | paciente | conclusão idempotente |
| GET | `/psychologist/tasks?bond_id={id}&page=1&per_page=20` | psicólogo | tarefas de vínculo próprio |
| POST | `/psychologist/tasks` | psicólogo | cria tarefa em vínculo ativo |
| GET | `/psychologist/tasks/{id}` | psicólogo | uma tarefa de vínculo próprio |
| PUT | `/psychologist/tasks/{id}` | psicólogo | altera título, descrição ou prazo de tarefa pendente em vínculo ativo |
| DELETE | `/psychologist/tasks/{id}` | psicólogo | arquiva a tarefa sem removê-la do banco |

Criação exige `bond_id` inteiro, `title` entre 1 e 150 caracteres e `due_date` no formato `YYYY-MM-DD`, igual ou posterior à data atual. `description` é opcional. O paciente do vínculo precisa ter aceitado a versão vigente do termo geral. Atualização aceita um ou mais campos `title`, `description` e `due_date` com as mesmas regras. `bond_id` e `completed_at` não podem ser alterados por payload. A resposta 201 de criação e as respostas 200 de leitura, atualização e conclusão devolvem o objeto abaixo sem envelope:

```json
{
  "id": 12,
  "bond_id": 8,
  "title": "Respirar por cinco minutos",
  "description": "Ao fim da tarde",
  "due_date": "2026-10-23",
  "status": "pending",
  "completed_at": null,
  "created_at": "2026-10-22T19:30:00-03:00"
}
```

`status` vale `pending` ou `completed`, derivado de `completed_at`. A conclusão devolve `completed` e a primeira data de conclusão; repetir a chamada não altera essa data. Listas seguem `{ "data": [ ... ], "meta": { "total": 1, "page": 1, "per_page": 20 } }`. `per_page` vai de 1 a 50. O `DELETE` devolve 200 com `{ "message": "Tarefa arquivada." }`. Arquivar uma tarefa concluída preserva sua conclusão no banco.

Sem token: 401. Papel errado, profissional sem aprovação ou aceite geral do paciente ausente ou desatualizado na criação: 403. Identificador inexistente ou de outro vínculo: 404. Vínculo encerrado ou tarefa já concluída ao tentar editar: 409. Campos inválidos: 422. Criar em vínculo alheio responde 404. Criar em vínculo próprio encerrado responde 409. Nenhuma dessas rotas consulta relatos.

---

### 3.7 Uma observação sobre o responsável legal

Não existe rota sob `/guardian`, e isso é decisão de produto, não esquecimento. O responsável legal de paciente menor de idade não autentica na plataforma (DEC-17). Ele aparece em dois lugares e só neles: como contato no cadastro do paciente, devolvido ao psicólogo em `/psychologist/patients/{id}` conforme CA-36.5, e como sujeito do registro de consentimento acima, que **quem cria é o psicólogo**, nunca ele próprio.

---

## 3.8 Contrato v2: rotas do fechamento de 30/10/2026

Esta parte foi escrita em 29/10/2026 **antes** de o código existir, para o backend e as duas frentes do app serem feitos ao mesmo tempo. Quem implementa o backend cumpre este texto à risca. Quem constrói o app programa contra este texto, com mock, e não espera o servidor. Se o texto for insuficiente, a suposição mínima vai para o relatório da frente, nunca para uma conversa que bloqueia alguém.

Convenções herdadas da seção 2: erro `{message, errors?}`, datas ISO 8601 com offset `-03:00`, listas `{data, meta: {total, page, per_page}}`, `per_page` de 1 a 50 (exceto onde dito), toda rota sob `/api/v1`. Identificador de paciente em rota ou corpo é sempre o `users.id` (a API não expõe `patients.id`). Identificador de psicólogo vindo do catálogo e do vínculo é `psychologists.id`, como já é hoje.

Texto de usuário em português; identificadores em inglês (RNF-52). Nenhuma resposta nova traz preço, nota ou ranking (RNF-21, RNF-23).

### 3.8.1 Consentimento (bloco B)

| Método | Rota | Papel | Requisito |
|--------|------|-------|-----------|
| GET | `/consent-terms/current?type=general` | qualquer perfil autenticado | RF-03, RF-04 |
| POST | `/consent-acceptances` | qualquer perfil autenticado | RF-03, RF-04 |
| POST | `/consent-acceptances/{id}/revoke` | dono do aceite | RF-04 |

`GET /consent-terms/current`: `type` vale `general` (padrão) ou `ai_analysis`. O termo vigente é o de maior `effective_from` menor ou igual a agora, desempate por maior `id` (a mesma regra que `ReportService` e `TaskService` já usam). Resposta 200:

```json
{
  "id": 1,
  "type": "general",
  "version": "1.0",
  "body": "Texto do termo...",
  "effective_from": "2026-09-29T10:00:00-03:00",
  "accepted": false
}
```

`accepted` é `true` quando o usuário autenticado tem aceite **não revogado** exatamente desta versão. É assim que o app decide se mostra a tela de consentimento, sem mexer no `/me`. Sem termo vigente do tipo: 404. `type` inválido: 422.

`POST /consent-acceptances`, corpo `{ "consent_term_id": 1 }`. Resposta 201 na primeira vez:

```json
{
  "id": 7,
  "consent_term_id": 1,
  "type": "general",
  "version": "1.0",
  "accepted_at": "2026-10-29T20:00:00-03:00",
  "revoked_at": null
}
```

Regras: o termo precisa ser o **vigente do seu tipo**, senão 422 com `errors.consent_term_id`. Aceite repetido e não revogado devolve 200 com o mesmo objeto. Aceitar de novo um aceite revogado limpa `revoked_at`, atualiza `accepted_at` e devolve 200 (a tabela tem unicidade por usuário e termo). `ai_analysis` só pode ser aceito por paciente; outro perfil recebe 403.

`POST /consent-acceptances/{id}/revoke`: 200 com o mesmo objeto e `revoked_at` preenchido. Repetir é idempotente (200). Aceite de outro usuário: 404. Sem efeito retroativo (CA-04.3). Revogar o termo geral volta a bloquear relato e tarefa pela regra que já existe.

**Consentimento do responsável legal (RF-49), prioridade baixa.** Rotas já classificadas em `ReportPrivacyTest`:

| Método | Rota | Resultado |
|--------|------|-----------|
| POST | `/psychologist/patients/{id}/guardian-consent` | 201, registra (só acrescenta, nunca edita) |
| GET | `/psychologist/patients/{id}/guardian-consent` | 200 `{data, meta}` com os registros |

Corpo do POST: `guardian_name` (obrigatório, até 150), `obtained_at` (`YYYY-MM-DD`, não futura), `method` (`presencial`, `telefone`, `videochamada` ou `mensagem_escrita`), `note` (opcional). O servidor preenche `consent_term_id` com o termo geral vigente e `registered_by_user_id` com o psicólogo. Objeto devolvido: `{ id, guardian_name, obtained_at, method, note, consent_term_id, registered_by_user_id, created_at }`. Exige vínculo ativo do psicólogo com o paciente (senão 404) e paciente menor de 18 anos (senão 422 em `errors.patient`), conforme CA-49.1 e CA-49.4.

### 3.8.2 Perfil do psicólogo, vínculos e lista de pacientes

| Método | Rota | Papel |
|--------|------|-------|
| GET | `/psychologist/profile` | psicólogo |
| GET | `/patient/bonds` | paciente |
| GET | `/psychologist/bond-requests` | psicólogo aprovado |
| GET | `/psychologist/patients?status=active\|ended` | psicólogo aprovado |
| GET | `/psychologist/patients/{id}` | psicólogo aprovado |

`GET /psychologist/profile`, 200. Existe porque o app precisa saber em que ponto do cadastro o profissional está. Devolve **o mesmo objeto** que `POST /psychologist/registration`, `PUT /psychologist/profile` e `POST /psychologist/profile/publish` já devolvem hoje (veja `PsychologistRegistrationController::profile`), com um caso a mais:

```json
{
  "id": 1,
  "crp": "06/000001",
  "approval_status": "approved",
  "approval_note": null,
  "profile_approach": "Terapia cognitivo-comportamental",
  "profile_specialty": "Ansiedade e estresse",
  "profile_modality": "online",
  "profile_region": "São Paulo, SP",
  "profile_bio": "Texto escrito pelo profissional.",
  "profile_published_at": "2026-10-20T10:00:00-03:00"
}
```

`approval_status` vale `pending`, `approved` ou `rejected`, e ganha o valor `not_submitted` **somente nesta rota**, quando o psicólogo ainda não enviou o CRP (não há linha em `psychologists`). Nesse caso `id`, `crp`, `approval_note`, todos os `profile_*` e `profile_published_at` vêm `null`. `approval_note` traz a justificativa da recusa quando `rejected`. `profile_published_at` preenchido significa perfil publicado no catálogo. Os campos `profile_*` têm os mesmos nomes e valores aceitos por `PUT /psychologist/profile`.

`GET /patient/bonds`, 200 `{data, meta}`. Todos os vínculos do paciente, ordenados por situação (`active`, `pending`, `ended`) e depois por `id` decrescente:

```json
{
  "id": 8,
  "status": "active",
  "origin": "catalog",
  "requested_at": "2026-10-20T09:00:00-03:00",
  "responded_at": "2026-10-20T10:00:00-03:00",
  "ended_at": null,
  "psychologist": { "id": 1, "name": "Hermione Granger", "crp": "06/000001" },
  "unread_messages": 2
}
```

`unread_messages` conta mensagens do psicólogo ainda sem `read_at` neste vínculo. É esta rota que dá ao app o `bond_id` para chat e agenda.

`GET /psychologist/bond-requests`, 200 `{data, meta}`. Só solicitações `pending` dirigidas ao psicólogo autenticado, mais antigas primeiro:

```json
{
  "id": 15,
  "status": "pending",
  "origin": "catalog",
  "requested_at": "2026-10-29T08:00:00-03:00",
  "patient": { "id": 21, "name": "Frodo Bolseiro" }
}
```

`id` é o id do vínculo, o mesmo que `accept` e `reject` já recebem.

`GET /psychologist/patients`, 200 `{data, meta}`. `status` padrão `active`. Ordenado pelo nome do paciente:

```json
{
  "bond_id": 8,
  "status": "active",
  "since": "2026-10-20T10:00:00-03:00",
  "ended_at": null,
  "patient": { "id": 21, "name": "Elizabeth Bennet" },
  "unread_messages": 1,
  "overdue_tasks": 0,
  "next_appointment_at": "2026-11-03T15:00:00-03:00"
}
```

`unread_messages` conta mensagens do paciente sem `read_at`. `overdue_tasks` conta tarefas pendentes, não arquivadas, com prazo anterior a hoje. `next_appointment_at` é a próxima consulta `scheduled` ou `rescheduled` no futuro, ou `null`. Em `status=ended` os três contadores vêm `0`, `0` e `null`. **Nenhum campo desta rota nasce de relato** (regra da seção 4): a rota não pode tocar o Model `Report`.

`GET /psychologist/patients/{id}`, `{id}` é o `users.id` do paciente. Vínculo ativo **ou encerrado** deste psicólogo com o paciente; qualquer outro caso, 404. 200:

```json
{
  "bond_id": 8,
  "bond_status": "active",
  "since": "2026-10-20T10:00:00-03:00",
  "patient": { "id": 21, "name": "Elizabeth Bennet" },
  "is_minor": false,
  "guardian": null
}
```

Quando `is_minor` é `true`, `guardian` vem `{ "name": "...", "phone": "...", "relationship": "..." }` (CA-36.5). Maior de idade: `guardian` é `null`. O prontuário consolidado do app é a **composição** desta rota com `/psychologist/patients/{id}/reports`, `/psychologist/tasks?bond_id=` e `/psychologist/appointments?bond_id=`; não existe rota de prontuário.

### 3.8.3 Chat

Mensagens pertencem ao vínculo. O corpo é cifrado em repouso (regra 10 das regras invioláveis).

| Método | Rota | Papel |
|--------|------|-------|
| GET | `/bonds/{id}/messages` | paciente ou psicólogo do vínculo |
| POST | `/bonds/{id}/messages` | paciente ou psicólogo do vínculo |
| POST | `/bonds/{id}/messages/read` | paciente ou psicólogo do vínculo |

Objeto:

```json
{
  "id": 40,
  "bond_id": 8,
  "sender_user_id": 21,
  "mine": true,
  "body": "Bom dia, consegui fazer a respiração.",
  "sent_at": "2026-10-29T08:15:00-03:00",
  "read_at": null
}
```

`mine` é `true` quando o remetente é o usuário autenticado.

`GET`: ordem crescente de `id`. Parâmetros `after_id` (devolve só `id` maior), `page` e `per_page` (padrão 50, máximo 100). O app faz *polling* com `after_id`; não há websocket. Vínculo encerrado continua legível. Quem não participa do vínculo recebe 404.

`POST`, corpo `{ "body": "texto" }`, `body` obrigatório, de 1 a 2000 caracteres após `trim`. 201 com o objeto. Vínculo não ativo: 409 (CA-15.2). Paciente sem aceite vigente do termo geral: 403 com mensagem `É preciso aceitar o termo de uso antes de enviar mensagens.` Psicólogo não aprovado: 403. A falha de envio não pode devolver o objeto como entregue (CA-15.3).

`POST .../read`: marca como lidas (`read_at = agora`) as mensagens **da outra parte** ainda sem leitura. 200 `{ "read": 3 }`. Idempotente.

### 3.8.4 Agenda

| Método | Rota | Papel |
|--------|------|-------|
| GET | `/psychologist/appointments` | psicólogo aprovado |
| POST | `/psychologist/appointments` | psicólogo aprovado |
| PUT | `/psychologist/appointments/{id}` | psicólogo aprovado |
| POST | `/psychologist/appointments/{id}/cancel` | psicólogo aprovado |
| GET | `/patient/appointments` | paciente |

O paciente só lê (CA-26.3): não existe rota de escrita dele, e as rotas de escrita do psicólogo respondem 403 para paciente pelo middleware de papel.

Objeto (os campos `patient` e `psychologist` aparecem conforme quem consulta):

```json
{
  "id": 3,
  "bond_id": 8,
  "scheduled_at": "2026-11-03T15:00:00-03:00",
  "status": "scheduled",
  "modality": "online",
  "notes": "Trazer o diário da semana",
  "created_at": "2026-10-29T09:00:00-03:00",
  "patient": { "id": 21, "name": "Elizabeth Bennet" }
}
```

Para o psicólogo vem `patient`; para o paciente vem `psychologist: { "id": 1, "name": "Hermione Granger" }`. `status` vale `scheduled`, `rescheduled`, `cancelled` ou `done`. `modality` vale `online`, `presencial` ou `null`.

`GET`: parâmetros `bond_id` (psicólogo), `from` e `to` (`YYYY-MM-DD`, inclusive, filtram `scheduled_at`), `page`, `per_page`. Ordem crescente de `scheduled_at`. Inclui canceladas e realizadas; o app filtra. O paciente vê apenas consultas dos próprios vínculos, ativos ou encerrados.

`POST`, corpo `bond_id`, `scheduled_at` (ISO 8601 com offset), `modality` opcional, `notes` opcional (até 255), `confirm_conflict` opcional booleano. 201 com o objeto. Regras:

- `scheduled_at` no passado: 422 com `errors.scheduled_at` (CA-40.4).
- Vínculo alheio: 404. Vínculo não ativo: 409.
- **Conflito (CA-40.3):** existe outra consulta `scheduled` ou `rescheduled` do mesmo psicólogo com `scheduled_at` a menos de 60 minutos do pedido. Sem `confirm_conflict: true`, responde 422 com `errors.confirm_conflict = ["Este horário conflita com outra consulta. Confirme para agendar mesmo assim."]`. O app mostra o aviso e reenvia com `confirm_conflict: true` se o profissional confirmar. Os 60 minutos são um parâmetro de configuração, não número solto no código.

`PUT`: aceita `scheduled_at`, `modality`, `notes`, `confirm_conflict`, com as mesmas validações. Mudar `scheduled_at` coloca o status em `rescheduled`. Consulta `cancelled` ou `done`: 409. Alheia: 404.

`POST .../cancel`: 200 com `status: "cancelled"`. Repetir é idempotente (200). Consulta `done`: 409. Alheia: 404.

### 3.8.5 Notificações dentro do app

Evento visível no app, sem push (CA-16.3). A notificação carrega **tipo e identificador, nunca conteúdo clínico** (CA-16.1).

| Método | Rota | Papel |
|--------|------|-------|
| GET | `/notifications?unread=1` | paciente ou psicólogo |
| POST | `/notifications/{id}/read` | dono |
| POST | `/notifications/read-all` | paciente ou psicólogo |

Objeto: `{ "id": 5, "type": "message.received", "resource_id": 40, "created_at": "2026-10-29T08:15:00-03:00", "read_at": null }`. `GET` devolve `{data, meta}`, mais novas primeiro; `unread=1` filtra as não lidas. `POST .../read` devolve o objeto (200); de outro usuário, 404. `read-all` devolve `{ "read": n }`.

Tipos e quem recebe (o servidor grava a linha no momento do evento):

| `type` | Destinatário | `resource_id` |
|--------|--------------|---------------|
| `message.received` | a outra parte do vínculo | id da mensagem |
| `task.assigned` | paciente | id da tarefa |
| `appointment.scheduled` | paciente | id da consulta |
| `appointment.rescheduled` | paciente | id da consulta |
| `appointment.cancelled` | paciente | id da consulta |
| `bond.requested` | psicólogo | id do vínculo |
| `bond.accepted` | paciente | id do vínculo |
| `bond.rejected` | paciente | id do vínculo |

Preferências de notificação (CA-16.2) e push ficam fora desta versão.

### 3.8.6 O que fica de fora do fechamento de 30/10

Medicação (RF-27, RF-28, RF-29, RF-38, RF-43), análise por IA (RF-41, RF-42), consentimento de IA pela interface, auditoria de leitura (RF-17), prontuário como rota própria, preferências de notificação, push e chat em tempo real. Nenhuma frente os implementa. O texto e o ABNT registram o corte como evolução futura.

---

## 4. A regra que este contrato existe para proteger

**Nenhum endpoint sob `/psychologist` ou `/admin` consulta a tabela `reports`.** Todos leem a view `shared_reports`, definida no `schema.sql`.

Escrito aqui, isso deixa de depender de alguém lembrar na hora de montar a query e passa a ser item conferível na revisão de código. A mesma regra vale para a rotina que monta o pacote enviado ao serviço de IA, na semana 8.

O teste automatizado do RNF-08, previsto para a semana 4, verifica exatamente isso.

---

## 5. O que ainda não está neste contrato

Chat, agenda, notificações, lista de pacientes e consentimento entraram na seção 3.8. Continuam de fora, e a seção 3.8.6 explica o corte:

| Bloco | Requisitos |
|-------|------------|
| Medicação | RF-27 a RF-29, RF-38, RF-39, RF-43 |
| Análise por IA | RF-41, RF-42 |
| Auditoria de leitura | RF-17 |
