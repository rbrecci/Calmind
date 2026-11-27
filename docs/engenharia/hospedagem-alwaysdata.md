# Hospedagem da API: alwaysdata com repasse pela Vercel

É a hospedagem da apresentação ([DA-01](../planejamento/decisoes-abertas.md)), aprovada nos testes de aceite em 27/11/2026.

| Item | Valor |
|---|---|
| Endereço usado pelo app e pelo painel | `https://calmind-api.vercel.app` |
| Endereço direto | `https://calmind.alwaysdata.net` |
| Conta alwaysdata | `calmind` (plano Free, separada da do CTI Escuta) |
| Banco | `calmind_calmind` em `mysql-calmind.alwaysdata.net:3306` (MariaDB 11.8) |
| Código no servidor | `~/calmind`, branch `main` |
| No APK | `EXPO_PUBLIC_API_URL=https://calmind-api.vercel.app/api/v1` |

**Por que o repasse:** a rede do SENAI bloqueia `calmind.alwaysdata.net` (o DNS da rede devolve um endereço de bloqueio). A porta 22 também é bloqueada, por isso os comandos rodam no terminal web do painel (**Remote access > SSH**, opção "on the Web").

Nunca cole senha ou chave no chat, em print ou no repositório. Só dados fictícios: o servidor fica na França.

## 1. Atualizar o servidor

O servidor puxa do GitHub, então a mudança precisa estar na `main`.

```sh
cd ~/calmind && git pull --ff-only
cd backend && composer install --no-dev --prefer-dist --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan event:cache
```

Mudou o `.env`? Rode a última linha de novo. Antes de migrar, vale guardar uma cópia do banco com `mysqldump`.

**Última atualização: 27/11/2026** (PR #26): tabela `daily_moods` e termo 1.1, que pede novo aceite. A cópia anterior ficou em `~/antes-ajustes.sql`.

**Massa grande no servidor.** Em 27/11 também rodou `php artisan db:seed --class=ScaleDemoSeeder --force`, para ver o app cheio. As contas novas (`escala.*@example.com`) ficaram com a senha do seed, que está no repositório público. São dados de teste e **o banco precisa ser limpo antes da apresentação**.

Para voltar o banco ao estado de partida (**apaga tudo o que foi criado nos testes**): `php artisan migrate:fresh --force` e depois a seção 4.4.

## 2. Testes de aceite

| # | Teste | Passa se |
|---|---|---|
| 1 | Seção 4.4 | termina sem erro, com a view criada |
| 2 | `curl -s -o /dev/null -w "%{http_code}\n" -H "Accept: application/json" https://calmind-api.vercel.app/api/v1/me` | `401` |
| 3 | `https://calmind-api.vercel.app/.env` | `404` |
| 4 e 5 | `.\backend\scripts\testar-hospedagem.ps1 -BaseUrl https://calmind-api.vercel.app` (foto de perfil e análise por IA), numa máquina com o `backend/.env` | sem falhas |
| 6 | Abrir o endereço na rede da escola e pela rede móvel | abre nas duas |
| 7 | `df -h ~` e `du -sh ~/calmind` | cabe com folga no 1 GB do plano |

**`ai:check` pelo SSH falha:** o terminal roda numa máquina diferente da que serve o site, e o Gemini responde `400 User location is not supported`. Para testar a IA, peça uma análise pela API. No servidor, o único resultado do `ai:check` que vale é `401 API key not valid` (chave colada errada).

## 3. Republicar o repasse

A configuração está em `proxy/vercel.json` (projeto `calmind-api`, cache desligado). Dentro de `proxy/`:

```sh
vercel deploy --prod --scope rb-recci
```

## 4. Montar o servidor do zero

### 4.1 Conta e banco

1. No [painel](https://admin.alwaysdata.com/), plano **Free**. Em **Environment > PHP**, **8.4**.
2. Em **Databases > MySQL**, crie o banco `calmind_calmind` e defina a senha do usuário em **Users**.

### 4.2 Código

```sh
cd ~
git clone --branch main https://github.com/rbrecci/Calmind.git calmind
cd calmind/backend
composer install --no-dev --prefer-dist --optimize-autoloader
cp .env.example .env
chmod 600 .env
```

### 4.3 `.env` do servidor

Mude estas linhas:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://calmind-api.vercel.app
LOG_LEVEL=warning

DB_HOST=mysql-calmind.alwaysdata.net
DB_DATABASE=calmind_calmind
DB_USERNAME=<usuario do banco>
DB_PASSWORD=<senha do banco>
```

Acrescente no fim:

```
CALMIND_DEMO_PASSWORD=
CALMIND_ADMIN_PASSWORD=
GEMINI_API_KEY=
GEMINI_API_KEYS=
GEMINI_MODELS=gemini-3.5-flash-lite,gemini-3.5-flash
```

A `CALMIND_DEMO_PASSWORD` precisa ser a mesma embutida no APK de teste, senão os botões "Entrar como" param. As duas senhas precisam ser diferentes entre si; senha com `#` ou espaço vai entre aspas.

Depois, `php artisan key:generate --force`. A `APP_KEY` cifra relatos e mensagens: guarde uma cópia fora do servidor.

### 4.4 Migrations e massa de demonstração

```sh
export CALMIND_DEMO_PASSWORD="$(grep '^CALMIND_DEMO_PASSWORD=' .env | cut -d= -f2-)"
export CALMIND_ADMIN_PASSWORD="$(grep '^CALMIND_ADMIN_PASSWORD=' .env | cut -d= -f2-)"
sh scripts/preparar-demo.sh
unset CALMIND_DEMO_PASSWORD CALMIND_ADMIN_PASSWORD
```

Se o `.env` usar aspas nas senhas, digite os dois `export` à mão, sem as aspas. Se a migration da view `shared_reports` falhar por permissão, **pare**: sem a view não há a garantia de privacidade (RNF-08).

### 4.5 Site

Em **Web > Sites**:

| Campo | Valor |
|---|---|
| Type | PHP |
| Root directory | `calmind/backend/public/` |
| Force HTTPS | ligado |

No `php.ini` do site (os 90 segundos cobrem a análise por IA, que pode levar até 70):

```ini
upload_max_filesize = 6M
post_max_size = 7M
max_execution_time = 90
display_errors = Off
log_errors = On
```
