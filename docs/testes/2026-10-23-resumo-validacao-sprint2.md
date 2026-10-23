# Registro da validação da Sprint 2 em 23/10/2026

O Newman passou nas pastas A/C/D/E/F após corrigir a coleção e sua preparação: 55 requisições e 105 asserções, sem falhas. A suíte Feature do backend também passou, com 197 testes e 3556 asserções. O bloco B não foi implementado nem validado nesta rodada.

## Contexto

- Projeto Calmind, TCC Senai, entrega da Sprint 2 em 23/10/2026.
- Branch: `feat/b0-fundacao-backend`.
- Commit inicial da sessão: `228fd57`.
- Correções e evidências publicadas no commit [b381ed6](https://github.com/rbrecci/Calmind/commit/b381ed649fbfd7b76d572ce0c8853aef59a91f50).
- PR existente: [#18](https://github.com/rbrecci/Calmind/pull/18). Nenhum merge foi executado nesta sessão.
- Foram lidos o [plano da Sprint 2](../planejamento/plano-mvp-sprint2-2026-10-22.md) e as [regras invioláveis](../engenharia/regras-inviolaveis.md).

## Ambiente e teste manual

A inspeção inicial encontrou a árvore Git limpa, PHP escutando em `0.0.0.0:8000` e Node em `8081`. Ao tentar abrir os painéis, as páginas `/admin/login` e `/psychologist/login` retornaram HTTP 500, inclusive pelo IP da rede `10.106.12.149`.

O diagnóstico encontrou dependências ausentes em `backend/vendor`: o autoload tentava carregar `myclabs/deep-copy/src/DeepCopy/deep_copy.php`, que não existia. Foi executado `composer install --no-interaction --prefer-dist` em `backend/`, usando o lockfile existente. O comando restaurou 34 pacotes e terminou com código 0. Depois, `curl.exe` confirmou HTTP 200 nas duas páginas de login pelo IP da rede. Nenhuma alteração de dependência entrou no diff versionado.

O Saker confirmou manualmente os dois fluxos seguintes:

1. Aprovação da Jane Marple no painel administrativo.
2. Criação de tarefa no painel da psicóloga, conclusão no app e conferência do estado concluído no painel.

Essa confirmação foi informada pelo Saker no chat. Não foram produzidas capturas de tela nem uma segunda execução independente desses fluxos pela interface.

## Banco de demonstração

O Saker autorizou explicitamente recriar o banco `calmind`, ciente da exclusão dos dados do teste manual. A execução carregou o Laravel, confirmou `connection=mysql` e `database=calmind` e chamou:

```php
Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);
```

O processo terminou com código 0. A aprovação e a tarefa confirmadas manualmente antes do reset não representam o estado atual desses registros após o seeder. A execução do Newman também criou dados fictícios próprios; não houve novo reset depois dela.

Os testes Feature usaram exclusivamente `calmind_test`. Nenhuma senha de banco foi impressa ou incluída nos arquivos da entrega.

## Falhas encontradas e correções

| Problema comprovado | Correção aplicada |
|---|---|
| Cadastro profissional da coleção enviava JSON com `document_url`, mas o Request exige arquivo `document`. | Upload multipart com documento PDF fictício versionado. O caso de CRP inválido também envia documento válido e verifica os erros específicos de CRP e região. |
| A coleção usava uma rota inexistente para obter o documento profissional. | Uso de `/psychologist/documents/{idDocumento}`, com o identificador obtido da aprovação. O acesso do paciente continua exigindo 403. |
| Edição de perfil enviava nomes de campos diferentes dos aceitos pela API. | Uso de `profile_*` e asserções que conferem os valores devolvidos. |
| O teste de honorários esperava recusa na edição do rascunho, mas a regra existente bloqueia a publicação. | Salvar rascunho, exigir 422 ao publicar, conferir o erro de `profile_bio` e restaurar o texto válido antes da publicação positiva. |
| A primeira rodada incluiu indevidamente a pasta 02, cujas rotas de consentimento não estão implementadas. O paciente criado em A não tinha aceite. | Executar somente A/C/D/E/F e preparar o aceite geral como fixture local antes de relatos e tarefas, sem implementar B. |
| `--export-collection` do Newman 6.2.3 exportou valores originais vazios após A, interrompendo a guarda do runner. | Capturar o estado no último teste de A somente em uma cópia temporária, usar `--export-environment` e reidratar as variáveis da coleção antes de C/D/E/F. |

As mudanças ficaram na coleção, no PDF fictício, no runner e nas evidências. A API e `ReportPrivacyTest` não foram alterados. As asserções de privacidade de E/F foram preservadas. Nenhuma expectativa foi flexibilizada para aceitar uma falha da API.

## Runner reproduzível

O arquivo [rodar-newman-sprint2.ps1](../api/rodar-newman-sprint2.ps1) executa A, prepara o aceite do paciente fictício recém-criado e executa C/D/E/F. Ele exige API HTTP local, ambiente Laravel `local`, conexão MySQL em loopback e banco efetivo `calmind`. Também confere o ID, e-mail e identificador da execução antes de gravar o aceite.

O runner não recria o banco. Tokens e estado intermediário ficam em arquivos temporários fora do repositório, removidos no `finally`. A execução C/D/E/F recebe as variáveis reidratadas na coleção, evitando que um ambiente antigo esconda IDs criados durante o fluxo. O bloco B é declarado como não testado no log.

Comando da rodada aprovada, executado na raiz do repositório:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/api/rodar-newman-sprint2.ps1 -OutputPath docs/testes/2026-10-23-newman-blocos-a-c-d-e-f-02.txt
```

Para repetir, informe outro `OutputPath`: o runner recusa sobrescrever evidências existentes. Newman 6.2.3 foi conferido com `npx newman -v`; o runner usa `npx.cmd --no-install newman`.

## Evidências e resultados

| Execução | Resultado | Evidência |
|---|---|---|
| Primeira rodada, incluindo indevidamente B | Código 1: 57 requisições, 103 asserções e 55 falhas, com falhas em sequência após os pré-requisitos. | [Saída bruta A/B/C/D/E/F](2026-10-23-newman-blocos-a-b-c-d-e-f.txt). |
| Primeiro runner A/C/D/E/F | A passou com 9 requisições e 15 asserções. O runner terminou com código 1 na guarda de variáveis vazias; C/D/E/F não foram executadas. | [Saída da interrupção do runner](2026-10-23-newman-blocos-a-c-d-e-f.txt). |
| Runner corrigido | A: 9 requisições e 15 asserções; C/D/E/F: 46 requisições e 90 asserções. Ambos os Newman retornaram código 0. Total: 55 requisições, 105 asserções e zero falhas. | [Saída bruta aprovada](2026-10-23-newman-blocos-a-c-d-e-f-02.txt), resumos nas linhas 61-75 e 321-335. |
| Backend Feature | Código 0: 197 testes e 3556 asserções. Inclui `ReportPrivacyTest`. | `php artisan test --testsuite=Feature --no-ansi`, com banco efetivo `calmind_test` confirmado antes da execução. Saída observada no terminal desta sessão, sem arquivo bruto próprio. |

A saída observada da suíte backend foi:

```text
Banco efetivo para testes: calmind_test
Tests:    197 passed (3556 assertions)
Duration: 53.63s
```

Na rodada aprovada, o Newman confirmou que o psicólogo não vê conteúdo nem ID do relato privado, que a contagem inclui somente compartilhados e que o acesso direto ao relato privado responde 404. Também verificou conclusão idempotente de tarefa e bloqueio da edição após a conclusão.

Os seis arquivos do commit `b381ed6` foram conferidos em LF, sem os caracteres U+2014, U+2013 e U+2212 e sem padrões de tokens Sanctum na varredura. O `git grep` com `LC_ALL=C.UTF-8` retornou código 1. Os arquivos temporários da execução diagnóstica também foram conferidos como removidos.

O push de `b381ed6` foi confirmado comparando o hash local com `git ls-remote`: ambos apontavam para `b381ed649fbfd7b76d572ce0c8853aef59a91f50`. A árvore Git ficou limpa após esse push. A autoria foi `rbrecci <fbrecci@gmail.com>`, sem trailer de coautoria.

## Limites e pendências

- O bloco B continua fora do escopo. A fixture de aceite permite testar relatos e tarefas, mas não valida o fluxo de consentimento pela API ou pela interface.
- Foi executada a suíte Feature. A falha conhecida causada pela referência a `tests/Unit` inexistente em `phpunit.xml` não foi corrigida. O comando sem selecionar Feature não foi repetido nesta sessão.
- O aceite visual foi informado pelo Saker antes do reset do banco. Não houve nova validação visual depois do reset e das rodadas Newman.
- RNF-61 continua parcial: a validação da tarefa não comprova o ciclo de consulta exigido pelo requisito.
- ABNT, README raiz, `docs/testes/README.md`, relatório de contribuição e log de etapas não foram alterados. Agenda, chat, medicação, IA, landing page, F2/F3 e bloco B completo não foram implementados.
