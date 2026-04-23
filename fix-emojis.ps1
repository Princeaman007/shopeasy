$rootPath = 'apps/web'
$files = Get-ChildItem -Path $rootPath -Recurse -Include '*.tsx' | Where-Object { $_.FullName -notlike '*node_modules*' }
$total = 0
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $newContent = [System.Text.RegularExpressions.Regex]::Replace($content, '[^\x00-\xFF]', '')
  if ($newContent -ne $content) {
    [System.IO.File]::WriteAllText($file.FullName, $newContent)
    $total++
    Write-Host ('Traite: ' + $file.Name) -ForegroundColor Green
  }
}
Write-Host ('Termine ! ' + $total + ' fichier(s) modifie(s)') -ForegroundColor Cyan
