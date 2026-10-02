# Arquitetura do backend

**Onde cada coisa mora, e por quê.** Para que seis blocos escritos por duas pessoas com apoio de
IA saiam parecidos o suficiente para serem revisados.

---

## 1. O caminho de uma requisição

```
rota  ->  FormRequest  ->  Controller  ->  Service  ->  Model  ->  banco
                                   \
                                    ->  API Resource  ->  JSON
```

| Camada | Responsabilidade | O que ela nunca faz |
|--------|------------------|---------------------|
| **Rota** | Mapear método e caminho, aplicar middleware | Lógica |
| **FormRequest** | Validar entrada, devolver 422 no formato do contrato | Decidir regra de negócio |
| **Controller** | Receber, chamar o Service, devolver Resource | Montar query, calcular regra |
| **Service** | A regra de negócio. É aqui que ela vive | Saber que existe HTTP |
| **Model** | Acesso a dado, relacionamento, cast, escopo | Autorizar |
| **Policy** | Autorizar por papel e por vínculo ativo | Buscar dado |
| **API Resource** | Dar forma ao JSON de saída | Buscar dado |

**Por que o Service existe mesmo num projeto pequeno:** o mesmo caso de uso é chamado pela API
JSON que o app consome **e** pelo painel Blade do administrador. Se a regra estiver no Controller,
ela vira duas regras — exatamente o que o RNF-57 proíbe. No Service, ela é uma só, chamada de dois
lugares.

Controller fino não é preciosismo aqui: é o que permite o painel web e o app darem o mesmo
resultado, que é o critério de verificação escrito no próprio RNF-57.

---

## 2. As duas caras de `backend/`

| Cara | Rotas | Entrega | Quem consome |
|------|-------|---------|--------------|
| **API JSON** | `routes/api/*.php`, prefixo `/api/v1` | JSON | O app React Native |
| **Painel do administrador** | `routes/web.php` | HTML, Blade + Bootstrap | O navegador do admin |

As duas compartilham Models, Services, banco e autenticação. Muda só a camada de cima.

**Por isso não existe pasta `painel/` no repositório.** O painel são views Blade dentro deste
Laravel, atendendo RF-44, RF-45 e RF-46. Pasta separada significaria duplicar Model e regra.

---

## 3. Um arquivo de rota por bloco

Este é o detalhe que impede duas pessoas de colidirem o dia inteiro. O `routes/api.php` fica fino
e só agrega os arquivos de cada bloco:

| Arquivo | Bloco | Dono |
|---------|-------|------|
| `routes/api/auth.php` | A · autenticação | Rafael |
| `routes/api/consent.php` | B · consentimento | Zanetti |
| `routes/api/psychologist.php` | C · cadastro CRP e admin | Zanetti |
| `routes/api/bonds.php` | D · convite e vínculo | Rafael |
| `routes/api/reports.php` | E · relatos | Rafael |
| `routes/api/tasks.php` | F · tarefas | Zanetti |

Cada pessoa mexe no arquivo do seu bloco. **O `api.php` é o único arquivo compartilhado, e ele é
escrito uma vez na fundação e não se toca mais.**

---

## 4. O formato de erro, em um lugar só

O contrato §2.3 exige o mesmo formato em todo endpoint. Isso é configurado **uma vez**, no handler
de exceção, e nenhum Controller escreve resposta de erro na mão:

```json
{ "message": "...", "errors": { "campo": ["..."] } }
```

| Código | Quando |
|--------|--------|
| 200 / 201 | Deu certo / criou recurso |
| 401 | Sem token, token inválido ou expirado |
| 403 | Autenticado, mas o papel não pode |
| 404 | Não existe **ou não pode existir para quem perguntou** |
| 409 | Conflito de estado, como segundo vínculo ativo |
| 422 | Dados inválidos |

**A linha do 404 é regra de privacidade, não de estilo.** Relato privado pedido pelo psicólogo
responde 404, porque 403 confirmaria que existe alguma coisa ali (CA-23.5).

Mensagem de erro nunca expõe nome de tabela nem trecho de exceção (RNF-10, RNF-40).

---

## 5. A Model base e o formato de data

Decisão **DA-06**, fechada em 02/10/2026: **o contrato manda.** O Laravel serializa em UTC com `Z`;
o contrato §2.4 pede offset `-03:00`, e a coleção do Postman testa esse formato.

Resolvido uma vez, numa Model base que todas as outras estendem: sobrescreva `serializeDate()`
convertendo para o fuso de `config('app.timezone')` e devolvendo ISO 8601 com offset.

Pago uma vez, não volta a aparecer. O `contrato-api.md`, a coleção do Postman e o futuro texto do
ABNT continuam verdadeiros sem edição.

Para isso funcionar, `APP_TIMEZONE=America/Sao_Paulo` precisa estar no `.env` — ver
[`setup-backend.md`](setup-backend.md#4-configurar-o-ambiente).

---

## 6. Paginação e o formato do meta

Decisão **DA-07**, fechada em 02/10/2026: **o contrato manda.** O `paginate()` devolve
`current_page`, `last_page`, `from`, `to`, `path` e `links`; o contrato §2.5 define
`{total, page, per_page}`.

Resolvido uma vez, numa ResourceCollection base que sobrescreve `paginationInformation()` e
devolve só os três campos do contrato. Toda lista do projeto estende essa classe.

`links` e `path` saem de propósito: expõem estrutura de URL sem necessidade.

> **Cuidado com `meta.total` nas listas de relato.** Ele conta apenas o que aquele perfil pode ver.
> Um total que somasse relatos privados denunciaria a existência deles e quebraria o CA-23.2. Como
> as consultas do psicólogo leem a view `shared_reports`, isso sai certo de graça — desde que
> ninguém contorne a view.

---

## 7. A regra que não pode ser esquecida

**Nenhuma rota sob `/psychologist` ou `/admin` consulta a tabela `reports`.** Todas leem a view
`shared_reports`.

Na prática, duas Models sobre a mesma estrutura:

| Model | Tabela | Quem usa |
|-------|--------|----------|
| `Report` | `reports` | Só rotas sob `/patient` |
| `SharedReport` | `shared_reports` (view) | Toda rota de psicólogo e de admin |

As duas precisam do cast `encrypted` em `body`, senão a tela recebe texto cifrado.

Escrito assim, deixa de depender de alguém lembrar na hora de montar a query e passa a ser item
conferível na revisão de código. O teste automatizado do RNF-08 verifica exatamente isso, e a
suíte falha se uma nova consulta do perfil psicólogo for adicionada sem caso correspondente.

---

## 8. Autorização por papel e por vínculo ativo

O RNF-03 exige que o psicólogo alcance apenas dados de pacientes com vínculo em estado **ativo** —
não pendente, não encerrado. Isso vive numa Policy, não em `if` espalhado pelos Controllers: a
Policy confere o papel do usuário e a existência de um vínculo com `status = 'active'` entre aquele
psicólogo e aquele paciente.

Os casos negativos são obrigatórios na suíte: psicólogo sem vínculo, psicólogo com vínculo
encerrado e paciente lendo dado de outro paciente. Nenhum retorna conteúdo parcial.

---

## 9. Estados e transições atômicas

O RNF-50 exige que transição de estado de vínculo e de medicação seja atômica: ou conclui por
inteiro, ou não deixa efeito parcial. Transição acontece dentro de uma transação de banco, e o
estado final é lido do banco, nunca presumido.

Para o vínculo, a atomicidade real vem do índice único `uq_one_active_bond_per_patient` sobre a
coluna gerada `active_patient_id`: duas requisições simultâneas pedindo vínculo ativo para o mesmo
paciente resultam em uma gravação e um erro de chave duplicada, que o Service traduz em **409**.

É isso que significa "a regra vive no banco" (DEC-03): ela não depende de o código ter se lembrado
de conferir.

---

## 10. Auditoria

Todo acesso a prontuário gera registro em `audit_logs` com autor, paciente alvo, data, hora e ação
(RNF-04). **Tentativa negada também entra**, com `result = 'denied'` — é o que permite auditar
tentativa de acesso a relato privado (CA-23.5).

A tabela é somente de inclusão: a aplicação nunca altera nem apaga linha dela (CA-17.3).

---

## 11. Estrutura de pastas que isso produz

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/     um Controller por recurso
│   │   ├── Controllers/Admin/      o painel Blade
│   │   ├── Requests/               um FormRequest por operacao de escrita
│   │   └── Resources/              formato de saida, com a Collection base
│   ├── Models/                     Model base e as 25 entidades
│   ├── Policies/                   autorizacao por papel e vinculo
│   └── Services/                   a regra de negocio
├── database/
│   ├── migrations/                 reproduzem o schema.sql
│   └── seeders/                    massa ficticia (RNF-63)
├── resources/views/admin/          Blade + Bootstrap
├── routes/
│   ├── api.php                     fino, so agrega
│   ├── api/                        um arquivo por bloco
│   └── web.php                     painel do administrador
└── tests/Feature/                  um arquivo por bloco, mais o teste do RNF-08
```
