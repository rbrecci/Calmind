# Contrato da API

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
Versão 1, de 19/08/2026. Cobre os blocos que as semanas 1 a 4 da Sprint 2 implementam.

> A versão executável deste contrato é a coleção `TCC-SENAI.postman_collection.json`, na mesma pasta. Este documento traz o que a coleção não expressa bem: as convenções que valem para **todos** os endpoints.
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

## 4. A regra que este contrato existe para proteger

**Nenhum endpoint sob `/psychologist` ou `/admin` consulta a tabela `reports`.** Todos leem a view `shared_reports`, definida no `schema.sql`.

Escrito aqui, isso deixa de depender de alguém lembrar na hora de montar a query e passa a ser item conferível na revisão de código. A mesma regra vale para a rotina que monta o pacote enviado ao serviço de IA, na semana 8.

O teste automatizado do RNF-08, previsto para a semana 4, verifica exatamente isso.

---

## 5. O que ainda não está neste contrato

Entra nas próximas versões, junto das semanas que os implementam:

| Bloco | Semana | Requisitos |
|-------|--------|------------|
| Tarefas e chat | 5 | RF-15, RF-25, RF-37 |
| Agenda e notificações | 6 | RF-16, RF-26, RF-40 |
| Medicação | 7 | RF-27 a RF-29, RF-38, RF-39 |
| Análise por IA | 8 e 9 | RF-41, RF-42 |
| Prontuário e auditoria | 9 | RF-17, RF-35, RF-36 |
