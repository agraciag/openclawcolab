#!/bin/bash
cd "$(dirname "$0")/server"
AGENT=GEMINI node chat.js
