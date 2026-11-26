<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // RF-41: servico de IA da analise semanal. Chave so no .env, nunca no repositorio.
    'ai' => [
        'provider' => env('AI_PROVIDER', 'gemini'),
        // por tentativa: com rodizio, varias tentativas cabem no orcamento total (AI_BUDGET), que fecha a chamada
        'timeout' => (int) env('AI_TIMEOUT', 25),
        'budget' => (int) env('AI_BUDGET', 70),
        // so para maquina cujo PHP nao tem lista de certificados (curl.cainfo vazio, "error 60"): caminho do cacert.pem
        'ca_bundle' => env('AI_CA_BUNDLE'),
    ],

    'gemini' => [
        // rodizio: GEMINI_API_KEY e a primeira; GEMINI_API_KEYS (separadas por virgula) traz as demais, todas de contas do dono do projeto
        'keys' => \App\Services\Ai\KeyList::merge(env('GEMINI_API_KEY'), env('GEMINI_API_KEYS')),
        // em 26/11/2026 o 2.5 saiu para contas novas e o gemini-flash-latest/3.5-flash davam 503: o flash-lite respondeu estavel. Liste com ai:check --models
        // GEMINI_MODELS (virgula) e a ordem de queda quando um modelo esta sobrecarregado; sem ela vale GEMINI_MODEL
        'models' => array_values(array_filter(array_map('trim', explode(',', (string) (env('GEMINI_MODELS') ?: env('GEMINI_MODEL', 'gemini-3.5-flash-lite')))))),
        'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
