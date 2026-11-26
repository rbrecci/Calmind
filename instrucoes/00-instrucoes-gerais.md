# Fechamento do Calmind: instruções gerais das 3 frentes

**Vale para as três frentes.** Leia este arquivo inteiro, depois o arquivo da sua frente:

| Frente | Quem opera | Arquivo |
|--------|------------|---------|
| Backend Laravel | Codex do Rafael | [codex-rafael-backend.md](codex-rafael-backend.md) |
| App, lado do paciente | Codex do Caio | [codex-caio-app-paciente.md](codex-caio-app-paciente.md) |
| App, lado do psicólogo | Codex da Mariana | [codex-mariana-app-psicologo.md](codex-mariana-app-psicologo.md) |

Data de escrita: 29/10/2026. Congelamento de funcionalidades (marco M5): **30/10/2026**.

---

## 1. Objetivo

Deixar o ciclo paciente e psicólogo funcionando ponta a ponta no celular: **consentimento, vínculo, relato, tarefa, chat e agenda**, mais notificações dentro do app. Medicação, análise por IA e auditoria de leitura estão **cortadas** (seção 3.8.6 do contrato) e nenhuma frente as implementa.

As três frentes rodam **ao mesmo tempo, em computadores diferentes, sem se falarem**. Depois, uma sessão de revisão (Claude, com o Saker) lê as três branches, corrige o que for preciso e integra tudo. Por isso o critério de sucesso de cada frente é: **entregar o máximo possível, certo, testado e empurrado para o GitHub, sem esperar ninguém**.

## 2. Regra de ouro: ninguém espera ninguém

Cada frente só depende de **arquivos que já existem hoje no repositório**. Os quatro mecanismos que garantem isso:

1. **Contrato escrito antes do código.** Todas as rotas novas estão descritas na seção 3.8 de [docs/api/contrato-api.md](../docs/api/contrato-api.md). O backend cumpre esse texto. Os dois apps programam contra esse texto, usando **mock**. Rota existente hoje: a fonte de verdade é o código do backend (`backend/app/Http/Requests/`, `backend/app/Http/Resources/`, `backend/routes/api/`) e a coleção [Calmind.postman_collection.json](../docs/api/Calmind.postman_collection.json).
2. **Cada frente é dona de pastas inteiras** (tabela da seção 4). Ninguém edita arquivo de outra frente. Sem arquivo em comum, não existe conflito de merge.
3. **Os apps nunca esperam o servidor.** Cada app tem seu módulo de API com uma implementação mock fiel ao contrato. O app é desenvolvido e testado só contra o mock. A ligação com o servidor real é feita na integração.
4. **Contrato insuficiente não é bloqueio.** Se o texto não responder uma dúvida, faça a suposição **mínima e mais provável**, escreva-a na seção "Suposições" do seu relatório (seção 9) e siga em frente. Nunca pare para perguntar a outra frente: ela não vai ver a pergunta.

Se uma tarefa da sua frente só pode ser concluída com algo que outra frente entregaria, **entregue a sua metade contra o contrato** e registre no relatório o que ficou dependendo da outra.

## 3. Estado de partida (verificado em 29/10/2026)

- Backend Laravel com API em `/api/v1`: autenticação (Sanctum), cadastro e aprovação de psicólogo, catálogo, convite, vínculo, relatos com privacidade e tarefas. 197 testes, 3556 asserções passaram em 23/10.
- App Expo e React Native: entrada, escolha de perfil, cadastro do paciente, catálogo, tarefas do paciente. O lado do psicólogo é uma tela vazia (`app/src/app/(psychologist)/dashboard.tsx`). 66 testes do app passam.
- Faltam no backend: consentimento (rotas), chat, agenda, notificações, lista de pacientes, perfil. As tabelas já existem.
- Faltam no app: quase tudo além de login, cadastro, catálogo e tarefas do paciente.
- Nada foi testado em celular físico. Não declare o contrário.

Contexto do produto: [README.md](../README.md), [Sprint2.md](../Sprint2.md), [documento-requisitos.md](../docs/documento-requisitos.md) (critérios de aceitação de cada RF).

## 4. Quem pode editar o quê

| Caminho | Rafael (backend) | Caio (app paciente) | Mariana (app psicólogo) |
|---------|:---:|:---:|:---:|
| `backend/**` | **dono** | só leitura | só leitura |
| `docs/api/**` (contrato, Postman, runner) | **dono** | só leitura | só leitura |
| `app/src/app/(patient)/**` | não | **dono** | não |
| `app/src/api/patient/**` (novo) | não | **dono** | não |
| `app/src/patient/**` (novo) | não | **dono** | não |
| `app/src/catalog/**` | não | **dono** | não |
| `app/src/app/(psychologist)/**` | não | não | **dona** |
| `app/src/api/psychologist/**` (novo) | não | não | **dona** |
| `app/src/psychologist/**` (novo) | não | não | **dona** |
| `app/package.json`, `app/package-lock.json`, `app/app.json` | não | não | **dona** (ver o arquivo dela) |
| `instrucoes/relatorio-<sua-frente>.md` | o dele | o dele | o dela |

**Intocável por todas as frentes** (a integração mexe depois): `app/src/app/_layout.tsx`, `app/src/app/(auth)/**`, `app/src/session/**`, `app/src/design-system/**`, `app/src/auth/**`, `app/src/components/**`, `app/src/api/types.ts`, `app/src/api/http.ts`, `app/src/api/mock.ts`, `app/src/api/index.ts`, `app/src/api/auth-token.ts`, `landing/**`, `docs/**` (exceto `docs/api/**`, que é do Rafael) e o resto de `instrucoes/` fora do seu relatório.

Precisa de um componente de tela que o design system não tem (cartão, selo, linha de lista)? Crie na **sua** pasta de feature, montado com os primitivos do design system (`Screen`, `Text`, `Button`, `TextField`, `Colors`, `Radius`, `Spacing`). Nada de código de cor solto. A integração decide depois se sobe para o design system. Tipos de dados parecidos nos dois apps (mensagem, consulta) ficam **duplicados** de propósito: duplicar três tipos custa menos que uma dependência entre frentes.

Precisa de uma dependência nova? Não instale. Única exceção: a Mariana, descrita no arquivo dela.

## 5. Git: como trabalhar

Branch-base: `integracao/fechamento-30-10` (contém estas instruções e o contrato v2). Cada frente tem a sua branch:

| Frente | Branch |
|--------|--------|
| Rafael | `codex/rafael-backend` |
| Caio | `codex/caio-app-paciente` |
| Mariana | `codex/mariana-app-psicologo` |

```bash
git fetch origin
git checkout -b codex/<sua-branch> origin/integracao/fechamento-30-10
# ... trabalho ...
git push -u origin codex/<sua-branch>
```

- **Um commit por unidade que faz sentido sozinha** (uma rota com o teste dela, uma tela com a lógica dela). **Dê push a cada commit**, não só no fim: se o tempo acabar, o que está no GitHub é o que será revisado.
- Mensagem de commit no modelo do [CONTRIBUTING.md](../CONTRIBUTING.md): `tipo(escopo): o que mudou`, tudo minúsculo, **sem acento**, sem ponto final, no máximo 70 caracteres. Tipos: `feat`, `fix`, `docs`, `chore`. Escopo usual: `api`, `app`, `testes`. Foco no porquê quando couber.
- **Autoria é de quem opera a máquina.** Use a identidade git já configurada ali (`git config user.name` e `git config user.email`). Se estiverem vazias, pare e avise. **Nunca** adicione `Co-Authored-By`, selo de geração por IA ou qualquer assinatura de ferramenta em commit.
- Proibido: push em `main` ou em `integracao/fechamento-30-10`, merge, rebase de branch já empurrada, `--force`, `--no-verify`, abrir Pull Request. A integração é feita depois, por outra sessão.
- Se o `git push` falhar (rede, permissão), não insista mais de duas vezes: deixe os commits locais e diga isso no relatório.
- Aviso de "LF will be replaced by CRLF" é do Windows e pode ser ignorado.

## 6. Regra 0: proibido travessão (vale para todo texto que você escrever)

Nenhum texto que você gerar pode conter **travessão (U+2014)**, **traço médio (U+2013)** ou **sinal de menos tipográfico (U+2212)**. Isso vale para código, comentário, texto de tela, mensagem de commit, nome de variável, documentação, relatório, teste e dado de seed. Negativo e intervalo escrevem-se com hífen comum. Prefira reescrever a frase com vírgula, dois-pontos, parênteses ou ponto, em vez de só trocar o caractere.

**Antes de cada commit**, rode na raiz do repositório:

```bash
node instrucoes/varrer-travessao.mjs
```

| Exit | Saída | O que fazer |
|------|-------|-------------|
| 0 | `LIMPO ...` | pode commitar |
| 1 | lista `arquivo:linha` e `ACHOU ...` | reescreva as frases listadas e rode de novo |
| 2 | `A varredura quebrou` | corrija o ambiente (precisa de Node e de `git fetch origin` feito) e rode de novo |

A varredura olha só o que **você** criou ou alterou em relação a `origin/main`. Tela vazia ou ausência de linha não prova nada: **confira o exit code**. Se a varredura apontar um arquivo que você não tocou, não é seu: diga no relatório e siga.

## 7. Honestidade sobre o que está pronto

Declare conclusão **só** neste formato, com a evidência colada:

```
Feito: [o que mudou]
Evidência: [comando rodado] -> [resultado]
Não verificado: [o que ficou sem prova, e por quê]
```

- Proibido na frase de conclusão: "deve funcionar", "provavelmente", "acho que", "em teoria". Isso significa que você não rodou. Rode, ou declare que é incerto.
- Não invente nome de rota, campo, flag ou função. Confira no código ou no contrato antes de usar. O que não está no contrato nem no código **não existe**.
- Dependência nova só com conferência no registro (`npm view`). Em geral, nenhuma entra.
- Mesma coisa falhando **três vezes**: pare, liste o que tentou e o que cada tentativa devolveu, registre no relatório e passe para o próximo item. Nunca finja sucesso.
- Etapa pulada é declarada. Resultado parcial não é apresentado como completo.
- O app foi verificado **contra o mock**, não contra o servidor real, e **não em celular físico**. Escreva exatamente isso, não "funciona".

## 8. Como trabalhar cada item (laço de entrega)

1. Escolha o próximo item da lista da sua frente, **na ordem**. Itens de prioridade P1 antes de P2, P2 antes de P3.
2. Regra de negócio (validação, permissão, conflito de agenda, gate de consentimento, mock): **escreva o teste primeiro, rode, veja falhar**, só então implemente. Guarde o trecho da falha para o relatório. Tela puramente visual: teste depois ou só conferência.
3. Rode a bateria da sua frente (no arquivo dela). **Tudo verde antes de commitar.** Nunca deixe a bateria quebrada no commit.
4. Varredura de travessão (seção 6).
5. Commit e push.
6. Próximo item.

Escopo: **bug não vira refactor, tarefa não vira helper genérico**. Não renomeie, não mova, não apague arquivo que você não criou. Não adicione feature que ninguém pediu. Comentário só quando o porquê não é óbvio. Código com a mesma cara do código em volta: mesma densidade de comentário, mesma nomenclatura. Identificadores em inglês, texto que o usuário lê em português com acentuação correta (RNF-52).

Regras que quebram o projeto se violadas, resumo de [regras-inviolaveis.md](../docs/engenharia/regras-inviolaveis.md) (leia o arquivo completo):

- Nenhuma rota de `/psychologist` ou `/admin` toca a tabela `reports` nem o Model `Report`; relato privado nunca aparece, nem em conteúdo, nem em id, nem em contagem. Relato privado ou de outro paciente responde 404, nunca 403.
- Consentimento antes de dado clínico. Corpo de relato e de mensagem cifrado em repouso.
- Erro sempre `{message, errors?}`, data ISO 8601 com offset, lista `{data, meta: {total, page, per_page}}`.
- Sem preço, nota, estrela ou ranking em lugar nenhum. Sem a palavra "prescrever".
- Regra de negócio só no Laravel. O app não decide permissão, não valida regra clínica.
- Token só no armazenamento seguro. URL da API só por variável de ambiente.
- Dados sempre fictícios.

## 9. Relatório obrigatório

Arquivo: `instrucoes/relatorio-<rafael|caio|mariana>.md`. Crie no início e **atualize a cada commit**, não só no fim (se o tempo acabar, ele precisa estar em dia). Estrutura fixa:

```markdown
# Relatório da frente <nome>

## Estado final
Branch, último commit (hash), data e hora da última atualização.

## Itens
| Item | Situação (feito, parcial, não feito) | Commit | Evidência |

## Evidência colada
Saídas brutas dos comandos (testes, lint, tipos, pint). Inclua também o trecho
da falha do teste que você escreveu primeiro nas regras de negócio.

## Suposições
Cada vez que o contrato ou o código foi insuficiente: a dúvida, a suposição
que você fez e o que mudaria a decisão.

## Desvios do contrato
Tudo que você implementou diferente do texto da seção 3.8, com o motivo.
(Backend: se for inevitável, corrija também o contrato e diga aqui.)

## Dependências abertas
O que da sua frente só fecha quando outra frente entregar, e o que é preciso
conferir na integração.

## Não verificado
O que ficou sem prova e por quê.

## Arquivos que você criou ou alterou fora da sua pasta
Deve ficar vazio. Se não ficou, explique.
```

Sem travessão no relatório, e sem hedge ("provavelmente") nas conclusões.

## 10. Se o ambiente da sua máquina falhar

Instalação, banco, versão de Node ou de PHP diferente do esperado: tente corrigir, no máximo três tentativas distintas, registrando cada comando e o erro. Não reescreva configuração do projeto para contornar problema da sua máquina. Passou de três: pare esse item, registre no relatório, siga com o que não depende do ambiente quebrado. Não declare como testado o que não rodou.

## 11. Pronto da frente

A frente termina quando todos os itens P1 e P2 do seu arquivo estão feitos e verdes, ou quando o tempo acabar. Nos dois casos, o último passo é o mesmo: relatório em dia, bateria final rodada com a saída colada, varredura limpa, `git push`. Avise quem opera a máquina com uma linha: branch, hash do último commit, itens feitos e itens que sobraram.
