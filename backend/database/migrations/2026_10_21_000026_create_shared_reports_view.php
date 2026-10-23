<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // RNF-08: TODA consulta do lado do psicologo e TODA rotina que monta o pacote
        // enviado ao servico de IA leem esta view, e nunca a tabela reports.
        // O relato privado nao aparece aqui nem no conteudo, nem na contagem.
        // OR REPLACE porque migrate:fresh derruba as tabelas mas deixa a view (so --drop-views a remove).
        DB::statement(<<<'SQL'
            CREATE OR REPLACE VIEW shared_reports AS
              SELECT id, bond_id, patient_id, body, created_at
                FROM reports
               WHERE visibility = 'shared'
                 AND unpublished_at IS NULL
            SQL);
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS shared_reports');
    }
};
