# Usage: run from src\ folder:
#   cd C:\Users\a321z\OneDrive\Documents\GitHub\mp1\src
#   .\scripts\make_icons_currentcolor.ps1

$iconsDir = ".\assets\icons"
if (-Not (Test-Path $iconsDir)) {
  Write-Host "icons folder not found: $iconsDir"
  Exit 1
}

Get-ChildItem $iconsDir -Filter *.svg | ForEach-Object {
  $path = $_.FullName
  Write-Host "Processing $path"
  $svg = Get-Content $path -Raw

  # Replace any existing fill="..." attributes with currentColor
  if ($svg -match 'fill="[^"]*"') {
    $svg = $svg -replace 'fill="[^"]+"','fill="currentColor"'
  } else {
    # If the SVG had no fill attr on path, inject fill="currentColor" onto the first <path occurrence
    $svg = $svg -replace '<path','<path fill="currentColor"'
  }

  # ensure svg root doesn't set a hard fill on <svg> (remove fill attr if present)
  $svg = $svg -replace '<svg([^>]*?)\sfill="[^"]*"', '<svg$1'

  Set-Content -Path $path -Value $svg -Encoding UTF8
  Write-Host "  -> updated $($_.Name)"
}
Write-Host "Done. SVGs now use fill=\"currentColor\" for path elements (where possible)."
