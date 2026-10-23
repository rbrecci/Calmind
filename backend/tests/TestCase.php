<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    // Roda antes de o RefreshDatabase apagar as tabelas: protege o banco de desenvolvimento `calmind`
    protected function setUpTraits()
    {
        $this->assertStringStartsWith('calmind_test', DB::connection()->getDatabaseName());

        return parent::setUpTraits();
    }
}
