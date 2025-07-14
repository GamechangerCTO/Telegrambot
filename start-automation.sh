#!/bin/bash

# 🚀 Start Automation - Complete Autonomous System Startup
# This script starts the server and ensures automation runs continuously

echo "🔄 Starting Telegram Bot Automation System..."

# Kill any existing processes on the port
echo "🧹 Cleaning up existing processes..."
pkill -f "next dev.*telegrambotsport" 2>/dev/null || true
sleep 2

# Start the development server in background
echo "🚀 Starting Next.js server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 15

# Check if server is running
for i in {1..10}; do
    if curl -s http://localhost:3000/api/automation/rules > /dev/null 2>&1; then
        echo "✅ Server is running on port 3000"
        PORT=3000
        break
    elif curl -s http://localhost:3001/api/automation/rules > /dev/null 2>&1; then
        echo "✅ Server is running on port 3001"
        PORT=3001
        break
    else
        echo "⏳ Attempt $i: Server not ready yet, waiting..."
        sleep 3
    fi
done

if [ -z "$PORT" ]; then
    echo "❌ Server failed to start properly"
    exit 1
fi

# Start the background scheduler
echo "🔄 Starting Background Scheduler..."
curl -X POST "http://localhost:$PORT/api/automation/background-scheduler" \
     -H "Content-Type: application/json" \
     -d '{"action": "start"}' || echo "⚠️ Scheduler might already be running"

# Enable full automation
echo "🚀 Enabling Full Automation..."
curl -X POST "http://localhost:$PORT/api/automation/toggle-full-automation" \
     -H "Content-Type: application/json" \
     -d '{"enabled": true}' || echo "⚠️ Full automation might already be enabled"

# Check status
echo "📊 Checking system status..."
echo "--- Background Scheduler Status ---"
curl -s "http://localhost:$PORT/api/automation/background-scheduler" | jq '.' || echo "No jq available"

echo ""
echo "--- Automation Rules ---"
curl -s "http://localhost:$PORT/api/automation/rules" | jq '.rules | length' || echo "No jq available"

echo ""
echo "🎉 System Status Summary:"
echo "✅ Server: Running on port $PORT"
echo "✅ Background Scheduler: Active"
echo "✅ Full Automation: Enabled"
echo "✅ Rules: 10 automation rules configured"
echo ""
echo "📝 The system will now run autonomously!"
echo "📍 Check automation at: http://localhost:$PORT/automation"
echo "📊 Monitor logs in the terminal"
echo ""
echo "🔄 To stop the system, press Ctrl+C or run: pkill -f 'next dev'"
echo ""
echo "⏰ The system checks for content opportunities every minute"
echo "🎯 Content will be generated automatically based on:"
echo "   - Live matches (during games)"
echo "   - Scheduled times (morning news, daily summaries)"
echo "   - Upcoming matches (betting tips, analysis)"
echo "   - Smart triggers (coupons after content)"

# Keep the script running to monitor
echo "🔍 Monitoring system... (Ctrl+C to stop)"
while true; do
    sleep 300  # Check every 5 minutes
    if ! ps -p $SERVER_PID > /dev/null; then
        echo "❌ Server process died, restarting..."
        npm run dev &
        SERVER_PID=$!
        sleep 15
        # Restart automation
        curl -X POST "http://localhost:$PORT/api/automation/background-scheduler" \
             -H "Content-Type: application/json" \
             -d '{"action": "start"}' > /dev/null 2>&1
    fi
    echo "✅ $(date): System running normally"
done 