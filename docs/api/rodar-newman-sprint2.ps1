param(
    [string]$BaseUrl = 'http://127.0.0.1:8000/api/v1',
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$repositoryPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$apiUri = [Uri]$BaseUrl
if ($apiUri.Scheme -ne 'http' -or $apiUri.Host -notin @('127.0.0.1', 'localhost') -or $apiUri.AbsolutePath.TrimEnd('/') -ne '/api/v1') {
    throw 'Use somente a API HTTP local em /api/v1.'
}
if (-not $OutputPath) {
    $OutputPath = Join-Path $repositoryPath ('docs/testes/{0}-newman-blocos-a-c-d-e-f.txt' -f (Get-Date -Format 'yyyy-MM-dd'))
}
$OutputPath = [IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $OutputPath) {
    throw 'A evidencia ja existe. Informe outro OutputPath para preservar a rodada anterior.'
}

$utf8 = New-Object Text.UTF8Encoding($false)
$temporaryRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$temporaryPath = Join-Path $temporaryRoot ('calmind-newman-' + [Guid]::NewGuid().ToString('N'))
$exportPath = Join-Path $temporaryPath 'collection.json'
$statePath = Join-Path $temporaryPath 'state.json'
$exitCode = 1

function Write-Evidence([string]$Text) {
    $normalized = $Text.Replace("`r`n", "`n").Replace("`r", "`n")
    [IO.File]::AppendAllText($OutputPath, $normalized + "`n", $utf8)
    Write-Host $normalized
}

function Invoke-Newman([string]$CollectionPath, [string[]]$Folders, [switch]$Export) {
    $arguments = @('--no-install', 'newman', 'run', $CollectionPath, '--env-var', "baseUrl=$BaseUrl", '--working-dir', $repositoryPath, '--disable-unicode', '--color', 'off')
    foreach ($folder in $Folders) { $arguments += @('--folder', $folder) }
    if ($Export) { $arguments += @('--export-environment', $statePath) }
    $ErrorActionPreference = 'Continue'
    $output = & npx.cmd @arguments 2>&1
    $code = $LASTEXITCODE
    foreach ($line in $output) { Write-Evidence $line.ToString() }
    Write-Evidence "Newman exit: $code"
    return $code
}

$bootstrap = @'
<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$connection = config('database.default');
$config = Illuminate\Support\Facades\DB::connection()->getConfig();
if (!$app->environment('local') || $connection !== 'mysql' || $config['database'] !== 'calmind'
    || !in_array($config['host'], ['127.0.0.1', 'localhost'], true)
    || Illuminate\Support\Facades\DB::selectOne('select database() as db')->db !== 'calmind') {
    fwrite(STDERR, "Ambiente recusado: exige local, mysql loopback e banco calmind.\n");
    exit(1);
}
'@

try {
    New-Item -ItemType Directory -Path $temporaryPath | Out-Null
    Write-Evidence 'Calmind Sprint 2: A/C/D/E/F. Bloco B nao testado; consentimento geral preparado como fixture local.'
    Write-Evidence ('Data: ' + (Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'))
    Push-Location (Join-Path $repositoryPath 'backend')
    try {
        $bootstrap | & php
        if ($LASTEXITCODE -ne 0) { throw 'A verificacao do banco local falhou.' }
    } finally { Pop-Location }
    Write-Evidence 'Ambiente confirmado: local, mysql loopback, banco calmind. Nenhum reset executado.'

    $collection = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'Calmind.postman_collection.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    # O export-collection do Newman nao preserva as mutacoes das variaveis da colecao.
    $authTests = $collection.item[0].item[-1].event | Where-Object listen -eq 'test'
    $authTests.script.exec += "pm.environment.set('calmindNewmanState', JSON.stringify(pm.collectionVariables.toObject()));"
    [IO.File]::WriteAllText($exportPath, ($collection | ConvertTo-Json -Depth 100), $utf8)
    $exitCode = Invoke-Newman $exportPath @('01 Conta e autenticacao') -Export
    if ($exitCode -ne 0) { throw 'A pasta A falhou; demais pastas nao executadas.' }

    $environment = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $state = ($environment.values | Where-Object key -eq 'calmindNewmanState').value | ConvertFrom-Json
    $patientId = $state.idUsuarioPaciente
    $email = $state.emailPaciente
    $runId = $state.runId
    if ("$patientId" -notmatch '^[1-9][0-9]*$' -or "$runId" -notmatch '^[0-9]{8}$' -or $email -cne "paciente.$runId@teste.local") {
        throw 'As variaveis exportadas nao identificam o paciente ficticio desta rodada.'
    }
    foreach ($variable in $collection.variable) { $variable.value = $state.PSObject.Properties[$variable.key].Value }
    [IO.File]::WriteAllText($exportPath, ($collection | ConvertTo-Json -Depth 100), $utf8)
    $inputData = @{ id = [int]$patientId; email = $email } | ConvertTo-Json -Compress
    $encodedInput = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($inputData))
    $fixture = @'
$input = json_decode(base64_decode('__INPUT__'), true, 512, JSON_THROW_ON_ERROR);
$user = App\Models\User::whereKey($input['id'])->where('email', $input['email'])->where('role', 'patient')->firstOrFail();
$term = App\Models\ConsentTerm::where('type', 'general')->where('effective_from', '<=', now())->orderByDesc('effective_from')->orderByDesc('id')->firstOrFail();
App\Models\ConsentAcceptance::firstOrCreate(['user_id' => $user->id, 'consent_term_id' => $term->id, 'revoked_at' => null]);
echo "Fixture: aceite geral registrado para o paciente ficticio da rodada.\n";
'@
    Push-Location (Join-Path $repositoryPath 'backend')
    try {
        $fixtureOutput = ($bootstrap + "`n" + $fixture.Replace('__INPUT__', $encodedInput)) | & php
        if ($LASTEXITCODE -ne 0) { $exitCode = 1; throw 'Falha ao preparar o aceite geral.' }
        foreach ($line in $fixtureOutput) { Write-Evidence $line }
    } finally { Pop-Location }

    $exitCode = Invoke-Newman $exportPath @('03 Cadastro profissional e aprovacao', '04 Convite e vinculo', '05 Relatos e a garantia de privacidade', '06 Tarefas terapeuticas')
} catch {
    if ($exitCode -eq 0) { $exitCode = 1 }
    Write-Evidence $_.Exception.Message
} finally {
    $resolvedTemporaryPath = [IO.Path]::GetFullPath($temporaryPath)
    if ($resolvedTemporaryPath.StartsWith($temporaryRoot, [StringComparison]::OrdinalIgnoreCase) -and [IO.Path]::GetFileName($resolvedTemporaryPath) -match '^calmind-newman-[a-f0-9]{32}$') {
        foreach ($temporaryFile in @($exportPath, $statePath)) {
            if (Test-Path -LiteralPath $temporaryFile) { Remove-Item -LiteralPath $temporaryFile -Force }
        }
        if (Test-Path -LiteralPath $resolvedTemporaryPath) { Remove-Item -LiteralPath $resolvedTemporaryPath }
    } else { throw 'Caminho temporario recusado para limpeza.' }
}
exit $exitCode
