# Relatório de testes

Evidências datadas de execução. Cada arquivo guarda a saída bruta de uma rodada, com o comando usado.

## Sprint 2 (23/10/2026)

| Evidência | O que prova | Resultado |
|-----------|-------------|-----------|
| [php artisan test](2026-10-23-php-artisan-test.txt) | Suíte do backend em `calmind_test`, incluindo o `ReportPrivacyTest` (RNF-08) | 197 testes, 3556 asserções, exit 0 |
| [Newman A/C/D/E/F](2026-10-23-newman-blocos-a-c-d-e-f-02.txt) | Coleção do Postman contra a API real, rodada pelo runner [rodar-newman-sprint2.ps1](../api/rodar-newman-sprint2.ps1) | 55 requisições, 105 asserções, 0 falhas |
| [npm test, tsc e lint](2026-10-23-app-npm-test.txt) | Testes, tipos e lint do app | 66 testes, tsc e lint com exit 0 |
| [Roteiro I2](2026-10-23-roteiro-i2.md) | RNF-61: aprovação no painel web e aparição no app, com [capturas](capturas-i2/) | Ver o roteiro |
| [Capturas do app](capturas-app/) | Login com erro, escolha de perfil, cadastro e catálogo no Expo web | Ver pasta |
| [Resumo da validação](2026-10-23-resumo-validacao-sprint2.md) | Falhas encontradas, correções e limites da rodada | Ver o resumo |

## Backend do fechamento (29/10/2026)

| Evidência | O que prova | Resultado |
|-----------|-------------|-----------|
| [php artisan test](2026-10-29-php-artisan-test-fechamento.txt) | Suíte do backend naquela data | 220 testes passando, 3835 asserções |
| [Newman, pastas 01 a 10](2026-10-29-newman-fechamento.txt) | Coleção do Postman contra a API real, com consentimento registrado pela API, sem fixture de aceite. O arquivo traz duas execuções | Pasta 01: 9 requisições, 15 asserções. Pastas 02 a 10: 110 requisições, 213 asserções. 0 falhas e exit 0 nas duas |

## Fechamento (04/11/2026)

| Evidência | O que prova | Resultado |
|-----------|-------------|-----------|
| [Roteiro cruzado, testes e APK](2026-11-04-roteiro-rnf-61.md) | RNF-61: tarefa e consulta criadas no painel web, vistas pelo paciente no app e conclusão de volta no painel, com o app no Expo web; testes automatizados no código final; APK gerado e conferido como arquivo | 18 de 18 verificações; 242 testes do backend (4080 asserções); 161 testes do app; APK não executado em aparelho |

## Histórico (não use como prova de sucesso)

- [Newman A/B/C/D/E/F](2026-10-23-newman-blocos-a-b-c-d-e-f.txt): primeira rodada, incluiu a pasta B por engano e terminou com 55 falhas.
- [Newman A/C/D/E/F, primeira versão do runner](2026-10-23-newman-blocos-a-c-d-e-f.txt): o runner parou na guarda de variáveis vazias depois da pasta A.
- [Newman A/D/E](2026-10-21-newman-blocos-a-d-e.txt) e [Newman F](2026-10-22-newman-bloco-f.txt): rodadas anteriores, 28 e 15 requisições, sem falhas.
- [Evidências de 22/10](2026-10-22-sprint2.txt): 195 testes e 3.545 asserções, superados pelos números de 23/10.

## Limites declarados

- O bloco B (consentimento) não estava implementado nem testado na Sprint 2 (23/10/2026), e aquela demonstração usou aceite preparado. A rodada de 04/11/2026 exercitou a regra no painel (tarefa sem consentimento volta ao formulário), mas registrar o consentimento do responsável pela tela segue não verificado.
- Tudo do app foi executado no Expo web, não em celular físico, iOS ou Android. O APK de 04/11/2026 foi gerado e conferido como arquivo, sem execução em aparelho.
- Provas de modelo no banco: [testes-do-modelo.sql](../diagramas/testes-do-modelo.sql).
