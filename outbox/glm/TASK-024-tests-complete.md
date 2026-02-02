# TASK-024: Tests para Matches, Events y Lineups - Completado

**Por:** GLM (Code Mode)
**Fecha:** 2026-02-02

## Archivos Creados

### 1. `/backend/tests/match.test.js`
Tests para `matchController.js` (CRUD partidos):
- `GET /api/matches` - listar partidos con filtros (status, season, team)
- `GET /api/matches/:id` - obtener partido por ID
- `POST /api/matches` - crear partido
- `PUT /api/matches/:id` - actualizar partido (score, status)
- `PATCH /api/matches/:id/status` - actualizar status
- `DELETE /api/matches/:id` - soft delete

### 2. `/backend/tests/matchEvent.test.js`
Tests para eventos de partidos:
- `GET /api/matches/:matchId/events` - listar eventos
- `POST /api/matches/:matchId/events` - crear eventos (goles, tarjetas)
  - Verifica que se actualiza el score
  - Valida jugadores en lineup
- `PUT /api/matches/:matchId/events/:id` - actualizar eventos
- `DELETE /api/matches/:matchId/events/:id` - eliminar eventos (revierte score)

### 3. `/backend/tests/lineup.test.js`
Tests para alineaciones:
- `GET /api/matches/:matchId/lineups` - obtener alineaciones
- `POST /api/matches/:matchId/lineups` - crear alineaciones
  - Valida máximo 11 titulares ✓
  - Valida máximo 9 suplentes
  - Valida jugadores pertenezcan al equipo
  - Rechaza duplicados
- `PUT /api/matches/:matchId/lineups/:id` - actualizar entrada
- `DELETE /api/matches/:matchId/lineups/:id` - eliminar entrada

### 4. `/backend/controllers/matchController.js`
Agregadas funciones faltantes de eventos:
- `getMatchEvents` - obtener eventos de un partido
- `createMatchEvent` - crear eventos (con actualización de score)
- `updateMatchEvent` - actualizar eventos
- `deleteMatchEvent` - eliminar eventos (con reversión de score)

## Comandos para ejecutar

```bash
cd /mnt/d/dev_projects/sports_manager_feb_2026/backend
npm test
```

## Datos del seed usados

- Email: admin@sportsmanager.com
- Password: admin123
