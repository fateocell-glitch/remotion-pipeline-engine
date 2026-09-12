$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Remotion = Join-Path $Root "node_modules/.bin/remotion.CMD"
$OutDir = Join-Path $Root "out/segments-tail-custom-effects"
$Final = Join-Path $Root "out/zhuzigeceo-tail-custom-effects-preview.mp4"
$ConcatList = Join-Path $OutDir "tail-custom-effects-concat.txt"

$Segments = @(
  @{ Name = "017-candidates-photo-wall"; Frames = "6660-7139" },
  @{ Name = "018-direction-data-flow"; Frames = "7140-7499" },
  @{ Name = "019-soft-hard-product-explosion"; Frames = "7500-7799" },
  @{ Name = "020-future-market"; Frames = "7800-8219" },
  @{ Name = "021-future-devices-newspaper"; Frames = "8220-8669" },
  @{ Name = "022-services"; Frames = "8670-9119" },
  @{ Name = "023-cook-transition-route-map"; Frames = "9120-9569" },
  @{ Name = "024-market-debate-data-flow"; Frames = "9570-10019" },
  @{ Name = "025-ai-question-screen-recording"; Frames = "10020-10469" },
  @{ Name = "026-opinion-zoom-statement"; Frames = "10470-10919" },
  @{ Name = "027-innovation-desktop"; Frames = "10920-11369" },
  @{ Name = "028-cook-legacy-time-rewind"; Frames = "11370-11819" },
  @{ Name = "029-consumer-clipboard"; Frames = "11820-12299" },
  @{ Name = "030-product-close-checklist"; Frames = "12300-12779" },
  @{ Name = "031-finale-spotlight"; Frames = "12780-13278" }
)

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
foreach ($Segment in $Segments) {
  $file = Join-Path $OutDir ("tail-" + $Segment.Name + ".mp4")
  if ((Test-Path -LiteralPath $file) -and (Get-Item -LiteralPath $file).Length -gt 0) {
    Write-Host "Skipping completed beat: $($Segment.Name)"
    continue
  }
  $succeeded = $false
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    & $Remotion render src/index.ts ZhuzigeFull $file --frames=$($Segment.Frames) --codec=h264 --crf=20 --pixel-format=yuv420p --concurrency=4 --x264-preset=veryfast
    if ($LASTEXITCODE -eq 0) { $succeeded = $true; break }
    Start-Sleep -Seconds 8
  }
  if (-not $succeeded) { throw "Beat render failed after 3 attempts: $($Segment.Name)" }
}

$ConcatLines = $Segments | ForEach-Object { "file '$((Join-Path $OutDir ('tail-' + $_.Name + '.mp4')).Replace('\', '/'))'" }
Set-Content -LiteralPath $ConcatList -Value $ConcatLines -Encoding Ascii
& $Remotion ffmpeg -y -f concat -safe 0 -i $ConcatList -c copy $Final
if ($LASTEXITCODE -ne 0) { throw "Tail preview concat failed." }
Write-Host "Tail preview complete: $Final"
