# Codex - Caio: app, lado do paciente

**Leia antes:** [00-instrucoes-gerais.md](00-instrucoes-gerais.md) (regras de git, Regra 0 sobre travessão, formato de conclusão e relatório). Este arquivo só acrescenta o que é específico do lado do paciente.

**Branch:** `codex/caio-app-paciente`. **Relatório:** `instrucoes/relatorio-caio.md`.

## Missão

Construir no app Expo todas as telas do **paciente** do ciclo: consentimento, vínculo (por convite e por catálogo), relatos, tarefas, chat, agenda e notificações. O servidor das rotas novas está sendo escrito agora por outro Codex em outro computador e **você não vai ter acesso a ele**. Você programa contra o **contrato** (seção 3.8 de [docs/api/contrato-api.md](../docs/api/contrato-api.md)) usando um **mock** seu. Esse é o desenho, não uma limitação: ninguém espera ninguém.

Você é dono de `app/src/app/(patient)/**`, `app/src/api/patient/**`, `app/src/patient/**` e `app/src/catalog/**`. A pasta do psicólogo é da Mariana, e as pastas intocáveis estão na seção 4 das instruções gerais.

## Antes de escrever código (15 minutos, não mais)

Dentro de `app/`: `npm ci`. Bateria da frente, que precisa ficar verde em todo commit:

```bash
npm test
npm run lint
npx tsc --noEmit
```

Leia, nesta ordem:

1. [app/README.md](../app/README.md), [docs/engenharia/setup-frontend.md](../docs/engenharia/setup-frontend.md) e [app/src/design-system/README.md](../app/src/design-system/README.md): os primitivos de tela (`Screen`, `Text`, `Button`, `TextField`) e os tokens (`Colors`, `Radius`, `Spacing`). Botão do paciente usa `tone="patient"` (verde). Texto sobre cor é sempre `Dark`, nunca branco ([docs/identidade-visual.md](../docs/identidade-visual.md)).
2. Como o app é montado hoje: [src/api/types.ts](../app/src/api/types.ts), [src/api/http.ts](../app/src/api/http.ts) (a função `request` está exportada para você usar), [src/api/mock.ts](../app/src/api/mock.ts) e [mock.test.ts](../app/src/api/mock.test.ts), [src/api/index.ts](../app/src/api/index.ts), [src/session/session-context.tsx](../app/src/session/session-context.tsx).
3. As telas atuais do paciente, que você vai reorganizar sem perder o comportamento: `app/src/app/(patient)/home.tsx` (tarefas), `catalog.tsx`, `_layout.tsx`, e [src/catalog/load-catalog.ts](../app/src/catalog/load-catalog.ts) com seu teste.
4. As rotas **já existentes** que você vai consumir. Leia o código do backend para ver o formato exato: [PatientReportController.php](../backend/app/Http/Controllers/Api/V1/PatientReportController.php), [StoreReportRequest.php](../backend/app/Http/Requests/StoreReportRequest.php), [UpdateReportVisibilityRequest.php](../backend/app/Http/Requests/UpdateReportVisibilityRequest.php), [ReportResource.php](../backend/app/Http/Resources/ReportResource.php), [BondResource.php](../backend/app/Http/Resources/BondResource.php), [RedeemInvitationRequest.php](../backend/app/Http/Requests/RedeemInvitationRequest.php), [RequestBondRequest.php](../backend/app/Http/Requests/RequestBondRequest.php), [routes/api/](../backend/routes/api/). Só leitura: nunca edite `backend/`.
5. As telas de referência visual em [docs/prototipo/telas-pdf/](../docs/prototipo/telas-pdf/): 06 Consentimento, 07 Como você chegou aqui, 08 Código de convite, 09 Catálogo, 10 Perfil e vínculo, 12 Início do paciente, 14 Novo relato, 15 Tarefas, 16 Conversa, 17 Agenda. Se não conseguir abrir PDF, siga as instruções deste arquivo e a identidade visual.

## O padrão do módulo de API (igual ao da Mariana, para a integração ser mecânica)

Crie `app/src/api/patient/` com quatro arquivos e **não toque** em `src/api/types.ts`, `http.ts`, `mock.ts` ou `index.ts`:

```
app/src/api/patient/types.ts   tipos do contrato + o tipo PatientApi (todas as chamadas do paciente)
app/src/api/patient/http.ts    createPatientHttp(request): implementação real, chama as rotas
app/src/api/patient/mock.ts    createPatientMock({scenario}): estado em memória, mesmo formato e mesmos códigos de erro
app/src/api/patient/index.ts   exporta `patientApi`, escolhido pela variável de ambiente
```

```ts
// app/src/api/patient/index.ts
import { request } from '../http.ts';
import { createPatientHttp } from './http.ts';
import { createPatientMock } from './mock.ts';

// Mesma chave que o src/api/index.ts usa: as telas nunca sabem qual implementação está ativa.
const useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export const patientApi = useMock ? createPatientMock() : createPatientHttp(request);
export type { PatientApi } from './types.ts';
```

Use `ApiError` e `FieldErrors` de `@/api` (ou `../types.ts`). O mock **lança `ApiError` com os mesmos status e mensagens** do contrato (401, 403, 404, 409, 422 com `errors`). Isso é o que prova que as telas tratam erro de verdade.

**Cenários do mock.** `createPatientMock({ scenario })` aceita `com-vinculo` (padrão: vínculo ativo, relatos, tarefas, mensagens, consultas, notificações), `sem-vinculo` (paciente novo) e `vinculo-pendente` (solicitação enviada). Para trocar sem editar código, o `index.ts` lê `process.env.EXPO_PUBLIC_MOCK_SCENARIO`. Os testes do mock cobrem os três.

**Para desenvolver:** `app/.env` com `EXPO_PUBLIC_USE_MOCK=true`. O login do mock usa as contas de [mock.ts](../app/src/api/mock.ts) (por exemplo `paciente@calmind.test` e `senha-de-teste-123`).

**Todo o resto da lógica sem tela** (decidir se mostra o consentimento, montar a lista de conversa, agrupar consultas por dia, traduzir tipo de notificação em texto) vai em funções puras dentro de `app/src/patient/` com teste `*.test.ts` ao lado, no estilo de [load-catalog.test.ts](../app/src/catalog/load-catalog.test.ts) e [restore-session.test.ts](../app/src/session/restore-session.test.ts) (`node:test`, import com extensão `.ts`). A tela fica fina e chama a função.

## Regras de tela (definição de pronto, seção 3)

- Só componentes do design system e tokens. Zero código de cor solto.
- Alvo de toque de **44 pontos** e `accessibilityLabel` em todo controle. Estado de carregando, vazio e erro em toda tela que busca dado, com "Tentar de novo".
- Nenhuma regra de negócio na tela: o servidor decide permissão, vínculo, conflito. A tela mostra o resultado e a mensagem de erro que veio da API.
- Texto em português com acentuação correta. Identificadores em inglês.
- Preserve as rotas `/home` (entrada do paciente, o redirecionamento do login aponta para ela) e `/catalog`. Todo o resto você nomeia.

## Lista de trabalho (nesta ordem)

Cada item termina com: lógica com teste, bateria verde, varredura de travessão, commit, push, relatório atualizado.

### P1: o ciclo

**C1. Módulo de API do paciente.** Os quatro arquivos acima, tipos para tudo que você vai usar, e testes do mock (cenários, erros do contrato, idempotência de `read` e de aceite). Tipos do contrato novo: termo de consentimento, aceite, vínculo do paciente (`GET /patient/bonds`), mensagem, consulta, notificação. Chamadas das rotas existentes: resgatar convite, solicitar vínculo, listar e criar relato, mudar visibilidade, despublicar, encerrar vínculo (`POST /bonds/{id}/end`), tarefas (reaproveite o que `src/api` já faz para tarefas, sem editá-lo: chame `request` de novo no seu módulo).

**C2. Consentimento (RF-03, CA-03.1 a CA-03.3, tela 06).** Tela `(patient)/consent.tsx` e o **portão** em `(patient)/_layout.tsx`: ao entrar na área do paciente, consulta `GET /consent-terms/current?type=general`; se `accepted` for `false`, redireciona para `/consent`; enquanto carrega mostra estado de carregando (nunca pisca a home); se a consulta falhar mostra erro com tentar de novo e **não libera** a área. A tela mostra versão e texto do termo e dois botões: "Li e aceito" (chama o aceite e libera) e "Não aceito" (CA-03.2: bloqueia as funções clínicas e oferece apenas **sair da conta**, via `useSession().signOut`). Função pura `decideConsentGate` com teste.

**C3. Vínculo (RF-07, RF-09, RF-10, telas 07, 08, 09, 10).** `/home` passa a olhar `GET /patient/bonds`:
- sem vínculo ativo nem pendente: tela "Como você chegou aqui" com "Tenho um código de convite" (tela de código: 8 caracteres, envia `code`, trata 404, 409 e o limite de tentativas da API mostrando a mensagem recebida) e "Quero encontrar um profissional" (catálogo);
- com solicitação pendente: aviso "Aguardando resposta do profissional";
- com vínculo ativo: cartão do psicólogo (nome, CRP) e atalhos para relato, tarefas, conversa e agenda;
- vínculo encerrado: somente leitura, com o aviso (CA-14).
No catálogo, cada cartão ganha um botão "Solicitar vínculo" (envia `psychologist_id`), com confirmação e tratamento do 409 (já tem vínculo ativo). **Sem preço, nota, estrela ou ordenação por reputação**; a ordem é a que a API devolve.

**C4. Relato (RF-22, RF-24, RNF-37, tela 14).** Tela de novo relato com o **seletor Compartilhado ou Privado acima do campo de texto, visível sem rolagem, já marcado em Compartilhado**, com fundo colorido e texto escuro (não só uma borda). Lista "Meus relatos" com o rótulo de visibilidade de cada um. Ação "Despublicar" (usa o campo `used_in_analysis` para avisar antes de confirmar; ele virá `false` hoje). Mudar visibilidade pelo `PATCH`. Nunca peça ao servidor nada além do que o contrato do paciente devolve.

**C5. Tarefas (RF-25, tela 15).** Mova o que está hoje em `home.tsx` para `(patient)/tasks.tsx`, mantendo o comportamento atual (listar, concluir, atualizar). Pendentes primeiro, concluídas depois, prazo formatado `DD/MM/AAAA`.

**C6. Chat (RF-15, tela 16).** `(patient)/chat.tsx` usa o `bond_id` do vínculo ativo. Histórico em ordem, mensagens minhas e do psicólogo visualmente distintas (use `mine`). Envio com tratamento de falha (CA-15.3): se falhar, a mensagem **não** aparece como entregue e há "Reenviar". *Polling* a cada 5 segundos com `after_id`, **só enquanto a tela está em foco** (limpe o intervalo ao sair, sem vazamento). Ao abrir e ao chegar mensagem nova com a tela em foco, chame `POST .../read`. Vínculo encerrado: só leitura. Sem websocket.

**C7. Agenda (RF-26, tela 17).** `(patient)/agenda.tsx` com **lista** de consultas (próximas primeiro, depois passadas), cada uma com data, hora, modalidade e situação (`scheduled` como "Agendada", `rescheduled` como "Reagendada", `cancelled` como "Cancelada", `done` como "Realizada"). O paciente **não** cria, altera nem cancela (CA-26.3): nenhum botão de escrita. Função pura que agrupa por dia e separa futuras de passadas, com teste. Hora exibida no fuso do aparelho a partir do ISO com offset.

### P2: acabamento do ciclo

**C8. Notificações (RF-16, CA-16.3).** `(patient)/notifications.tsx` lista as notificações (`GET /notifications`), marca como lida ao tocar e "Marcar todas como lidas". Contador de não lidas visível na home. Mapa tipo para texto em português na função pura, **sem conteúdo clínico**: `message.received` "Você recebeu uma mensagem", `task.assigned` "Você tem uma nova tarefa", `appointment.scheduled` "Uma consulta foi agendada", `appointment.rescheduled` "Uma consulta foi reagendada", `appointment.cancelled` "Uma consulta foi cancelada", `bond.accepted` "Seu pedido de vínculo foi aceito", `bond.rejected` "Seu pedido de vínculo não foi aceito". Tipo desconhecido vira texto genérico, nunca erro. Tocar leva para a tela do recurso (mensagem para o chat, tarefa para as tarefas, consulta para a agenda, vínculo para a home).

**C9. Navegação.** Dê ao paciente uma navegação clara entre Início, Relatos, Tarefas, Conversa e Agenda (abas ou um menu na home, a decisão é sua; justifique em uma linha no relatório). Não altere o `_layout.tsx` raiz nem o `(auth)`.

### P3: se sobrar tempo

**C10. Encerrar vínculo (RF-13).** Botão com confirmação em `POST /bonds/{id}/end`, tratando o resultado e voltando ao estado "sem vínculo".
**C11. Visão de calendário da agenda** (grade do mês) além da lista, sem dependência nova.
**C12. Revisão de acessibilidade** das telas novas: ordem de foco, rótulos, contraste (texto escuro sobre cor) e alvo de 44 pontos, com uma lista no relatório do que foi conferido.

## Fora do escopo desta frente

Medicação, IA, push, tela do psicólogo, qualquer arquivo em `backend/`. Bug que você achar em código de outra frente ou intocável: anote em "Dependências abertas" do relatório, não corrija.

## Pronto

C1 a C7 feitos e verdes (P1), C8 e C9 (P2). No final: `npm test`, `npm run lint` e `npx tsc --noEmit` com a saída colada no relatório, varredura de travessão limpa, relatório em dia, `git push`. Escreva com precisão: "funciona contra o mock que segue o contrato", nunca "funciona com a API". Liste no relatório cada chamada que o app faz e que **só** foi exercitada contra o mock.

## Prompt de partida (cole no Codex)

> Você é o Codex do Caio no projeto Calmind (repositório já clonado). Faça `git fetch origin` e `git checkout -b codex/caio-app-paciente origin/integracao/fechamento-30-10`. Leia `instrucoes/00-instrucoes-gerais.md` e depois `instrucoes/codex-caio-app-paciente.md`, e execute a lista de trabalho na ordem, sem esperar nenhuma outra frente (o servidor das rotas novas não existe para você: use o mock), com commit e push a cada item e o relatório sempre em dia. Siga a Regra 0 (nenhum travessão) e rode a varredura antes de cada commit.
