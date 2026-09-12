$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Remotion = Join-Path $Root "node_modules/.bin/remotion.CMD"
$OutDir = Join-Path $Root "out/segments"
$Final = Join-Path $Root "out/jasonwu-component-catalog.mp4"
$ConcatList = Join-Path $OutDir "jasonwu-component-catalog-concat.txt"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$Segments = @(
  @{ Frames = "0-1049"; File = Join-Path $OutDir "jasonwu-component-catalog-001.mp4" },
  @{ Frames = "1050-2099"; File = Join-Path $OutDir "jasonwu-component-catalog-002.mp4" },
  @{ Frames = "2100-3149"; File = Join-Path $OutDir "jasonwu-component-catalog-003.mp4" },
  @{ Frames = "3150-4199"; File = Join-Path $OutDir "jasonwu-component-catalog-004.mp4" },
  @{ Frames = "4200-5249"; File = Join-Path $OutDir "jasonwu-component-catalog-005.mp4" }
)

foreach ($Segment in $Segments) {
  & $Remotion render src/index.ts JasonWuComponentCatalog $Segment.File `
    --frames=$($Segment.Frames) `
    --codec=h264 `
    --crf=20 `
    --pixel-format=yuv420p `
    --concurrency=75% `
    --x264-preset=veryfast
}

$ConcatLines = $Segments | ForEach-Object {
  $Path = $_.File.Replace("\", "/").Replace("'", "'\''")
  "file '$Path'"
}

[System.IO.File]::WriteAllLines($ConcatList, [string[]]$ConcatLines, (New-Object System.Text.UTF8Encoding($false)))
& $Remotion ffmpeg -y -f concat -safe 0 -i $ConcatList -c copy $Final
Write-Host "Segmented render complete: $Final"
