# backend

**Laravel + MySQL.** É o único lugar do projeto onde mora regra de negócio.

O Laravel entra aqui na semana 1 da Sprint 2 (24/08). Até lá esta pasta tem só este arquivo.

## Esta pasta tem duas caras, e é de propósito

| Cara | Rotas | Entrega | Quem consome |
|------|-------|---------|--------------|
| **API JSON** | `routes/api.php`, prefixo `/api/v1` | JSON | O app React Native |
| **Painel do administrador** | `routes/web.php` | HTML, Blade + Bootstrap | O navegador do admin |

As duas compartilham Models, banco, autenticação e regra de negócio. Muda só a camada de cima.

**Por isso não existe pasta `painel/` no repositório.** O painel não é um projeto separado: são views Blade dentro deste Laravel, atendendo RF-44, RF-45 e RF-46. Criar pasta separada para ele significaria duplicar Model e regra, que é exatamente o que o RNF-57 proíbe.

## Antes de escrever o primeiro endpoint

Leia [`../docs/api/contrato-api.md`](../docs/api/contrato-api.md). Ele já fixa formato de erro, de data, de lista e como o token viaja — e a coleção do Postman testa isso. Duas divergências entre o contrato e o padrão do Laravel estão registradas como DA-06 e DA-07 em [`../docs/planejamento/decisoes-abertas.md`](../docs/planejamento/decisoes-abertas.md) e precisam ser resolvidas antes, não depois.

## A regra que não pode ser esquecida

Nenhuma rota sob `/psychologist` ou `/admin` consulta a tabela `reports`. Todas leem a view `shared_reports`, definida em [`../docs/diagramas/schema.sql`](../docs/diagramas/schema.sql). É o que garante o RF-23 e o CA-23.5, e é item de revisão de código, não de boa vontade.
