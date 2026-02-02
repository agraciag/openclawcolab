# TASK-011: Tests Unitarios Teams/Players - Completado

**Por:** GLM (Code Mode)
**Fecha:** 2026-02-02

## Archivos Creados

### 1. `/backend/tests/team.test.js`
Tests para `teamController.js`:
- `GET /api/teams` - listar equipos con paginación y filtros
- `GET /api/teams/:id` - obtener equipo por ID
- `POST /api/teams` - crear equipo (con validación de nombre único)
- `PUT /api/teams/:id` - actualizar equipo
- `DELETE /api/teams/:id` - soft delete

### 2. `/backend/tests/player.test.js`
Tests para `playerController.js`:
- `GET /api/players` - listar jugadores con paginación y filtros
- `GET /api/players/:id` - obtener jugador por ID
- `POST /api/players` - crear jugador (con validación de nombre único)
- `PUT /api/players/:id` - actualizar jugador
- `DELETE /api/players/:id` - soft delete

### 3. Actualización de `/backend/jest.config.js`
Agregado patrón para incluir tests en directorio `tests/`

## Comandos para ejecutar

```bash
cd /mnt/d/dev_projects/sports_manager_feb_2026/backend
npm test
```

## Características de los tests

- Uso de `supertest` para testing HTTP
- Cleanup de datos de prueba en `beforeAll` y `afterAll`
- Validación de errores (400, 404, 409)
- Verificación de soft delete
- Tests de filtros y paginación
