# backend

Laravel 12, Sanctum e MySQL: a API do app (`/api/v1`) e o painel web em Blade (administrador e psicólogo). É o único lugar do projeto onde mora regra de negócio.

- Subir: [setup do backend](../docs/engenharia/setup-backend.md)
- Organização do código: [arquitetura](../docs/engenharia/arquitetura-backend.md)
- Formatos e rotas: [contrato da API](../docs/api/contrato-api.md)

**A regra que não pode ser esquecida:** nenhuma rota sob `/psychologist` ou `/admin` consulta a tabela `reports`; todas leem a view `shared_reports` (RF-23, CA-23.5).
