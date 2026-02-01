#!/bin/bash
cd "$(dirname "$0")/server"
echo "Starting LLM Chat Server..."
node index.js
