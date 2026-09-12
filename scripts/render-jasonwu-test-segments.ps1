$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Remotion = Join-Path $Root "node_modules/.bin/remotion.CMD"
$OutDir = Join-Path $Root "out/segments"
$Final = Join-Path $Root "out/jasonwu-test-segmented.mp4"
$ConcatList = Join-Path $OutDir "concat.txt"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$Segments = @(
  @{ Frames = "0-749"; File = Join-Path $OutDir "jasonwu-test-001.mp4" },
  @{ Frames = "750-1679"; File = Join-Path $OutDir "jasonwu-test-002.mp4" },
  @{ Frames = "1680-2729"; File = Join-Path $OutDir "jasonwu-test-003.mp4" },
  @{ Frames = "2730-4049"; File = Join-Path $OutDir "jasonwu-test-004.mp4" }
)

foreach ($Segment in $Segments) {
  & $Remotion render src/index.ts JasonWuTest $Segment.File `
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

Set-Content -LiteralPath $ConcatList -Value $ConcatLines -Encoding utf8

& $Remotion ffmpeg -y -f concat -safe 0 -i $ConcatList -c copy $Final

Write-Host "Segmented render complete: $Final"
