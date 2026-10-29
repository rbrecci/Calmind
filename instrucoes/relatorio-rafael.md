# Relatório da frente Rafael

## Estado final
Branch: codex/rafael-backend. Último commit anterior: 4cbbffc. Atualização: 29/10/2026, 08:50, America/Sao_Paulo.

## Itens
| Item | Situação | Commit | Evidência |
|------|----------|--------|-----------|
| R1 | feito | bb18026 | Consentimento, idempotência, revogação e bloqueio clínico |
| R2 | feito | 1a3a618 | Perfil, vínculos e diretório com contadores |
| R3 | feito | 6a14d71 | Chat cifrado e avisos ao destinatário |
| R4 | feito | d16e470 | Agenda com conflitos configuráveis |
| R5 | feito | 6a14d71 e 4cbbffc | Notificações privadas e geração nos oito eventos |
| R6 | feito | 1131350 | Seed completo testado e pacientes sem vínculo preservados |
| R7 | feito | commit desta atualização | Newman: 119 requisições e 228 asserções, zero falhas |
| R8 | feito | próximo commit | 3 testes e 38 asserções passaram |
| R9 | não feito | nenhum | Auditoria de leitura fora do fechamento conforme instruções gerais e contrato 3.8.6 |

## Evidência colada
Execução inicial encontrou BOM em teste recém-criado durante a descoberta da suíte. BOM removido antes da execução vermelha de R1/R2.

## Suposições
Execuções de testes serializadas para preservar o banco compartilhado calmind_test.
Sem termo geral vigente, registrar consentimento do responsável retorna 404 e não grava. O contrato não define esse caso.
R9 omitido porque as instruções gerais e o contrato 3.8.6 excluem auditoria de leitura.

## Desvios do contrato
O envio pelo psicólogo também exige aceite geral vigente do paciente, conforme regra inviolável 5. A regra preserva consentimento antes de gravar qualquer mensagem.

## Dependências abertas
Integração com os aplicativos será conferida pela sessão de integração.
Contas fictícias de demonstração: hermione.granger@example.com tem Elizabeth vinculada e Samwise pendente; elizabeth.bennet@example.com tem duas mensagens, duas consultas futuras e uma passada; samwise.gamgee@example.com tem solicitação pendente. Hermione e Elizabeth têm uma notificação não lida cada. A senha é a constante já existente UserSeeder::PASSWORD. Os seeders foram executados e conferidos no banco de teste; não apliquei seed nem reset ao banco de desenvolvimento.

## Não verificado
Suíte final com R8 e seeder: 220 testes e 3.835 asserções passaram em 55,15 segundos. Pint completo passou.
Newman executado contra Laravel e MySQL locais: 9 requisições e 15 asserções na autenticação, mais 110 requisições e 213 asserções nas pastas 02 a 10. Ambas as etapas terminaram com exit 0.
Não verificados: aplicativos contra o backend, celular físico e concorrência entre agendamentos simultâneos.

## Arquivos que você criou ou alterou fora da sua pasta
A saída bruta da suíte será salva em docs/testes conforme solicitação específica da frente.
Também foi salva a execução Newman em docs/testes/2026-10-29-newman-fechamento.txt. O runner criou contas fictícias pelo HTTP local no banco de desenvolvimento, sem reset.
### calmind-r1-r2-red.txt

```text

   FAIL  Tests\Feature\ConsentApiTest
  ⨯ current term accept revoke and reaccept are idempotent                                                      27.80s
  ⨯ current selection and invalid terms and roles                                                                0.10s
  ⨯ revoking general consent blocks new report                                                                   0.43s

   FAIL  Tests\Feature\PatientDirectoryTest
  ⨯ profiles include not submitted and existing registration                                                     0.13s
  ⨯ patient lists own bonds and unread messages                                                                  0.46s
  ⨯ directory counts only relevant tasks messages and appointments                                               0.16s
  ⨯ detail is scoped to own active or ended bonds and shows guardian for minors                                  0.11s
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ConsentApiTest > current term accept revoke and reaccept are idempotent
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\ConsentApiTest.php:25
     21▕     public function test_current_term_accept_revoke_and_reaccept_are_idempotent(): void
     22▕     {
     23▕         $term = ConsentTerm::factory()->create(['effective_from' => now()->subDay()]);
     24▕         $user = User::factory()->create();
  ➜  25▕         $this->as($user)->getJson('/api/v1/consent-terms/current')->assertOk()->assertJsonPath('accepted', false)->assertJsonPath('id', $term->id);
     26▕         $first = $this->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $term->id])->assertCreated();
     27▕         $id = $first->json('id');
     28▕         $this->travel(1)->minutes();
     29▕         $this->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $term->id])->assertOk()->assertJsonPath('accepted_at', $first->json('accepted_at'));

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ConsentApiTest > current selection and invalid terms and roles
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\ConsentApiTest.php:45
     41▕     {
     42▕         $old = ConsentTerm::factory()->create(['version' => '0.9', 'effective_from' => now()->subDays(2)]);
     43▕         $current = ConsentTerm::factory()->create(['effective_from' => now()->subDay()]);
     44▕         ConsentTerm::factory()->create(['version' => '2.0', 'effective_from' => now()->addDay()]);
  ➜  45▕         $this->as(User::factory()->create())->getJson('/api/v1/consent-terms/current')->assertOk()->assertJsonPath('id', $current->id);
     46▕         $this->getJson('/api/v1/consent-terms/current?type=invalid')->assertUnprocessable()->assertJsonValidationErrors('type');
     47▕         $this->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $old->id])->assertUnprocessable()->assertJsonValidationErrors('consent_term_id');
     48▕         $this->getJson('/api/v1/consent-terms/current?type=ai_analysis')->assertNotFound();
     49▕         $ai = ConsentTerm::factory()->create(['type' => 'ai_analysis']);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\ConsentApiTest > revoking general consent blocks new report
  Expected response status code [201] but received 404.
Failed asserting that 404 is identical to 201.

  at tests\Feature\ConsentApiTest.php:57
     53▕     public function test_revoking_general_consent_blocks_new_report(): void
     54▕     {
     55▕         $term = ConsentTerm::factory()->create();
     56▕         $patient = \App\Models\Patient::factory()->create();
  ➜  57▕         $accepted = $this->as($patient->user)->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $term->id])->assertCreated();
     58▕         $this->postJson('/api/v1/consent-acceptances/'.$accepted->json('id').'/revoke')->assertOk();
     59▕         $this->postJson('/api/v1/patient/reports', ['body' => 'Registro fictÃ­cio', 'visibility' => 'private'])->assertForbidden();
     60▕     }
     61▕ }

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\PatientDirectoryTest > profiles include not submitted and existing registration
  Expected response status code [200] but received 405.
Failed asserting that 405 is identical to 200.

  at tests\Feature\PatientDirectoryTest.php:28
     24▕     }
     25▕
     26▕     public function test_profiles_include_not_submitted_and_existing_registration(): void
     27▕     {
  ➜  28▕         $this->as(User::factory()->psychologist()->create())->getJson('/api/v1/psychologist/profile')->assertOk()->assertJsonPath('approval_status', 'not_submitted')->assertJsonPath('id', null)->assertJsonPath('crp', null);
     29▕         $psy = Psychologist::factory()->approved()->create();
     30▕         $this->as($psy->user)->getJson('/api/v1/psychologist/profile')->assertOk()->assertJsonPath('id', $psy->id)->assertJsonPath('crp', $psy->crp_region.'/'.$psy->crp_number);
     31▕     }
     32▕

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\PatientDirectoryTest > patient lists own bonds and unread messages
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\PatientDirectoryTest.php:41
     37▕         Bond::factory()->create(['patient_id' => $bond->patient_id]);
     38▕         Bond::factory()->active()->create();
     39▕         Message::create(['bond_id' => $bond->id, 'sender_user_id' => $bond->psychologist->user_id, 'body' => 'Texto fictício']);
     40▕         Message::create(['bond_id' => $bond->id, 'sender_user_id' => $bond->patient->user_id, 'body' => 'Resposta fictícia']);
  ➜  41▕         $this->as($bond->patient->user)->getJson('/api/v1/patient/bonds')->assertOk()->assertJsonPath('meta.total', 3)->assertJsonPath('data.0.status', 'active')->assertJsonPath('data.0.unread_messages', 1)->assertJsonPath('data.1.status', 'pending')->assertJsonPath('data.2.status', 'ended');
     42▕     }
     43▕
     44▕     public function test_directory_counts_only_relevant_tasks_messages_and_appointments(): void
     45▕     {

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\PatientDirectoryTest > directory counts only relevant tasks messages and appointments
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\PatientDirectoryTest.php:54
     50▕         foreach ([[], ['completed_at' => now()], ['archived_at' => now()]] as $extra) {
     51▕             Task::create(array_merge(['bond_id' => $bond->id, 'title' => 'Tarefa fictícia', 'due_date' => now()->subDay(), 'created_by_user_id' => $bond->psychologist->user_id], $extra));
     52▕         }
     53▕         $appointment = Appointment::create(['bond_id' => $bond->id, 'scheduled_at' => now()->addDay(), 'status' => 'scheduled', 'created_by_user_id' => $bond->psychologist->user_id]);
  ➜  54▕         $response = $this->as($bond->psychologist->user)->getJson('/api/v1/psychologist/patients')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.patient.id', $bond->patient->user_id)->assertJsonPath('data.0.unread_messages', 1)->assertJsonPath('data.0.overdue_tasks', 1)->assertJsonPath('data.0.next_appointment_at', $appointment->scheduled_at->toIso8601String());
     55▕         $this->assertSame(['bond_id', 'status', 'since', 'ended_at', 'patient', 'unread_messages', 'overdue_tasks', 'next_appointment_at'], array_keys($response->json('data.0')));
     56▕         $this->getJson('/api/v1/psychologist/patients?status=ended')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.bond_id', $ended->id)->assertJsonPath('data.0.unread_messages', 0)->assertJsonPath('data.0.overdue_tasks', 0)->assertJsonPath('data.0.next_appointment_at', null);
     57▕         $this->getJson('/api/v1/psychologist/bond-requests')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $pending->id);
     58▕     }

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\PatientDirectoryTest > detail is scoped to own active or ended bonds and shows guardian for…
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\PatientDirectoryTest.php:64
     60▕     public function test_detail_is_scoped_to_own_active_or_ended_bonds_and_shows_guardian_for_minors(): void
     61▕     {
     62▕         $minor = Patient::factory()->minor()->create();
     63▕         $bond = Bond::factory()->active()->create(['patient_id' => $minor->id]);
  ➜  64▕         $this->as($bond->psychologist->user)->getJson('/api/v1/psychologist/patients/'.$minor->user_id)->assertOk()->assertJsonPath('is_minor', true)->assertJsonPath('guardian.name', $minor->guardian_name);
     65▕         $bond->update(['status' => 'ended', 'ended_at' => now()]);
     66▕         $this->getJson('/api/v1/psychologist/patients/'.$minor->user_id)->assertOk()->assertJsonPath('bond_status', 'ended');
     67▕         $this->as(Psychologist::factory()->approved()->create()->user)->getJson('/api/v1/psychologist/patients/'.$minor->user_id)->assertNotFound();
     68▕         $bond->psychologist->update(['approval_status' => 'rejected']);


  Tests:    7 failed (14 assertions)
  Duration: 31.18s


```

### calmind-chat-agenda-red.txt

```text

   FAIL  Tests\Feature\AppointmentTest
  ⨯ schedule conflict confirmation reschedule and cancel                                                         7.18s
  ⨯ patient listing is scoped and dates are inclusive                                                            0.09s
  ⨯ permissions inactive bonds past dates and foreign resources                                                  0.11s
  ⨯ conflict window is configurable and excludes cancelled and self                                              0.11s

   FAIL  Tests\Feature\MessageTest
  ⨯ send poll read and encryption                                                                                0.16s
  ⨯ membership and ended or pending bonds                                                                        0.13s
  ⨯ consent approval validation and authentication                                                               0.12s
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\AppointmentTest > schedule conflict confirmation reschedule and cancel
  Expected response status code [201] but received 404.
Failed asserting that 404 is identical to 201.

  at tests\Feature\AppointmentTest.php:32
     28▕     {
     29▕         $bond = Bond::factory()->active()->create();
     30▕         $url = '/api/v1/psychologist/appointments';
     31▕         $data = $this->data($bond);
  ➜  32▕         $created = $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated()
     33▕             ->assertJsonPath('status', 'scheduled')->assertJsonPath('patient.id', $bond->patient->user_id);
     34▕         $id = $created->json('id');
     35▕         $this->as($bond->psychologist->user)->postJson($url, $data)->assertUnprocessable()->assertJsonValidationErrors('confirm_conflict');
     36▕         $this->as($bond->psychologist->user)->postJson($url, [...$data, 'confirm_conflict' => true])->assertCreated();

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\AppointmentTest > patient listing is scoped and dates are inclusive
  Expected response status code [201] but received 404.
Failed asserting that 404 is identical to 201.

  at tests\Feature\AppointmentTest.php:52
     48▕         $bond = Bond::factory()->active()->create();
     49▕         $other = Bond::factory()->active()->create();
     50▕         $url = '/api/v1/psychologist/appointments';
     51▕         $data = $this->data($bond);
  ➜  52▕         $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated();
     53▕         $this->as($other->psychologist->user)->postJson($url, $this->data($other))->assertCreated();
     54▕         $day = now()->addDays(2)->toDateString();
     55▕         $bond->update(['status' => 'ended']);
     56▕         $this->as($bond->patient->user)->getJson("/api/v1/patient/appointments?from={$day}&to={$day}")->assertOk()

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\AppointmentTest > permissions inactive bonds past dates and foreign resources
  Expected response status code [401] but received 404.
Failed asserting that 404 is identical to 401.

  at tests\Feature\AppointmentTest.php:68
     64▕         $bond = Bond::factory()->active()->create();
     65▕         $other = Bond::factory()->active()->create();
     66▕         $url = '/api/v1/psychologist/appointments';
     67▕         $data = $this->data($bond);
  ➜  68▕         $this->getJson($url)->assertUnauthorized();
     69▕         $this->as($bond->patient->user)->postJson($url, $data)->assertForbidden();
     70▕         $this->as($other->psychologist->user)->postJson($url, $data)->assertNotFound();
     71▕         $this->as($bond->psychologist->user)->postJson($url, [...$data, 'scheduled_at' => now()->subDay()->toIso8601String()])->assertUnprocessable()->assertJsonValidationErrors('scheduled_at');
     72▕         $id = $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated()->json('id');

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\AppointmentTest > conflict window is configurable and excludes cancelled and self
  Expected response status code [201] but received 404.
Failed asserting that 404 is identical to 201.

  at tests\Feature\AppointmentTest.php:90
     86▕         config(['calmind.appointment.conflict_minutes' => 90]);
     87▕         $bond = Bond::factory()->active()->create();
     88▕         $url = '/api/v1/psychologist/appointments';
     89▕         $data = $this->data($bond);
  ➜  90▕         $id = $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated()->json('id');
     91▕         $this->as($bond->psychologist->user)->putJson("{$url}/{$id}", ['notes' => 'Sem conflito próprio'])->assertOk();
     92▕         $data['scheduled_at'] = now()->addDays(2)->startOfHour()->addMinutes(75)->toIso8601String();
     93▕         $this->as($bond->psychologist->user)->postJson($url, $data)->assertUnprocessable()->assertJsonValidationErrors('confirm_conflict');
     94▕         $this->as($bond->psychologist->user)->postJson("{$url}/{$id}/cancel")->assertOk();

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\MessageTest > send poll read and encryption
  Expected response status code [201] but received 404.
Failed asserting that 404 is identical to 201.

  at tests\Feature\MessageTest.php:39
     35▕     {
     36▕         $bond = $this->bond();
     37▕         $url = "/api/v1/bonds/{$bond->id}/messages";
     38▕         $first = $this->as($bond->patient->user)->postJson($url, ['body' => '  Bom dia  '])
  ➜  39▕             ->assertCreated()->assertJsonPath('body', 'Bom dia')->assertJsonPath('mine', true);
     40▕         $id = $first->json('id');
     41▕         $this->assertNotSame('Bom dia', DB::table('messages')->where('id', $id)->value('body'));
     42▕         $reply = $this->as($bond->psychologist->user)->postJson($url, ['body' => 'Olá'])->assertCreated();
     43▕         $this->as($bond->patient->user)->getJson($url."?after_id={$id}")->assertOk()

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\MessageTest > membership and ended or pending bonds
  Expected response status code [409] but received 404.
Failed asserting that 404 is identical to 409.

  at tests\Feature\MessageTest.php:62
     58▕         $this->as($outsider)->postJson($url, ['body' => 'Olá'])->assertNotFound();
     59▕         $this->as($outsider)->postJson($url.'/read')->assertNotFound();
     60▕         foreach (['pending', 'ended'] as $status) {
     61▕             $bond->update(['status' => $status]);
  ➜  62▕             $this->as($bond->patient->user)->postJson($url, ['body' => 'Olá'])->assertStatus(409);
     63▕         }
     64▕         $this->as($bond->patient->user)->getJson($url)->assertOk();
     65▕         $this->as($bond->psychologist->user)->getJson($url)->assertOk();
     66▕     }

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\MessageTest > consent approval validation and authentication
  Expected response status code [401] but received 404.
Failed asserting that 404 is identical to 401.

  at tests\Feature\MessageTest.php:72
     68▕     public function test_consent_approval_validation_and_authentication(): void
     69▕     {
     70▕         $bond = Bond::factory()->active()->create();
     71▕         $url = "/api/v1/bonds/{$bond->id}/messages";
  ➜  72▕         $this->getJson($url)->assertUnauthorized();
     73▕         $this->as($bond->patient->user)->postJson($url, ['body' => 'Olá'])->assertForbidden()
     74▕             ->assertJsonPath('message', 'É preciso aceitar o termo de uso antes de enviar mensagens.');
     75▕         foreach (['', '   ', str_repeat('a', 2001)] as $body) {
     76▕             $this->as($bond->patient->user)->postJson($url, ['body' => $body])->assertUnprocessable()->assertJsonValidationErrors('body');


  Tests:    7 failed (17 assertions)
  Duration: 8.38s


```

### calmind-r5-red.txt

```text

   FAIL  Tests\Feature\NotificationTest
  ⨯ notifications are private paginated and read idempotently                                                    8.18s
  ⨯ bond request acceptance and rejection notify only recipient                                                  0.35s
  ⨯ task assignment notifies without task content                                                                0.15s
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\NotificationTest > notifications are private paginated and read idempotently
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\NotificationTest.php:32
     28▕         $owner = $bond->patient->user;
     29▕         $first = Notification::create(['user_id' => $owner->id, 'type' => 'message.received', 'resource_id' => 12]);
     30▕         $second = Notification::create(['user_id' => $owner->id, 'type' => 'task.assigned', 'resource_id' => 13]);
     31▕         $other = Notification::create(['user_id' => $bond->psychologist->user_id, 'type' => 'bond.requested', 'resource_id' => $bond->id]);
  ➜  32▕         $this->as($owner)->getJson('/api/v1/notifications?unread=1')->assertOk()->assertJsonPath('meta.total', 2)->assertJsonPath('data.0.id', $second->id);
     33▕         $read = $this->as($owner)->postJson("/api/v1/notifications/{$first->id}/read")->assertOk();
     34▕         $this->assertSame(['id', 'type', 'resource_id', 'created_at', 'read_at'], array_keys($read->json()));
     35▕         $this->travel(1)->minutes();
     36▕         $this->as($owner)->postJson("/api/v1/notifications/{$first->id}/read")->assertOk()->assertJsonPath('read_at', $read->json('read_at'));

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\NotificationTest > bond request acceptance and rejection notify only recipient
  Failed asserting that a row in the table [notifications] matches the attributes {
    "user_id": 4,
    "type": "bond.requested",
    "resource_id": 2
}.

The table is empty.

  at tests\Feature\NotificationTest.php:53
     49▕         foreach (['accept', 'reject'] as $action) {
     50▕             $patient = \App\Models\Patient::factory()->create();
     51▕             $psychologist = \App\Models\Psychologist::factory()->published()->create();
     52▕             $bond = app(BondService::class)->request($patient->user, $psychologist->id);
  ➜  53▕             $this->assertDatabaseHas('notifications', ['user_id' => $psychologist->user_id, 'type' => 'bond.requested', 'resource_id' => $bond->id]);
     54▕             app(BondService::class)->{$action}($psychologist->user, $bond->id);
     55▕             $this->assertDatabaseHas('notifications', ['user_id' => $patient->user_id, 'type' => $action === 'accept' ? 'bond.accepted' : 'bond.rejected', 'resource_id' => $bond->id]);
     56▕         }
     57▕         $this->assertDatabaseCount('notifications', 4);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\NotificationTest > task assignment notifies without task content
  Failed asserting that a row in the table [notifications] matches the attributes {
    "user_id": 5,
    "type": "task.assigned",
    "resource_id": 1
}.

The table is empty.

  at tests\Feature\NotificationTest.php:66
     62▕         $bond = Bond::factory()->active()->create();
     63▕         $term = ConsentTerm::create(['type' => 'general', 'version' => '1', 'body' => 'Termo fictício', 'effective_from' => now()->subDay(), 'published_by_user_id' => User::factory()->admin()->create()->id]);
     64▕         ConsentAcceptance::create(['user_id' => $bond->patient->user_id, 'consent_term_id' => $term->id]);
     65▕         $task = app(TaskService::class)->create($bond->psychologist->user, ['bond_id' => $bond->id, 'title' => 'Conteúdo reservado da tarefa', 'due_date' => now()->addDay()->toDateString()]);
  ➜  66▕         $this->assertDatabaseHas('notifications', ['user_id' => $bond->patient->user_id, 'type' => 'task.assigned', 'resource_id' => $task->id]);
     67▕         $this->as($bond->patient->user)->getJson('/api/v1/notifications')->assertOk()->assertDontSee('Conteúdo reservado');
     68▕     }
     69▕ }


  Tests:    3 failed (6 assertions)
  Duration: 9.15s


```

### R8: vermelho antes da implementacao

```text

   FAIL  Tests\Feature\GuardianConsentTest
  ⨯ minor consent is append only and server sets term and author                                                 8.01s
  ⨯ consent requires own active bond approval and minor patient                                                  0.11s
  ⨯ invalid fields and missing current term do not create records                                                0.11s
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\GuardianConsentTest > minor consent is append only and server sets term and author
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests\Feature\GuardianConsentTest.php:34
     30▕     {
     31▕         $term = ConsentTerm::factory()->create();
     32▕         $bond = Bond::factory()->active()->create(['patient_id' => Patient::factory()->minor()]);
     33▕         $url = '/api/v1/psychologist/patients/'.$bond->patient->user_id.'/guardian-consent';
  ➜  34▕         $this->as($bond->psychologist->user)->getJson($url)->assertOk()->assertJsonPath('meta.total', 0);
     35▕         $payload = array_merge($this->payload(), ['consent_term_id' => 9999, 'registered_by_user_id' => 9999]);
     36▕         $first = $this->postJson($url, $payload)->assertCreated()->assertJsonPath('consent_term_id', $term->id)->assertJsonPath('registered_by_user_id', $bond->psychologist->user_id)->assertJsonPath('obtained_at', today()->toDateString());
     37▕         $second = $this->postJson($url, array_merge($this->payload(), ['method' => 'telefone']))->assertCreated();
     38▕         $this->assertNotSame($first->json('id'), $second->json('id'));

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\GuardianConsentTest > consent requires own active bond approval and minor patient
  Expected response status code [401] but received 404.
Failed asserting that 404 is identical to 401.

  at tests\Feature\GuardianConsentTest.php:50
     46▕     {
     47▕         ConsentTerm::factory()->create();
     48▕         $bond = Bond::factory()->active()->create(['patient_id' => Patient::factory()->minor()]);
     49▕         $url = '/api/v1/psychologist/patients/'.$bond->patient->user_id.'/guardian-consent';
  ➜  50▕         $this->getJson($url)->assertUnauthorized();
     51▕         $this->as($bond->patient->user)->postJson($url, $this->payload())->assertForbidden();
     52▕         $this->as(Psychologist::factory()->approved()->create()->user)->getJson($url)->assertNotFound();
     53▕         $this->postJson($url, $this->payload())->assertNotFound();
     54▕         $bond->update(['status' => 'ended', 'ended_at' => now()]);

  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   FAILED  Tests\Feature\GuardianConsentTest > invalid fields and missing current term do not create records
  Expected response status code [422] but received 404.
Failed asserting that 404 is identical to 422.

  at tests\Feature\GuardianConsentTest.php:69
     65▕     public function test_invalid_fields_and_missing_current_term_do_not_create_records(): void
     66▕     {
     67▕         $bond = Bond::factory()->active()->create(['patient_id' => Patient::factory()->minor()]);
     68▕         $url = '/api/v1/psychologist/patients/'.$bond->patient->user_id.'/guardian-consent';
  ➜  69▕         $this->as($bond->psychologist->user)->postJson($url, ['guardian_name' => str_repeat('a', 151), 'obtained_at' => today()->addDay()->toDateString(), 'method' => 'invalido'])->assertUnprocessable()->assertJsonValidationErrors(['guardian_name', 'obtained_at', 'method']);
     70▕         $this->postJson($url, $this->payload())->assertNotFound();
     71▕         $this->assertDatabaseCount('guardian_consents', 0);
     72▕     }
     73▕ }


  Tests:    3 failed (6 assertions)
  Duration: 8.67s


```

### Suite final completa

```text

   PASS  Tests\Feature\AdminDashboardTest
  ✓ admin logs in with web session                                                                              13.49s
  ✓ patient cannot log in to admin panel                                                                         0.37s
  ✓ admin queue shows registration and document                                                                  0.19s
  ✓ patient cannot open admin queue or approve                                                                   0.11s
  ✓ admin approves from panel                                                                                    0.26s
  ✓ admin approval without document shows message in panel                                                       0.11s
  ✓ admin deciding twice shows message in panel                                                                  0.09s
  ✓ admin rejection from panel requires reason                                                                   0.14s

   PASS  Tests\Feature\ApiExceptionTest
  ✓ 403 keeps the message written by the service                                                                 0.09s
  ✓ 409 keeps the message                                                                                        0.08s
  ✓ 5xx never leaks the message                                                                                  0.08s

   PASS  Tests\Feature\AppointmentTest
  ✓ schedule conflict confirmation reschedule and cancel                                                         0.48s
  ✓ patient listing is scoped and dates are inclusive                                                            0.35s
  ✓ permissions inactive bonds past dates and foreign resources                                                  0.38s
  ✓ conflict window is configurable and excludes cancelled and self                                              0.26s
  ✓ default conflict window allows exactly sixty minutes and validates offset                                    0.44s

   PASS  Tests\Feature\AuditLogAppendOnlyTest
  ✓ insert is allowed                                                                                            0.12s
  ✓ update is refused and row is unchanged                                                                       0.12s
  ✓ delete is refused and row stays                                                                              0.09s

   PASS  Tests\Feature\AuthTest
  ✓ adult patient registers with patient row and hashed password                                                 0.14s
  ✓ register response has only the contract fields and no secret                                                 0.11s
  ✓ patient under 12 is refused and nothing is saved                                                             0.11s
  ✓ age limit is by completed years                                                                              0.16s
  ✓ patient between 12 and 17 without guardian points each field                                                 0.09s
  ✓ patient between 12 and 17 with guardian is saved                                                             0.10s
  ✓ adult with partial guardian is refused before the database                                                   0.10s
  ✓ adult with full guardian is accepted                                                                         0.11s
  ✓ patient needs a valid past birth date                                                                        0.13s
  ✓ duplicate email is refused without leaking the existing account                                              0.23s
  ✓ email is trimmed and lowercased before saving                                                                0.10s
  ✓ admin cannot be created by registration                                                                      0.10s
  ✓ psychologist registers without a psychologist row                                                            0.10s
  ✓ register validation error uses the contract format                                                           0.10s
  ✓ register rejects short password bad email and long fields                                                    0.12s
  ✓ login returns only a token and it works on me                                                                0.14s
  ✓ each login creates a new token and both work                                                                 0.14s
  ✓ login ignores email case                                                                                     0.12s
  ✓ wrong password and unknown email give the same 401                                                           0.12s
  ✓ suspended user cannot login and gets the generic 401                                                         0.36s
  ✓ login validates presence and email format                                                                    0.09s
  ✓ me without token is 401                                                                                      0.08s
  ✓ me with invalid token is 401                                                                                 0.07s
  ✓ me returns the flat user with role and offset date                                                           0.12s
  ✓ logout without token is 401                                                                                  0.09s
  ✓ logout revokes every token of the user                                                                       0.16s
  ✓ token idle for 29 minutes still works and renews the window                                                  0.12s
  ✓ token idle for 31 minutes is 401                                                                             0.11s
  ✓ token used at 29 minutes expires 31 minutes after that use                                                   0.15s

   PASS  Tests\Feature\BondTest
  ✓ approved psychologist generates invitation with seven day expiry                                             0.17s
  ✓ three hundred codes are distinct unambiguous and eight chars                                                 0.77s
  ✓ psychologist with pending or rejected approval cannot generate                                               0.33s
  ✓ psychologist account without psychologist row cannot generate                                                0.41s
  ✓ patient cannot generate invitation                                                                           0.32s
  ✓ psychologist revokes own invitation                                                                          0.33s
  ✓ revoking twice is idempotent and keeps the first revoked at                                                  0.32s
  ✓ cannot revoke invitation of another psychologist or missing one                                              0.41s
  ✓ cannot revoke consumed invitation                                                                            0.45s
  ✓ patient redeems valid code and gets active bond                                                              0.43s
  ✓ code is normalized before lookup                                                                             0.33s
  ✓ invalid codes all get the same 422 without naming the psychologist                                           0.31s
  ✓ reusing a consumed code is 422 even for who now has an active bond                                           0.40s
  ✓ patient with active bond and valid code gets 409 and code stays usable                                       0.31s
  ✓ unique index violation on redeem becomes 409 without partial effect                                          0.13s
  ✓ psychologist cannot redeem                                                                                   0.33s
  ✓ sixth call after five failures is 429 with audit and recovers after window                                   0.34s
  ✓ block of one user does not block another user                                                                0.35s
  ✓ successful redeem resets the failure counter                                                                 0.32s
  ✓ redeem with active bond does not count as failed attempt                                                     0.22s
  ✓ patient requests bond with published psychologist                                                            0.14s
  ✓ unavailable psychologists get the same 422                                                                   0.21s
  ✓ request requires psychologist id                                                                             0.11s
  ✓ patient with active bond cannot request another                                                              0.13s
  ✓ patient with pending request cannot request any psychologist                                                 0.16s
  ✓ patient with ended bond can request again                                                                    0.14s
  ✓ psychologist accepts pending request                                                                         0.14s
  ✓ psychologist accepts without ceiling of patients                                                             0.17s
  ✓ cannot answer request of another psychologist or missing one                                                 0.23s
  ✓ cannot answer a request that is not pending                                                                  0.18s
  ✓ accepting twice the second is 409                                                                            0.15s
  ✓ accept when patient got another active bond meanwhile is 409 without partial effect                          0.14s
  ✓ psychologist rejects pending request                                                                         0.19s
  ✓ patient cannot answer requests                                                                               0.15s
  ✓ patient ends active bond and catalog opens again                                                             0.18s
  ✓ psychologist ends active bond                                                                                0.12s
  ✓ third parties and missing ids get 404 when ending                                                            0.18s
  ✓ admin cannot end a bond                                                                                      0.14s
  ✓ cannot end a bond that is pending or already ended                                                           0.15s
  ✓ catalog lists only approved published and active users                                                       0.15s
  ✓ catalog item has only the public profile fields                                                              0.13s
  ✓ catalog json has no price rating or ranking keys                                                             0.11s
  ✓ catalog is denied with active bond                                                                           0.14s
  ✓ catalog stays open with pending or ended bonds                                                               0.14s
  ✓ catalog is ordered by name and never by anything else                                                        0.16s
  ✓ catalog filters by modality exactly                                                                          0.13s
  ✓ catalog rejects invalid modality with 422                                                                    0.14s
  ✓ catalog filters by approach specialty and region with contains                                               0.19s
  ✓ catalog like wildcards in filters are literal                                                                0.17s
  ✓ catalog meta is exactly total page per page and paginates                                                    0.19s
  ✓ catalog caps per page at fifty                                                                               0.12s
  ✓ psychologist cannot open the catalog                                                                         0.12s
  ✓ database refuses a second active bond for the same patient                                                   0.13s
  ✓ every block route answers 401 without token                                                                  0.12s

   PASS  Tests\Feature\ClosingDemoSeederTest
  ✓ full seed preserves existing accounts and adds the closing demo                                              0.36s

   PASS  Tests\Feature\ConsentApiTest
  ✓ current term accept revoke and reaccept are idempotent                                                       0.23s
  ✓ current selection and invalid terms and roles                                                                0.17s
  ✓ revoking general consent blocks new report                                                                   0.19s

   PASS  Tests\Feature\FoundationTest
  ✓ serialize date uses app timezone offset and never z                                                          0.08s
  ✓ serialize date converts utc input to app timezone                                                            0.08s
  ✓ date columns serialize without time                                                                          0.07s
  ✓ user hides password hash and uses it for authentication                                                      0.08s
  ✓ clinical text is encrypted at rest                                                                           0.08s
  ✓ shared reports view model is read only                                                                       0.07s
  ✓ api collection meta has only total page and per page                                                         0.08s
  ✓ validation error is 422 with errors                                                                          0.08s
  ✓ unauthenticated is 401                                                                                       0.07s
  ✓ authorization failure is 403                                                                                 0.07s
  ✓ missing model is 404 without leaking the model name                                                          0.07s
  ✓ throttle is 429 and keeps retry after                                                                        0.08s
  ✓ state conflict keeps status and message written by us                                                        0.08s
  ✓ unexpected exception is generic 500 even with debug on                                                       0.12s
  ✓ unknown route under v1 is 404 in contract format                                                             0.09s
  ✓ path without v1 prefix is 404 in contract format                                                             0.08s
  ✓ web requests keep the default html error                                                                     0.07s

   PASS  Tests\Feature\GuardianConsentTest
  ✓ minor consent is append only and server sets term and author                                                 0.21s
  ✓ consent requires own active bond approval and minor patient                                                  0.21s
  ✓ invalid fields and missing current term do not create records                                                0.15s

   PASS  Tests\Feature\MessageTest
  ✓ send poll read and encryption                                                                                0.30s
  ✓ membership and ended or pending bonds                                                                        0.29s
  ✓ consent approval validation and authentication                                                               0.25s
  ✓ revoked or outdated consent blocks sending and pagination is validated                                       0.20s

   PASS  Tests\Feature\NotificationTest
  ✓ notifications are private paginated and read idempotently                                                    0.28s
  ✓ bond request acceptance and rejection notify only recipient                                                  0.17s
  ✓ task assignment notifies without task content                                                                0.15s

   PASS  Tests\Feature\PatientDirectoryTest
  ✓ profiles include not submitted and existing registration                                                     0.14s
  ✓ patient lists own bonds and unread messages                                                                  0.15s
  ✓ directory counts only relevant tasks messages and appointments                                               0.17s
  ✓ detail is scoped to own active or ended bonds and shows guardian for minors                                  0.22s

   PASS  Tests\Feature\PsychologistApprovalReportTest
  ✓ rejected professional with old bond cannot read shared reports                                               0.19s

   PASS  Tests\Feature\PsychologistRegistrationTest
  ✓ registration requires valid crp and document                                                                 0.21s
  ✓ registration stores private document and starts pending                                                      0.13s
  ✓ crp cannot be claimed twice                                                                                  0.18s
  ✓ non admin cannot approve                                                                                     0.14s
  ✓ admin approval allows publication and catalog listing                                                        0.22s
  ✓ admin cannot approve registration without document                                                           0.13s
  ✓ pending professional cannot publish                                                                          0.13s
  ✓ profile cannot publish honorarium written in reais                                                           0.12s
  ✓ rejection requires reason and allows resubmission                                                            0.20s
  ✓ only owner and admin can download document                                                                   0.22s

   PASS  Tests\Feature\PsychologistTaskWebTest
  ✓ psychologist logs in and creates task from web form                                                          0.27s
  ✓ patient and bad password cannot enter psychologist web                                                       0.54s
  ✓ web task creation refuses other psychologist bond                                                            0.12s
  ✓ unapproved psychologist cannot open task page                                                                0.11s

   PASS  Tests\Feature\ReportPrivacyTest
  ✓ list returns exactly the shared reports and counts only them                                                 0.27s
  ✓ list items carry only id body and created at                                                                 0.26s
  ✓ pagination never leaks through total or other pages                                                          0.33s
  ✓ second page with default size matches the shared set                                                         0.26s
  ✓ psychologist sees history of his own ended bond but never another psychologists                              0.23s
  ✓ ended bond of the same psychologist is merged in the listing                                                 0.25s
  ✓ show returns each visible report with only id body and created at                                            0.34s
  ✓ every hidden or unreachable report answers the same 404 as a missing one                                     0.49s
  ✓ huge and non numeric ids are just 404                                                                        0.25s
  ✓ without an active or ended bond the listing is 404 and audited                                               0.27s
  ✓ listing a user that is not a patient is 404 with the same body                                               0.28s
  ✓ allowed reads are audited with actor and target patient                                                      0.27s
  ✓ patient and admin cannot use the psychologist routes                                                         0.27s
  ✓ unpublished report vanishes without a trace and new private one changes nothing                              0.32s
  ✓ every psychologist and admin route is classified                                                             0.21s
  ✓ every route that reads reports passes the privacy exercise                                                   0.37s
  ✓ only patient side classes reference the reports model or table                                               0.32s
  ✓ the allowlist has no typos                                                                                   0.24s
  ✓ psychologist side classes read through the view                                                              0.26s
  ✓ the static scan itself catches what it should                                                                0.21s
  ✓ report body is encrypted at rest in table and view but readable through the api                              0.22s
  ✓ no report in the massa is readable at rest                                                                   0.22s
  ✓ the view hides private and unpublished even when read raw                                                    0.20s

   PASS  Tests\Feature\ReportTest
  ✓ report defaults to shared and binds to the active bond                                                       0.18s
  ✓ report can be created as private                                                                             0.15s
  ✓ report goes to the active bond even with an older ended one                                                  0.15s
  ✓ patient without acceptance gets 403 and nothing is saved                                                     0.12s
  ✓ revoked acceptance gets 403                                                                                  0.12s
  ✓ no published term at all means 403                                                                           0.14s
  ✓ acceptance of another user does not count                                                                    0.16s
  ✓ newer general term without acceptance blocks again                                                           0.17s
  ✓ term not yet effective and ai term are ignored                                                               0.13s
  ✓ patient without bond gets 409                                                                                0.11s
  ✓ ended and pending bonds do not allow reports                                                                 0.17s
  ✓ consent guard comes before bond guard                                                                        0.12s
  ✓ invalid input gets 422 and nothing is saved                                                                  0.15s
  ✓ body at the limit is accepted                                                                                0.15s
  ✓ psychologist and admin cannot post reports                                                                   0.15s
  ✓ list returns all own reports newest first                                                                    0.14s
  ✓ list paginates and limits per page                                                                           0.16s
  ✓ list does not include other patients reports                                                                 0.15s
  ✓ list keeps reports of ended bonds for the owner                                                              0.15s
  ✓ list flags reports used in analysis without n plus one                                                       0.23s
  ✓ patient cannot see edit or unpublish another patients report                                                 0.19s
  ✓ unknown report id gets 404                                                                                   0.16s
  ✓ private report cannot become shared                                                                          0.13s
  ✓ shared report cannot be made private by patch                                                                0.15s
  ✓ patch with the current value changes nothing                                                                 0.13s
  ✓ patch validates visibility                                                                                   0.13s
  ✓ unpublish marks the report and keeps the shape                                                               0.14s
  ✓ unpublish is idempotent and keeps the first timestamp                                                        0.14s
  ✓ private report cannot be unpublished                                                                         0.15s
  ✓ unpublish reports when the report was used in analysis                                                       0.13s
  ✓ every report route requires a token                                                                          0.11s

   PASS  Tests\Feature\RoleMiddlewareTest
  ✓ allowed role passes                                                                                          0.18s
  ✓ several roles can be listed                                                                                  0.10s
  ✓ other role gets 403 in contract format                                                                       0.11s
  ✓ patient cannot reach staff route                                                                             0.11s
  ✓ without token it is 401 not 403                                                                              0.09s

   PASS  Tests\Feature\SuspendedRoleAccessTest
  ✓ suspended admin with old token cannot open api queue                                                         0.11s
  ✓ suspended admin with existing web session cannot open panel                                                  0.09s

   PASS  Tests\Feature\TaskTest
  ✓ psychologist creates and updates task only for own active bond                                               0.25s
  ✓ task creation rejects past due date and missing title                                                        0.12s
  ✓ patient lists own tasks and completion is idempotent                                                         0.24s
  ✓ ended bond is read only and archived tasks are hidden                                                        0.22s
  ✓ role and authentication gates all task routes                                                                0.15s
  ✓ unapproved psychologist cannot use tasks even with old active bond                                           0.22s
  ✓ creation requires patients current general consent                                                           0.17s

  Tests:    220 passed (3835 assertions)
  Duration: 55.15s


```

### Formatacao final

```json
{"tool":"pint","result":"passed"}
```
