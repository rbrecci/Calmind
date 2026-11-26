<?php

namespace App\Services\Ai;

// AI_PROVIDER=simulated: para ensaiar o fluxo sem chave e sem rede. NAO e IA: o texto diz isso no inicio,
// para ninguem confundir com resultado real. Tambem e o provedor dos testes que nao falam com o Gemini.
class SimulatedSummaryProvider implements SummaryProvider
{
    public function name(): string
    {
        return 'simulated';
    }

    public function summarize(array $reports): string
    {
        $dates = collect($reports)->pluck('date');

        return "[SIMULADO, sem IA real]\n- {$dates->count()} relato(s) compartilhado(s), de {$dates->first()} a {$dates->last()}.\n- Este texto é um exemplo fixo para ensaiar o fluxo de revisão.";
    }
}
