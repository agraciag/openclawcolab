# OpenClawColab - Arquitectura Multi-LLM Autónoma

**Versión:** 1.0
**Fecha:** 2026-02-01
**Autor:** Claude (Arquitecto) + Alejandro García

---

## 1. Visión General

OpenClawColab es un sistema de colaboración autónoma entre múltiples LLMs, inspirado en [OpenClaw](https://github.com/openclaw/openclaw), pero diseñado específicamente para desarrollo de software con equipos de agentes especializados.

```
┌─────────────────────────────────────────────────────────────────┐
│                        OPENCLAWCOLAB                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      ┌─────────────┐                           │
│                      │  TELEGRAM   │                           │
│                      │   (Human)   │                           │
│                      └──────┬──────┘                           │
│                             │                                   │
│                      Solo notificaciones                        │
│                      y decisiones críticas                      │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   DAEMON (24/7)                          │  │
│  │  • Telegram Bot (polling)                                │  │
│  │  • WebSocket Server (:3333)                              │  │
│  │  • CLI Spawner                                           │  │
│  │  • Task Queue                                            │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                   │
│              ┌──────────────┼──────────────┐                   │
│              │              │              │                   │
│              ▼              ▼              ▼                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 ORCHESTRATOR (CLAUDE)                    │   │
│  │  • Code Review automático                                │   │
│  │  • Aprobación de cambios                                 │   │
│  │  • Asignación de tareas                                  │   │
│  │  • Resolución de conflictos                              │   │
│  │  • Escalado a Human si necesario                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐              │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌───────────┐       ┌───────────┐       ┌───────────┐        │
│  │   QWEN    │       │  GEMINI   │       │  CHATGPT  │        │
│  │  Backend  │       │ Frontend  │       │  DevOps   │        │
│  │   Lead    │       │   Lead    │       │   Lead    │        │
│  └───────────┘       └───────────┘       └───────────┘        │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌───────────┐       ┌───────────┐       ┌───────────┐        │
│  │    GLM    │       │  OLLAMA   │       │  CURSOR   │        │
│  │  Testing  │       │  Auxiliar │       │    IDE    │        │
│  │   Lead    │       │           │       │           │        │
│  └───────────┘       └───────────┘       └───────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes

### 2.1 Daemon (Servidor Central)

El daemon es el corazón del sistema. Corre 24/7 y gestiona:

| Componente | Puerto | Función |
|------------|--------|---------|
| WebSocket Server | 3333 | Chat entre agentes |
| Telegram Bot | - | Notificaciones + comandos |
| HTTP API | 3334 | Webhooks externos |
| Task Queue | - | Cola de tareas pendientes |

### 2.2 Orchestrator (Claude)

Claude actúa como arquitecto y supervisor:

```
Responsabilidades:
├── Revisar código de otros agentes
├── Aprobar/rechazar cambios
├── Asignar tareas automáticamente
├── Detectar conflictos y resolverlos
├── Escalar a Human decisiones críticas
└── Mantener coherencia del proyecto
```

### 2.3 Agentes de Trabajo

| Agente | CLI | Rol | Modo |
|--------|-----|-----|------|
| CLAUDE | claude-code | Orchestrator | Con permisos |
| QWEN | qwen-cli | Backend Lead | Auto-approve |
| GEMINI | gemini-cli | Frontend Lead | Auto-approve |
| CHATGPT | chatgpt-cli / aider | DevOps Lead | Auto-approve |
| GLM | kilo-code | Testing Lead | Auto-approve |
| OLLAMA | ollama | Auxiliar | Local |

---

## 3. Hardware Recomendado

### 3.1 Workstation HP / NUC

```
Mínimo:
├── CPU: Intel i5/i7 o AMD Ryzen 5/7
├── RAM: 32GB (64GB recomendado)
├── SSD: 500GB NVMe
├── GPU: Opcional (para Ollama local)
└── Red: Ethernet estable

Recomendado para Ollama local:
├── GPU: NVIDIA RTX 3060+ (12GB VRAM)
├── RAM: 64GB
└── SSD: 1TB NVMe
```

### 3.2 Sistema Operativo

```
Recomendado: Ubuntu 22.04 LTS / 24.04 LTS
Alternativa: Windows 11 + WSL2

Razones:
├── Mejor soporte para Docker
├── systemd para daemon
├── Mejor rendimiento de Node.js
└── Compatibilidad con todos los CLIs
```

---

## 4. Instalación

### 4.1 Prerequisitos

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Git
sudo apt install -y git

# Instalar Python (para algunos CLIs)
sudo apt install -y python3 python3-pip

# Instalar pnpm
npm install -g pnpm
```

### 4.2 CLIs de Agentes

```bash
# Claude Code
npm install -g @anthropic-ai/claude-code

# Gemini CLI
npm install -g @anthropic-ai/gemini-cli
# o según documentación oficial de Google

# Qwen CLI
pip install qwen-cli
# o según documentación oficial de Alibaba

# ChatGPT CLI (opciones)
npm install -g chatgpt-cli
# o
pip install aider-chat  # Alternativa popular

# Ollama (para modelos locales)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:32b
ollama pull codellama:13b
```

### 4.3 Clonar OpenClawColab

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/openclawcolab.git
cd openclawcolab

# Instalar dependencias
cd server && npm install && cd ..

# Configurar variables de entorno
cp .env.example .env
nano .env
```

### 4.4 Configuración de .env

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=tu_token_de_botfather
TELEGRAM_CHAT_ID=tu_chat_id

# Puertos
WEBSOCKET_PORT=3333
HTTP_PORT=3334

# Directorios
PROJECT_ROOT=/home/user/projects
WORKSPACE=/home/user/projects/sports_manager_feb_2026

# Agentes (rutas a CLIs)
CLAUDE_CLI=claude
QWEN_CLI=qwen
GEMINI_CLI=gemini
CHATGPT_CLI=aider

# Timeouts (minutos)
TASK_TIMEOUT=30
AGENT_TIMEOUT=60

# Autonomía
AUTO_APPROVE=true
SKIP_PERMISSIONS=true
```

---

## 5. Estructura del Proyecto

```
openclawcolab/
├── daemon/
│   ├── index.js              # Entry point
│   ├── telegram.js           # Telegram bot
│   ├── websocket.js          # WebSocket server
│   ├── spawner.js            # CLI spawner
│   ├── orchestrator.js       # Claude orchestration logic
│   └── queue.js              # Task queue
│
├── agents/
│   ├── CLAUDE.md             # Contexto para Claude
│   ├── QWEN.md               # Contexto para Qwen
│   ├── GEMINI.md             # Contexto para Gemini
│   ├── CHATGPT.md            # Contexto para ChatGPT
│   └── GLM.md                # Contexto para GLM
│
├── chat/
│   └── CHAT_LOG.md           # Log de conversaciones
│
├── tasks/
│   ├── BACKLOG.md            # Lista de tareas
│   └── TASK-XXX.md           # Tareas individuales
│
├── inbox/
│   ├── claude/
│   ├── qwen/
│   ├── gemini/
│   ├── chatgpt/
│   └── glm/
│
├── outbox/                   # Entregas
├── code_review/              # Reviews pendientes
├── shared/
│   └── CONTEXT.md            # Estado del proyecto
│
├── docs/
│   ├── PROTOCOL.md           # Protocolo de comunicación
│   └── ARCHITECTURE.md       # Este documento
│
├── scripts/
│   ├── start-daemon.sh       # Iniciar daemon
│   ├── stop-daemon.sh        # Detener daemon
│   └── health-check.sh       # Verificar estado
│
├── .env                      # Variables de entorno
├── package.json
└── README.md
```

---

## 6. Daemon - Implementación

### 6.1 Entry Point (daemon/index.js)

```javascript
import { WebSocketServer } from './websocket.js';
import { TelegramBot } from './telegram.js';
import { Orchestrator } from './orchestrator.js';
import { TaskQueue } from './queue.js';
import { AgentSpawner } from './spawner.js';

class OpenClawColabDaemon {
  constructor() {
    this.wss = new WebSocketServer(process.env.WEBSOCKET_PORT);
    this.telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    this.queue = new TaskQueue();
    this.spawner = new AgentSpawner();
    this.orchestrator = new Orchestrator(this);
  }

  async start() {
    // Iniciar WebSocket
    await this.wss.start();
    console.log(`WebSocket server on port ${process.env.WEBSOCKET_PORT}`);

    // Iniciar Telegram bot
    await this.telegram.start();
    console.log('Telegram bot connected');

    // Escuchar mensajes del WebSocket
    this.wss.on('message', (msg) => this.handleAgentMessage(msg));

    // Escuchar comandos de Telegram
    this.telegram.on('command', (cmd) => this.handleTelegramCommand(cmd));

    // Procesar cola de tareas
    this.processQueue();

    console.log('OpenClawColab Daemon started');
  }

  async handleAgentMessage(msg) {
    // Cuando un agente envía DELIVERY, ISSUE, etc.
    if (msg.msgType === 'DELIVERY') {
      await this.orchestrator.reviewDelivery(msg);
    } else if (msg.msgType === 'ISSUE' || msg.msgType === 'BLOCKER') {
      await this.orchestrator.handleIssue(msg);
    }
  }

  async handleTelegramCommand(cmd) {
    // Comandos desde Telegram
    switch(cmd.command) {
      case '/status':
        await this.telegram.sendStatus();
        break;
      case '/assign':
        await this.queue.addTask(cmd.args);
        break;
      case '/approve':
        await this.orchestrator.approveManual(cmd.args);
        break;
    }
  }

  async processQueue() {
    while (true) {
      const task = await this.queue.getNext();
      if (task) {
        await this.spawner.runAgent(task.agent, task.prompt);
      }
      await sleep(1000);
    }
  }
}

const daemon = new OpenClawColabDaemon();
daemon.start();
```

### 6.2 Agent Spawner (daemon/spawner.js)

```javascript
import { spawn } from 'child_process';
import path from 'path';

export class AgentSpawner {
  constructor() {
    this.agents = {
      CLAUDE: {
        cmd: process.env.CLAUDE_CLI,
        args: ['--dangerously-skip-permissions'],
        cwd: process.env.WORKSPACE
      },
      QWEN: {
        cmd: process.env.QWEN_CLI,
        args: ['--auto-approve'],
        cwd: process.env.WORKSPACE
      },
      GEMINI: {
        cmd: process.env.GEMINI_CLI,
        args: ['--auto-approve'],
        cwd: process.env.WORKSPACE
      },
      CHATGPT: {
        cmd: process.env.CHATGPT_CLI,
        args: ['--yes'],
        cwd: process.env.WORKSPACE
      }
    };
  }

  async runAgent(agentName, prompt) {
    const agent = this.agents[agentName];
    if (!agent) throw new Error(`Unknown agent: ${agentName}`);

    return new Promise((resolve, reject) => {
      const fullPrompt = `
        Lee tu archivo de contexto: ${agentName}.md
        Luego ejecuta: ${prompt}
        Cuando termines, envía DELIVERY al chat.
        Si hay problemas, envía ISSUE al chat.
      `;

      const proc = spawn(agent.cmd, [...agent.args, '-p', fullPrompt], {
        cwd: agent.cwd,
        env: { ...process.env, AGENT_NAME: agentName }
      });

      let output = '';
      proc.stdout.on('data', (data) => output += data);
      proc.stderr.on('data', (data) => output += data);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          reject({ success: false, code, output });
        }
      });

      // Timeout
      setTimeout(() => {
        proc.kill();
        reject({ success: false, error: 'Timeout' });
      }, process.env.TASK_TIMEOUT * 60 * 1000);
    });
  }
}
```

### 6.3 Orchestrator (daemon/orchestrator.js)

```javascript
export class Orchestrator {
  constructor(daemon) {
    this.daemon = daemon;
  }

  async reviewDelivery(msg) {
    // Claude revisa la entrega
    const review = await this.runClaudeReview(msg);

    if (review.approved) {
      // Aprobar y continuar
      await this.daemon.telegram.notify(
        `✅ ${msg.agent} completó ${msg.task}\n${review.summary}`
      );

      // Trigger siguiente tarea
      const nextTask = await this.getNextTask(msg.agent);
      if (nextTask) {
        await this.daemon.queue.addTask(nextTask);
      }
    } else {
      // Rechazar y pedir corrección
      await this.daemon.wss.sendTo(msg.agent, {
        type: 'REVIEW',
        status: 'changes_requested',
        comments: review.comments
      });
    }
  }

  async runClaudeReview(msg) {
    // Usar Claude para revisar código
    const prompt = `
      Revisa esta entrega de ${msg.agent}:
      ${msg.content}

      Verifica:
      1. Código funcional
      2. Sin errores obvios
      3. Sigue convenciones del proyecto
      4. No introduce vulnerabilidades

      Responde JSON: { approved: bool, summary: string, comments: string[] }
    `;

    const result = await this.daemon.spawner.runAgent('CLAUDE', prompt);
    return JSON.parse(result.output);
  }

  async handleIssue(msg) {
    // Notificar al human de problemas
    await this.daemon.telegram.notify(
      `⚠️ ISSUE de ${msg.agent}:\n${msg.content}`,
      { urgent: true }
    );
  }
}
```

---

## 7. Comandos de Telegram

| Comando | Descripción |
|---------|-------------|
| `/status` | Ver estado actual del proyecto |
| `/tasks` | Listar tareas pendientes |
| `/assign <agent> <task>` | Asignar tarea a un agente |
| `/approve <task_id>` | Aprobar manualmente una entrega |
| `/reject <task_id> <reason>` | Rechazar una entrega |
| `/pause` | Pausar el daemon |
| `/resume` | Reanudar el daemon |
| `/logs [agent]` | Ver logs recientes |

---

## 8. Flujo de Trabajo Autónomo

### 8.1 Ciclo Normal

```
1. Human define tareas en BACKLOG.md
         ↓
2. Daemon detecta tareas pendientes
         ↓
3. Daemon asigna a agente según rol
         ↓
4. Agente trabaja (modo auto-approve)
         ↓
5. Agente envía DELIVERY al chat
         ↓
6. Claude (Orchestrator) revisa
         ↓
7. Si OK → Commit + Siguiente tarea
   Si NO → Pedir corrección
         ↓
8. Telegram recibe resumen
```

### 8.2 Manejo de Errores

```
Agente encuentra problema
         ↓
Envía ISSUE/BLOCKER al chat
         ↓
Orchestrator intenta resolver
         ↓
Si puede → Resuelve + Continúa
Si no    → Escala a Telegram
         ↓
Human decide
         ↓
Daemon continúa
```

---

## 9. Seguridad

### 9.1 Aislamiento

```bash
# El workspace está aislado
/home/user/projects/
├── sports_manager_feb_2026/  # Proyecto actual
└── .git/                     # Control de versiones

# Los agentes SOLO pueden modificar el workspace
# No pueden acceder a:
# - /etc, /usr, /var (sistema)
# - ~/.ssh, ~/.aws (credenciales)
# - Otros proyectos
```

### 9.2 Git como Safety Net

```bash
# Cada agente trabaja en su rama
git checkout -b agent/qwen/task-012

# Commits automáticos antes de cambios
git add -A && git commit -m "Checkpoint before QWEN changes"

# Si algo sale mal
git reset --hard HEAD~1

# Merge solo después de review
git checkout main && git merge agent/qwen/task-012
```

### 9.3 Reglas de los Agentes

```markdown
# En cada AGENT.md:

## Restricciones
- NUNCA modificar archivos fuera del workspace
- NUNCA ejecutar rm -rf o comandos destructivos
- NUNCA commitear secrets o credenciales
- NUNCA modificar configuración del sistema
- SIEMPRE trabajar en rama separada
- SIEMPRE enviar DELIVERY o ISSUE al terminar
```

---

## 10. Monitoreo

### 10.1 Health Check

```bash
#!/bin/bash
# scripts/health-check.sh

# Verificar daemon
curl -s http://localhost:3334/health || echo "Daemon down"

# Verificar WebSocket
wscat -c ws://localhost:3333 -x '{"type":"ping"}' || echo "WS down"

# Verificar agentes
for agent in claude qwen gemini; do
  which $agent-cli > /dev/null || echo "$agent CLI not found"
done

# Verificar Docker
docker ps > /dev/null || echo "Docker not running"

# Verificar PostgreSQL
docker exec sports_feb_2026_db pg_isready || echo "DB down"
```

### 10.2 Logs

```bash
# Ver logs del daemon
journalctl -u openclawcolab -f

# Ver logs por agente
tail -f /var/log/openclawcolab/claude.log
tail -f /var/log/openclawcolab/qwen.log

# Ver chat completo
tail -f chat/CHAT_LOG.md
```

---

## 11. Systemd Service

```ini
# /etc/systemd/system/openclawcolab.service

[Unit]
Description=OpenClawColab Multi-LLM Daemon
After=network.target docker.service

[Service]
Type=simple
User=developer
WorkingDirectory=/home/developer/openclawcolab
ExecStart=/usr/bin/node daemon/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar e iniciar
sudo systemctl daemon-reload
sudo systemctl enable openclawcolab
sudo systemctl start openclawcolab

# Ver estado
sudo systemctl status openclawcolab
```

---

## 12. Añadir Nuevos Agentes

### 12.1 Ejemplo: Añadir ChatGPT

```bash
# 1. Instalar CLI
pip install aider-chat

# 2. Configurar API key
echo "OPENAI_API_KEY=sk-..." >> .env

# 3. Crear archivo de contexto
cat > agents/CHATGPT.md << 'EOF'
# ChatGPT - OpenClawColab

## Tu Identidad
Eres CHATGPT, el DevOps Lead del proyecto.

## Tu Rol
- Configurar CI/CD
- Docker y Kubernetes
- Scripts de deployment
- Monitoreo y alertas

## Al Iniciar
1. Lee shared/CONTEXT.md
2. Lee tasks/BACKLOG.md
3. Revisa tu inbox/chatgpt/

## Para Comunicarte
Envía mensajes al WebSocket en localhost:3333
EOF

# 4. Añadir a spawner config
# En daemon/spawner.js, agregar:
CHATGPT: {
  cmd: 'aider',
  args: ['--yes', '--auto-commits'],
  cwd: process.env.WORKSPACE
}

# 5. Reiniciar daemon
sudo systemctl restart openclawcolab
```

---

## 13. Roadmap

### v1.0 (MVP)
- [x] WebSocket chat server
- [x] Protocolo de comunicación
- [x] Archivos de contexto por agente
- [ ] Daemon básico
- [ ] Telegram bot
- [ ] CLI spawner

### v1.1
- [ ] Orchestrator (Claude review)
- [ ] Auto-branching Git
- [ ] Task queue persistente
- [ ] Health checks

### v2.0
- [ ] Web dashboard
- [ ] Métricas y analytics
- [ ] Múltiples proyectos simultáneos
- [ ] Plugin system para nuevos agentes

---

## 14. Troubleshooting

| Problema | Solución |
|----------|----------|
| Agente no responde | Verificar CLI instalado, revisar logs |
| Telegram no conecta | Verificar token, revisar firewall |
| WebSocket error | Verificar puerto 3333 libre |
| Timeout en tareas | Aumentar TASK_TIMEOUT en .env |
| Git conflicts | Revisar ramas, merge manual |

---

## 15. Contribuir

```bash
# Fork del repositorio
git clone https://github.com/TU_USUARIO/openclawcolab.git

# Crear rama
git checkout -b feature/nueva-funcionalidad

# Desarrollar y testear
npm test

# Pull request
gh pr create --title "Nueva funcionalidad"
```

---

**Licencia:** MIT
**Repositorio:** https://github.com/TU_USUARIO/openclawcolab
