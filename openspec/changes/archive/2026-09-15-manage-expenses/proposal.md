## Why

Finzz ya permite autenticar usuarios, pero todavía no ofrece la funcionalidad central de un gestor de gastos. Necesitamos un primer flujo de negocio que permita registrar y consultar gastos personales vinculados a la cuenta autenticada, para convertir el dashboard actual en una base funcional del producto.

## What Changes

- Añadir la capacidad de crear gastos con importe, fecha, descripción y categoría.
- Añadir la capacidad de listar los gastos del usuario autenticado, ordenados por fecha descendente.
- Añadir la capacidad de editar y eliminar gastos propios.
- Añadir categorías iniciales para clasificar los gastos.
- Añadir endpoints protegidos en el backend y una interfaz de gestión dentro del dashboard.
- Garantizar que cada usuario solo pueda consultar y modificar sus propios gastos.
- Añadir estados de carga, error y lista vacía en la interfaz.

## Capabilities

### New Capabilities

- `expenses`: Gestión de gastos personales y sus categorías para usuarios autenticados.

### Modified Capabilities

<!-- No se modifican los requisitos de autenticación existentes. -->

## Impact

- Backend Fastify: nuevo modelo de datos, validación Zod y endpoints protegidos para gastos.
- Frontend SolidJS: formulario, listado y acciones de edición/eliminación integrados en el dashboard.
- InsForge/PostgreSQL: nueva estructura persistente para gastos y categorías, con aislamiento por usuario mediante políticas de acceso.
- Tests de backend y frontend para CRUD, validación, estados de UI y aislamiento de datos.
