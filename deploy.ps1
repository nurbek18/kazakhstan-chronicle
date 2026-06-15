# Deploy to GitHub (nurbek18)
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$git = "C:\Program Files\Git\bin\git.exe"
$repo = "kazakhstan-chronicle"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Checking GitHub login..."
gh auth status
if ($LASTEXITCODE -ne 0) {
    gh auth login --hostname github.com --git-protocol https --web --scopes "repo,workflow"
}

Write-Host "Pushing to GitHub..."
gh repo view "nurbek18/$repo" 2>$null
if ($LASTEXITCODE -ne 0) {
    gh repo create "nurbek18/$repo" --public --source=. --remote=origin --push --description "Kazakhstan news newspaper website"
} else {
    & $git push origin main
}

Write-Host "Done: https://nurbek18.github.io/$repo/"
