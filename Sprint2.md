# Calmind: entrega da Sprint 2

**TCC, Técnico em Desenvolvimento de Sistemas, SENAI-SP.** Entrega em 23/10/2026.

Este arquivo é um índice: diz onde cada parte da Sprint 2 está no repositório e como conferir.

## Visão geral

| Parte | Onde está |
|-------|-----------|
| API Laravel com MySQL | [`backend/`](backend/) |
| Painel web (administrador e psicólogo) | [`backend/resources/views/`](backend/resources/views/) |
| Aplicativo React Native (Expo) | [`app/`](app/) |
| Banco de dados | [`backend/database/migrations/`](backend/database/migrations/) |
| Testes e evidências | [`docs/testes/`](docs/testes/README.md) |
| Documento ABNT | [`docs/documento-final/CALMIND_ABNT.docx`](docs/documento-final/CALMIND_ABNT.docx) |
| Landing page | [`landing/`](landing/index.html) |

## 1. API e banco de dados

API em `/api/v1`, com autenticação por token (Sanctum), cadastro e aprovação de psicólogos, catálogo, convite e vínculo, relatos com restrição de privacidade e tarefas terapêuticas.

- **Rotas:** [`backend/routes/api/`](backend/routes/api/) e [`backend/routes/web.php`](backend/routes/web.php). A tabela completa de rotas está no capítulo 15 do [documento ABNT](docs/documento-final/CALMIND_ABNT.docx).
- **Controllers:** [`backend/app/Http/Controllers/Api/V1/`](backend/app/Http/Controllers/Api/V1/)
- **Regras de negócio:** [`backend/app/Services/`](backend/app/Services/)
- **Validação das entradas:** [`backend/app/Http/Requests/`](backend/app/Http/Requests/)
- **Migrations e view `shared_reports`:** [`backend/database/migrations/`](backend/database/migrations/)
- **Dados de demonstração:** [`backend/database/seeders/UserSeeder.php`](backend/database/seeders/UserSeeder.php)
- **Contrato da API:** [`docs/api/contrato-api.md`](docs/api/contrato-api.md)
- **Coleção do Postman:** [`docs/api/Calmind.postman_collection.json`](docs/api/Calmind.postman_collection.json)
- **Arquitetura do back-end:** [`docs/engenharia/arquitetura-backend.md`](docs/engenharia/arquitetura-backend.md)

### Modelagem

- Esquema SQL: [`docs/diagramas/schema.sql`](docs/diagramas/schema.sql)
- Modelo e DER: [`docs/diagramas/modelo-de-dados.md`](docs/diagramas/modelo-de-dados.md) e [`docs/diagramas/der.md`](docs/diagramas/der.md)
- Figuras (MER, DER e arquitetura): [`docs/diagramas/img/`](docs/diagramas/img/)

## 2. Painel web

Painel em Blade, dentro do mesmo projeto Laravel.

- **Administrador:** login e fila de cadastros profissionais, com aprovação e recusa. Telas em [`backend/resources/views/admin/`](backend/resources/views/admin/).
- **Psicólogo:** login e criação e acompanhamento de tarefas. Telas em [`backend/resources/views/psychologist/`](backend/resources/views/psychologist/).
- **Endereços:** `/admin/login` e `/psychologist/login`, com o servidor em `http://localhost:8000`.

## 3. Aplicativo

Aplicativo em Expo e React Native, ligado à API real.

- **Telas:** [`app/src/app/`](app/src/app/) (entrada com tratamento de erro de login, escolha de perfil, cadastro do paciente, início do paciente com tarefas, catálogo de psicólogos e painel do psicólogo)
- **Módulo de API:** [`app/src/api/`](app/src/api/)
- **Cadastro e validação:** [`app/src/auth/`](app/src/auth/)
- **Catálogo:** [`app/src/catalog/`](app/src/catalog/)
- **Design system:** [`app/src/design-system/`](app/src/design-system/)
- **Como rodar:** [`app/README.md`](app/README.md) e [`docs/engenharia/setup-frontend.md`](docs/engenharia/setup-frontend.md)
- **Protótipo das telas:** [`docs/prototipo/`](docs/prototipo/) e [`docs/identidade-visual.md`](docs/identidade-visual.md)
- **Capturas do app em execução:** [`docs/testes/capturas-app/`](docs/testes/capturas-app/)

## 4. Dados compartilhados entre painel web e aplicativo

O administrador aprova um psicólogo no painel web e ele passa a aparecer no catálogo do aplicativo, na mesma sessão. O passo a passo, com os comandos e as capturas de tela, está em [`docs/testes/2026-10-23-roteiro-i2.md`](docs/testes/2026-10-23-roteiro-i2.md). As imagens estão em [`docs/testes/capturas-i2/`](docs/testes/capturas-i2/).

## 5. Como conferir

### Rodar o sistema

Detalhes em [`backend/README.md`](backend/README.md) e [`docs/engenharia/setup-backend.md`](docs/engenharia/setup-backend.md).

```bash
# back-end (dentro de backend/)
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# aplicativo (dentro de app/)
npm ci
cp .env.example .env
npx expo start
```

As contas de demonstração estão em [`UserSeeder.php`](backend/database/seeders/UserSeeder.php).

### Rodar os testes

```bash
# dentro de backend/
php artisan test

# dentro de app/
npm test
npm run lint
npx tsc --noEmit
```

## 6. Testes e evidências

Índice em [`docs/testes/README.md`](docs/testes/README.md). Saídas brutas de 23/10/2026:

| Evidência | Arquivo |
|-----------|---------|
| Testes do back-end: 197 testes, 3556 asserções | [`2026-10-23-php-artisan-test.txt`](docs/testes/2026-10-23-php-artisan-test.txt) |
| Coleção do Postman rodada pelo Newman: 55 requisições, 105 asserções, sem falhas | [`2026-10-23-newman-blocos-a-c-d-e-f-02.txt`](docs/testes/2026-10-23-newman-blocos-a-c-d-e-f-02.txt) |
| Testes do app: 66 testes, tipos e lint | [`2026-10-23-app-npm-test.txt`](docs/testes/2026-10-23-app-npm-test.txt) |
| Roteiro dos dados compartilhados entre painel e app | [`2026-10-23-roteiro-i2.md`](docs/testes/2026-10-23-roteiro-i2.md) |
| Registro da validação | [`2026-10-23-resumo-validacao-sprint2.md`](docs/testes/2026-10-23-resumo-validacao-sprint2.md) |

- **Testes automatizados do back-end:** [`backend/tests/Feature/`](backend/tests/Feature/). O isolamento dos relatos privados está em [`ReportPrivacyTest.php`](backend/tests/Feature/ReportPrivacyTest.php).
- **Comando do Newman:** [`docs/api/rodar-newman-sprint2.ps1`](docs/api/rodar-newman-sprint2.ps1)

## 7. Documentação

- **Documento ABNT:** [`docs/documento-final/CALMIND_ABNT.docx`](docs/documento-final/CALMIND_ABNT.docx)
- **Requisitos:** [`docs/documento-requisitos.md`](docs/documento-requisitos.md)
- **Plano e log de etapas da Sprint 2:** [`docs/planejamento/etapas-sprint2.md`](docs/planejamento/etapas-sprint2.md)
- **Plano do MVP:** [`docs/planejamento/plano-mvp-sprint2-2026-10-22.md`](docs/planejamento/plano-mvp-sprint2-2026-10-22.md)
- **Engenharia (regras e convenções):** [`docs/engenharia/`](docs/engenharia/README.md)

## 8. Landing page

Página de apresentação do projeto em [`landing/index.html`](landing/index.html), com instruções em [`landing/README.md`](landing/README.md).
