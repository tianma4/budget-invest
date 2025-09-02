#!/bin/bash

# Budget Invest - Development Environment Startup Script
set -e

echo "🚀 Starting Budget Invest Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.dev .env
    echo "⚠️  Please review and customize .env file before production use!"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are healthy
echo "🩺 Checking service health..."
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ Services are running!"
else
    echo "❌ Some services failed to start. Check logs with: ./dev-logs.sh"
    exit 1
fi

echo ""
echo "🎉 Budget Invest Development Environment is ready!"
echo ""
echo "📋 Available services:"
echo "   • Application: http://localhost:3000"
echo "   • Database: localhost:5432 (budget_invest/budget_invest/budget_invest_password)"
echo "   • Redis: localhost:6379"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs: ./dev-logs.sh"
echo "   • Stop services: ./dev-stop.sh"
echo "   • Rebuild: ./dev-rebuild.sh"
echo "   • Shell access: ./dev-shell.sh"
echo ""
echo "📖 First time setup:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Register a new user account"
echo "   3. Start using Budget Invest!"
echo ""