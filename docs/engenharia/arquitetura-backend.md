# Arquitetura do backend

## 1. O caminho de uma requisição

```
rota  ->  FormRequest  ->  Controller  ->  Service  ->  Model  ->  banco
                                   \
                                    ->  API Resource  ->  JSON
```

| Camada | Responsabilidade | O que ela nunca faz |
|--------|------------------|---------------------|
| **Rota** | Mapear método e caminho, aplicar middleware (autenticação e papel) | Lógica |
| **FormRequest** | Validar entrada, devolver 422 no formato do contrato | Decidir regra de negócio |
| **Controller** | Receber, chamar o Service, devolver Resource | Montar query, calcular regra |
| **Service** | Regra de negócio, inclusive autorização por vínculo | Saber que existe HTTP |
| **Model** | Acesso a dado, relacionamento, cast, escopo | Autorizar |
| **API Resource** | Dar forma ao JSON de saída | Buscar dado |

O Service existe porque o mesmo caso de uso é chamado pela API do app **e** pelo painel Blade. Regra no Controller viraria duas regras, o que o RNF-57 proíbe.

## 2. As duas caras de `backend/`

| Cara | Rotas | Entrega | Quem consome |
|------|-------|---------|--------------|
| **API JSON** | `routes/api/*.php`, prefixo `/api/v1` | JSON | O app |
| **Painel web** | `routes/web.php` | HTML, Blade + Bootstrap | Administrador (aprovação de cadastros) e psicólogo (tarefas e agenda) |

As duas compartilham Models, Services, banco e autenticação. Por isso não existe pasta `painel/`.

## 3. Um arquivo de rota por assunto

`routes/api.php` só agrega os arquivos de `routes/api/`: `auth`, `consent`, `psychologist`, `bonds`, `reports`, `tasks`, `notifications`, `messages`, `appointments`, `medications` e `analyses`.

## 4. Formato de erro

Configurado uma vez (`ApiErrorRenderer`); nenhum Controller monta erro na mão.

```json
{ "message": "...", "errors": { "campo": ["..."] } }
```

Os códigos estão na [seção 2.3 do contrato](../api/contrato-api.md). **404 em vez de 403 é regra de privacidade:** um 403 num relato privado confirmaria que ele existe (CA-23.5). Mensagem de erro nunca expõe tabela nem trecho de exceção.

## 5. Data e paginação

- **DA-06:** data em ISO 8601 com offset `-03:00`. Resolvido na Model base (`SerializesContractDates`), com `APP_TIMEZONE=America/Sao_Paulo`.
- **DA-07:** `meta` é exatamente `{total, page, per_page}`. Resolvido na `ApiCollection`, que toda lista estende.
- `meta.total` conta apenas o que aquele perfil pode ver.

## 6. Isolamento do relato privado

| Model | Tabela | Quem usa |
|-------|--------|----------|
| `Report` | `reports` | Só rotas sob `/patient` |
| `SharedReport` | `shared_reports` (view) | Toda rota de psicólogo e de admin, e a análise por IA |

As duas precisam do cast `encrypted` em `body`. O `ReportPrivacyTest` (RNF-08) falha se uma rota de psicólogo ou admin for criada sem ser classificada nele.

## 7. Autorização

Papel é barrado por middleware. O alcance do psicólogo aos dados de um paciente depende do vínculo (RNF-03) e é conferido nos Services. A única Policy é a `UserPolicy`, para foto de perfil e capa. A sessão por token expira por inatividade (`AUTH_INACTIVITY_MINUTES`, 30 por padrão).

## 8. Transições atômicas

Transição de vínculo e de medicação roda dentro de transação (RNF-50). O limite de 1 vínculo ativo é do banco: índice único sobre a coluna gerada `active_patient_id`; o segundo ativo vira 409.

## 9. Auditoria

Leitura de relato compartilhado, medicação e prontuário pelo psicólogo grava em `audit_logs`, inclusive a tentativa negada (`result = 'denied'`). A tabela é somente de inclusão (CA-17.3).

## 10. Pastas

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/     API do app
│   │   ├── Controllers/Web/        painel Blade
│   │   ├── Middleware/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Models/
│   ├── Policies/
│   └── Services/                   regra de negócio; Services/Ai/ fala com o Gemini
├── database/{migrations,seeders}/
├── resources/views/{admin,psychologist}/
├── routes/{api.php,api/,web.php}
├── scripts/                        preparo da demonstração e teste da hospedagem
└── tests/Feature/
```
