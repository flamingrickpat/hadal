# Scratch probe (WI-03d3): does any ST-03 commit message carry a spoiler token?
# Question answered: ground truth for the roster-wide spoiler audit scope.
# Read-only: git log + design_private/_spoiler_tokens.txt (token list only, never
# written to output or committed).
$ErrorActionPreference = 'Stop'
# repo root = 6 levels up: spoiler-scan -> implementer -> scratch -> <task> -> tasks -> agents -> root
$repo = $PSScriptRoot
foreach ($i in 1..6) { $repo = Split-Path -Parent $repo }
Set-Location $repo

$tokens = Get-Content "design_private\_spoiler_tokens.txt" |
  ForEach-Object { $_.Trim() } |
  Where-Object { $_ -ne '' -and -not $_.StartsWith('#') -and -not ($_ -match '^T-\d\d$') } |
  ForEach-Object { $_.TrimStart('The ') } |
  Where-Object { $_.Length -ge 3 }
Write-Host ("token count (name/desc, T-ids excluded): " + $tokens.Count)

$log = git log --format='%H%x09%s%x09%b'
$off = 0
$lines = $log -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  if ($line -match '^[0-9a-f]{40}\t') {
    $hash = $line.Split("`t")[0]
    # collect the commit block (hash line + following body lines up to blank/next hash)
    $body = $line
    for ($j = $i + 1; $j -lt $lines.Count -and -not ($lines[$j] -match '^[0-9a-f]{40}\t'); $j++) {
      $body += "`n" + $lines[$j]
    }
    if ($body -match 'ST-03|WI-03[a-d]') {
      $low = $body.ToLower()
      foreach ($t in $tokens) {
        $re = '\b' + [regex]::Escape($t.ToLower()) + '\b'
        if ($low -match $re) { Write-Host ("HIT {0} :: {1}" -f $hash, $t); $off++ }
      }
    }
  }
}
Write-Host ("offender hits: " + $off)
