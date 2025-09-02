# Budget Invest - Local Development with Docker

This guide helps you set up a local development environment for Budget Invest using Docker and Docker Compose.

## Prerequisites

- **Docker Desktop** (4.0+) - [Download here](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (2.0+) - Usually included with Docker Desktop
- **Git** - For cloning the repository

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/tianma4/budget-invest.git
   cd budget-invest
   ```

2. **Start the development environment**:
   ```bash
   ./dev-start.sh
   ```

3. **Access the application**:
   - Open http://localhost:3000 in your browser
   - Register a new user account
   - Start using Budget Invest!

## Available Commands

| Command | Description |
|---------|-------------|
| `./dev-start.sh` | Start all development services |
| `./dev-stop.sh` | Stop all services |
| `./dev-logs.sh` | View logs from all services |
| `./dev-logs.sh app` | View logs from specific service |
| `./dev-shell.sh` | Open shell in app container |
| `./dev-shell.sh db` | Connect to PostgreSQL database |
| `./dev-shell.sh redis` | Connect to Redis |
| `./dev-rebuild.sh` | Rebuild and restart everything |

## Services

The development environment includes:

### Main Application (`app`)
- **URL**: http://localhost:3000
- **Container**: budget-invest-app
- **Description**: The main Budget Invest application

### PostgreSQL Database (`postgres`)
- **Host**: localhost:5432
- **Database**: budget_invest
- **Username**: budget_invest
- **Password**: budget_invest_password
- **Container**: budget-invest-db

### Redis Cache (`redis`)
- **Host**: localhost:6379
- **Container**: budget-invest-redis
- **Description**: Used for session caching and temporary data

## Configuration

### Environment Variables
The development environment uses `.env.dev` as a template. On first run, it's copied to `.env` where you can customize settings.

Key configuration options:
```bash
# Application
EZBOOKKEEPING_MODE=development
EZBOOKKEEPING_LOG_LEVEL=debug
EZBOOKKEEPING_PORT=8080

# Database
EZBOOKKEEPING_DB_TYPE=postgres
EZBOOKKEEPING_DB_HOST=postgres
EZBOOKKEEPING_DB_NAME=budget_invest

# Features
EZBOOKKEEPING_ENABLE_USER_REGISTER=true
```

### Data Persistence
- **Database data**: Stored in Docker volume `budget-invest_postgres_data`
- **Application data**: Stored in `./data` directory
- **Logs**: Stored in `./logs` directory
- **Redis data**: Stored in Docker volume `budget-invest_redis_data`

## Development Workflow

### Making Changes
1. **Code changes**: Edit source code files normally
2. **Rebuild**: Run `./dev-rebuild.sh` to apply changes
3. **View logs**: Use `./dev-logs.sh` to check for errors

### Database Management
```bash
# Connect to database
./dev-shell.sh db

# View tables
\dt

# Reset development data
./dev-stop.sh
docker volume rm budget-invest_postgres_data budget-invest_redis_data
./dev-start.sh
```

### Debugging
```bash
# View all logs
./dev-logs.sh

# View specific service logs
./dev-logs.sh app
./dev-logs.sh postgres
./dev-logs.sh redis

# Interactive shell access
./dev-shell.sh app    # Application container
./dev-shell.sh db     # Database
./dev-shell.sh redis  # Redis
```

## Features Available in Development

- ✅ **User Registration**: Create new accounts without email verification
- ✅ **Password Reset**: Basic password reset functionality
- ✅ **Investment Tracking**: Full portfolio management
- ✅ **Multi-currency Support**: USD, EUR, GBP, JPY, CAD
- ✅ **Data Import/Export**: CSV and other format support
- ✅ **API Access**: Full REST API available at `/api/v1/`

## Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker info

# Check for port conflicts
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Clean rebuild
./dev-rebuild.sh
```

### Database connection issues
```bash
# Reset database
./dev-stop.sh
docker volume rm budget-invest_postgres_data
./dev-start.sh
```

### Application errors
```bash
# Check application logs
./dev-logs.sh app

# Access application shell
./dev-shell.sh app
```

### "Permission denied" on scripts
```bash
chmod +x dev-*.sh
```

## Production Deployment

This development setup is NOT suitable for production. For production:

1. Use the main `Dockerfile` (not `Dockerfile.dev`)
2. Set proper environment variables
3. Use external database and Redis services
4. Enable HTTPS/TLS
5. Set strong passwords and secrets

## Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the main README.md
- **Logs**: Always check `./dev-logs.sh` first when troubleshooting