<?php

return [

    'auth' => [
        // RNF-09: sessao expira por inatividade (meta de projeto: 30 minutos)
        'inactivity_minutes' => (int) env('AUTH_INACTIVITY_MINUTES', 30),
    ],

    'invitation' => [
        // RF-08, RNF-05: validade do codigo de convite
        'ttl_days' => (int) env('INVITATION_TTL_DAYS', 7),
        // RNF-06: tentativas de validacao por janela, com bloqueio temporario ao exceder
        'max_attempts' => (int) env('INVITATION_MAX_ATTEMPTS', 5),
        'attempt_window_minutes' => (int) env('INVITATION_ATTEMPT_WINDOW_MINUTES', 15),
    ],

];
