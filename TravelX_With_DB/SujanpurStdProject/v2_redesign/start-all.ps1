$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot 'backend'

$mysqlBin = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe'
$mysqlBaseDir = 'C:\Program Files\MySQL\MySQL Server 8.4'
$mysqlDataDir = 'C:\ProgramData\MySQL\MySQL Server 8.4\Data'

function Test-PortListening {
    param([int]$Port)
    $result = netstat -ano | Select-String -Pattern ":$Port"
    return $null -ne $result
}

Write-Host 'Checking required ports...' -ForegroundColor Cyan

if (-not (Test-PortListening -Port 3306)) {
    if (-not (Test-Path $mysqlBin)) {
        throw "mysqld.exe not found at '$mysqlBin'. Update start-all.ps1 with your MySQL path."
    }

    Write-Host 'MySQL not running. Starting mysqld...' -ForegroundColor Yellow
    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoExit',
        '-Command',
        "& '$mysqlBin' --console --basedir='$mysqlBaseDir' --datadir='$mysqlDataDir' --port=3306 --bind-address=127.0.0.1"
    ) | Out-Null

    Start-Sleep -Seconds 2
} else {
    Write-Host 'MySQL already running on 3306.' -ForegroundColor Green
}

if (-not (Test-Path $backendDir)) {
    throw "Backend directory not found: $backendDir"
}

Write-Host 'Starting backend server (5000)...' -ForegroundColor Yellow
Start-Process -FilePath 'powershell.exe' -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$backendDir'; npm start"
) | Out-Null

if (-not (Test-PortListening -Port 5500)) {
    Write-Host 'Starting frontend static server (5500)...' -ForegroundColor Yellow
    $frontendCommand = @"
Set-Location '$projectRoot'
node -e "const http=require('http'); const fs=require('fs'); const path=require('path'); const root=process.cwd(); const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'}; http.createServer((req,res)=>{ let urlPath=decodeURIComponent((req.url||'/').split('?')[0]); if(urlPath==='/'||urlPath==='') urlPath='/home.html'; const filePath=path.join(root,urlPath); fs.stat(filePath,(err,stat)=>{ if(err||!stat.isFile()){ res.writeHead(404); res.end('Not found'); return; } const ext=path.extname(filePath).toLowerCase(); res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream'}); fs.createReadStream(filePath).pipe(res); }); }).listen(5500,'127.0.0.1',()=>console.log('Frontend server running on http://127.0.0.1:5500/home.html'));"
"@

    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoExit',
        '-Command',
        $frontendCommand
    ) | Out-Null
} else {
    Write-Host 'Port 5500 already in use. Frontend may already be running.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Startup commands launched.' -ForegroundColor Green
Write-Host 'Open: http://127.0.0.1:5500/home.html' -ForegroundColor Cyan
Write-Host 'Open: http://127.0.0.1:5500/admin.html' -ForegroundColor Cyan
