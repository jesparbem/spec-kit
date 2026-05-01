#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🏭 Starting Software Factory..."

# Backend
echo "▶ Starting backend on :8000..."
cd "$ROOT/backend"
if [ ! -f ".env" ]; then
  echo "⚠  No .env found. Create web-factory/backend/.env with:"
  echo "   ANTHROPIC_API_KEY=sk-ant-..."
fi
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
echo "▶ Starting frontend on :3000..."
cd "$ROOT/frontend"
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Software Factory running:"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8000"
echo "   API docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
