# OpenClawColab - Multi-LLM Collaboration Hub

Autonomous collaboration system for multiple LLMs working together on software projects. Inspired by [OpenClaw](https://github.com/openclaw/openclaw).

## Features

- Real-time WebSocket chat between LLM agents
- Telegram bot for remote monitoring and control
- Task queue with priority-based assignment
- Claude as Orchestrator - reviews other agents' work
- Auto-branching for safe parallel development
- Daemon for 24/7 autonomous operation

**Full Documentation:** [docs/OPENCLAWCOLAB_ARCHITECTURE.md](docs/OPENCLAWCOLAB_ARCHITECTURE.md)

## Quick Start

```bash
# Clone
git clone https://github.com/agraciag/openclawcolab.git
cd openclawcolab

# Install
./scripts/install.sh

# Configure
cp .env.example .env
# Edit .env with your Telegram bot token

# Run
./scripts/start-daemon.sh
```

## Agents

| Agent | Role | CLI |
|-------|------|-----|
| **Claude** | Architect / Orchestrator | claude-code |
| **Gemini** | Frontend Lead | gemini-cli |
| **Qwen** | Backend Lead | qwen-cli |
| **ChatGPT** | DevOps Lead | aider |
| **GLM** | Testing Lead | kilo-code |

## Estructura de Carpetas

```
multi_llm_collab/
├── README.md           # Este archivo
├── PROTOCOL.md         # Protocolo de comunicación
├── chat/               # Conversación entre agentes
│   └── CHAT_LOG.md     # Log cronológico
├── tasks/              # Sistema de tareas
│   ├── BACKLOG.md      # Lista de tareas pendientes
│   └── [TASK-XXX].md   # Tareas individuales
├── inbox/              # Mensajes entrantes por agente
│   ├── claude/
│   ├── gemini/
│   ├── qwen/
│   └── glm/
├── outbox/             # Mensajes salientes (entregas)
├── specs/              # Especificaciones de features
├── code_review/        # Código para revisar
└── shared/             # Contexto compartido
    └── CONTEXT.md      # Estado actual del proyecto
```

## Cómo Participar

### 1. Al iniciar sesión
```
Lee: /shared/CONTEXT.md (estado actual)
Lee: /chat/CHAT_LOG.md (últimos 50 mensajes)
Lee: /tasks/BACKLOG.md (tareas pendientes)
Lee: /inbox/[tu_nombre]/ (mensajes para ti)
```

### 2. Para comunicarte
```
Escribe en: /chat/CHAT_LOG.md (formato definido en PROTOCOL.md)
```

### 3. Para entregar trabajo
```
Escribe en: /outbox/[descripcion]-[agente]-[timestamp].md
Actualiza: /tasks/[TASK-XXX].md con status=completed
```

### 4. Para pedir revisión
```
Escribe en: /code_review/[archivo]-review-request.md
```

## Telegram Commands

Once the daemon is running with a configured Telegram bot:

- `/status` - View daemon and agent status
- `/tasks` - List pending tasks
- `/assign AGENT TASK-XXX` - Assign task to agent
- `/pause` - Pause autonomous execution
- `/resume` - Resume autonomous execution

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TELEGRAM / HUMAN                          │
│                  (Remote Control & Monitoring)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   OPENCLAWCOLAB DAEMON                       │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ Telegram │ │ WebSocket│ │   Task     │ │    Agent     │  │
│  │   Bot    │ │  Server  │ │   Queue    │ │   Spawner    │  │
│  └──────────┘ └──────────┘ └────────────┘ └──────────────┘  │
│                         │                                    │
│                         ▼                                    │
│              ┌──────────────────────┐                        │
│              │    ORCHESTRATOR      │                        │
│              │  (Claude reviews     │                        │
│              │   all deliveries)    │                        │
│              └──────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌────────────┬────────┼────────┬────────────┐
        ▼            ▼        ▼        ▼            ▼
   ┌────────┐  ┌────────┐ ┌───────┐ ┌───────┐ ┌────────┐
   │ CLAUDE │  │ GEMINI │ │ QWEN  │ │  GLM  │ │CHATGPT │
   └────────┘  └────────┘ └───────┘ └───────┘ └────────┘
```

## License

MIT

## Author

[@agraciag](https://github.com/agraciag)
