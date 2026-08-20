# Arranque do cenário B: app React Native

**Decisão tomada em 19/08/2026 (quarta).** App mobile em React Native, backend Laravel com MySQL, painel do administrador em web sobre o mesmo backend, mais a landing page de divulgação.

> Decidir na quarta em vez de na sexta comprou 2 dias na semana mais arriscada do projeto. Este documento diz o que fazer com eles.

---

## 1. O que a decisão muda na Sprint 1

Quase nada, e isso é o resultado esperado: os wireframes já estavam sendo desenhados mobile-first justamente para servir às duas rotas. O que muda:

| Item | Antes | Agora |
|------|-------|-------|
| Diagrama de arquitetura | Hipotético, dois formatos possíveis | Definitivo: app React Native, API Laravel, banco MySQL, painel web em Blade sobre o mesmo backend |
| Wireframes | Padrão mobile genérico | Padrão de app: navegação por abas na base, pilha de telas, cabeçalho com voltar |
| Painel do administrador | Fora do inventário de telas | Entra no diagrama de arquitetura. As telas dele ficam para a Sprint 2, mas a existência dele precisa aparecer |
| Seção de stack do documento | "Em aberto" | Fechada, e isso fortalece a entrega: some a maior lacuna do documento base |
| RF-28, lembrete de medicação | Duas implementações possíveis | Notificação local agendada no aparelho. Vale escrever isso no documento agora |

**O que não muda:** MER, DER, casos de uso, diagrama de estados, requisitos, pesquisa de campo, personas. Continuam idênticos ao que estava planejado.

---

## 2. Quarta 19/08, hoje

Sprint 1 continua mandando. Ninguém abre o React Native hoje, com uma exceção barata no fim da lista.

| Quem | Tarefa | Pronto quando |
|------|--------|---------------|
| Rafael e Zanetti | MER completo e DER derivado dele. Com a decisão fechada, os nomes de tabela já nascem definitivos | DER exportado |
| Caio | Wireframes das telas 1 a 7, agora com padrão de app: abas na base, pilha de navegação, gesto de voltar | 7 quadros prontos |
| Rafael | Fechar o idioma do código (DP-14) **antes** do MER ficar pronto, porque agora existem dois lados falando entre si. Recomendação abaixo, na seção 5 | Decisão escrita no grupo |
| Quem tiver máquina livre | **Só iniciar os downloads:** Android Studio, SDK e ferramentas de linha de comando. Baixar não é trabalhar, e são horas de download que não podem cair na sexta | Download concluído, nada configurado ainda |

---

## 3. Quinta 20/08, aula

O roteiro do dia continua o mesmo, com duas mudanças.

**A pergunta ao professor mudou.** Não é mais "web sozinho atende o item 2.2", porque vocês não precisam mais dessa resposta. As perguntas que sobraram:

1. Qual o formato exato da entrega da Sprint 1: documento único em PDF, repositório, board, ou os três?
2. Existe versão 2026 do escopo, com datas e pesos de nota? O rodapé do PDF diz 2024.
3. Data exata da apresentação final.
4. Há exigência sobre a loja de aplicativos, ou entregar o APK instalável basta? Presumimos que APK basta, mas essa presunção custa caro se estiver errada.

**O diagrama de arquitetura agora é definitivo.** Rafael e Zanetti desenham com os quatro elementos reais: app React Native, API Laravel, banco MySQL e painel web. O RNF-57 exige um único serviço central, então o diagrama precisa mostrar que a regra de negócio vive só no Laravel e que os dois clientes apenas consomem.

Restante do dia sem mudança: wireframes 8 a 14, casos de uso, pesquisa de campo e esqueleto do documento.

---

## 4. Sexta 21/08, entrega e virada de chave

Manhã e início da tarde seguem o plano: fechamento até as 11h, montagem do pacote até as 13h, revisão até as 14h, entrega às 14h.

**A reunião das 14h30 muda de função.** Era para decidir o cenário. Agora é o arranque do React Native, com uma pauta de 1 hora:

1. Fechar as 6 decisões da seção 5, todas de uma vez.
2. Criar o repositório e o board, com o padrão de commit e de ramo escrito.
3. Distribuir o spike: Caio e Mariana no app, Rafael e Zanetti subindo o Laravel com as migrations do DER que acabou de ser entregue.
4. Combinar o horário do primeiro build.

---

## 5. As 6 decisões que precisam fechar até sexta

### D1. Expo ou React Native puro

**Recomendação: Expo com development build**, não Expo Go. O Expo resolve a parte que mais consome tempo de quem está começando, que é configuração de ambiente e geração de APK. O development build, e não o Expo Go, é necessário porque o RF-28 depende de notificação local agendada, e o suporte a notificação no aplicativo Expo Go é limitado.

**Incerteza declarada:** eu não tenho como confirmar daqui o comportamento exato da versão atual do Expo para notificação agendada com o app fechado no Android. Isso é justamente o que o spike da seção 6 tem que provar, e por isso ele é o primeiro item do critério de aprovação. Não assumam que funciona: testem no dia um.

### D2. Nome do produto — FECHADO

**Decidido: Calmind, com o slogan "Saúde Mental & Acolhimento".** Vale para o APK, a landing page, a capa em ABNT e os slides. O nome de exibição no aparelho é `Calmind`.

Com isso saem do bloqueio a capa do documento final, a landing page e a apresentação. **Segue em aberto:** o identificador do pacote, no formato `com.<grupo>.calmind`, que precisa fechar antes do primeiro build assinado.

### D3. Um repositório ou dois

**Recomendação: um repositório só**, com as pastas do backend, do app e do painel separadas. Com 6 pessoas e 12 semanas, dois repositórios significam duas listas de issues, dois históricos e a chance de o app apontar para uma versão de API que não existe mais.

### D4. Idioma do código (DP-14)

**Recomendação: inglês nos identificadores**, ou seja, nomes de tabela, coluna, variável, função e campo de API. Português apenas no texto que o usuário lê.

O motivo mudou com a decisão de ontem: agora existe um app em JavaScript conversando com um backend em PHP. Se a tabela é `relatos` e o campo que chega no app é `reports`, alguém vai traduzir na mão em algum lugar, e é sempre no lugar errado. Um idioma só do banco até a tela.

**Isto é urgente hoje, não sexta:** o MER está sendo desenhado agora.

### D5. Como o app se autentica

**A definir na sexta:** o backend emite um token por sessão, o app guarda esse token no armazenamento seguro do aparelho, e toda requisição vai autenticada. O RNF-07 proíbe credencial em log ou em resposta, e o RNF-09 exige expiração por inatividade.

### D6. Onde o app encontra o backend durante o desenvolvimento

Parece detalhe e trava a semana 1 inteira: o celular físico não enxerga o `localhost` do notebook. É preciso decidir se o backend roda na rede local com IP fixo, se sobe em um servidor de teste, ou se usam túnel. Sem isso resolvido, o app não fala com a API no dia um.

---

## 6. O spike de React Native: critério de aprovação

O spike existe para matar o maior risco do projeto o quanto antes. Ele não é "estudar React Native". Ele é uma lista de quatro provas.

| # | Prova | Por que essa e não outra |
|---|-------|--------------------------|
| 1 | O app abre em **celular físico**, não em emulador | Emulador esconde problema de permissão, de build e de desempenho |
| 2 | Uma tela de login consome um **endpoint real** do Laravel e recebe resposta | Prova a decisão D6 e o caminho app até API até banco |
| 3 | Uma **notificação local agendada dispara com o app fechado** | É o RF-28 inteiro. Se falhar, é melhor descobrir agora e reescrever o requisito com a limitação declarada |
| 4 | Um **APK gerado é instalado por outra pessoa** do grupo, que não foi quem gerou | Prova que o build é reproduzível e não depende da máquina de uma pessoa só |

**Prazo:** o marco M2 continua em **sexta 28/08**, mas com a decisão antecipada dá para mirar **terça 25/08**. As quatro provas não precisam estar bonitas, precisam estar passando.

**A regra de corte continua valendo, e ela é o que protege o semestre:** se em 28/08 as provas 1 e 4 não estiverem passando, o grupo volta para o cenário A, tendo perdido uma semana e não o semestre. Isso não é pessimismo, é a razão pela qual essa semana foi colocada primeiro.

---

## 7. O que não fazer nesta semana

1. **Não comecem a escrever telas do app antes das quatro provas passarem.** Tela bonita sobre fundação que não fecha é retrabalho garantido.
2. **Não deixem o primeiro APK para depois.** Ele é a prova 4, não é o final da Sprint 2. Serão três builds no projeto: agora, na semana 6 e na semana 11.
3. **Não puxem gente da Sprint 1 para o React Native hoje ou amanhã.** A entrega de sexta é nota, e o spike tem 5 dias de folga a partir de sábado.
4. **Não configurem o ambiente hoje**, só baixem. Configurar rende erro, e erro rende três horas que hoje pertencem ao MER e aos wireframes.

---

## 8. Decisões que este documento fecha

| Pendência | Situação |
|-----------|----------|
| DP-01 plataforma de cada aplicativo | **Fechada em 19/08:** app mobile React Native, painel do administrador em web |
| DP-10 stack | **Fechada:** React Native no cliente, Laravel e MySQL no servidor, Blade e Bootstrap no painel |
| DP-12 serviço de notificações | **Encaminhada:** notificação local agendada para medicação, sem servidor de push. A confirmar na prova 3 do spike |
| DP-14 idioma do código | A fechar **hoje**, antes do MER. Recomendação: inglês nos identificadores |
| DP-13 repositório, board e ambiente | A fechar na sexta, às 14h30 |
| DP-11 provedor de IA | Continua aberta. Prazo: antes da semana 8 |
