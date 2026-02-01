#!/bin/bash
cd "$(dirname "$0")/server"
AGENT=QWEN node chat.js
