#!/bin/bash
cd "$(dirname "$0")/server"
AGENT=CLAUDE node chat.js
