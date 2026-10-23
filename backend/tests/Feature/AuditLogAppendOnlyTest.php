<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

// CA-17.3, regra inviolavel 19: a trilha de auditoria e somente de insercao
class AuditLogAppendOnlyTest extends TestCase
{
    use RefreshDatabase;

    private function entry(): AuditLog
    {
        return AuditLog::create([
            'action' => 'read_report',
            'resource_type' => 'report',
            'result' => 'denied',
        ]);
    }

    public function test_insert_is_allowed(): void
    {
        $this->entry();

        $this->assertDatabaseHas('audit_logs', ['action' => 'read_report', 'result' => 'denied']);
    }

    public function test_update_is_refused_and_row_is_unchanged(): void
    {
        $entry = $this->entry();

        try {
            $entry->update(['result' => 'allowed']);
            $this->fail('update deveria lancar LogicException');
        } catch (LogicException) {
            // esperado
        }

        $this->assertDatabaseHas('audit_logs', ['id' => $entry->id, 'result' => 'denied']);
    }

    public function test_delete_is_refused_and_row_stays(): void
    {
        $entry = $this->entry();

        try {
            $entry->delete();
            $this->fail('delete deveria lancar LogicException');
        } catch (LogicException) {
            // esperado
        }

        $this->assertDatabaseHas('audit_logs', ['id' => $entry->id]);
    }
}
