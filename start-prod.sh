#!/bin/bash

echo "🚀 Starting Budget Invest Production Server..."
echo "📍 Server will be available at: https://budget-invest.fly.dev"
echo "📧 Email verification URLs will use: https://budget-invest.fly.dev"
echo ""

# Start the server with production config
go run . --conf-path conf/ezbookkeeping.ini server run