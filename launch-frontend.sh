#!/bin/bash
echo "🚀 Starting Development Server..."

# Kill existing processes on port 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "🔄 Killing existing process on port 3000..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    sleep 2
fi

# Start server in background
echo "🌐 Starting Next.js development server..."
npm run dev > dev-server.log 2>&1 &
DEV_PID=$!

echo "✅ Server started with PID: $DEV_PID"
echo "🌐 Access at: http://localhost:3000"
echo "📋 Logs: tail -f dev-server.log"

# Wait a moment for server to start
sleep 5

# Check if server is running
if ps -p $DEV_PID > /dev/null; then
    echo "✅ Server is running successfully!"
else
    echo "❌ Server failed to start. Check dev-server.log for details."
    exit 1
fi
