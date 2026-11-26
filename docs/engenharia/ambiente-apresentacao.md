# Ambiente da apresentação (backend)

Escrito em 26/11/2026 para a apresentação de **sexta 04/12/2026**. Complementa o
[guia para subir em outra máquina](rodar-em-outra-maquina.md), que traz os comandos. Este documento
traz a **decisão**, os **riscos** e o **checklist** do dia.

## 1. Decisão

**Mantida a DA-01 (23/11):** o backend roda no notebook do Rafael (XAMPP) e sai para a internet pelo
ngrok grátis, no domínio fixo `https://lettuce-impeach-arose.ngrok-free.dev`. O APK final aponta para
esse endereço, com HTTPS (`usesCleartextTraffic: false`).

Reavaliada em 26/11 com dois fatos novos, e a decisão continua de pé:

| Alternativa | Por que não |
|---|---|
| **InfinityFree** (hospedagem grátis) | O sistema anti-bot deles exige JavaScript e cookies, e o app não executa JavaScript: a chamada da API pode receber a página de desafio em vez de JSON. O PHP deles também tem uma lista de serviços externos bloqueados, e não foi possível confirmar se o Google está nela, o que derrubaria a IA. |
| **Railway** | Teste grátis acabou, plano pago custa US$ 5 (decisão de 23/11). |
| **Túnel da Cloudflare (quick tunnel)** | A URL muda a cada vez que o túnel abre, e o APK tem o endereço fixo embutido: cada mudança exigiria gerar o APK de novo. |
| **Supabase** | Descartada em 04/11. |

## 2. O risco que a decisão carrega, e como ele fica coberto

**A rede do SENAI bloqueia o ngrok.** Testado em 26/11 no SENAI: o ngrok abre o processo mas não
estabelece o túnel (`heartbeat timeout`), e `dashboard.ngrok.com` não carrega; o endereço público
responde 404. Com o notebook ligado ao **hotspot do celular**, o túnel abriu na hora e o app passou a
responder. Não se tenta contornar o bloqueio da escola: a solução é não depender da rede dela.

| Plano | Quando | O que fazer |
|---|---|---|
| **A, principal** | sempre | O notebook usa o **hotspot de um celular** como internet (não o Wi-Fi da escola). Os celulares da demonstração podem usar qualquer rede, porque falam com o endereço público. |
| **B, se o hotspot falhar** | sem internet ou ngrok fora | Mostrar o **vídeo gravado** do fluxo completo (item 4.2) e abrir o app em modo de dados de mentira (`EXPO_PUBLIC_USE_MOCK=true`, sem backend) só para a navegação. |
| **C, IA fora do ar** | Gemini com 503 ou sem cota | O rodízio de chaves e de modelos já cobre. Se ainda assim falhar, o endpoint devolve 502 e não grava nada. Para ensaiar o fluxo de revisão sem a IA: `AI_PROVIDER=simulated`, com o texto marcado como `[SIMULADO, sem IA real]`. **Nunca apresentar texto simulado como se fosse da IA.** |

## 3. Configuração do servidor (`backend/.env`)

O `.env` não vai para o repositório. Conferir, no notebook de apresentação:

| Variável | Valor | Observação |
|---|---|---|
| `APP_URL` | `https://lettuce-impeach-arose.ngrok-free.dev` | É dele que sai o link da foto de perfil. Em `localhost`, a foto não aparece no celular. |
| `DB_PORT` | `3306` | No XAMPP padrão. (No computador do SENAI o MySQL tinha senha no `root`, por isso a instância separada na 3307.) |
| `CALMIND_DEMO_PASSWORD` e `CALMIND_ADMIN_PASSWORD` | as do `.env` original | O APK de teste tem a senha de demonstração embutida. Se mudar, os botões "Entrar como" param de logar. |
| `AI_PROVIDER` | `gemini` | |
| `GEMINI_API_KEY` e `GEMINI_API_KEYS` | chaves de contas do grupo | Rodízio: ver o contrato, seção 3.8.9. Gerar uma chave nova se a antiga passou por chat ou terminal. |
| `GEMINI_MODELS` | `gemini-3.5-flash-lite,gemini-3.5-flash` | O 2.5 saiu para contas novas. Conferir com `php artisan ai:check --models` perto do dia. |
| `AI_CA_BUNDLE` | só se der `cURL error 60` | O PHP do computador do SENAI não tinha certificados raiz. O PHP do XAMPP costuma ter. |

## 4. Checklist

### 4.1 Até quarta 03/12 (ensaio completo, na máquina e na rede da apresentação)

- [ ] `php artisan test` passa (em 26/11: 332 testes). Antes, `php artisan optimize:clear`.
- [ ] `php artisan ai:check --keys`: cada chave com cada modelo. Anotar quais contas funcionam.
- [ ] Banco criado com `scripts/preparar-demo.sh` (migrations, massa fictícia e troca das senhas).
- [ ] Ligar os três processos na ordem do guia: MySQL, `php artisan serve`, `ngrok http --url=... 8000`.
- [ ] `curl` no endereço público responde **401** em `/api/v1/me`.
- [ ] No celular de verdade, pela rede móvel e pelo Wi-Fi: login, convite, relato, tarefa, chat, agenda, medicação, análise por IA e prontuário.
- [ ] O domínio do ngrok só abre em **uma máquina por vez**: desligar o túnel em qualquer outro computador antes.
- [ ] Gerar o **APK final** com `USE_MOCK=false`, `DEMO_LOGIN=false`, senha vazia, e instalar nos celulares do grupo.

### 4.2 Plano B: gravar o vídeo

- [ ] Gravar a tela do celular percorrendo o fluxo do paciente e do psicólogo, incluindo a análise por IA e o prontuário. Guardar em dois lugares.

### 4.3 Na manhã de 04/12

- [ ] Notebook no carregador, hotspot ligado, **Wi-Fi da escola desligado no notebook**.
- [ ] Ligar MySQL, API e túnel; repetir o `curl` do item 4.1.
- [ ] `php artisan ai:check` (uma chamada, com rodízio) para confirmar o Gemini.
- [ ] Contas de demonstração conferidas (os botões "Entrar como" só existem no APK de teste).
- [ ] Banco no estado de partida: se precisar zerar, recriar o banco e rodar o `preparar-demo.sh`.
- [ ] Vídeo do plano B aberto em outra aba.

## 5. O que o backend entrega para a apresentação

Todos os requisitos Must do backend estão implementados (RF-36 fechou em 26/11). Ficam de fora, como
evolução futura: denúncias (RF-18, RF-45), nova versão de termo pelo administrador (RF-46), aceite do
contrato de serviço (RF-48), exportação dos dados (RF-31), política de retenção (RF-47), push e chat
em tempo real.

## 6. Pendências do ambiente

- **Coleção do Postman** sem as rotas de medicação, IA e prontuário, e o Newman ainda por rodar contra o código atual.
- **Massa de demonstração:** o `ClosingDemoSeeder` não cria medicação nem o aceite do termo de IA; hoje isso se faz pela API.
- **Lembretes sem agendador:** nascem quando o app abre as notificações (aceito para a demonstração).
- **Onde será a apresentação** (rede, tomada, projetor) e qual celular roda o app: definir até 02/12.
