#!/bin/bash
TASKS_DIR="$HOME/dev_projects/test_openclawcolab/tasks"
COMPLETED_DIR="$HOME/dev_projects/test_openclawcolab/completed"
LOG_FILE="$HOME/dev_projects/test_openclawcolab/daemon.log"

mkdir -p "$TASKS_DIR" "$COMPLETED_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

execute_task() {
    local task_file="$1"
    local filename=$(basename "$task_file")
    local agent=$(grep "^AGENT:" "$task_file" | cut -d: -f2 | tr -d ' ')
    local prompt=$(sed -n '/^PROMPT:/,$ p' "$task_file" | tail -n +2)

    log "Executing: $filename with $agent"

    case "$agent" in
        CLAUDE)
            echo "$prompt" | claude -p --dangerously-skip-permissions
            ;;
        QWEN)
            echo "$prompt" | qwen -y
            ;;
        GEMINI)
            echo "$prompt" | gemini -y
            ;;
        *)
            log "Unknown agent: $agent"
            return 1
            ;;
    esac

    mv "$task_file" "$COMPLETED_DIR/"
    log "Completed: $filename"
}

log "=== Mini-Daemon Started ==="
log "Watching: $TASKS_DIR"

while true; do
    for task_file in "$TASKS_DIR"/*.task; do
        [ -e "$task_file" ] || continue
        execute_task "$task_file"
    done
    sleep 5
done
