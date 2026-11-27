# Evidências de teste

Saídas datadas de execução, com o comando usado. O relatório consolidado da Sprint 3 ainda não foi escrito.

## Mais recentes

| Evidência | O que prova | Resultado |
|-----------|-------------|-----------|
| [Newman, pastas 01 a 14, 26/11](2026-11-26-newman-completo.txt) | Coleção do Postman com medicação, análise por IA e prontuário. **A IA foi simulada** (`AI_PROVIDER=simulated`): prova o fluxo e as regras, não o Gemini | Pasta 01: 9 requisições, 15 asserções. Pastas 02 a 14: 185 requisições, 347 asserções. 0 falhas |
| [Roteiro cruzado, testes e APK, 04/11](2026-11-04-roteiro-rnf-61.md) | RNF-61 com o app no Expo web | 18 de 18 verificações; 242 testes do backend; 161 do app; APK não executado em aparelho |
| [php artisan test, 29/10](2026-10-29-php-artisan-test-fechamento.txt) | Suíte do backend | 220 testes, 3835 asserções |
| [Newman, pastas 01 a 10, 29/10](2026-10-29-newman-fechamento.txt) | Coleção contra a API real, sem fixture de aceite (duas execuções) | 119 requisições, 228 asserções, 0 falhas |

## Sprint 2 (23/10/2026)

| Evidência | O que prova | Resultado |
|-----------|-------------|-----------|
| [php artisan test](2026-10-23-php-artisan-test.txt) | Suíte do backend, com o `ReportPrivacyTest` (RNF-08) | 197 testes, 3556 asserções |
| [Newman A/C/D/E/F](2026-10-23-newman-blocos-a-c-d-e-f-02.txt) | Coleção contra a API real ([runner](../api/rodar-newman-sprint2.ps1)) | 55 requisições, 105 asserções, 0 falhas |
| [npm test, tsc e lint](2026-10-23-app-npm-test.txt) | App | 66 testes, tsc e lint sem erro |
| [Roteiro I2](2026-10-23-roteiro-i2.md), com [capturas](capturas-i2/) | Aprovação no painel web aparece no app | Ver o roteiro |
| [Capturas do app](capturas-app/) | Telas no Expo web | Ver a pasta |
| [Resumo da validação](2026-10-23-resumo-validacao-sprint2.md) | Falhas, correções e limites da rodada | Ver o resumo |

## Histórico (não use como prova de sucesso)

- [Newman A a F](2026-10-23-newman-blocos-a-b-c-d-e-f.txt): incluiu a pasta B por engano e terminou com 55 falhas.
- [Newman A/C/D/E/F, primeiro runner](2026-10-23-newman-blocos-a-c-d-e-f.txt): parou depois da pasta A.
- [Newman A/D/E](2026-10-21-newman-blocos-a-d-e.txt), [Newman F](2026-10-22-newman-bloco-f.txt) e [rodada de 22/10](2026-10-22-sprint2.txt): superadas.

## Limites declarados

- O app foi verificado no Expo web nestas evidências; não há evidência versionada em celular físico.
- A rodada de 04/11 não tem saída bruta nem script versionados.
- Provas do modelo no banco: [`testes-do-modelo.sql`](../diagramas/testes-do-modelo.sql).
