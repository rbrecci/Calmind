# Calmind: fechamento da Sprint 3

Estado em 04/11/2026, para a reunião de 05/11. Calendário revisado em 23/11/2026.

**Apresentação: sexta 04/12/2026.**

## Resumo

**O sistema funciona no navegador. Ainda não rodou em celular nem está em servidor. A documentação é o que mais falta.**

## Progresso dos entregáveis

| Entregável | Estado | O que falta |
|---|---|---|
| Sistema completo | Quase pronto | Celular, servidor e PR para o `main` |
| Relatório de testes | Só evidências soltas | Juntar em um relatório |
| Documento ABNT | Parado em 23/10 | Atualizar com o estado atual |
| Manual do usuário | Não começou | Escrever os dois manuais |
| Apresentação | Não começou | Slides e dois ensaios |

## O sistema hoje

**Funciona (API real, app testado no navegador):** login, cadastro, aprovação de psicólogo, catálogo, convite, vínculo, consentimento, relatos, tarefas, chat, agenda e notificações dentro do app.

**Testes:** 242 do backend e 161 do app passando. Roteiro web e app (RNF-61): 18 de 18.

**Cortado, vai para o documento como evolução futura:** medicação, IA, auditoria de leitura, push e chat em tempo real.

**Nunca testado:** APK em celular, upload de arquivo no celular, servidor público.

## O que cada um faz

### Rafael
1. Testar o APK no celular, em casa.
2. Publicar a API no servidor.
3. Gerar o APK final e passar para o grupo.
4. Abrir o PR para o `main`.

### Caio
1. Perguntar ao professor se existe escopo de 2026 com pesos de nota e como entregar os documentos. A data já está confirmada: 04/12.
2. Com o APK final, testar o fluxo do paciente no celular e corrigir o que falhar.
3. Deixar o board e as atas prontos para mostrar à banca.

### Mariana
1. Com o APK final, testar o fluxo do psicólogo no celular e corrigir o que falhar.
2. Testar o upload de documento no cadastro de psicólogo.

### Zanetti
1. Repetir o Newman contra o código atual e salvar a saída em `docs/testes/`.
2. Montar a lista de requisitos Must: atendido, parcial ou cortado.
3. Conferir se Policies e expiração de token ainda estão pendentes, como o ABNT diz.

### Nicoly
1. Escrever o manual do paciente, com prints.
2. Escrever o relatório de testes, com os dados do Zanetti e de `docs/testes/`.
3. Fazer os slides com a Isabela.

### Isabela
1. Escrever o manual do psicólogo, com prints.
2. Atualizar o ABNT, incluindo os cortes e a justificativa de cada um. Só ela edita esse arquivo, para não dar conflito.
3. Fazer os slides com a Nicoly.

### Todos
Dois ensaios com o APK final no celular.

## Decidir na reunião

| Decisão | Recomendação |
|---|---|
| Onde hospedar a API | Fechada em 23/11: notebook do Rafael com o XAMPP, exposto pelo ngrok grátis em `https://lettuce-impeach-arose.ngrok-free.dev`. A Railway saiu porque o teste grátis acabou e o plano pago custa US$ 5 |
| Sete requisitos Must cortados (medicação e IA) | Manter o corte e justificar por escrito, porque o congelamento foi em 30/10 |

## Calendário até 04/12

Montado de trás para frente a partir da apresentação. Dias de aula em negrito.

| Data | Marco | Quem |
|---|---|---|
| seg 23/11 | Banco de demonstração preparado com a senha própria, túnel ngrok testado e APK v1 gerado com o endereço HTTPS | Rafael |
| ter 24/11 | APK v1 instalado e testado no celular, fora do Wi-Fi de casa (4G) | Rafael e Zanetti |
| qua 25/11 | APK v1 enviado ao grupo, com a senha de demonstração passada por fora do repositório | Rafael |
| **qui 26/11** | Teste no celular: paciente (Caio) e psicólogo (Mariana), numa lista única de bugs. Roteiro da demonstração fechado. Prints para os manuais | Caio, Mariana, Rafael, Nicoly, Isabela |
| **sex 27/11** | Ensaio 1 completo, com cronômetro, mesmo com slides crus | Todos |
| sáb 28 a seg 30/11 | Correção dos bugs da lista. **Código congela na segunda 30/11 à noite**, com APK final v2 e PR para o `main` | Rafael, Caio, Mariana |
| ter 01/12 | ABNT, manuais e relatório de testes fechados. Vídeo da demonstração gravado como plano B | Isabela, Nicoly, Zanetti |
| qua 02/12 | Slides fechados. Revisão cruzada: quem não escreveu lê | Todos |
| **qui 03/12** | Ensaio 2 na escola: notebook ligado na tomada servindo a API pelo túnel, Wi-Fi da escola, projetor, celular espelhado | Todos |
| **sex 04/12** | Apresentação | Todos |

**Regra do congelamento:** depois de 30/11, código só muda se quebrar a demonstração, e cada mudança exige APK novo e o roteiro rodado de novo. Refinamento depois dessa data vai para slide e documento, não para código.

**Plano B da demonstração:** se o Wi-Fi da escola falhar, o notebook e o celular usam o 4G de um celular roteando. Se o notebook ou o túnel cair, entra o vídeo gravado em 01/12.

**Subir o servidor no dia:** MySQL pelo painel do XAMPP; em `backend/`, `C:/xampp2/php/php.exe artisan serve --host=127.0.0.1 --port=8000`; em outro terminal, `ngrok http 8000`. O notebook não pode suspender. O painel web mostra um aviso do ngrok na primeira visita: clicar em "Visit Site".

**O manual começa já:** não depende do servidor.

## Avisos

- **O APK atual não funciona na escola:** ele só conecta na rede de casa do Rafael. Até sair o APK final, os prints saem pela versão web (`npm start` em `app/`, depois tecla `w`).
- **Branch de trabalho:** `integracao/fechamento-30-10`. O `main` está desatualizado. Dê `git pull` nela antes de começar.
- **Só dados fictícios**, inclusive nos prints.
