<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Recusa e encerramento gravam o mesmo 'ended' com responded_at: so accepted_at diz se o vinculo chegou a ficar ativo
        Schema::table('bonds', function (Blueprint $table) {
            $table->dateTime('accepted_at')->nullable()->after('responded_at');
        });

        DB::table('bonds')->where('status', 'active')
            ->update(['accepted_at' => DB::raw('COALESCE(responded_at, requested_at)')]);

        // Encerrado e ambiguo no historico. So vinculo ativo produz mensagem, tarefa, consulta ou relato
        // compartilhado; sem nada disso, fica nulo (recusa, cancelamento ou ativo que nunca foi usado)
        DB::table('bonds')->where('status', 'ended')->whereNotNull('responded_at')
            ->where(fn ($q) => $q
                ->whereExists(fn ($s) => $s->from('messages')->whereColumn('messages.bond_id', 'bonds.id'))
                ->orWhereExists(fn ($s) => $s->from('tasks')->whereColumn('tasks.bond_id', 'bonds.id'))
                ->orWhereExists(fn ($s) => $s->from('appointments')->whereColumn('appointments.bond_id', 'bonds.id'))
                ->orWhereExists(fn ($s) => $s->from('reports')->whereColumn('reports.bond_id', 'bonds.id')->where('reports.visibility', 'shared')))
            ->update(['accepted_at' => DB::raw('responded_at')]);
    }

    public function down(): void
    {
        Schema::table('bonds', function (Blueprint $table) {
            $table->dropColumn('accepted_at');
        });
    }
};
