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

1. Crie o banco `CONTA_calmind`.
2. O usuário `CONTA` já existe e tem acesso total a ele. Em **Users**, defina uma senha.

Servidor: `mysql-CONTA.alwaysdata.net`, porta 3306 (MariaDB 11.8 em 26/11).

Na conta usada pelo grupo, `CONTA` é `calmind` e o banco é `calmind_calmind`.

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

## Onde parou em 26/11

O servidor está no ar em `https://calmind.alwaysdata.net`, na branch `Rafael` (commit `cbb2e9f`).

| Teste da seção 8 | Estado |
|---|---|
| 1, 2, 3 e 7 | passaram (view criada, 401, `.env` 404, 139 MB de 1 GB) |
| 4 e 5 | **pendentes**. A chave #2 respondeu 200 pelo servidor web; as três chaves do `.env` foram conferidas depois |
| 6 | abriu na rede do computador do SENAI; falta pela rede móvel. A porta 22 é bloqueada nessa rede |

**Problema em aberto:** o `testar-hospedagem.ps1` estoura o tempo no primeiro pedido, e o pedido não
aparece no log de acesso do servidor. Acontece também sem senha, com `Invoke-RestMethod` e
`Invoke-WebRequest`, enquanto o `curl.exe` responde em 1 s. Uma chamada pelo PowerShell chegou a
passar. A causa não foi identificada. Próximo passo: reescrever as chamadas do script com `curl.exe`
e testar também o app no celular pela rede móvel.

## Cuidado: `ai:check` pelo terminal falha

O terminal SSH roda numa máquina diferente da que serve o site. Em 26/11, a chamada ao Gemini saída
do SSH recebeu `400 User location is not supported`, e a mesma chave, chamada pelo servidor web,
respondeu 200. Para testar a IA, peça uma análise pela API. Não conclua nada pelo `ai:check` do
servidor, a não ser `401 API key not valid`, que indica chave colada errada.

## 8. Testes de aceite

| # | Teste | Passa se |
|---|---|---|
| 1 | Seção 5 | termina sem erro, com a view criada |
| 2 | `curl -s -o /dev/null -w "%{http_code}\n" -H "Accept: application/json" https://CONTA.alwaysdata.net/api/v1/me` | `401` |
| 3 | `https://CONTA.alwaysdata.net/.env` | `404` |
| 4 | Na máquina com o `backend/.env`: `.\backend\scripts\testar-hospedagem.ps1` (foto de perfil) | a foto volta, com URL em `https` |
| 5 | O mesmo script (análise por IA pela API) | a sugestão é gerada pelo Gemini |
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
