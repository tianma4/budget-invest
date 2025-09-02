#!/bin/bash

# Budget Invest - Development Shell Access Script
set -e

SERVICE=${1:-"app"}

echo "🐚 Opening shell in $SERVICE container..."

case $SERVICE in
    "app"|"application")
        docker-compose -f docker-compose.dev.yml exec app sh
        ;;
    "db"|"database"|"postgres")
        echo "🗄️  Connecting to PostgreSQL database..."
        docker-compose -f docker-compose.dev.yml exec postgres psql -U budget_invest -d budget_invest
        ;;
    "redis")
        echo "🔴 Connecting to Redis..."
        docker-compose -f docker-compose.dev.yml exec redis redis-cli
        ;;
    "tools")
        echo "🔧 Starting tools container..."
        docker-compose -f docker-compose.dev.yml --profile tools run --rm tools sh
        ;;
    *)
        echo "❌ Unknown service: $SERVICE"
        echo ""
        echo "📋 Available services:"
        echo "   • app (default) - Main application container"
        echo "   • db - PostgreSQL database"
        echo "   • redis - Redis cache"
        echo "   • tools - Development tools container"
        echo ""
        echo "📖 Usage: ./dev-shell.sh [app|db|redis|tools]"
        exit 1
        ;;
esac