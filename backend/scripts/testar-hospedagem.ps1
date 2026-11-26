# Testes de aceite 4 e 5 da hospedagem (docs/engenharia/hospedagem-alwaysdata.md): foto de perfil e
# analise por IA, pela API publica, com as contas ficticias da demonstracao.
# A senha sai de CALMIND_DEMO_PASSWORD no backend/.env desta maquina e nunca e exibida.
# Uso, da raiz do repositorio:  .\backend\scripts\testar-hospedagem.ps1
# Remove a foto e descarta a sugestao no fim, para nao mudar a massa.
param([string]$BaseUrl = 'https://calmind.alwaysdata.net')

$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$api = "$BaseUrl/api/v1"
$line = Get-Content (Join-Path $repo 'backend/.env') | Where-Object { $_ -like 'CALMIND_DEMO_PASSWORD=*' } | Select-Object -First 1
if (-not $line) { throw 'CALMIND_DEMO_PASSWORD nao esta no backend/.env.' }
$password = $line.Substring($line.IndexOf('=') + 1).Trim().Trim('"', "'")
$script:failures = 0

function Show-Result([string]$Name, [bool]$Ok, [string]$Detail) {
    if (-not $Ok) { $script:failures++ }
    Write-Host ('{0}  {1}  {2}' -f $(if ($Ok) { 'OK    ' } else { 'FALHOU' }), $Name, $Detail)
}

function Invoke-Api([string]$Method, [string]$Path, $Token, $Body) {
    $arguments = @{ Method = $Method; Uri = "$api/$Path"; Headers = @{ Accept = 'application/json' }; TimeoutSec = 120 }
    if ($Token) { $arguments.Headers.Authorization = "Bearer $Token" }
    if ($Body) {
        $arguments.Body = [Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json))
        $arguments.ContentType = 'application/json'
    }
    Invoke-RestMethod @arguments
}

$patient = (Invoke-Api POST 'auth/login' $null @{ email = 'elizabeth.bennet@example.com'; password = $password }).token
$psychologist = (Invoke-Api POST 'auth/login' $null @{ email = 'hermione.granger@example.com'; password = $password }).token
Show-Result 'Login das duas contas' ([bool]($patient -and $psychologist)) ''

try {
    # 4. Foto de perfil: envia, confere a URL em https e baixa como psicologa vinculada
    $image = Join-Path $repo 'docs/api/fixtures/avatar-teste.png'
    $code = & curl.exe -s -o NUL -w '%{http_code}' --max-time 60 -H 'Accept: application/json' -H "Authorization: Bearer $patient" -F "image=@$image" "$api/me/avatar"
    Show-Result 'Envio da foto' ($code -in '200', '201') "HTTP $code"

    $me = Invoke-Api GET 'me' $patient
    if ($me.data) { $me = $me.data }
    Show-Result 'URL da foto em https' ([string]$me.avatar_url -like "$BaseUrl/*") ([string]$me.avatar_url)

    $code = & curl.exe -s -o NUL -w '%{http_code}' --max-time 60 -H "Authorization: Bearer $psychologist" "$($me.avatar_url)"
    Show-Result 'Psicologa baixa a foto' ($code -eq '200') "HTTP $code"
    Invoke-Api DELETE 'me/avatar' $patient | Out-Null

    # 5. Analise por IA de verdade
    $record = Invoke-Api GET "psychologist/patients/$($me.id)/record" $psychologist
    Show-Result 'Prontuario' ($record.totals.medication -ge 1) "medicacoes: $($record.totals.medication)"

    $watch = [Diagnostics.Stopwatch]::StartNew()
    try {
        $analysis = Invoke-Api POST 'psychologist/analyses' $psychologist @{
            bond_id = $record.bond_id
            period_start = (Get-Date).AddDays(-10).ToString('yyyy-MM-dd')
            period_end = (Get-Date).ToString('yyyy-MM-dd')
        }
        if ($analysis.data) { $analysis = $analysis.data }
        $real = ($analysis.status -eq 'generated') -and ($analysis.summary -notlike '*SIMULADO*')
        Show-Result 'Analise por IA' $real ('{0:N1}s' -f $watch.Elapsed.TotalSeconds)
        Invoke-Api POST "psychologist/analyses/$($analysis.id)/discard" $psychologist | Out-Null
    } catch {
        Show-Result 'Analise por IA' $false ('{0:N1}s: {1}' -f $watch.Elapsed.TotalSeconds, $_.Exception.Message)
    }
} finally {
    foreach ($token in $patient, $psychologist) {
        try { Invoke-Api POST 'auth/logout' $token | Out-Null } catch { }
    }
}

Write-Host "Falhas: $script:failures"
exit $script:failures
