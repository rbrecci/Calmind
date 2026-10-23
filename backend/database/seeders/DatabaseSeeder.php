<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // RNF-63: massa inteiramente ficticia. A ordem importa: usuarios, termos, depois o vinculo
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ConsentTermSeeder::class,
            BondSeeder::class,
        ]);
    }
}
