# ============================================================
#  images 폴더를 읽어서 js/photos.js 를 자동으로 만듭니다. (앨범 버전)
#
#  ● 작업 1개 = 폴더 1개:
#      images/포차코/  안에 사진 여러 장  → "포차코" 작업 (앨범)
#      폴더 안 첫 사진(이름순)이 대표(커버) 사진이 됩니다.
#      사진 순서를 정하고 싶으면 파일 이름 앞에 1, 2, 3 ... 을 붙이세요.
#  ● 낱장 사진:  images/포차코.jpg  → 사진 1장짜리 작업
#
#  날짜:
#    1) 폴더(또는 파일) 이름이 날짜로 시작하면 그 날짜  (예: 2026-06-20 포차코)
#    2) 없으면 대표 사진의 촬영(EXIF)/저장 날짜
#  최신 작업이 맨 앞에 옵니다.
#  (직접 실행하지 말고 "업데이트.bat" 을 사용하세요)
# ============================================================
$ErrorActionPreference = 'Stop'
chcp 65001 > $null
Add-Type -AssemblyName System.Drawing

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$imagesDir   = Join-Path $projectRoot 'images'
$outFile     = Join-Path $projectRoot 'js\photos.js'
$exts = @('.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif')

function Get-PhotoDate {
    param($file)
    if ($file.Extension -match '(?i)\.(jpg|jpeg)$') {
        try {
            $img = [System.Drawing.Image]::FromFile($file.FullName)
            try {
                $prop = $img.GetPropertyItem(36867)
                $txt  = [System.Text.Encoding]::ASCII.GetString($prop.Value).Trim([char]0).Trim()
                return [datetime]::ParseExact($txt.Substring(0, 19), 'yyyy:MM:dd HH:mm:ss', $null)
            } finally { $img.Dispose() }
        } catch {}
    }
    return $file.LastWriteTime
}

function Parse-NameDate {
    param([string]$base)
    if ($base -match '^(\d{4})[-_. ]?(\d{2})[-_. ]?(\d{2})[ _-]*(.*)$') {
        try {
            $d = Get-Date -Year $matches[1] -Month $matches[2] -Day $matches[3] -Hour 0 -Minute 0 -Second 0
            return @{ date = $d; title = $matches[4].Trim() }
        } catch {}
    }
    return @{ date = $null; title = $base.Trim() }
}

function Rel($file) { return $file.FullName.Substring($projectRoot.Length).TrimStart('\', '/').Replace('\', '/') }
function JEsc([string]$s) { return $s.Replace('\', '\\').Replace('"', '\"') }

$works = New-Object System.Collections.Generic.List[object]

if (Test-Path $imagesDir) {
    # 1) 앨범 폴더
    Get-ChildItem -Path $imagesDir -Directory | Sort-Object Name | ForEach-Object {
        $folder = $_
        $imgs = Get-ChildItem -Path $folder.FullName -File |
                Where-Object { $exts -contains $_.Extension.ToLower() } | Sort-Object Name
        if ($imgs.Count -eq 0) { return }
        $nd = Parse-NameDate $folder.Name
        $date = if ($nd.date) { $nd.date } else { Get-PhotoDate $imgs[0] }
        $rels = @($imgs | ForEach-Object { Rel $_ })
        $works.Add([pscustomobject]@{ title = $nd.title; date = $date; disp = $date.ToString('yyyy.MM.dd'); photos = $rels })
    }
    # 2) 낱장 사진
    Get-ChildItem -Path $imagesDir -File |
        Where-Object { $exts -contains $_.Extension.ToLower() } | Sort-Object Name | ForEach-Object {
            $nd = Parse-NameDate $_.BaseName
            $date = if ($nd.date) { $nd.date } else { Get-PhotoDate $_ }
            $works.Add([pscustomobject]@{ title = $nd.title; date = $date; disp = $date.ToString('yyyy.MM.dd'); photos = @((Rel $_)) })
        }
}

$sorted = $works | Sort-Object date -Descending

$lines = New-Object System.Collections.Generic.List[string]
foreach ($w in $sorted) {
    $photoItems = ($w.photos | ForEach-Object { '"' + (JEsc $_) + '"' }) -join ', '
    $lines.Add('  { "title": "' + (JEsc $w.title) + '", "date": "' + $w.disp + '", "photos": [' + $photoItems + '] }')
}

$count  = $sorted.Count
$photoTotal = ($sorted | ForEach-Object { $_.photos.Count } | Measure-Object -Sum).Sum
$header = @"
/* ============================================================
   이 파일은 자동으로 만들어집니다. 직접 고치지 마세요!
   (작업 $count 개 / 사진 $photoTotal 장)
   ============================================================ */
const PHOTOS = [
"@
$content = $header + "`r`n" + ($lines -join ",`r`n") + "`r`n];`r`n"
$enc = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($outFile, $content, $enc)

Write-Host ""
Write-Host "  완료!  작업 $count 개 (사진 $photoTotal 장)가 갤러리에 등록되었습니다." -ForegroundColor Green
Write-Host ""
