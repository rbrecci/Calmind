# Convenções de código

Commit e Pull Request estão em [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

## 1. Idioma: inglês no código, português para o usuário

O RNF-52 exige um único idioma nos identificadores. É **inglês** (DP-14, 19/08/2026).

| Onde | Idioma | Exemplo |
|------|--------|---------|
| Classe, método, variável, tabela, coluna, campo de JSON | Inglês | `BondService`, `active_patient_id` |
| Mensagem que o usuário lê | Português | `"Este codigo de convite ja foi usado."` |
| Comentário e documentação | Português | `// RF-12: no maximo 1 vinculo ativo por paciente` |

## 2. Nomes, no padrão do Laravel

| Coisa | Padrão | Exemplo |
|-------|--------|---------|
| Model | Singular, PascalCase | `Bond`, `ConsentTerm` |
| Tabela | Plural, snake_case | `bonds`, `consent_terms` |
| Controller, Service, Policy, Resource | PascalCase com sufixo | `BondService`, `ReportResource` |
| FormRequest | Ação + Model + `Request` | `StoreReportRequest` |
| Chave estrangeira | `<entidade>_id` | `patient_id` |
| Estado | data ou enum, sem `is_` | `consumed_at`, `status` |

## 3. Estilo

PSR-12 no PHP, formatado pelo Pint antes do PR (`cd backend && ./vendor/bin/pint`). No app, `npm run lint`.

## 4. Comentário

Explica o **porquê**, não repete o código. Cite o requisito quando houver (`// CA-23.5: 404 e nao 403`), porque é o que alimenta a seção de codificação do ABNT.

## 5. Testes

Teste de feature em `backend/tests/Feature/` para toda funcionalidade, **com os casos negativos**. As regras críticas do RNF-53 (isolamento do relato privado, autorização por vínculo, uso único do convite, 1 vínculo ativo, ciclo da medicação) são obrigatórias.

## 6. Pronto significa

1. Testes passando, com a pasta correspondente da [coleção do Postman](../api/Calmind.postman_collection.json) verde quando for API.
2. Tela do app: usa só o design system, alvo de toque de 44 pontos, funciona no mock e na API real.
3. PR no modelo, revisado por outra pessoa.
4. Evidência de execução datada em [`docs/testes/`](../testes/README.md) quando for entrega avaliada.

## 7. O que nunca entra num commit

`.env`, `vendor/`, `node_modules/`, senha, chave ou token (RNF-56), APK e keystore, dado de pessoa real (RNF-63), áudio de entrevista e código que você não sabe explicar na banca.
