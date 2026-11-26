<?php

namespace App\Services\Ai;

// Porta de saida para qualquer servico de IA (RF-41). Quem implementa recebe SO relatos compartilhados,
// ja sem nome nem identificador do paciente, e devolve o texto do resumo. A troca de servico
// (Gemini, outro, simulado) e feita em AI_PROVIDER, sem tocar no resto do backend.
interface SummaryProvider
{
    /**
     * @param  list<array{date: string, body: string}>  $reports  relatos compartilhados do periodo
     *
     * @throws AiUnavailableException quando o servico nao responde, recusa ou nao esta configurado
     */
    public function summarize(array $reports): string;

    /** Nome curto para logs e para o comando ai:check, sem segredo. */
    public function name(): string;
}
