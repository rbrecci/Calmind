# Contrato da API

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
**Calmind**: Saúde Mental & Acolhimento
Versão 1, de 19/08/2026. Cobre os blocos que as semanas 1 a 4 da Sprint 2 implementam.

> A versão executável deste contrato é a coleção `Calmind.postman_collection.json`, na mesma pasta. Este documento traz o que a coleção não expressa bem: as convenções que valem para **todos** os endpoints.
>
> Atende o RNF-58, que exige contrato único, versionado e documentado, consumido pelo app e pelo painel web.

---

## 1. Para que serve

O app React Native e o Laravel são construídos por pessoas diferentes, ao mesmo tempo. Sem contrato, o Caio não escreve uma tela enquanto o endpoint não existir, e o trabalho vira fila. Com o contrato, ele monta a tela na segunda mesmo que o endpoint só saia na quarta, porque já sabe o que vai receber.

O contrato também trava, de uma vez, quatro decisões que de outro modo seriam tomadas quarenta vezes de formas diferentes: formato de erro, formato de data, formato de lista e como o token viaja.

---

## 2. Convenções que valem para todo endpoint

### 2.1 Prefixo e versão

Toda rota começa com `/api/v1`. A versão no caminho existe porque o RNF-58 exige que mudança que quebra o contrato declare nova versão, e porque o aplicativo instalado no celular **não atualiza junto com o servidor**. Um app antigo continuará chamando `v1` depois de o `v2` existir.

### 2.2 Autenticação

Token por sessão, enviado em toda requisição autenticada:

```
Authorization: Bearer <token>
```

O token é devolvido pelo login e guardado no armazenamento seguro do aparelho. Nunca aparece em log, em URL ou em corpo de resposta que não seja o do próprio login (RNF-07). A sessão expira por inatividade (RNF-09).

### 2.3 Formato de erro, igual em todos os endpoints

```json
{
  "message": "Mensagem em português, para o usuário ler",
  "errors": {
    "email": ["Este campo é obrigatório."]
  }
}
```

`errors` só aparece em erro de validação. A mensagem nunca expõe detalhe interno, nome de tabela nem trecho de exceção (RNF-10, RNF-40).

| Código | Quando usar |
|--------|-------------|
| 200 | Deu certo |
| 201 | Deu certo e criou recurso |
| 401 | Sem token, token inválido ou expirado |
| 403 | Autenticado, mas o papel não pode fazer isso |
| 404 | Recurso não existe, **ou não pode existir para quem perguntou** |
| 409 | Conflito de estado, por exemplo tentar um segundo vínculo ativo |
| 422 | Dados inválidos |

**A linha do 404 é regra de privacidade, não de estilo.** Quando o psicólogo pede um relato privado pelo identificador, a resposta é 404 e não 403. O 403 confirmaria que existe alguma coisa ali, e o CA-23.5 exige que nem a existência seja perceptível.

### 2.4 Datas

Sempre no formato ISO 8601 com fuso, por exemplo `2026-08-19T21:30:00-03:00`. Nunca `19/08/2026`: formatar para o usuário é trabalho da tela, não do servidor.

### 2.5 Listas

```json
{
  "data": [ ... ],
  "meta": { "total": 42, "page": 1, "per_page": 20 }
}
```

**Cuidado com `meta.total` nas listas de relato:** ele conta apenas o que aquele perfil pode ver. Um total que somasse relatos privados denunciaria a existência deles e quebraria o CA-23.2.

---

## 3. Índice de endpoints

Cada linha tem os testes correspondentes na coleção do Postman.

### 3.1 Conta e autenticação

| Método | Rota | Requisito |
|--------|------|-----------|
| POST | `/auth/register` | RF-01 |
| POST | `/auth/login` | RF-02 |
| POST | `/auth/logout` | RNF-09 |
| GET | `/me` | RF-05 |

### 3.2 Consentimento

| Método | Rota | Requisito |
|--------|------|-----------|
| GET | `/consent-terms/current?type=general\|ai_analysis` | RF-03, RF-04 |
| POST | `/consent-acceptances` | RF-03, RNF-13 |
| POST | `/consent-acceptances/{id}/revoke` | RF-04 |
| POST | `/psychologist/patients/{id}/guardian-consent` | RF-49 |
| GET | `/psychologist/patients/{id}/guardian-consent` | RF-49 |

### 3.3 Cadastro profissional e administração

| Método | Rota | Requisito |
|--------|------|-----------|
| POST | `/psychologist/registration` | RF-33 |
| PUT | `/psychologist/profile` | RF-34 |
| POST | `/psychologist/profile/publish` | RF-34 |
| GET | `/admin/registrations?status=pending` | RF-44 |
| POST | `/admin/registrations/{id}/approve` | RF-44 |
| POST | `/admin/registrations/{id}/reject` | RF-44 |

### 3.4 Convite e vínculo

| Método | Rota | Requisito |
|--------|------|-----------|
| POST | `/psychologist/invitations` | RF-06, RNF-05 |
| DELETE | `/psychologist/invitations/{id}` | RF-08 |
| POST | `/patient/bonds/redeem-invitation` | RF-07 |
| GET | `/catalog/psychologists` | RF-09 |
| POST | `/patient/bonds/requests` | RF-10 |
| POST | `/psychologist/bond-requests/{id}/accept` | RF-11 |
| POST | `/psychologist/bond-requests/{id}/reject` | RF-11 |
| POST | `/bonds/{id}/end` | RF-13 |

### 3.5 Relatos

| Método | Rota | Requisito |
|--------|------|-----------|
| POST | `/patient/reports` | RF-22 |
| GET | `/patient/reports` | RF-22 |
| POST | `/patient/reports/{id}/unpublish` | RF-24 |
| GET | `/psychologist/patients/{id}/reports` | RF-23, RNF-08 |

---

### 3.6 Tarefas terapêuticas

Todas as rotas abaixo usam token Sanctum. Tarefas pertencem ao vínculo (`bond_id`), nunca diretamente ao paciente. A leitura inclui vínculos ativos e encerrados, mas omite tarefas arquivadas. O vínculo encerrado fica em modo somente leitura.

| Método | Rota | Papel | Resultado |
|--------|------|-------|-----------|
| GET | `/patient/tasks?page=1&per_page=20` | paciente | lista das próprias tarefas, pendentes antes das concluídas |
| GET | `/patient/tasks/{id}` | paciente | uma tarefa própria |
| POST | `/patient/tasks/{id}/complete` | paciente | conclusão idempotente |
| GET | `/psychologist/tasks?bond_id={id}&page=1&per_page=20` | psicólogo | tarefas de vínculo próprio |
| POST | `/psychologist/tasks` | psicólogo | cria tarefa em vínculo ativo |
| GET | `/psychologist/tasks/{id}` | psicólogo | uma tarefa de vínculo próprio |
| PUT | `/psychologist/tasks/{id}` | psicólogo | altera título, descrição ou prazo de tarefa pendente em vínculo ativo |
| DELETE | `/psychologist/tasks/{id}` | psicólogo | arquiva a tarefa sem removê-la do banco |

Criação exige `bond_id` inteiro, `title` entre 1 e 150 caracteres e `due_date` no formato `YYYY-MM-DD`, igual ou posterior à data atual. `description` é opcional. O paciente do vínculo precisa ter aceitado a versão vigente do termo geral. Atualização aceita um ou mais campos `title`, `description` e `due_date` com as mesmas regras. `bond_id` e `completed_at` não podem ser alterados por payload. A resposta 201 de criação e as respostas 200 de leitura, atualização e conclusão devolvem o objeto abaixo sem envelope:

```json
{
  "id": 12,
  "bond_id": 8,
  "title": "Respirar por cinco minutos",
  "description": "Ao fim da tarde",
  "due_date": "2026-10-23",
  "status": "pending",
  "completed_at": null,
  "created_at": "2026-10-22T19:30:00-03:00"
}
```

`status` vale `pending` ou `completed`, derivado de `completed_at`. A conclusão devolve `completed` e a primeira data de conclusão; repetir a chamada não altera essa data. Listas seguem `{ "data": [ ... ], "meta": { "total": 1, "page": 1, "per_page": 20 } }`. `per_page` vai de 1 a 50. O `DELETE` devolve 200 com `{ "message": "Tarefa arquivada." }`. Arquivar uma tarefa concluída preserva sua conclusão no banco.

Sem token: 401. Papel errado, profissional sem aprovação ou aceite geral do paciente ausente ou desatualizado na criação: 403. Identificador inexistente ou de outro vínculo: 404. Vínculo encerrado ou tarefa já concluída ao tentar editar: 409. Campos inválidos: 422. Criar em vínculo alheio responde 404. Criar em vínculo próprio encerrado responde 409. Nenhuma dessas rotas consulta relatos.

---

### 3.7 Uma observação sobre o responsável legal

Não existe rota sob `/guardian`, e isso é decisão de produto, não esquecimento. O responsável legal de paciente menor de idade não autentica na plataforma (DEC-17). Ele aparece em dois lugares e só neles: como contato no cadastro do paciente, devolvido ao psicólogo em `/psychologist/patients/{id}` conforme CA-36.5, e como sujeito do registro de consentimento acima, que **quem cria é o psicólogo**, nunca ele próprio.

---

## 4. A regra que este contrato existe para proteger

**Nenhum endpoint sob `/psychologist` ou `/admin` consulta a tabela `reports`.** Todos leem a view `shared_reports`, definida no `schema.sql`.

Escrito aqui, isso deixa de depender de alguém lembrar na hora de montar a query e passa a ser item conferível na revisão de código. A mesma regra vale para a rotina que monta o pacote enviado ao serviço de IA, na semana 8.

O teste automatizado do RNF-08, previsto para a semana 4, verifica exatamente isso.

---

## 5. O que ainda não está neste contrato

Entra nas próximas versões, junto das semanas que os implementam:

| Bloco | Semana | Requisitos |
|-------|--------|------------|
| Chat | 5 | RF-15 |
| Agenda e notificações | 6 | RF-16, RF-26, RF-40 |
| Medicação | 7 | RF-27 a RF-29, RF-38, RF-39 |
| Análise por IA | 8 e 9 | RF-41, RF-42 |
| Prontuário e auditoria | 9 | RF-17, RF-35, RF-36 |
