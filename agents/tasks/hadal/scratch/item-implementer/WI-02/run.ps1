$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
node probe.mjs
exit $LASTEXITCODE
