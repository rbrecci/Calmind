# Calmind: fechamento da Sprint 3

Estado em 27/11/2026. **Apresentação: sexta 04/12/2026.** Código congela na segunda 30/11 à noite.

## Resumo

A API publicada na alwaysdata foi atualizada em 27/11 com os ajustes do app (PR #26) e recebeu a massa grande de teste. O app foi testado no celular contra ela, e o teste levantou mudanças que ainda serão feitas. Faltam essas mudanças, a limpeza do banco, o APK da banca e a documentação.

## Entregáveis

| Entregável | Estado | O que falta |
|---|---|---|
| Sistema completo | Backend completo nos requisitos Must; app sem algumas telas | Mudanças do teste de 27/11, limpar o banco e gerar o APK da banca |
| Relatório de testes | Só [evidências soltas](../testes/README.md) | Juntar em um relatório |
| Documento ABNT | Parado em 23/10 | Atualizar com o estado atual |
| Manual do usuário | Não começou | Escrever os dois manuais |
| Apresentação | Não começou | Slides e dois ensaios |

## O sistema hoje

**No app (API real):** login, cadastro, aprovação de psicólogo, catálogo, convite, vínculo, consentimento geral, relatos por mês com calendário e humor do dia, tarefas, chat, agenda, notificações dentro do app, perfil com foto e banner, tela de conta, telas sem vínculo, carregamento em esqueleto, tempo de vínculo do paciente e quantidade de vínculos do psicólogo.

**Pronto na API e sem tela no app (Caio):** medicação, consentimento de IA, análise por IA e prontuário consolidado. O que o app precisa fazer está nas seções 3.8.8 a 3.8.10 do [contrato](../api/contrato-api.md). A auditoria de leitura não tem tela.

**Fica como evolução futura:** push, preferências de notificação, chat em tempo real, denúncias (RF-18, RF-45), nova versão de termo pelo administrador (RF-46), aceite do contrato de serviço (RF-48), exportação dos dados (RF-31) e política de retenção (RF-47). Também ficou de fora do app a "sequência de dias" do protótipo.

**Testes automatizados (27/11):** 350 no backend e 294 no app, todos passando. Coleção do Postman: [375 asserções, 0 falhas](../testes/2026-11-27-newman-ajustes-app.txt). Roteiro do [RNF-61](../testes/2026-11-04-roteiro-rnf-61.md): 18 de 18 em 04/11, antes dos redesenhos.

**Nunca testado:** iPhone, upload de documento do cadastro pelo celular, escolha e recorte de foto e banner no celular e o roteiro do RNF-61 depois dos redesenhos.

**Pendências conhecidas, sem bloquear a demonstração:**
- Em 27/11 o app caiu com `Maximum update depth exceeded` nas abas do psicólogo. A causa provável foi corrigida (o layout desmontava a navegação a cada atualização do acesso), mas a queda **não foi reproduzida**: se voltar, ligue o celular no cabo e leia `adb shell dumpsys dropbox --print data_app_crash`.
- No prontuário as consultas aparecem da mais antiga para a mais nova, e a próxima fica no fim.
- O servidor tem a massa grande, com contas na senha do seed do repositório. **Limpe o banco antes da apresentação** ([hospedagem](../engenharia/hospedagem-alwaysdata.md#1-atualizar-o-servidor)).
- Conferir no celular se vínculo recusado não aparece como "Conversa anterior".
- Lembretes nascem quando o app abre as notificações, porque não há agendador.
- Em Xiaomi com modo escuro, o MIUI escurece a splash.

## O que cada um faz

| Quem | Tarefas |
|---|---|
| Rafael | Fazer as mudanças levantadas no teste de 27/11. Limpar o banco do servidor e gerar o APK da banca. Gerar o APK reserva do [plano B](../engenharia/ambiente-apresentacao.md). Guardar cópia da `APP_KEY` do servidor |
| Caio | Telas que faltam. Testar o fluxo do paciente no celular. Board e atas prontos para a banca. Perguntar ao professor sobre o escopo de 2026 (DA-16) e o formato de entrega |
| Mariana | Testar o fluxo do psicólogo no celular e o upload de documento do cadastro |
| Zanetti | Lista de requisitos Must: atendido, parcial ou cortado. Revisar o que o ABNT diz sobre Policies e expiração de token (a expiração por inatividade está implementada; a única Policy é a de foto de perfil, o resto fica nos middlewares e Services) |
| Nicoly | Manual do paciente, relatório de testes e slides |
| Isabela | Manual do psicólogo, slides e ABNT (só ela edita o `.docx`, para não dar conflito). Medicação, IA, auditoria e prontuário **não são mais cortes** na API, e a hospedagem mudou |
| Todos | Dois ensaios com o APK final no celular |

## Calendário até 04/12

Dias de aula em negrito.

| Data | Marco | Quem |
|---|---|---|
| **qui 26/11** | Teste no celular, nos dois lados, numa lista única de bugs. Roteiro da demonstração. Prints para os manuais | Caio, Mariana, Rafael, Nicoly, Isabela |
| **sex 27/11** | Ensaio 1 completo, com cronômetro | Todos |
| sáb 28 a seg 30/11 | Correção de bugs. **Código congela em 30/11 à noite**, com o APK final | Rafael, Caio, Mariana |
| ter 01/12 | ABNT, manuais e relatório de testes fechados. Vídeo da demonstração gravado | Isabela, Nicoly, Zanetti |
| qua 02/12 | Slides fechados e revisão cruzada. Definir local, projetor e celular da demonstração | Todos |
| **qui 03/12** | Ensaio 2 na escola, na rede e nos aparelhos da apresentação | Todos |
| **sex 04/12** | Apresentação | Todos |

**Regra do congelamento:** depois de 30/11, código só muda se quebrar a demonstração, e cada mudança exige APK novo e o roteiro rodado de novo.

## Avisos

- O [checklist da apresentação](../engenharia/ambiente-apresentacao.md) cobre o APK, os planos de contingência e a manhã do dia.
- O APK de teste tem os botões "Entrar como" e a senha de demonstração embutida. O APK da banca sai com `EXPO_PUBLIC_DEMO_LOGIN=false` e a senha vazia.
- `backend/.env` e `app/.env.local` não estão no git. Leve por pendrive ou cofre de senhas.
- A frente oficial é a `main`; cada um trabalha na própria branch e entra por PR.
- Só dados fictícios, inclusive nos prints.
