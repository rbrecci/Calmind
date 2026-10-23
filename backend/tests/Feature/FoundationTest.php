<?php

namespace Tests\Feature;

use App\Http\Resources\ApiCollection;
use App\Models\BaseModel;
use App\Models\Concerns\SerializesContractDates;
use App\Models\Message;
use App\Models\Patient;
use App\Models\Report;
use App\Models\SharedReport;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
use LogicException;
use RuntimeException;
use Tests\TestCase;

// Fundacao do backend: nada aqui toca o banco (as tabelas pertencem as migrations).
class FoundationTest extends TestCase
{
    public function test_serialize_date_uses_app_timezone_offset_and_never_z(): void
    {
        $model = new class extends BaseModel {};
        $model->created_at = '2026-10-02 21:30:00';

        $json = $model->toArray()['created_at'];

        $this->assertSame('2026-10-02T21:30:00-03:00', $json);
        $this->assertStringEndsNotWith('Z', $json);
    }

    public function test_serialize_date_converts_utc_input_to_app_timezone(): void
    {
        $probe = new class
        {
            use SerializesContractDates {
                serializeDate as public;
            }
        };

        $json = $probe->serializeDate(Carbon::parse('2026-10-03 00:30:00', 'UTC'));

        $this->assertSame('2026-10-02T21:30:00-03:00', $json);
    }

    public function test_date_columns_serialize_without_time(): void
    {
        $patient = (new Patient)->forceFill(['birth_date' => '2010-08-19']);

        $this->assertSame('2010-08-19', $patient->toArray()['birth_date']);
    }

    public function test_user_hides_password_hash_and_uses_it_for_authentication(): void
    {
        $user = (new User)->forceFill([
            'name' => 'Aragorn',
            'email' => 'aragorn@example.com',
            'password_hash' => 'senha-de-teste-123',
        ]);

        $this->assertSame('password_hash', $user->getAuthPasswordName());
        $this->assertArrayNotHasKey('password_hash', $user->toArray());
        $this->assertNotSame('senha-de-teste-123', $user->getAuthPassword());
    }

    public function test_clinical_text_is_encrypted_at_rest(): void
    {
        foreach ([Report::class, SharedReport::class, Message::class] as $class) {
            $model = (new $class)->forceFill(['body' => 'texto clinico']);

            $this->assertNotSame('texto clinico', $model->getAttributes()['body'], $class);
            $this->assertSame('texto clinico', $model->body, $class);
        }
    }

    public function test_shared_reports_view_model_is_read_only(): void
    {
        $this->expectException(LogicException::class);

        (new SharedReport)->save();
    }

    public function test_api_collection_meta_has_only_total_page_and_per_page(): void
    {
        $paginator = new LengthAwarePaginator(
            [['id' => 1], ['id' => 2]],
            42,
            20,
            1,
            ['path' => 'http://localhost/api/v1/patient/reports']
        );
        $itemResource = new class(null) extends JsonResource {};
        $collection = new class($paginator, $itemResource::class) extends ApiCollection
        {
            public function __construct($resource, string $collects)
            {
                $this->collects = $collects;
                parent::__construct($resource);
            }
        };

        $body = $collection->toResponse(Request::create('/api/v1/patient/reports'))->getData(true);

        $this->assertSame(['data', 'meta'], array_keys($body));
        $this->assertSame([['id' => 1], ['id' => 2]], $body['data']);
        $this->assertSame(['total' => 42, 'page' => 1, 'per_page' => 20], $body['meta']);
        $this->assertArrayNotHasKey('links', $body);
    }

    public function test_validation_error_is_422_with_errors(): void
    {
        $this->routeThrowing('validation', fn () => Validator::make(['email' => ''], ['email' => 'required'])->validate());

        $this->getJson('/api/v1/_t/validation')
            ->assertStatus(422)
            ->assertExactJson([
                'message' => 'Os dados enviados são inválidos.',
                'errors' => ['email' => ['Este campo é obrigatório.']],
            ]);
    }

    public function test_unauthenticated_is_401(): void
    {
        $this->routeThrowing('unauthenticated', fn () => throw new AuthenticationException);

        $this->getJson('/api/v1/_t/unauthenticated')
            ->assertStatus(401)
            ->assertExactJson(['message' => 'Não autenticado. Entre para continuar.']);
    }

    public function test_authorization_failure_is_403(): void
    {
        $this->routeThrowing('forbidden', fn () => throw new AuthorizationException('This action is unauthorized.'));

        $this->getJson('/api/v1/_t/forbidden')
            ->assertStatus(403)
            ->assertExactJson(['message' => 'Você não tem permissão para realizar esta ação.']);
    }

    public function test_missing_model_is_404_without_leaking_the_model_name(): void
    {
        $this->routeThrowing('missing', fn () => throw (new ModelNotFoundException)->setModel(Report::class, [7]));

        $response = $this->getJson('/api/v1/_t/missing')
            ->assertStatus(404)
            ->assertExactJson(['message' => 'Recurso não encontrado.']);

        $this->assertStringNotContainsString('Report', $response->getContent());
    }

    public function test_throttle_is_429_and_keeps_retry_after(): void
    {
        $this->routeThrowing('throttle', fn () => throw new ThrottleRequestsException('Too Many Attempts.', null, ['Retry-After' => 60]));

        $this->getJson('/api/v1/_t/throttle')
            ->assertStatus(429)
            ->assertHeader('Retry-After', '60')
            ->assertExactJson(['message' => 'Muitas tentativas. Tente novamente em instantes.']);
    }

    public function test_state_conflict_keeps_status_and_message_written_by_us(): void
    {
        $this->routeThrowing('conflict', fn () => abort(409, 'Este paciente já tem um vínculo ativo.'));

        $this->getJson('/api/v1/_t/conflict')
            ->assertStatus(409)
            ->assertExactJson(['message' => 'Este paciente já tem um vínculo ativo.']);
    }

    public function test_unexpected_exception_is_generic_500_even_with_debug_on(): void
    {
        config(['app.debug' => true]);
        $this->routeThrowing('boom', fn () => throw new RuntimeException(
            "SQLSTATE[42S02]: Base table or view not found: 1146 Table 'calmind.tabela_secreta' doesn't exist"
        ));

        $response = $this->getJson('/api/v1/_t/boom')
            ->assertStatus(500)
            ->assertExactJson(['message' => 'Ocorreu um erro interno. Tente novamente mais tarde.']);

        $content = $response->getContent();
        $this->assertStringNotContainsString('SQLSTATE', $content);
        $this->assertStringNotContainsString('tabela_secreta', $content);
        $this->assertStringNotContainsString('.php', $content);
        $this->assertStringNotContainsString(str_replace('\\', '\\\\', base_path()), $content);
    }

    public function test_unknown_route_under_v1_is_404_in_contract_format(): void
    {
        $this->get('/api/v1/rota-que-nao-existe')
            ->assertStatus(404)
            ->assertExactJson(['message' => 'Recurso não encontrado.']);
    }

    public function test_path_without_v1_prefix_is_404_in_contract_format(): void
    {
        $this->get('/api/qualquer')
            ->assertStatus(404)
            ->assertExactJson(['message' => 'Recurso não encontrado.']);
    }

    public function test_web_requests_keep_the_default_html_error(): void
    {
        $response = $this->get('/rota-web-que-nao-existe')->assertStatus(404);

        $this->assertStringNotContainsString('application/json', (string) $response->headers->get('Content-Type'));
    }

    private function routeThrowing(string $name, callable $action): void
    {
        Route::prefix('api/v1/_t')->group(function () use ($name, $action) {
            Route::get($name, $action);
        });
    }
}
