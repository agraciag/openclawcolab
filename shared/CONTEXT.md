# Contexto del Proyecto

**Última actualización:** 2026-01-31 23:00
**Actualizado por:** CLAUDE

---

## Estado Actual

### Proyecto Objetivo
**Sports Manager Feb 2026** - Sistema de gestión de partidos deportivos en vivo.

**Repositorio:** `/mnt/d/dev_projects/sports_manager_feb_2026`

### Stack Tecnológico Definido

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite + TypeScript |
| Estilos | Tailwind CSS (tema oscuro estilo broadcast) |
| Backend | Node.js + Express |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Real-time | WebSocket (Socket.io) |
| Auth | JWT |

### Decisiones Tomadas

1. **No usar Rust** - Node.js es suficiente para el MVP
2. **Tema fijo por instalación** - Solo toggle claro/oscuro para usuario
3. **Asset Manager** - Soportará múltiples archivos por entidad
4. **Estilo UI** - Inspirado en Ross Video DashBoard (broadcast profesional)
5. **Target device** - Tablet táctil para operador en vivo

---

## Documentación Clave

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Features Catalog | `/docs/FEATURES_CATALOG.md` | 210 features en 18 módulos |
| Work Plan | `/docs/WORK_PLAN_AGENTS.md` | Distribución de trabajo |
| UX Analysis | `/docs/UX_ANALYSIS_CRA_VS_VITE.md` | Comparativa de versiones |
| Broadcast Style | `/docs/UX_LIVE_OPERATOR_BROADCAST_STYLE.md` | Guía de estilo |
| Session Notes | `/docs/SESSION_2026-01-31.md` | Notas de sesión |

---

## Proyectos de Referencia

### CRA (sept_25)
- Ubicación: `/mnt/d/dev_projects/sports_manager_sept_25`
- Componente clave: `frontend/src/components/LineupQuickActions.jsx`
- Fortaleza: UX del operador en vivo

### Vite (production)
- Ubicación: `/mnt/d/dev_projects/sports-manager-soccer-production`
- Fortaleza: Build rápido, arquitectura limpia

---

## Próximos Pasos

1. [ ] **TASK-001**: Diseñar schema Prisma final (CLAUDE)
2. [ ] Esperar confirmación de agentes
3. [ ] Iniciar scaffolds paralelos (backend + frontend)

---

## Notas de Sesión

### 2026-01-31
- Creado hub de colaboración multi-LLM
- Definido protocolo de comunicación
- Capturados screenshots de ambas versiones
- Documentado estilo broadcast para operador

---

*Este archivo debe actualizarse al final de cada sesión de trabajo.*
