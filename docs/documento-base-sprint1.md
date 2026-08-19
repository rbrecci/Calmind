# Documento Base — Sprint 1

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
Plataforma de apoio à relação paciente–psicólogo

> Documento de trabalho. Consolida o que foi definido, as decisões tomadas com suas justificativas e as pendências em aberto. Serve de base para o Documento de Requisitos formal (entregável da Sprint 1).

---

## 1. Problema

### 1.1 Origem

Pesquisa de campo com **3 entrevistadas sem relação entre si**: 2 psicólogas e 1 paciente. As dores relatadas convergiram de forma independente, o que dá força ao diagnóstico.

### 1.2 Dores identificadas

| ID | Dor | Relatado por |
|----|-----|--------------|
| D-01 | Comunicação fragmentada e inconsistente entre as sessões | Psicólogas + paciente |
| D-02 | Agendamento manual, sujeito a falhas e esquecimentos | Psicólogas + paciente |
| D-03 | Baixa adesão às tarefas prescritas (ex.: registrar gatilhos emocionais durante a semana) | Psicólogas |
| D-04 | Tempo curto de sessão gasto em recapitulação em vez de trabalho clínico | Psicólogas + paciente |
| D-05 | Ausência de ferramentas de apoio para os dois lados | Todas |
| D-06 | Dificuldade de acesso a profissionais (dor derivada, incorporada na 2ª rodada de definição) | — |

### 1.3 Hipótese central

A qualidade do tratamento depende tanto do que acontece **na** sessão quanto do que acontece **entre** as sessões — e é justamente o "entre" que não tem ferramenta nenhuma. O produto ataca esse intervalo.

---

## 2. Visão do produto

Dois aplicativos distintos sobre uma **base de dados e um backend compartilhados**:

- **App do Paciente** — foco em registro, lembretes e execução.
- **App do Psicólogo** — foco em gestão, prescrição de tarefas e preparação de sessão.

A plataforma opera em dois modos, dependendo de como o paciente entra:

1. **Ferramenta de continuidade** — paciente que já tem psicólogo entra por convite.
2. **Facilitador de acesso** — paciente sem psicólogo busca um profissional no catálogo e inicia o vínculo pela própria plataforma.

### 2.1 Atores

| Ator | Descrição |
|------|-----------|
| Paciente | Usuário final em acompanhamento psicológico. Máximo 1 vínculo ativo. |
| Psicólogo | Profissional com registro CRP validado. Pode ter N pacientes. |
| Administrador | Perfil interno. Aprova cadastros profissionais e trata denúncias. |
| Serviço de IA | Não é ator no sentido de caso de uso — é um componente acionado por outros atores. Nunca age sozinho. |

---

## 3. Fluxos definidos

### 3.1 Onboarding

```
Tela inicial
├── "Tenho psicólogo"      → insere convite ──────────┐
├── "Buscar profissional"  → catálogo → solicita ─────┤
│                            vínculo → aguarda aceite │
└── "Sou psicólogo"        → cadastro + CRP → validação → aprovado
                                                       │
                                              Vínculo ativo
                                                       │
                            Núcleo: chat, relatos, tarefas, agenda
```

### 3.2 Ciclo de vida do vínculo

`pendente` → `ativo` → `encerrado`

- Solicitação pelo paciente (via catálogo) ou convite pelo psicólogo → estado `pendente`.
- Aceite da outra parte → `ativo`.
- Encerramento por qualquer uma das partes → `encerrado`. Libera a busca para o paciente.
- **Regra:** máximo 1 vínculo `ativo` por paciente; N vínculos `ativos` por psicólogo.
- Histórico de vínculos encerrados é preservado (dado clínico, não pode simplesmente sumir).

### 3.3 Ciclo semanal (o coração do produto)

1. Psicólogo atribui tarefas ao paciente após a sessão.
2. Paciente registra relatos livres ao longo da semana e cumpre as tarefas.
3. Psicólogo **solicita** a análise de IA antes da próxima sessão.
4. IA gera resumo com tópicos principais dos relatos.
5. Psicólogo revisa o resumo e prepara a pauta da sessão.

Ponto crítico: a IA é acionada **por decisão humana**, nunca automaticamente.

---

## 4. Funcionalidades por aplicativo

### 4.1 App do Paciente

| # | Funcionalidade | MVP |
|---|----------------|-----|
| P-01 | Cadastro e autenticação | Sim |
| P-02 | Entrada por convite do psicólogo | Sim |
| P-03 | Busca no catálogo de profissionais (só sem vínculo ativo) | Sim |
| P-04 | Solicitação e encerramento de vínculo | Sim |
| P-05 | Chat assíncrono com o psicólogo | Sim |
| P-06 | Diário de relatos semanais | Sim |
| P-07 | Visualização e conclusão de tarefas (cards) | Sim |
| P-08 | Calendário de consultas | Sim |
| P-09 | Lembretes de medicação | Sim |
| P-10 | Notificações push | Sim |
| P-11 | Limite de uso de aplicativos | **Não** — ver 6.1 |

### 4.2 App do Psicólogo

| # | Funcionalidade | MVP |
|---|----------------|-----|
| S-01 | Cadastro com CRP e validação | Sim |
| S-02 | Perfil público (aparece no catálogo do paciente) | Sim |
| S-03 | Geração e envio de convites a pacientes | Sim |
| S-04 | Lista de pacientes vinculados | Sim |
| S-05 | Prontuário do paciente (visão consolidada) | Sim |
| S-06 | Atribuição de tarefas terapêuticas | Sim |
| S-07 | Registro de medicação com dias e horários | Sim — ver 6.2 |
| S-08 | Agendamento de consultas | Sim |
| S-09 | Solicitação de análise semanal por IA | Sim |
| S-10 | Chat assíncrono com pacientes | Sim |
| S-11 | Aceite/recusa de solicitações de vínculo | Sim |

**O app do psicólogo não tem:** busca de profissionais, diário de relatos, lembretes pessoais, limite de uso de apps.

---

## 5. Decisões tomadas

| # | Decisão | Justificativa |
|---|---------|---------------|
| DEC-01 | Dois aplicativos separados sobre backend único | Papéis com necessidades opostas; interfaces separadas evitam telas condicionais e reduzem risco de vazamento de dado entre perfis |
| DEC-02 | Paciente com vínculo ativo não acessa a busca | Evita ambiguidade sobre quem é o profissional responsável, sem criar beco sem saída (o encerramento libera a busca) |
| DEC-03 | Máximo 1 vínculo ativo por paciente | Reflete a prática clínica real e simplifica drasticamente a modelagem |
| DEC-04 | IA acionada sob demanda pelo psicólogo | Controle humano, custo previsível, e evita processar dado sensível sem necessidade |
| DEC-05 | Nenhuma sugestão de IA é persistida sem confirmação do profissional | A IA não pode tomar decisão clínica; é ferramenta de organização |
| DEC-06 | Sem avaliações, notas ou ranking de psicólogos | Transformaria escolha de tratamento em ranking comercial, incompatível com a lógica ética da profissão |
| DEC-07 | Sem pagamentos na plataforma | Fora do escopo pedagógico e adiciona superfície regulatória desnecessária |
| DEC-08 | Sem sessão por vídeo | Escopo; o produto atua entre as sessões, não nelas |
| DEC-09 | Limite de uso de apps fora do MVP | Ver 6.1 |
| DEC-10 | Medicação: psicólogo registra prescrição médica preexistente, paciente confirma | Preserva a funcionalidade sem simular prescrição; a confirmação do paciente cria dupla checagem sobre dado de saúde |
| DEC-11 | Convite por código digitado | Funciona na sessão presencial (ditado ou anotado), não depende de e-mail válido nem de deep link |
| DEC-12 | Paciente marca quais relatos são compartilhados | Sigilo é pré-condição de um diário terapêutico honesto; um diário que o paciente sabe que será lido inteiro deixa de ser útil clinicamente |
| DEC-13 | Escolha feita no momento da postagem; padrão é compartilhado | Mantém o fluxo do produto (o valor está no compartilhamento) sem tirar o controle do paciente |
| DEC-14 | O psicólogo não vê nem a existência de relatos privados | Exibir contagem pressiona o paciente e esvazia a garantia de sigilo. A análise de IA é rotulada como baseada nos relatos compartilhados |
| DEC-15 | Despublicar é permitido; o paciente é avisado se o relato já foi usado em uma análise | Preserva o direito de retirar o compartilhamento sem criar falsa impressão de apagamento — o psicólogo pode já ter lido |

---

## 6. Riscos e pontos críticos

### 6.1 Limite de uso de aplicativos — risco técnico alto

Bloquear ou limitar outros aplicativos não é funcionalidade comum de app:

- **Android:** exige `UsageStatsManager` + Accessibility Service, com política restritiva da Play Store para esse tipo de uso.
- **iOS:** depende do framework Screen Time / FamilyControls, que requer *entitlement* aprovado pela Apple — inviável para projeto acadêmico.

**Encaminhamento:** manter no documento como evolução futura, com a análise de viabilidade escrita. Documentar por que foi cortado conta a favor na avaliação, não contra.

### 6.2 Registro de medicação — risco clínico e ético

**Psicólogo não prescreve medicação.** Quem prescreve é médico (psiquiatra). Se o app do psicólogo tem uma tela chamada "atribuir remédios", o produto está modelando uma competência que o profissional não tem.

**Decisão (DEC-10):** o psicólogo registra a medicação **já prescrita por médico**, com campo obrigatório de origem da prescrição, e o paciente confirma antes de o lembrete entrar em vigor.

Consequências de projeto:

- A tela **não** se chama "prescrever" nem "atribuir remédio" — o vocabulário da interface é "registrar medicação em uso" / "lembrete de adesão".
- Campo obrigatório de origem da prescrição (profissional prescritor ou "informado pelo paciente").
- `Medicacao` tem ciclo de vida próprio: `aguardando_confirmacao` → `ativa` → `suspensa`.
- O paciente pode **recusar ou contestar** um registro. Sem esse caminho, a confirmação vira formalidade.
- O paciente pode suspender por conta própria (parou de tomar) — e isso deve ficar visível ao psicólogo, porque é informação clínica relevante.
- Aviso permanente na interface: a plataforma não prescreve nem altera prescrição médica.

### 6.3 Validação automática do CRP — risco de viabilidade

O CFP mantém o Cadastro Nacional de Profissionais de Psicologia como consulta pública, mas **não há API pública documentada**. Validação "automática" na prática significaria scraping — frágil e juridicamente discutível.

**Encaminhamento realista para o MVP:**
1. Validação **automática de formato** do número (ex.: `CRP-06/123456`) e da região.
2. Upload de documento comprobatório.
3. Aprovação por administrador antes de o perfil ir ao ar.
4. Documentar a consulta automatizada ao cadastro nacional como evolução futura.

### 6.4 Dois apps = dobro do frontend

Com 3 sprints e um grupo de estudantes, isso é real. Mitigações:
- Backend, banco, autenticação e API compartilhados.
- Design system único.
- App do psicólogo pode ser **web**, com menos telas (~7); app do paciente **mobile**. Isso ainda atende a exigência do escopo de "web e/ou mobile" com sincronização de dados — e na prática atende melhor, porque demonstra integração entre as duas plataformas.

### 6.5 Envio de dado sensível para modelo de IA

Os relatos do paciente são dado de saúde. Enviá-los a um serviço de IA exige consentimento específico, informado e destacado. Considerar pseudonimização antes do envio.

---

## 7. Restrições legais e éticas (tratar como requisitos)

| Fonte | Implicação de projeto |
|-------|----------------------|
| **LGPD (Lei 13.709/2018), art. 11** | Dados de saúde são dados pessoais sensíveis. Exigem base legal específica, consentimento destacado e finalidade declarada |
| **Resolução CFP nº 9/2024** | Regulamenta o exercício da Psicologia mediado por tecnologias digitais. Revogou as Resoluções 11/2018 e 4/2020 e encerrou o cadastro e-Psi. Exige sigilo, registro documental e contrato de prestação de serviços |
| **Código de Ética, art. 20** | Toda divulgação pública de serviços psicológicos deve informar nome completo, CRP e número de registro → obrigatório no perfil do catálogo |
| **Nota Técnica CFP nº 1/2022** | A responsabilidade ética pela divulgação permanece do profissional mesmo em plataformas coletivas → perfil é editado e aprovado pelo próprio psicólogo, nunca gerado automaticamente |
| **Orientações de CRPs sobre divulgação** | Valores de honorários têm restrições de divulgação → sem ordenação por preço, sem "promoções", sem comparação de valores no catálogo |
| **Nota Técnica CRP-PR 002/2022** | Recomenda que profissionais se vinculem apenas a plataformas com psicólogo como Responsável Técnico registrado no CRP → limitação conhecida do modelo, a ser citada na documentação |

### 7.1 Requisitos de segurança derivados

- Criptografia em trânsito (TLS) e em repouso para relatos, mensagens e prontuário.
- Controle de acesso por papel; psicólogo só acessa dados de pacientes com vínculo ativo.
- Trilha de auditoria de acessos ao prontuário.
- Consentimento versionado, com registro de data e versão aceita.
- Política de retenção e exclusão de dados.
- Transparência explícita sobre o uso de IA sobre os relatos.
- **Código de convite não sequencial**, gerado aleatoriamente, com alfabeto sem caracteres ambíguos (sem `0/O`, `1/I/l`), uso único, expiração e limite de tentativas por dispositivo. Código previsível permitiria a um terceiro se vincular ao psicólogo de outra pessoa.
- **Relato privado nunca sai do escopo do paciente**: não é enviado ao serviço de IA, não aparece em nenhuma consulta do app do psicólogo e não entra em exportações. A regra vive na camada de dados, não só na interface.

---

## 8. Pendências

### 8.1 Decisões de produto em aberto

Resolvidas: medicação (DEC-10), formato do convite (DEC-11), privacidade dos relatos (DEC-12, DEC-13, DEC-14, DEC-15). Restam:

1. **Plataforma de cada app** — confirmar a proposta de 6.4 (psicólogo web, paciente mobile).
2. **Critérios de busca do catálogo** — abordagem, especialidade, modalidade, região? Sem preço.
3. **Validade e revogação do código de convite** — prazo de expiração e possibilidade de o psicólogo revogar um código ainda não usado.

### 8.2 Definições técnicas em aberto

- Stack de frontend web
- Stack mobile
- Stack de backend
- Banco de dados
- Provedor e modelo de IA
- Serviço de notificações push
- Repositório e ferramenta de board Scrum
- Padrão de commits e branches
- Idioma do código (variáveis, tabelas)

### 8.3 Definições de equipe em aberto

- Divisão de papéis (Scrum Master, Product Owner, devs)
- Distribuição de trabalho entre os dois apps
- Cronograma das 3 sprints com datas

---

## 9. Próximos passos

| # | Passo | Status |
|---|-------|--------|
| 1 | Definir MVP | ✅ Concluído (seção 4) |
| 2 | Formalizar pesquisa de campo: roteiro, dores, 2 personas | ⬜ Pendente |
| 3 | Escrever RF e RNF numerados com prioridade MoSCoW | ⬜ Pendente |
| 4 | Diagrama de casos de uso | ⬜ Pendente |
| 5 | MER e DER | ⬜ Pendente |
| 6 | Wireframes das telas principais | ⬜ Pendente |
| 7 | Fechar stack, repositório, board e papéis | ⬜ Pendente |

**Entregáveis da Sprint 1 conforme o escopo oficial:** Documento de Requisitos · Diagramas iniciais (MER, DER) · Wireframes ou mockups da interface.

---

## 10. Glossário

| Termo | Definição |
|-------|-----------|
| **Relato** | Registro livre feito pelo paciente sobre situações da semana |
| **Tarefa** | Atividade prescrita pelo psicólogo ao paciente entre sessões |
| **Análise semanal** | Resumo gerado por IA a partir dos relatos, sob solicitação do psicólogo |
| **Vínculo** | Relação formal entre um paciente e um psicólogo na plataforma |
| **Convite** | Mecanismo pelo qual o psicólogo traz um paciente já atendido para a plataforma |
| **Catálogo** | Listagem pública de profissionais disponível apenas a pacientes sem vínculo ativo |
