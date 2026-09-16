## 1. Contrato y backend

- [x] 1.1 Definir los esquemas Zod de query `month` y de respuesta del resumen mensual.
- [x] 1.2 Definir los tipos TypeScript para métricas, distribución por categoría y límites del periodo.
- [x] 1.3 Implementar en el repositorio la consulta agregada por usuario y rango mensual, normalizando los valores `numeric` a números con dos decimales.
- [x] 1.4 Añadir `GET /api/expenses/summary` protegido por autenticación y devolver errores `401`, `422` y `500` según el contrato existente.
- [x] 1.5 Verificar que el endpoint ignora cualquier identificador de usuario enviado por el cliente y usa solo `request.auth.user.usuarioId`.

## 2. Tests del backend

- [x] 2.1 Probar la consulta con gastos de varias categorías, orden descendente y porcentajes calculados.
- [x] 2.2 Probar el periodo sin gastos y la respuesta con métricas en cero y distribución vacía.
- [x] 2.3 Probar meses ausentes, con formato inválido y fechas imposibles con respuesta `422`.
- [x] 2.4 Probar acceso sin autenticación y aislamiento entre dos usuarios autenticados.
- [x] 2.5 Probar que los valores monetarios agregados se serializan con el contrato decimal esperado.

## 3. Integración del frontend

- [x] 3.1 Añadir al cliente de API la consulta autenticada del resumen por mes.
- [x] 3.2 Crear la sección de resumen con selector mensual, tarjetas de total y cantidad de gastos.
- [x] 3.3 Mostrar la distribución por categoría con importe, porcentaje y representación visual accesible ordenada por importe.
- [x] 3.4 Implementar estados de carga, error y resumen vacío sin reemplazar la lista de gastos.
- [x] 3.5 Inicializar el selector con el mes actual del navegador y actualizar el resumen al cambiarlo.
- [x] 3.6 Refrescar el resumen después de crear, editar o eliminar gastos del periodo seleccionado.

## 4. Tests y verificación final

- [x] 4.1 Añadir tests de frontend para carga inicial, cambio de mes, datos, estado vacío y error.
- [x] 4.2 Añadir tests de frontend para refresco tras mutaciones exitosas.
- [x] 4.3 Ejecutar tests y typecheck del backend y corregir cualquier fallo.
- [x] 4.4 Ejecutar tests, typecheck y build del frontend y corregir cualquier fallo.
- [x] 4.5 Validar manualmente el dashboard autenticado y confirmar que el resumen no muestra datos de otra cuenta.
