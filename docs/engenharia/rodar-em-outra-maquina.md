# Subir o Calmind em outra máquina

Guia para ligar o sistema inteiro num computador que acabou de clonar o repositório: banco, API,
túnel público e app. Escrito em 25/11/2026, contra a branch `integracao/fechamento-30-10`.

O detalhe de cada peça do backend (extensões do PHP, diferença entre MariaDB e MySQL, erros comuns)
continua em [setup-backend.md](setup-backend.md). Este guia é a sequência que funciona hoje, do zero
até o celular logando.

---

## 1. O que o git não traz

| Item | Onde fica | Como levar para a outra máquina |
|---|---|---|
| `backend/.env` | só no notebook do Rafael | pendrive ou cofre de senhas. Nunca pelo repositório, nunca pelo grupo |
| `app/.env.local` | só no notebook do Rafael | mesmo cuidado: com o login de demonstração ligado, ele carrega a senha |
| Banco `calmind` | MySQL de cada máquina | não viaja. A máquina nova recria com o script de demonstração (seção 4) |
| Fotos de perfil e capa enviadas | `backend/storage/app/private/` | não viajam. Quem enviou foto envia de novo |
| APK | `C:\cal\app\android\app\build\outputs\apk\release\` | gerado de novo (seção 7) ou copiado à mão |

**Leve o mesmo `backend/.env`.** Ele carrega `CALMIND_DEMO_PASSWORD`, e o APK de teste tem essa
mesma senha embutida nos botões "Entrar como". Com outra senha no banco, os botões param de logar.

Sem o `.env` original, monte um a partir do exemplo (seção 3) e acrescente as duas linhas abaixo,
que não estão no `.env.example`. As duas senhas precisam ser diferentes entre si:

```
CALMIND_DEMO_PASSWORD=<senha das contas de demonstração>
CALMIND_ADMIN_PASSWORD=<senha do admin, outra>
```

---

## 2. O que instalar

| Ferramenta | Versão usada em 25/11 | Para quê |
|---|---|---|
| XAMPP (PHP e MySQL ou MariaDB) | PHP 8.2.12 | API e banco. O `composer.json` exige PHP 8.2 ou mais novo |
| Composer | qualquer 2.x | dependências do Laravel |
| Node.js | 24.15.0 | app |
| Git com Git Bash | qualquer | os comandos abaixo são de Git Bash |
| ngrok | 3.39 | túnel público com HTTPS para o celular |
| JDK 17 e Android SDK | só para gerar APK | build do Android (seção 7) |

No `php.ini` do XAMPP, `extension=fileinfo` e `extension=pdo_mysql` precisam estar sem o `;` na
frente. Sem o `fileinfo`, o envio de foto de perfil falha. O GD não é necessário.

---

## 3. Primeira vez: código e configuração

```bash
git clone https://github.com/rbrecci/Calmind.git
cd Calmind
git checkout integracao/fechamento-30-10

cd backend
composer install
```

Coloque o `backend/.env` trazido da outra máquina. Sem ele:

```bash
cp .env.example .env
php artisan key:generate
```

Depois acrescente as duas senhas da seção 1 e confira estas linhas:

```
APP_URL=https://lettuce-impeach-arose.ngrok-free.dev
DB_DATABASE=calmind
DB_USERNAME=root
DB_PASSWORD=
```

O `APP_URL` precisa ser o endereço do túnel, não `localhost`: é dele que a API monta o link da foto
de perfil que o celular baixa.

No app:

```bash
cd ../app
npm ci
cp .env.example .env.local
```

No `app/.env.local`, para usar a API pelo túnel:

```
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_API_URL=https://lettuce-impeach-arose.ngrok-free.dev/api/v1
```

`EXPO_PUBLIC_DEMO_LOGIN` e `EXPO_PUBLIC_DEMO_PASSWORD` só ficam preenchidos em APK de teste. No APK
da banca, `DEMO_LOGIN=false` e a senha vazia.

---

## 4. Primeira vez: banco

Com o MySQL ligado (seção 5, passo 1), crie os dois bancos. O de teste precisa se chamar
`calmind_test`, porque a suíte recusa qualquer outro nome:

```bash
mysql -u root -e "CREATE DATABASE calmind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE calmind_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Se o `mysql` não estiver no PATH, use o do XAMPP, por exemplo `C:/xampp/mysql/bin/mysql.exe`.

Depois rode o script de demonstração. Ele aplica as migrations, cria a massa fictícia e troca as
senhas públicas do seed pelas do `.env`. Em `backend/`, no Git Bash:

```bash
export PATH="/c/xampp/php:$PATH"
export CALMIND_DEMO_PASSWORD="$(grep '^CALMIND_DEMO_PASSWORD=' .env | cut -d= -f2-)"
export CALMIND_ADMIN_PASSWORD="$(grep '^CALMIND_ADMIN_PASSWORD=' .env | cut -d= -f2-)"
sh scripts/preparar-demo.sh
```

Troque `/c/xampp/php` pela pasta do PHP da máquina. O script só cria a massa quando o banco está
vazio; rodar de novo num banco já semeado só aplica migration nova e confere as senhas.

---

## 5. Todo dia: ligar o servidor

São três processos, cada um no seu terminal, nesta ordem.

**1. MySQL.** Pelo painel do XAMPP (botão Start do MySQL), ou pelo terminal:

```bash
cd C:/xampp && ./mysql/bin/mysqld --defaults-file=mysql/bin/my.ini --standalone
```

**2. API**, em `backend/`:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

**3. Túnel**, em qualquer pasta:

```bash
ngrok http --url=lettuce-impeach-arose.ngrok-free.dev 8000
```

Na primeira vez numa máquina, o ngrok pede o token da conta dona desse domínio (a do Rafael):
`ngrok config add-authtoken <token>`, com o token copiado do painel do ngrok. **O domínio só fica
aberto em uma máquina por vez.** Antes de ligar o túnel numa máquina, desligue na outra; se não,
o ngrok recusa dizendo que o endpoint já está online.

**Conferir que está no ar:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "ngrok-skip-browser-warning: 1" -H "Accept: application/json" https://lettuce-impeach-arose.ngrok-free.dev/api/v1/me
```

`401` é o esperado: a API respondeu e pediu login. `502` ou `404` do ngrok quer dizer que a API não
está ligada na porta 8000.

**Desligar:** `Ctrl+C` no terminal da API e no do túnel. O MySQL desliga pelo painel do XAMPP ou
com `C:/xampp/mysql/bin/mysqladmin.exe -u root shutdown`, que fecha o banco sem corromper. Em
Windows, nunca mate o PHP pelo nome (`taskkill /IM php.exe`): isso derruba qualquer outro PHP da
máquina. Use o PID de quem escuta a porta 8000.

---

## 6. Testes

Em `app/`:

```bash
npm test
npx tsc --noEmit
npx eslint .
```

Em `backend/`, com o MySQL ligado e o banco `calmind_test` criado:

```bash
php artisan optimize:clear
php artisan test
```

O `optimize:clear` vem antes porque o `preparar-demo.sh` deixa a configuração em cache apontando
para o banco `calmind`, e a suíte se recusa a rodar fora do `calmind_test`. Em 25/11 eram 284 testes
no backend e 284 no app, todos passando.

Depois de mudar rota no backend com o servidor ligado, rode `php artisan route:cache`, ou o servidor
em uso continua com as rotas antigas.

---

## 7. Gerar o APK

**Desligue os três servidores antes.** O Gradle usa vários GB de memória e, junto com eles, o
Windows derruba tudo. Feche jogos também.

O build precisa rodar de uma pasta de caminho curto, porque um caminho do Android passa de 260
caracteres e o `ninja` falha (`manifest 'build.ninja' still dirty`). No PowerShell, da raiz do repo:

```powershell
robocopy app C:\cal\app /MIR /XD .cxx android node_modules
```

Em `C:\cal\app`:

```bash
npm ci
npx expo prebuild --platform android --no-install
```

O `prebuild` é obrigatório desde 25/11, porque entraram duas dependências nativas
(`@react-native-masked-view/masked-view` e `expo-image-picker`). Ele apaga e recria a pasta
`android`, então recrie o `android/local.properties` com o caminho do SDK, em barra dupla. Escreva
num editor de texto, porque o Git Bash come as barras invertidas:

```
sdk.dir=C\:\\Users\\<usuario>\\AppData\\Local\\Android\\Sdk
```

Depois, em `C:\cal\app\android`:

```bash
./gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=3
./gradlew.bat --stop
```

Leva cerca de 9 minutos. O `--stop` no fim desliga o daemon do Gradle, que fica segurando memória.
O APK sai em `android/app/build/outputs/apk/release/app-release.apk`. Com o celular no cabo e a
depuração USB ligada:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

O `adb` fica em `%LOCALAPPDATA%\Android\Sdk\platform-tools\`. O `-r` instala por cima e mantém o
login.

---

## 8. Quando algo não funciona

| Sintoma | Causa | O que fazer |
|---|---|---|
| Nenhum login passa no celular | túnel ou API desligados | rodar o `curl` da seção 5 |
| Botões "Entrar como" dão senha errada | banco semeado com outra `CALMIND_DEMO_PASSWORD` | usar o `.env` original e recriar o banco com o script |
| Foto de perfil não aparece | `APP_URL` em `localhost` | `APP_URL` com o endereço do túnel e reiniciar a API |
| `php artisan test` recusa o banco | configuração em cache do script de demonstração | `php artisan optimize:clear` |
| ngrok diz que o endpoint já está online | túnel ainda ligado em outra máquina | desligar lá primeiro |
| Gradle: `A sintaxe do nome do arquivo ... está incorreta` | `local.properties` com barra simples | reescrever com barra dupla |
| Gradle morre no meio | falta de memória | desligar servidores e jogos e tentar de novo |
