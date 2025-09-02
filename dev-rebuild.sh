#!/bin/bash

# Budget Invest - Development Environment Rebuild Script
set -e

echo "🔨 Rebuilding Budget Invest Development Environment..."

# Stop services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.dev.yml down

# Remove old images (optional - saves space but increases build time)
read -p "🗑️  Remove old Docker images to save space? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning up old Docker images..."
    docker-compose -f docker-compose.dev.yml down --rmi all
    docker system prune -f
fi

# Rebuild and start
echo "🔨 Rebuilding and starting services..."
docker-compose -f docker-compose.dev.yml up -d --build --force-recreate

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Check health
echo "🩺 Checking service health..."
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ Rebuild complete! Services are running."
else
    echo "❌ Some services failed to start. Check logs with: ./dev-logs.sh"
    exit 1
fi

echo ""
echo "🎉 Budget Invest has been rebuilt and is ready!"
echo "🌐 Access at: http://localhost:3000"