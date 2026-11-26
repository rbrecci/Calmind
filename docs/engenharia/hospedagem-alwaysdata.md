# Publicar a API do Calmind na alwaysdata

Decisão de 26/11/2026: **em teste**. A [DA-01](../planejamento/decisoes-abertas.md) (notebook com
ngrok) continua valendo até os testes de aceite da seção 8 passarem. Prazo: **sábado 28/11 à noite**.

Troque `CONTA` pelo nome da conta (não é o e-mail). O endereço será `https://CONTA.alwaysdata.net`.
Nunca cole senha ou chave no chat, em print ou no repositório. Só dados fictícios: o servidor fica na
França.

Os comandos rodam no terminal web do painel (**Remote access > SSH**, opção "on the Web"), porque a
rede da escola já bloqueou a porta 22.

## 1. Conta

1. No [painel](https://admin.alwaysdata.com/), crie uma conta nova só para o Calmind (plano **Free**,
   uso sem fins lucrativos). Não mexa na conta do CTI Escuta.
2. Em **Environment > PHP**, escolha **8.4**.

## 2. Banco

Em **Databases > MySQL**:

1. Crie o banco `CONTA_calmind` (utf8mb4).
2. Crie um usuário com todos os privilégios **só** nesse banco e uma senha nova.

Servidor: `mysql-CONTA.alwaysdata.net`, porta 3306.

## 3. Código

O servidor clona do GitHub, então o que vai para lá precisa estar com push feito.

```sh
cd ~
git clone --branch main https://github.com/rbrecci/Calmind.git calmind
cd calmind/backend
php -v
composer --version
composer install --no-dev --prefer-dist --optimize-autoloader
cp .env.example .env
chmod 600 .env
```

## 4. `.env` do servidor

Edite com `nano .env`. Mude estas linhas e deixe as outras como estão:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://CONTA.alwaysdata.net
LOG_LEVEL=warning

DB_HOST=mysql-CONTA.alwaysdata.net
DB_DATABASE=CONTA_calmind
DB_USERNAME=<usuario do passo 2>
DB_PASSWORD=<senha do passo 2>
```

Acrescente no fim, com os mesmos valores do `backend/.env` do notebook:

```
CALMIND_DEMO_PASSWORD=
CALMIND_ADMIN_PASSWORD=
GEMINI_API_KEY=
GEMINI_API_KEYS=
GEMINI_MODELS=gemini-3.5-flash-lite,gemini-3.5-flash
```

A `CALMIND_DEMO_PASSWORD` precisa ser a mesma, senão os botões "Entrar como" do APK de teste param.
As duas senhas precisam ser diferentes entre si. Senha com `#` ou espaço vai entre aspas.

Depois:

```sh
php artisan key:generate --force
```

## 5. Migrations e massa de demonstração

```sh
export CALMIND_DEMO_PASSWORD="$(grep '^CALMIND_DEMO_PASSWORD=' .env | cut -d= -f2-)"
export CALMIND_ADMIN_PASSWORD="$(grep '^CALMIND_ADMIN_PASSWORD=' .env | cut -d= -f2-)"
sh scripts/preparar-demo.sh
unset CALMIND_DEMO_PASSWORD CALMIND_ADMIN_PASSWORD
```

Se o `.env` usar aspas nas senhas, digite os dois `export` à mão, sem as aspas do arquivo.

O script precisa terminar sem erro. Se a migration da view `shared_reports` falhar por falta de
permissão, **pare aqui**: sem a view não há a garantia de privacidade (RNF-08).

## 6. Site

Em **Web > Sites**, edite o site que já existe em `CONTA.alwaysdata.net`:

| Campo | Valor |
|---|---|
| Type | PHP |
| Root directory | `calmind/backend/public/` (relativo à pasta da conta) |
| Force HTTPS | ligado |

No `php.ini` do site:

```ini
upload_max_filesize = 6M
post_max_size = 7M
max_execution_time = 90
display_errors = Off
log_errors = On
```

Os 90 segundos cobrem a análise por IA, que pode levar até 70.

## 7. Atualizar depois

```sh
cd ~/calmind && git pull --ff-only
cd backend && composer install --no-dev --prefer-dist --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan event:cache
```

Mudou o `.env`? Rode a última linha de novo.

Para voltar o banco ao estado de partida (apaga tudo o que foi criado nos testes):
`php artisan migrate:fresh --force` e repita a seção 5.

## 8. Testes de aceite

| # | Teste | Passa se |
|---|---|---|
| 1 | Seção 5 | termina sem erro, com a view criada |
| 2 | `curl -s -o /dev/null -w "%{http_code}\n" -H "Accept: application/json" https://CONTA.alwaysdata.net/api/v1/me` | `401` |
| 3 | `https://CONTA.alwaysdata.net/.env` | `404` |
| 4 | No app ou Postman: enviar foto de perfil e abrir de novo | a foto volta, com URL em `https` |
| 5 | `php artisan ai:check` no servidor, e uma análise pedida pela API | as duas respondem |
| 6 | Abrir o endereço na rede da escola e pela rede móvel | abre nas duas |
| 7 | `df -h ~` e `du -sh ~/calmind` | cabe com folga no 1 GB do plano |

Se o teste 6 falhar só na rede da escola, o CTI Escuta resolveu com um repasse pela Vercel
(`rewrites` para o endereço da alwaysdata). Com repasse, repetir os testes 2, 4 e 5 por ele, e o
`APP_URL` passa a ser o endereço do repasse.

## 9. Depois que passar

1. APK novo com `EXPO_PUBLIC_API_URL=https://CONTA.alwaysdata.net/api/v1` em `app/.env.local`
   ([guia](rodar-em-outra-maquina.md), seção 7).
2. Atualizar a DA-01, o `ambiente-apresentacao.md` e o `FinalSprint3.md`. Avisar a Isabela, porque o
   documento ABNT descreve a hospedagem.
3. O notebook com ngrok passa a ser o plano B, e o domínio do ngrok continua o mesmo.
