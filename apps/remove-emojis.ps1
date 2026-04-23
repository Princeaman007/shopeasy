# ============================================================
# remove-emojis.ps1
# Usage: .\remove-emojis.ps1
# ============================================================

$rootPath = "apps/web"
$files = Get-ChildItem -Path $rootPath -Recurse -Include "*.tsx" |
         Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.next*" }

$totalFiles = 0

foreach ($file in $files) {
  $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
  if ($null -eq $content) { continue }

  # Supprime les emojis avec .NET Regex
  $regex = [System.Text.RegularExpressions.Regex]::new(
    '[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\uFE0F|\u200D',
    [System.Text.RegularExpressions.RegexOptions]::None
  )

  $newContent = $regex.Replace($content, '')

  # Nettoie les espaces doubles laissés par la suppression
  $newContent = $newContent -replace '  +', ' '
  $newContent = $newContent -replace '> <', '><'

  if ($newContent -ne $content) {
    Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
    $totalFiles++
    Write-Host "Traite: $($file.Name)" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Termine ! $totalFiles fichier(s) modifie(s)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan