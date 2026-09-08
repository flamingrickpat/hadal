$f = Get-Content C:\Temp\hadal-v2\design_private\creature_candidates.md
$counts = @{}
$cur = ''
foreach ($l in $f) {
  $h = [regex]::Match($l, '^### (T-\d\d)')
  if ($h.Success) { $cur = $h.Groups[1].Value; if (-not $counts.ContainsKey($cur)) { $counts[$cur] = 0 }; continue }
  $q = [regex]::Match($l, '^(\d+)\. ')
  if ($q.Success -and $cur -ne '') { $n = [int]$q.Groups[1].Value; if ($n -ge 1 -and $n -le 10) { $counts[$cur] = $counts[$cur] + 1 } }
}
$counts.Keys | Sort-Object | ForEach-Object {
  $n = $counts[$_]; $flag = if ($n -ne 10) { '  <-- ABNORMAL' } else { '' }
  Write-Output ("{0}: {1} questions{2}" -f $_, $n, $flag)
}
Write-Output ("TOTAL blocks: {0}; with exactly 10: {1}" -f $counts.Count, (($counts.Values | Where-Object { $_ -eq 10 }).Count))
