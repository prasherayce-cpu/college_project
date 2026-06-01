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
npx --yes http-server . -p 5500 -a 127.0.0.1 -c-1
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
