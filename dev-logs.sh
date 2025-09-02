#!/bin/bash

# Budget Invest - View Development Logs Script
set -e

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "📋 Available services:"
    docker-compose -f docker-compose.dev.yml ps --format "table {{.Service}}\t{{.Status}}"
    echo ""
    echo "📖 Usage:"
    echo "   View all logs: ./dev-logs.sh"
    echo "   View specific service: ./dev-logs.sh [app|postgres|redis]"
    echo ""
    echo "📄 Showing all logs (press Ctrl+C to exit):"
    docker-compose -f docker-compose.dev.yml logs -f
else
    echo "📄 Showing logs for $SERVICE (press Ctrl+C to exit):"
    docker-compose -f docker-compose.dev.yml logs -f "$SERVICE"
fi