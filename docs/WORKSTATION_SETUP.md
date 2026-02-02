# HP Workstation Setup Guide - OpenClawColab

## Requisitos Mínimos

- **OS:** Ubuntu 22.04+ / Windows 11 WSL2 / macOS
- **RAM:** 16GB+ (32GB recomendado)
- **Storage:** 50GB+ libre
- **Node.js:** 20+
- **Docker:** Para PostgreSQL

## Paso 1: Dependencias Base

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y git curl build-essential

# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## Paso 2: Clonar Repos

```bash
mkdir -p ~/dev_projects
cd ~/dev_projects

# OpenClawColab (coordinación)
git clone https://github.com/agraciag/openclawcolab.git multi_llm_collab

# Sports Manager (proyecto objetivo)
git clone https://github.com/agraciag/sports_manager_feb_2026.git
# O crear nuevo si no existe aún
```

## Paso 3: Instalar OpenClawColab

```bash
cd ~/dev_projects/multi_llm_collab
./scripts/install.sh
```

## Paso 4: Configurar .env

```bash
cp .env.example .env
nano .env
```

```env
# Telegram Bot (crear en @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id

# Rutas
PROJECT_ROOT=/home/user/dev_projects/sports_manager_feb_2026

# CLIs
CLAUDE_CLI=claude
QWEN_CLI=qwen
GEMINI_CLI=gemini
GLM_CLI=glm

# Seguridad (solo para máquina dedicada)
SKIP_PERMISSIONS=true
```

## Paso 5: Instalar LLM CLIs

### Claude Code
```bash
npm install -g @anthropic-ai/claude-code
claude auth
```

### Gemini CLI
```bash
# Según documentación de Google
npm install -g gemini-cli
gemini auth
```

### Qwen CLI
```bash
# Según documentación de Alibaba
pip install qwen-cli
qwen auth
```

### Aider (para ChatGPT)
```bash
pip install aider-chat
export OPENAI_API_KEY=your_key
```

## Paso 6: Base de Datos

```bash
docker run -d \
  --name sports_manager_db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sports_manager \
  -p 5432:5432 \
  postgres:15
```

## Paso 7: Configurar Sports Manager

```bash
cd ~/dev_projects/sports_manager_feb_2026

# Backend
cd backend
npm install
cp .env.example .env
# Editar .env con DATABASE_URL
npx prisma migrate dev
node prisma/seed.js
npm start &

# Frontend
cd ../frontend
npm install
npm run dev &
```

## Paso 8: Iniciar OpenClawColab Daemon

```bash
cd ~/dev_projects/multi_llm_collab
./scripts/start-daemon.sh
```

## Paso 9: Verificar

```bash
# Ver logs
tail -f logs/daemon.log

# O desde Telegram
/status
```

## Comandos Telegram

| Comando | Descripción |
|---------|-------------|
| `/status` | Ver estado del daemon |
| `/tasks` | Ver tareas pendientes |
| `/assign QWEN TASK-018` | Asignar tarea |
| `/pause` | Pausar ejecución |
| `/resume` | Reanudar ejecución |

## Estructura Final

```
~/dev_projects/
├── multi_llm_collab/        # OpenClawColab daemon
│   ├── daemon/              # Código del daemon
│   ├── inbox/               # Mensajes para agentes
│   ├── outbox/              # Entregas de agentes
│   └── tasks/               # Backlog
│
└── sports_manager_feb_2026/ # Proyecto objetivo
    ├── backend/
    └── frontend/
```

## Troubleshooting

### "Permission denied" en CLIs
```bash
# Asegurar que el daemon tiene permisos
chmod +x ~/.local/bin/*
```

### Puerto 3333 en uso
```bash
fuser -k 3333/tcp
```

### Telegram no responde
- Verificar TELEGRAM_BOT_TOKEN
- Verificar TELEGRAM_CHAT_ID (enviar mensaje al bot primero)

---

*Documentación creada el 2026-02-02*
