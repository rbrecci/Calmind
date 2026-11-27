<?php

return [

    'appointment' => [
        'conflict_minutes' => 60,
    ],

    'auth' => [
        // RNF-09: sessao expira por inatividade (meta de projeto: 30 minutos)
        'inactivity_minutes' => (int) env('AUTH_INACTIVITY_MINUTES', 30),
        // Tentativas de login erradas: por e-mail e IP em 1 minuto, e por e-mail em 15 minutos
        'login_max_attempts' => (int) env('LOGIN_MAX_ATTEMPTS', 5),
        'login_account_max_attempts' => (int) env('LOGIN_ACCOUNT_MAX_ATTEMPTS', 30),
    ],

    'invitation' => [
        // RF-08, RNF-05: validade do codigo de convite
        'ttl_days' => (int) env('INVITATION_TTL_DAYS', 7),
        // RNF-06: tentativas de validacao por janela, com bloqueio temporario ao exceder
        'max_attempts' => (int) env('INVITATION_MAX_ATTEMPTS', 5),
        'attempt_window_minutes' => (int) env('INVITATION_ATTEMPT_WINDOW_MINUTES', 15),
    ],

];
