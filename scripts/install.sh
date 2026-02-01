#!/bin/bash
# Install OpenClawColab

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              OPENCLAWCOLAB INSTALLER                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

cd "$(dirname "$0")/.."

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 20+"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required. Found: $(node -v)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env from example..."
  cp .env.example .env
  echo "⚠️  Please edit .env with your configuration"
fi

# Create directories
echo "📁 Creating directories..."
mkdir -p logs inbox/claude inbox/qwen inbox/gemini inbox/chatgpt inbox/glm
mkdir -p outbox code_review

# Make scripts executable
chmod +x scripts/*.sh

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Telegram bot token"
echo "  2. Run: ./scripts/start-daemon.sh"
echo ""
