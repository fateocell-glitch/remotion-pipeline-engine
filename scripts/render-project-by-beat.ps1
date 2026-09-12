param(
  [string]$Project = "src/JasonWu/projects/zhuzige-ceo.json",
  [string]$Output = "out/zhuzigeceo-remake-project-engine-v2.mp4"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$ProjectPath = [System.IO.Path]::GetFullPath((Join-Path $Root $Project))
if (-not (Test-Path -LiteralPath $ProjectPath)) {
  throw "Project file was not found: $ProjectPath"
}

$ProjectData = Get-Content -LiteralPath $ProjectPath -Raw -Encoding UTF8 | ConvertFrom-Json
$Plan = (& node scripts/project-render-plan.cjs $ProjectPath | ConvertFrom-Json)
$Remotion = Join-Path $Root "node_modules/.bin/remotion.CMD"
$OutDir = Join-Path $Root ("out/project-segments-" + $ProjectData.projectId)
$OutputPath = [System.IO.Path]::GetFullPath((Join-Path $Root $Output))
$ConcatList = Join-Path $OutDir "concat.txt"
$VideoOnly = Join-Path $OutDir "merged-video.mp4"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

foreach ($Segment in $Plan) {
  $SafeId = ($Segment.id -replace "[^a-zA-Z0-9_-]", "-")
  $File = Join-Path $OutDir ($SafeId + ".mp4")
  if ((Test-Path -LiteralPath $File) -and (Get-Item -LiteralPath $File).Length -gt 0) {
    Write-Host "Skipping completed beat: $($Segment.id)"
    continue
  }

  $Succeeded = $false
  for ($Attempt = 1; $Attempt -le 3; $Attempt++) {
    & $Remotion render src/index.ts ProjectEditor $File `
      --props=$ProjectPath `
      --frames=$($Segment.frames) `
      --codec=h264 `
      --crf=20 `
      --pixel-format=yuv420p `
      --concurrency=4 `
      --x264-preset=veryfast
    if ($LASTEXITCODE -eq 0) {
      $Succeeded = $true
      break
    }
    Start-Sleep -Seconds 8
  }
  if (-not $Succeeded) {
    throw "Beat render failed after 3 attempts: $($Segment.id)"
  }
}

$ConcatLines = $Plan | ForEach-Object {
  $SafeId = ($_.id -replace "[^a-zA-Z0-9_-]", "-")
  "file '$((Join-Path $OutDir ($SafeId + '.mp4')).Replace('\', '/'))'"
}
Set-Content -LiteralPath $ConcatList -Value $ConcatLines -Encoding Ascii

& $Remotion ffmpeg -y -f concat -safe 0 -i $ConcatList -map 0:v:0 -an -c:v copy $VideoOnly
if ($LASTEXITCODE -ne 0) {
  throw "Video concat failed."
}

$AudioPath = Join-Path $Root ("public/" + $ProjectData.audioSrc)
if (Test-Path -LiteralPath $AudioPath) {
  & $Remotion ffmpeg -y -i $VideoOnly -i $AudioPath -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest $OutputPath
} else {
  Copy-Item -LiteralPath $VideoOnly -Destination $OutputPath -Force
}
if ($LASTEXITCODE -ne 0) {
  throw "Final mux failed."
}

Write-Host "Project render complete: $OutputPath"
