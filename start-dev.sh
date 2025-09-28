#!/bin/bash

echo "🚀 Starting Budget Invest Development Server..."
echo "📍 Server will be available at: http://localhost:8080"
echo "📧 Email verification URLs will use: http://localhost:8080"
echo ""

# Start the server with development config
go run . --conf-path conf/ezbookkeeping.dev.ini server run