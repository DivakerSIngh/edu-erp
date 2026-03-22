# EduERP Service Agent

An automated agent to manage all EduERP services (Database, Redis, Backend API, and Frontend).

## Quick Start

```powershell
# Start all services
.\run-agent.ps1 start

# Check status
.\run-agent.ps1 status

# Stop all services
.\run-agent.ps1 stop
```

## Features

- 🚀 **One-command startup** - Start all services with a single command
- 📊 **Status monitoring** - Check health and status of all services
- 📝 **Log management** - View logs from any service
- 🔄 **Service control** - Start, stop, or restart individual services
- 💻 **Development mode** - Run only dependencies for local development
- 🧹 **Clean environment** - Remove all containers and volumes

## Prerequisites

- Docker Desktop installed and running
- PowerShell (Windows)

## Commands

### Start Services

```powershell
# Start all services (database, Redis, API, frontend)
.\run-agent.ps1 start

# Start a specific service
.\run-agent.ps1 start api
.\run-agent.ps1 start frontend
.\run-agent.ps1 start sqlserver
.\run-agent.ps1 start redis
```

### Stop Services

```powershell
# Stop all services
.\run-agent.ps1 stop

# Stop a specific service
.\run-agent.ps1 stop api
```

### Restart Services

```powershell
# Restart all services
.\run-agent.ps1 restart

# Restart a specific service
.\run-agent.ps1 restart api
```

### Check Status

```powershell
# View status of all services
.\run-agent.ps1 status
```

### View Logs

```powershell
# View logs from all services (live)
.\run-agent.ps1 logs

# View logs from a specific service
.\run-agent.ps1 logs api
.\run-agent.ps1 logs frontend
.\run-agent.ps1 logs sqlserver
```

Press `Ctrl+C` to exit log viewing.

### Development Mode

Start only the database and Redis for local development (run backend and frontend locally):

```powershell
# Start dependencies only
.\run-agent.ps1 dev

# Then in separate terminals:
# Terminal 1 - Backend
cd backend/src/EduERP.API
dotnet run

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Clean Environment

Remove all containers, volumes, and images:

```powershell
.\run-agent.ps1 clean
```

## Service URLs

When services are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **SQL Server**: localhost:1433
  - Username: `sa`
  - Password: `EduERP@Dev2024!`
  - Database: `EduERP`
- **Redis**: localhost:6379

## Common Workflows

### Full Stack Development (Containerized)

```powershell
# 1. Start everything
.\run-agent.ps1 start

# 2. Monitor logs
.\run-agent.ps1 logs

# 3. Check status
.\run-agent.ps1 status

# 4. Stop when done
.\run-agent.ps1 stop
```

### Local Development (API & Frontend Local)

```powershell
# 1. Start only database and Redis
.\run-agent.ps1 dev

# 2. Run backend locally
cd backend/src/EduERP.API
dotnet run

# 3. Run frontend locally (in another terminal)
cd frontend
npm run dev

# 4. Stop dependencies when done
.\run-agent.ps1 stop
```

### Debugging a Specific Service

```powershell
# 1. Restart the problematic service
.\run-agent.ps1 restart api

# 2. View its logs
.\run-agent.ps1 logs api

# 3. Check status
.\run-agent.ps1 status
```

### Fresh Start

```powershell
# 1. Clean everything
.\run-agent.ps1 clean

# 2. Start fresh
.\run-agent.ps1 start
```

## Troubleshooting

### Docker is not running

```
Error: Docker is not running!
```

**Solution**: Start Docker Desktop and wait for it to fully initialize.

### Port already in use

```
Error: Port 3000 is already allocated
```

**Solution**: Stop the conflicting service or change the port in `docker-compose.yml`.

### Service unhealthy

```powershell
# View service logs
.\run-agent.ps1 logs <service-name>

# Restart the service
.\run-agent.ps1 restart <service-name>
```

### Database connection issues

```powershell
# Check if SQL Server is healthy
.\run-agent.ps1 status

# View database logs
.\run-agent.ps1 logs sqlserver

# Restart database
.\run-agent.ps1 restart sqlserver
```

## Advanced Usage

### Running in Background

Services automatically run in detached mode (background). Use `logs` command to view output.

### Viewing Resource Usage

```powershell
docker stats
```

### Accessing SQL Server

```powershell
# Using sqlcmd (if installed)
sqlcmd -S localhost,1433 -U sa -P "EduERP@Dev2024!"

# Or use Azure Data Studio / SQL Server Management Studio
# Server: localhost,1433
# Username: sa
# Password: EduERP@Dev2024!
```

### Accessing Redis CLI

```powershell
docker exec -it eduerp-redis redis-cli
```

## Architecture

The agent manages four main services:

```
┌─────────────────┐
│    Frontend     │  React + Vite + Nginx
│   Port: 3000    │
└────────┬────────┘
         │
┌────────▼────────┐
│   Backend API   │  ASP.NET Core
│   Port: 5000    │
└────┬───────┬────┘
     │       │
┌────▼───┐ ┌▼──────┐
│ Redis  │ │  SQL  │
│  6379  │ │ 1433  │
└────────┘ └───────┘
```

## Environment Variables

All configuration is in `docker-compose.yml`. Key settings:

- Database credentials
- JWT secrets
- Redis connection
- CORS origins
- API ports

⚠️ **Important**: Change default passwords and secrets before deploying to production!

## Help

```powershell
.\run-agent.ps1 help
```

For issues, check the logs:
```powershell
.\run-agent.ps1 logs
```
