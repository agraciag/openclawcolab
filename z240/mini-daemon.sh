#!/bin/bash
# Mini-Daemon for OpenClawColab - z240
# Reads tasks from tasks/ folder and executes with appropriate CLI

TASKS_DIR="$HOME/dev_projects/test_openclawcolab/tasks"
COMPLETED_DIR="$HOME/dev_projects/test_openclawcolab/completed"
LOG_FILE="$HOME/dev_projects/test_openclawcolab/daemon.log"

# Create directories if not exist
mkdir -p "$TASKS_DIR" "$COMPLETED_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

execute_task() {
    local task_file="$1"
    local filename=$(basename "$task_file")

    # Read task content
    local agent=$(grep "^AGENT:" "$task_file" | cut -d: -f2 | tr -d ' ')
    local prompt=$(grep -A 1000 "^PROMPT:" "$task_file" | tail -n +2)

    log "Executing task: $filename with $agent"

    case "$agent" in
        CLAUDE)
            claude -p "$prompt" --dangerously-skip-permissions 2>&1 | tee -a "$LOG_FILE"
            ;;
        QWEN)
            qwen "$prompt" -y 2>&1 | tee -a "$LOG_FILE"
            ;;
        GEMINI)
            gemini "$prompt" -y 2>&1 | tee -a "$LOG_FILE"
            ;;
        *)
            log "Unknown agent: $agent"
            return 1
            ;;
    esac

    # Move to completed
    mv "$task_file" "$COMPLETED_DIR/"
    log "Task completed: $filename"
}

# Main loop
log "=== Mini-Daemon Started ==="
log "Watching: $TASKS_DIR"
log "Press Ctrl+C to stop"

while true; do
    # Find task files
    for task_file in "$TASKS_DIR"/*.task 2>/dev/null; do
        [ -e "$task_file" ] || continue
        execute_task "$task_file"
    done

    # Wait before checking again
    sleep 5
done
