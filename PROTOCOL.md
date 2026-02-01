# Protocolo de Comunicación Inter-LLM

## 1. Formato de Mensajes en Chat

```markdown
---
[TIMESTAMP] [AGENTE] -> [DESTINATARIO]
[TIPO]: [TÍTULO]

[CONTENIDO]

---
```

### Campos

| Campo | Valores posibles |
|-------|------------------|
| TIMESTAMP | YYYY-MM-DD HH:MM |
| AGENTE | CLAUDE, GEMINI, QWEN, GLM, OLLAMA, HUMAN |
| DESTINATARIO | ALL, CLAUDE, GEMINI, QWEN, GLM, HUMAN |
| TIPO | INFO, TASK, QUESTION, ANSWER, DELIVERY, REVIEW, BLOCKER |

### Ejemplo

```markdown
---
2026-01-31 15:30 CLAUDE -> ALL
INFO: Inicio de sesión de trabajo

He revisado el backlog. Hoy trabajaremos en:
1. TASK-001: Schema de base de datos
2. TASK-002: Scaffold del proyecto

Qwen: por favor empieza con TASK-001
Gemini: espera el schema antes de empezar frontend

---
```

## 2. Formato de Tareas

Archivo: `/tasks/TASK-XXX.md`

```markdown
# TASK-XXX: [Título]

| Campo | Valor |
|-------|-------|
| Status | pending / in_progress / review / completed / blocked |
| Asignado | CLAUDE / GEMINI / QWEN / GLM |
| Prioridad | critical / high / medium / low |
| Creado | YYYY-MM-DD |
| Actualizado | YYYY-MM-DD |
| Bloqueado por | TASK-YYY (si aplica) |

## Descripción
[Descripción detallada]

## Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2

## Archivos Relacionados
- /path/to/file.js

## Notas
[Notas adicionales]

## Historial
- YYYY-MM-DD: Creado por CLAUDE
- YYYY-MM-DD: Asignado a QWEN
```

## 3. Formato de Entregas

Archivo: `/outbox/[descripcion]-[agente]-[timestamp].md`

```markdown
# Entrega: [Descripción]

| Campo | Valor |
|-------|-------|
| Agente | QWEN |
| Tarea | TASK-001 |
| Fecha | 2026-01-31 16:00 |

## Archivos Generados
- `/path/to/file1.js`
- `/path/to/file2.js`

## Resumen de Cambios
[Descripción de lo implementado]

## Tests
- [ ] Unitarios pasando
- [ ] E2E pasando

## Notas para Revisión
[Cualquier cosa que el revisor deba saber]
```

## 4. Formato de Code Review

Archivo: `/code_review/[archivo]-review-request.md`

```markdown
# Review Request: [Archivo]

| Campo | Valor |
|-------|-------|
| Solicitante | QWEN |
| Revisor | CLAUDE |
| Archivo | /path/to/file.js |
| Tarea | TASK-001 |

## Código a Revisar
\`\`\`javascript
// código aquí
\`\`\`

## Preguntas Específicas
1. ¿Es correcto el manejo de errores?
2. ¿Falta alguna validación?

## Review (completar por revisor)
**Status**: pending / approved / changes_requested

**Comentarios**:
[Comentarios del revisor]
```

## 5. Estados de Tareas

```
pending ──▶ in_progress ──▶ review ──▶ completed
    │                          │
    └──────▶ blocked ◀─────────┘
```

## 6. Prioridades

| Prioridad | Significado |
|-----------|-------------|
| critical | Bloquea todo, atender inmediatamente |
| high | Importante, atender hoy |
| medium | Normal, atender esta semana |
| low | Cuando haya tiempo |

## 7. Convenciones

1. **Siempre actualizar** `/shared/CONTEXT.md` al terminar una sesión
2. **Siempre leer** el chat antes de empezar
3. **No modificar** mensajes anteriores en el chat (solo agregar)
4. **Usar inbox** para mensajes privados/específicos
5. **Pedir review** antes de marcar como completed si es código crítico

## 8. Resolución de Conflictos

Si hay desacuerdo:
1. Documentar ambas posiciones en el chat
2. Esperar decisión de CLAUDE (arquitecto)
3. HUMAN tiene palabra final si es necesario
