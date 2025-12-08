#!/bin/bash

echo "🚀 Starting LHI Calculator Application..."

# Check if server dependencies are installed
if [ ! -d "server/node_modules" ]; then
  echo "📦 Installing server dependencies..."
  cd server && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

# Initialize database if not exists
if [ ! -f "server/dev.db" ]; then
  echo "🗄️  Initializing database..."
  cd server
  npx prisma generate
  npx prisma migrate dev --name init
  npm run seed
  cd ..
fi

# Start backend server in background
echo "🔧 Starting backend server on http://localhost:5000..."
cd server && npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start frontend
echo "🎨 Starting frontend on http://localhost:3000..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Application started successfully!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Admin Portal: http://localhost:3000/admin"
echo "📍 Backend API: http://localhost:5000/api"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   Email: admin@lhi.local"
echo "   Password: admin123456"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for Ctrl+C
trap "echo '⏹️  Stopping services...'; kill $SERVER_PID $FRONTEND_PID; exit" INT
wait
