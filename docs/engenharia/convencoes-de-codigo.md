# Convenções de código

**Um projeto, um padrão.** Quatro pessoas codificando com apoio de IA produzem quatro estilos se
o padrão não estiver escrito.

Commit, branch e Pull Request estão em [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) e não são
repetidos aqui. Este arquivo cuida do código.

---

## 1. Idioma: inglês no código, português para o usuário

O RNF-52 exige um único idioma nos identificadores, definido antes da Sprint 2. É **inglês**, e vale
para variável, função, classe, tabela, coluna e campo de API. Decisão DP-14, fechada em 19/08/2026.

| Onde | Idioma | Exemplo |
|------|--------|---------|
| Nome de classe, método, variável | Inglês | `BondService`, `redeemInvitation()`, `$activeBond` |
| Tabela e coluna | Inglês | `bonds`, `active_patient_id` |
| Campo de JSON da API | Inglês | `{"patient_id": 3, "visibility": "shared"}` |
| **Mensagem que o usuário lê** | **Português** | `"Este codigo de convite ja foi usado."` |
| Comentário de código | Português | `// RF-12: no maximo 1 vinculo ativo por paciente` |
| Documentação | Português | este arquivo |

**Sem mistura.** `criarVinculo()` e `createBondAtivo()` são os dois erros, e a verificação do RNF-52
é revisão por amostragem ao fim da sprint.

---

## 2. Nomes, no padrão do Laravel

Não inventamos convenção: usamos a do framework, porque é a que a ferramenta de IA também conhece e
a que o professor reconhece.

| Coisa | Padrão | Exemplo |
|-------|--------|---------|
| Model | Singular, PascalCase | `Bond`, `Report`, `ConsentTerm` |
| Tabela | Plural, snake_case | `bonds`, `reports`, `consent_terms` |
| Controller | PascalCase + sufixo | `BondController`, `ReportController` |
| FormRequest | Ação + Model + `Request` | `StoreReportRequest`, `RedeemInvitationRequest` |
| Service | Model + `Service` | `BondService`, `InvitationService` |
| Policy | Model + `Policy` | `ReportPolicy` |
| Resource | Model + `Resource` | `ReportResource`, `ReportCollection` |
| Teste | Assunto + `Test` | `ReportPrivacyTest` |
| Chave estrangeira | `<entidade>_id` | `patient_id`, `bond_id` |
| Coluna booleana ou de estado | Sem `is_`, usa data ou enum | `consumed_at`, `status` |

A última linha merece explicação: o `schema.sql` não usa booleano para estado. Em vez de
`is_consumed`, existe `consumed_at` — que diz **se** e **quando**. Em vez de `is_active`, existe
`status` com enum. Mantenha isso: é o que permite auditar sem tabela extra.

---

## 3. Estilo

**PSR-12** no PHP, que é o padrão do Laravel. Sem discussão de chave na mesma linha ou na linha de
baixo: é o que o `laravel/pint` formata.

Rode antes de abrir o PR:

```bash
cd backend && ./vendor/bin/pint
```

No frontend, o formatador que vier com o projeto, configurado uma vez na fundação e commitado.
Formatação é trabalho de ferramenta, não de revisão de PR.

---

## 4. Comentário: quando vale e quando não

Comentário que repete o código é ruído. Comentário que explica **por que** vale ouro, e este projeto
tem muito "por quê" que não é óbvio.

O `schema.sql` já faz isso e é o modelo a seguir — ele não diz "esta é a tabela de vínculos", ele
diz por que a regra de 1 vínculo ativo mora num índice único em vez de num `if`.

| Vale comentar | Não vale |
|---------------|----------|
| A decisão por trás: `// CA-23.5: 404 e nao 403, para nao confirmar existencia` | `// cria o vinculo` |
| O requisito atendido: `// RNF-05: alfabeto sem 0/O e 1/I/l` | `// loop nos relatos` |
| A armadilha evitada: `// a view ja filtra privado, nao filtre de novo aqui` | `// retorna o json` |

**Cite o requisito.** `// RF-12` no lugar certo é o que transforma a seção de codificação do
documento ABNT em trabalho de meia hora em vez de uma noite.

---

## 5. Branch e PR, o essencial

O detalhe está no [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md). O que muda nesta sprint: até
agora o repositório usava branch com nome de pessoa (`Rafael`, `Zanetti`). Com seis blocos
paralelos, **branch por etapa** é o que mantém o PR pequeno e revisável:

```
feat/bloco-a-auth
feat/bloco-e-relatos
feat/landing-estrutura
docs/abnt-pre-textuais
```

Nada entra no `main` sem passar por PR, e PR grande é PR que ninguém revisa de verdade. Uma etapa
concluída, um PR.

---

## 6. Testes

| Tipo | Onde | Quando é obrigatório |
|------|------|----------------------|
| Teste de feature (HTTP) | `backend/tests/Feature/` | Em todo bloco |
| Teste das regras críticas | idem | RNF-53: isolamento do relato privado, autorização por vínculo ativo, uso único do convite, 1 vínculo ativo, ciclo da medicação |
| Coleção do Postman | `docs/api/` | É o critério de pronto de cada bloco |

**Um arquivo de teste por bloco**, com o nome do bloco. Mesma lógica do arquivo de rota: ninguém
edita o arquivo do outro.

O caso negativo é obrigatório, não opcional. Teste que só prova que o caminho feliz funciona não
prova nada sobre privacidade — e privacidade é o que este produto promete.

---

## 7. O que nunca entra num commit

| Não commite | Por quê |
|-------------|---------|
| `.env` | RNF-56, já está no `.gitignore` |
| `vendor/`, `node_modules/` | Já estão no `.gitignore` |
| Senha, chave de API, token | RNF-56, varredura com resultado esperado zero |
| APK, AAB, keystore | Já estão no `.gitignore` |
| Dado de pessoa real | RNF-63: só dado fictício, em qualquer ambiente |
| Áudio de entrevista | Regra da pesquisa de campo, já no `.gitignore` |
| Código que você não entende | Você vai precisar defender na banca |

A última não é piada. Código gerado por ferramenta entra como código do grupo, e a banca pergunta
"por que vocês fizeram assim". Ler antes de commitar é mais rápido que descobrir na apresentação.
