# Node.js の PATH を設定して開発サーバーを起動
$nodePath = "C:\Program Files\nodejs"
if ($env:Path -notlike "*$nodePath*") {
    $env:Path = "$nodePath;$env:Path"
}

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

Set-Location $PSScriptRoot

Write-Host "Node.js: $(node --version)"
Write-Host "npm:     $(& "$nodePath\npm.cmd" --version)"
Write-Host ""
Write-Host "依存パッケージをインストール中..."
& "$nodePath\npm.cmd" install
Write-Host ""
Write-Host "開発サーバーを起動します → http://localhost:5173"
& "$nodePath\npm.cmd" run dev
