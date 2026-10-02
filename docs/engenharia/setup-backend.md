# Setup do backend

**Laravel + MySQL, em `backend/`.** Do zero até o primeiro endpoint respondendo.

Para Rafael e Zanetti. Se algum passo aqui falhar, o problema é deste arquivo e ele precisa ser
corrigido — não decore a solução, escreva nela.

---

## 1. O que precisa estar instalado

| Ferramenta | Versão mínima | Como conferir |
|------------|---------------|---------------|
| PHP | 8.2 | `php -v` |
| Composer | 2.x | `composer -V` |
| MySQL ou MariaDB | MySQL 8 / MariaDB 10.4 | `mysql --version` |

O grupo usa o **XAMPP**, que traz os três. O `schema.sql` foi testado em MariaDB 10.4 do XAMPP.

### A extensão que ninguém lembra

O Laravel precisa de `fileinfo` habilitada, e o upload de documento do CRP (RF-33) não funciona
sem ela. No XAMPP ela costuma vir comentada. Confira:

```bash
php -m | grep fileinfo
```

Se não aparecer, abra o `php.ini` do XAMPP, remova o `;` da linha `extension=fileinfo` e reinicie
o Apache. Isso já foi necessário em pelo menos uma máquina do grupo.

---

## 2. Os dois ambientes

O banco é o mesmo projeto, mas o acesso muda conforme onde você está:

| Onde | Usuário | Senha |
|------|---------|-------|
| **Laboratório do SENAI** | `root` | tem senha — **peça no grupo**, não está neste repositório |
| **Em casa** | `root` | sem senha, padrão do XAMPP |

**Por que a senha não está escrita aqui:** o RNF-56 proíbe credencial no repositório, e o critério
de verificação que o próprio grupo escreveu é varredura com resultado zero. Escrever a senha do
laboratório num arquivo versionado seria uma ocorrência literal nessa varredura.

É por isso que cada pessoa tem o seu `.env` local e ele está no `.gitignore`. O que vai versionado
é o `.env.example`, com as chaves e sem os valores.

---

## 3. Criar o projeto

**Esta etapa é do Rafael, sozinho.** A fundação não paraleliza: dois assistentes nela ao mesmo
tempo produzem duas fundações incompatíveis. Ver
[`divisao-de-trabalho.md`](divisao-de-trabalho.md).

```bash
composer create-project laravel/laravel backend
```

```bash
cd backend && composer require laravel/sanctum
```

O Sanctum é o que entrega token por sessão em `Authorization: Bearer <token>`, exigido pelo
[`../api/contrato-api.md`](../api/contrato-api.md) §2.2.

---

## 4. Configurar o ambiente

Copie o exemplo e preencha com os seus valores:

```bash
cp backend/.env.example backend/.env
```

As linhas que importam:

```
APP_URL=http://localhost:8000
APP_TIMEZONE=America/Sao_Paulo

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=calmind
DB_USERNAME=root
DB_PASSWORD=

INVITATION_TTL_DAYS=7
INVITATION_MAX_ATTEMPTS=5
INVITATION_ATTEMPT_WINDOW_MINUTES=15
```

`DB_PASSWORD` fica vazio em casa e recebe a senha do laboratório no SENAI.

As três últimas são a decisão **DA-08**: prazo e limite de tentativa do convite são configuração,
não número solto no código (RNF-05, RNF-06).

Gere a chave da aplicação — é ela que cifra `reports.body` e `messages.body` pelo RNF-02:

```bash
php artisan key:generate
```

> **A `APP_KEY` é a chave da cifra em repouso.** Perder ou trocar a chave depois de gravar dado
> cifrado torna aquele dado ilegível. Se precisar recriar o banco, recrie junto. Em desenvolvimento
> isso é irrelevante; vale saber antes da apresentação.

---

## 5. Criar o banco

```bash
mysql -u root -p -e "CREATE DATABASE calmind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

Em casa, sem senha, tire o `-p`.

Rode as migrations e a massa de teste:

```bash
cd backend && php artisan migrate --seed
```

**As migrations reproduzem o [`../diagramas/schema.sql`](../diagramas/schema.sql).** Aquele arquivo
é a fonte de verdade do modelo: 25 tabelas e a view `shared_reports`, já executado e testado. As
migrations não inventam estrutura nova nem divergem dele.

### A diferença entre MariaDB e MySQL que vai aparecer

A tabela `bonds` tem coluna gerada, e a sintaxe não é a mesma nos dois bancos: MariaDB usa
`PERSISTENT`, MySQL 8 usa `STORED`. O `schema.sql` está escrito em MariaDB porque foi testado no
XAMPP.

Na migration, use o método do Laravel e deixe que ele resolva por driver:

```php
$table->unsignedInteger('active_patient_id')
      ->storedAs("IF(status = 'active', patient_id, NULL)")
      ->nullable();
$table->unique('active_patient_id', 'uq_one_active_bond_per_patient');
```

**Esse índice único é o que garante o RF-12** — no máximo 1 vínculo ativo por paciente — e é o que
faz a regra sobreviver a duas requisições simultâneas. Não é enfeite: é regra de negócio morando no
banco, exatamente como decidido em DEC-03.

---

## 6. Subir e conferir

```bash
cd backend && php artisan serve
```

Confira que o banco respondeu e a massa entrou:

```bash
cd backend && php artisan tinker --execute="echo App\Models\User::count()"
```

Depois importe a coleção [`../api/Calmind.postman_collection.json`](../api/Calmind.postman_collection.json)
no Postman e rode a pasta `01 Conta e autenticacao`. **Pasta verde é o critério de pronto do
bloco** — ver [`definicao-de-pronto.md`](definicao-de-pronto.md).

> `php artisan serve` escuta só em `localhost`, e o celular não enxerga o `localhost` do notebook.
> Isso só importa na etapa de primeira conexão, e é a decisão **DA-01**, ainda aberta. Enquanto o
> app trabalha com mock, `localhost` basta.

---

## 7. A massa de teste que os seeders precisam criar

A coleção do Postman assume que estes perfis existem. O seeder é parte da fundação:

| Perfil | Quantidade | Detalhe que importa |
|--------|-----------|---------------------|
| Administrador | 1 | Aprova cadastro de psicólogo (RF-44) |
| Psicólogo aprovado e publicado | 2 | Aparecem no catálogo (RF-09) |
| Psicólogo pendente | 1 | Serve de alvo da fila de aprovação |
| Paciente sem vínculo | 2 | Um entra por convite, outro pelo catálogo |
| Paciente com vínculo ativo | 1 | Dono dos relatos |
| Relatos compartilhados | 3 | Visíveis ao psicólogo |
| **Relatos privados** | **2** | **Nunca visíveis ao psicólogo. São a massa da prova do RNF-08** |
| Termo geral e termo de IA | 1 de cada | Versionados (RNF-13) |

Um paciente menor de 18 anos, com os três campos de responsável preenchidos, vale a pena: exercita
a `CHECK ck_patients_guardian` e o CA-01.5.

**Dado fictício sempre, sem exceção** (RNF-63). Nome de personagem, e-mail `@example.com`.

---

## 8. Quando algo não sobe

| Sintoma | Causa provável |
|---------|----------------|
| `could not find driver` | `extension=pdo_mysql` comentada no `php.ini` |
| `Access denied for user 'root'` | `DB_PASSWORD` errado para o ambiente — ver seção 2 |
| Upload do CRP falha sem erro claro | `fileinfo` desabilitada — ver seção 1 |
| `Unknown column 'active_patient_id'` | Coluna gerada com sintaxe do banco errado — ver seção 5 |
| Texto de relato volta embaralhado | Falta o cast `encrypted` na Model que lê a view (RNF-02) |
| `No application encryption key` | Faltou `php artisan key:generate` |
