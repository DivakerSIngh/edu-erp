param(
    [Parameter(Position=0)]
    [ValidateSet('start','stop','restart','status','logs','clean','dev','help')]
    [string]$Command = 'help',
    [Parameter(Position=1)]
    [ValidateSet('all','sqlserver','redis','api','frontend')]
    [string]$Service = 'all'
)

$ProjectRoot = $PSScriptRoot
$ComposeFile = Join-Path $ProjectRoot "docker-compose.yml"

function Write-OK    { param($m) Write-Host "[OK]   $m" -ForegroundColor Green }
function Write-Info  { param($m) Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn  { param($m) Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Fail  { param($m) Write-Host "[FAIL] $m" -ForegroundColor Red }
function Write-Title { param($m) Write-Host "" ; Write-Host "=== $m ===" -ForegroundColor Magenta }

function Test-DockerRunning {
    $null = docker info 2>&1
    return ($LASTEXITCODE -eq 0)
}

function Get-ServiceStatus {
    Write-Title "Service Status"
    docker compose -f $ComposeFile ps
    Write-Host ""
    Write-Info "URLs:"
    Write-Host "  Frontend  : http://localhost:3000"
    Write-Host "  API       : http://localhost:5000"
    Write-Host "  SQL Server: localhost:1433  (sa / EduERP@Dev2024!)"
    Write-Host "  Redis     : localhost:6379"
}

function Start-AllServices {
    Write-Title "Starting All Services"
    if (-not (Test-DockerRunning)) { Write-Fail "Docker is not running!"; return }
    Write-Info "Building and starting containers (first run may take a few minutes)..."
    docker compose -f $ComposeFile up -d --build
    if ($LASTEXITCODE -eq 0) { Write-OK "All services started!"; Start-Sleep 3; Get-ServiceStatus }
    else { Write-Fail "Failed. Run: .\run-agent.ps1 logs" }
}

function Start-SingleService {
    param([string]$Svc)
    Write-Title "Starting $Svc"
    if (-not (Test-DockerRunning)) { Write-Fail "Docker is not running!"; return }
    docker compose -f $ComposeFile up -d $Svc
    if ($LASTEXITCODE -eq 0) { Write-OK "$Svc started!"; docker compose -f $ComposeFile ps $Svc }
    else { Write-Fail "Failed to start $Svc" }
}

function Stop-AllServices {
    Write-Title "Stopping All Services"
    docker compose -f $ComposeFile down
    if ($LASTEXITCODE -eq 0) { Write-OK "Stopped." } else { Write-Fail "Stop failed." }
}

function Stop-SingleService {
    param([string]$Svc)
    Write-Title "Stopping $Svc"
    docker compose -f $ComposeFile stop $Svc
    if ($LASTEXITCODE -eq 0) { Write-OK "$Svc stopped." } else { Write-Fail "Stop failed." }
}

function Restart-Services {
    param([string]$Svc = 'all')
    if ($Svc -eq 'all') { Write-Title "Restarting All"; docker compose -f $ComposeFile restart }
    else { Write-Title "Restarting $Svc"; docker compose -f $ComposeFile restart $Svc }
    if ($LASTEXITCODE -eq 0) { Write-OK "Done!"; Start-Sleep 2; Get-ServiceStatus }
    else { Write-Fail "Restart failed." }
}

function Show-Logs {
    param([string]$Svc = 'all')
    if ($Svc -eq 'all') { Write-Title "All Logs (Ctrl+C to stop)"; docker compose -f $ComposeFile logs -f }
    else { Write-Title "$Svc Logs (Ctrl+C to stop)"; docker compose -f $ComposeFile logs -f $Svc }
}

function Clean-Environment {
    Write-Title "Clean Environment"
    Write-Warn "This removes ALL containers, volumes, and images!"
    $confirm = Read-Host "Type yes to confirm"
    if ($confirm -eq 'yes') { docker compose -f $ComposeFile down -v --remove-orphans --rmi all; Write-OK "Done." }
    else { Write-Info "Cancelled." }
}

function Start-DevMode {
    Write-Title "Dev Mode - DB + Redis"
    if (-not (Test-DockerRunning)) { Write-Fail "Docker is not running!"; return }
    docker compose -f $ComposeFile up -d sqlserver redis
    if ($LASTEXITCODE -ne 0) { Write-Fail "Failed to start dependencies."; return }
    Write-OK "DB and Redis started. Waiting for SQL Server (~15s)..."
    Start-Sleep 15
    Write-OK "Ready! Run these in separate terminals:"
    Write-Host "  Backend : cd backend/src/EduERP.API ; dotnet run"
    Write-Host "  Frontend: cd frontend ; npm run dev"
    Write-Host ""
    Write-Info "DB    -> localhost:1433 (sa / EduERP@Dev2024!)"
    Write-Info "Cache -> localhost:6379"
}

function Show-Help {
    Write-Title "EduERP Service Agent"
    Write-Host "USAGE:  .\run-agent.ps1 <command> [service]"
    Write-Host ""
    Write-Host "COMMANDS:"
    Write-Host "  start   [service]  Start all or one service"
    Write-Host "  stop    [service]  Stop all or one service"
    Write-Host "  restart [service]  Restart services"
    Write-Host "  status             Show health and URLs"
    Write-Host "  logs    [service]  Stream logs (Ctrl+C to exit)"
    Write-Host "  dev                Start DB+Redis for local dev"
    Write-Host "  clean              Remove containers/volumes/images"
    Write-Host "  help               Show this help"
    Write-Host ""
    Write-Host "SERVICES:  all  sqlserver  redis  api  frontend"
    Write-Host ""
    Write-Host "EXAMPLES:"
    Write-Host "  .\run-agent.ps1 start"
    Write-Host "  .\run-agent.ps1 start api"
    Write-Host "  .\run-agent.ps1 logs api"
    Write-Host "  .\run-agent.ps1 dev"
    Write-Host "  .\run-agent.ps1 status"
}

# --- Prerequisites ---
$null = docker compose version 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "[FAIL] Docker Compose not found. Install Docker Desktop." -ForegroundColor Red; exit 1 }

# --- Dispatch ---
switch ($Command) {
    'start'   { if ($Service -eq 'all') { Start-AllServices } else { Start-SingleService -Svc $Service } }
    'stop'    { if ($Service -eq 'all') { Stop-AllServices  } else { Stop-SingleService  -Svc $Service } }
    'restart' { Restart-Services -Svc $Service }
    'status'  { Get-ServiceStatus }
    'logs'    { Show-Logs -Svc $Service }
    'clean'   { Clean-Environment }
    'dev'     { Start-DevMode }
    'help'    { Show-Help }
}
