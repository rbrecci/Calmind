# Calmind: fechamento da Sprint 3

Estado em 04/11/2026, para a reunião de 05/11.

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
1. Perguntar ao professor: data da apresentação, se existe escopo de 2026 com pesos de nota e como entregar.
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
| Onde hospedar a API | Railway: 30 dias grátis, depois cerca de US$ 5/mês |
| Sete requisitos Must cortados (medicação e IA) | Manter o corte e justificar por escrito, porque o congelamento foi em 30/10 |
| Quem paga o servidor, se passar dos 30 dias | Definir hoje |

## Ordem do trabalho

1. Professor confirma a data.
2. Servidor no ar e APK final.
3. Testes no celular e correções.
4. Relatório, ABNT e slides fechados.
5. Ensaios.

**O manual começa já:** não depende do servidor.

## Avisos

- **O APK atual não funciona na escola:** ele só conecta na rede de casa do Rafael. Até sair o APK final, os prints saem pela versão web (`npm start` em `app/`, depois tecla `w`).
- **Branch de trabalho:** `integracao/fechamento-30-10`. O `main` está desatualizado. Dê `git pull` nela antes de começar.
- **Só dados fictícios**, inclusive nos prints.
