# Relatório da frente Rafael

## Estado final
Branch: codex/rafael-backend. Implementação em andamento em 29/10/2026.

## Itens
| Item | Situação | Commit | Evidência |
|------|----------|--------|-----------|
| R1 | feito | commit desta atualiza??o | Consentimento, idempot?ncia, revoga??o e bloqueio cl?nico |
| R2 | feito | pr?ximo commit | Perfil, v?nculos e diret?rio com contadores |
| R3/R4 | em andamento | pendente | Testes escritos antes da implementação |
| R5 | em andamento | pendente | Testes escritos antes da implementação |
| R6/R7 | em andamento | pendente | Preparação de seed e coleção |
| R8 | não feito | nenhum | Prioridade baixa |
| R9 | não feito | nenhum | Auditoria de leitura fora do fechamento conforme instruções gerais e contrato 3.8.6 |

## Evidência colada
Execução inicial encontrou BOM em teste recém-criado durante a descoberta da suíte. BOM removido antes da execução vermelha de R1/R2.

## Suposições
Execuções de testes serializadas para preservar o banco compartilhado calmind_test.

## Desvios do contrato
Nenhum registrado até o momento.

## Dependências abertas
Integração com os aplicativos será conferida pela sessão de integração.

## Não verificado
Suíte final, Pint e Newman ainda não executados sobre a implementação final.

## Arquivos que você criou ou alterou fora da sua pasta
A saída bruta da suíte será salva em docs/testes conforme solicitação específica da frente.
### calmind-r1-r2-red.txt

```text
﻿
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
﻿
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
﻿
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
