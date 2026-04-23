$rootPath = "apps/web"
$files = Get-ChildItem -Path $rootPath -Recurse -Include "*.tsx" | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.next*" }
$total = 0
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $newContent = [System.Text.RegularExpressions.Regex]::Replace($content, '[^\u0000-\u00FF]', '')
  if ($newContent -ne $content) {
    [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
    $total++
    Write-Host ("Traite: " + $file.Name) -ForegroundColor Green
  }
}
Write-Host ("Termine ! " + $total + " fichier(s) modifie(s)") -ForegroundColor Cyan