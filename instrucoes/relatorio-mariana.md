# Relatório da frente Mariana

## Estado final
Branch: `codex/mariana-app-psicologo`. Base: `cc13e3c`. Desenvolvimento iniciado em 29/10/2026.
Último commit anterior a esta atualização: `cb99bc4` (M1). Evidências serão acrescentadas a cada entrega.
Push pendente por autenticação do Git do terminal, veja dependências abertas.

## Itens
| Item | Situação | Commit | Evidência |
| --- | --- | --- | --- |
| M1 | feito | cb99bc4 | 28 testes de API passaram |
| M2 | feito | b1bdce2 | portão fechado em erro, estados de aprovação e pacientes |
| M3 | feito | bec3654 | convite selecionável e revogável, confirmação de solicitações |
| M4 | feito | entrega m4-m5 | prontuário com erros separados e apenas relatos compartilhados |
| M5 | feito | entrega m4-m5 | criar, editar pendentes e arquivar com confirmação |
| M6 | feito | entrega m6 | polling em foco, leitura e reenvio sem entrega falsa |
| M7 | feito | entrega m7 | fuso local, reagendamento, cancelamento e confirmação de conflito |
| M8 | parcial | em desenvolvimento | tela em conferência |
| M9 | feito | b1bdce2 | cadastro multipart e perfil, seletor compatível SDK 57 |
| M10 | feito | b1bdce2 | consentimento antes do perfil e de dados clínicos |
| M11 | parcial | em desenvolvimento | mock e formulário, falta inserir no prontuário |
| M12 | feito | entrega m4-m5 | encerrar vínculo com confirmação no prontuário |
| M13 | parcial | em conferência | tokens e rótulos, teste com leitor de tela pendente |

## Evidência colada
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

## Suposições
- M4 e M5 entregues juntos porque o formulário de tarefas é uma seção do prontuário. Detalhe do paciente é carregado antes para obter bond_id; relatos, tarefas e consultas são carregados em paralelo em seguida, cada seção com seu próprio erro e nova tentativa.
- M2, M9 e M10 entregues juntos porque o portão precisa de telas reais para consentimento, cadastro e reenvio. Isso evita redirecionar para uma rota ausente.
- O mock usa a conta demonstrativa já existente. Cadastro de uma nova conta de autenticação não compartilha o estado deste módulo e precisa ser conferido na integração.
- As instruções de fechamento prevalecem sobre o aviso antigo de não iniciar telas antes do spike físico.
- PDFs não baixados nesta sessão. Identidade visual e instruções da frente orientam as telas.

## Desvios do contrato
Nenhum registrado até esta atualização.

## Dependências abertas
- Push: primeira tentativa ficou aguardando o gerenciador de credenciais e foi interrompida. Segunda tentativa com `GIT_TERMINAL_PROMPT=0`, `GCM_INTERACTIVE=never` e `credential.interactive=false` retornou `fatal: Cannot prompt because user interactivity has been disabled.` e `fatal: unable to get password from user` (exit 1). Não foram realizadas novas tentativas. Os commits ficam locais para autenticação e envio pelo operador.
- Integração com o backend das rotas novas e validação em celular físico.
- Notificações de mensagem trazem apenas message id; não existe rota de consulta individual para resolver diretamente o paciente. A resolução terá de percorrer mensagens dos vínculos próprios, sem inventar endpoint.

## Não verificado
App ainda em desenvolvimento. Nada validado contra o servidor real ou em celular físico.

## Arquivos que você criou ou alterou fora da sua pasta

