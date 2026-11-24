<?php

namespace Database\Seeders;

use App\Models\ConsentTerm;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConsentTermSeeder extends Seeder
{
    // Paragrafos separados por linha em branco: o app mostra o body num <Text> simples, sem marcacao
    public const ACADEMIC_NOTICE = 'O Calmind é um projeto acadêmico, desenvolvido como Trabalho de Conclusão de Curso (TCC) no SENAI. Todos os nomes, contas e dados desta demonstração são fictícios.';

    // RNF-13: termos versionados. O consentimento de IA e separado do geral (RF-04)
    // Paciente e psicologo leem o mesmo termo `general` (o enum nao tem tipo por perfil), por isso ele traz um bloco para cada um
    public function run(): void
    {
        $admin = User::where('email', UserSeeder::ADMIN_EMAIL)->firstOrFail();

        ConsentTerm::create([
            'type' => 'general',
            'version' => '1.0',
            'body' => implode("\n\n", [
                'O Calmind é uma plataforma de apoio ao acompanhamento psicológico. Ela aproxima paciente e psicólogo entre as sessões, com relatos, tarefas, mensagens e agenda de consultas.',
                'O Calmind não é serviço de emergência e não substitui a sessão com o seu psicólogo. Em crise ou risco à vida, ligue para o CVV no 188 (gratuito, 24 horas) ou para o SAMU no 192.',
                'Dados coletados: seu cadastro (nome, e-mail, data de nascimento e, para psicólogos, o número do CRP), os relatos que você escreve, as mensagens trocadas no vínculo, as tarefas e a agenda de consultas.',
                'Quem vê o quê: o relato marcado como privado fica visível só para você. O relato compartilhado, as tarefas, as mensagens e as consultas ficam visíveis para o psicólogo com quem você tem vínculo ativo. Outros pacientes e psicólogos não têm acesso a esse conteúdo.',
                'Esses dados, incluindo os de saúde, são tratados com base no seu consentimento, conforme a Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018). Eles servem só ao acompanhamento e nunca são usados para publicidade nem vendidos.',
                'Você pode revogar este consentimento a qualquer momento e pedir acesso, correção ou exclusão dos seus dados. Sem o consentimento vigente, as funções clínicas da plataforma ficam bloqueadas.',
                'O psicólogo vinculado está sujeito ao sigilo profissional previsto no Código de Ética Profissional do Psicólogo (Resolução CFP 010/2005), e esse sigilo vale para tudo o que você registra aqui.',
                'Paciente menor de 18 anos só usa a plataforma com o consentimento do pai, da mãe ou do responsável legal, registrado pelo psicólogo.',
                'Para psicólogos: ao aceitar, você declara ter inscrição ativa no Conselho Regional de Psicologia (CRP), se compromete a guardar sigilo sobre o que seus pacientes registram e a usar a plataforma de forma ética, só para acompanhar os pacientes com quem tem vínculo.',
                self::ACADEMIC_NOTICE,
            ]),
            'effective_from' => now()->subMonth(),
            'published_by_user_id' => $admin->id,
        ]);

        ConsentTerm::create([
            'type' => 'ai_analysis',
            'version' => '1.0',
            'body' => implode("\n\n", [
                'Este consentimento é opcional e separado do termo de uso. Recusar ou revogar não bloqueia o restante da plataforma.',
                'Ao aceitar, você autoriza que seus relatos compartilhados sejam enviados a um serviço de inteligência artificial, que gera um resumo da semana para o seu psicólogo.',
                'A análise só acontece quando o psicólogo pede, nunca de forma automática. O resumo é apoio ao profissional, não é diagnóstico e não substitui a avaliação dele.',
                'Relatos marcados como privados nunca são enviados para a análise.',
                'Você pode revogar esta autorização a qualquer momento. A partir da revogação, nenhum relato novo é enviado ao serviço de IA.',
                'Paciente menor de 18 anos depende também do consentimento do responsável legal para a análise.',
                'O tratamento segue a Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018), com base no seu consentimento.',
                self::ACADEMIC_NOTICE,
            ]),
            'effective_from' => now()->subMonth(),
            'published_by_user_id' => $admin->id,
        ]);
    }
}
