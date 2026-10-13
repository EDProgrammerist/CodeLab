param(
    [ValidateSet('install', 'ci', 'dev', 'check', 'typecheck', 'lint', 'build', 'preview')]
    [string]$Task = 'dev'
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$frontendPath = Join-Path $projectRoot 'frontend'
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
