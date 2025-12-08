#!/bin/bash

export PATH="$HOME/.local/nodejs/bin:$PATH"
cd /Users/a1/Downloads/001/lhi-calculator

echo "🎨 Starting LHI Calculator Frontend..."
echo "📍 Frontend: http://localhost:3001"
echo "📍 Admin Portal: http://localhost:3001/admin"
echo ""

npm run dev
