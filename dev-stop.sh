#!/bin/bash

# Budget Invest - Development Environment Stop Script
set -e

echo "🛑 Stopping Budget Invest Development Environment..."

# Stop all services
docker-compose -f docker-compose.dev.yml down

echo "✅ All services stopped!"
echo ""
echo "💾 Data is preserved in Docker volumes."
echo "🔄 To start again, run: ./dev-start.sh"
echo ""