# backend

**Laravel + MySQL.** É o único lugar do projeto onde mora regra de negócio.

A fundação (etapa B0) está pronta: projeto Laravel 12, Sanctum, as 25 migrations e a view `shared_reports`, Model base, `ApiCollection`, handler de erro, um arquivo de rota por bloco e a massa fictícia. Para subir do zero, siga [`../docs/engenharia/setup-backend.md`](../docs/engenharia/setup-backend.md).

## Esta pasta tem duas caras, e é de propósito

| Cara | Rotas | Entrega | Quem consome |
|------|-------|---------|--------------|
| **API JSON** | `routes/api.php`, prefixo `/api/v1` | JSON | O app React Native |
| **Painel do administrador** | `routes/web.php` | HTML, Blade + Bootstrap | O navegador do admin |

As duas compartilham Models, banco, autenticação e regra de negócio. Muda só a camada de cima.

**Por isso não existe pasta `painel/` no repositório.** O painel não é um projeto separado: são views Blade dentro deste Laravel, atendendo RF-44, RF-45 e RF-46. Criar pasta separada para ele significaria duplicar Model e regra, que é exatamente o que o RNF-57 proíbe.

## Antes de escrever o primeiro endpoint

Leia [`../docs/api/contrato-api.md`](../docs/api/contrato-api.md). Ele já fixa formato de erro, de data, de lista e como o token viaja, e a coleção do Postman testa isso. As duas divergências entre o contrato e o padrão do Laravel (DA-06, data com offset, e DA-07, `meta` da lista) já estão resolvidas na fundação: `SerializesContractDates` cuida da data, `ApiCollection` do `meta` e `ApiErrorRenderer` do formato de erro. Estenda essas classes, não reescreva.

## A regra que não pode ser esquecida

Nenhuma rota sob `/psychologist` ou `/admin` consulta a tabela `reports`. Todas leem a view `shared_reports`, definida em [`../docs/diagramas/schema.sql`](../docs/diagramas/schema.sql). É o que garante o RF-23 e o CA-23.5, e é item de revisão de código, não de boa vontade.
