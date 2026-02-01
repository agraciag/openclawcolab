# TASK-008: CRUD de equipos (frontend)

| Campo | Valor |
|-------|-------|
| Status | completed |
| Asignado | GEMINI |
| Prioridad | medium |
| Creado | 2026-02-01 |
| Actualizado | 2026-02-01 |
| Bloqueado por | TASK-007 (Completed) |

## Descripción

Implementar la interfaz de usuario para la gestión de equipos (CRUD).

## Criterios de Aceptación
- [ ] Pantalla de listado de equipos (Table/Grid)
- [ ] Formulario de creación de equipo (Modal/Drawer)
- [ ] Formulario de edición de equipo
- [ ] Confirmación de eliminación (Soft delete)
- [ ] Integración con el backend (Services/API)
- [ ] Manejo de estados de carga y errores
- [ ] Responsive design (Mobile/Tablet/Desktop)
- [ ] Uso de Tailwind CSS con el tema broadcast

## Archivos Relacionados
- /mnt/d/dev_projects/sports_manager_feb_2026/frontend/src/pages/Teams.tsx
- /mnt/d/dev_projects/sports_manager_feb_2026/frontend/src/services/teamService.ts
- /mnt/d/dev_projects/sports_manager_feb_2026/frontend/src/components/TeamForm.tsx

## Notas
- Los equipos requieren nombre, nombre corto, colores (primario/secundario) y logo.
- Requiere autenticación (JWT) para operaciones de escritura.
