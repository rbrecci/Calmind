<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function bond(): Bond
    {
        $bond = Bond::factory()->active()->create();
        $term = ConsentTerm::factory()->create();
        ConsentAcceptance::factory()->create(['user_id' => $bond->patient->user_id, 'consent_term_id' => $term->id]);

        return $bond;
    }

    public function test_send_poll_read_and_encryption(): void
    {
        $bond = $this->bond();
        $url = "/api/v1/bonds/{$bond->id}/messages";
        $first = $this->as($bond->patient->user)->postJson($url, ['body' => '  Bom dia  '])
            ->assertCreated()->assertJsonPath('body', 'Bom dia')->assertJsonPath('mine', true);
        $id = $first->json('id');
        $this->assertDatabaseHas('notifications', ['user_id' => $bond->psychologist->user_id, 'type' => 'message.received', 'resource_id' => $id]);
        $this->assertNotSame('Bom dia', DB::table('messages')->where('id', $id)->value('body'));
        $reply = $this->as($bond->psychologist->user)->postJson($url, ['body' => 'Olá'])->assertCreated();
        $this->assertDatabaseHas('notifications', ['user_id' => $bond->patient->user_id, 'type' => 'message.received', 'resource_id' => $reply->json('id')]);
        $this->as($bond->patient->user)->getJson($url."?after_id={$id}")->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('meta.per_page', 50)
            ->assertJsonPath('data.0.id', $reply->json('id'))->assertJsonPath('data.0.mine', false);
        $this->as($bond->patient->user)->postJson($url.'/read')->assertOk()->assertJsonPath('read', 1);
        $this->assertNull(Message::findOrFail($id)->read_at);
        $this->as($bond->patient->user)->postJson($url.'/read')->assertOk()->assertJsonPath('read', 0);
        $this->assertNotNull(Message::findOrFail($reply->json('id'))->read_at);
    }

    public function test_membership_and_ended_or_pending_bonds(): void
    {
        $bond = $this->bond();
        $url = "/api/v1/bonds/{$bond->id}/messages";
        $outsider = User::factory()->create();
        $this->as($outsider)->getJson($url)->assertNotFound();
        $this->as($outsider)->postJson($url, ['body' => 'Olá'])->assertNotFound();
        $this->as($outsider)->postJson($url.'/read')->assertNotFound();
        foreach (['pending', 'ended'] as $status) {
            $bond->update(['status' => $status]);
            $this->as($bond->patient->user)->postJson($url, ['body' => 'Olá'])->assertStatus(409);
        }
        $this->as($bond->patient->user)->getJson($url)->assertOk();
        $this->as($bond->psychologist->user)->getJson($url)->assertOk();
        $this->as($bond->patient->user)->postJson($url.'/read')->assertOk();
    }

    public function test_consent_approval_validation_and_authentication(): void
    {
        $bond = Bond::factory()->active()->create();
        $url = "/api/v1/bonds/{$bond->id}/messages";
        $this->getJson($url)->assertUnauthorized();
        $this->as($bond->patient->user)->postJson($url, ['body' => 'Olá'])->assertForbidden()
            ->assertJsonPath('message', 'É preciso aceitar o termo de uso antes de enviar mensagens.');
        $this->as($bond->psychologist->user)->postJson($url, ['body' => 'Olá'])->assertForbidden();
        foreach (['', '   ', str_repeat('a', 2001)] as $body) {
            $this->as($bond->patient->user)->postJson($url, ['body' => $body])->assertUnprocessable()->assertJsonValidationErrors('body');
        }
        $bond->psychologist->update(['approval_status' => 'rejected']);
        $this->as($bond->psychologist->user)->postJson($url, ['body' => 'Olá'])->assertForbidden();
        $this->assertDatabaseCount('messages', 0);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_revoked_or_outdated_consent_blocks_sending_and_pagination_is_validated(): void
    {
        $bond = $this->bond();
        $url = "/api/v1/bonds/{$bond->id}/messages";
        ConsentAcceptance::where('user_id', $bond->patient->user_id)->update(['revoked_at' => now()]);
        $this->as($bond->patient->user)->postJson($url, ['body' => 'Olá'])->assertForbidden();
        ConsentAcceptance::where('user_id', $bond->patient->user_id)->update(['revoked_at' => null]);
        ConsentTerm::factory()->create(['version' => '2.0', 'effective_from' => now()]);
        $this->as($bond->patient->user)->postJson($url, ['body' => 'Olá'])->assertForbidden();
        $this->as($bond->patient->user)->getJson($url.'?per_page=101&after_id=-1')->assertUnprocessable()->assertJsonValidationErrors(['per_page', 'after_id']);
        $this->assertDatabaseCount('messages', 0);
    }
}
