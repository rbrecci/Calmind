<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Tests\TestCase;

/**
 * O teste do RNF-08: o isolamento do relato privado na camada de dados. O mais importante do projeto.
 *
 * Provas desta classe (definicao de pronto, secao 2):
 *  (a) para cada consulta do perfil psicologo que le relatos, nenhum relato privado ou despublicado
 *      aparece, nem em conteudo, nem em id, nem em contagem, nem como chave;
 *  (b) a suite falha se uma rota nova de /psychologist ou /admin entrar sem classificacao;
 *  (c) varredura estatica: so as classes do lado do paciente tocam o Model Report;
 *  (d) cifra em repouso do corpo do relato (RNF-02).
 *
 * LIMITE CONHECIDO: as provas (b) e (c) da definicao de pronto (a rotina que monta o pacote
 * enviado a IA e toda rotina de exportacao) ainda nao existem, porque as proprias rotinas nao
 * existem. Entram na Sprint 3, junto com elas. A classificacao por rota e a varredura estatica
 * abaixo ja cobrem essas rotinas quando nascerem em app/ ou sob /psychologist e /admin.
 */
class ReportPrivacyTest extends TestCase
{
    use RefreshDatabase;

    private const READS = 'reads_shared_reports';

    private const NONE = 'no_reports';

    private const NOT_FOUND = ['message' => 'Recurso não encontrado.'];

    // Substrings que nao podem aparecer em chave nem no JSON bruto (a colecao do Postman procura estas)
    private const TELLTALE = ['private', 'hidden', 'removed', 'deleted', 'unpublished', 'count'];

    // Toda rota de psicologo e de admin, classificada. Rota nova fora deste mapa derruba a suite.
    // 'no_reports' e uma afirmacao que a varredura estatica (c) confere; 'reads_shared_reports'
    // exige um exercicio em exercisers().
    private const ROUTES = [
        'GET psychologist/patients/{}/reports' => self::READS,
        'GET psychologist/reports/{}' => self::READS,
        'POST psychologist/registration' => self::NONE,
        'PUT psychologist/profile' => self::NONE,
        'POST psychologist/profile/publish' => self::NONE,
        'GET psychologist/documents/{}' => self::NONE,
        'GET psychologist/patients/{}' => self::NONE,
        'POST psychologist/invitations' => self::NONE,
        'DELETE psychologist/invitations/{}' => self::NONE,
        'POST psychologist/bond-requests/{}/accept' => self::NONE,
        'POST psychologist/bond-requests/{}/reject' => self::NONE,
        'GET psychologist/patients/{}/guardian-consent' => self::NONE,
        'POST psychologist/patients/{}/guardian-consent' => self::NONE,
        'GET psychologist/tasks' => self::NONE,
        'POST psychologist/tasks' => self::NONE,
        'GET psychologist/tasks/{}' => self::NONE,
        'PUT psychologist/tasks/{}' => self::NONE,
        'DELETE psychologist/tasks/{}' => self::NONE,
        'GET admin/registrations' => self::NONE,
        'POST admin/registrations/{}/approve' => self::NONE,
        'POST admin/registrations/{}/reject' => self::NONE,
        'GET admin/documents/{}' => self::NONE,
    ];

    // Classes do lado do paciente (caminhos relativos a app/): as unicas que podem tocar o Model Report.
    // Os Models abaixo so declaram o relacionamento; quem o usa precisaria citar `->reports`, que a varredura pega.
    private const PATIENT_SIDE = [
        'Models/Report.php',
        'Models/SharedReport.php',
        'Models/Bond.php',
        'Models/Patient.php',
        'Models/Analysis.php',
        'Models/AnalysisReport.php',
        'Services/ReportService.php',
        'Http/Controllers/Api/V1/PatientReportController.php',
        'Http/Resources/ReportResource.php',
        'Http/Resources/ReportCollection.php',
    ];

    // Classes do lado do psicologo que leem relato: precisam passar pela view
    private const PSYCHOLOGIST_SIDE = [
        'Services/SharedReportService.php',
        'Http/Controllers/Api/V1/PsychologistReportController.php',
        'Http/Resources/SharedReportResource.php',
        'Http/Resources/SharedReportCollection.php',
    ];

    private ConsentTerm $term;

    private User $psy1;

    private User $psy2;

    private User $psy3;

    private Patient $patientA;

    private Patient $patientB;

    private Patient $patientC;

    private Patient $patientD;

    /** @var array<string, list<int>> ids por grupo: visibleA, visibleB1, visibleB2, pendingShared, hidden */
    private array $ids = ['visibleA' => [], 'visibleB1' => [], 'visibleB2' => [], 'pendingShared' => [], 'hidden' => []];

    /** @var list<string> corpo em claro de todo relato que o psicologo nunca pode ver */
    private array $hiddenBodies = [];

    private int $sequence = 0;

    private array $tokens = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->buildWorld();
    }

    // Massa real: 2 pacientes com vinculo ativo, um deles com historico encerrado de outro psicologo,
    // um vinculo pendente com relatos, um paciente sem vinculo, privados e despublicados em tudo.
    private function buildWorld(): void
    {
        $this->term = ConsentTerm::factory()->create();

        $p1 = Psychologist::factory()->approved()->create();
        $p2 = Psychologist::factory()->approved()->create();
        $this->psy1 = $p1->user;
        $this->psy2 = $p2->user;
        $this->psy3 = Psychologist::factory()->approved()->create()->user;

        $this->patientA = Patient::factory()->create();
        $this->patientB = Patient::factory()->create();
        $this->patientC = Patient::factory()->create();
        $this->patientD = Patient::factory()->create();
        ConsentAcceptance::factory()->create(['user_id' => $this->patientA->user_id, 'consent_term_id' => $this->term->id]);

        $a1 = $this->bond($this->patientA, $p1, 'active');
        $a1Old = $this->bond($this->patientA, $p1, 'ended');
        $b1 = $this->bond($this->patientB, $p1, 'active');
        $b2 = $this->bond($this->patientB, $p2, 'ended');
        $c1 = $this->bond($this->patientC, $p1, 'pending');

        $this->seed3($a1, 'visibleA', shared: 6, private: 3, unpublished: 1);
        $this->seed3($a1Old, 'visibleA', shared: 2, private: 1, unpublished: 0);
        $this->seed3($b1, 'visibleB1', shared: 3, private: 2, unpublished: 0);
        $this->seed3($b2, 'visibleB2', shared: 2, private: 2, unpublished: 1);
        $this->seed3($c1, 'pendingShared', shared: 2, private: 1, unpublished: 0);
    }

    private function bond(Patient $patient, Psychologist $psychologist, string $status): Bond
    {
        return Bond::factory()->create([
            'patient_id' => $patient->id,
            'psychologist_id' => $psychologist->id,
            'status' => $status,
            'responded_at' => $status === 'pending' ? null : now(),
            'ended_at' => $status === 'ended' ? now() : null,
        ]);
    }

    private function seed3(Bond $bond, string $group, int $shared, int $private, int $unpublished): void
    {
        for ($i = 0; $i < $shared; $i++) {
            $n = ++$this->sequence;
            $report = Report::factory()->forBond($bond)->create([
                'body' => "COMPARTILHADO-{$n} relato visivel ao psicologo",
                'created_at' => now()->subMinutes(1000 - $n),
            ]);
            $this->ids[$group][] = $report->id;
        }

        for ($i = 0; $i < $private; $i++) {
            $n = ++$this->sequence;
            $report = Report::factory()->forBond($bond)->private()->create([
                'body' => "MARCADOR-PRIVADO-{$n} texto que o psicologo nunca pode ler",
                'created_at' => now()->subMinutes(1000 - $n),
            ]);
            $this->ids['hidden'][] = $report->id;
            $this->hiddenBodies[] = $report->body;
        }

        for ($i = 0; $i < $unpublished; $i++) {
            $n = ++$this->sequence;
            $report = Report::factory()->forBond($bond)->unpublished()->create([
                'body' => "MARCADOR-DESPUBLICADO-{$n} texto retirado pelo paciente",
                'created_at' => now()->subMinutes(1000 - $n),
            ]);
            $this->ids['hidden'][] = $report->id;
            $this->hiddenBodies[] = $report->body;
        }
    }

    private function bearer(User $user): array
    {
        // O guard sanctum guarda o usuario da requisicao anterior: sem isto, trocar de token no mesmo teste nao troca de usuario
        $this->app['auth']->forgetGuards();

        return ['Authorization' => 'Bearer '.($this->tokens[$user->id] ??= $user->createToken('mobile')->plainTextToken)];
    }

    private function newestFirst(array $ids): array
    {
        rsort($ids);

        return $ids;
    }

    private function listAs(User $user, Patient $patient, string $query = ''): TestResponse
    {
        return $this->getJson("/api/v1/psychologist/patients/{$patient->user_id}/reports{$query}", $this->bearer($user));
    }

    private function showAs(User $user, int|string $reportId): TestResponse
    {
        return $this->getJson("/api/v1/psychologist/reports/{$reportId}", $this->bearer($user));
    }

    // Nenhum rastro de relato privado ou despublicado: conteudo, id, chave, contagem
    private function assertNoTrace(TestResponse $response): void
    {
        $raw = $response->getContent();

        $this->assertStringNotContainsString('MARCADOR-', $raw);
        foreach ($this->hiddenBodies as $body) {
            $this->assertStringNotContainsString($body, $raw);
        }

        foreach (self::TELLTALE as $word) {
            $this->assertStringNotContainsString($word, $raw, "'{$word}' apareceu na resposta");
        }

        $this->assertNoTellTaleKeys($response->json());

        $shownIds = array_column($response->json('data') ?? [], 'id');
        if ($response->json('id') !== null) {
            $shownIds[] = $response->json('id');
        }
        $this->assertSame([], array_values(array_intersect($shownIds, $this->ids['hidden'])), 'id de relato oculto na resposta');
    }

    private function assertNoTellTaleKeys(mixed $node): void
    {
        if (! is_array($node)) {
            return;
        }

        foreach ($node as $key => $value) {
            if (is_string($key)) {
                foreach (self::TELLTALE as $word) {
                    $this->assertStringNotContainsStringIgnoringCase($word, $key, "chave '{$key}' denuncia relato oculto");
                }
            }
            $this->assertNoTellTaleKeys($value);
        }
    }

    // ------------------------------------------------------------------ (a) lista

    public function test_list_returns_exactly_the_shared_reports_and_counts_only_them(): void
    {
        $response = $this->listAs($this->psy1, $this->patientA)->assertOk();

        $this->assertNoTrace($response);
        $this->assertSame($this->newestFirst($this->ids['visibleA']), array_column($response->json('data'), 'id'));
        $this->assertSame(8, $response->json('meta.total'));
        $this->assertCount(8, $response->json('data'));
        $this->assertSame(['total', 'page', 'per_page'], array_keys($response->json('meta')));
        $this->assertSame(['data', 'meta'], array_keys($response->json()));
    }

    public function test_list_items_carry_only_id_body_and_created_at(): void
    {
        $response = $this->listAs($this->psy1, $this->patientA)->assertOk();

        foreach ($response->json('data') as $item) {
            $this->assertSame(['id', 'body', 'created_at'], array_keys($item));
            $this->assertStringStartsWith('COMPARTILHADO-', $item['body']);
            $this->assertMatchesRegularExpression('/-03:00$/', $item['created_at']);
        }
    }

    public function test_pagination_never_leaks_through_total_or_other_pages(): void
    {
        $seen = [];

        foreach ([1, 2, 3, 4] as $page) {
            $response = $this->listAs($this->psy1, $this->patientA, "?per_page=3&page={$page}")->assertOk();

            $this->assertNoTrace($response);
            $this->assertSame(['total' => 8, 'page' => $page, 'per_page' => 3], $response->json('meta'));
            $seen = array_merge($seen, array_column($response->json('data'), 'id'));
        }

        $this->assertSame($this->newestFirst($this->ids['visibleA']), $seen);
        $this->assertSame([], $this->listAs($this->psy1, $this->patientA, '?per_page=3&page=9')->json('data'));
        $this->assertSame(8, $this->listAs($this->psy1, $this->patientA, '?per_page=3&page=9')->json('meta.total'));
    }

    public function test_second_page_with_default_size_matches_the_shared_set(): void
    {
        $page2 = $this->listAs($this->psy1, $this->patientA, '?per_page=5&page=2')->assertOk();

        $this->assertNoTrace($page2);
        $this->assertCount(3, $page2->json('data'));
        $this->assertSame(8, $page2->json('meta.total'));
    }

    // ----------------------------------------------- (a) vinculo encerrado e outro psicologo

    public function test_psychologist_sees_history_of_his_own_ended_bond_but_never_another_psychologists(): void
    {
        // CA-14.1: o vinculo encerrado segue legivel para quem o teve
        $own = $this->listAs($this->psy2, $this->patientB)->assertOk();
        $this->assertNoTrace($own);
        $this->assertSame($this->newestFirst($this->ids['visibleB2']), array_column($own->json('data'), 'id'));
        $this->assertSame(2, $own->json('meta.total'));

        // CA-14.2: o psicologo atual do paciente B nao ve nada do vinculo anterior com psy2
        $current = $this->listAs($this->psy1, $this->patientB)->assertOk();
        $this->assertNoTrace($current);
        $this->assertSame($this->newestFirst($this->ids['visibleB1']), array_column($current->json('data'), 'id'));
        $this->assertSame(3, $current->json('meta.total'));
    }

    public function test_ended_bond_of_the_same_psychologist_is_merged_in_the_listing(): void
    {
        // O paciente A tem um vinculo ativo e um encerrado com psy1: os 8 compartilhados dos dois
        $this->assertSame(8, $this->listAs($this->psy1, $this->patientA)->json('meta.total'));
    }

    // ------------------------------------------------------------------ (a) show

    public function test_show_returns_each_visible_report_with_only_id_body_and_created_at(): void
    {
        foreach ($this->ids['visibleA'] as $id) {
            $response = $this->showAs($this->psy1, $id)->assertOk();

            $this->assertNoTrace($response);
            $this->assertSame(['id', 'body', 'created_at'], array_keys($response->json()));
            $this->assertSame($id, $response->json('id'));
            $this->assertStringStartsWith('COMPARTILHADO-', $response->json('body'));
        }

        $this->showAs($this->psy2, $this->ids['visibleB2'][0])->assertOk();
    }

    public function test_every_hidden_or_unreachable_report_answers_the_same_404_as_a_missing_one(): void
    {
        // CA-23.5, RN-24: 404 identico em status e corpo, nunca 403
        $baseline = $this->showAs($this->psy1, 999999);
        $baseline->assertNotFound()->assertExactJson(self::NOT_FOUND);

        $attempts = array_map(fn ($id) => [$this->psy1, $id], $this->ids['hidden']);
        // compartilhado, mas de vinculo anterior com outro psicologo, de vinculo pendente, ou sem vinculo nenhum
        $attempts[] = [$this->psy1, $this->ids['visibleB2'][0]];
        $attempts[] = [$this->psy1, $this->ids['pendingShared'][0]];
        $attempts[] = [$this->psy3, $this->ids['visibleA'][0]];
        $attempts[] = [$this->psy2, $this->ids['visibleA'][0]];

        foreach ($attempts as [$user, $id]) {
            $response = $this->showAs($user, $id);

            $this->assertSame($baseline->getStatusCode(), $response->getStatusCode(), "id {$id}");
            $this->assertSame($baseline->getContent(), $response->getContent(), "id {$id}");
            $this->assertStringNotContainsString('MARCADOR-', $response->getContent());
            $this->assertDatabaseHas('audit_logs', [
                'actor_user_id' => $user->id,
                'action' => 'read_report',
                'resource_type' => 'report',
                'resource_id' => $id,
                'result' => 'denied',
            ]);
        }

        // RNF-04: nao ha mais linhas denied do que tentativas (1 do baseline + as de cima)
        $this->assertSame(count($attempts) + 1, DB::table('audit_logs')->where('result', 'denied')->count());
    }

    public function test_huge_and_non_numeric_ids_are_just_404(): void
    {
        $this->showAs($this->psy1, '99999999999999999999')->assertNotFound()->assertExactJson(self::NOT_FOUND);
        $this->showAs($this->psy1, 'abc')->assertNotFound()->assertExactJson(self::NOT_FOUND);
    }

    // --------------------------------------------- (a) sem vinculo, pendente, papel errado

    public function test_without_an_active_or_ended_bond_the_listing_is_404_and_audited(): void
    {
        $cases = [
            'psicologo sem vinculo nenhum' => [$this->psy3, $this->patientA],
            'psicologo de outro vinculo' => [$this->psy2, $this->patientA],
            'vinculo pendente' => [$this->psy1, $this->patientC],
            'paciente sem vinculo' => [$this->psy1, $this->patientD],
        ];

        foreach ($cases as $label => [$user, $patient]) {
            $response = $this->listAs($user, $patient);

            $response->assertNotFound();
            $this->assertSame(self::NOT_FOUND, $response->json(), $label);
            $this->assertDatabaseHas('audit_logs', [
                'actor_user_id' => $user->id,
                'action' => 'read_patient_reports',
                'resource_type' => 'patient',
                'target_patient_id' => $patient->id,
                'result' => 'denied',
            ]);
        }
    }

    public function test_listing_a_user_that_is_not_a_patient_is_404_with_the_same_body(): void
    {
        $this->getJson("/api/v1/psychologist/patients/{$this->psy2->id}/reports", $this->bearer($this->psy1))
            ->assertNotFound()->assertExactJson(self::NOT_FOUND);
        $this->getJson('/api/v1/psychologist/patients/999999/reports', $this->bearer($this->psy1))
            ->assertNotFound()->assertExactJson(self::NOT_FOUND);
        $this->getJson('/api/v1/psychologist/patients/abc/reports', $this->bearer($this->psy1))
            ->assertNotFound()->assertExactJson(self::NOT_FOUND);

        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $this->psy1->id,
            'action' => 'read_patient_reports',
            'target_patient_id' => null,
            'result' => 'denied',
        ]);
    }

    public function test_allowed_reads_are_audited_with_actor_and_target_patient(): void
    {
        $this->listAs($this->psy1, $this->patientA)->assertOk();
        $this->showAs($this->psy1, $this->ids['visibleA'][0])->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $this->psy1->id,
            'action' => 'read_patient_reports',
            'resource_type' => 'patient',
            'resource_id' => $this->patientA->id,
            'target_patient_id' => $this->patientA->id,
            'result' => 'allowed',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $this->psy1->id,
            'action' => 'read_report',
            'resource_type' => 'report',
            'resource_id' => $this->ids['visibleA'][0],
            'target_patient_id' => $this->patientA->id,
            'result' => 'allowed',
        ]);
        $this->assertSame(0, DB::table('audit_logs')->where('result', 'denied')->count());
    }

    public function test_patient_and_admin_cannot_use_the_psychologist_routes(): void
    {
        $admin = User::factory()->admin()->create();

        foreach ([$this->patientA->user, $admin] as $user) {
            $this->listAs($user, $this->patientA)->assertForbidden();
            $this->showAs($user, $this->ids['visibleA'][0])->assertForbidden();
        }
    }

    // --------------------------------------------- (a) fluxo real: despublicar e relatar

    public function test_unpublished_report_vanishes_without_a_trace_and_new_private_one_changes_nothing(): void
    {
        // CA-24.1, CA-24.3: some a partir do momento da despublicacao, sem marca no lugar
        $target = $this->ids['visibleA'][0];

        $this->postJson("/api/v1/patient/reports/{$target}/unpublish", [], $this->bearer($this->patientA->user))->assertOk();
        $this->ids['hidden'][] = $target;
        $this->hiddenBodies[] = Report::findOrFail($target)->body;

        $afterUnpublish = $this->listAs($this->psy1, $this->patientA)->assertOk();
        $this->assertNoTrace($afterUnpublish);
        $this->assertSame(7, $afterUnpublish->json('meta.total'));
        $this->assertNotContains($target, array_column($afterUnpublish->json('data'), 'id'));
        $this->showAs($this->psy1, $target)->assertNotFound()->assertExactJson(self::NOT_FOUND);

        // relato privado novo, pela API real: a lista do psicologo nao muda em nada
        $created = $this->postJson('/api/v1/patient/reports', [
            'body' => 'MARCADOR-PRIVADO-NOVO escrito agora',
            'visibility' => 'private',
        ], $this->bearer($this->patientA->user))->assertCreated();
        $this->ids['hidden'][] = $created->json('id');
        $this->hiddenBodies[] = 'MARCADOR-PRIVADO-NOVO escrito agora';

        $afterPrivate = $this->listAs($this->psy1, $this->patientA)->assertOk();
        $this->assertNoTrace($afterPrivate);
        $this->assertSame($afterUnpublish->json(), $afterPrivate->json());
    }

    // --------------------------------------------------------------- (b) cobertura por rota

    public function test_every_psychologist_and_admin_route_is_classified(): void
    {
        $registered = [];
        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (! str_starts_with($uri, 'api/v1/psychologist') && ! str_starts_with($uri, 'api/v1/admin')) {
                continue;
            }
            $normalized = preg_replace('/\{[^}]+\}/', '{}', substr($uri, strlen('api/v1/')));
            foreach (array_diff($route->methods(), ['HEAD', 'OPTIONS']) as $method) {
                $registered["{$method} {$normalized}"] = true;
            }
        }

        $unclassified = array_values(array_diff(array_keys($registered), array_keys(self::ROUTES)));
        $this->assertSame(
            [],
            $unclassified,
            'Rota de psicologo/admin sem classificacao em ReportPrivacyTest::ROUTES (reads_shared_reports ou no_reports): '
                .implode('; ', $unclassified)
        );

        // as rotas que leem relato existem de fato e cada uma tem exercicio
        $readers = array_keys(array_filter(self::ROUTES, fn ($kind) => $kind === self::READS));
        $this->assertEqualsCanonicalizing($readers, array_keys($this->exercisers()));
        foreach ($readers as $key) {
            $this->assertArrayHasKey($key, $registered, "rota {$key} classificada mas nao registrada");
        }
    }

    public function test_every_route_that_reads_reports_passes_the_privacy_exercise(): void
    {
        foreach ($this->exercisers() as $key => $exercise) {
            $exercise();
            $this->addToAssertionCount(1);
        }
    }

    /** @return array<string, callable(): void> */
    private function exercisers(): array
    {
        return [
            'GET psychologist/patients/{}/reports' => function (): void {
                $response = $this->listAs($this->psy1, $this->patientA)->assertOk();
                $this->assertNoTrace($response);
                $this->assertSame(count($this->ids['visibleA']), $response->json('meta.total'));
            },
            'GET psychologist/reports/{}' => function (): void {
                $this->assertNoTrace($this->showAs($this->psy1, $this->ids['visibleA'][0])->assertOk());
                foreach ($this->ids['hidden'] as $id) {
                    $this->showAs($this->psy1, $id)->assertNotFound()->assertExactJson(self::NOT_FOUND);
                }
            },
        ];
    }

    // ------------------------------------------------------------- (c) varredura estatica

    public function test_only_patient_side_classes_reference_the_reports_model_or_table(): void
    {
        $offenders = [];

        foreach ($this->appFiles() as $relative => $source) {
            if (in_array($relative, self::PATIENT_SIDE, true)) {
                continue;
            }
            $found = self::reportModelReferences($source);
            if ($found !== []) {
                $offenders[$relative] = $found;
            }
        }

        $this->assertSame([], $offenders, 'RNF-08: classe fora do lado do paciente referencia Report ou a tabela reports');
    }

    public function test_the_allowlist_has_no_typos(): void
    {
        $files = $this->appFiles();

        foreach (self::PATIENT_SIDE as $path) {
            $this->assertArrayHasKey($path, $files, "allowlist cita arquivo que nao existe: {$path}");
        }
    }

    public function test_psychologist_side_classes_read_through_the_view(): void
    {
        $files = $this->appFiles();

        foreach (self::PSYCHOLOGIST_SIDE as $path) {
            $this->assertArrayHasKey($path, $files, "classe do lado do psicologo nao existe: {$path}");
            $this->assertSame([], self::reportModelReferences($files[$path]), $path);
        }

        $this->assertMatchesRegularExpression('/(?<![A-Za-z_])SharedReport::/', $files['Services/SharedReportService.php']);
        $this->assertMatchesRegularExpression('/SharedReportService/', $files['Http/Controllers/Api/V1/PsychologistReportController.php']);
        $this->assertMatchesRegularExpression('/SharedReport/', $files['Http/Resources/SharedReportCollection.php']);
    }

    public function test_the_static_scan_itself_catches_what_it_should(): void
    {
        // O detector nao pode ser de fachada: padroes que devem pegar e padroes que nao devem
        $must = [
            'use App\Models\Report;',
            '$x = Report::where("id", 1)->get();',
            '$x = \App\Models\Report::query();',
            '$x = new Report;',
            'use App\Models\{Bond, Report};',
            'DB::table("reports")->get();',
            "DB::table('reports')->get();",
            'DB::select("select * from reports");',
            '$bond->reports()->get();',
            '$x = $bond->reports;',
            "Bond::with('reports');",
        ];
        $mustNot = [
            'use App\Models\SharedReport;',
            '$x = SharedReport::where("id", 1)->get();',
            'DB::table("shared_reports")->get();',
            'AnalysisReport::create([]);',
            'use App\Http\Resources\ReportResource;',
            '// Report::where() so em comentario',
        ];

        foreach ($must as $snippet) {
            $this->assertNotSame([], self::reportModelReferences("<?php\n{$snippet}\n"), "deveria pegar: {$snippet}");
        }
        foreach ($mustNot as $snippet) {
            $this->assertSame([], self::reportModelReferences("<?php\n{$snippet}\n"), "nao deveria pegar: {$snippet}");
        }
    }

    /** @return array<string, string> caminho relativo a app/ => codigo-fonte */
    private function appFiles(): array
    {
        $files = [];
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(app_path(), RecursiveDirectoryIterator::SKIP_DOTS));

        foreach ($iterator as $file) {
            if ($file->getExtension() === 'php') {
                $relative = str_replace('\\', '/', substr($file->getPathname(), strlen(app_path()) + 1));
                $files[$relative] = file_get_contents($file->getPathname());
            }
        }

        return $files;
    }

    /** @return list<string> padroes que casaram, ignorando comentarios */
    private static function reportModelReferences(string $source): array
    {
        $code = '';
        foreach (token_get_all($source) as $token) {
            if (is_array($token) && in_array($token[0], [T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }
            $code .= is_array($token) ? $token[1] : $token;
        }

        $patterns = [
            '/Models\\\\Report\b/',
            '/(?<![A-Za-z_])Report::/',
            '/\bnew\s+Report\b/',
            '/[{,]\s*Report\s*[,}]/',
            '/[\'"]reports[\'"]/',
            '/\b(?:from|join|into|update)\s+`?reports\b/i',
            '/->reports\b/',
        ];

        return array_values(array_filter($patterns, fn ($pattern) => preg_match($pattern, $code) === 1));
    }

    // ------------------------------------------------------------- (d) cifra em repouso

    public function test_report_body_is_encrypted_at_rest_in_table_and_view_but_readable_through_the_api(): void
    {
        // RNF-02: lido por fora da aplicacao, o corpo nao e legivel
        $text = 'Texto sigiloso do paciente sobre a semana de teste';
        $created = $this->postJson('/api/v1/patient/reports', ['body' => $text], $this->bearer($this->patientA->user))
            ->assertCreated()
            ->assertJsonPath('body', $text);
        $id = $created->json('id');

        $rawTable = DB::table('reports')->where('id', $id)->value('body');
        $rawView = DB::table('shared_reports')->where('id', $id)->value('body');

        $this->assertNotSame($text, $rawTable);
        $this->assertStringNotContainsString($text, $rawTable);
        $this->assertNotSame($text, $rawView);
        $this->assertStringNotContainsString($text, $rawView);
        $this->assertSame($rawTable, $rawView, 'a view repassa o campo cifrado, quem decifra e o cast');

        $this->showAs($this->psy1, $id)->assertOk()->assertJsonPath('body', $text);
    }

    public function test_no_report_in_the_massa_is_readable_at_rest(): void
    {
        $this->assertSame(0, DB::table('reports')->where('body', 'like', '%MARCADOR-%')->count());
        $this->assertSame(0, DB::table('reports')->where('body', 'like', '%COMPARTILHADO-%')->count());
        $this->assertSame(0, DB::table('shared_reports')->where('body', 'like', '%COMPARTILHADO-%')->count());
        $this->assertGreaterThan(0, DB::table('shared_reports')->count());
    }

    public function test_the_view_hides_private_and_unpublished_even_when_read_raw(): void
    {
        // A garantia mora no banco: nem consulta crua alcanca o que a view filtra
        $this->assertEqualsCanonicalizing(
            array_merge($this->ids['visibleA'], $this->ids['visibleB1'], $this->ids['visibleB2'], $this->ids['pendingShared']),
            DB::table('shared_reports')->pluck('id')->all()
        );
    }
}
