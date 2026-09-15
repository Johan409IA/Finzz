## 1. Persistencia y configuración

- [x] 1.1 Confirmar el flujo CLI o panel de InsForge para aplicar migraciones en el proyecto configurado.
- [x] 1.2 Crear la migración SQL de categorías y gastos con UUID, `user_id`, importe `numeric(12,2)`, fecha, descripción y timestamps.
- [x] 1.3 Añadir índices, clave foránea a `auth.users(id)`, seed idempotente de las ocho categorías y políticas RLS de aislamiento por usuario.
- [x] 1.4 Verificar la migración en el entorno de desarrollo y documentar el contrato de serialización del importe.

## 2. Backend de gastos

- [x] 2.1 Añadir las dependencias y configuración necesarias para acceso a PostgreSQL/InsForge y validación Zod, respetando las versiones existentes.
- [x] 2.2 Implementar los esquemas de entrada y salida para creación, edición, categorías y gastos.
- [x] 2.3 Implementar el repositorio o servicio de gastos usando `request.auth.user.usuarioId` como propietario en todas las operaciones.
- [x] 2.4 Implementar `GET /api/expense-categories` y `GET /api/expenses` con autenticación, ordenamiento y lista vacía.
- [x] 2.5 Implementar `POST /api/expenses` con validación de importe, fecha, categoría y descripción.
- [x] 2.6 Implementar `PATCH /api/expenses/:id` y `DELETE /api/expenses/:id` con control de propiedad y respuestas `404` seguras.
- [x] 2.7 Añadir tests de backend para autenticación, validación, CRUD, ordenamiento y aislamiento entre usuarios.

## 3. Frontend del flujo principal

- [x] 3.1 Añadir el cliente de API autenticado para categorías y gastos usando el token válido de InsForge.
- [x] 3.2 Integrar en el dashboard el formulario de creación y edición con importe, fecha, categoría y descripción.
- [x] 3.3 Integrar el listado de gastos con acciones de editar y eliminar, orden y confirmación de mutaciones exitosas.
- [x] 3.4 Implementar estados de carga, error, lista vacía, guardado y eliminación sin perder datos del formulario ante errores.
- [x] 3.5 Añadir tests de frontend para estados principales, validación visible y flujo de creación/edición/eliminación.

## 4. Verificación

- [x] 4.1 Ejecutar tests y typecheck de backend y corregir cualquier fallo.
- [x] 4.2 Ejecutar tests, typecheck y build de frontend y corregir cualquier fallo.
- [x] 4.3 Validar manualmente el flujo autenticado completo y el bloqueo de acceso cruzado entre cuentas.
