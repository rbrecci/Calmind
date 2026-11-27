# Calmind: entrega da Sprint 2

**TCC, Técnico em Desenvolvimento de Sistemas, SENAI-SP.** Entrega em 23/10/2026.

Registro da entrega: onde cada parte da Sprint 2 está e como foi conferida. Números e limites são de 23/10; o estado atual está em [`FinalSprint3.md`](FinalSprint3.md).

## Visão geral

| Parte | Onde está |
|-------|-----------|
| API Laravel com MySQL | [`backend/`](../../backend/) |
| Painel web (administrador e psicólogo) | [`backend/resources/views/`](../../backend/resources/views/) |
| Aplicativo React Native (Expo) | [`app/`](../../app/) |
| Banco de dados | [`backend/database/migrations/`](../../backend/database/migrations/) |
| Testes e evidências | [`docs/testes/`](../testes/README.md) |
| Documento ABNT | [`docs/documento-final/CALMIND_ABNT.docx`](../documento-final/CALMIND_ABNT.docx) |
| Landing page | [`landing/`](../../landing/index.html) |

## 1. API e banco de dados

API em `/api/v1`, com autenticação por token (Sanctum), cadastro e aprovação de psicólogos, catálogo, convite e vínculo, relatos com restrição de privacidade e tarefas terapêuticas.

- **Rotas:** [`backend/routes/api/`](../../backend/routes/api/) e [`backend/routes/web.php`](../../backend/routes/web.php). A tabela completa de rotas está no capítulo 15 do [documento ABNT](../documento-final/CALMIND_ABNT.docx).
- **Controllers:** [`backend/app/Http/Controllers/Api/V1/`](../../backend/app/Http/Controllers/Api/V1/)
- **Regras de negócio:** [`backend/app/Services/`](../../backend/app/Services/)
- **Validação das entradas:** [`backend/app/Http/Requests/`](../../backend/app/Http/Requests/)
- **Migrations e view `shared_reports`:** [`backend/database/migrations/`](../../backend/database/migrations/)
- **Dados de demonstração:** [`backend/database/seeders/UserSeeder.php`](../../backend/database/seeders/UserSeeder.php)
- **Contrato da API:** [`docs/api/contrato-api.md`](../api/contrato-api.md)
- **Coleção do Postman:** [`docs/api/Calmind.postman_collection.json`](../api/Calmind.postman_collection.json)
- **Arquitetura do back-end:** [`docs/engenharia/arquitetura-backend.md`](../engenharia/arquitetura-backend.md)

### Modelagem

- Esquema SQL: [`docs/diagramas/schema.sql`](../diagramas/schema.sql)
- Modelo e DER: [`docs/diagramas/modelo-de-dados.md`](../diagramas/modelo-de-dados.md) e [`docs/diagramas/der.md`](../diagramas/der.md)
- Figuras (MER, DER e arquitetura): [`docs/diagramas/img/`](../diagramas/img/)

## 2. Painel web

Painel em Blade, dentro do mesmo projeto Laravel.

- **Administrador:** login e fila de cadastros profissionais, com aprovação e recusa. Telas em [`backend/resources/views/admin/`](../../backend/resources/views/admin/).
- **Psicólogo:** login e criação e acompanhamento de tarefas. Telas em [`backend/resources/views/psychologist/`](../../backend/resources/views/psychologist/).
- **Endereços:** `/admin/login` e `/psychologist/login`, com o servidor em `http://localhost:8000`.

## 3. Aplicativo

Aplicativo em Expo e React Native, ligado à API real.

- **Telas:** [`app/src/app/`](../../app/src/app/) (entrada com tratamento de erro de login, escolha de perfil, cadastro do paciente, início do paciente com tarefas, catálogo de psicólogos e painel do psicólogo)
- **Módulo de API:** [`app/src/api/`](../../app/src/api/)
- **Cadastro e validação:** [`app/src/auth/`](../../app/src/auth/)
- **Catálogo:** [`app/src/catalog/`](../../app/src/catalog/)
- **Design system:** [`app/src/design-system/`](../../app/src/design-system/)
- **Como rodar:** [`app/README.md`](../../app/README.md) e [`docs/engenharia/setup-frontend.md`](../engenharia/setup-frontend.md)
- **Protótipo das telas:** [`docs/prototipo/`](../prototipo/) e [`docs/identidade-visual.md`](../identidade-visual.md)
- **Capturas do app em execução:** [`docs/testes/capturas-app/`](../testes/capturas-app/)

## 4. Dados compartilhados entre painel web e aplicativo

O administrador aprova um psicólogo no painel web e ele passa a aparecer no catálogo do aplicativo, na mesma sessão. O passo a passo, com os comandos e as capturas de tela, está em [`docs/testes/2026-10-23-roteiro-i2.md`](../testes/2026-10-23-roteiro-i2.md). As imagens estão em [`docs/testes/capturas-i2/`](../testes/capturas-i2/).

## 5. Testes e evidências

Índice em [`docs/testes/README.md`](../testes/README.md). Saídas brutas de 23/10/2026:

| Evidência | Arquivo |
|-----------|---------|
| Testes do back-end: 197 testes, 3556 asserções | [`2026-10-23-php-artisan-test.txt`](../testes/2026-10-23-php-artisan-test.txt) |
| Coleção do Postman rodada pelo Newman: 55 requisições, 105 asserções, sem falhas | [`2026-10-23-newman-blocos-a-c-d-e-f-02.txt`](../testes/2026-10-23-newman-blocos-a-c-d-e-f-02.txt) |
| Testes do app: 66 testes, tipos e lint | [`2026-10-23-app-npm-test.txt`](../testes/2026-10-23-app-npm-test.txt) |
| Roteiro dos dados compartilhados entre painel e app | [`2026-10-23-roteiro-i2.md`](../testes/2026-10-23-roteiro-i2.md) |
| Registro da validação | [`2026-10-23-resumo-validacao-sprint2.md`](../testes/2026-10-23-resumo-validacao-sprint2.md) |

- **Testes automatizados do back-end:** [`backend/tests/Feature/`](../../backend/tests/Feature/). O isolamento dos relatos privados está em [`ReportPrivacyTest.php`](../../backend/tests/Feature/ReportPrivacyTest.php).
- **Comando do Newman:** [`docs/api/rodar-newman-sprint2.ps1`](../api/rodar-newman-sprint2.ps1)

## 6. Documentação

- **Documento ABNT:** [`docs/documento-final/CALMIND_ABNT.docx`](../documento-final/CALMIND_ABNT.docx)
- **Requisitos:** [`docs/documento-requisitos.md`](../documento-requisitos.md)
- **Log de etapas:** [`docs/planejamento/etapas-sprint2.md`](etapas-sprint2.md)
- **Engenharia:** [`docs/engenharia/`](../engenharia/README.md)
- **Como rodar:** [README da raiz](../../README.md#como-executar)

## 7. Landing page

Página de apresentação do projeto em [`landing/index.html`](../../landing/index.html), com instruções em [`landing/README.md`](../../landing/README.md).
