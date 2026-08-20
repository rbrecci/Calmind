# Roteiro de entrevistas

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
**Calmind** — Saúde Mental & Acolhimento
Sprint 1, entregável "Coleta e análise dos requisitos". Revisão de 20/08/2026.

> Instrumento de campo aplicado a 4 pessoas: 2 psicólogas e 2 pacientes. A aplicação é feita pelo formulário `formulario.html`, nesta mesma pasta, que grava as respostas no navegador e exporta a síntese pronta em Markdown.
>
> Este documento é o roteiro revisável e a cópia de papel. O formulário é a ferramenta de aplicação. **Se uma pergunta mudar aqui, mude no formulário também.**

---

## 1. Quem é entrevistado e por quê

| Código | Pessoa | Papel | Foco específico |
|--------|--------|-------|-----------------|
| E1 | Elisa | Psicóloga | Roteiro A completo |
| E2 | Stephany | Psicóloga | Roteiro A completo |
| P1 | Miguel | Paciente em acompanhamento | Roteiro B + bloco M: atritos da relação paciente–psicólogo e o que precisa melhorar |
| P2 | Bruna | Paciente que interrompeu | Roteiro B + bloco B: por que parou e o que a teria feito continuar |

**Elisa e Stephany respondem exatamente o mesmo roteiro, sem se conhecerem.** Isso é deliberado: a força do diagnóstico da seção 1.1 do `documento-base-sprint1.md` vem de dores que convergiram de forma independente. Roteiro idêntico é o que torna a convergência verificável, e não coincidência de conversa.

**Miguel e Bruna dividem o mesmo tronco de perguntas** e se separam no último bloco. Bruna é a entrevistada mais valiosa do conjunto, e a razão é desconfortável: o produto inteiro aposta que apoio entre as sessões aumenta a adesão. Quem parou de fazer terapia é a única pessoa da amostra capaz de dizer se essa aposta tem chance de ser verdade.

---

## 2. Como aplicar sem cansar quem responde

Estas cinco regras valem mais que o roteiro em si.

1. **Não leia as alternativas em voz alta.** Faça a pergunta, deixe a pessoa responder do jeito dela, e só então marque a opção que corresponde. As opções existem para *você* tabular depois, não para a pessoa escolher. Ler lista de alternativas é o que transforma entrevista em interrogatório.
2. **Anote a frase original.** Toda pergunta tem o campo "nas palavras da pessoa". Uma frase textual vale mais na defesa do TCC que dez marcações. Se a resposta não couber em nenhuma opção, use "Outra" — isso é achado, não erro.
3. **Não persiga o roteiro.** Se a pessoa já respondeu a P-12 enquanto falava da P-08, marque e siga. Repetir pergunta já respondida é a principal causa de entrevista cansativa.
4. **Perguntas marcadas `opcional` são descartáveis.** O formulário tem o **modo enxuto**, que esconde todas elas de uma vez.
   O roteiro completo tem 44 perguntas para as psicólogas e 42 para o Miguel, 43 para a Bruna: algo entre 30 e 35 minutos.
   No modo enxuto sobram 30 para as psicólogas e 33 ou 34 para os pacientes, o que fecha em 20 a 25 minutos.
   O cronômetro do formulário fica vermelho aos 40 minutos. Quando ficar, pule direto para o bloco de fecho.
5. **Perguntas marcadas `sensível` podem ser puladas sem explicação.** Diga isso uma vez, antes de começar, e respeite sem insistir. Nenhuma delas é necessária para o projeto.

### 2.1 Cuidado específico com a entrevista da Bruna

O bloco B trata de interrupção de tratamento de saúde mental. Quem entrevista é estudante de desenvolvimento de sistemas, não terapeuta, e o objetivo é entender uma decisão, não investigar um sofrimento.

- Não pergunte diagnóstico, não peça detalhe clínico, não sugira que ela deveria ter continuado.
- Se a conversa ficar pesada, pare o roteiro. Encerrar uma entrevista incompleta é resultado aceitável; insistir não é.
- Tenha o **CVV 188** e o CAPS mais próximo anotados antes de começar, e ofereça se fizer sentido. Não como parte do roteiro: como pessoa.

---

## 3. Ética e dados (obrigatório antes da primeira pergunta)

O sistema declara operar só com dados fictícios, mas a **pesquisa de campo é com pessoas reais**. As duas coisas convivem assim:

- Consentimento verbal registrado no formulário antes de qualquer pergunta, com data e forma.
- **Nenhum dado identificável é digitado na ferramenta.** Sem sobrenome, sem CRP, sem telefone, sem e-mail, sem nome de clínica. O formulário não tem campo para isso.
- Na síntese publicada no repositório as pessoas viram **E1, E2, P1 e P2**. Os nomes ficam fora do Git.
- Gravação de áudio só com autorização explícita, e o arquivo não entra no repositório.
- A pessoa pode pedir a exclusão da participação a qualquer momento, e nesse caso o registro é apagado do repositório no commit seguinte.

Isso não é burocracia. É o mesmo princípio que o produto promete no RNF-29 e no art. 11 da LGPD. Uma pesquisa que trata dado sensível com menos cuidado do que o sistema promete tratar enfraquece o próprio argumento do TCC.

### 3.1 Texto de abertura (ler, não improvisar)

> Obrigado por topar. Sou estudante do curso técnico de desenvolvimento de sistemas do SENAI e estou fazendo um trabalho de conclusão: um aplicativo de apoio no intervalo entre uma sessão de terapia e a seguinte. Não estou vendendo nada e não existe resposta certa. São mais ou menos 30 minutos.
>
> Nada do que você falar vai para o trabalho com o seu nome: você aparece como "E1" ou "P1". Não vou anotar telefone, e-mail nem nada que identifique você ou outras pessoas. Pode pular qualquer pergunta sem me explicar por quê, e pode parar quando quiser.
>
> Tudo bem se eu for registrando suas respostas enquanto a gente conversa? / Tudo bem gravar o áudio, só para eu não perder nada?

---

## 4. Roteiro A — psicólogas (Elisa e Stephany)

Legenda: `essencial` entra sempre · `opcional` cai no modo enxuto · `sensível` pode ser pulada · `→` o que a pergunta valida no projeto.

### Bloco A1 · Perfil profissional

**P-01** `essencial` Há quanto tempo você atende?
`até 2 anos` · `2 a 5` · `5 a 10` · `mais de 10`

**P-02** `essencial` Você atende de que forma hoje? → RNF-61, A-04
`só presencial` · `só online` · `os dois`

**P-03** `opcional` Quantos pacientes você acompanha por semana? → RF-35, RNF-45
`até 5` · `6 a 15` · `16 a 30` · `mais de 30`

**P-04** `essencial` Qual público predomina? *(múltipla)* → define se o bloco de família se aplica
`crianças` · `adolescentes` · `adultos` · `idosos`

### Bloco A2 · Comunicação entre as sessões → D-01

**P-05** `essencial` Fora do horário da sessão, seus pacientes te procuram? → RF-15
`nunca` · `raramente` · `às vezes` · `com frequência` · `o tempo todo`

**P-06** `essencial` Por onde eles te procuram? *(múltipla)* → linha de base: é isso que o produto precisa substituir
`WhatsApp pessoal` · `WhatsApp comercial` · `e-mail` · `telefone` · `rede social` · `não me procuram` · `outro`

**P-07** `essencial` O que mais te incomoda nesse contato fora de sessão? *(múltipla)* → RF-15, RF-16
`mistura com a vida pessoal` · `expectativa de resposta imediata` · `o registro se perde no meio da conversa` · `assunto que precisaria de sessão` · `não me incomoda` · `outro`

**P-08** `essencial` `aberta` Conte a última vez em que uma mensagem fora de horário te colocou numa situação difícil.

**P-09** `essencial` Quando o paciente é criança ou adolescente, como funciona a comunicação com a família? *(múltipla)* → DEC-17, RF-49
`falo com os responsáveis em horário combinado` · `os responsáveis me procuram a qualquer hora` · `evito contato direto` · `faço devolutivas periódicas` · `não atendo esse público`

**P-43** `essencial` `aberta` Com paciente adolescente, onde você traça a linha entre o que conta ao responsável e o que fica só entre vocês dois? → **valida DEC-17: o Calmind decidiu não dar acesso nenhum ao responsável, e essa é a pergunta que confirma ou derruba a decisão**

**P-44** `essencial` `sensível` `aberta` E quando o responsável é parte do problema, o que muda no seu trabalho? → DEC-17, e a lacuna de protocolo de risco de P-12

> P-43 e P-44 foram criadas em 20/08/2026, junto com a decisão de atender a partir dos 12 anos. Os números seguem a ordem de criação e não a posição no texto, mesma convenção do `documento-requisitos.md`.

**P-10** `essencial` `escala 1-5` Um canal de mensagens dentro de uma plataforma de trabalho, em que fica combinado que a resposta não é imediata, ajudaria? → RF-15

### Bloco A3 · Risco e crise entre as sessões

> Bloco novo, fora da lista original de tópicos. Existe porque hoje **nenhum RF cobre o que o sistema faz quando aparece conteúdo de risco num relato**, e um app de saúde mental sem esse caminho definido não sobrevive a uma arguição.

**P-11** `essencial` `sensível` Já aconteceu de um paciente relatar algo grave entre as sessões?
`sim, mais de uma vez` · `sim, uma vez` · `não` · `prefiro não responder`

**P-12** `essencial` Numa ferramenta em que o paciente escreve durante a semana, o que ela **precisa** fazer se aparecer conteúdo de risco? *(múltipla)* → gera RF novo
`mostrar canais de emergência ao paciente na hora` · `me notificar imediatamente, mesmo fora do horário` · `me notificar no próximo acesso` · `não fazer nada automático, só registrar` · `deixar o paciente sinalizar urgência` · `outro`

**P-13** `opcional` `aberta` E o que essa ferramenta **não** pode fazer de jeito nenhum nessa situação?

### Bloco A4 · Tarefas entre as sessões → D-03

**P-14** `essencial` Você combina atividades para o paciente fazer entre as sessões? → RF-37
`sempre` · `na maioria das vezes` · `às vezes` · `raramente` · `não faz parte da minha abordagem`

**P-15** `opcional` Como isso fica registrado hoje? *(múltipla)* → RF-25, RF-37
`só falado na sessão` · `o paciente anota` · `eu anoto e mando depois` · `papel impresso` · `não formalizo`

**P-16** `essencial` Na sua experiência, quanto volta feito?
`quase tudo` · `mais da metade` · `menos da metade` · `quase nada` · `não acompanho`

**P-17** `essencial` O que mais atrapalha a adesão? *(múltipla)* → RF-16, RF-28
`esquecimento` · `tarefa mal combinada` · `o paciente não vê sentido` · `vergonha de mostrar o resultado` · `a semana foi difícil demais` · `outro`

**P-18** `essencial` Um lembrete automático no celular do paciente ajudaria ou atrapalharia? → RF-16
`ajudaria muito` · `ajudaria` · `indiferente` · `pode atrapalhar` · `atrapalharia`

### Bloco A5 · Recapitulação e preparo da sessão → D-04

**P-19** `essencial` Quanto do tempo da sessão costuma ir em recapitular a semana?
`quase nada` · `até 10 minutos` · `10 a 20 minutos` · `mais de 20 minutos` · `varia muito`

**P-20** `essencial` E isso é um problema? → **pergunta que pode derrubar a dor D-04, e é exatamente para isso que ela existe**
`é perda de tempo` · `é necessário, mas dá para encurtar` · `é trabalho clínico legítimo, não é perda` · `depende do paciente`

**P-21** `opcional` Como você se prepara hoje antes de atender? *(múltipla)* → RF-36
`releio minhas anotações` · `de memória` · `não sobra tempo` · `releio na hora, com o paciente entrando` · `uso prontuário eletrônico`

**P-22** `essencial` `escala 1-5` Se antes da sessão você recebesse um resumo do que o paciente registrou na semana, isso mudaria seu preparo? → RF-41

**P-23** `essencial` Esse resumo seria gerado por inteligência artificial, **só quando você pedir**, e nada entraria no prontuário sem você confirmar. Como você se sente com isso? → DEC-04, DEC-05, RF-41, RF-42
`confortável` · `confortável, com ressalvas` · `desconfortável, mas usaria` · `não usaria` · `preciso entender melhor`

**P-24** `opcional` `aberta` O que faria você **não** confiar nesse resumo?

### Bloco A6 · Sigilo, relato privado e registro → DEC-12 a DEC-15

**P-25** `essencial` O paciente poderia marcar alguns relatos como privados: você não veria o conteúdo nem saberia que existem. Isso: → **valida DEC-12 e DEC-14, hoje sem nenhuma prova de campo**
`protege o processo` · `é indiferente` · `me deixa desconfortável` · `atrapalha o trabalho clínico`

**P-26** `opcional` E se você soubesse ao menos **quantos** relatos privados existem, sem ver o conteúdo? → DEC-14
`melhor assim, quero saber que existem` · `tanto faz` · `pior, isso me faria cobrar o paciente` · `não sei`

**P-27** `opcional` Onde ficam suas anotações de paciente hoje? *(múltipla)* → RF-36, RNF-17
`caderno de papel` · `arquivo no computador` · `prontuário eletrônico` · `não anoto` · `outro`

**P-28** `opcional` `aberta` O que a Resolução CFP 9/2024 te obriga a registrar, e que uma plataforma teria que suportar? → RF-36, RF-48

### Bloco A7 · Medicação → DEC-10, risco 6.2

**P-29** `opcional` Seus pacientes usam medicação psiquiátrica?
`a maioria` · `cerca da metade` · `a minoria` · `é raro` · `não sei dizer`

**P-30** `opcional` Você acompanha a adesão de alguma forma? *(múltipla)* → RF-39
`pergunto na sessão` · `o paciente comenta espontaneamente` · `falo com o psiquiatra quando autorizado` · `não acompanho`

**P-31** `essencial` Na plataforma, **você registraria** a medicação já prescrita por um médico, o paciente confirmaria, e o app só lembraria do horário. O app nunca prescreve nem altera dose. Isso: → **valida DEC-10, a decisão eticamente mais arriscada do produto**
`faz sentido e eu usaria` · `faria com ressalvas` · `não é meu papel registrar isso` · `não usaria`

### Bloco A8 · Ferramentas e chegada de pacientes → D-05, D-06

**P-32** `essencial` Que ferramentas você usa hoje para trabalhar? *(múltipla)*
`WhatsApp` · `agenda do Google` · `caderno de papel` · `planilha` · `prontuário eletrônico pago` · `nenhuma` · `outro`

**P-33** `opcional` O que te faz abandonar uma ferramenta? *(múltipla)* → RNF-34 a RNF-40
`preço` · `complicada demais` · `não confio no sigilo` · `não resolve meu problema real` · `dá mais trabalho do que ajuda` · `outro`

**P-34** `opcional` Como novos pacientes chegam até você hoje? *(múltipla)* → D-06
`indicação` · `redes sociais` · `plataforma de agendamento` · `convênio` · `clínica` · `outro`

**P-35** `essencial` Você toparia aparecer num catálogo dentro do app, com nome, CRP, abordagem e modalidade, **sem nota, sem estrela e sem preço**? → DEC-06, RF-34, art. 20 do Código de Ética
`sim` · `sim, com ressalvas` · `não`

**P-36** `essencial` Se você fosse indicar um profissional para alguém, por quais critérios filtraria? *(múltipla)* → **fecha a assunção A-01, hoje em aberto**
`abordagem` · `especialidade` · `modalidade` · `região` · `público atendido` · `idioma` · `outro`

### Bloco A9 · Rotina e qualidade de vida

**P-37** `opcional` Quantas sessões você atende num dia cheio?
`até 4` · `5 a 6` · `7 a 8` · `mais de 8`

**P-38** `essencial` O que mais pesa na rotina? *(múltipla)*
`carga emocional` · `trabalho administrativo entre sessões` · `instabilidade de renda` · `contato fora de horário` · `deslocamento` · `isolamento profissional` · `outro`

**P-39** `opcional` Quanto tempo por semana some em trabalho administrativo?
`menos de 1h` · `1 a 3h` · `3 a 5h` · `mais de 5h`

**P-40** `essencial` Se uma ferramenta pudesse te devolver tempo em **um ponto só**, qual seria? → prioriza o MVP
`preparo de sessão` · `anotação e prontuário` · `agenda e remarcação` · `comunicação fora de horário` · `acompanhamento de tarefas` · `outro`

### Bloco A10 · Fecho

**P-41** `essencial` `aberta` De tudo que a gente conversou, o que resolveria mais a sua vida?

**P-42** `essencial` `aberta` O que eu não perguntei e você acha que eu deveria ter perguntado?

---

## 5. Roteiro B — pacientes (Miguel e Bruna)

### Bloco B1 · Contexto do acompanhamento

**C-01** `essencial` Você faz ou já fez acompanhamento psicológico?
`faço atualmente` · `já fiz e parei` · `estou retomando` · `nunca fiz`

**C-02** `opcional` Por quanto tempo, ou há quanto tempo?
`menos de 3 meses` · `3 a 6 meses` · `6 meses a 1 ano` · `1 a 2 anos` · `mais de 2 anos`

**C-03** `essencial` De que forma? → A-04
`presencial` · `online` · `os dois`

**C-04** `opcional` Com que frequência?
`semanal` · `quinzenal` · `mensal` · `irregular`

### Bloco B2 · Como encontrou o profissional → D-06

**C-05** `essencial` Como você encontrou seu psicólogo? *(múltipla)* → RF-09
`indicação de conhecido` · `busca na internet` · `rede social` · `convênio` · `plataforma de agendamento` · `escola ou trabalho` · `posto de saúde ou CAPS` · `outro`

**C-06** `essencial` O que foi mais difícil nessa procura? *(múltipla)*
`preço` · `não saber escolher` · `demora para conseguir vaga` · `medo de não dar certo` · `falta de informação sobre o profissional` · `não foi difícil` · `outro`

**C-07** `essencial` Se existisse uma lista de profissionais dentro do app, o que você precisaria ver para escolher? *(múltipla)* → **fecha A-01 pelo lado do paciente. Se `preço` e `avaliações` forem os mais marcados, existe conflito real com DEC-06, e isso entra na síntese como tensão declarada, não é omitido**
`abordagem` · `especialidade` · `preço` · `modalidade` · `região` · `foto e apresentação` · `avaliações de outros pacientes` · `outro`

### Bloco B3 · Comunicação entre as sessões → D-01

**C-08** `essencial` Entre uma sessão e outra, você já quis falar alguma coisa e não falou?
`muitas vezes` · `algumas vezes` · `raramente` · `nunca`

**C-09** `essencial` O que te impediu? *(múltipla)* → RF-15
`achei que não era hora` · `não queria incomodar` · `não tinha por onde` · `esqueci até a sessão` · `achei que seria cobrado à parte` · `outro`

**C-10** `essencial` Quando chegou na sessão, você lembrava? → D-04
`lembrava tudo` · `lembrava parte` · `esquecia quase tudo` · `esquecia justamente o mais importante`

**C-11** `essencial` `escala 1-5` Um chat dentro do app, que o psicólogo responde quando puder e não na hora, te ajudaria? → RF-15

### Bloco B4 · Agenda e faltas → D-02

> Bloco novo. D-02 é uma das seis dores fundadoras do projeto e não estava na lista de tópicos dos pacientes.

**C-12** `opcional` Como você fica sabendo do horário da próxima sessão? *(múltipla)* → RF-26, RF-40
`combinamos na hora` · `ele manda mensagem` · `eu anoto` · `coloco na agenda do celular` · `nunca lembro direito`

**C-13** `essencial` Já perdeu ou remarcou sessão por esquecimento ou confusão de horário?
`várias vezes` · `uma ou duas` · `nunca`

**C-14** `essencial` `escala 1-5` Um lembrete automático da sessão ajudaria? → RF-16

### Bloco B5 · Tarefas entre as sessões → D-03

**C-15** `essencial` Seu psicólogo já pediu para você fazer algo entre as sessões? → RF-37
`sempre` · `às vezes` · `raramente` · `nunca`

**C-16** `essencial` E você fazia?
`sempre` · `na maioria das vezes` · `às vezes` · `raramente` · `nunca`

**C-17** `essencial` O que atrapalhava? *(múltipla)* → RF-25
`esquecimento` · `não entendi direito o que era para fazer` · `não vi sentido` · `falta de tempo` · `não estava bem` · `vergonha de mostrar o resultado` · `outro`

**C-18** `essencial` `escala 1-5` Ver essas tarefas em cards no celular, com lembrete, ajudaria? → RF-25, RF-16

### Bloco B6 · Lembrar o que falar na sessão → D-04

**C-19** `opcional` Você já tentou anotar o que queria falar na sessão?
`sim, tenho esse hábito` · `já tentei e parei` · `nunca tentei` · `faço de cabeça`

**C-20** `opcional` Onde? *(múltipla)*
`notas do celular` · `papel` · `mensagem para mim mesmo` · `não anoto`

**C-21** `essencial` Um espaço no app para jogar esses tópicos ao longo da semana e levar para a sessão: → RF-22
`usaria toda semana` · `usaria às vezes` · `acho que não usaria`

### Bloco B7 · Relatos, sigilo e resumo → DEC-12, DEC-13, RF-22, RF-41

**C-22** `essencial` Escrever um relato livre durante a semana, sobre como você está e o que aconteceu, é algo que você faria? → RF-22
`sim, gosto de escrever` · `faria se fosse rápido` · `só se me pedissem` · `não faria`

**C-23** `essencial` Saber que o psicólogo vai ler mudaria o que você escreve? → **testa a hipótese que sustenta DEC-12**
`mudaria muito` · `mudaria um pouco` · `não mudaria` · `não sei`

**C-24** `essencial` Se você pudesse marcar alguns relatos como **privados**, que ele não vê nem sabe que existem: → DEC-12, DEC-14, RF-23
`usaria e escreveria mais` · `usaria às vezes` · `não faria diferença` · `preferiria que ele visse tudo`

**C-25** `essencial` Antes da sessão, um resumo dos seus relatos apareceria para o psicólogo, para ele já chegar sabendo da sua semana. Isso: → RF-41
`facilitaria muito` · `facilitaria` · `tanto faz` · `me deixaria desconfortável`

**C-26** `essencial` Esse resumo é feito por uma inteligência artificial, só quando o psicólogo pede, e só com o que você escolheu compartilhar. Como você se sente? → RF-04, RNF-29
`tranquilo` · `tranquilo, desde que avisado antes` · `desconfortável, mas aceitaria` · `não aceitaria` · `preciso entender melhor`

### Bloco B8 · Medicação → DEC-10

**C-27** `opcional` `sensível` Você usa ou já usou medicação prescrita por psiquiatra?
`uso atualmente` · `já usei` · `nunca usei` · `prefiro não responder`

**C-28** `essencial` `sensível` Já esqueceu de tomar? → RF-28
`com frequência` · `às vezes` · `raramente` · `nunca` · `não se aplica`

**C-29** `essencial` Um lembrete no celular, registrado pelo psicólogo e **confirmado por você** antes de valer: → DEC-10, RF-27
`ajudaria muito` · `ajudaria` · `indiferente` · `não gostaria`

### Bloco B9 · Notificações, quanto é demais

> Bloco novo. Um app de saúde mental que insiste demais não é neutro: ele machuca e é desinstalado. Isso vira RNF de frequência e de conteúdo de notificação.

**C-30** `essencial` Quantos avisos por dia desse app seriam aceitáveis? → RF-16
`nenhum` · `1` · `2 a 3` · `mais de 3` · `tanto faz`

**C-31** `essencial` O que faria você desligar as notificações ou desinstalar? *(múltipla)* → **gera RNF de privacidade em tela bloqueada**
`aviso demais` · `horário ruim` · `texto que expõe o assunto na tela de bloqueio` · `me lembrar de coisa ruim quando estou mal` · `não resolver nada` · `outro`

### Bloco B10 · Rotina e qualidade de vida

**C-32** `opcional` O que mais pesa na sua rotina hoje? *(múltipla)*
`trabalho ou estudo` · `sono` · `dinheiro` · `relações` · `saúde` · `falta de tempo para mim` · `outro`

**C-33** `essencial` O acompanhamento se encaixa bem na sua rotina?
`encaixa bem` · `dá para levar` · `é difícil encaixar` · `foi um dos motivos de eu parar`

**C-34** `opcional` `sensível` E o custo?
`tranquilo` · `aperta, mas dá` · `é o maior obstáculo` · `não pago, é convênio ou gratuito`

### Bloco M · Só para Miguel — a relação e o que precisa melhorar

**M-01** `essencial` `aberta` O que funciona bem na relação com seu psicólogo?

**M-02** `essencial` `aberta` E o que você mudaria, se pudesse?

**M-03** `essencial` Já sentiu que ele não lembrava do que vocês tinham conversado antes? → D-04, RF-36
`várias vezes` · `algumas vezes` · `raramente` · `nunca`

**M-04** `essencial` Já deixou de falar algo importante na sessão? *(múltipla)* → RF-22, DEC-12
`por vergonha` · `por medo de julgamento` · `não era o momento` · `esqueci` · `achei que não era relevante` · `nunca deixei`

**M-05** `opcional` `aberta` Se você pudesse mandar um recado anônimo para o seu psicólogo, qual seria?

**M-06** `essencial` O que uma ferramenta entre as sessões teria que fazer para você usar de verdade? *(múltipla)*
`ser rápida de preencher` · `não me cobrar nada` · `me ajudar a lembrar do que falar` · `me deixar escrever quando bater a vontade` · `garantir que é privado` · `outro`

### Bloco B* · Só para Bruna — a interrupção

> Ler antes: "agora eu queria entender a parte de ter parado. Pode responder só o que você quiser."

**B-01** `essencial` Como foi essa parada? → RF-13, RF-14
`avisei e encerramos` · `fui espaçando até parar` · `parei de uma vez, sem avisar` · `o profissional encerrou` · `mudança externa, como mudar de cidade ou perder o convênio`

**B-02** `essencial` `sensível` E os motivos? *(múltipla)*
`dinheiro` · `horário e rotina` · `não sentia evolução` · `não me identifiquei com o profissional` · `me senti melhor e achei que não precisava mais` · `distância e deslocamento` · `vergonha ou desconforto` · `outro`

**B-03** `opcional` `sensível` `aberta` Teve um momento específico em que você pensou "não vou mais"?

**B-04** `essencial` Alguma coisa poderia ter te feito continuar? *(múltipla)* → **a pergunta que julga a tese do produto**
`sessão mais barata` · `horário mais flexível` · `ter sido online` · `sentir que estava evoluindo` · `o profissional ter percebido antes` · `algum contato entre as sessões` · `nada, foi a decisão certa`

**B-05** `essencial` Nas semanas antes de parar, se alguém tivesse te perguntado, você teria dito que estava difícil? → **testa se dá para perceber o desengajamento antes do abandono**
`sim, se me perguntassem` · `talvez` · `não diria` · `não sei`

**B-06** `essencial` Você pensa em voltar?
`já voltei` · `quero voltar` · `talvez` · `não`

**B-07** `essencial` O que te ajudaria a voltar? *(múltipla)* → D-06, RF-09
`achar alguém que combine comigo` · `preço` · `horário` · `alguém me lembrar` · `não sei` · `outro`

### Bloco B11 · Fecho

**C-35** `essencial` `aberta` Se esse app existisse na época, o que ele teria que resolver para valer a pena para você?

**C-36** `essencial` `aberta` O que eu não perguntei e você acha que eu deveria ter perguntado?

---

## 6. O que fazer com as respostas

A entrevista não é o entregável. O entregável é o que sai dela.

| Saída | Arquivo | Como |
|-------|---------|------|
| Registro bruto por pessoa | `sintese-E1.md` … `sintese-P2.md` | Exportar do formulário em Markdown e commitar |
| Convergências e divergências | `analise-convergencias.md` | Comparar E1 com E2 e P1 com P2, pergunta a pergunta |
| Personas | `personas.md` | Duas, uma de psicóloga e uma de paciente, construídas a partir dos dados e não da imaginação |
| Atualização das dores | seção 1.2 do `documento-base-sprint1.md` | Confirmar, corrigir ou derrubar D-01 a D-06 |
| Fechamento de assunções | seção 5.7 do `documento-requisitos.md` | A-01 tem resposta direta em P-36 e C-07 |

### 6.1 O que este roteiro pode gerar de requisito novo

Três blocos foram acrescentados porque apontam para lacunas do documento atual. Se o campo confirmar, viram requisito:

| Origem | Lacuna | Requisito provável |
|--------|--------|--------------------|
| P-12, P-13 | Nenhum RF diz o que o sistema faz diante de conteúdo de risco num relato | RF de protocolo de risco, com canal de emergência exibido ao paciente e regra explícita de o que o app **não** decide |
| C-30, C-31 | RF-16 define notificação, mas não teto de frequência nem sigilo do texto na tela bloqueada | RNF de frequência máxima e de notificação sem conteúdo clínico no preview |
| P-09, P-43, P-44 | ~~Paciente menor de idade não aparece em nenhum ator nem RF~~ **Fechado em 20/08/2026:** o produto atende a partir de 12 anos, e o responsável legal entra como contato, sem acesso (DEC-16 a DEC-18, RF-49) | O campo agora não abre a decisão, ele a testa. Se as duas psicólogas disserem que precisam de um canal com o responsável dentro da plataforma, DEC-17 volta para a mesa |

O terceiro deixou de ser lacuna e virou decisão registrada antes mesmo da primeira entrevista. As perguntas continuam no roteiro, agora com outra função: em vez de descobrir o que fazer, verificar se a decisão se sustenta diante de quem atende adolescente toda semana.

### 6.2 Regra de honestidade

Se o campo derrubar uma hipótese, **a hipótese cai e isso vai escrito**. Os pontos com maior chance de serem contrariados, e o que fazer se forem:

- **P-20 pode dizer que recapitular não é perda de tempo.** Se as duas psicólogas disserem isso, D-04 está errada como formulada, e o argumento do resumo por IA muda de "economizar tempo de sessão" para "não perder informação da semana". O produto continua de pé, a justificativa muda.
- **C-24 pode dizer que relato privado é indiferente.** DEC-12 continua defensável por princípio, mas perde o apoio empírico, e isso precisa estar escrito na justificativa em vez de escondido.
- **C-07 pode apontar preço e avaliações como decisivos.** DEC-06 não muda, porque decorre de restrição do CFP e não de preferência do grupo. Mas a síntese precisa registrar que existe um custo de adoção conhecido e assumido.
- **B-04 pode responder "nada, foi a decisão certa".** Isso não invalida o produto: delimita a promessa. O app apoia quem está em acompanhamento, não retém quem decidiu sair. Escrever essa fronteira é mais forte do que fingir que ela não existe.

Pesquisa que só confirma o que o grupo já queria fazer não é pesquisa, é ilustração. A banca percebe a diferença.
