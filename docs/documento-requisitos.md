# Documento de Requisitos

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
**Calmind** — Saúde Mental & Acolhimento
Plataforma de apoio à relação paciente/psicólogo
Entregável da Sprint 1

---

## 1. Objetivo deste documento

Este documento especifica os requisitos funcionais e não funcionais da plataforma, numerados e priorizados por MoSCoW, e serve de contrato de escopo entre o grupo, o orientador e a banca. Ele responde O QUE o sistema faz e SOB QUE RESTRIÇÕES, não COMO será construído: nenhuma linguagem, framework, banco de dados ou provedor aparece aqui, porque essa definição pertence à documentação técnica e segue aberta na pendência 8.2 do documento base.

A fonte de tudo o que está escrito aqui é o `documento-base-sprint1.md`, que consolida a pesquisa de campo, a visão do produto, as decisões tomadas com suas justificativas e as restrições legais. Todo requisito é rastreável a uma dor levantada em campo (D-01 a D-06), a uma funcionalidade do MVP (P-0x, S-0x), a uma decisão registrada (DEC-01 a DEC-15) ou a uma restrição legal e ética da seção 7 daquele documento. O que precisou ser derivado para fechar um fluxo está marcado como "derivado" e explicado nas seções de assunções.

## 2. Visão do produto

A pesquisa de campo com três entrevistadas sem relação entre si, duas psicólogas e uma paciente, apontou dores convergentes: comunicação fragmentada entre as sessões, agendamento manual sujeito a esquecimento, baixa adesão às tarefas prescritas, tempo de sessão gasto em recapitulação e ausência de ferramentas de apoio para os dois lados.

A hipótese central do produto é que a qualidade do tratamento depende tanto do que acontece na sessão quanto do que acontece entre as sessões, e é justamente esse intervalo que não tem ferramenta. A plataforma ataca esse intervalo.

São dois aplicativos distintos sobre um backend e uma base de dados compartilhados. O aplicativo do paciente concentra registro, lembretes e execução. O aplicativo do psicólogo concentra gestão, atribuição de tarefas e preparação de sessão. A plataforma opera em dois modos: como ferramenta de continuidade, quando o paciente já tem psicólogo e entra por convite, e como facilitador de acesso, quando o paciente busca um profissional no catálogo.

O ciclo semanal é o coração do produto: o psicólogo atribui tarefas após a sessão, o paciente registra relatos livres ao longo da semana e cumpre as tarefas, o psicólogo solicita a análise de IA antes da próxima sessão, revisa o resumo e prepara a pauta. A IA é acionada por decisão humana, nunca automaticamente.

## 3. Atores

| Ator | Descrição |
|------|-----------|
| Paciente | Usuário em acompanhamento psicológico. No máximo 1 vínculo ativo. |
| Psicólogo | Profissional com registro no conselho regional validado. Pode ter N pacientes. |
| Administrador | Perfil interno. Aprova cadastros profissionais e trata denúncias. |
| Responsável legal | **Não é ator do sistema.** Não tem conta, não autentica e não acessa nenhuma tela. Existe como dado de contato no cadastro do paciente menor de 18 anos (RF-01) e como sujeito do consentimento que o psicólogo registra (RF-49). A devolutiva a ele acontece fora da plataforma, por decisão clínica do profissional. |
| Serviço de IA | Não é ator de caso de uso: é componente acionado por outro ator, e nunca age por iniciativa própria. |

## 4. Convenções de leitura

**Numeração.** Requisitos funcionais recebem identificador RF-nn, contínuo e único em todo o documento, sem reinício por seção. Requisitos não funcionais recebem RNF-nn, na mesma regra. Um identificador nunca é reaproveitado: se um requisito for descartado em sprint futura, o número fica vago e o motivo é registrado.

**Prioridade MoSCoW.**

| Faixa | Significado no contexto deste projeto |
|-------|---------------------------------------|
| Must | Sem isso a entrega não é aceitável: o MVP não fecha ou uma restrição legal é violada. |
| Should | Importante e desejado, mas o ciclo semanal roda e a hipótese central é demonstrada sem ele. |
| Could | Desejável, entra se houver folga nas 3 sprints. |
| Won't | Declarado fora deste ciclo, com o motivo registrado. Não é esquecimento, é decisão. |

**Critérios de aceitação.** Cada requisito funcional traz critérios numerados CA-nn.n, escritos no formato "dado, quando, então", e ao menos um deles cobre caminho negativo ou de exceção (erro, permissão negada, estado inválido). Requisito sem critério verificável não entra no documento.

**Critério de verificação dos RNF.** Cada requisito não funcional traz a forma de comprovar que foi atendido. Onde há número, ele é meta de projeto medida em ambiente de teste local com massa de dados fictícia, não compromisso de desempenho em produção nem medição de campo.

**Origem.** A coluna de origem aponta a dor, a funcionalidade de MVP, a decisão, a seção do documento base ou a norma que sustenta o requisito. "Derivado" indica requisito criado para fechar um fluxo ou uma exigência legal que o documento base cita sem detalhar.

---

## 5. Requisitos funcionais


### 5.1 Requisitos comuns à plataforma

Autenticação, consentimento, vínculo, chat, notificações e restrições transversais de escopo.

#### RF-01 Cadastrar conta de usuário

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Psicólogo |
| Prioridade | Must |
| Origem | P-01, S-01 |
| Descrição | O sistema permite que um novo usuário crie conta informando dados de identificação, data de nascimento e credenciais, escolhendo o perfil de paciente ou de psicólogo no momento do cadastro. Para paciente com menos de 18 anos, exige também o contato de um responsável legal. |

**Critérios de aceitação**
- CA-01.1 Dado um visitante na tela de cadastro, quando ele informa dados válidos e escolhe o perfil, então o sistema cria a conta e a associa exclusivamente a esse perfil.
- CA-01.2 Dado um visitante que informa um identificador de acesso já cadastrado, quando confirma o cadastro, então o sistema recusa a criação e informa que o identificador já está em uso, sem revelar dados da conta existente.
- CA-01.3 Dado um visitante que deixa campo obrigatório em branco ou informa formato inválido, quando confirma o cadastro, então o sistema bloqueia a criação e aponta cada campo com problema.
- CA-01.4 Dado um visitante que informa data de nascimento correspondente a menos de 12 anos completos, quando confirma o cadastro de paciente, então o sistema recusa a criação, informa que a idade mínima de uso é 12 anos e não armazena os demais dados informados.
- CA-01.5 Dado um visitante com idade entre 12 e 17 anos completos, quando confirma o cadastro de paciente, então o sistema exige nome, telefone e grau de parentesco de um responsável legal, e bloqueia a criação enquanto os três não estiverem preenchidos.
- CA-01.6 Dado um paciente cadastrado como menor de idade, quando ele completa 18 anos, então o contato do responsável deixa de ser exigido e permanece no histórico do cadastro, sem exclusão automática.

#### RF-02 Autenticar usuário

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Psicólogo / Administrador |
| Prioridade | Must |
| Origem | P-01, S-01 |
| Descrição | O sistema autentica o usuário antes de liberar qualquer funcionalidade e encerra a sessão por logout ou por expiração de inatividade. |

**Critérios de aceitação**
- CA-02.1 Dado um usuário com conta ativa, quando informa credenciais corretas, então o sistema abre sessão e apresenta a tela inicial correspondente ao perfil dele.
- CA-02.2 Dado um usuário que informa credenciais incorretas, quando tenta autenticar, então o sistema nega o acesso com mensagem genérica, sem indicar se o erro foi no identificador ou na senha.
- CA-02.3 Dado um usuário não autenticado, quando tenta acessar diretamente qualquer área interna, então o sistema bloqueia o acesso e o direciona para a autenticação.

#### RF-03 Registrar consentimento de tratamento de dados de saúde

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Psicólogo / Sistema |
| Prioridade | Must |
| Origem | Seção 7 (LGPD art. 11), 7.1 |
| Descrição | O sistema exige aceite explícito e destacado do termo de tratamento de dados antes de liberar o uso, registrando data, hora e versão do termo aceita. |

**Critérios de aceitação**
- CA-03.1 Dado um usuário recém cadastrado, quando acessa a plataforma pela primeira vez, então o sistema apresenta o termo com a finalidade declarada e só libera as demais funcionalidades após aceite explícito.
- CA-03.2 Dado um usuário que recusa o termo, quando confirma a recusa, então o sistema mantém todas as funcionalidades clínicas bloqueadas e oferece apenas encerrar a sessão ou excluir a conta.
- CA-03.3 Dado um usuário que já aceitou a versão anterior do termo, quando uma nova versão está publicada, então o sistema solicita novo aceite e preserva o registro do aceite anterior com sua data e versão.

#### RF-04 Registrar consentimento específico para análise por serviço de IA

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Sistema |
| Prioridade | Must |
| Origem | 6.5, 7.1, DEC-04 |
| Descrição | O sistema exige do paciente um consentimento próprio, separado e destacado, autorizando que relatos compartilhados sejam submetidos ao serviço de IA, e permite revogar essa autorização a qualquer momento. |

**Critérios de aceitação**
- CA-04.1 Dado um paciente com vínculo ativo, quando ele concede o consentimento de uso de IA, então o sistema registra data, hora e versão do texto consentido separadamente do consentimento geral de RF-03.
- CA-04.2 Dado um paciente que não concedeu ou que revogou o consentimento de IA, quando o psicólogo solicita a análise semanal, então o sistema recusa a solicitação e informa o profissional de que não há autorização vigente, sem expor conteúdo de relato.
- CA-04.3 Dado um paciente que revoga o consentimento, quando a revogação é confirmada, então o sistema deixa de submeter novos relatos ao serviço de IA a partir daquele instante e mantém o registro da revogação.

#### RF-05 Controlar acesso por papel e por vínculo ativo

| Campo | Conteúdo |
|-------|----------|
| Ator | Sistema |
| Prioridade | Must |
| Origem | DEC-01, 7.1 |
| Descrição | O sistema restringe cada funcionalidade e cada dado ao papel autorizado, e o psicólogo só acessa dados de pacientes com quem tem vínculo ativo ou com quem teve vínculo encerrado. |

**Critérios de aceitação**
- CA-05.1 Dado um psicólogo autenticado, quando consulta a lista de pacientes, então o sistema retorna somente pacientes com vínculo ativo ou encerrado com ele.
- CA-05.2 Dado um psicólogo que tenta acessar dados clínicos de um paciente com quem nunca teve vínculo, quando a requisição é feita por qualquer caminho da aplicação, então o sistema nega o acesso e registra a tentativa.
- CA-05.3 Dado um usuário com perfil de paciente, quando tenta acessar funcionalidade exclusiva do psicólogo ou do administrador, então o sistema nega o acesso.

#### RF-06 Gerar código de convite

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | S-03, DEC-11, 7.1 |
| Descrição | O sistema gera, a pedido do psicólogo, um código de convite aleatório, de uso único, com prazo de expiração, formado por alfabeto sem caracteres ambíguos, para que um paciente já atendido ingresse na plataforma vinculado a ele. |

**Critérios de aceitação**
- CA-06.1 Dado um psicólogo com cadastro aprovado, quando solicita um novo convite, então o sistema apresenta um código que não contém os caracteres `0`, `O`, `1`, `I` e `l`, e informa a data de expiração.
- CA-06.2 Dado um conjunto de códigos gerados em sequência pelo mesmo psicólogo, quando os códigos são comparados, então não existe relação previsível entre eles que permita deduzir o próximo.
- CA-06.3 Dado um psicólogo com cadastro ainda não aprovado pelo administrador, quando tenta gerar convite, então o sistema recusa a geração e informa que o cadastro está pendente de aprovação.

#### RF-07 Ingressar por código de convite

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Must |
| Origem | P-02, DEC-11, 7.1 |
| Descrição | O sistema permite ao paciente digitar um código de convite e, se o código for válido, criar vínculo ativo com o psicólogo que o emitiu, invalidando o código no mesmo ato. |

**Critérios de aceitação**
- CA-07.1 Dado um paciente sem vínculo ativo, quando digita um código válido e não expirado, então o sistema cria o vínculo em estado ativo e marca o código como consumido.
- CA-07.2 Dado um código já consumido, expirado, revogado ou inexistente, quando o paciente o digita, então o sistema recusa o ingresso com mensagem única, sem informar qual das condições ocorreu nem a qual profissional o código pertencia.
- CA-07.3 Dado um paciente que erra o código acima do limite de tentativas definido para o dispositivo, quando tenta novamente, então o sistema bloqueia temporariamente novas tentativas a partir daquele dispositivo.
- CA-07.4 Dado um paciente que já possui vínculo ativo, quando digita um código válido, então o sistema recusa o ingresso e informa que é preciso encerrar o vínculo atual antes.

#### RF-08 Revogar código de convite não utilizado

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Should |
| Origem | 8.1 item 3 (pendência, hipótese conservadora) |
| Descrição | O sistema permite ao psicólogo revogar um código de convite que ainda não foi consumido, tornando o código inutilizável imediatamente. |

**Critérios de aceitação**
- CA-08.1 Dado um convite em estado não consumido, quando o psicólogo aciona a revogação, então o sistema marca o código como revogado e ele deixa de ser aceito no ingresso.
- CA-08.2 Dado um convite já consumido por um paciente, quando o psicólogo tenta revogá-lo, então o sistema recusa a operação e informa que o convite já gerou vínculo, indicando que o caminho é o encerramento de vínculo.
- CA-08.3 Dado um convite revogado, quando o psicólogo consulta a lista de convites emitidos, então o código aparece com a situação revogada e a data da revogação.

#### RF-09 Consultar catálogo de profissionais

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Must |
| Origem | P-03, DEC-02, DEC-06, seção 7 (art. 20, orientações de CRPs), 8.1 item 2 |
| Descrição | O sistema apresenta ao paciente sem vínculo ativo a lista de psicólogos com perfil aprovado, com filtros por abordagem, especialidade, modalidade de atendimento e região, exibindo nome completo e número de registro CRP de cada profissional. |

**Critérios de aceitação**
- CA-09.1 Dado um paciente sem vínculo ativo, quando abre o catálogo, então o sistema lista apenas profissionais com cadastro aprovado e perfil publicado, cada um exibindo nome completo e número de CRP.
- CA-09.2 Dado um paciente com vínculo ativo, quando tenta acessar o catálogo por qualquer caminho da aplicação, então o sistema nega o acesso e informa que a busca é liberada após o encerramento do vínculo.
- CA-09.3 Dado o catálogo exibido, quando a lista é apresentada ou ordenada, então nenhuma informação de honorário, promoção, nota, estrela ou classificação comparativa é apresentada nem serve de critério de ordenação.
- CA-09.4 Dado um paciente que aplica filtros sem resultado correspondente, quando a busca é executada, então o sistema informa a ausência de resultados e mantém os filtros para ajuste.

#### RF-10 Solicitar vínculo a partir do catálogo

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Must |
| Origem | P-04, 3.2 |
| Descrição | O sistema permite ao paciente sem vínculo ativo solicitar vínculo a um profissional do catálogo, criando o vínculo em estado pendente até a resposta do psicólogo. |

**Critérios de aceitação**
- CA-10.1 Dado um paciente sem vínculo ativo, quando solicita vínculo a um profissional, então o sistema cria o vínculo em estado pendente e notifica o psicólogo.
- CA-10.2 Dado um paciente com solicitação pendente para um profissional, quando tenta solicitar vínculo a outro profissional, então o sistema recusa a nova solicitação enquanto houver solicitação pendente.
- CA-10.3 Dado um vínculo em estado pendente, quando o paciente consulta a própria situação, então o sistema exibe o estado pendente e permite cancelar a solicitação.

#### RF-11 Responder solicitação de vínculo

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | S-11, 3.2 |
| Descrição | O sistema permite ao psicólogo aceitar ou recusar uma solicitação de vínculo pendente, promovendo o vínculo a ativo no aceite e encerrando a solicitação na recusa. |

**Critérios de aceitação**
- CA-11.1 Dado um vínculo pendente, quando o psicólogo aceita, então o sistema passa o vínculo a ativo e libera chat, relatos, tarefas e agenda para as duas partes.
- CA-11.2 Dado um vínculo pendente, quando o psicólogo recusa, então o sistema encerra a solicitação, notifica o paciente e mantém o catálogo acessível a ele.
- CA-11.3 Dado um vínculo já respondido ou cancelado pelo paciente, quando o psicólogo tenta responder novamente, então o sistema recusa a operação e informa que a solicitação não está mais pendente.

#### RF-12 Garantir vínculo ativo único por paciente

| Campo | Conteúdo |
|-------|----------|
| Ator | Sistema |
| Prioridade | Must |
| Origem | DEC-03, DEC-02, 3.2 |
| Descrição | O sistema impede que um paciente tenha mais de um vínculo ativo simultâneo e não impõe limite de pacientes por psicólogo. |

**Critérios de aceitação**
- CA-12.1 Dado um paciente sem vínculo ativo, quando um vínculo é criado por convite ou por aceite de solicitação, então o sistema registra esse vínculo como o único ativo do paciente.
- CA-12.2 Dado um paciente já com vínculo ativo, quando qualquer caminho tenta criar um segundo vínculo ativo, então o sistema recusa a operação e mantém o vínculo existente inalterado.
- CA-12.3 Dado um psicólogo com N pacientes ativos, quando aceita mais uma solicitação, então o sistema cria o vínculo sem impor teto de pacientes.

#### RF-13 Encerrar vínculo

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Psicólogo |
| Prioridade | Must |
| Origem | P-04, 3.2 |
| Descrição | O sistema permite que qualquer uma das partes encerre o vínculo ativo, mediante confirmação, passando o vínculo ao estado encerrado e liberando o catálogo ao paciente. |

**Critérios de aceitação**
- CA-13.1 Dado um vínculo ativo, quando uma das partes confirma o encerramento, então o sistema marca o vínculo como encerrado, registra data e autor do encerramento e notifica a outra parte.
- CA-13.2 Dado um vínculo encerrado, quando qualquer das partes tenta enviar mensagem, criar tarefa, agendar consulta ou registrar medicação nesse vínculo, então o sistema recusa a operação.
- CA-13.3 Dado um paciente cujo vínculo foi encerrado, quando ele abre a busca de profissionais, então o sistema libera o catálogo.

#### RF-14 Preservar histórico de vínculos encerrados

| Campo | Conteúdo |
|-------|----------|
| Ator | Sistema |
| Prioridade | Must |
| Origem | 3.2, seção 7 (Resolução CFP 9/2024, registro documental) |
| Descrição | O sistema mantém, após o encerramento, o vínculo e os dados clínicos produzidos nele em modo somente leitura para as duas partes, sem apagamento automático. |

**Critérios de aceitação**
- CA-14.1 Dado um vínculo encerrado, quando o psicólogo consulta o histórico, então o sistema exibe relatos compartilhados, tarefas, consultas e registros de medicação daquele período em modo somente leitura.
- CA-14.2 Dado um vínculo encerrado, quando o paciente inicia novo vínculo com outro profissional, então o novo psicólogo não acessa nenhum dado do vínculo anterior.
- CA-14.3 Dado um vínculo encerrado, quando qualquer usuário tenta excluir o histórico pela aplicação, então o sistema recusa a exclusão e direciona ao processo de exclusão de dados previsto em RF-47.

#### RF-15 Trocar mensagens em chat assíncrono

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Psicólogo |
| Prioridade | Must |
| Origem | D-01, P-05, S-10 |
| Descrição | O sistema oferece um canal de mensagens assíncronas entre paciente e psicólogo dentro do vínculo ativo, com histórico ordenado por data e marcação de mensagens não lidas. |

**Critérios de aceitação**
- CA-15.1 Dado um vínculo ativo, quando uma das partes envia mensagem, então o sistema registra a mensagem com autor e data, exibe no histórico das duas partes e sinaliza como não lida para o destinatário.
- CA-15.2 Dado um usuário sem vínculo ativo com o destinatário, quando tenta enviar mensagem, então o sistema recusa o envio.
- CA-15.3 Dado um envio interrompido por falha de comunicação, quando a operação não se completa, então o sistema informa a falha e não exibe a mensagem como entregue.

#### RF-16 Notificar eventos relevantes

| Campo | Conteúdo |
|-------|----------|
| Ator | Sistema |
| Prioridade | Must |
| Origem | D-02, D-03, P-10 |
| Descrição | O sistema notifica os usuários sobre eventos do ciclo semanal: nova mensagem, nova tarefa atribuída, tarefa prestes a vencer, consulta próxima, lembrete de medicação, solicitação e resposta de vínculo. |

**Critérios de aceitação**
- CA-16.1 Dado um evento notificável, quando ele ocorre, então o sistema envia notificação ao destinatário correto contendo apenas o tipo do evento, sem conteúdo clínico no texto da notificação.
- CA-16.2 Dado um usuário que desativou determinado tipo de notificação nas preferências, quando o evento ocorre, então o sistema não envia a notificação daquele tipo e mantém o registro do evento na aplicação.
- CA-16.3 Dado um destinatário sem permissão de notificação concedida no dispositivo, quando o evento ocorre, então o sistema mantém o evento visível dentro da aplicação e não trata a falha de entrega como perda do evento.

#### RF-17 Registrar trilha de auditoria de acesso a dados clínicos

| Campo | Conteúdo |
|-------|----------|
| Ator | Sistema |
| Prioridade | Should |
| Origem | 7.1 |
| Descrição | O sistema registra em trilha de auditoria cada acesso a prontuário, relato compartilhado e registro de medicação, guardando quem acessou, o que acessou e quando. |

**Critérios de aceitação**
- CA-17.1 Dado um psicólogo que abre o prontuário de um paciente, quando o acesso ocorre, então o sistema grava um registro de auditoria com identificação do profissional, do paciente, do recurso e do momento.
- CA-17.2 Dado um acesso negado por falta de vínculo, quando a tentativa ocorre, então o sistema grava o registro da tentativa negada.
- CA-17.3 Dado qualquer usuário da plataforma, quando tenta alterar ou apagar registros da trilha pela aplicação, então o sistema recusa a operação.

#### RF-18 Registrar denúncia de conduta

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Psicólogo |
| Prioridade | Should |
| Origem | 2.1 (Administrador trata denúncias) |
| Descrição | O sistema permite que um usuário denuncie conduta inadequada da outra parte do vínculo ou de um perfil do catálogo, encaminhando a denúncia ao administrador. |

**Critérios de aceitação**
- CA-18.1 Dado um usuário autenticado, quando registra denúncia informando motivo e descrição, então o sistema cria a denúncia em estado aberto e a torna visível ao administrador.
- CA-18.2 Dado um usuário que registra denúncia sem informar o motivo, quando confirma o envio, então o sistema recusa o registro e sinaliza o campo obrigatório.
- CA-18.3 Dado um denunciante, quando consulta a denúncia enviada, então o sistema exibe apenas a situação dela, sem expor dados de contato ou conteúdo clínico do denunciado.

#### RF-48 Registrar o aceite do contrato de prestação de serviços

> RF-48 foi criado na consolidação do documento, para dar contrapartida funcional ao RNF-24. A numeração segue a ordem de criação, não a posição no texto.

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Psicólogo |
| Prioridade | Should |
| Origem | Seção 7 (Resolução CFP nº 9/2024), RNF-24 |
| Descrição | O sistema apresenta às duas partes o contrato de prestação de serviços na ativação do vínculo e registra o aceite de cada uma, com data, hora e versão do texto aceito. |

**Critérios de aceitação**
- CA-48.1 Dado um vínculo recém ativado, quando cada parte acessa o vínculo pela primeira vez, então o sistema apresenta o contrato vigente e registra o aceite daquela parte com data, hora e versão.
- CA-48.2 Dado um vínculo ativo cujo contrato ainda não foi aceito pelas duas partes, quando qualquer das partes consulta a situação do vínculo, então o sistema sinaliza o aceite pendente e identifica qual parte falta, sem bloquear o atendimento em curso.
- CA-48.3 Dado uma nova versão do contrato publicada, quando o vínculo segue ativo, então o sistema solicita novo aceite e preserva o registro do aceite anterior com sua data e versão.
- CA-48.4 Dado um vínculo encerrado, quando qualquer das partes consulta o histórico, então o sistema exibe a versão do contrato vigente naquele período em modo somente leitura.

#### RF-49 Registrar o consentimento do responsável legal de paciente menor de idade

> RF-49 foi criado em 20/08/2026, quando o grupo decidiu que o produto atende a partir dos 12 anos. A numeração segue a ordem de criação, não a posição no texto.

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | Seção 7 (LGPD art. 14), DEC-16, DEC-17, DEC-18, RF-03 |
| Descrição | Para paciente com menos de 18 anos, o sistema exige que o psicólogo registre que obteve do responsável legal o consentimento para o tratamento de dados de saúde, informando data, forma de obtenção e versão do termo vigente. O responsável não acessa a plataforma: o consentimento é obtido fora dela e registrado pelo profissional, mesmo padrão adotado em DEC-10 para a medicação prescrita por médico. |

**Critérios de aceitação**
- CA-49.1 Dado um vínculo ativo com paciente menor de 18 anos, quando o psicólogo registra o consentimento do responsável, então o sistema grava data de obtenção, forma, versão do termo vigente e a identificação do profissional que registrou.
- CA-49.2 Dado um vínculo ativo com paciente menor de 18 anos e sem consentimento do responsável registrado, quando o psicólogo solicita a análise por serviço de IA, então o sistema recusa a solicitação e informa qual registro está faltando.
- CA-49.3 Dado um registro de consentimento de responsável já gravado, quando o psicólogo o consulta, então o sistema exibe quem registrou e quando, e não permite editar o registro existente, apenas acrescentar um novo.
- CA-49.4 Dado um paciente com 18 anos ou mais, quando o psicólogo abre o vínculo, então o sistema não apresenta o registro de consentimento de responsável, por não se aplicar.
- CA-49.5 Dado um vínculo com paciente menor de idade cujo registro de consentimento está ausente, quando o psicólogo acessa o vínculo, então o sistema sinaliza a pendência sem bloquear o atendimento em curso.

#### RF-19 Avaliar e ranquear psicólogos no catálogo

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Won't |
| Origem | DEC-06, seção 7 (orientações de CRPs sobre divulgação) |
| Descrição | Fora deste ciclo. A plataforma não oferece avaliação, nota, estrela, comentário público ou ordenação comparativa de profissionais, porque isso transformaria a escolha de tratamento em ranking comercial, incompatível com a lógica ética da profissão. |

**Critérios de aceitação**
- CA-19.1 Dado o catálogo em qualquer estado, quando um perfil é exibido, então nenhuma nota, média, estrela, contagem de avaliações ou comentário público de paciente é apresentado.
- CA-19.2 Dado um paciente que encerra um vínculo, quando o encerramento se conclui, então o sistema não solicita avaliação do profissional nem oferece campo para isso.

#### RF-20 Processar pagamentos na plataforma

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Won't |
| Origem | DEC-07 |
| Descrição | Fora deste ciclo. A plataforma não intermedia cobrança, pagamento, repasse ou registro de honorários, por estar fora do escopo pedagógico e por adicionar superfície regulatória desnecessária. |

**Critérios de aceitação**
- CA-20.1 Dado qualquer fluxo da plataforma, quando o usuário navega por ele, então nenhuma tela solicita dado de cartão, conta bancária ou instrumento de pagamento.
- CA-20.2 Dado o perfil do catálogo, quando é exibido ao paciente, então nenhum valor de honorário é apresentado nem serve de critério de busca ou ordenação.

#### RF-21 Realizar sessão por vídeo na plataforma

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Psicólogo |
| Prioridade | Won't |
| Origem | DEC-08 |
| Descrição | Fora deste ciclo. A plataforma atua no intervalo entre as sessões e não hospeda atendimento por vídeo ou áudio em tempo real. |

**Critérios de aceitação**
- CA-21.1 Dado um vínculo ativo, quando as partes acessam o canal de comunicação, então apenas troca assíncrona de mensagens está disponível, sem chamada de vídeo ou de voz.
- CA-21.2 Dado o agendamento de consulta, quando a consulta é registrada, então o sistema apenas informa data, hora e modalidade acordada fora da plataforma, sem gerar sala de atendimento.

---

### 5.2 Requisitos do aplicativo do paciente

#### RF-22 Registrar relato no diário com marcação de compartilhamento

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Must |
| Origem | D-01, D-04, P-06, DEC-12, DEC-13 |
| Descrição | O sistema permite ao paciente registrar relatos livres ao longo da semana e definir, no momento da postagem, se cada relato é compartilhado com o psicólogo ou privado, com o padrão em compartilhado. |

**Critérios de aceitação**
- CA-22.1 Dado um paciente com vínculo ativo, quando abre a tela de novo relato, então o sistema apresenta a marcação de compartilhamento já selecionada como compartilhado e visível antes da confirmação.
- CA-22.2 Dado um paciente que altera a marcação para privado e confirma, quando o relato é gravado, então o sistema o registra como privado e sinaliza essa condição na listagem do próprio paciente.
- CA-22.3 Dado um relato já publicado, quando o paciente tenta alterá-lo de privado para compartilhado, então o sistema recusa a mudança nesse sentido e orienta a criar um novo relato compartilhado.
- CA-22.4 Dado um paciente sem vínculo ativo, quando tenta registrar relato, então o sistema recusa o registro e informa que é preciso ter vínculo ativo.

#### RF-23 Isolar relato privado de qualquer visão do psicólogo e do serviço de IA

| Campo | Conteúdo |
|-------|----------|
| Ator | Sistema |
| Prioridade | Must |
| Origem | DEC-12, DEC-14, 7.1 |
| Descrição | O sistema impede que relato marcado como privado seja lido, contado, sinalizado, submetido ao serviço de IA ou incluído em exportações, de modo que nem o conteúdo nem a existência do relato privado seja perceptível ao psicólogo. |

**Critérios de aceitação**
- CA-23.1 Dado um paciente com relatos privados e compartilhados na mesma semana, quando o psicólogo abre o prontuário, então o sistema exibe somente os relatos compartilhados e nenhuma marca, lacuna, contagem ou espaço reservado indica a existência dos privados.
- CA-23.2 Dado um psicólogo que consulta a contagem de relatos do período, quando o número é exibido, então ele corresponde apenas à quantidade de relatos compartilhados.
- CA-23.3 Dado o acionamento da análise semanal, quando o conjunto de relatos é submetido ao serviço de IA, então nenhum relato privado integra o conjunto enviado.
- CA-23.4 Dado qualquer exportação de dados do vínculo gerada para o psicólogo, quando o arquivo é produzido, então nenhum relato privado consta do resultado.
- CA-23.5 Dado um psicólogo que tenta acessar diretamente o identificador de um relato privado, quando a requisição é feita, então o sistema responde como recurso inexistente e registra a tentativa na trilha de auditoria.

#### RF-24 Despublicar relato compartilhado

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Must |
| Origem | DEC-15 |
| Descrição | O sistema permite ao paciente retirar o compartilhamento de um relato já publicado, avisando de forma explícita quando o relato já foi utilizado em uma análise semanal ou já pode ter sido lido pelo profissional. |

**Critérios de aceitação**
- CA-24.1 Dado um relato compartilhado, quando o paciente confirma a despublicação, então o sistema deixa de exibi-lo ao psicólogo a partir daquele momento e o relato passa a seguir todas as regras de RF-23.
- CA-24.2 Dado um relato que já foi incluído em uma análise semanal, quando o paciente aciona a despublicação, então o sistema exibe aviso, antes da confirmação, de que o relato já foi usado em análise e que o profissional pode já tê-lo lido, sem prometer apagamento retroativo.
- CA-24.3 Dado um relato despublicado, quando o psicólogo recarrega o prontuário, então o relato não aparece e nenhuma marca de remoção é exibida no lugar dele.

#### RF-25 Visualizar e concluir tarefas

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Must |
| Origem | D-03, P-07 |
| Descrição | O sistema apresenta ao paciente as tarefas atribuídas pelo psicólogo em formato de cards, com título, descrição e prazo, e permite marcar cada tarefa como concluída. |

**Critérios de aceitação**
- CA-25.1 Dado um paciente com tarefas atribuídas, quando abre a lista de tarefas, então o sistema exibe as pendentes separadas das concluídas, com prazo visível em cada card.
- CA-25.2 Dado um paciente que marca uma tarefa como concluída, quando confirma, então o sistema registra data e hora da conclusão e torna o estado visível ao psicólogo.
- CA-25.3 Dado uma tarefa já concluída, quando o paciente tenta concluí-la de novo, então o sistema mantém o registro original de conclusão e não cria duplicidade.
- CA-25.4 Dado uma tarefa de um vínculo encerrado, quando o paciente tenta concluí-la, então o sistema recusa a alteração e mantém a tarefa em modo somente leitura.

#### RF-26 Visualizar calendário de consultas

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Must |
| Origem | D-02, P-08 |
| Descrição | O sistema apresenta ao paciente as consultas agendadas pelo psicólogo em visão de calendário e em lista, com data, hora e situação de cada consulta. |

**Critérios de aceitação**
- CA-26.1 Dado um paciente com consultas agendadas, quando abre o calendário, então o sistema exibe cada consulta com data, hora e situação atual.
- CA-26.2 Dado uma consulta cancelada ou reagendada pelo psicólogo, quando o paciente abre o calendário, então o sistema exibe a situação atualizada e o paciente recebe a notificação correspondente.
- CA-26.3 Dado um paciente que tenta criar, alterar ou excluir uma consulta, quando aciona a operação, então o sistema recusa, pois o agendamento é atribuição do psicólogo.

#### RF-27 Confirmar, recusar ou contestar registro de medicação

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Must |
| Origem | DEC-10, 6.2 |
| Descrição | O sistema exige que o paciente confirme um registro de medicação em uso antes que o lembrete de adesão entre em vigor, e permite que ele recuse ou conteste o registro, informando o motivo. |

**Critérios de aceitação**
- CA-27.1 Dado um registro de medicação criado pelo psicólogo, quando o paciente o confirma, então o sistema passa o registro ao estado ativo e habilita os lembretes de adesão.
- CA-27.2 Dado um registro de medicação aguardando confirmação, quando o paciente ainda não respondeu, então o sistema não dispara nenhum lembrete de adesão daquele registro.
- CA-27.3 Dado um registro de medicação, quando o paciente o recusa ou contesta informando o motivo, então o sistema mantém o registro fora do estado ativo, não dispara lembretes e torna a recusa e o motivo visíveis ao psicólogo.
- CA-27.4 Dado um paciente que tenta recusar sem informar motivo, quando confirma a recusa, então o sistema exige o preenchimento do motivo antes de gravar.

#### RF-28 Receber lembrete de adesão à medicação

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente / Sistema |
| Prioridade | Must |
| Origem | D-03, P-09, DEC-10, 6.2 |
| Descrição | O sistema envia ao paciente lembretes nos dias e horários registrados para cada medicação em uso ativa, e permite que ele marque a tomada como realizada. |

**Critérios de aceitação**
- CA-28.1 Dado um registro de medicação ativo com dias e horários definidos, quando chega o horário previsto, então o sistema envia o lembrete ao paciente.
- CA-28.2 Dado um lembrete recebido, quando o paciente marca a tomada como realizada, então o sistema registra data e hora da marcação.
- CA-28.3 Dado um registro de medicação suspenso, recusado ou aguardando confirmação, quando chega o horário previsto, então o sistema não envia lembrete.
- CA-28.4 Dado um lembrete não respondido pelo paciente, quando o horário passa, então o sistema não presume a tomada e mantém o período sem marcação.

#### RF-29 Suspender medicação em uso

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Must |
| Origem | DEC-10, 6.2 |
| Descrição | O sistema permite que o paciente suspenda por conta própria um registro de medicação ativo, interrompendo os lembretes, e torna a suspensão e sua data visíveis ao psicólogo por ser informação clínica relevante. |

**Critérios de aceitação**
- CA-29.1 Dado um registro de medicação ativo, quando o paciente confirma a suspensão, então o sistema passa o registro ao estado suspenso, interrompe os lembretes e registra data e autor da suspensão.
- CA-29.2 Dado um registro suspenso pelo paciente, quando o psicólogo abre o prontuário, então o sistema exibe a suspensão com a data e a indicação de que partiu do paciente.
- CA-29.3 Dado um registro de medicação já suspenso, quando o paciente tenta suspendê-lo de novo, então o sistema mantém o estado e o registro original da suspensão.
- CA-29.4 Dado o fluxo de suspensão em qualquer tela de medicação, quando ele é exibido, então o sistema mantém visível o aviso de que a plataforma não prescreve nem altera prescrição médica.

#### RF-30 Consultar histórico do próprio acompanhamento

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Should |
| Origem | 3.2 |
| Descrição | O sistema permite ao paciente consultar, em modo somente leitura, os relatos, tarefas, consultas e registros de medicação de vínculos já encerrados, identificando o profissional de cada período. |

**Critérios de aceitação**
- CA-30.1 Dado um paciente com vínculo encerrado, quando abre o histórico, então o sistema exibe os dados daquele período agrupados por vínculo, com o nome do profissional e as datas de início e encerramento.
- CA-30.2 Dado um item do histórico, quando o paciente tenta editá-lo ou excluí-lo, então o sistema recusa a alteração.
- CA-30.3 Dado um paciente sem nenhum vínculo encerrado, quando abre o histórico, então o sistema informa a ausência de registros anteriores.

#### RF-31 Exportar os próprios dados

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Could |
| Origem | Seção 7 (LGPD), 7.1, derivado |
| Descrição | O sistema permite que o paciente solicite a exportação dos próprios dados registrados na plataforma, incluindo seus relatos privados, que constam apenas na exportação destinada a ele. |

**Critérios de aceitação**
- CA-31.1 Dado um paciente autenticado, quando solicita a exportação, então o sistema gera um arquivo com relatos, tarefas, consultas e registros de medicação vinculados a ele e o disponibiliza somente a ele.
- CA-31.2 Dado uma exportação solicitada pelo psicólogo sobre o mesmo paciente, quando o arquivo é gerado, então relatos privados não constam do resultado, conforme RF-23.
- CA-31.3 Dado um usuário que tenta acessar o arquivo de exportação de outro usuário, quando a requisição é feita, então o sistema nega o acesso e registra a tentativa.

#### RF-32 Limitar o uso de outros aplicativos no dispositivo do paciente

| Campo | Conteúdo |
|-------|----------|
| Ator | Paciente |
| Prioridade | Won't |
| Origem | P-11, DEC-09, 6.1 |
| Descrição | Fora deste ciclo. O bloqueio ou limitação de outros aplicativos exige recursos de sistema operacional com política restritiva de loja e permissão especial de fabricante, inviável no prazo e no contexto acadêmico do projeto. Fica documentado como evolução futura, com a análise de viabilidade registrada na seção 6.1 do documento base. |

**Critérios de aceitação**
- CA-32.1 Dado o app do paciente em qualquer estado, quando o usuário percorre as funcionalidades, então nenhuma tela de limite, bloqueio ou monitoramento de uso de outros aplicativos é apresentada.
- CA-32.2 Dado o app do paciente na instalação, quando as permissões são solicitadas, então nenhuma permissão de monitoramento de uso ou de acessibilidade do sistema operacional é requerida.

---

### 5.3 Requisitos do aplicativo do psicólogo

#### RF-33 Cadastrar registro profissional com documento comprobatório

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | S-01, 6.3 |
| Descrição | O sistema exige do psicólogo, no cadastro, o número de registro CRP em formato válido e o envio de documento comprobatório, mantendo a conta pendente até aprovação do administrador. |

**Critérios de aceitação**
- CA-33.1 Dado um psicólogo em cadastro, quando informa número de CRP no formato esperado, incluindo a região, e anexa o documento comprobatório, então o sistema grava o cadastro no estado pendente de aprovação.
- CA-33.2 Dado um psicólogo que informa número de CRP em formato inválido ou com região inexistente, quando confirma o cadastro, então o sistema recusa e sinaliza o campo.
- CA-33.3 Dado um psicólogo que não anexa o documento comprobatório, quando confirma o cadastro, então o sistema recusa a conclusão.
- CA-33.4 Dado um psicólogo com cadastro pendente, quando autentica, então o sistema libera apenas a consulta da situação do cadastro e a edição dos dados enviados, bloqueando perfil, convites e pacientes.

#### RF-34 Editar e publicar o próprio perfil do catálogo

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | S-02, seção 7 (Código de Ética art. 20, Nota Técnica CFP 1/2022) |
| Descrição | O sistema permite que o psicólogo escreva, revise e publique o próprio perfil do catálogo, sempre exibindo nome completo e número de registro CRP, sem geração automática de conteúdo e sem publicação sem ação do profissional. |

**Critérios de aceitação**
- CA-34.1 Dado um psicólogo aprovado, quando edita o perfil e aciona a publicação, então o sistema publica o texto exatamente como escrito por ele e exibe nome completo e número de CRP.
- CA-34.2 Dado um psicólogo que nunca acionou a publicação, quando o catálogo é consultado por pacientes, então o perfil dele não aparece.
- CA-34.3 Dado o editor de perfil, quando o psicólogo escreve, então o sistema não gera, sugere nem completa o texto automaticamente e não altera o conteúdo publicado sem ação dele.
- CA-34.4 Dado um psicólogo que inclui valor de honorário ou expressão promocional no perfil, quando aciona a publicação, então o sistema bloqueia a publicação e indica a restrição de divulgação.

#### RF-35 Listar pacientes vinculados

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | S-04 |
| Descrição | O sistema apresenta ao psicólogo a lista dos pacientes com vínculo ativo, com indicação de pendências do ciclo semanal, e a lista separada dos vínculos encerrados. |

**Critérios de aceitação**
- CA-35.1 Dado um psicólogo com pacientes ativos, quando abre a lista, então o sistema exibe cada paciente com sinalização de mensagens não lidas, tarefas vencidas e próxima consulta.
- CA-35.2 Dado um psicólogo sem nenhum paciente, quando abre a lista, então o sistema informa a ausência de pacientes e oferece a geração de convite.
- CA-35.3 Dado um paciente com vínculo encerrado, quando o psicólogo abre a lista de ativos, então esse paciente não aparece nela e permanece acessível apenas no histórico em modo somente leitura.

#### RF-36 Consultar prontuário consolidado do paciente

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | D-04, S-05, 7.1 |
| Descrição | O sistema apresenta ao psicólogo a visão consolidada de um paciente vinculado, reunindo relatos compartilhados, situação das tarefas, consultas, registros de medicação e análises confirmadas, em ordem cronológica. |

**Critérios de aceitação**
- CA-36.1 Dado um paciente com vínculo ativo, quando o psicólogo abre o prontuário, então o sistema exibe relatos compartilhados, tarefas com situação, consultas, registros de medicação e análises confirmadas do período.
- CA-36.2 Dado a abertura do prontuário, quando o acesso ocorre, então o sistema grava o registro de auditoria previsto em RF-17.
- CA-36.3 Dado um psicólogo sem vínculo com o paciente, quando tenta abrir o prontuário por qualquer caminho, então o sistema nega o acesso.
- CA-36.4 Dado um paciente que possui relatos privados no período exibido, quando o prontuário é montado, então nenhum indício desses relatos aparece, conforme RF-23.
- CA-36.5 Dado um paciente vinculado com menos de 18 anos, quando o psicólogo abre o prontuário, então o sistema exibe o contato do responsável legal informado no cadastro, para que o profissional possa fazer contato fora da plataforma.

#### RF-37 Atribuir tarefas terapêuticas

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | D-03, S-06, 3.3 |
| Descrição | O sistema permite ao psicólogo criar tarefas para um paciente vinculado, com título, descrição e prazo, e acompanhar a conclusão de cada uma. |

**Critérios de aceitação**
- CA-37.1 Dado um vínculo ativo, quando o psicólogo cria uma tarefa com título, descrição e prazo, então o sistema a torna visível ao paciente e dispara a notificação correspondente.
- CA-37.2 Dado uma tarefa criada, quando o paciente a conclui, então o sistema atualiza a situação na visão do psicólogo com data e hora da conclusão.
- CA-37.3 Dado uma tarefa com prazo anterior à data corrente, quando o psicólogo tenta salvá-la, então o sistema recusa a criação e sinaliza o campo de prazo.
- CA-37.4 Dado uma tarefa já concluída pelo paciente, quando o psicólogo tenta excluí-la, então o sistema recusa a exclusão e permite apenas arquivá-la, preservando o registro clínico.

#### RF-38 Registrar medicação em uso

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | S-07, DEC-10, 6.2 |
| Descrição | O sistema permite ao psicólogo registrar uma medicação já prescrita por médico, informando obrigatoriamente a origem da prescrição, os dias e os horários, criando o registro no estado aguardando confirmação do paciente. |

**Critérios de aceitação**
- CA-38.1 Dado um vínculo ativo, quando o psicólogo registra a medicação informando nome, dias, horários e origem da prescrição, então o sistema cria o registro no estado aguardando confirmação e notifica o paciente.
- CA-38.2 Dado o formulário de registro, quando o psicólogo deixa a origem da prescrição em branco, então o sistema recusa a gravação e sinaliza o campo como obrigatório.
- CA-38.3 Dado qualquer tela de medicação no app do psicólogo, quando ela é exibida, então o vocabulário é registrar medicação em uso e lembrete de adesão, e o aviso de que a plataforma não prescreve nem altera prescrição médica permanece visível.
- CA-38.4 Dado um registro criado, quando o paciente ainda não confirmou, então o sistema não dispara lembrete algum e exibe ao psicólogo o estado aguardando confirmação.

#### RF-39 Acompanhar a situação da medicação do paciente

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Should |
| Origem | DEC-10, 6.2 |
| Descrição | O sistema apresenta ao psicólogo a situação de cada registro de medicação do paciente, incluindo confirmações, recusas com motivo, contestações e suspensões feitas pelo paciente, com as respectivas datas. |

**Critérios de aceitação**
- CA-39.1 Dado registros de medicação em estados distintos, quando o psicólogo abre a visão de medicação, então o sistema exibe cada registro com seu estado atual e a data da última mudança.
- CA-39.2 Dado uma recusa ou contestação do paciente, quando o psicólogo consulta o registro, então o sistema exibe o motivo informado pelo paciente.
- CA-39.3 Dado um registro suspenso pelo paciente, quando o psicólogo tenta reativá-lo diretamente, então o sistema recusa e exige um novo registro sujeito a nova confirmação do paciente.

#### RF-40 Agendar consulta

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | D-02, S-08 |
| Descrição | O sistema permite ao psicólogo agendar, reagendar e cancelar consultas com pacientes vinculados, refletindo cada mudança no calendário do paciente e nas notificações. |

**Critérios de aceitação**
- CA-40.1 Dado um vínculo ativo, quando o psicólogo agenda consulta com data e hora futuras, então o sistema registra o agendamento, exibe no calendário do paciente e envia notificação.
- CA-40.2 Dado uma consulta agendada, quando o psicólogo a reagenda ou cancela, então o sistema atualiza a situação nos dois lados e notifica o paciente.
- CA-40.3 Dado um horário que conflita com outra consulta já agendada do mesmo psicólogo, quando ele tenta salvar, então o sistema alerta o conflito e exige confirmação explícita ou a escolha de outro horário.
- CA-40.4 Dado uma data e hora no passado, quando o psicólogo tenta agendar, então o sistema recusa o agendamento.

#### RF-41 Solicitar análise semanal por serviço de IA

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | S-09, DEC-04, 3.3, 6.5 |
| Descrição | O sistema aciona a análise dos relatos compartilhados de um período exclusivamente quando o psicólogo a solicita de forma explícita, gerando um resumo com os tópicos principais, rotulado como baseado apenas nos relatos compartilhados. |

**Critérios de aceitação**
- CA-41.1 Dado um paciente com relatos compartilhados no período e consentimento de IA vigente, quando o psicólogo aciona a solicitação, então o sistema submete apenas os relatos compartilhados e apresenta o resumo em estado não confirmado.
- CA-41.2 Dado qualquer evento do sistema, como fim de semana, véspera de consulta, novo relato ou rotina programada, quando esse evento ocorre, então nenhuma análise é acionada sem solicitação explícita do psicólogo.
- CA-41.3 Dado um resumo apresentado, quando o psicólogo o visualiza, então o sistema exibe o rótulo de que a análise se baseia apenas nos relatos compartilhados pelo paciente.
- CA-41.4 Dado um paciente sem consentimento de IA vigente ou sem relatos compartilhados no período, quando o psicólogo solicita a análise, então o sistema recusa a solicitação e informa o motivo, sem expor conteúdo de relato privado.
- CA-41.5 Dado uma falha na comunicação com o serviço de IA, quando a análise não se completa, então o sistema informa a falha e não grava resultado parcial.

#### RF-42 Revisar e confirmar a análise antes da persistência

| Campo | Conteúdo |
|-------|----------|
| Ator | Psicólogo |
| Prioridade | Must |
| Origem | DEC-05, 3.3 |
| Descrição | O sistema apresenta o resumo gerado como sugestão em estado transitório e só o incorpora ao prontuário após confirmação explícita do psicólogo, que pode editá-lo ou descartá-lo. |

**Critérios de aceitação**
- CA-42.1 Dado um resumo gerado, quando o psicólogo o confirma, com ou sem edição, então o sistema o incorpora ao prontuário registrando autor da confirmação, data e a indicação de que o conteúdo teve origem em sugestão de IA.
- CA-42.2 Dado um resumo gerado, quando o psicólogo o descarta ou abandona a tela sem confirmar, então o sistema não incorpora nada ao prontuário e o conteúdo não fica disponível em nenhuma consulta posterior.
- CA-42.3 Dado um resumo em estado não confirmado, quando o paciente acessa o app dele, então nenhuma sugestão de IA é exibida a ele.
- CA-42.4 Dado um resumo confirmado, quando o psicólogo o edita depois, então o sistema preserva o registro da versão anterior e a data de cada alteração.

#### RF-43 Exibir aviso permanente sobre não prescrição

| Campo | Conteúdo |
|-------|----------|
| Ator | Sistema |
| Prioridade | Must |
| Origem | 6.2 |
| Descrição | O sistema mantém visível, em todas as telas de medicação dos dois aplicativos, o aviso de que a plataforma não prescreve nem altera prescrição médica e de que a prescrição é atribuição do médico. |

**Critérios de aceitação**
- CA-43.1 Dado qualquer tela de registro, confirmação, lembrete ou consulta de medicação, quando ela é exibida, então o aviso está presente e legível sem necessidade de rolagem até o fim da tela.
- CA-43.2 Dado o aviso exibido, quando o usuário interage com a tela, então não há opção de ocultá-lo ou dispensá-lo permanentemente.
- CA-43.3 Dado qualquer rótulo das telas de medicação, quando o texto é exibido, então não se usam os termos prescrever, prescrição pela plataforma ou atribuir remédio para a ação do psicólogo.

---

### 5.4 Requisitos do perfil administrador

#### RF-44 Aprovar ou reprovar cadastro profissional

| Campo | Conteúdo |
|-------|----------|
| Ator | Administrador |
| Prioridade | Must |
| Origem | 2.1, S-01, 6.3 |
| Descrição | O sistema apresenta ao administrador a fila de cadastros profissionais pendentes, com os dados informados e o documento comprobatório, e permite aprovar ou reprovar com justificativa. |

**Critérios de aceitação**
- CA-44.1 Dado um cadastro pendente, quando o administrador aprova, então o sistema libera as funcionalidades de psicólogo, permite a publicação do perfil e notifica o profissional.
- CA-44.2 Dado um cadastro pendente, quando o administrador reprova informando a justificativa, então o sistema mantém a conta bloqueada para as funções profissionais, notifica o profissional com a justificativa e permite reenvio de documentação.
- CA-44.3 Dado um cadastro reprovado sem justificativa preenchida, quando o administrador confirma, então o sistema recusa a operação e exige a justificativa.
- CA-44.4 Dado um psicólogo com cadastro pendente ou reprovado, quando um paciente consulta o catálogo, então o perfil dele não aparece em nenhuma condição.

#### RF-45 Tratar denúncias

| Campo | Conteúdo |
|-------|----------|
| Ator | Administrador |
| Prioridade | Should |
| Origem | 2.1 |
| Descrição | O sistema apresenta ao administrador as denúncias abertas e permite registrar a análise, a decisão e a eventual suspensão de conta, com justificativa. |

**Critérios de aceitação**
- CA-45.1 Dado uma denúncia aberta, quando o administrador registra a decisão com justificativa, então o sistema encerra a denúncia e notifica o denunciante sobre a conclusão, sem expor dados pessoais do denunciado.
- CA-45.2 Dado uma decisão de suspensão de conta, quando ela é aplicada, então o usuário suspenso não consegue autenticar e os vínculos ativos dele passam a somente leitura, com o histórico preservado.
- CA-45.3 Dado uma denúncia já encerrada, quando o administrador tenta alterar a decisão, então o sistema exige a reabertura registrada, com autor e data, em vez de sobrescrever a decisão anterior.

#### RF-46 Publicar nova versão de termo de consentimento

| Campo | Conteúdo |
|-------|----------|
| Ator | Administrador |
| Prioridade | Should |
| Origem | 7.1, derivado |
| Descrição | O sistema permite ao administrador publicar novas versões dos termos de consentimento, numeradas e datadas, disparando novo aceite dos usuários e preservando o histórico de aceites anteriores. |

**Critérios de aceitação**
- CA-46.1 Dado um novo texto de termo, quando o administrador o publica, então o sistema atribui número de versão e data de vigência e passa a exigir o aceite dessa versão dos usuários.
- CA-46.2 Dado uma versão já publicada, quando o administrador tenta editá-la, então o sistema recusa a edição e exige a publicação de uma nova versão.
- CA-46.3 Dado um usuário que ainda não aceitou a versão vigente, quando autentica, então o sistema apresenta o novo termo antes de liberar as funcionalidades clínicas.

#### RF-47 Executar política de retenção e exclusão de dados

| Campo | Conteúdo |
|-------|----------|
| Ator | Administrador / Sistema |
| Prioridade | Could |
| Origem | 7.1, derivado |
| Descrição | O sistema permite ao administrador consultar os prazos de retenção definidos e executar a exclusão de dados de uma conta mediante solicitação do titular, mantendo o registro do ato de exclusão. |

**Critérios de aceitação**
- CA-47.1 Dado uma solicitação de exclusão de um titular, quando o administrador a executa, então o sistema remove os dados pessoais do titular e mantém apenas o registro do ato de exclusão, com data e responsável.
- CA-47.2 Dado uma solicitação de exclusão de dados sob prazo legal de retenção ainda vigente, quando o administrador tenta executá-la, então o sistema recusa a exclusão imediata e informa o prazo aplicável.
- CA-47.3 Dado qualquer usuário sem perfil de administrador, quando tenta acionar a exclusão de dados de outra conta, então o sistema nega a operação.

---

### 5.5 Resumo MoSCoW dos requisitos funcionais

| Prioridade | Quantidade |
|------------|------------|
| Must | 35 |
| Should | 8 |
| Could | 2 |
| Won't | 4 |
| **Total** | **49** |

**Must (35):** RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-09, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-22, RF-23, RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RF-40, RF-41, RF-42, RF-43, RF-44, RF-49

**Should (8):** RF-08, RF-17, RF-18, RF-30, RF-39, RF-45, RF-46, RF-48

**Could (2):** RF-31, RF-47

**Won't (4):** RF-19 (avaliações e ranking, DEC-06), RF-20 (pagamentos, DEC-07), RF-21 (sessão por vídeo, DEC-08), RF-32 (limite de uso de aplicativos, P-11, DEC-09, 6.1)

#### Notas de priorização

- RF-08, RF-17, RF-18, RF-30 e RF-39 aparecem como Should porque o ciclo semanal completo (tarefa, relato, análise, sessão) roda sem eles. São reforços de segurança, governança e usabilidade, não elos do fluxo principal.
- RF-39 é Should, mas a exigência de DEC-10 sobre a visibilidade da suspensão está garantida como Must dentro de CA-29.2 e CA-36.1, sem depender da tela consolidada.
- RF-43 é Must apesar de não ser um passo do fluxo: é a barreira ética que impede o produto de simular competência de prescrição.
- RF-31 e RF-47 ficam em Could porque atendem direitos do titular que, em três sprints, podem ser demonstrados por processo documentado caso o tempo não permita implementá-los.

---

### 5.6 Rastreabilidade das dores levantadas em campo

| Dor | Descrição resumida | RF que atacam |
|-----|--------------------|---------------|
| D-01 | Comunicação fragmentada e inconsistente entre as sessões | RF-15, RF-16, RF-22, RF-24, RF-36 |
| D-02 | Agendamento manual, sujeito a falhas e esquecimentos | RF-16, RF-26, RF-40 |
| D-03 | Baixa adesão às tarefas prescritas | RF-16, RF-25, RF-28, RF-37 |
| D-04 | Tempo de sessão gasto em recapitulação | RF-22, RF-36, RF-41, RF-42 |
| D-05 | Ausência de ferramentas de apoio para os dois lados | RF-15, RF-22, RF-25, RF-26, RF-27, RF-28, RF-29, RF-35, RF-36, RF-37, RF-38, RF-39, RF-40, RF-41 |
| D-06 | Dificuldade de acesso a profissionais | RF-09, RF-10, RF-11, RF-33, RF-34, RF-44 |

Requisitos que não atacam dor diretamente e existem por obrigação legal, ética ou de segurança: RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08, RF-12, RF-13, RF-14, RF-17, RF-18, RF-23, RF-30, RF-31, RF-43, RF-45, RF-46, RF-47, RF-48, RF-49.

---

### 5.7 Assunções e pontos em aberto dos requisitos funcionais

Os itens abaixo correspondem a pendências declaradas na seção 8.1 do documento base ou a lacunas de fluxo. Em todos, adotou-se a hipótese mais conservadora para não travar a Sprint 1.

#### A-01 Critérios de busca do catálogo (pendência 8.1, item 2)

**Assunção:** RF-09 assume filtros por abordagem, especialidade, modalidade de atendimento e região, sem qualquer critério de preço e sem ordenação por popularidade ou avaliação. A ordenação padrão é neutra, sem privilegiar profissional algum.
**Se a decisão for outra:** acrescentar ou remover filtros altera apenas os critérios de CA-09.1 e CA-09.4. A proibição de preço, nota e ranking (CA-09.3) não é negociável, pois decorre de DEC-06 e das orientações de CRPs sobre divulgação.

#### A-02 Prazo de expiração do código de convite (pendência 8.1, item 3)

**Assunção:** o código expira em prazo curto e definido, contado da geração, e o sistema exibe a data de expiração ao psicólogo no momento da geração (RF-06). Como o valor exato não está decidido, o requisito trata o prazo como parâmetro de configuração e não fixa o número de dias.
**Se a decisão for outra:** um prazo mais longo ou a ausência de expiração afeta CA-06.1 e CA-07.2, e enfraquece a mitigação de risco descrita em 7.1. Recomenda-se fechar o valor antes da Sprint 2.

#### A-03 Revogação do código de convite (pendência 8.1, item 3)

**Assunção:** a revogação é permitida e está descrita em RF-08, priorizada como Should. O convite já consumido não é revogável; o caminho nesse caso é o encerramento de vínculo (CA-08.2).
**Se a decisão for outra:** se a revogação for descartada, RF-08 sai do escopo e a mitigação de código vazado passa a depender apenas da expiração de A-02, o que aumenta o risco descrito em 7.1.

#### A-04 Plataforma de cada aplicativo (pendência 8.1, item 1)

**Assunção:** nenhum RF depende da plataforma escolhida. A proposta de 6.4 (psicólogo em web, paciente em mobile) afeta apenas a especificação de interface e os requisitos não funcionais.
**Se a decisão for outra:** a única funcionalidade sensível a isso é a notificação (RF-16), cujo meio de entrega muda conforme a plataforma, sem alterar o comportamento observável descrito.

#### A-05 Denúncia de conduta (derivado)

**Assunção:** o documento base define que o administrador trata denúncias (seção 2.1), mas não descreve o fluxo. RF-18 e RF-45 foram derivados para fechar esse caminho, com o mínimo: registro com motivo obrigatório, análise, decisão com justificativa e suspensão de conta.
**Se a decisão for outra:** se a equipe optar por tratar denúncias fora da plataforma, RF-18 e RF-45 saem do escopo e o documento precisa registrar o canal externo.

#### A-06 Consentimento versionado e gestão de versões (derivado a partir de 7.1)

**Assunção:** RF-03, RF-04 e RF-46 assumem dois consentimentos independentes, o geral de tratamento de dados de saúde e o específico de envio de relatos ao serviço de IA, cada um com número de versão e data. A revogação do consentimento de IA é permitida e vale a partir do momento da revogação, sem efeito retroativo sobre análises já confirmadas.
**Se a decisão for outra:** unificar os dois consentimentos em um só termo contraria a exigência de consentimento específico e destacado apontada em 6.5 e no art. 11 da LGPD, e não é recomendado.

#### A-07 Exportação e retenção de dados (derivado a partir de 7.1)

**Assunção:** RF-31 e RF-47 foram derivados apenas para tornar testável a exclusão de relato privado das exportações, exigida por 7.1, e para dar destino à política de retenção citada no mesmo ponto. Ambos entram como Could.
**Se a decisão for outra:** se saírem do escopo das três sprints, a regra de exclusão de relato privado da exportação continua valendo por CA-23.4, que independe de RF-31.

#### A-08 Bloqueio da promoção de relato privado para compartilhado (derivado)

**Assunção:** CA-22.3 impede converter um relato já gravado como privado em compartilhado. DEC-13 define a escolha no momento da postagem e DEC-15 trata apenas do caminho inverso, a despublicação. A leitura conservadora é que o sentido privado para compartilhado não foi previsto e fica bloqueado, evitando ambiguidade sobre o que o psicólogo já viu.
**Se a decisão for outra:** liberar essa conversão exige decidir como a análise semanal trata relatos promovidos depois do período analisado, e altera CA-22.3 e CA-41.1.

#### A-09 Limite de tentativas de código de convite (derivado de 7.1)

**Assunção:** CA-07.3 assume bloqueio temporário por dispositivo após um número definido de tentativas, tratado como parâmetro de configuração. O documento base exige o limite em 7.1, mas não fixa o valor.
**Se a decisão for outra:** o valor escolhido afeta apenas o critério, não o comportamento descrito.

#### A-10 Contrato de prestação de serviços (derivado da Resolução CFP nº 9/2024)

**Assunção:** RF-48 assume que o contrato é apresentado e aceito dentro da plataforma, na ativação do vínculo, com versionamento igual ao dos termos de consentimento. Ficou como Should porque o texto do contrato depende de validação com profissional, e o aceite pendente sinaliza sem bloquear o atendimento em curso.
**Se a decisão for outra:** se o grupo optar por manter o contrato fora da plataforma, RF-48 sai do escopo e o documento precisa registrar onde o contrato é firmado, porque a exigência da Resolução CFP nº 9/2024 continua valendo e o RNF-24 perde a contrapartida funcional.


---

## 6. Requisitos não funcionais

> Os números desta parte são metas de projeto, verificáveis em ambiente de teste local com massa de dados fictícia. Não são compromisso de desempenho em produção nem medição de campo. Padrões e normas aparecem por nome (LGPD, Resolução CFP nº 9/2024, WCAG 2.1) porque são restrição legal, não escolha de tecnologia.

### 6.1 Segurança

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-01 | Todo tráfego entre os aplicativos e o serviço central trafega por canal criptografado, e requisições em canal não criptografado são recusadas. | Must | 7.1 | Inspeção de tráfego durante um roteiro de uso completo (login, relato, chat, prontuário) mostrando 100% das requisições em canal criptografado, mais uma tentativa deliberada em canal aberto que retorna recusa. |
| RNF-02 | Relatos, mensagens de chat e prontuário são armazenados de forma criptografada em repouso. | Must | 7.1 | Leitura direta do meio de armazenamento por fora da aplicação, demonstrando que o conteúdo desses registros não é legível em texto claro. Evidência anexada ao relatório de sprint. |
| RNF-03 | O acesso a qualquer dado é decidido por papel (paciente, psicólogo, administrador), e o psicólogo alcança apenas dados de pacientes com vínculo em estado ativo. | Must | 7.1, DEC-01 | Suíte automatizada com casos negativos: psicólogo sem vínculo, psicólogo com vínculo encerrado e paciente tentando ler dado de outro paciente. Todos retornam negativa de autorização, e nenhum retorna conteúdo parcial. |
| RNF-04 | Todo acesso a prontuário gera registro de auditoria com identificação do autor, do paciente alvo, data, hora e ação realizada. | Must | 7.1 | Roteiro de 10 acessos ao prontuário seguido de consulta à trilha, conferindo 10 registros completos, sem lacuna de campo. A trilha é somente de inclusão: tentativa de alteração ou remoção pelo perfil de aplicação é negada. |
| RNF-05 | O código de convite é gerado aleatoriamente, não é sequencial nem derivável de dados do psicólogo, usa alfabeto sem caracteres ambíguos (sem `0/O` e sem `1/I/l`), tem uso único e expira em prazo definido. | Must | 7.1, DEC-11 | Geração automatizada de 10.000 códigos verificando ausência de repetição, ausência de correlação com identificadores do emissor, ausência de caracteres ambíguos, recusa na segunda tentativa de uso e recusa após o prazo de expiração. |
| RNF-06 | A validação de código de convite é limitada por número de tentativas por dispositivo e por janela de tempo, com bloqueio temporário ao exceder o limite. | Must | 7.1 | Teste automatizado que dispara tentativas inválidas em sequência a partir do mesmo dispositivo e comprova bloqueio a partir do limite configurado (meta de projeto: 5 tentativas por 15 minutos), com registro do bloqueio. |
| RNF-07 | As credenciais de acesso são armazenadas de forma irreversível e nunca são exibidas, registradas em log ou devolvidas por qualquer resposta do sistema. | Must | derivado (7.1) | Inspeção do armazenamento comprovando ausência de credencial em texto recuperável, mais varredura automatizada de logs e respostas em um roteiro completo de uso sem nenhuma ocorrência de credencial. |
| RNF-08 | O isolamento do relato privado é garantido na camada de dados: nenhuma consulta do perfil psicólogo, nenhuma rotina de envio ao serviço de IA e nenhuma exportação alcança relato marcado como privado, nem sua existência ou contagem. | Must | 7.1, DEC-12, DEC-14 | Testes automatizados obrigatórios, executados a cada integração: (a) para cada consulta disponível ao perfil psicólogo, com massa contendo relatos privados e compartilhados, o conjunto retornado é comparado ao conjunto esperado e nenhum identificador de relato privado aparece, inclusive em campos de contagem e agregação; (b) a rotina de montagem do pacote enviado à IA é interceptada e seu conteúdo é comparado ao conjunto de relatos compartilhados, com falha do teste diante de qualquer identificador privado; (c) toda rotina de exportação passa pela mesma comparação. A suíte falha se uma nova consulta do perfil psicólogo for adicionada sem caso correspondente. |
| RNF-09 | A sessão autenticada expira por inatividade e pode ser encerrada pelo próprio usuário, invalidando o acesso em todos os dispositivos daquela conta. | Should | derivado (7.1) | Teste que aguarda o prazo de inatividade configurado (meta de projeto: 30 minutos) e comprova recusa da requisição seguinte, mais encerramento manual em um dispositivo comprovando recusa em outro dispositivo da mesma conta. |
| RNF-10 | Toda entrada recebida do usuário é validada e tratada antes de uso em consulta, armazenamento ou exibição, de modo a não permitir injeção em consultas nem execução de conteúdo na interface. | Must | derivado (7.1) | Bateria de entradas maliciosas conhecidas (cadeias de injeção em consulta e de script em campo de texto) aplicada aos campos livres de relato, chat, perfil e busca do catálogo, com resultado esperado de rejeição ou neutralização, nenhuma execução e nenhum erro que exponha detalhe interno. |
| RNF-11 | O documento comprobatório de registro profissional enviado no cadastro é acessível somente ao perfil administrador e ao próprio psicólogo que o enviou, e nunca é exposto no catálogo público. | Must | 6.3, derivado | Teste de autorização sobre o recurso do documento com os quatro perfis (anônimo, paciente, outro psicólogo, administrador), retornando acesso apenas para administrador e para o dono do documento. |

---

### 6.2 Privacidade e proteção de dados (LGPD)

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-12 | O tratamento de dados de saúde ocorre sob base legal específica, com consentimento destacado do titular e finalidade declarada em linguagem clara antes da primeira coleta. | Must | LGPD art. 11, seção 7 | Revisão documental do texto de consentimento por par externo ao autor, confirmando finalidade explícita, e teste que comprova que nenhum relato, mensagem ou registro de medicação pode ser gravado antes do aceite registrado. |
| RNF-13 | O consentimento é versionado: cada aceite guarda a versão do texto aceita, a data e a hora, e uma nova versão do texto exige novo aceite antes do próximo uso. | Must | 7.1 | Teste que publica uma segunda versão do texto e comprova que o usuário com aceite da versão anterior é levado a novo aceite, mais consulta ao registro mostrando os dois aceites com versão e data distintas. |
| RNF-14 | Existe política de retenção e exclusão declarada e versionada, com prazo definido por categoria de dado. A execução da exclusão é atribuição de RF-47, priorizado como Could: a política vale como documento aprovado mesmo que a rotina não entre nas 3 sprints. | Must | 7.1, RF-47 | Documento de política aprovado pelo grupo e versionado no repositório, cobrindo toda categoria de dado prevista no modelo. Caso RF-47 entre no escopo, acrescenta-se a execução da rotina sobre massa de teste com datas retroagidas, comprovando remoção dos registros vencidos e preservação dos demais. |
| RNF-15 | A exclusão a pedido do titular remove os dados de identificação pessoal, preservando apenas o registro clínico de vínculos encerrados que a política de retenção justificar, em forma que não permita reidentificação pela plataforma. | Should | 3.2, LGPD, derivado | Teste que executa a exclusão sobre uma conta de teste e verifica, por consulta direta ao armazenamento, ausência dos campos identificadores e presença apenas dos registros previstos na política, sem chave de reidentificação. |
| RNF-16 | O sistema coleta apenas os dados necessários às funcionalidades do MVP, sem campos de coleta sem finalidade declarada. | Must | LGPD art. 11, derivado | Tabela de campos coletados versus finalidade, revisada em conjunto com o modelo de dados; qualquer campo sem finalidade declarada é removido antes do fechamento da sprint. |
| RNF-17 | Registros de log, mensagens de erro e telemetria não contêm conteúdo de relato, de mensagem de chat, de prontuário nem dado identificador direto do paciente. | Should | derivado (7.1) | Varredura automatizada dos arquivos de log gerados por um roteiro completo de uso, buscando trechos plantados no conteúdo de relatos e mensagens de teste, com resultado esperado de zero ocorrências. |
| RNF-18 | O titular pode obter cópia legível dos próprios dados pela plataforma, respeitado o isolamento do relato privado. Contrapartida funcional em RF-31. | Could | LGPD, RF-31, derivado | Demonstração de exportação por um usuário de teste, com conferência de que o arquivo contém os dados esperados do titular e nenhum dado de terceiro. Fica como Could porque o MVP prioriza o núcleo do ciclo semanal. |
| RNF-19 | Ao despublicar um relato já utilizado em uma análise, o sistema informa ao paciente, de forma explícita, que o profissional pode já ter tido acesso ao conteúdo. | Must | DEC-15 | Roteiro de teste que compartilha um relato, solicita análise, despublica o relato e comprova a exibição do aviso, com o texto revisado para não sugerir apagamento retroativo. |

---

### 6.3 Conformidade ética e profissional (CFP)

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-20 | O perfil do psicólogo exibido no catálogo apresenta, de forma visível e não ocultável, nome completo, sigla do conselho regional e número de registro. | Must | Código de Ética art. 20, seção 7 | Inspeção de todo perfil publicado em ambiente de teste confirmando os três dados presentes, mais teste que impede a publicação de perfil com qualquer um dos campos vazio. |
| RNF-21 | O catálogo não permite ordenação por preço, não exibe promoções, descontos ou comparação de valores entre profissionais. | Must | Orientações de CRPs sobre divulgação, seção 7 | Revisão da lista de critérios de ordenação e filtro disponíveis na interface e no contrato de dados, comprovando ausência de qualquer chave de valor monetário, mais teste que rejeita requisição de ordenação por preço. |
| RNF-22 | O conteúdo do perfil público é escrito e submetido pelo próprio psicólogo, nunca gerado automaticamente pela plataforma nem por serviço de IA. | Must | Nota Técnica CFP nº 1/2022, seção 7 | Revisão do fluxo de publicação demonstrando origem manual do texto, mais ausência, comprovada em código e em teste, de qualquer rotina que preencha campos do perfil sem ação do profissional. |
| RNF-23 | A plataforma não oferece avaliação, nota, estrela, ranking ou qualquer ordenação por reputação de profissionais. | Must | DEC-06 | Inspeção da interface e do contrato de dados confirmando ausência desses campos, registrada no relatório de sprint. |
| RNF-24 | A plataforma preserva sigilo e registro documental do atendimento e disponibiliza o contrato de prestação de serviços entre profissional e paciente no início do vínculo. Contrapartida funcional em RF-48. | Should | Resolução CFP nº 9/2024, seção 7, RF-48 | Demonstração do fluxo de aceite do contrato na ativação do vínculo, com registro de data e versão aceita por ambas as partes. Fica como Should porque o texto do contrato depende de validação com profissional, ainda pendente. |
| RNF-25 | A documentação do projeto declara, de forma explícita, que o modelo proposto não conta com psicólogo Responsável Técnico registrado no conselho regional, e descreve a consequência dessa ausência. | Must | Nota Técnica CRP-PR 002/2022, seção 7 | Presença da seção de limitações conhecidas no documento de requisitos entregue, citando a nota técnica e a limitação, conferida na revisão final da Sprint 1. |
| RNF-26 | A interface exibe, de forma permanente nas telas de medicação dos dois aplicativos, o aviso de que a plataforma não prescreve nem altera prescrição médica. | Must | 6.2 | Inspeção de todas as telas de medicação nos dois aplicativos confirmando o aviso visível sem necessidade de rolagem ou de interação, mais conferência de que o vocabulário usado é "registrar medicação em uso" e "lembrete de adesão". |

---

### 6.4 Uso responsável de IA

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-27 | A plataforma informa de forma explícita, nos dois aplicativos, que relatos compartilhados podem ser processados por serviço de IA, o que é feito com eles e quem solicita o processamento. | Must | 7.1 | Inspeção das telas de relato e de análise nos dois aplicativos confirmando a informação acessível sem busca, mais revisão do texto por par externo ao autor quanto à clareza. |
| RNF-28 | Nenhum relato é enviado a serviço de IA sem consentimento específico, informado e destacado do paciente, distinto do consentimento geral de uso da plataforma. | Must | 6.5, LGPD art. 11 | Teste automatizado que remove o consentimento de IA de um paciente de teste e comprova que a solicitação de análise pelo psicólogo é recusada, sem envio de conteúdo, com o motivo registrado. |
| RNF-29 | O conteúdo enviado ao serviço de IA é pseudonimizado, sem nome, sem dado de contato e sem identificador direto de paciente ou de profissional. | Should | 6.5 | Interceptação do pacote enviado em um roteiro de análise, conferindo ausência dos campos identificadores plantados na massa de teste. Fica como Should porque a eficácia da pseudonimização depende também do conteúdo livre escrito pelo paciente, que a plataforma não controla. |
| RNF-30 | A análise por IA só é executada mediante ação explícita do psicólogo, nunca por agendamento, gatilho automático ou iniciativa do próprio serviço. | Must | DEC-04, 3.3 | Ausência de rotina agendada ou reativa que acione a análise, comprovada em revisão de código, mais teste que aguarda o intervalo de uma semana simulada sem qualquer acionamento registrado. |
| RNF-31 | Nenhuma saída de IA é persistida no prontuário sem confirmação explícita do profissional. | Must | DEC-05 | Teste que gera uma análise, descarta sem confirmar e comprova ausência do conteúdo no prontuário, mais o caso simétrico com confirmação e persistência. |
| RNF-32 | Toda análise apresentada ao profissional é rotulada como produzida apenas a partir dos relatos compartilhados pelo paciente. | Must | DEC-14 | Inspeção da tela de análise confirmando o rótulo presente em toda exibição, inclusive em análises armazenadas e reabertas. |
| RNF-33 | Cada acionamento do serviço de IA gera registro com autor, paciente, data, hora e conjunto de relatos considerado. | Should | derivado (7.1) | Roteiro de 5 acionamentos seguido de consulta ao registro, conferindo 5 entradas completas e coerentes com os relatos efetivamente enviados. |

---

### 6.5 Usabilidade e acessibilidade

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-34 | Os dois aplicativos compartilham um único design system, com os mesmos componentes, escala tipográfica, paleta e padrões de interação. | Must | 6.4 | Documento de design system versionado no repositório, mais conferência de que toda tela entregue usa componentes desse conjunto, sem componente criado fora dele; divergências são listadas e corrigidas antes do fechamento da sprint. |
| RNF-35 | As telas principais atendem aos critérios de nível AA da WCAG 2.1 para contraste de texto, tamanho de alvo de toque, indicação visível de foco e rótulo de campo de formulário. | Should | derivado | Verificação por ferramenta de checagem de contraste e por lista de conferência manual sobre as telas principais dos dois aplicativos (meta de projeto: contraste mínimo 4,5:1 para texto comum e alvo de toque mínimo de 44 por 44 pontos), com evidência anexada. |
| RNF-36 | O vocabulário da interface de medicação usa "registrar medicação em uso" e "lembrete de adesão", e em nenhum ponto usa "prescrever" ou "atribuir remédio". | Must | 6.2 | Varredura textual das telas e dos textos de interface buscando os termos proibidos, com resultado esperado de zero ocorrências. |
| RNF-37 | A escolha entre relato compartilhado e relato privado é apresentada no momento da postagem, de forma visível sem rolagem, com o padrão em compartilhado e indicação clara do estado escolhido. | Must | DEC-12, DEC-13 | Teste de interface confirmando o controle visível e o padrão correto, mais teste de usabilidade com 3 pessoas externas ao grupo em que todas identificam o estado do relato antes de enviar. |
| RNF-38 | O registro de um relato pelo paciente é concluído em no máximo 3 interações a partir da tela inicial do aplicativo. | Should | D-03, derivado | Contagem de interações no fluxo implementado, registrada no relatório de sprint (meta de projeto: 3 interações), confirmada com 3 pessoas externas ao grupo executando a tarefa sem instrução prévia. |
| RNF-39 | Toda a interface e todos os textos voltados ao usuário estão em português do Brasil, em linguagem clara, sem jargão clínico ou técnico não explicado. | Should | derivado | Revisão dos textos de interface por par externo ao autor, com lista de termos sinalizados e reescrita antes da entrega. |
| RNF-40 | Mensagens de erro informam o que aconteceu e o que o usuário pode fazer em seguida, sem expor detalhe técnico interno. | Could | derivado | Catálogo de mensagens de erro revisado, conferindo em cada uma a presença de causa e de próximo passo, e ausência de identificador interno ou trecho de exceção. |

---

### 6.6 Desempenho

> Todos os números desta seção são metas de projeto medidas em ambiente de teste local, com massa de dados fictícia. Não são compromisso de desempenho em produção.

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-41 | As operações de uso frequente (abrir lista de pacientes, abrir prontuário, enviar relato, enviar mensagem, listar tarefas) respondem em até 2 segundos em ambiente de teste local. | Should | derivado | Medição de 10 execuções de cada operação sobre a massa de teste padrão, registrando a mediana e o pior caso; critério atendido quando a mediana fica em até 2 segundos e o pior caso em até 4 segundos. Meta de projeto, não medição de campo. |
| RNF-42 | A análise por IA é executada de forma assíncrona, com retorno imediato de confirmação ao psicólogo e indicação visível de andamento, e o resultado fica disponível em até 30 segundos em ambiente de teste. | Should | 3.3, derivado | Roteiro de 5 solicitações medindo o tempo até o resultado disponível, com a interface permanecendo utilizável durante a espera em todas as execuções. Meta de projeto. |
| RNF-43 | O sistema mantém os tempos de RNF-41 com massa de teste de 20 psicólogos, 100 pacientes, 2.000 relatos e 5.000 mensagens. | Could | derivado | Carga da massa de teste e repetição da medição de RNF-41 sobre ela, com resultado anexado ao relatório de sprint. |
| RNF-44 | As telas principais do aplicativo do paciente permanecem utilizáveis em conexão móvel lenta, sem bloqueio da interface durante o carregamento. | Could | derivado | Execução do roteiro principal com limitação de banda simulada (meta de projeto: 1 Mbps), confirmando que a interface responde a toque e exibe estado de carregamento em vez de congelar. |
| RNF-45 | O aplicativo do paciente fica pronto para uso em até 5 segundos após a abertura, em dispositivo de teste do grupo. | Could | derivado | Medição de 10 aberturas em um mesmo dispositivo de teste, com a mediana dentro da meta e o modelo do dispositivo registrado junto ao resultado. |

---

### 6.7 Confiabilidade e disponibilidade

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-46 | A indisponibilidade ou o erro do serviço de IA não impede o uso do núcleo da plataforma (chat, relatos, tarefas, agenda, medicação), e o psicólogo recebe mensagem clara de falha com possibilidade de nova tentativa. | Must | 3.3, DEC-04, derivado | Teste com o serviço de IA indisponível, comprovando que todas as demais funcionalidades seguem operando, que a mensagem de falha aparece e que nenhum registro parcial de análise é persistido. |
| RNF-47 | Existe rotina documentada de cópia de segurança e de restauração dos dados, com restauração exercitada ao menos uma vez antes da entrega final. | Should | derivado | Registro de um ciclo completo de cópia e restauração em ambiente de teste, com conferência de que a massa restaurada é equivalente à original. |
| RNF-48 | O envio de notificações e lembretes registra sucesso ou falha por tentativa e reenvia automaticamente em caso de falha temporária, dentro de um limite de tentativas. | Should | P-09, P-10, derivado | Teste com destino indisponível comprovando o registro da falha e a reentrega após o destino voltar, respeitando o limite de tentativas configurado. |
| RNF-49 | A plataforma não oferece compromisso de disponibilidade contínua nem meta de tempo de atividade em produção. | Won't | derivado, 8.3 | Declaração explícita no documento de requisitos. Justificativa: o produto é acadêmico, sem operação em produção e sem equipe de plantão; o compromisso assumido é apenas o de ambiente estável e ensaiado durante a apresentação à banca. |
| RNF-50 | As transições de estado de vínculo (pendente, ativo, encerrado) e de medicação (aguardando confirmação, ativa, suspensa) são atômicas: ou concluem por inteiro, ou não deixam efeito parcial. | Must | 3.2, 6.2 | Testes automatizados que interrompem a operação no meio da transição e comprovam que o estado permanece o anterior, além do teste da regra de no máximo 1 vínculo ativo por paciente sob duas solicitações simultâneas. |

---

### 6.8 Manutenibilidade e evolução

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-51 | O projeto adota um único padrão documentado de mensagens de commit e de nomes de ramo, seguido por todos os integrantes. | Must | 8.2 | Documento de padrão no repositório, mais amostragem do histórico ao fim de cada sprint com pelo menos 90% dos commits em conformidade. |
| RNF-52 | O código adota um único idioma para nomes de variáveis, funções, tabelas e colunas, definido antes do início da Sprint 2. | Must | 8.2 | Decisão registrada no documento de requisitos, mais revisão por amostragem de arquivos ao fim de cada sprint sem mistura de idiomas nos identificadores. |
| RNF-53 | As regras críticas de negócio (isolamento do relato privado, autorização por vínculo ativo, uso único do convite, limite de 1 vínculo ativo por paciente e ciclo de vida da medicação) têm testes automatizados executados a cada integração. | Must | 7.1, DEC-03, DEC-10, derivado | Relatório de execução da suíte mostrando ao menos um teste por regra listada, todos passando, e a suíte configurada para bloquear a integração em caso de falha. |
| RNF-54 | As decisões de projeto e suas justificativas ficam versionadas no repositório e são atualizadas quando uma decisão muda. | Should | seção 5, derivado | Presença do registro de decisões no repositório e conferência, ao fim de cada sprint, de que toda decisão alterada durante a sprint tem entrada correspondente. |
| RNF-55 | As funcionalidades cortadas do MVP ficam documentadas com a análise de viabilidade que motivou o corte, e não apenas listadas como pendência. | Must | 6.1, 6.3 | Presença, no documento de requisitos, das seções de limite de uso de aplicativos e de validação automática de registro profissional, cada uma com restrição técnica ou jurídica descrita e encaminhamento futuro. |
| RNF-56 | Segredos, chaves de acesso e credenciais de serviços externos ficam fora do código-fonte e fora do repositório, carregados por configuração de ambiente. | Must | derivado | Varredura do repositório e do histórico por padrões de chave e credencial com resultado zero, mais conferência de que a aplicação não inicia sem a configuração externa presente. |

---

### 6.9 Portabilidade e compatibilidade

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-57 | Os dois aplicativos operam sobre um único serviço central, um único banco de dados, um único mecanismo de autenticação e uma única interface de programação, sem lógica de negócio duplicada entre os clientes. | Must | 6.4, DEC-01 | Diagrama de arquitetura aprovado mostrando um único serviço e um único banco, mais conferência de que cada regra de negócio listada em RNF-53 tem implementação única no serviço central, verificada por teste que exercita a regra pelos dois clientes com o mesmo resultado. |
| RNF-58 | Existe um contrato de interface de programação único, versionado e documentado, consumido pelos dois aplicativos, e mudanças que quebram o contrato exigem nova versão declarada. | Must | 6.4, derivado | Documento de contrato no repositório cobrindo todas as operações usadas pelos dois clientes, mais teste que valida as respostas contra o contrato publicado. |
| RNF-59 | O aplicativo web funciona nas duas versões estáveis mais recentes dos navegadores usados pelo grupo, e o aplicativo móvel funciona a partir da versão de sistema operacional definida na Sprint 2. | Should | 6.4, 8.1 | Execução do roteiro principal em cada ambiente da lista declarada, com registro do resultado por ambiente no relatório de sprint. |
| RNF-60 | O ambiente de desenvolvimento e execução é reproduzível a partir do repositório, seguindo passos documentados, sem configuração manual não descrita. | Should | derivado | Um integrante que não montou o ambiente executa os passos do documento em máquina limpa e chega à aplicação em funcionamento, registrando os desvios encontrados para correção do documento. |
| RNF-61 | Os dados criados em um dos aplicativos ficam disponíveis no outro, respeitadas as regras de autorização, sem reentrada manual de informação. | Must | 6.4 | Roteiro cruzado: o psicólogo atribui uma tarefa e agenda uma consulta no aplicativo web, o paciente as vê no aplicativo móvel e conclui a tarefa, e a conclusão aparece no aplicativo web, tudo dentro da mesma sessão de demonstração. |

---

### 6.10 Restrições de projeto (acadêmicas, de prazo e de equipe)

| ID | Requisito | Prioridade | Origem | Critério de verificação |
|----|-----------|------------|--------|-------------------------|
| RNF-62 | O escopo implementado limita-se às funcionalidades marcadas como MVP na seção 4, dentro de 3 sprints e da capacidade de um grupo de estudantes. | Must | seção 4, 6.4, 8.3 | Rastreabilidade entre o quadro de tarefas e a lista de funcionalidades do MVP ao fim de cada sprint, com qualquer item fora da lista registrado como evolução futura em vez de implementado. |
| RNF-63 | O sistema opera exclusivamente com dados fictícios de demonstração, sem dados de pacientes reais em nenhum ambiente do projeto. | Must | LGPD art. 11, derivado | Declaração no documento de requisitos e conferência da massa de dados de todos os ambientes antes da apresentação, confirmando origem fictícia. |
| RNF-64 | A plataforma não processa pagamentos, não armazena dados de cartão e não intermedia cobrança entre paciente e profissional. Espelha, como restrição de escopo, a exclusão funcional de RF-20. | Won't | DEC-07, RF-20 | Ausência de campo, tela ou integração de pagamento, conferida em inspeção da interface e do modelo de dados. Justificativa: fora do escopo pedagógico e adiciona superfície regulatória desnecessária. |
| RNF-65 | A plataforma não oferece sessão por vídeo nem chamada em tempo real. Espelha, como restrição de escopo, a exclusão funcional de RF-21. | Won't | DEC-08, RF-21 | Ausência dessas funcionalidades na entrega, conferida na revisão de escopo. Justificativa: o produto atua entre as sessões, não nelas. |
| RNF-66 | A plataforma não bloqueia nem limita o uso de outros aplicativos no dispositivo do paciente nesta versão. Espelha, como restrição de escopo, a exclusão funcional de RF-32. | Won't | 6.1, DEC-09, RF-32 | Registro no documento de requisitos com a análise de viabilidade. Justificativa: em uma das plataformas móveis o recurso exige permissão especial sujeita a política restritiva de loja e, na outra, autorização concedida pelo fabricante, inviável no prazo e no contexto acadêmico. |
| RNF-67 | A validação do registro profissional não é feita por consulta automatizada ao cadastro nacional nesta versão, e sim por validação de formato, envio de documento comprobatório e aprovação por administrador. | Won't | 6.3 | Registro no documento de requisitos com a justificativa: não há interface pública documentada para consulta programática, e a alternativa por raspagem de páginas é frágil e juridicamente discutível. A validação por formato, documento e aprovação manual é demonstrada no roteiro de cadastro de psicólogo. |
| RNF-68 | Nenhum requisito não funcional deste documento depende de uma tecnologia específica ter sido escolhida; todos permanecem verificáveis qualquer que seja a definição da seção 8.2 do documento base. | Must | 8.2 | Revisão do documento por par externo ao autor buscando nome de framework, linguagem, banco, provedor ou biblioteca, com resultado esperado de zero ocorrências, e reverificação após o fechamento da stack. |

---

### 6.11 Resumo MoSCoW dos requisitos não funcionais

| Prioridade | Quantidade | Percentual |
|------------|------------|------------|
| Must | 42 | 62% |
| Should | 16 | 24% |
| Could | 5 | 7% |
| Won't | 5 | 7% |
| **Total** | **68** | **100%** |

**Must (42):** RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-06, RNF-07, RNF-08, RNF-10, RNF-11, RNF-12, RNF-13, RNF-14, RNF-16, RNF-19, RNF-20, RNF-21, RNF-22, RNF-23, RNF-25, RNF-26, RNF-27, RNF-28, RNF-30, RNF-31, RNF-32, RNF-34, RNF-36, RNF-37, RNF-46, RNF-50, RNF-51, RNF-52, RNF-53, RNF-55, RNF-56, RNF-57, RNF-58, RNF-61, RNF-62, RNF-63, RNF-68

**Should (16):** RNF-09, RNF-15, RNF-17, RNF-24, RNF-29, RNF-33, RNF-35, RNF-38, RNF-39, RNF-41, RNF-42, RNF-47, RNF-48, RNF-54, RNF-59, RNF-60

**Could (5):** RNF-18, RNF-40, RNF-43, RNF-44, RNF-45

**Won't (5):** RNF-49, RNF-64, RNF-65, RNF-66, RNF-67

**Leitura da distribuição:** a concentração em Must é alta porque a maioria dos requisitos vem de restrição legal ou ética (seções 7 e 7.1 do documento base), que não admite negociação de prioridade. A folga do grupo está concentrada em desempenho e em acessibilidade estendida, onde as metas foram deliberadamente calibradas para o que 3 sprints permitem demonstrar.

---

### 6.12 Assunções e pontos em aberto dos requisitos não funcionais

Nenhum RNF deste documento depende de uma tecnologia específica ter sido escolhida. A seção 8.2 do documento base segue aberta (frontend web, mobile, backend, banco, provedor e modelo de IA, notificações, repositório e board, padrão de commits, idioma do código) e os requisitos acima foram redigidos para permanecer verificáveis qualquer que seja a definição. As assunções abaixo estão registradas para revisão quando a stack fechar.

**Assunções feitas:**

1. **A1.** Assumi que existirá pelo menos um ambiente de teste local controlado pelo grupo, no qual as medições de desempenho (RNF-41 a RNF-45) possam ser feitas de forma repetível. Sem esse ambiente, os números viram estimativa e precisam ser rebaixados a Could.
2. **A2.** Assumi a proposta da seção 6.4 (aplicativo do psicólogo em web, aplicativo do paciente em mobile) ao redigir RNF-59 e RNF-61. A pendência 8.1.1 ainda não confirmou essa divisão; se ela mudar, os dois requisitos precisam ser reescritos, embora a exigência de sincronização permaneça.
3. **A3.** Assumi que haverá suíte de testes automatizados executada a cada integração, pressuposto de RNF-08, RNF-50 e RNF-53. A ferramenta é irrelevante para os requisitos, mas a existência da suíte não é: sem ela, o critério de verificação de RNF-08 não se sustenta e o isolamento do relato privado ficaria comprovado apenas por inspeção manual, o que é fraco demais para a garantia prometida em DEC-12.
4. **A4.** Assumi prazos numéricos ainda não decididos como meta de projeto, sinalizados no texto: expiração de sessão em 30 minutos (RNF-09) e limite de 5 tentativas de convite por 15 minutos (RNF-06). A validade do código de convite está aberta na pendência 8.1.3 e por isso RNF-05 fala em "prazo definido" sem fixar o número.
5. **A5.** Assumi que a política de retenção e exclusão (RNF-14) ainda será escrita pelo grupo. O documento base exige a política mas não define prazos por categoria de dado, e o conflito com a preservação do histórico de vínculos encerrados (seção 3.2) precisa ser resolvido dentro dela, motivo pelo qual RNF-15 ficou como Should.
6. **A6.** Assumi que o texto do contrato de prestação de serviços exigido pela Resolução CFP nº 9/2024 depende de validação com profissional antes de entrar no produto, o que justifica RNF-24 como Should e não Must.
7. **A7.** Assumi que a massa de teste de RNF-43 (20 psicólogos, 100 pacientes, 2.000 relatos, 5.000 mensagens) é dimensionamento arbitrário do grupo, escolhido para ser gerável por script simples. Não representa projeção de uso real, que o projeto não tem base para estimar.
8. **A8.** Assumi que a exportação de dados do titular (RNF-18) pode ficar fora do MVP sem prejuízo legal para um sistema que opera apenas com dados fictícios (RNF-63). Se em algum momento o projeto for usado com dado real, RNF-18 sobe imediatamente para Must.
9. **A9.** Assumi, em RNF-35, um subconjunto de critérios da WCAG 2.1 nível AA (contraste, alvo de toque, foco visível, rótulo de campo) em vez da conformidade integral. Conformidade completa é inviável de auditar no prazo de 3 sprints, e prometer o que não se audita enfraquece o documento.
10. **A10.** Assumi que a pseudonimização (RNF-29) cobre apenas os campos estruturados enviados ao serviço de IA. O texto livre escrito pelo paciente pode conter identificadores que a plataforma não tem como remover com garantia, e essa limitação precisa constar da transparência exigida por RNF-27.

**Pontos em aberto que impedem fechar RNF nesta sprint:**

- Prazo de expiração e regra de revogação do código de convite (pendência 8.1.3), que fecha o número de RNF-05.
- Critérios de busca do catálogo (pendência 8.1.2), que podem gerar RNF adicional de desempenho de consulta.
- Divisão de papéis e cronograma das 3 sprints (pendência 8.3), que ainda não permitem afirmar quais Could são alcançáveis.
- Idioma do código (pendência 8.2), pré-requisito de RNF-52.


---

## 7. Visão consolidada

| Categoria | Must | Should | Could | Won't | Total |
|-----------|------|--------|-------|-------|-------|
| Requisitos funcionais | 35 | 8 | 2 | 4 | 49 |
| Requisitos não funcionais | 42 | 16 | 5 | 5 | 68 |
| **Total** | **77** | **24** | **7** | **9** | **117** |

A concentração em Must é alta e isso é consequência do domínio, não falta de critério de corte: dado de saúde é dado pessoal sensível, e a maior parte dos requisitos vem de restrição legal ou ética que não admite negociação de prioridade. A folga real do grupo está em desempenho, acessibilidade estendida e nos direitos do titular que dependem de dado real, que este projeto não usa.

### 7.1 Requisitos que sustentam os trilhos éticos do produto

Quatro compromissos do produto não podem ser relaxados sem descaracterizá-lo. Cada um está amarrado a requisitos verificáveis:

| Compromisso | Requisitos que o tornam testável |
|-------------|----------------------------------|
| A IA nunca age sozinha nem persiste nada sem confirmação humana | RF-41, RF-42, RNF-30, RNF-31, RNF-32, RNF-33 |
| O relato privado do paciente não sai do escopo dele | RF-22, RF-23, RF-24, RNF-08, RNF-19 |
| O psicólogo registra medicação já prescrita por médico, nunca prescreve | RF-27, RF-28, RF-29, RF-38, RF-39, RF-43, RNF-26, RNF-36 |
| A escolha de tratamento não vira ranking comercial | RF-09, RF-19, RF-34, RNF-20, RNF-21, RNF-22, RNF-23 |

O isolamento do relato privado merece destaque: RNF-08 exige que a garantia viva na camada de dados e seja provada por teste automatizado a cada integração, não por inspeção de tela. É a diferença entre um produto que promete sigilo e um que o sustenta.

---

## 8. Limitações conhecidas

Registradas aqui por decisão de projeto. Documentar o que foi cortado, e por quê, é parte da entrega.

**8.1 Limite de uso de outros aplicativos (RF-32, RNF-66).** O bloqueio ou limitação de aplicativos de terceiros no dispositivo do paciente exige, em uma das plataformas móveis, recursos de sistema sujeitos a política restritiva de loja e, na outra, autorização especial concedida pelo fabricante mediante aprovação. Inviável no prazo e no contexto acadêmico. Fica como evolução futura, com a análise de viabilidade registrada.

**8.2 Validação automática do registro profissional (RNF-67).** O conselho federal mantém o cadastro nacional de profissionais como consulta pública, mas não há interface pública documentada para consulta programática. A alternativa por raspagem de páginas é frágil e juridicamente discutível. O MVP valida formato do número e da região, exige documento comprobatório e submete o cadastro à aprovação de administrador (RF-33, RF-44). A consulta automatizada fica documentada como evolução futura.

**8.3 Ausência de Responsável Técnico (RNF-25).** A Nota Técnica CRP-PR 002/2022 recomenda que profissionais se vinculem apenas a plataformas que tenham psicólogo como Responsável Técnico registrado no conselho regional. O modelo proposto neste TCC não conta com esse profissional. A limitação é declarada abertamente: em uso real, seria pré-requisito de operação.

**8.4 Operação apenas com dados fictícios (RNF-63).** O sistema não recebe dados de paciente real em nenhum ambiente do projeto. Isso é o que permite priorizar como Could alguns direitos do titular, como a exportação de dados (RF-31, RNF-18). Se o projeto for usado com dado real, esses requisitos sobem imediatamente para Must.

**8.6 O responsável legal não acessa a plataforma (RF-49, DEC-17).** O produto atende pacientes a partir de 12 anos e, para menores de 18, exige no cadastro o contato de um responsável legal, disponível ao psicólogo. O responsável não recebe conta, não autentica e não visualiza nada: nem relato, nem conversa, nem prontuário. A devolutiva a ele é ato do profissional, fora da plataforma.

Isso é decisão de projeto, não omissão, e apoia-se em dois pontos. O primeiro é clínico: o relato só tem valor terapêutico se o paciente puder escrever sem plateia, e o compromisso do relato privado perderia sentido justamente na faixa etária em que os assuntos mais difíceis envolvem a própria família. O segundo é ético: no atendimento a criança e adolescente cabe ao psicólogo informar ao responsável o estritamente essencial, em benefício de quem é atendido, e um painel de acesso amplo passaria por cima desse julgamento profissional.

**A contrapartida está declarada:** o consentimento do responsável ocorre fora do sistema e entra nele por registro do psicólogo (RF-49). A plataforma comprova que o registro existe, quem o fez e quando, mas não comprova o ato do consentimento em si. Um portal do responsável, com visão restrita de agenda e medicação, fica documentado como evolução futura.

**8.5 Dobro de frontend (RNF-34, RNF-57, RNF-58, RNF-61).** Dois aplicativos com 3 sprints e um grupo de estudantes é risco real. As mitigações adotadas são backend, banco, autenticação e contrato de interface compartilhados, design system único, e a proposta de o aplicativo do psicólogo ser web, com menos telas, e o do paciente ser mobile. A confirmação dessa divisão segue pendente.

---

## 9. Pendências abertas ao fim desta versão

Nenhuma delas impede a aprovação deste documento, mas todas precisam de decisão antes do avanço das sprints.

| # | Pendência | Requisitos afetados | Prazo recomendado |
|---|-----------|---------------------|-------------------|
| 1 | Plataforma de cada aplicativo (web ou mobile) | RF-16, RNF-59, RNF-61 | Antes da Sprint 2 |
| 2 | Critérios definitivos de busca do catálogo | RF-09 | Antes da Sprint 2 |
| 3 | Prazo de expiração e revogação do código de convite | RF-06, RF-07, RF-08, RNF-05 | Antes da Sprint 2 |
| 4 | Prazos por categoria de dado na política de retenção | RF-47, RNF-14, RNF-15 | Antes da Sprint 3 |
| 5 | Texto do contrato de prestação de serviços, validado com profissional | RF-48, RNF-24 | Antes da Sprint 3 |
| 6 | Idioma do código e padrão de commits e ramos | RNF-51, RNF-52 | Antes da Sprint 2 |
| 7 | Divisão de papéis e cronograma das 3 sprints | RNF-62 | Imediato |

As definições técnicas em aberto da seção 8.2 do documento base (frontend web, mobile, backend, banco, provedor e modelo de IA, notificações, repositório e board) não bloqueiam este documento: RNF-68 exige, e a redação garante, que nenhum requisito aqui dependa de uma tecnologia específica ter sido escolhida.

---

## 10. Glossário

| Termo | Definição |
|-------|-----------|
| Relato | Registro livre feito pelo paciente sobre situações da semana. Pode ser compartilhado ou privado. |
| Relato privado | Relato que o paciente escolheu não compartilhar. Invisível ao psicólogo em conteúdo, existência e contagem. |
| Tarefa | Atividade atribuída pelo psicólogo ao paciente para o intervalo entre sessões. |
| Análise semanal | Resumo dos tópicos principais dos relatos compartilhados, gerado por serviço de IA sob solicitação explícita do psicólogo. |
| Vínculo | Relação formal entre um paciente e um psicólogo na plataforma. Estados: pendente, ativo, encerrado. |
| Convite | Código de uso único gerado pelo psicólogo para trazer à plataforma um paciente que ele já atende. |
| Catálogo | Listagem de profissionais com perfil publicado, disponível apenas a pacientes sem vínculo ativo. |
| Medicação em uso | Registro de medicamento já prescrito por médico, lançado pelo psicólogo e confirmado pelo paciente. A plataforma não prescreve. |
| Prontuário | Visão consolidada do acompanhamento de um paciente, disponível ao psicólogo com vínculo. |
