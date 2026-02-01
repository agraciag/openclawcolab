#!/bin/bash
# Stop OpenClawColab Daemon

echo "Stopping OpenClawColab Daemon..."
pkill -f "node daemon/index.js" || echo "Daemon not running"
echo "Done"
