# Codex - Mariana: app, lado do psicólogo

**Leia antes:** [00-instrucoes-gerais.md](00-instrucoes-gerais.md) (regras de git, Regra 0 sobre travessão, formato de conclusão e relatório). Este arquivo só acrescenta o que é específico do lado do psicólogo.

**Branch:** `codex/mariana-app-psicologo`. **Relatório:** `instrucoes/relatorio-mariana.md`.

## Missão

Construir no app Expo todo o lado do **psicólogo**, que hoje é uma tela vazia (`app/src/app/(psychologist)/dashboard.tsx`): cadastro profissional e perfil, lista de pacientes, convites, solicitações de vínculo, prontuário, tarefas, chat e agenda. O servidor das rotas novas está sendo escrito agora por outro Codex em outro computador e **você não vai ter acesso a ele**. Você programa contra o **contrato** (seção 3.8 de [docs/api/contrato-api.md](../docs/api/contrato-api.md)) usando um **mock** seu. Esse é o desenho, não uma limitação: ninguém espera ninguém. O Codex do Caio faz o lado do paciente em paralelo; vocês dois não compartilham arquivo.

Você é dona de `app/src/app/(psychologist)/**`, `app/src/api/psychologist/**` e `app/src/psychologist/**`. Também é a **única** frente que pode editar `app/package.json`, `app/package-lock.json` e `app/app.json`, e só para a dependência descrita no item M9.

## Antes de escrever código (15 minutos, não mais)

Dentro de `app/`: `npm ci`. Bateria da frente, que precisa ficar verde em todo commit:

```bash
npm test
npm run lint
npx tsc --noEmit
```

Leia, nesta ordem:

1. [app/README.md](../app/README.md), [docs/engenharia/setup-frontend.md](../docs/engenharia/setup-frontend.md) e [app/src/design-system/README.md](../app/src/design-system/README.md): os primitivos (`Screen`, `Text`, `Button`, `TextField`) e os tokens (`Colors`, `Radius`, `Spacing`). Botão do psicólogo usa `tone="psychologist"` (rosa). Texto sobre cor é sempre `Dark`, nunca branco ([docs/identidade-visual.md](../docs/identidade-visual.md)).
2. Como o app é montado hoje: [src/api/types.ts](../app/src/api/types.ts), [src/api/http.ts](../app/src/api/http.ts) (a função `request` está exportada para você usar; ela envia JSON), [src/api/mock.ts](../app/src/api/mock.ts) e [mock.test.ts](../app/src/api/mock.test.ts), [src/api/index.ts](../app/src/api/index.ts), [src/session/session-context.tsx](../app/src/session/session-context.tsx), [src/components/role-home.tsx](../app/src/components/role-home.tsx).
3. As rotas **já existentes** do psicólogo, no código do backend (só leitura, nunca edite `backend/`): [routes/api/psychologist.php](../backend/routes/api/psychologist.php), [bonds.php](../backend/routes/api/bonds.php), [tasks.php](../backend/routes/api/tasks.php), [reports.php](../backend/routes/api/reports.php), [PsychologistRegistrationController.php](../backend/app/Http/Controllers/Api/V1/PsychologistRegistrationController.php) (o método `profile` mostra o formato do objeto de perfil), [StorePsychologistRegistrationRequest.php](../backend/app/Http/Requests/StorePsychologistRegistrationRequest.php), [UpdatePsychologistProfileRequest.php](../backend/app/Http/Requests/UpdatePsychologistProfileRequest.php), [TaskWriteRequest.php](../backend/app/Http/Requests/TaskWriteRequest.php), [TaskResource.php](../backend/app/Http/Resources/TaskResource.php), [InvitationResource.php](../backend/app/Http/Resources/InvitationResource.php), [BondResource.php](../backend/app/Http/Resources/BondResource.php), [SharedReportResource.php](../backend/app/Http/Resources/SharedReportResource.php).
4. Telas de referência visual em [docs/prototipo/telas-pdf/](../docs/prototipo/telas-pdf/): 05 Cadastro psicólogo, 13 Início do psicólogo, 18 Cadastro com CRP, 19 Lista de pacientes, 20 Prontuário. Se não conseguir abrir PDF, siga este arquivo e a identidade visual.

## O padrão do módulo de API (igual ao do Caio, para a integração ser mecânica)

Crie `app/src/api/psychologist/` com quatro arquivos e **não toque** em `src/api/types.ts`, `http.ts`, `mock.ts` ou `index.ts`:

```
app/src/api/psychologist/types.ts   tipos do contrato + o tipo PsychologistApi (todas as chamadas do psicólogo)
app/src/api/psychologist/http.ts    createPsychologistHttp(request): implementação real, chama as rotas
app/src/api/psychologist/mock.ts    createPsychologistMock({scenario}): estado em memória, mesmo formato e mesmos códigos de erro
app/src/api/psychologist/index.ts   exporta `psychologistApi`, escolhido pela variável de ambiente
```

```ts
// app/src/api/psychologist/index.ts
import { request } from '../http.ts';
import { createPsychologistHttp } from './http.ts';
import { createPsychologistMock } from './mock.ts';

// Mesma chave que o src/api/index.ts usa: as telas nunca sabem qual implementação está ativa.
const useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export const psychologistApi = useMock ? createPsychologistMock() : createPsychologistHttp(request);
export type { PsychologistApi } from './types.ts';
```

Use `ApiError` e `FieldErrors` de `@/api` (ou `../types.ts`). O mock **lança `ApiError` com os mesmos status e mensagens** do contrato (401, 403, 404, 409, 422 com `errors`). Isso é o que prova que as telas tratam erro de verdade.

**Cenários do mock.** `createPsychologistMock({ scenario })` aceita `com-pacientes` (padrão: aprovada e publicada, vários pacientes com contadores, solicitação pendente, tarefas, mensagens, consultas, relatos compartilhados), `sem-pacientes`, `cadastro-nao-enviado` (`approval_status` igual a `not_submitted`), `cadastro-pendente` e `cadastro-recusado` (com `approval_note`). O `index.ts` lê `process.env.EXPO_PUBLIC_MOCK_SCENARIO` para escolher; os testes do mock cobrem todos.

**Para desenvolver:** `app/.env` com `EXPO_PUBLIC_USE_MOCK=true`. O login do mock usa `psicologo@calmind.test` com `senha-de-teste-123` (veja [mock.ts](../app/src/api/mock.ts)).

**Toda a lógica sem tela** (decidir o portão de cadastro, converter data e hora do formulário em ISO com offset, reconhecer o erro de conflito de agenda, montar o prontuário a partir das quatro listas, traduzir tipo de notificação em texto) vai em funções puras dentro de `app/src/psychologist/` com teste `*.test.ts` ao lado, no estilo de [load-catalog.test.ts](../app/src/catalog/load-catalog.test.ts) e [restore-session.test.ts](../app/src/session/restore-session.test.ts) (`node:test`, import com extensão `.ts`). A tela fica fina e chama a função.

## Regras de tela (definição de pronto, seção 3)

- Só componentes do design system e tokens. Zero código de cor solto.
- Alvo de toque de **44 pontos** e `accessibilityLabel` em todo controle. Estado de carregando, vazio e erro em toda tela que busca dado, com "Tentar de novo".
- Nenhuma regra de negócio na tela. O servidor decide permissão, vínculo, conflito, validade do CRP. A tela formata, envia e mostra a mensagem de erro que veio da API, campo a campo quando houver `errors`.
- Texto em português com acentuação correta. Identificadores em inglês.
- Preserve a rota `/dashboard` (entrada do psicólogo; o redirecionamento do login aponta para ela). O resto você nomeia.
- **Privacidade dos relatos (a regra mais importante do produto):** o prontuário mostra **somente** o que `GET /psychologist/patients/{id}/reports` devolve. Não exiba contagem, aviso, "relatos ocultos" ou qualquer pista de que existem relatos que você não vê. Não derive número de relato de nenhuma outra tela.

## Lista de trabalho (nesta ordem)

Cada item termina com: lógica com teste, bateria verde, varredura de travessão, commit, push, relatório atualizado.

### P1: o ciclo

**M1. Módulo de API do psicólogo.** Os quatro arquivos acima, tipos e mock para tudo que você vai usar, testes do mock (cenários, erros do contrato, idempotência). Chamadas novas (contrato 3.8): perfil, solicitações de vínculo, lista e detalhe de pacientes, mensagens, consultas, notificações. Chamadas existentes: criar e revogar convite, aceitar e recusar solicitação, listar, criar, editar e arquivar tarefa, listar relatos compartilhados de um paciente, encerrar vínculo (`POST /bonds/{id}/end`), cadastro CRP, editar e publicar perfil.

**M2. Portão de cadastro e início (tela 13).** Em `(psychologist)/_layout.tsx` e `dashboard.tsx`: consulta `GET /psychologist/profile` ao entrar e decide pelo `approval_status`:
- `approved`: mostra o início; 
- `pending`: tela "Seu cadastro está em análise" com "Atualizar";
- `rejected`: mostra a justificativa (`approval_note`) e leva ao reenvio (item M9);
- `not_submitted`: leva ao cadastro do CRP (item M9).
Se a consulta falhar, erro com tentar de novo e **não libera** a área. Faça a decisão numa função pura com teste, e cuide para **não criar laço de redirecionamento** entre telas do portão. Enquanto M9 não existir, as telas de cadastro e reenvio podem ser provisórias.
O início, aprovado, mostra: contador e atalho de solicitações pendentes, botão "Gerar convite", e a **lista de pacientes ativos** (`GET /psychologist/patients`) com o selo de cada um: mensagens não lidas, tarefas vencidas, próxima consulta (CA-35.1). Sem pacientes: aviso e botão de convite (CA-35.2). Uma seção separada, recolhida, com os vínculos encerrados (`status=ended`), somente leitura (CA-35.3). Se o perfil aprovado ainda não está publicado (`profile_published_at` nulo), aviso com atalho para o perfil.

**M3. Convite e solicitações de vínculo (RF-06, RF-08, RF-11).**
- "Gerar convite": `POST /psychologist/invitations` e exibe o código grande, **selecionável** (`selectable` no texto; não há dependência de área de transferência) e a validade. Revogar: `DELETE /psychologist/invitations/{id}`.
- Solicitações pendentes (`GET /psychologist/bond-requests`): cartão com nome do paciente e data, botões "Aceitar" e "Recusar" com confirmação. Trate o 409 (paciente já tem vínculo ativo) mostrando a mensagem da API. Depois de aceitar ou recusar, atualize a lista e a lista de pacientes.

**M4. Prontuário do paciente (RF-36, tela 20).** Rota dinâmica `(psychologist)/patients/[id].tsx` (o `id` é o `users.id` do paciente). Carregue em paralelo, tratando erro por seção: `GET /psychologist/patients/{id}`, `GET /psychologist/patients/{id}/reports`, `GET /psychologist/tasks?bond_id=`, `GET /psychologist/appointments?bond_id=`. Mostre: cabeçalho com nome, situação do vínculo e desde quando; se `is_minor`, o contato do responsável (nome, telefone, parentesco, CA-36.5); relatos compartilhados em ordem cronológica; tarefas com situação (pendente, concluída e quando); consultas. Montagem em função pura com teste. Atalhos para tarefa, chat e agenda desse paciente. **Não existe seção de medicação nem de análise** (cortadas). Vínculo encerrado: tudo somente leitura, sem botão de escrita.

**M5. Tarefas (RF-37).** Formulário no prontuário: título (até 150), descrição (opcional) e prazo digitado como `DD/MM/AAAA`, convertido para `YYYY-MM-DD` por função pura (só conversão de formato, a regra de "não pode ser no passado" é do servidor e a tela mostra o erro de `due_date` que a API devolver). Lista de tarefas do paciente, edição de tarefa pendente, e "Arquivar" com confirmação. Tarefa concluída mostra a data de conclusão e **não** oferece exclusão nem edição (CA-37.4). Trate o 403 de paciente sem aceite do termo mostrando a mensagem da API.

**M6. Chat (RF-15).** `(psychologist)/patients/[id]/chat.tsx` (ou equivalente) usa o `bond_id` do prontuário. Mesmas regras do chat do paciente: mensagens minhas e dele visualmente distintas (`mine`), falha de envio não aparece como entregue e oferece "Reenviar" (CA-15.3), *polling* a cada 5 segundos com `after_id` **só com a tela em foco** (limpe o intervalo ao sair), `POST .../read` ao abrir e ao chegar mensagem com a tela em foco, vínculo encerrado somente leitura.

**M7. Agenda (RF-40).** `(psychologist)/agenda.tsx`: lista das consultas de todos os pacientes (`GET /psychologist/appointments`), próximas primeiro, e formulário para agendar, reagendar e cancelar.
- Formulário com paciente (vínculo ativo), data `DD/MM/AAAA`, hora `HH:MM`, modalidade e observação (até 255). Função pura converte data e hora em **ISO 8601 com o offset do aparelho** (`2026-11-03T15:00:00-03:00`), com teste, inclusive para horário de verão.
- **Conflito (CA-40.3):** a API responde 422 com `errors.confirm_conflict`. Função pura reconhece esse caso e a tela mostra o aviso com "Agendar mesmo assim" e "Escolher outro horário"; confirmar reenvia a mesma requisição com `confirm_conflict: true`. Outros 422 (por exemplo data no passado em `errors.scheduled_at`) aparecem no campo.
- Cancelar com confirmação (`POST .../cancel`). Consulta `cancelled` ou `done` não oferece reagendar (a API devolveria 409).

### P2: acabamento do ciclo

**M8. Notificações (RF-16).** `(psychologist)/notifications.tsx` lista (`GET /notifications`), marca como lida ao tocar, "Marcar todas como lidas", contador na home. Mapa tipo para texto na função pura, **sem conteúdo clínico**: `message.received` "Você recebeu uma mensagem", `bond.requested` "Um paciente pediu vínculo com você". Tipo desconhecido vira texto genérico, nunca erro. Tocar leva ao recurso (mensagem para o chat do paciente, vínculo para as solicitações).

**M9. Cadastro com CRP e perfil (RF-33, RF-34, telas 05 e 18).** Este é o único item com **dependência nova**: `expo-document-picker`. Já conferido: está em `bundledNativeModules` do Expo SDK 57 como `~57.0.3` e no registro do npm (tag `sdk-57`). Instale com `npx expo install expo-document-picker` dentro de `app/` (isso escolhe a versão compatível) e confira que só `package.json` e `package-lock.json` mudaram. Se a documentação do pacote exigir configuração em `app.json`, faça só o mínimo. Não instale mais nada.
- Formulário de CRP: região (as 24, de `01` a `24`), número (4 a 7 dígitos) e documento (PDF, JPG ou PNG de até 5 MB). Envio `POST /psychologist/registration` em **multipart**, que a função `request` não faz (ela manda JSON). Escreva a chamada em `api/psychologist/` com `fetch` e `FormData`, sem cabeçalho `Content-Type` (o `fetch` define o boundary), com `Accept` e `Authorization` iguais aos de `request`, e o mesmo tratamento de erro em `ApiError`. Parte do arquivo: `{ uri, name, type }` no celular; na web, use o `File` que o seletor devolve em `asset.file`. Mostre os erros de campo da API (`crp_region`, `crp_number`, `document`).
- Edição de perfil (`PUT /psychologist/profile`: abordagem, especialidade, modalidade, região, bio de até 3000) e "Publicar no catálogo" (`POST /psychologist/profile/publish`), com o erro de publicação mostrado como vem da API. O texto do perfil é escrito pelo profissional, nunca gerado. **Sem preço, nota ou ranking em lugar nenhum.**

**M10. Consentimento do psicólogo (RF-03, tela 06).** Mesmo desenho do portão do paciente: `GET /consent-terms/current?type=general`; se `accepted` for `false`, tela com o termo, "Li e aceito" e "Não aceito" (esta só oferece sair da conta). Implemente as duas chamadas no **seu** módulo (o Caio faz as dele no módulo dele; a duplicação é intencional e a integração unifica). O portão do consentimento vem **antes** do portão de cadastro.

### P3: se sobrar tempo

**M11. Consentimento do responsável legal (RF-49, CA-49.4, CA-49.5).** Para paciente com `is_minor`, seção no prontuário para registrar (`POST /psychologist/patients/{id}/guardian-consent`) e listar os registros. Só acrescenta, nunca edita. A rota é a última prioridade no backend; construa contra o contrato e o mock.
**M12. Encerrar vínculo (RF-13)** com confirmação.
**M13. Revisão de acessibilidade** das telas novas: ordem de foco, rótulos, contraste (texto escuro sobre cor) e alvo de 44 pontos, com a lista do que foi conferido no relatório.

## Fora do escopo desta frente

Medicação, IA, push, tela do paciente, qualquer arquivo em `backend/`. Bug que você achar em código de outra frente ou intocável: anote em "Dependências abertas" do relatório, não corrija. O arquivo `src/components/role-home.tsx` deixa de ser usado por você, mas **não o apague** (a integração decide).

## Pronto

M1 a M7 feitos e verdes (P1), M8 a M10 (P2). No final: `npm test`, `npm run lint` e `npx tsc --noEmit` com a saída colada no relatório, varredura de travessão limpa, relatório em dia, `git push`. Escreva com precisão: "funciona contra o mock que segue o contrato", nunca "funciona com a API". Liste no relatório cada chamada que o app faz e que **só** foi exercitada contra o mock.

## Prompt de partida (cole no Codex)

> Você é o Codex da Mariana no projeto Calmind (repositório já clonado). Faça `git fetch origin` e `git checkout -b codex/mariana-app-psicologo origin/integracao/fechamento-30-10`. Leia `instrucoes/00-instrucoes-gerais.md` e depois `instrucoes/codex-mariana-app-psicologo.md`, e execute a lista de trabalho na ordem, sem esperar nenhuma outra frente (o servidor das rotas novas não existe para você: use o mock), com commit e push a cada item e o relatório sempre em dia. Siga a Regra 0 (nenhum travessão) e rode a varredura antes de cada commit.
