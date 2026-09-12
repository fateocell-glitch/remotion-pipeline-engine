$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Remotion = Join-Path $Root "node_modules/.bin/remotion.CMD"
$OutDir = Join-Path $Root "out/segments"
$Final = Join-Path $Root "out/jasonwu-long-segmented.mp4"
$ConcatList = Join-Path $OutDir "jasonwu-long-concat.txt"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$Segments = @(
  @{ Frames = "0-1349"; File = Join-Path $OutDir "jasonwu-long-001.mp4" },
  @{ Frames = "1350-2699"; File = Join-Path $OutDir "jasonwu-long-002.mp4" },
  @{ Frames = "2700-4499"; File = Join-Path $OutDir "jasonwu-long-003.mp4" },
  @{ Frames = "4500-5999"; File = Join-Path $OutDir "jasonwu-long-004.mp4" },
  @{ Frames = "6000-7199"; File = Join-Path $OutDir "jasonwu-long-005.mp4" }
)

foreach ($Segment in $Segments) {
  & $Remotion render src/index.ts JasonWuLong $Segment.File `
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

[System.IO.File]::WriteAllLines($ConcatList, $ConcatLines, [System.Text.UTF8Encoding]::new($false))

& $Remotion ffmpeg -y -f concat -safe 0 -i $ConcatList -c copy $Final

Write-Host "Segmented render complete: $Final"

