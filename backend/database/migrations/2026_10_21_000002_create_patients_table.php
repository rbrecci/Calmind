<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->date('birth_date'); // RF-01: obrigatoria, e ela que decide a faixa etaria
            $table->string('phone', 20)->nullable();
            $table->string('guardian_name', 150)->nullable(); // CA-01.5: exigido pela aplicacao se menor de 18
            $table->string('guardian_phone', 20)->nullable();
            $table->string('guardian_relationship', 60)->nullable(); // mae, pai, avo, tutor
            $table->dateTime('created_at')->useCurrent();

            $table->unique('user_id', 'uq_patients_user');
            $table->foreign('user_id', 'fk_patients_user')->references('id')->on('users')->cascadeOnDelete();
        });

        // CA-36.5: contato do responsavel pela metade nao serve ao psicologo. A idade minima
        // nao vira CHECK porque depende de CURDATE(), que nao e deterministico.
        DB::statement(<<<'SQL'
            ALTER TABLE patients ADD CONSTRAINT ck_patients_guardian CHECK (
                (guardian_name IS NULL AND guardian_phone IS NULL AND guardian_relationship IS NULL)
                OR
                (guardian_name IS NOT NULL AND guardian_phone IS NOT NULL AND guardian_relationship IS NOT NULL)
            )
            SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
