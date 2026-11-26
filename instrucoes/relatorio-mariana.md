# Relatório da frente Mariana

## Estado final
Branch: `codex/mariana-app-psicologo`. Base: `cc13e3c`. Desenvolvimento iniciado em 29/10/2026.
Último commit de implementação verificado: `81b919bb5bb89dc09261709ceb6ac717db77abf7`. O commit seguinte acompanha somente o fechamento deste relatório; seu hash pode ser obtido com `git log -1`.
Última atualização de conteúdo: 29/10/2026, 09:06, America/Sao_Paulo.
M1 a M12 implementados. M13 parcial: revisão estática e medições web concluídas, leitor de tela e aparelho físico pendentes.
O app foi verificado contra o mock, não contra o servidor real, e não em celular físico.
Push pendente por autenticação do Git do terminal, veja dependências abertas.

## Itens
| Item | Situação | Commit | Evidência |
| --- | --- | --- | --- |
| M1 | feito | cb99bc4, 81b919b | 29 testes de API passaram, incluindo correção de publicação |
| M2 | feito | b1bdce2 | portão fechado em erro, estados de aprovação e pacientes |
| M3 | feito | bec3654 | convite selecionável e revogável, confirmação de solicitações |
| M4 | feito | de37697 | prontuário com erros separados e apenas relatos compartilhados |
| M5 | feito | de37697 | criar, editar pendentes e arquivar com confirmação |
| M6 | feito | 92c0a0a | polling em foco, leitura e reenvio sem entrega falsa |
| M7 | feito | 48031c5 | fuso local, reagendamento, cancelamento e confirmação de conflito |
| M8 | feito | 1680446 | leitura individual e geral, navegação sem conteúdo clínico |
| M9 | feito | b1bdce2 | cadastro multipart e perfil, seletor compatível SDK 57 |
| M10 | feito | b1bdce2 | consentimento antes do perfil e de dados clínicos |
| M11 | feito | 227134c | registros do responsável em menor com vínculo ativo, somente inclusão |
| M12 | feito | de37697 | encerrar vínculo com confirmação no prontuário |
| M13 | parcial | b1bdce2, 81b919b | tokens, rótulos e 13 medições web, leitor de tela pendente |

## Evidência colada
Correção final do mock, após teste vermelho: atualização de perfil contendo somente campos extras estava retirando a publicação, diferente de `PsychologistRegistrationService::updateProfile` que compara somente campos validados. Resultado inicial: `profile_published_at: null` diferente da data original esperada. Após limitar a comparação à lista permitida: 29 testes de API passaram.
```text
node --no-warnings --test app/src/api/psychologist/mock.test.ts app/src/api/psychologist/http.test.ts
tests 28 / pass 28 / fail 0 / exit 0
npm ci
EPERM open AppData/Local/npm-cache/_cacache (exit 1)
npm ci --cache ../.local/npm-cache-mariana --no-audit --no-fund
added 843 packages in 3m (exit 0, caminho absoluto do cache usado)
npm view expo-document-picker@sdk-57 version
57.0.3 (exit 0)
npx.cmd expo install expo-document-picker
Installing 1 SDK 57.0.0 compatible native module using npm
added 2 packages, and audited 846 packages in 7s (exit 0)
npm test
tests 122
suites 26
pass 122
fail 0
cancelled 0
skipped 0
todo 0
npm run lint
0 errors (um aviso de dependência de hook corrigido em seguida)
npx.cmd tsc --noEmit
exit 0
```
Testes vermelhos M1: módulos http.ts e mock.ts ausentes (exit 1). Primeiro teste mock antes da materialização falhou por auth-token.ts ausente; repetido após o checkout para comprovar ausência de mock.ts.
Regressões reais descobertas e corrigidas com testes: `404 !== 422` para bond_id 0 e `999 !== 1` ao injetar id na atualização de tarefa.
Uma tentativa prematura de npx tsc sem dependências tentou tsc@2.0.4 e retornou `This is not the tsc command you are looking for`. Interrompida sem alteração do manifesto; compilador local usado após npm ci.
Identidade local: `git config user.name` -> `rbrecci`; `git config user.email` -> `fbrecci@gmail.com`.
`git fetch origin '+refs/heads/*:refs/remotes/origin/*'` -> branch base localizada.
`git checkout -b codex/mariana-app-psicologo origin/integracao/fechamento-30-10` -> branch criada.
O checkout parcial só incluía landing e pesquisa. Primeira expansão com docs inteiros interrompida por demora; processos encerrados e locks da operação interrompida removidos após conferência.
`git sparse-checkout set app backend docs/api docs/engenharia instrucoes` -> exit 0, arquivos materializados.

Vermelho, antes de implementar:
```text
node --no-warnings --test app/src/psychologist/domain.test.ts
ERR_MODULE_NOT_FOUND domain.ts
tests 1 / pass 0 / fail 1 / exit 1
node --no-warnings --test app/src/psychologist/resource.test.ts
ERR_MODULE_NOT_FOUND resource.ts
tests 1 / pass 0 / fail 1 / exit 1
```

### Entrega m3 (2026-10-29 08:59:42 -03:00, anterior b1bdce2)
```text
test -> exit 0
✔ restoreSession (26.6657ms)
ℹ tests 129
ℹ suites 28
ℹ pass 129
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 822.1113
lint -> exit 0
> calmind@1.0.0 lint
> expo lint
types -> exit 0

```

### Entrega m4-m5 (2026-10-29 09:00:32 -03:00, anterior bec3654)
```text
test -> exit 0
✔ restoreSession (25.2113ms)
ℹ tests 129
ℹ suites 28
ℹ pass 129
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 825.0987
lint -> exit 0
> calmind@1.0.0 lint
> expo lint
types -> exit 0

```

### Entrega m6 (2026-10-29 09:01:57 -03:00, anterior de37697)
```text
test -> exit 0
✔ restoreSession (46.2388ms)
ℹ tests 130
ℹ suites 28
ℹ pass 130
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 820.3657
lint -> exit 0
> calmind@1.0.0 lint
> expo lint
types -> exit 0

```

### Entrega m7 (2026-10-29 09:02:25 -03:00, anterior 92c0a0a)
```text
test -> exit 0
✔ restoreSession (37.4835ms)
ℹ tests 130
ℹ suites 28
ℹ pass 130
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 867.8286
lint -> exit 0
> calmind@1.0.0 lint
> expo lint
types -> exit 0

```

### Entrega m8 (2026-10-29 09:02:49 -03:00, anterior 48031c5)
```text
test -> exit 0
✔ restoreSession (50.08ms)
ℹ tests 130
ℹ suites 28
ℹ pass 130
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 849.6086
lint -> exit 0
> calmind@1.0.0 lint
> expo lint
types -> exit 0

```

### Entrega m11 (2026-10-29 09:03:15 -03:00, anterior 1680446)
```text
test -> exit 0
✔ restoreSession (48.2824ms)
ℹ tests 130
ℹ suites 28
ℹ pass 130
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 800.4126
lint -> exit 0
> calmind@1.0.0 lint
> expo lint
types -> exit 0

```

### Entrega ajuste-mock (2026-10-29 09:03:53 -03:00, anterior 227134c)
```text
test -> exit 0
✔ restoreSession (32.9782ms)
ℹ tests 130
ℹ suites 28
ℹ pass 130
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 956.1187
lint -> exit 0
> calmind@1.0.0 lint
> expo lint

env: load .env
env: export EXPO_PUBLIC_MOCK_SCENARIO EXPO_PUBLIC_USE_MOCK
types -> exit 0

```

### Falhas de testes antes das correções

```text
node --no-warnings --test app/src/psychologist/chat-state.test.ts
ERR_MODULE_NOT_FOUND chat-state.ts
tests 1 / pass 0 / fail 1 / exit 1
envio com erro de campo mostra o texto de body devolvido pela API
Expected: 'Mensagem longa demais.'
Actual: 'Dados inválidos.'
tests 7 / pass 6 / fail 1 / exit 1
cursor de recebimento não avança pelo id da mensagem enviada
Expected: [0, 40]
Actual: [0, 43]
tests 9 / pass 7 / fail 2 / exit 1
node --no-warnings --test app/src/psychologist/chat-state.test.ts
tests 9 / pass 9 / fail 0 / exit 0
node --no-warnings --test app/src/psychologist/notification-target.test.ts
ERR_MODULE_NOT_FOUND notification-target.ts
tests 1 / pass 0 / fail 1 / exit 1
node --no-warnings --test app/src/psychologist/document.test.ts
ERR_MODULE_NOT_FOUND document.ts
tests 1 / pass 0 / fail 1 / exit 1
sortAppointments e accessDestination, antes de acrescentar os exports
SyntaxError: The requested module does not provide an export
exit 1
```

Os testes de domínio também cobrem inverno e verão em America/New_York, horário inexistente na transição de verão, UTC, offset fracionário, prazo inválido, precedência do consentimento e ausência de laço de navegação. Recursos assíncronos ignoram respostas antigas e respostas após desmontar.

### Build web e execução da interface

```text
npx.cmd expo export --platform web --output-dir ../.local/mariana-web-preview-final
env: load .env
React Compiler enabled
Web Bundled 3482ms (860 modules)
Static routes (30)
Exported: C:/Users/Dev_2o_Ano/Desktop/projetos-codex/.local/mariana-web-preview-final
exit 0
node ../.local/mariana-smoke-mobile-final.mjs
source: 81b919b
PASS 13
errors: []
viewport: 390x844
overflowX: 0 (13 medições)
minHeight: 44 (13 medições)
undersized: [] (13 medições)
exit 0
```

O comando de exportação usou o caminho absoluto acima. Os scripts de smoke ficam na pasta `.local` do workspace, fora do repositório, sem novas dependências. Servidor local e Edge headless foram encerrados ao terminar. A primeira conexão CDP expirou em Runtime.enable; nova execução com navegador isolado e `--no-sandbox` respondeu. A primeira tentativa de botão no convite selecionou um botão da tela anterior ainda em transição; a automação passou após esperar visibilidade, sem correção no app.

As 13 verificações finais: consentimento antes dos dados, início aprovado, gerar convite, revogar com confirmação, prontuário com relatos e tarefas, criar tarefa, enviar mensagem, reconhecer conflito de agenda, confirmar agendamento, marcar notificações como lidas, prontuário encerrado sem controles de escrita, chat encerrado sem campo de envio e dois registros do responsável preservados.

Artefatos locais: `../.local/mariana-smoke-mobile-final-result.json`, `../.local/mariana-smoke-mobile-final-inicio.png`, `../.local/mariana-smoke-mobile-final-consentimento.png`, `../.local/mariana-smoke-mobile-final-agenda.png`, `../.local/mariana-smoke-mobile-final-encerrado.png` e `../.local/mariana-smoke-mobile-final-responsavel.png`.

### Chamadas somente contra mock ou transporte simulado nos testes

Nenhuma chamada abaixo foi validada contra servidor real. O cliente HTTP foi conferido por spies de request e fetch simulado, incluindo File web, cabeçalhos multipart, erro de rede e 422. O mock possui cinco cenários, paginação real e instâncias isoladas.

| Área | Chamadas usadas |
| --- | --- |
| Consentimento | GET `/consent-terms/current?type=general`; POST `/consent-acceptances` |
| Cadastro e perfil | GET `/psychologist/profile`; POST `/psychologist/registration` multipart; PUT `/psychologist/profile`; POST `/psychologist/profile/publish` |
| Pacientes | GET `/psychologist/patients?status=active`; GET com `status=ended`; GET `/psychologist/patients/{users.id}` |
| Solicitações | GET `/psychologist/bond-requests`; POST `/psychologist/bond-requests/{id}/accept`; POST com `/reject` |
| Convites e encerramento | POST `/psychologist/invitations`; DELETE `/psychologist/invitations/{id}`; POST `/bonds/{id}/end` |
| Prontuário e tarefas | GET `/psychologist/patients/{id}/reports`; GET `/psychologist/tasks?bond_id=`; POST `/psychologist/tasks`; PUT e DELETE `/psychologist/tasks/{id}` |
| Chat | GET e POST `/bonds/{id}/messages`; POST `/bonds/{id}/messages/read` |
| Agenda | GET e POST `/psychologist/appointments`; PUT `/psychologist/appointments/{id}`; POST `/psychologist/appointments/{id}/cancel` |
| Notificações | GET `/notifications`, incluindo filtro `unread=1`; POST `/notifications/{id}/read`; POST `/notifications/read-all` |
| Responsável | GET e POST `/psychologist/patients/{id}/guardian-consent` |

### Acessibilidade conferida

- Todos os campos usam rótulo persistente e accessibilityLabel, e todas as ações usam Button do design system com rótulo explícito.
- Texto, título, fundo, bordas e espaçamento usam tokens do design system; texto sobre rosa usa Dark. Os testes existentes de contraste e tipografia permanecem verdes.
- DOM das 13 telas/estados do smoke em 390x844 sem rolagem horizontal, com todos os controles renderizados medidos em altura mínima de 44 px. A ordem visual segue a ordem do JSX; cabeçalhos usam a semântica do componente Text.
- Confirmações usam modal com accessibilityViewIsModal e ação para voltar. Leitor de tela, foco assistivo real e teclado do celular não foram testados.

### Entrega final (2026-10-29 09:08:19 -03:00, anterior 81b919b)
```text
test -> exit 0
✔ restoreSession (34.7762ms)
ℹ tests 130
ℹ suites 28
ℹ pass 130
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 918.5979
lint -> exit 0
> calmind@1.0.0 lint
> expo lint

env: load .env
env: export EXPO_PUBLIC_MOCK_SCENARIO EXPO_PUBLIC_USE_MOCK
types -> exit 0

```

## Suposições
- A seção de consentimento do responsável é apresentada para menores com vínculo ativo. O contrato exige vínculo ativo também para GET, por isso não se chama essa rota em vínculo encerrado.
- M4 e M5 entregues juntos porque o formulário de tarefas é uma seção do prontuário. Detalhe do paciente é carregado antes para obter bond_id; relatos, tarefas e consultas são carregados em paralelo em seguida, cada seção com seu próprio erro e nova tentativa.
- M2, M9 e M10 entregues juntos porque o portão precisa de telas reais para consentimento, cadastro e reenvio. Isso evita redirecionar para uma rota ausente.
- O mock usa a conta demonstrativa já existente. Cadastro de uma nova conta de autenticação não compartilha o estado deste módulo e precisa ser conferido na integração.
- As instruções de fechamento prevalecem sobre o aviso antigo de não iniciar telas antes do spike físico.
- PDFs não baixados nesta sessão. Identidade visual e instruções da frente orientam as telas.

## Desvios do contrato
Nenhum desvio deliberado de rota, campo ou formato. Onde o contrato novo não fixa o texto da mensagem de erro, o mock usa mensagem genérica em português; mensagens especificadas de conflito e consentimento de chat são reproduzidas. Regras clínicas e permissões permanecem no servidor real; o mock apenas simula o contrato para desenvolvimento.

## Dependências abertas
- Push: primeira tentativa ficou aguardando o gerenciador de credenciais e foi interrompida. Segunda tentativa com `GIT_TERMINAL_PROMPT=0`, `GCM_INTERACTIVE=never` e `credential.interactive=false` retornou `fatal: Cannot prompt because user interactivity has been disabled.` e `fatal: unable to get password from user` (exit 1). Não foram realizadas novas tentativas. Os commits ficam locais para autenticação e envio pelo operador.
- Integração com o backend das rotas novas e validação em celular físico.
- Notificações de mensagem trazem apenas message id; não existe rota de consulta individual para resolver diretamente o paciente. A implementação percorre pacientes e mensagens de vínculos próprios com paginação e cursor. Conferir custo e consistência desse percurso na integração.
- O contrato de detalhe usa users.id do paciente e não recebe bond_id. Se um mesmo paciente tiver vínculos ativo e encerrado com o mesmo profissional, a integração precisa confirmar qual histórico a rota representa, sem criar um parâmetro fora do contrato.

## Não verificado
Servidor real, celular físico, envio multipart nativo pelo seletor do sistema, leitor de tela, APK e comportamento com teclado nativo. M13 permanece parcial por essas verificações assistivas. O mock atende à conta demonstrativa existente; criação de nova conta de autenticação precisa ser conferida na integração.
Para executar localmente: `cd app`, `npm start`. `app/.env` local e ignorado pelo Git ativa `EXPO_PUBLIC_USE_MOCK=true` e `EXPO_PUBLIC_MOCK_SCENARIO=com-pacientes`. Login fictício: `psicologo@calmind.test`, senha `senha-de-teste-123`, conforme instruções e mock existentes.

## Arquivos que você criou ou alterou fora da sua pasta
