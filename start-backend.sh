#!/bin/bash

export PATH="$HOME/.local/nodejs/bin:$PATH"
cd /Users/a1/Downloads/001/lhi-calculator/server

echo "🚀 Starting LHI Calculator Backend Server..."
echo "📍 Backend API: http://localhost:5001/api"
echo ""

npm run dev
