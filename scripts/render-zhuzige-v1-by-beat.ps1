$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Remotion = Join-Path $Root "node_modules/.bin/remotion.CMD"
$OutDir = Join-Path $Root "out/segments-v1-by-beat"
$Final = Join-Path $Root "out/zhuzigeceo-remake-v1-by-beat.mp4"
$ConcatList = Join-Path $OutDir "zhuzige-v1-by-beat-concat.txt"

$Segments = @(
  @{ Name = "001-succession"; Frames = "0-359" },
  @{ Name = "002-profile"; Frames = "360-809" },
  @{ Name = "003-career"; Frames = "810-1199" },
  @{ Name = "004-crossroads"; Frames = "1200-1619" },
  @{ Name = "005-silicon"; Frames = "1620-1979" },
  @{ Name = "006-silicon-gain"; Frames = "1980-2339" },
  @{ Name = "007-platform"; Frames = "2340-2699" },
  @{ Name = "008-thinness"; Frames = "2700-3089" },
  @{ Name = "009-ports"; Frames = "3090-3509" },
  @{ Name = "010-pro-market"; Frames = "3510-3959" },
  @{ Name = "011-portfolio"; Frames = "3960-4409" },
  @{ Name = "012-airpods"; Frames = "4410-4859" },
  @{ Name = "013-leadership"; Frames = "4860-5309" },
  @{ Name = "014-market-choice"; Frames = "5310-5759" },
  @{ Name = "015-functional-org"; Frames = "5760-6209" },
  @{ Name = "016-ceo-integrator"; Frames = "6210-6659" },
  @{ Name = "017-candidates"; Frames = "6660-7139" },
  @{ Name = "018-direction"; Frames = "7140-7499" },
  @{ Name = "019-soft-hard"; Frames = "7500-7799" },
  @{ Name = "020-future"; Frames = "7800-8219" },
  @{ Name = "021-future-devices"; Frames = "8220-8669" },
  @{ Name = "022-services"; Frames = "8670-9119" },
  @{ Name = "023-cook-transition"; Frames = "9120-9569" },
  @{ Name = "024-market-debate"; Frames = "9570-10019" },
  @{ Name = "025-ai-question"; Frames = "10020-10469" },
  @{ Name = "026-opinion"; Frames = "10470-10919" },
  @{ Name = "027-innovation"; Frames = "10920-11369" },
  @{ Name = "028-cook-legacy"; Frames = "11370-11819" },
  @{ Name = "029-consumer"; Frames = "11820-12299" },
  @{ Name = "030-product-close"; Frames = "12300-12779" },
  @{ Name = "031-finale"; Frames = "12780-13278" }
)
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
foreach ($Segment in $Segments) {
  $file = Join-Path $OutDir ("zhuzige-v1-" + $Segment.Name + ".mp4")
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
}$ConcatLines = $Segments | ForEach-Object { "file '$((Join-Path $OutDir ('zhuzige-v1-' + $_.Name + '.mp4')).Replace('\', '/'))'" }
Set-Content -LiteralPath $ConcatList -Value $ConcatLines -Encoding Ascii
& $Remotion ffmpeg -y -f concat -safe 0 -i $ConcatList -c copy $Final
if ($LASTEXITCODE -ne 0) { throw "Final concat failed." }
Write-Host "Beat render complete: $Final"



