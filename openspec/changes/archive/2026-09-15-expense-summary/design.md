## Context

Finzz ya cuenta con autenticación en InsForge y con un CRUD protegido de gastos persistidos en PostgreSQL. El dashboard muestra la cantidad de registros y permite gestionarlos, pero no ofrece una lectura agregada del comportamiento de gasto. El nuevo resumen debe reutilizar las tablas y el contexto autenticado existentes, evitar una migración de esquema y mantener el aislamiento por usuario en cada consulta.

## Goals / Non-Goals

**Goals:**

- Exponer agregados de los gastos propios para un mes seleccionado.
- Calcular total, cantidad de gastos y distribución por categoría en el backend.
- Integrar el resumen en el dashboard con selector mensual y estados de UI completos.
- Mantener una respuesta decimal estable y segura para importes monetarios.
- Cubrir validación del periodo, aislamiento y cálculos con tests.

**Non-Goals:**

- Presupuestos, límites de gasto, ingresos o patrimonio neto.
- Comparativas entre meses o tendencias históricas.
- Gráficos avanzados, exportación o paginación.
- Categorías personalizadas o cambios en el modelo de gastos.
- Modificaciones al flujo de autenticación.

## Decisions

- **Endpoint agregado protegido:** añadir `GET /api/expenses/summary?month=YYYY-MM`, protegido por el mismo hook de autenticación que usa el CRUD. El backend obtiene el propietario exclusivamente de `request.auth.user.usuarioId`. Se descarta calcular el resumen únicamente en el frontend porque las consultas agregadas deben compartir la misma frontera de autorización que el resto de la API.

- **Periodo mensual explícito:** exigir el parámetro `month` con formato `YYYY-MM`, interpretarlo como mes calendario y devolver `periodStart`, `periodEnd` y `month`. No se usará la zona horaria del navegador ni un rango abierto ambiguo. Si el parámetro es inválido, la API responde `422`.

- **Consulta agregada en backend:** calcular total y cantidad mediante agregación SQL y obtener la distribución agrupada por categoría en la misma operación lógica. Se prefiere esto frente a descargar todos los gastos y sumar en SolidJS porque reduce transferencia y mantiene una única fuente de verdad para importes.

- **Contrato monetario consistente:** serializar `totalAmount` y `amount` de categoría como números con dos decimales, igual que el contrato existente de gastos. El backend devolverá `totalAmount: 0` y `expenseCount: 0` cuando el periodo no tenga gastos, junto con una lista de categorías vacía.

- **Integración local en el dashboard:** crear un cliente de resumen y un componente o sección reutilizable para métricas y distribución. El dashboard conservará su carga de gastos y refrescará el resumen después de crear, editar o eliminar un gasto. No se añadirá un gestor de estado global.

- **Visualización accesible y simple:** representar la distribución inicialmente como filas con nombre, importe y porcentaje, con una barra visual accesible y texto alternativo; no se añadirá una dependencia de gráficos para este alcance. La lista de categorías se ordenará por importe descendente y luego por nombre.

## Risks / Trade-offs

- [El mes seleccionado depende de la interpretación de fecha] → Trabajar con límites de mes calendario en el backend y enviar fechas ISO sin conversión local desde el cliente.
- [Los decimales de PostgreSQL pueden llegar como strings] → Normalizar y validar la serialización en el repositorio y cubrirla con tests de contrato.
- [El resumen puede quedar desactualizado después de una mutación] → Refrescarlo junto con la lista tras cada operación exitosa y conservar el estado anterior si la mutación falla.
- [Una cuenta sin gastos puede parecer un fallo de carga] → Diferenciar explícitamente loading, error y estado vacío en la sección de resumen.
- [Un endpoint agregado puede filtrar mal por propietario] → Añadir tests con dos usuarios y verificar que ningún gasto ajeno influye en los agregados.

## Migration Plan

1. Implementar el esquema de respuesta y validación del parámetro mensual.
2. Añadir la consulta agregada y el endpoint protegido sin modificar el esquema de base de datos.
3. Añadir tests de backend para periodos, cálculos, estados vacíos y aislamiento.
4. Integrar el selector y las métricas en el dashboard, refrescando tras mutaciones.
5. Añadir tests de frontend y ejecutar typecheck, tests y build.
6. Para rollback, retirar el endpoint y la sección del dashboard; no se requiere revertir migraciones.

## Open Questions

- Confirmar durante la implementación el formato exacto con el que el driver actual devuelve columnas `numeric`; el contrato público seguirá normalizando a número decimal.
- Confirmar si la primera carga debe usar el mes calendario actual del servidor o del navegador; la decisión inicial será usar el mes del navegador y enviarlo explícitamente.
