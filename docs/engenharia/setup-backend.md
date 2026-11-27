# Setup do backend

Laravel 12 com MySQL, em `backend/`. A sequência completa do zero até o celular está em [rodar-em-outra-maquina.md](rodar-em-outra-maquina.md); aqui ficam os requisitos e as armadilhas.

## 1. Requisitos

| Ferramenta | Versão mínima | Como conferir |
|------------|---------------|---------------|
| PHP | 8.2 | `php -v` |
| Composer | 2.x | `composer -V` |
| MySQL ou MariaDB | MySQL 8 / MariaDB 10.4 | `mysql --version` |

O grupo usa o XAMPP. No `php.ini`, `pdo_mysql` e `fileinfo` precisam estar habilitadas (sem `fileinfo`, o upload de documento e de foto falha).

## 2. Ambientes

| Onde | Usuário do MySQL | Senha |
|------|------------------|-------|
| Laboratório do SENAI | `root` | tem senha: peça no grupo |
| Em casa | `root` | sem senha |

A senha não é escrita aqui porque o RNF-56 proíbe credencial no repositório. Cada um tem o seu `.env`, que o git ignora.

## 3. Subir só a API

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
mysql -u root -p -e "CREATE DATABASE calmind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
php artisan migrate --seed
php artisan serve
```

Sem senha, tire o `-p`. Preencha `DB_PASSWORD` antes de migrar, se o MySQL tiver senha.

> **A `APP_KEY` cifra `reports.body` e `messages.body` (RNF-02).** Trocar a chave depois de gravar dado cifrado torna o dado ilegível; se precisar recriar a chave, recrie o banco.

`php artisan serve` escuta só em `localhost`, que o celular não enxerga.

## 4. Modelo de dados

O [`schema.sql`](../diagramas/schema.sql) é a referência do modelo (26 tabelas e a view `shared_reports`), e as migrations o reproduzem. A coluna gerada `bonds.active_patient_id` usa `PERSISTENT` no MariaDB e `STORED` no MySQL 8; na migration, `storedAs()` resolve por driver.

## 5. Massa de teste

O seeder cria administrador, psicólogos (aprovados e pendente), pacientes com e sem vínculo, relatos compartilhados e privados e os termos de consentimento. As contas estão em [`UserSeeder.php`](../../backend/database/seeders/UserSeeder.php). Só dado fictício (RNF-63).

## 6. Quando algo não sobe

| Sintoma | Causa provável |
|---------|----------------|
| `could not find driver` | `pdo_mysql` desabilitada |
| `Access denied for user 'root'` | `DB_PASSWORD` errada para o ambiente |
| Upload falha sem erro claro | `fileinfo` desabilitada |
| `Unknown column 'active_patient_id'` | coluna gerada com sintaxe do outro banco |
| Texto de relato volta embaralhado | falta o cast `encrypted` na Model que lê a view |
| `No application encryption key` | faltou `php artisan key:generate` |
