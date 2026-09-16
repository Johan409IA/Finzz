## Why

Finzz ya permite registrar y administrar gastos, pero el dashboard todavía no transforma esos datos en información útil para tomar decisiones. Necesitamos un resumen financiero inicial que muestre cuánto se ha gastado y cómo se distribuye por categorías, reutilizando la información existente sin ampliar todavía el alcance a presupuestos o ingresos.

## What Changes

- Añadir un resumen protegido de los gastos propios del usuario autenticado.
- Mostrar el total acumulado, la cantidad de gastos y el gasto del periodo seleccionado.
- Mostrar la distribución del gasto por categoría con importes y porcentajes.
- Permitir seleccionar un periodo mensual para consultar el resumen.
- Integrar tarjetas de métricas y una visualización sencilla en el dashboard.
- Añadir estados de carga, error y ausencia de datos para el resumen.
- Mantener el aislamiento por usuario y calcular todos los datos a partir de gastos autorizados.

## Capabilities

### New Capabilities

- `expense-summary`: Resumen agregado y filtrable de los gastos personales del usuario autenticado.

### Modified Capabilities

<!-- No se modifican los requisitos existentes de auth ni expenses. -->

## Impact

- Backend Fastify: nuevo endpoint protegido para agregados de gastos y validación del periodo solicitado.
- Frontend SolidJS: nuevas tarjetas de métricas, selector mensual y distribución por categoría dentro del dashboard.
- PostgreSQL/InsForge: consultas agregadas sobre las tablas existentes de gastos y categorías; no se requiere una migración de esquema.
- Tests de backend y frontend para cálculos, filtros temporales, aislamiento y estados de UI.
