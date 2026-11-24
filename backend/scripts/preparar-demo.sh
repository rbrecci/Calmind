#!/bin/sh
# Prepara o banco da demonstracao (migrations, seed no banco vazio, troca das senhas publicas do seed).
# Em backend/, com CALMIND_DEMO_PASSWORD e CALMIND_ADMIN_PASSWORD exportadas e o php no PATH:
#   sh scripts/preparar-demo.sh
# No fim a config fica em cache; para rodar os testes, antes: php artisan config:clear
set -e

php artisan migrate --force

# Os seeders usam create(), entao so rodam com o banco vazio.
USERS=$(php artisan tinker --execute="echo App\Models\User::count();" | tail -n 1)
if [ "$USERS" = "0" ]; then
  : "${CALMIND_DEMO_PASSWORD:?defina CALMIND_DEMO_PASSWORD antes do primeiro deploy}"
  : "${CALMIND_ADMIN_PASSWORD:?defina CALMIND_ADMIN_PASSWORD antes do primeiro deploy}"
  php artisan db:seed --force
fi

# O repositorio e publico e as senhas da massa ficticia estao no UserSeeder. A troca fica fora do if
# porque um deploy que caiu entre semear e trocar deixaria o banco com as senhas do repositorio.
# O tinker sai com 0 mesmo quando o codigo lanca excecao, entao o resultado e conferido pela saida.
admin_has_repo_password() {
  php artisan tinker --execute='$hash = App\Models\User::where("email", Database\Seeders\UserSeeder::ADMIN_EMAIL)->value("password_hash"); echo $hash !== null && Illuminate\Support\Facades\Hash::check(Database\Seeders\UserSeeder::ADMIN_PASSWORD, $hash) ? "sim" : "nao";' | tail -n 1
}

REPO_PASSWORD=$(admin_has_repo_password)
if [ "$REPO_PASSWORD" = "sim" ]; then
  : "${CALMIND_DEMO_PASSWORD:?o admin ainda aceita a senha do repositorio; defina CALMIND_DEMO_PASSWORD}"
  # O APK de teste embute a senha de demonstracao, entao o admin precisa de outra.
  : "${CALMIND_ADMIN_PASSWORD:?defina CALMIND_ADMIN_PASSWORD, diferente de CALMIND_DEMO_PASSWORD}"
  php artisan tinker --execute='$demo = getenv("CALMIND_DEMO_PASSWORD"); $admin = getenv("CALMIND_ADMIN_PASSWORD"); if (!$demo || !$admin || $demo === $admin) { throw new RuntimeException("CALMIND_DEMO_PASSWORD e CALMIND_ADMIN_PASSWORD precisam existir e ser diferentes"); } $users = Illuminate\Support\Facades\DB::table("users")->get(["id", "password_hash"]); $swap = fn (string $seed) => $users->filter(fn ($user) => Illuminate\Support\Facades\Hash::check($seed, $user->password_hash))->pluck("id"); $adminIds = $swap(Database\Seeders\UserSeeder::ADMIN_PASSWORD); $demoIds = $swap(Database\Seeders\UserSeeder::PASSWORD); Illuminate\Support\Facades\DB::table("users")->whereIn("id", $adminIds)->update(["password_hash" => Illuminate\Support\Facades\Hash::make($admin)]); Illuminate\Support\Facades\DB::table("users")->whereIn("id", $demoIds)->update(["password_hash" => Illuminate\Support\Facades\Hash::make($demo)]); echo "senhas do repositorio trocadas: admin ".$adminIds->count().", demonstracao ".$demoIds->count();'
  REPO_PASSWORD=$(admin_has_repo_password)
  if [ "$REPO_PASSWORD" != "nao" ]; then
    echo "a troca das senhas do repositorio falhou (admin: $REPO_PASSWORD)" >&2
    exit 1
  fi
elif [ "$REPO_PASSWORD" != "nao" ]; then
  echo "nao foi possivel conferir a senha do admin: $REPO_PASSWORD" >&2
  exit 1
fi

php artisan optimize:clear
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache
