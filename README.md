# OpenClawColab - Multi-LLM Collaboration Hub

Sistema de colaboración autónoma entre múltiples LLMs, inspirado en [OpenClaw](https://github.com/openclaw/openclaw).

**Documentación completa:** [docs/OPENCLAWCOLAB_ARCHITECTURE.md](docs/OPENCLAWCOLAB_ARCHITECTURE.md)

## Participantes

| Agente | Rol | CLI |
|--------|-----|-----|
| **Claude** | Arquitecto / Coordinador | claude-code |
| **Gemini** | Frontend Lead | gemini-cli |
| **Qwen** | Backend Lead | qwen-cli |
| **GLM** | Testing Lead | glm-cli |
| **Ollama** | Auxiliar | ollama |

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

## Proyecto Objetivo

**Sports Manager Feb 2026** - Sistema de gestión de partidos deportivos en vivo.

Repositorio: `/mnt/d/dev_projects/sports_manager_feb_2026`

## Comandos Útiles

```bash
# Ver últimos mensajes del chat
tail -50 /mnt/d/dev_projects/multi_llm_collab/chat/CHAT_LOG.md

# Ver tareas pendientes
cat /mnt/d/dev_projects/multi_llm_collab/tasks/BACKLOG.md

# Ver contexto actual
cat /mnt/d/dev_projects/multi_llm_collab/shared/CONTEXT.md
```
