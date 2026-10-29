<?php

// Fino de proposito: so agrega os arquivos de cada bloco. Escrito uma vez, nao se toca mais.
// O prefixo /api/v1 e o middleware api vem do bootstrap/app.php (RNF-58).

require __DIR__.'/api/auth.php';
require __DIR__.'/api/consent.php';
require __DIR__.'/api/psychologist.php';
require __DIR__.'/api/bonds.php';
require __DIR__.'/api/reports.php';
require __DIR__.'/api/tasks.php';
require __DIR__.'/api/notifications.php';
require __DIR__.'/api/messages.php';

