# Relatório da frente Caio

## Estado final

Atualizado em 29/10/2026, 09:22 (America/Sao_Paulo). Branch: codex/caio-app-paciente. Base: cc13e3cbfc4b823deb9377f72fe8390216939f2e, de origin/integracao/fechamento-30-10. O operador autorizou commit com mensagem sugerida e push. Mensagem: feat(app): completa ciclo do paciente com mock e testes. O hash do commit que contém este relatório pode ser consultado com git log -1 --format=%H -- instrucoes/relatorio-caio.md. O resultado do push será conferido comparando HEAD com a referência remota.

Feito: C1 a C9 e C10 implementados. Funciona contra o mock que segue o contrato.
Evidência: npm.cmd test, 97 testes aprovados; npm.cmd run lint e npx.cmd tsc --noEmit, exit 0. Fluxos também exercitados no navegador web.
Não verificado: o app foi verificado contra o mock, não contra o servidor real, e não em celular físico.

## Itens

| Item | Situação | Commit | Evidência |
| --- | --- | --- | --- |
| C1 API do paciente | feito | sem commit | Adaptador HTTP, cenários e erros com testes |
| C2 Consentimento | feito | sem commit | Testes do gate e recusa/aceite no navegador |
| C3 Vínculo | feito | sem commit | Convite inválido e válido, catálogo, confirmação e pendência no navegador |
| C4 Relatos | feito | sem commit | Compartilhado, privado e despublicação no navegador |
| C5 Tarefas | feito | sem commit | Prazo 03/11/2026, conclusão no navegador e ordenação testada |
| C6 Chat | feito | sem commit | Envio/leitura no navegador, polling, erro de envio e cancelamento em testes |
| C7 Agenda | feito | sem commit | Grupos por dia/fuso testados, lista sem escrita no navegador |
| C8 Notificações | feito | sem commit | Leitura e navegação, contador 3 para 2 para 0 no navegador |
| C9 Navegação | feito | sem commit | Menu na home e retorno que fecha telas intermediárias |
| C10 Encerramento | feito | sem commit | Confirmação, histórico preservado e envio bloqueado no navegador |
| C11 Calendário | não feito | | |
| C12 Acessibilidade | parcial | sem commit | Inspeção web de rótulos, seleção, 44 pontos e 3 larguras; sem leitor de tela nativo |

## Plano de execução

Aplicação das skills writing-plans e test-driven-development ao roteiro já aprovado nos arquivos de instruções. O plano fica neste relatório para respeitar a proibição de editar docs/.

1. C1: criar types.ts, http.ts, mock.ts e index.ts em app/src/api/patient/, com testes de cenários, erros, paginação e idempotência. Implementação HTTP recebe request; mock usa o token de sessão e isola estado por usuário.
2. C2: decideConsentGate com estados carregando, erro, aceite e liberado. Provider e gate em patient/ e layout do paciente; consent.tsx sem acesso às telas clínicas durante falha ou recusa.
3. C3: home por situação do vínculo, invitation.tsx e catálogo com confirmação de solicitação. Preservar a ordem da API e as rotas /home e /catalog.
4. C4: reports.tsx e new-report.tsx. Seletor de visibilidade acima do texto, padrão compartilhado. Despublicação confirmada com aviso de análise anterior e PATCH fiel ao backend.
5. C5: tasks.tsx preserva listar, concluir e atualizar; ordenação e data em funções puras testadas.
6. C6: chat.tsx com funções testadas de combinação de mensagens e polling em foco, after_id, leitura e falha de envio com reenviar. Histórico de vínculo encerrado é somente leitura.
7. C7: agenda.tsx e agrupamento por dia local testado, futuras antes de passadas, sem controles de escrita.
8. C8 e C9: notifications.tsx e mapa seguro de tipos, contador na home e menu do ciclo com ações rotuladas de 44 pontos.
9. Verificar cada unidade com npm.cmd test, npm.cmd run lint, npx.cmd tsc --noEmit e a varredura. Manter saídas brutas abaixo. Preparar stage somente dos caminhos autorizados e pedir a mensagem de commit ao operador antes de commitar. Push depende de confirmação direta do operador.

## Evidência colada

Primeira execução, antes de implementar C1:

```text
node --no-warnings --test src/api/patient/mock.test.ts
Error [ERR_MODULE_NOT_FOUND]: Cannot find module app/src/api/patient/mock.ts
tests 1
pass 0
fail 1
exit 1
```

### Bateria final de 29/10/2026

```text
$ npm.cmd test
> calmind@1.0.0 test
> node --no-warnings --test "src/**/*.test.ts"

▶ cliente HTTP
  ✔ catalogPsychologists faz GET em /catalog/psychologists com o token (103.6043ms)
  ✔ catalogPsychologists repassa o 403 com a mensagem da API (2.8281ms)
✔ cliente HTTP (109.1419ms)
▶ mock da API
  ▶ login
    ✔ devolve um token para credenciais válidas (12.1239ms)
    ✔ usa a mesma resposta para senha errada e e-mail desconhecido (55.3428ms)
    ✔ responde 422 com errors por campo quando falta dado (3.3581ms)
  ✔ login (73.2592ms)
  ▶ me
    ✔ responde 401 sem token (10.8281ms)
    ✔ devolve o usuário do token, com o papel e sem a senha (14.6776ms)
  ✔ me (26.3072ms)
  ▶ logout
    ✔ invalida o token (40.5071ms)
  ✔ logout (41.0668ms)
  ▶ register
    ✔ cria a conta com o papel pedido e nunca devolve a senha (5.5417ms)
    ✔ a conta criada consegue entrar (22.3876ms)
    ✔ recusa e-mail repetido com 422 e sem vazar dado da conta existente (15.847ms)
    ✔ exige data de nascimento de paciente (3.845ms)
    ✔ exige dados do responsável para paciente menor de idade (1.2574ms)
  ✔ register (49.7849ms)
  ▶ catálogo de psicólogos
    ✔ exige autenticação (2.1263ms)
    ✔ só o paciente acessa o catálogo (7.6387ms)
    ✔ lista nome, CRP, abordagem e modalidade, na ordem do nome (45.8416ms)
    ✔ não expõe preço, nota, estrela nem ranking (25.581ms)
  ✔ catálogo de psicólogos (81.8442ms)
  ▶ tarefas do paciente
    ✔ exige autenticação para listar (2.5515ms)
    ✔ lista e conclui uma tarefa mantendo a mesma data ao repetir (59.0264ms)
    ✔ não mostra tarefa de outro paciente (45.6556ms)
  ✔ tarefas do paciente (108.9652ms)
✔ mock da API (383.0361ms)
✔ adaptador envia métodos, rotas, filtros e corpos do contrato (5.8292ms)
✔ mensagens genéricas e limite de convite seguem ApiErrorRenderer (7.0049ms)
✔ dados do paciente de teste não aparecem para outra conta (26.7836ms)
✔ sem sessão recebe 401 e outro papel recebe 403 (1.4472ms)
✔ os três cenários mantêm vínculos e dados coerentes (10.7471ms)
✔ aceite da versão vigente é idempotente e libera mensagens (4.6825ms)
✔ leitura de mensagens só marca a outra parte e não repete contagem (6.931ms)
✔ encerrar vínculo preserva histórico e bloqueia escrita (2.8589ms)
✔ solicitação fica pendente e convite ativa o vínculo sem duplicar (3.9674ms)
✔ relatos mantêm privacidade e despublicação idempotente conforme o backend (1.2208ms)
✔ conclusão de tarefa e leituras de notificação são idempotentes (1.464ms)
✔ paginação informa o total e não vaza mutações da tela para o mock (0.7398ms)
▶ toIsoDate
  ✔ converte DD/MM/AAAA para o formato do contrato (1.6808ms)
  ✔ devolve o texto limpo quando não é DD/MM/AAAA (0.4455ms)
✔ toIsoDate (4.2312ms)
▶ isMinor
  ✔ é verdadeiro de 12 a 17 anos (4.8739ms)
  ✔ é falso aos 18 anos completos hoje e abaixo de 12 (0.3879ms)
  ✔ é falso para data ilegível, sem derrubar a tela (0.349ms)
✔ isMinor (6.1246ms)
▶ validateRegisterForm
  ✔ cadastro de adulto completo não tem erro (2.8836ms)
  ✔ aponta cada campo obrigatório vazio (0.8643ms)
  ✔ recusa e-mail sem formato de e-mail (0.7724ms)
  ✔ recusa senha curta (0.394ms)
  ✔ recusa confirmação de senha diferente (0.4684ms)
  ✔ recusa data de nascimento fora do formato DD/MM/AAAA (0.3429ms)
  ✔ paciente menor de idade precisa dos três dados do responsável (0.3089ms)
  ✔ psicólogo não precisa de data de nascimento nem de responsável (0.2418ms)
✔ validateRegisterForm (7.2047ms)
▶ buildRegisterInput
  ✔ paciente adulto manda a data em ISO e nada de responsável (0.5021ms)
  ✔ paciente menor manda os dados do responsável (0.2645ms)
  ✔ psicólogo não manda data de nascimento (0.194ms)
✔ buildRegisterInput (1.25ms)
▶ authErrorMessage
  ✔ login com 401 usa o texto da tela 02, sem dizer qual campo errou (0.4252ms)
  ✔ cadastro com 422 manda olhar os campos marcados (0.236ms)
  ✔ conflito 409 mostra a mensagem que a API mandou (0.1897ms)
  ✔ sem rede mostra a mensagem do cliente HTTP (0.1536ms)
  ✔ erro desconhecido vira mensagem genérica de cada fluxo (0.1739ms)
✔ authErrorMessage (1.482ms)
▶ loadCatalog
  ✔ devolve os profissionais na ordem que a API mandou (3.7551ms)
  ✔ lista vazia vira o estado vazio, não erro (0.4296ms)
  ✔ erro da API mostra a mensagem em português que ela mandou (2.2907ms)
  ✔ falha que não é da API vira mensagem humana, sem detalhe técnico (0.4809ms)
✔ loadCatalog (9.4855ms)
▶ modalityLabel
  ✔ traduz os três valores do contrato (0.5638ms)
  ✔ perfil sem modalidade informada não inventa texto (0.2877ms)
✔ modalityLabel (1.2047ms)
▶ contraste da identidade visual
  ✔ reproduz as medições publicadas em identidade-visual.md (3.3624ms)
  ✔ texto e placeholder passam sobre o fundo branco (0.5231ms)
  ✔ texto e placeholder passam sobre o fundo de campo (0.5643ms)
  ✔ texto de erro passa sobre o fundo branco (0.4042ms)
  ✔ texto de erro sobre o fundo de campo reprova, por isso fica abaixo do campo (0.5536ms)
  ✔ o texto de cada lado passa sobre a cor do lado (0.6408ms)
  ✔ o texto passa sobre os dois extremos do gradiente (0.5476ms)
  ✔ branco sobre as cores de lado reprova, e por isso o texto é Dark (0.3892ms)
✔ contraste da identidade visual (14.3258ms)
▶ escala tipográfica da identidade visual
  ✔ os títulos seguem os tamanhos da identidade (3.2586ms)
  ✔ parágrafo é 16 e small é 14 (0.5178ms)
  ✔ títulos usam Quicksand SemiBold e o corpo usa Poppins (0.5ms)
  ✔ nenhum degrau desce abaixo de 14 (0.678ms)
  ✔ a altura de linha nunca é menor que o tamanho da fonte (0.4121ms)
✔ escala tipográfica da identidade visual (7.9701ms)
✔ agrupa consultas no dia do aparelho e separa próximas e passadas (3.7131ms)
✔ agenda vazia e todos os estados do contrato têm representação (0.8156ms)
✔ apresentação prioriza vínculo ativo, depois pendente, depois histórico (2.4273ms)
✔ carregamento e falha nunca liberam a área clínica (2.1276ms)
✔ só o aceite vigente informado pela API libera a área clínica (0.3994ms)
✔ combina mensagens sem duplicar e mantém a ordem crescente (5.2924ms)
✔ falha de envio preserva o rascunho sem objeto entregue (3.7864ms)
✔ polling usa after_id a cada 5 segundos, marca leitura e para ao sair de foco (15.6944ms)
✔ resultado atrasado após sair de foco não atualiza conversa nem marca leitura (1.7476ms)
✔ sair de foco também cancela a busca das próximas páginas do histórico (2.269ms)
✔ listas do paciente incluem as próximas páginas sem perder a ordem (5.226ms)
✔ interrompe paginação vazia e repassa erros sem entregar lista parcial (3.7794ms)
✔ notificações mostram somente tipo e destino, sem conteúdo clínico (2.2611ms)
✔ notificação antiga abre o vínculo da mensagem, mesmo com outro vínculo ativo (3.3876ms)
✔ notificação sem mensagem acessível mostra erro, sem abrir outra conversa (4.4931ms)
✔ erros de campo chegam ao paciente e exceções internas ficam ocultas (2.2493ms)
✔ datas sem hora não mudam de dia por causa do fuso (0.4245ms)
✔ tarefas pendentes vêm primeiro sem alterar o array original (1.8845ms)
✔ confirmação de despublicação avisa sobre análise anterior quando informada pela API (1.7706ms)
▶ restoreSession
  ✔ sem token guardado, pede login e não deixa token na memória (2.4231ms)
  ✔ com token válido, devolve o papel do /me e deixa o token ativo (7.8524ms)
  ✔ com token expirado (401), apaga o token guardado e pede login (2.3059ms)
  ✔ token revogado pelo logout também é apagado (8.8042ms)
  ✔ sem rede, pede login mas mantém o token guardado (0.7509ms)
  ✔ token de administrador não serve no app e é apagado (1.6572ms)
✔ restoreSession (26.6171ms)
ℹ tests 97
ℹ suites 18
ℹ pass 97
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1616.0904
exit 0

$ npm.cmd run lint
> calmind@1.0.0 lint
> expo lint

env: load .env
env: export EXPO_PUBLIC_API_URL EXPO_PUBLIC_USE_MOCK
exit 0

$ npx.cmd tsc --noEmit
(sem saída)
exit 0
```

### Varredura e integridade do diff

```text
$ node instrucoes/varrer-travessao.mjs
LIMPO (358 arquivos conferidos contra origin/main)
exit 0

$ git diff --check
(sem erros de whitespace)
exit 0
```

Os avisos de CRLF são do Git no Windows. A varredura incluiu também arquivos já existentes na branch de integração e os diretórios locais de docs/ do operador; nenhum foi editado para satisfazê-la.

### Falhas observadas antes das implementações e correções

```text
node --no-warnings --test src/api/patient/http.test.ts
ERR_MODULE_NOT_FOUND: app/src/api/patient/http.ts
exit 1

node --no-warnings --test src/patient/consent-gate.test.ts
ERR_MODULE_NOT_FOUND: app/src/patient/consent-gate.ts
exit 1

node --no-warnings --test src/patient/bonds.test.ts
ERR_MODULE_NOT_FOUND: app/src/patient/bonds.ts
exit 1

node --no-warnings --test src/patient/load-pages.test.ts
ERR_MODULE_NOT_FOUND: app/src/patient/load-pages.ts
exit 1

node --no-warnings --test src/patient/presentation.test.ts src/patient/reports.test.ts
SyntaxError: The requested module './presentation.ts' does not provide an export named 'formatDateOnly'
ERR_MODULE_NOT_FOUND: app/src/patient/reports.ts
exit 1

node --no-warnings --test src/patient/conversation.test.ts
ERR_MODULE_NOT_FOUND: app/src/patient/conversation.ts
exit 1

node --no-warnings --test src/patient/agenda.test.ts src/patient/notifications.test.ts
ERR_MODULE_NOT_FOUND: app/src/patient/agenda.ts
ERR_MODULE_NOT_FOUND: app/src/patient/notifications.ts
exit 1

node --no-warnings --test src/api/patient/mock.test.ts
mensagens genéricas e limite de convite seguem ApiErrorRenderer
AssertionError: The validation function is expected to return "true". Received false
Caught error: ApiError: Sessão inválida ou expirada. Entre novamente.
tests 11
pass 10
fail 1
exit 1

node --no-warnings --test src/patient/conversation.test.ts
sair de foco também cancela a busca das próximas páginas do histórico
AssertionError: Expected values to be strictly equal:
2 !== 1
tests 5
pass 4
fail 1
exit 1

node --no-warnings --test src/patient/conversation.test.ts
tests 5
pass 5
fail 0
exit 0

node --no-warnings --test src/patient/notifications.test.ts
SyntaxError: The requested module './notifications.ts' does not provide an export named 'notificationRoute'
exit 1

node --no-warnings --test src/patient/notifications.test.ts
tests 3
pass 3
fail 0
exit 0
```

As falhas por módulo ou export ausente foram observadas antes de escrever as respectivas implementações. O teste de paginação demonstrou uma falha de comportamento e passou após impedir nova página fora de foco.

### Inspeção no navegador com Playwright, contra o mock

```text
Recusa: refusalButtons = ["Sair da conta"]
Aceite: /consent -> /home

Novo relato em 390x844:
selector = {"x":24,"y":296.8333435058594,"width":167,"height":44}
Compartilhado: aria-checked="true"
Privado: aria-checked="false"

Responsividade:
390:  seletor 44 pontos, sem overflow horizontal, visível sem rolagem
768:  seletor 44 pontos, sem overflow horizontal, visível sem rolagem
1440: seletor 44 pontos, sem overflow horizontal, visível sem rolagem

Relatos:
"Registro fictício de verificação compartilhada." -> Compartilhado
"Anotação fictícia privada para teste." -> Privado
Despublicar -> Confirmar -> Despublicado

Tarefas:
Prazo: 03/11/2026
Concluída
completeButtons = 0

Chat:
"Mensagem fictícia de verificação no navegador." -> Enviada
Retorno ao início -> Conversa (0 não lidas)

Agenda:
03/11/2026, 15:00, Agendada, Online
20/10/2026, 15:00, Realizada, Presencial
agendaControls = ["Voltar ao início","Atualizar agenda"]

Notificações:
notificationFlow = "3 -> 2 -> 0"

Encerramento:
histórico preservado, sem controles de envio
Convite inválido -> 422 com errors.code
Convite ABCD2345 -> vínculo ativo
Catálogo -> Atticus Finch, Hermione Granger, ordem preservada
Confirmar solicitação -> Aguardando resposta do profissional

Notificação de conversa antiga após encerrar o vínculo:
url = "http://localhost:8081/chat?bondId=8"
historicalMessagesFound = 1
sendControls = 0

Controles da home:
rótulos presentes, altura mínima 44, sem overflow horizontal

Retorno do segundo plano simulado por visibilitychange na web:
draft = "Rascunho fictício preservado ao voltar ao aplicativo."
url = "http://localhost:8081/new-report"
selected = "true"
```

Revisão independente da skill requesting-code-review: corrigidos perda de rascunho por AppState e destino de notificação de outro vínculo. A segunda leitura confirmou as correções e o descarte de respostas de envio de outra geração da conversa.

A seleção acessível foi corrigida após o navegador mostrar radio sem aria-checked, apesar do fundo verde. O atributo explícito foi conferido novamente. Texto sobre verde usa Dark, inclusive a data da mensagem do paciente.

## Suposições

- O roteiro e o contrato fornecidos já definem o desenho desta implementação; não criar especificação em docs/, que é intocável.
- O convite fictício de desenvolvimento é ABCD2345. Convite inválido devolve 422 com errors.code, como InvitationService, apesar de C3 mencionar 404. A tela trata ambas as respostas.
- O backend existente impede mudar a visibilidade após postagem. PATCH preserva essa regra e retorna errors.visibility ao pedir outro valor. A retirada do compartilhamento ocorre por despublicação.
- Menu no início e retorno com dismissTo foram escolhidos para manter os cinco destinos legíveis, sem comprimir rótulos em abas, e fechar telas intermediárias ao voltar.
- Notificações de mensagem trazem resource_id, mas não bond_id. O app localiza a mensagem nos próprios vínculos com after_id e per_page=1, sem inventar rota nova. Se não encontrar, mostra erro em vez de abrir outra conversa.
- Consulta de consentimento acontece ao montar a área do paciente, ao tentar novamente e após o aceite. Não há revalidação por AppState, que desmontava telas e apagava rascunhos. A verificação de consentimento vigente nas gravações pertence ao servidor.
- O estado do mock fica em memória por usuário. Recarregar completamente a aplicação reinicia os cenários fictícios; logout não altera dados de outra conta. O módulo compartilhado de autenticação continua responsável pelo login e pela restauração da sessão.

## Desvios do contrato

Nenhuma rota ou formato novo foi inventado. Os formatos e caminhos existentes seguem o backend, conforme a prioridade das instruções gerais sobre o roteiro. Permanecem explicitadas acima as divergências do roteiro para convite inválido e imutabilidade de visibilidade.

O texto do termo do mock é fictício e identificado como tal, pois o termo vigente real será fornecido pelo backend.

## Dependências abertas

- Integração com as rotas novas a ser conferida contra o servidor real.
- O usuário autorizou em 29/10/2026 o commit com mensagem sugerida e o push da branch desta frente.
- As unidades foram implementadas e verificadas sem commits intermediários para concluir o trabalho autorizado antes de pedir a mensagem ao operador. O stage contém somente os caminhos da frente, sem incluir os arquivos locais de docs/.
- O novo módulo mock guarda tarefas e catálogo próprios para permanecer coerente com os cenários e com vínculos encerrados. Nenhum arquivo compartilhado de API foi editado; o adaptador real reaproveita request.
- Todas as chamadas do módulo foram exercitadas somente contra mock ou request injetado em teste: GET /consent-terms/current?type=general; POST /consent-acceptances; GET /patient/bonds; POST /patient/bonds/redeem-invitation; POST /patient/bonds/requests; POST /bonds/{id}/end; GET /catalog/psychologists; GET e POST /patient/reports; PATCH /patient/reports/{id}; POST /patient/reports/{id}/unpublish; GET /patient/tasks; POST /patient/tasks/{id}/complete; GET e POST /bonds/{id}/messages; POST /bonds/{id}/messages/read; GET /patient/appointments; GET /notifications; POST /notifications/{id}/read; POST /notifications/read-all.
- Conferir na integração mensagens de erro das rotas v2 que ainda não existiam na base, aceite de termo real, vínculo criado pelo psicólogo, recebimento de mensagens novas e atualização de consultas pelo profissional.

## Não verificado

- API real e celular físico.
- Grade mensal opcional C11 não implementada. A agenda é lista, conforme P1.
- C12 parcial: conferidos rótulos, foco pela ordem do conteúdo, seletor com aria-checked, alvos de 44 pontos, cores do design system com texto Dark sobre verde, ausência de escrita na agenda e larguras 390, 768 e 1440. TalkBack, VoiceOver, teclado virtual e ampliação de texto no celular não foram testados.
- Falha de envio e reenviar têm comportamento coberto nas funções e tratamento na tela; erro real de rede no aparelho não foi provocado.
- Não foi gerado nem instalado APK.
- A atualização completa de referências Git ficou sem resposta; a transferência limitada à revisão atual da branch foi concluída com HTTP/1.1 e depth=1. Nenhuma configuração do projeto foi alterada. A branch de trabalho foi criada diretamente da referência remota atualizada; pull adicional seria redundante.
- npm.ps1 bloqueado por assinatura no PowerShell. Usar npm.cmd, sem alterar a política de execução.
- npm.cmd ci inicialmente falhou com EPERM ao acessar o cache do usuário no sandbox. A repetição com acesso ao cache do usuário concluiu com 843 pacotes adicionados em 4 minutos, sem alterar package.json ou package-lock.json e sem dependência nova.
- Expo usou fallback de React Native DevTools porque dotslash não conseguiu criar diretório no cache. O bundler web compilou e as inspeções ocorreram normalmente. Não se alterou configuração do projeto para contornar isso.
- A primeira tentativa de iniciar Expo com --localhost e --offline foi recusada pelo CLI por opções incompatíveis. A execução com --web --port 8081 --offline iniciou corretamente. Os tipos de rotas estavam antigos; foram regenerados pelo Expo antes da bateria final, sem casts nem alteração de arquivos compartilhados.
- Algumas esperas do roteiro de navegador falharam por estado já aceito ou seletores de texto encontrarem telas ocultas da pilha. Os testes foram retomados a partir do estado real. A preservação de rascunho foi depois confirmada em recarga completa e sessão nova, simulando visibilitychange; isso não equivale a teste em aparelho.

## Arquivos que você criou ou alterou fora da sua pasta
