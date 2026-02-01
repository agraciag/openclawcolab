#!/bin/bash
# Start OpenClawColab Daemon

cd "$(dirname "$0")/.."

# Load environment
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "Starting OpenClawColab Daemon..."
node daemon/index.js
