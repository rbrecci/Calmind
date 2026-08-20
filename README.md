# Calmind — Saúde Mental & Acolhimento

**Trabalho de Conclusão de Curso · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo · 2026**

Aplicativo mobile que atua no intervalo entre uma sessão de terapia e a seguinte.

> **Nome e slogan fechados:** Calmind, com o slogan **Saúde Mental & Acolhimento**. Vale para o APK, a landing page, a capa do documento final e os slides. Segue em aberto apenas o identificador do pacote do aplicativo, no formato `com.<grupo>.calmind`. Ver `docs/planejamento/arranque-react-native.md`.

---

## O problema

Pesquisa de campo com três entrevistadas sem relação entre si, duas psicólogas e uma paciente. As dores relatadas convergiram de forma independente:

- comunicação fragmentada entre as sessões;
- agendamento manual, sujeito a esquecimento;
- baixa adesão às tarefas prescritas;
- tempo de sessão gasto em recapitulação em vez de trabalho clínico;
- ausência de ferramentas de apoio para os dois lados.

**A hipótese central:** a qualidade do tratamento depende tanto do que acontece na sessão quanto do que acontece entre as sessões, e é justamente esse intervalo que não tem ferramenta nenhuma. O produto ataca o intervalo, não a sessão.

## O que a plataforma faz

Um aplicativo, dois lados. O paciente registra relatos livres ao longo da semana, cumpre as tarefas atribuídas, conversa por chat assíncrono, acompanha a agenda e recebe lembrete de adesão à medicação. O psicólogo atribui tarefas, acompanha o prontuário consolidado, agenda consultas e, antes da próxima sessão, solicita um resumo dos relatos compartilhados gerado por IA.

A entrada acontece por dois caminhos: quem já tem psicólogo entra por um código de convite; quem não tem procura no catálogo de profissionais e solicita o vínculo.

## Os quatro compromissos que o produto não quebra

Estes não são detalhes de implementação. São o que define o produto, e cada um tem requisito verificável associado.

1. **A IA nunca age sozinha.** A análise só roda quando o profissional pede, e nada é gravado no prontuário sem a confirmação dele.
2. **O relato privado não sai do escopo do paciente.** Nem o conteúdo, nem a existência, nem a contagem. A garantia vive na camada de dados, não na interface.
3. **A plataforma não prescreve.** O psicólogo registra medicação já prescrita por médico, com origem obrigatória, e o paciente confirma antes de qualquer lembrete valer.
4. **A escolha de tratamento não vira ranking comercial.** Sem nota, sem estrela, sem preço e sem ordenação por reputação, conforme as restrições de divulgação do Conselho Federal de Psicologia.

---

## Entregáveis da regulamentação e onde estão

| Exigência | Sprint | Onde | Estado |
|-----------|--------|------|--------|
| Requisitos funcionais e não funcionais | 1 | [`docs/documento-requisitos.md`](docs/documento-requisitos.md) | Pronto, 48 RF e 68 RNF |
| Diagramas de modelagem (MER, DER e outros) | 1 | [`docs/diagramas/`](docs/diagramas/) | Pronto |
| Prototipação da interface | 1 | [`docs/prototipo/wireframes.html`](docs/prototipo/wireframes.html) | Pronto, 16 telas |
| Coleta e análise dos requisitos | 1 | `docs/pesquisa/` | Pendente |
| Backend e frontend, primeiras funcionalidades | 2 | ainda não iniciado | Pendente |
| Primeiros testes | 2 | [`docs/api/`](docs/api/) | Contrato e coleção de testes prontos |
| Sistema completo | 3 | ainda não iniciado | Pendente |
| Documentação técnica final em ABNT | 3 | ainda não iniciado | Pendente |
| Manual do usuário | 3 | ainda não iniciado | Pendente |
| Relatório de testes | 3 | ainda não iniciado | Pendente |

## Como abrir cada artefato

**Wireframes.** Abra `docs/prototipo/wireframes.html` em qualquer navegador. Não precisa de servidor nem de ferramenta de design.

**Modelo de dados.** O MER e os diagramas de estado estão em `docs/diagramas/modelo-de-dados.md` e renderizam direto nesta página do GitHub. O DER é executável:

```bash
mysql -u root -e "CREATE DATABASE tcc_schema_test"
mysql -u root tcc_schema_test < docs/diagramas/schema.sql
mysql -u root --force --table tcc_schema_test < docs/diagramas/testes-do-modelo.sql
```

As quatro provas verificam que o banco, e não o código da aplicação, garante o vínculo ativo único por paciente e o isolamento do relato privado.

**Contrato da API.** Importe `docs/api/TCC-SENAI.postman_collection.json` no Postman e rode pelo Runner. São 42 requisições com 104 asserções. Enquanto o backend não existir, tudo fica vermelho: cada endpoint entregue acende um verde, e a coleção serve de critério de pronto da Sprint 2.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Aplicativo | React Native |
| Backend | Laravel, PHP |
| Banco de dados | MySQL |
| Painel do administrador | Blade e Bootstrap, sobre o mesmo backend |
| Divulgação | Landing page |

O aplicativo mobile e o painel web compartilham backend, banco, autenticação e contrato de API. Regra de negócio vive apenas no servidor, nunca duplicada nos clientes.

Identificadores de código, tabela, coluna e campo de API em inglês. Texto voltado ao usuário em português.

## Equipe

| Pessoa | Papel |
|--------|-------|
| Rafael Brecci | Product Owner e desenvolvimento backend |
| Caio Yuri | Scrum Master e desenvolvimento do aplicativo |
| Eduardo Zanetti | Desenvolvimento backend |
| Mariana Chaves | Desenvolvimento, apoio às duas frentes |
| Nicoly Ribeiro | Documentação e apresentação |
| Isabela Puzenato | Documentação e apresentação |

## Estrutura do repositório

```
docs/
├── documento-base-sprint1.md    visão do produto e as 15 decisões de produto
├── documento-requisitos.md      48 RF e 68 RNF, priorizados por MoSCoW
├── diagramas/                   MER, DER executável e provas do modelo
├── prototipo/                   wireframes das 16 telas
├── api/                         contrato e coleção de testes do Postman
├── pesquisa/                    roteiro, sínteses e personas
└── planejamento/                cronograma, decisões e comparativo de rotas
```

O código do backend, do aplicativo e do painel entra na raiz a partir da Sprint 2.

## Cronograma

| Sprint | Período | Foco |
|--------|---------|------|
| 1 | até 21/08/2026 | Requisitos, modelagem e protótipo |
| 2 | 24/08 a 02/10/2026 | Backend, aplicativo e primeiros testes |
| 3 | 05/10 a 13/11/2026 | Sistema completo, testes, documentação final e apresentação |

Detalhamento semana a semana em `docs/planejamento/cronograma.md`.

---

## Sobre os dados

Este é um projeto acadêmico e **opera exclusivamente com dados fictícios**. Nenhum dado de paciente real é coletado, armazenado ou processado em qualquer ambiente do projeto.

O modelo proposto não conta com psicólogo Responsável Técnico registrado no conselho regional, limitação declarada abertamente na seção de limitações conhecidas do documento de requisitos. Em uso real, seria pré-requisito de operação.
