# Subir o Calmind numa máquina e gerar o APK

Banco, API, túnel público e app num computador que acabou de clonar o repositório, e o build do APK. Para a apresentação este é o [plano B](ambiente-apresentacao.md): o servidor oficial é o da [alwaysdata](hospedagem-alwaysdata.md). Requisitos e erros do backend estão em [setup-backend.md](setup-backend.md).

## 1. O que o git não traz

| Item | Como levar |
|---|---|
| `backend/.env` | pendrive ou cofre de senhas, nunca pelo repositório nem pelo grupo |
| `app/.env.local` | mesmo cuidado: com o login de demonstração ligado, ele carrega a senha |
| Banco `calmind` | não viaja: a máquina nova recria (seção 4) |
| Fotos de perfil e capa | não viajam: ficam em `backend/storage/app/private/` |
| APK | gerado de novo (seção 7) ou copiado à mão |

**Leve o mesmo `backend/.env`:** o APK de teste tem a `CALMIND_DEMO_PASSWORD` embutida nos botões "Entrar como". Sem o original, monte pelo exemplo e acrescente duas senhas diferentes entre si, que não estão no `.env.example`:

```
CALMIND_DEMO_PASSWORD=<senha das contas de demonstração>
CALMIND_ADMIN_PASSWORD=<senha do admin>
```

## 2. O que instalar

| Ferramenta | Versão usada | Para quê |
|---|---|---|
| XAMPP | PHP 8.2 e MariaDB | API e banco |
| Composer | 2.x | dependências do Laravel |
| Node.js | 24 | app |
| Git com Git Bash | qualquer | os comandos abaixo são de Git Bash |
| ngrok | 3.39 | túnel HTTPS para o celular |
| JDK 17 e Android SDK | só para o APK | build do Android |

No `php.ini`, `extension=fileinfo` e `extension=pdo_mysql` precisam estar sem o `;`.

## 3. Código e configuração

```bash
git clone https://github.com/rbrecci/Calmind.git
cd Calmind/backend
composer install
```

Coloque o `backend/.env` trazido da outra máquina, ou `cp .env.example .env && php artisan key:generate`. Confira:

```
APP_URL=https://lettuce-impeach-arose.ngrok-free.dev
DB_DATABASE=calmind
DB_USERNAME=root
DB_PASSWORD=
```

O `APP_URL` precisa ser o endereço do túnel, não `localhost`: é dele que sai o link da foto de perfil.

No app (`npm ci` precisa de lockfile em dia; se recusar, use `npm install` e não commite o lockfile sem querer):

```bash
cd ../app
npm ci
cp .env.example .env.local
```

No `app/.env.local`:

```
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_API_URL=https://calmind-api.vercel.app/api/v1
```

Para falar com a API desta máquina, troque a URL por `https://lettuce-impeach-arose.ngrok-free.dev/api/v1`. `EXPO_PUBLIC_DEMO_LOGIN` e `EXPO_PUBLIC_DEMO_PASSWORD` só são preenchidos em APK de teste.

## 4. Banco

Com o MySQL ligado, crie os dois bancos. O de teste precisa se chamar `calmind_test`, porque a suíte recusa outro nome:

```bash
mysql -u root -e "CREATE DATABASE calmind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE calmind_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Se o `mysql` não estiver no PATH, use `C:/xampp/mysql/bin/mysql.exe`. Depois, em `backend/`:

```bash
export PATH="/c/xampp/php:$PATH"
export CALMIND_DEMO_PASSWORD="$(grep '^CALMIND_DEMO_PASSWORD=' .env | cut -d= -f2-)"
export CALMIND_ADMIN_PASSWORD="$(grep '^CALMIND_ADMIN_PASSWORD=' .env | cut -d= -f2-)"
sh scripts/preparar-demo.sh
```

O script aplica as migrations, cria a massa fictícia quando o banco está vazio e troca as senhas públicas do seed pelas do `.env`.

### Massa da apresentação

O `PresentationSeeder` deixa, no vínculo de Elizabeth Bennet com Hermione Granger:

- quatro medicações, uma em cada estado (Sertralina ativa, Melatonina aguardando confirmação, Escitalopram suspenso e Fluoxetina recusada);
- o termo de IA aceito pela paciente;
- uma análise confirmada cujo texto **não veio da IA**: começa com `[EXEMPLO DE DEMONSTRAÇÃO, não gerado pela IA]` e não deve ser apresentado como se fosse.

Rodar de novo (`php artisan db:seed --class=PresentationSeeder`) não duplica nem desfaz o que mudou no ensaio. Para voltar ao estado de partida, recrie o banco. Enquanto o app não tiver a tela de medicação, o lembrete aparece só como "Você tem uma nova notificação".

### Massa grande, para ver as telas cheias

Opcional, depois do seed padrão. Cria cerca de 40 pacientes ativos, 12 encerrados e 8 pedidos pendentes para Hermione, seis meses de relatos, humor, tarefas, conversa e agenda para Elizabeth, e 30 perfis no catálogo. Tudo fictício; rodar de novo não duplica.

```bash
php artisan db:seed --class=ScaleDemoSeeder
sh scripts/preparar-demo.sh   # troca a senha pública das contas novas
```

Não use no banco da apresentação sem querer essa quantidade na tela.

## 5. Ligar o servidor

Três processos, cada um num terminal, nesta ordem:

1. **MySQL:** botão Start no painel do XAMPP.
2. **API**, em `backend/`: `php artisan serve --host=127.0.0.1 --port=8000`
3. **Túnel:** `ngrok http --url=lettuce-impeach-arose.ngrok-free.dev 8000`

Na primeira vez, `ngrok config add-authtoken <token>` com o token da conta dona do domínio (a do Rafael). **O domínio só fica aberto em uma máquina por vez.** O notebook não pode suspender. Na primeira visita ao painel web, o ngrok mostra um aviso: clique em "Visit Site".

Conferir:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "ngrok-skip-browser-warning: 1" -H "Accept: application/json" https://lettuce-impeach-arose.ngrok-free.dev/api/v1/me
```

`401` é o esperado. `502` ou `404` do ngrok quer dizer que a API não está na porta 8000.

**Desligar:** `Ctrl+C` na API e no túnel; MySQL pelo painel do XAMPP. Não mate o PHP pelo nome (`taskkill /IM php.exe`), porque isso derruba qualquer outro PHP da máquina.

## 6. Testes

Em `app/`: `npm test`, `npx tsc --noEmit` e `npx eslint .`.

Em `backend/`, com o `calmind_test` criado:

```bash
php artisan optimize:clear
php artisan test
```

O `optimize:clear` vem antes porque o `preparar-demo.sh` deixa a configuração em cache apontando para o banco `calmind`. Depois de mudar rota com o servidor ligado, rode `php artisan route:cache`.

## 7. Gerar o APK

Desligue os três servidores antes: o Gradle usa vários GB de memória.

O build precisa de uma pasta de caminho curto, porque um caminho do Android passa de 260 caracteres e o `ninja` falha (`manifest 'build.ninja' still dirty`). No PowerShell, na raiz do repositório:

```powershell
robocopy app C:\cal\app /MIR /XD .cxx android node_modules
```

Em `C:\cal\app` (o `.env.local` vai junto na cópia, e as variáveis `EXPO_PUBLIC_*` ficam embutidas no APK):

```bash
npm ci
npx expo prebuild --platform android --no-install
```

O `prebuild` é obrigatório, apaga e recria a pasta `android`. Recrie o `android/local.properties` num editor de texto (o Git Bash come as barras invertidas):

```
sdk.dir=C\:\\Users\\<usuario>\\AppData\\Local\\Android\\Sdk
```

Em `C:\cal\app\android`:

```bash
./gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=3
./gradlew.bat --stop
```

Leva cerca de 9 minutos. O APK sai em `android/app/build/outputs/apk/release/app-release.apk`. Com o celular no cabo e a depuração USB ligada:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

O `adb` fica em `%LOCALAPPDATA%\Android\Sdk\platform-tools\`.

### Confira para onde o APK aponta

O cache do Metro pode reaproveitar `EXPO_PUBLIC_*` de uma build anterior: em 27/11 um APK feito para a API local saiu apontando para o servidor publicado, com o login de demonstração antigo. Antes de gerar, aponte o temporário para uma pasta nova e use o Gradle sem daemon:

```bash
mkdir -p /c/cal/tmp && export TMP=C:/cal/tmp TEMP=C:/cal/tmp TMPDIR=C:/cal/tmp
./gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=3 --no-daemon
```

Depois confira o pacote, antes de instalar ou passar adiante:

```bash
grep -a -o -E "https?://[a-zA-Z0-9.:-]+/api/v1" app/build/generated/assets/react/release/index.android.bundle | sort -u
```

### Testar no celular com a API desta máquina, pelo cabo

Sem rede nem túnel: gere o APK com `EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1` e `usesCleartextTraffic` ligado **só na cópia de build**, suba a API em `127.0.0.1:8000` e rode `adb reverse tcp:8000 tcp:8000`. Esse APK não serve para mais nada.

## 8. Quando algo não funciona

| Sintoma | Causa e solução |
|---|---|
| Telas de relatos dão erro depois de atualizar o código | falta `php artisan migrate` no banco |
| Nenhum login passa no celular | API ou túnel desligados: rode o `curl` da seção 5 |
| Botões "Entrar como" dão senha errada | banco semeado com outra `CALMIND_DEMO_PASSWORD`: use o `.env` original e recrie o banco |
| Foto de perfil não aparece | `APP_URL` em `localhost`: use o endereço do túnel e reinicie a API |
| `php artisan test` recusa o banco | configuração em cache: `php artisan optimize:clear` |
| ngrok diz que o endpoint já está online | túnel ligado em outra máquina |
| Gradle: `A sintaxe do nome do arquivo ... está incorreta` | `local.properties` com barra simples |
| Gradle morre no meio | falta de memória: feche servidores e jogos |
