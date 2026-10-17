param(
    [ValidateSet('install', 'ci', 'dev', 'check', 'typecheck', 'lint', 'build', 'preview', 'test:ui')]
    [string]$Task = 'dev'
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$frontendPath = Join-Path $projectRoot 'frontend'
if ($Task -eq 'dev') {
    Write-Host 'Starting CodeLab API, database, cache and local mail services...'
    & docker compose --env-file (Join-Path $projectRoot '.env') -f (Join-Path $PSScriptRoot 'compose.yaml') up -d --wait --wait-timeout 90
    if ($LASTEXITCODE -ne 0) {
        throw 'CodeLab backend did not start. Open Docker Desktop, wait until its engine is running, then retry this command.'
    }
}

$nodeVersion = (Get-Content -LiteralPath (Join-Path $frontendPath '.node-version') -Raw).Trim()
$npmDirectory = Split-Path (Get-Command npm).Source
$npmCli = Join-Path $npmDirectory 'node_modules/npm/bin/npm-cli.js'
if (-not (Test-Path -LiteralPath $npmCli)) {
    throw 'Cannot locate npm-cli.js beside npm. Use Node 24 directly and the documented npm commands.'
}

$nodeRuntimePath = (& npm exec --yes --package="node@$nodeVersion" -- node -p 'process.execPath' | Select-Object -Last 1).Trim()
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $nodeRuntimePath)) {
    throw 'Unable to resolve the project Node runtime.'
}

$originalPath = $env:PATH
Push-Location $frontendPath
try {
    $env:PATH = "$(Split-Path $nodeRuntimePath);$originalPath"
    Write-Host "CodeLab frontend: Node $nodeVersion, task $Task"
    if ($Task -in @('install', 'ci')) {
        & $nodeRuntimePath $npmCli $Task
    } else {
        & $nodeRuntimePath $npmCli run $Task
    }
    $taskExitCode = $LASTEXITCODE
} finally {
    $env:PATH = $originalPath
    Pop-Location
}
exit $taskExitCode
