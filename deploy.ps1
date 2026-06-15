# 一键部署到 GitHub (nurbek18)
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$git = "C:\Program Files\Git\bin\git.exe"
$repo = "kazakhstan-chronicle"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "检查 GitHub 登录状态..."
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "请先登录 GitHub（会打开浏览器）："
    gh auth login --hostname github.com --git-protocol https --web
}

Write-Host ""
Write-Host "创建仓库并推送..."
gh repo view "nurbek18/$repo" 2>$null
if ($LASTEXITCODE -ne 0) {
    gh repo create "nurbek18/$repo" --public --source=. --remote=origin --push --description "哈萨克斯坦真实新闻 · 经典报纸风格网站"
} else {
    & $git remote remove origin 2>$null
    & $git remote add origin "https://github.com/nurbek18/$repo.git"
    & $git push -u origin main
}

Write-Host ""
Write-Host "启用 GitHub Pages..."
gh api repos/nurbek18/$repo/pages -X POST -f build_type=workflow 2>$null

Write-Host ""
Write-Host "完成！网站地址："
Write-Host "https://nurbek18.github.io/$repo/" -ForegroundColor Green
