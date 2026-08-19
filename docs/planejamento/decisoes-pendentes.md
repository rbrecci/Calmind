# Decisões pendentes para destravar a documentação do TCC

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
Plataforma de apoio à relação paciente/psicólogo
Documento de trabalho, para a reunião do grupo. Revisão de 18/08/2026.

> Base: `EscopoSCRUM DEV4ºS_2026.pdf` (regulamentação), `documento-base-sprint1.md` (visão e decisões de produto) e `documento-requisitos.md` (48 RF e 68 RNF já fechados).
>
> Cada decisão abaixo tem uma recomendação e, principalmente, **o que ela destrava**. Decisão sem consequência prática não entrou na lista.

---

## 1. Onde o projeto está hoje

A regulamentação exige cinco peças de documentação técnica (item 2.1) distribuídas em três sprints (item 3). Situação real:

| Exigência da regulamentação | Sprint | Estado |
|------------------------------|--------|--------|
| Requisitos funcionais e não funcionais | 1 | **Pronto.** 48 RF com critérios de aceitação e 68 RNF com critérios de verificação, priorizados por MoSCoW |
| Coleta e análise dos requisitos (a pesquisa em si) | 1 | **Pendente.** As 3 entrevistas existem e sustentam o produto, mas não há roteiro, síntese nem personas escritos |
| Diagramas iniciais (MER, DER e outros de modelagem) | 1 | **Não iniciado** |
| Prototipação: wireframes ou mockups | 1 | **Não iniciado** |
| Implementação inicial de backend e frontend | 2 | Não iniciado, e bloqueado pela stack |
| Primeiros testes | 2 | Não iniciado |
| Sistema completo web e/ou mobile | 3 | Não iniciado |
| Documentação técnica final em ABNT | 3 | Não iniciado |
| Manual do usuário | 3 | Não iniciado |
| Detalhamento de programação e codificação | 3 | Não iniciado |
| Relatório de testes e ajustes finais | 3 | Não iniciado |
| Apresentação (PowerPoint, PDF ou Canva) | 3 | Não iniciado |

**Leitura honesta:** a Sprint 1 está com 1 dos 3 entregáveis fechado, e é o mais pesado dos três. Os outros dois, diagramas e wireframes, dependem de decisões que o grupo ainda não tomou. Nenhum deles depende de mais análise de requisitos: o insumo já existe.

### 1.1 Três notas sobre a regulamentação

**A regulamentação premia fazer web e mobile, não um ou outro.** O item 1.1 diz "web e/ou mobile", mas o item 2.2 exige, na Integração, "utilização de frameworks ou linguagens para o desenvolvimento mobile, visando a sincronização dos dados com a aplicação web", e nas Funcionalidades Básicas exige que o mobile se comunique com o sistema web. O "e/ou" some quando se lê o parágrafo seguinte. A proposta da seção 6.4 do documento base (psicólogo em web, paciente em mobile, dados sincronizados) atende exatamente isso, e o RNF-61 já transformou a sincronização em critério verificável.

**Os cinco critérios de avaliação do item 2.4 já têm requisito correspondente.** Funcionalidade (todos os RF), usabilidade e acessibilidade (RNF-34 a RNF-40), estética e responsividade (RNF-34, RNF-59), qualidade de código (RNF-51 a RNF-56) e segurança com validação de entrada e criptografia (RNF-01, RNF-02, RNF-10). Vale citar esse mapeamento na defesa: a banca avalia por esses cinco eixos e o documento de requisitos responde eixo por eixo.

**Confirmar com o professor:** o rodapé do PDF diz "PROJETO 4° TERMO 2024" enquanto o arquivo se chama 2026. Provavelmente é só rodapé desatualizado, mas confirmem que não existe versão mais nova, com datas e pesos de nota.

---

## 2. Mapa de bloqueio

Quem trava o quê, em ordem de urgência:

```
DP-01 plataforma dos apps ──┬──> wireframes (Sprint 1)
                            └──> stack de frontend e mobile (Sprint 2)

DP-02 modelo de identidade ─┬──> MER e DER (Sprint 1)
DP-03 banco relacional ─────┤
DP-06 relato privado ───────┘

DP-04 telas por app ───────────> wireframes (Sprint 1)
DP-05 critérios do catálogo ───> wireframe da busca (Sprint 1)

DP-16 datas reais ─────────────> tudo, porque define o cronograma
DP-15 papéis ──────────────────> tudo, porque define quem faz

DP-10 a DP-14 stack e infra ───> Sprint 2 inteira
DP-17, DP-18 ABNT e manual ────> Sprint 3 sem correria
```

---

## 3. Decisões que travam a Sprint 1

Estas são as urgentes. Sem elas, diagramas e wireframes não começam.

### DP-01 Plataforma de cada aplicativo

> **FECHADA em 19/08/2026:** app mobile em React Native, painel do administrador em web, backend Laravel com MySQL. Detalhamento do arranque em `arranque-react-native.md`. Fecha também DP-10 (stack) e encaminha DP-12 (notificação local, sem push).

**Contexto:** pendência 8.1 item 1 do documento base. A seção 6.4 propõe psicólogo em web (cerca de 7 telas) e paciente em mobile, mas o grupo nunca confirmou.
**Opções:** (a) psicólogo web e paciente mobile; (b) os dois em web responsivo; (c) os dois em mobile.
**Recomendação:** opção (a). É a única que atende o item 2.2 da regulamentação por inteiro, e é a que reduz trabalho, porque o app do psicólogo tem menos telas e cabe em web.
**Destrava:** wireframes, contagem de telas, escolha de stack, RNF-59 e RNF-61.
**Prazo:** imediato. É a decisão mais bloqueante do projeto.

### DP-02 Modelo de identidade e papéis

**Contexto:** o MER depende disso e não há decisão registrada. Paciente e psicólogo compartilham autenticação (RF-01, RF-02) mas têm dados profundamente diferentes.
**Opções:** (a) uma entidade Usuário com papel, mais entidades Paciente e Psicólogo ligadas a ela; (b) entidades separadas desde a autenticação.
**Recomendação:** opção (a). O RF-05 exige controle por papel e o administrador é um terceiro perfil: com entidades separadas, autenticação e autorização viram três caminhos paralelos.
**Destrava:** MER, DER e o desenho da autorização.
**Prazo:** antes de desenhar o MER.

### DP-03 Natureza do banco de dados

**Contexto:** a regulamentação exige MER e DER, que pressupõem modelo relacional. A pendência 8.2 do documento base ainda não fechou o banco.
**Recomendação:** banco relacional. Não é conveniência: MER e DER são entregáveis obrigatórios da Sprint 1, e forçá-los sobre um banco não relacional gera diagrama artificial, que a banca percebe.
**Destrava:** MER, DER e toda a persistência da Sprint 2.
**Prazo:** junto com DP-02.

### DP-04 Inventário fechado de telas por aplicativo

**Contexto:** ninguém prototipa sem a lista. Ela sai direto dos RF, mas precisa ser fechada e acordada, senão cada integrante desenha um conjunto diferente.
**Recomendação:** derivar do documento de requisitos agrupando por fluxo, e congelar a lista antes de abrir a ferramenta de protótipo. Só as telas de RF Must entram na Sprint 1.
**Destrava:** wireframes e a divisão do trabalho de design.
**Prazo:** logo após DP-01.

### DP-05 Critérios definitivos de busca do catálogo

**Contexto:** pendência 8.1 item 2. O RF-09 assumiu abordagem, especialidade, modalidade e região, sem preço.
**Recomendação:** confirmar a assunção do RF-09. O que não é negociável, e já está travado no CA-09.3, é a ausência de preço, nota e ranking.
**Destrava:** wireframe da busca e os campos de perfil no MER.
**Prazo:** junto com DP-04.

### DP-06 Isolamento do relato privado no modelo de dados

**Contexto:** o RNF-08 exige que o isolamento viva na camada de dados e seja provado por teste automatizado, não por tela. É decisão de modelagem, e a mais delicada do projeto.
**Opções:** (a) atributo de visibilidade na entidade Relato, com toda consulta do perfil psicólogo filtrando por ele; (b) relatos privados em entidade própria, à qual as consultas do psicólogo nunca chegam.
**Recomendação:** opção (b) se o grupo quiser a garantia mais forte e mais fácil de defender, porque o erro deixa de ser "esqueceram um filtro" e passa a ser "consultaram a tabela errada". A opção (a) é mais simples e aceitável, desde que a suíte do RNF-08 exista de verdade.
**Destrava:** MER, DER e o desenho das consultas do prontuário.
**Prazo:** antes de fechar o MER.

### DP-07 Formalização da pesquisa de campo

**Contexto:** a regulamentação pede "coleta e análise dos requisitos". A análise está pronta, a coleta não está escrita. As 3 entrevistas são o melhor argumento do projeto e hoje existem só como memória do grupo.
**Recomendação:** escrever roteiro aplicado, síntese por entrevistada (sem nome, com perfil) e 2 personas, uma de paciente e uma de psicóloga. É meio dia de trabalho e vale nota, porque separa um projeto com pesquisa real de um projeto com tema inventado.
**Destrava:** o item "coleta" da documentação e a introdução do documento final em ABNT.
**Prazo:** pode correr em paralelo com os diagramas, feito por quem não estiver modelando.

### DP-08 Quais diagramas além de MER e DER

**Contexto:** a regulamentação pede MER, DER "e outros diagramas de modelagem de software que demonstrem a arquitetura do sistema". "Outros" é aberto, e grupo nenhum entrega tudo.
**Recomendação:** três, e só três. Casos de uso, que a lista de RF já entrega quase pronta. Diagrama de arquitetura ou de componentes, mostrando dois clientes sobre um backend único, exigido pelo RNF-57. Diagrama de estados cobrindo vínculo e medicação, os ciclos pendente/ativo/encerrado e aguardando confirmação/ativa/suspensa do RNF-50. Diagrama de sequência só se sobrar tempo, e nesse caso apenas do ciclo semanal com a análise de IA.
**Destrava:** a divisão do trabalho de diagramação e o escopo real da Sprint 1.
**Prazo:** junto com DP-02.

### DP-09 Ferramenta e fidelidade do protótipo

**Contexto:** a regulamentação aceita "diagrama ou protótipo da interface".
**Recomendação:** wireframe de média fidelidade em ferramenta colaborativa, com kit de componentes pronto. Alta fidelidade em todas as telas consome a sprint inteira e não muda a nota do item 2.1. O que muda a nota é responsividade e acessibilidade no produto final, que são critérios do item 2.4.
**Destrava:** o início efetivo do protótipo e o design system do RNF-34.
**Prazo:** junto com DP-04.

---

## 4. Decisões que travam a Sprint 2

Não precisam ser tomadas hoje, mas precisam estar fechadas antes do último dia da Sprint 1, senão a Sprint 2 começa parada.

### DP-10 Stack de backend, frontend web e mobile

**Contexto:** pendência 8.2. O RNF-68 garante que nenhum requisito depende dessa escolha, então o grupo escolhe livre.
**Critério sugerido:** o que o grupo já sabe usar. Sprint de aprendizado de framework novo é sprint perdida. O item 2.2 exige apenas design responsivo, acessibilidade, CRUD e sincronização com o mobile.
**Destrava:** todo o desenvolvimento.

### DP-11 Provedor e modelo de IA, e onde a chave fica

**Contexto:** os RNF-27 a RNF-33 dependem de um serviço de IA, e o RNF-56 proíbe chave no repositório.
**Recomendação:** decidir cedo e testar cedo, com um relato fictício, porque limite de cota de conta gratuita costuma aparecer só no dia da demonstração. A chave vive no servidor, nunca dentro do aplicativo.
**Destrava:** RF-41 e RF-42, que são o coração do produto.

### DP-12 Serviço de notificações

**Contexto:** o RF-16 e o RF-28 dependem de notificação e de lembrete em horário programado.
**Alerta de risco:** lembrete agendado é a funcionalidade que mais costuma quebrar perto da entrega. Vale prototipar na primeira semana da Sprint 2, não na última.

### DP-13 Repositório, board e ambiente

**Contexto:** pendência 8.2, e os RNF-51, RNF-60 e RNF-62 dependem disso.
**A fechar de uma vez:** repositório e quem tem acesso, padrão de mensagem de commit, padrão de nome de ramo, board Scrum e a definição de pronto de cada tarefa.
**Destrava:** a rastreabilidade que o RNF-62 exige e a evidência de Scrum que a unidade curricular avalia.

### DP-14 Idioma do código

**Contexto:** pendência 8.2 e RNF-52. Parece detalhe e não é: decidido tarde, gera tabela em português com coluna em inglês, e isso aparece no MER entregue.
**Recomendação:** decidir junto com DP-02, para o MER já nascer com os nomes definitivos.

---

## 5. Decisões de equipe e processo

### DP-15 Papéis Scrum e divisão de trabalho

**Contexto:** pendência 8.3, e a unidade curricular é de metodologias ágeis: a banca avalia o processo, não só o produto.
**A fechar:** quem é Scrum Master, quem é Product Owner, quem trabalha em qual app, e quem é dono de cada documento. Documento sem dono não é escrito.

### DP-16 Datas reais das três sprints

**Contexto:** sem isso não existe cronograma. É o único item desta lista que não dá para recomendar, porque depende do calendário do curso.
**A levantar:** data de início e de entrega de cada sprint, dias de aula da unidade curricular, data da apresentação final e se há entrega parcial avaliada no meio de alguma sprint.

### DP-17 Padrão ABNT e ferramenta do documento final

**Contexto:** a Sprint 3 exige "documentação técnica final (padrão ABNT)". Formatar em ABNT no último fim de semana é um clássico e custa caro.
**Recomendação:** decidir agora a ferramenta e montar o esqueleto ABNT já na Sprint 1, com capa, sumário automático, seções e referências. Os documentos que já existem entram como seções, não como anexos refeitos do zero.
**Destrava:** a entrega final sem correria.

### DP-18 Manual do usuário: quando começa

**Contexto:** entregável da Sprint 3, junto de tudo o mais.
**Recomendação:** escrever cada trecho do manual quando a tela correspondente ficar pronta, ao longo das Sprints 2 e 3. Uma tela pronta rende meia página de manual em 15 minutos; vinte telas prontas rendem uma noite perdida.

---

## 6. O que ainda ninguém está olhando

Itens obrigatórios da regulamentação que não apareceram em nenhum documento do grupo até agora, e que não têm dono:

1. **Manual do usuário** (item 2.1 e Sprint 3).
2. **Detalhamento de programação e codificação**, o documento que explica como o sistema foi construído e destaca as partes principais (item 2.1).
3. **Relatório de testes e ajustes finais** (Sprint 3). Os RNF-08 e RNF-53 já definem o que precisa ser testado, então o relatório tem esqueleto pronto.
4. **Apresentação final** em PowerPoint, PDF ou Canva (Sprint 3).
5. **Documentação técnica final em ABNT** (Sprint 3), que é o guarda-chuva de todo o resto.

Nenhum deles é difícil. Todos são caros se deixados para o fim.

---

## 7. O que falta para montar o cronograma dia a dia

O cronograma detalhado que o grupo pediu depende de quatro insumos que só vocês têm:

| # | Insumo | Por que trava |
|---|--------|---------------|
| 1 | Datas de início e entrega de cada sprint, e data da apresentação | Sem elas o cronograma vira lista de tarefas sem prazo, que é o que já existe hoje |
| 2 | Dias de aula da unidade curricular e disponibilidade real fora da aula | Define se o dia útil do grupo é 1 por semana ou 5, e isso muda toda a distribuição |
| 3 | Quantidade de integrantes e o que cada um já sabe fazer | Define quantas frentes rodam em paralelo e quem pega backend, mobile, design ou documentação |
| 4 | Resposta ao DP-01 (plataforma de cada app) | Muda a quantidade de telas, de frentes de código e de tarefas de protótipo |

Com esses quatro, o cronograma sai por dia, com dono e critério de pronto por tarefa, amarrado aos RF e RNF já numerados.
