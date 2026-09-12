$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Remotion = Join-Path $Root "node_modules/.bin/remotion.CMD"
$OutDir = Join-Path $Root "out/segments"
$Final = Join-Path $Root "out/zhuzigeceo-remake-full.mp4"
$ConcatList = Join-Path $OutDir "zhuzige-full-concat.txt"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$Segments = @(
  @{ Frames = "0-2212"; File = Join-Path $OutDir "zhuzige-full-001.mp4" },
  @{ Frames = "2213-4425"; File = Join-Path $OutDir "zhuzige-full-002.mp4" },
  @{ Frames = "4426-6638"; File = Join-Path $OutDir "zhuzige-full-003.mp4" },
  @{ Frames = "6639-8851"; File = Join-Path $OutDir "zhuzige-full-004.mp4" },
  @{ Frames = "8852-11064"; File = Join-Path $OutDir "zhuzige-full-005.mp4" },
  @{ Frames = "11065-13278"; File = Join-Path $OutDir "zhuzige-full-006.mp4" }
)

foreach ($Segment in $Segments) {
  & $Remotion render src/index.ts ZhuzigeFull $Segment.File `
    --frames=$($Segment.Frames) `
    --codec=h264 `
    --crf=20 `
    --pixel-format=yuv420p `
    --concurrency=75% `
    --x264-preset=veryfast
}

$ConcatLines = $Segments | ForEach-Object {
  "file '$($_.File.Replace('\', '/'))'"
}
Set-Content -LiteralPath $ConcatList -Value $ConcatLines -Encoding Ascii

& $Remotion ffmpeg -y -f concat -safe 0 -i $ConcatList -c copy $Final

if (-not (Test-Path -LiteralPath $Final)) {
  throw "Final output was not created: $Final"
}

Write-Host "Segmented render complete: $Final"

