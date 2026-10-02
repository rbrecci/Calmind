# Engenharia

**Como este projeto é construído.** Setup, arquitetura, convenções e divisão de trabalho da
Sprint 2.

Esta pasta existe por um motivo específico: **quatro pessoas codificam ao mesmo tempo, as quatro
com apoio de ferramenta de IA.** Isso multiplica a velocidade e multiplica junto o risco de
quatro padrões diferentes aparecerem na mesma semana — quatro formatos de erro, quatro jeitos de
paginar, quatro estilos de Controller. Código que sai rápido e desalinhado custa mais caro do que
código que sai devagar.

Os arquivos abaixo são a resposta. Eles são documentação de projeto normal, legível por qualquer
pessoa, e servem de insumo direto para a seção de arquitetura e codificação do documento ABNT.

---

## Ordem de leitura

| # | Arquivo | Para quem | Quando ler |
|---|---------|-----------|------------|
| 1 | [`regras-inviolaveis.md`](regras-inviolaveis.md) | Todos | **Antes de escrever a primeira linha.** É o arquivo que você cola no contexto da ferramenta de IA antes de pedir código |
| 2 | [`divisao-de-trabalho.md`](divisao-de-trabalho.md) | Todos | Antes de abrir o editor, para saber de quais arquivos você é dono |
| 3 | [`definicao-de-pronto.md`](definicao-de-pronto.md) | Todos | Antes de dizer que acabou |
| 4 | [`convencoes-de-codigo.md`](convencoes-de-codigo.md) | Quem codifica | Na primeira etapa |
| 5 | [`setup-backend.md`](setup-backend.md) | Rafael, Zanetti | Primeiro dia |
| 6 | [`arquitetura-backend.md`](arquitetura-backend.md) | Rafael, Zanetti | Primeiro dia |
| 7 | [`setup-frontend.md`](setup-frontend.md) | Caio | Primeiro dia |

O plano de execução não está aqui: está em
[`../planejamento/etapas-sprint2.md`](../planejamento/etapas-sprint2.md), com as etapas na ordem,
o dono de cada uma e o log de conclusão.

Commit, branch e Pull Request estão em [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) e não são
repetidos aqui.

---

## Como usar isto com ferramenta de IA

Não é complicado, são três hábitos:

1. **Cole o `regras-inviolaveis.md` no contexto** antes de pedir código do seu bloco. É curto de
   propósito, justamente para caber nessa colagem sem ocupar o contexto todo.
2. **Peça código do seu bloco, não do bloco do outro.** Assistente não sabe que o arquivo de
   rota do consentimento é do Zanetti; você sabe.
3. **Leia o que voltou antes de commitar.** Código que você não entende é código que você não
   consegue defender na banca, e a banca pergunta.

O que a IA gera entra no repositório como código do grupo, sem marca de ferramenta — mesma regra
que vale para qualquer biblioteca ou snippet de terceiro que o projeto usa.

---

## Decisões que esta pasta assume como fechadas

As seis que travavam a sprint, fechadas em 02/10/2026:

| Decisão | Valor | Onde está detalhada |
|---------|-------|---------------------|
| **DA-06** formato de data | O contrato manda: offset `-03:00` | [`arquitetura-backend.md`](arquitetura-backend.md#5-a-model-base-e-o-formato-de-data) |
| **DA-07** formato do `meta` | O contrato manda: `{total, page, per_page}` | [`arquitetura-backend.md`](arquitetura-backend.md#6-pagina%C3%A7%C3%A3o-e-o-formato-do-meta) |
| **DA-08** prazo do convite | 7 dias, 8 caracteres, revogável | [`regras-inviolaveis.md`](regras-inviolaveis.md) item 17 |
| **RNF-02** cifra em repouso | Entra já nas migrations, cast `encrypted` | [`regras-inviolaveis.md`](regras-inviolaveis.md) item 10 |
| Banco local | XAMPP, dois ambientes, senha fora do repositório | [`setup-backend.md`](setup-backend.md#2-os-dois-ambientes) |
| Frontend começa em mock | Módulo único de API com chave liga/desliga | [`setup-frontend.md`](setup-frontend.md#4-a-camada-de-mock) |
| **FE-01** Expo ou CLI | **Expo** (SDK 57, TypeScript, expo-router), fechada em 02/10/2026 | [`setup-frontend.md`](setup-frontend.md#2-a-decis%C3%A3o-fe-01-que-%C3%A9-a-primeira-desta-frente) |

## Decisões que continuam abertas

Não estão esquecidas, estão esperando a etapa que precisa delas:

| # | Decisão | Espera por |
|---|---------|------------|
| **DA-01** | Onde o app encontra o backend: IP da LAN, túnel ou emulador | A etapa de primeira conexão |
| **DA-02** | Identificador do pacote, `com.<grupo>.calmind` | O primeiro APK |
| **DA-03** | Liberar tráfego sem TLS no build de desenvolvimento | O primeiro APK |
| **DA-04** | Provedor e modelo de IA, e onde a chave fica | Sprint 3 |

Quando uma fechar, ela sai desta tabela e entra no arquivo que ela afeta. Decisão fechada que
continua listada como aberta é ruído — mesma regra do
[`../planejamento/decisoes-abertas.md`](../planejamento/decisoes-abertas.md).
