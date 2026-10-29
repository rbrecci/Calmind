# Relatório da frente Mariana

## Estado final
Branch: `codex/mariana-app-psicologo`. Base: `cc13e3c`. Desenvolvimento iniciado em 29/10/2026.
Último commit: base acima; atualização e evidências serão acrescentadas a cada entrega.

## Itens
| Item | Situação | Commit | Evidência |
| --- | --- | --- | --- |
| M1 | feito | commit desta entrega | 28 testes de API passaram |
| M2 a M10 | não feito | | |
| M11 a M13 | não feito | | |

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

## Suposições
- As instruções de fechamento prevalecem sobre o aviso antigo de não iniciar telas antes do spike físico.
- PDFs não baixados nesta sessão. Identidade visual e instruções da frente orientam as telas.

## Desvios do contrato
Nenhum registrado até esta atualização.

## Dependências abertas
- Integração com o backend das rotas novas e validação em celular físico.
- Notificações de mensagem trazem apenas message id; não existe rota de consulta individual para resolver diretamente o paciente. A resolução terá de percorrer mensagens dos vínculos próprios, sem inventar endpoint.

## Não verificado
App ainda em desenvolvimento. Nada validado contra o servidor real ou em celular físico.

## Arquivos que você criou ou alterou fora da sua pasta

