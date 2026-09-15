## Context

Finzz dispone de autenticación con InsForge en el frontend y validación de JWT en Fastify. El dashboard actual verifica la identidad contra `/api/auth/me`, pero todavía no existe persistencia ni API para el dominio de gastos. El cambio cruza frontend, backend y PostgreSQL/InsForge, y debe conservar el aislamiento por usuario definido por la capability de autenticación.

## Goals / Non-Goals

**Goals:**

- Persistir gastos asociados a la identidad autenticada.
- Exponer un CRUD protegido y validado para los gastos propios.
- Proporcionar un catálogo estable de categorías iniciales.
- Integrar formulario, listado y estados de UI en el dashboard.
- Cubrir reglas de propiedad, validación y estados principales con tests automatizados.

**Non-Goals:**

- Presupuestos, ingresos, transferencias o cuentas bancarias.
- Categorías personalizadas por usuario.
- Reportes, gráficos, paginación o filtros avanzados.
- Edición de perfil o cambios en el flujo de autenticación.
- Soporte offline o sincronización en tiempo real.

## Decisions

- **Persistencia en PostgreSQL gestionado por InsForge.** Se crearán tablas para `categories` y `expenses`, con claves UUID, timestamps y una referencia `user_id` a `auth.users(id)`. Se usará una migración SQL reproducible en lugar de mantener datos en memoria o en el frontend, porque los gastos deben sobrevivir a las sesiones y ser compartidos por las capas de la aplicación.

- **Propiedad derivada del JWT.** Las rutas protegidas tomarán `user_id` exclusivamente de `request.auth.user.usuarioId`; no aceptarán un propietario confiable desde body, query o params. Las consultas y mutaciones incluirán la condición de propietario y las políticas RLS reforzarán el aislamiento en la base de datos. Esto se elige sobre confiar solo en la UI porque la API es una frontera pública.

- **API REST protegida.** Se añadirán `GET /api/expenses`, `POST /api/expenses`, `PATCH /api/expenses/:id`, `DELETE /api/expenses/:id` y `GET /api/expense-categories`. Todas las rutas de gastos exigirán autenticación; el backend devolverá respuestas JSON consistentes y códigos `400`, `401`, `404` y `500` según corresponda.

- **Validación en el borde con Zod.** Los payloads de creación y edición validarán importe positivo con precisión monetaria definida, fecha ISO válida, categoría existente y descripción opcional con longitud máxima. Se validará de nuevo la existencia y propiedad en el servicio/repositorio antes de mutar datos. Se prefiere Zod frente a validaciones manuales duplicadas porque ya forma parte del stack declarado y mantiene contrato compartido con los tests.

- **Catálogo inicial controlado.** Las ocho categorías se insertarán mediante una migración/seed idempotente con identificadores estables. No se añadirá CRUD de categorías en este cambio; así el formulario puede ofrecer opciones consistentes sin abrir otro modelo de permisos.

- **Integración incremental en el dashboard.** El frontend conservará `AuthProvider` y `ProtectedRoute`, añadirá un cliente pequeño para obtener el token válido y consumirá la API. El dashboard gestionará estados loading, error, empty y editing localmente; no se introducirá un gestor de estado global para una sola pantalla.

- **Importes monetarios normalizados.** La base de datos almacenará el importe en `numeric(12,2)` y la API lo serializará como número decimal validado. No se usarán floats sin restricción ni cálculos de totales en este cambio.

## Risks / Trade-offs

- [RLS o migración mal configurada] → Probar políticas con usuarios distintos y validar que el backend nunca dependa solo de filtros del frontend.
- [Diferencias de serialización decimal entre PostgreSQL y JSON] → Normalizar el valor en el repositorio/serializador y cubrirlo con tests de contrato.
- [Duplicación de lógica entre formulario de creación y edición] → Usar el mismo modelo de formulario con un estado de edición explícito, sin abstraer más allá de lo necesario.
- [Fallo del backend durante una mutación] → Mantener los datos del formulario hasta recibir éxito y mostrar el error sin alterar la lista local.
- [Cambio irreversible del esquema] → Aplicar la migración de forma aditiva; el rollback elimina las tablas y seed solo antes de existir datos que deban conservarse.

## Migration Plan

1. Crear y aplicar la migración SQL para tablas, índices, categorías iniciales, claves foráneas y políticas RLS.
2. Implementar repositorio/servicio y rutas protegidas del backend.
3. Añadir tests de backend para validación, CRUD y aislamiento.
4. Integrar el formulario y la lista en el dashboard.
5. Añadir tests del frontend y ejecutar typecheck, tests y build.
6. En rollback, retirar las rutas y la UI de gastos; conservar la migración si ya existen datos, o revertir tablas y políticas únicamente en entornos sin datos que preservar.

## Open Questions

- Confirmar si InsForge expone la migración SQL del proyecto mediante el flujo CLI configurado o si debe aplicarse desde su panel antes de la implementación.
- Confirmar si el contrato de API serializará `amount` como `number` o como `string` decimal al revisar el cliente de base de datos disponible durante la implementación.
