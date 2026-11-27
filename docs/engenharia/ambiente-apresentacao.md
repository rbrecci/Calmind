# Apresentação: ambiente e checklist

Para a apresentação de **sexta 04/12/2026**. A API fica na [alwaysdata, com repasse pela Vercel](hospedagem-alwaysdata.md). O notebook não precisa servir nada no plano principal.

## 1. Planos

| Plano | Quando | O que fazer |
|---|---|---|
| **A, principal** | sempre | APK final apontando para `https://calmind-api.vercel.app/api/v1`. Qualquer rede serve |
| **B, notebook** | servidor ou repasse fora do ar | Subir o sistema no notebook com [ngrok](rodar-em-outra-maquina.md), usando o **hotspot de um celular** (a rede do SENAI bloqueia o ngrok). Exige um **segundo APK**, porque o endereço fica embutido no build |
| **C, sem internet** | nenhuma rede funciona | Vídeo gravado do fluxo completo; se pedirem navegação ao vivo, app em modo de dados de mentira (`EXPO_PUBLIC_USE_MOCK=true`) |
| **IA fora do ar** | Gemini com erro ou sem cota | O rodízio de chaves e modelos cobre. Se falhar, a API responde 502 e não grava nada. `AI_PROVIDER=simulated` serve para ensaio, com o texto marcado como `[SIMULADO, sem IA real]`. **Nunca apresentar texto simulado como se fosse da IA** |

## 2. Checklist até quinta 03/12

- [ ] APK final (plano A) com `USE_MOCK=false`, `DEMO_LOGIN=false` e senha vazia, instalado nos celulares do grupo.
- [ ] APK reserva (plano B) com a URL do ngrok, instalado em pelo menos um celular.
- [ ] [Testes de aceite](hospedagem-alwaysdata.md#2-testes-de-aceite) do servidor passando.
- [ ] No celular de verdade, pela rede móvel e pelo Wi-Fi: login, convite, relato, tarefa, chat, agenda, e o que já tiver tela de medicação, IA e prontuário.
- [ ] Ensaio do plano B no notebook: MySQL, API e túnel ligados, `curl` respondendo 401.
- [ ] Vídeo do fluxo do paciente e do psicólogo gravado e guardado em dois lugares.
- [ ] Definidos o local, o projetor e o celular da demonstração.

## 3. Na manhã de 04/12

- [ ] `curl` em `https://calmind-api.vercel.app/api/v1/me` responde **401**.
- [ ] Uma análise por IA pela API funciona.
- [ ] Banco no estado de partida; para zerar, siga a [seção 1 da hospedagem](hospedagem-alwaysdata.md#1-atualizar-o-servidor).
- [ ] Notebook no carregador e hotspot disponível, para o plano B.
- [ ] Vídeo aberto em outra aba.
