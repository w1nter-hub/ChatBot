# Retrain the three public demo knowledge bases (same URLs as DemoChatbots.tsx).
#
# Auth (pick one):
#   $env:JWT = "eyJhbG..."
#   Or put the token on a single line in: scripts/.retrain-jwt  (gitignored)
#   Or: $env:JWT_FILE = "C:\path\to\jwt.txt"
#
# Usage:
#   cd C:\Users\Winter\Desktop\qoldau-ai
#   $env:API_BASE = "https://chatbot-kaxn.onrender.com"   # optional, this is default
#   .\scripts\retrain-demo-chatbots.ps1
#
# Optional: $env:DEMO_KB_IDS = "id1,id2,id3"

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$api = $env:API_BASE
if (-not $api) { $api = "https://chatbot-kaxn.onrender.com" }
$api = $api.TrimEnd("/")

$jwt = $env:JWT
if (-not $jwt) {
    $jwtFile = $env:JWT_FILE
    if (-not $jwtFile) { $jwtFile = Join-Path $PSScriptRoot ".retrain-jwt" }
    if (Test-Path -LiteralPath $jwtFile) {
        $jwt = (Get-Content -LiteralPath $jwtFile -Raw).Trim()
    }
}
if (-not $jwt) {
    Write-Error @"
No JWT. Either:
  1) Set `$env:JWT` to your dashboard token (Application -> Local Storage -> accesstoken), or
  2) Save the token (one line) to: $(Join-Path $PSScriptRoot '.retrain-jwt')
"@
}

$idsRaw = $env:DEMO_KB_IDS
if ($idsRaw) {
    $ids = ($idsRaw -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ })
} else {
    $ids = @(
        "69dbafa3ca0f93f354d2750b",
        "69dbafefca0f93f354d2750c",
        "69dbb009ca0f93f354d2750d"
    )
}

$payloads = @(
    @{
        websiteUrl = "https://bilimland.kz"
        urls       = @()
        include    = @("/kk/faq")
        exclude    = @()
    },
    @{
        websiteUrl = "https://www.gov.kz"
        urls       = @()
        include    = @("/memleket/entities/edu/activities/population")
        exclude    = @()
    },
    @{
        websiteUrl = "https://nationalcatalog.kz"
        urls       = @()
        include    = @("/about")
        exclude    = @()
    }
)

if ($ids.Count -ne 3) {
    Write-Error "Need exactly 3 knowledge base ids (got $($ids.Count)). Set DEMO_KB_IDS=id1,id2,id3"
}

$authHeaders = @{ Authorization = "Bearer $jwt" }
$jsonHeaders = @{
    Authorization  = "Bearer $jwt"
    "Content-Type" = "application/json"
}

function Get-KbStatus {
    param([string]$KbId)
    $kb = Invoke-RestMethod -Uri "$api/knowledgebase/$KbId" -Headers $authHeaders -Method Get
    return [string]$kb.status
}

function Wait-KbStatus {
    param(
        [string]$KbId,
        [string[]]$UntilOneOf,
        [string[]]$AbortOn,
        [int]$TimeoutSec = 900,
        [int]$PollSec = 12
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $st = Get-KbStatus -KbId $KbId
        foreach ($bad in $AbortOn) {
            if ($st -eq $bad) { return $st }
        }
        foreach ($ok in $UntilOneOf) {
            if ($st -eq $ok) { return $st }
        }
        Write-Host "  ... status=$st (waiting)"
        Start-Sleep -Seconds $PollSec
    }
    throw "Timeout waiting for KB $KbId (last status was $(Get-KbStatus -KbId $KbId))"
}

for ($i = 0; $i -lt 3; $i++) {
    $id = $ids[$i]
    $body = $payloads[$i] | ConvertTo-Json -Depth 5 -Compress
    Write-Host "[$($i+1)/3] PUT $api/knowledgebase/$id/website_data (start crawl)..."
    Invoke-RestMethod -Uri "$api/knowledgebase/$id/website_data" -Method Put -Headers $jsonHeaders -Body $body

    Write-Host "[$($i+1)/3] Waiting for CRAWLED..."
    $afterCrawl = Wait-KbStatus -KbId $id -UntilOneOf @("CRAWLED") -AbortOn @("CRAWL_ERROR") -TimeoutSec 900 -PollSec 12
    if ($afterCrawl -eq "CRAWL_ERROR") {
        Write-Warning "KB $id ended with CRAWL_ERROR — skip embeddings for this id."
        continue
    }

    Write-Host "[$($i+1)/3] POST $api/knowledgebase/$id/generate_embeddings ..."
    Invoke-RestMethod -Uri "$api/knowledgebase/$id/generate_embeddings" -Method Post -Headers $authHeaders

    Write-Host "[$($i+1)/3] Waiting for READY..."
    $final = Wait-KbStatus -KbId $id -UntilOneOf @("READY") -AbortOn @("EMBEDDING_ERROR") -TimeoutSec 1200 -PollSec 15
    if ($final -eq "EMBEDDING_ERROR") {
        Write-Warning "KB $id ended with EMBEDDING_ERROR — check OpenAI key / worker logs."
    } else {
        Write-Host "[$($i+1)/3] READY."
    }
}

Write-Host "All done. Redeploy the frontend only if you changed env or UI; training is API-side."
