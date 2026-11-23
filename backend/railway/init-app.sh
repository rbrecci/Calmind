#!/bin/sh
# Pre-Deploy Command da Railway: chmod +x ./railway/init-app.sh && sh ./railway/init-app.sh
set -e

php artisan migrate --force

# Os seeders usam create(), entao so rodam com o banco vazio.
USERS=$(php artisan tinker --execute="echo App\Models\User::count();" | tail -n 1)
if [ "$USERS" = "0" ]; then
  : "${CALMIND_DEMO_PASSWORD:?defina CALMIND_DEMO_PASSWORD antes do primeiro deploy}"
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
  php artisan tinker --execute='$password = getenv("CALMIND_DEMO_PASSWORD"); if ($password === false || $password === "") { throw new RuntimeException("CALMIND_DEMO_PASSWORD vazia"); } $hash = Illuminate\Support\Facades\Hash::make($password); $public = [Database\Seeders\UserSeeder::PASSWORD, Database\Seeders\UserSeeder::ADMIN_PASSWORD]; $ids = Illuminate\Support\Facades\DB::table("users")->get(["id", "password_hash"])->filter(fn ($user) => collect($public)->contains(fn ($seed) => Illuminate\Support\Facades\Hash::check($seed, $user->password_hash)))->pluck("id"); Illuminate\Support\Facades\DB::table("users")->whereIn("id", $ids)->update(["password_hash" => $hash]); echo "senhas do repositorio trocadas: ".$ids->count();'
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
