# Decisões

**Calmind**: Saúde Mental & Acolhimento. Revisão de 27/11/2026.

> Decisão fechada sai da primeira tabela e é registrada na segunda. A numeração não é reaproveitada.

## Abertas

| # | Decisão | Situação |
|---|---------|----------|
| DA-12 | O que o sistema faz diante de conteúdo de risco num relato | Nenhum RF cobre. É limitação a declarar na documentação final |
| DA-13 | Teto de frequência de notificação | O sigilo está resolvido (a notificação leva tipo e identificador, nunca conteúdo). O teto não foi definido |
| DA-16 | Existe versão 2026 do escopo, com pesos de nota? O rodapé do PDF diz 2024 | Perguntar ao professor |

## Fechadas

| # | Decisão | Fechada em | Onde vive |
|---|---------|-----------|-----------|
| DA-01 | **Hospedagem:** API na alwaysdata, acessada pelo repasse `https://calmind-api.vercel.app`. O notebook com ngrok (decisão de 23/11) passa a ser o plano B | 27/11, após os testes de aceite | [hospedagem](../engenharia/hospedagem-alwaysdata.md) e [ambiente da apresentação](../engenharia/ambiente-apresentacao.md) |
| DA-02 | Identificador do pacote: `com.tccsenai.calmind` | 04/11 | `app/app.json` |
| DA-03 | HTTP sem TLS foi liberado em 04/11 só para demonstração e voltou a ser bloqueado com o HTTPS (`usesCleartextTraffic: false`) | 23/11 | `app/app.json` |
| DA-04 | IA: Google Gemini, chave só no `.env` do servidor | 26/11 | [contrato, 3.8.9](../api/contrato-api.md) |
| DA-05 | Board do Scrum no Miro | 27/08 | Miro |
| DA-06 | Data na API com offset `-03:00` | 02/10 | [arquitetura](../engenharia/arquitetura-backend.md) |
| DA-07 | `meta` das listas: `{total, page, per_page}` | 02/10 | [arquitetura](../engenharia/arquitetura-backend.md) |
| DA-08 | Convite: 8 caracteres, 7 dias, uso único, revogável | 02/10 | [regras invioláveis](../engenharia/regras-inviolaveis.md) |
| DA-09 | Documento ABNT em Word (`.docx`), versionado no repositório | 23/10 | [documento final](../documento-final/README.md) |
| DA-10 | Manual do usuário: dois manuais, na reta final da Sprint 3 | 26/11 | [FinalSprint3](../../FinalSprint3.md) |
| DA-11 | Filtros do catálogo: abordagem, especialidade, modalidade e região | 23/10 | [contrato, 3.4](../api/contrato-api.md) |
| DA-15 | Apresentação final na sexta 04/12/2026 | 23/11 | [FinalSprint3](../../FinalSprint3.md) |
| DA-17 | Entrega da Sprint 1: 24/09/2026 | 24/09 | [cronograma](cronograma.md) |
