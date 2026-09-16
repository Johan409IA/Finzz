# Expense Summary

## Purpose

Esta capability cubre el resumen agregado de los gastos personales de Finzz: consulta mensual protegida de totales, cantidad de gastos y distribución por categoría, su aislamiento por usuario y la visualización del resumen en el dashboard con selector de mes y estados de carga, error y vacío.

## Requirements

### Requirement: Consultar resumen mensual de gastos propios
El sistema SHALL permitir a una persona autenticada consultar un resumen agregado de sus gastos para un mes calendario indicado mediante el parámetro `month` con formato `YYYY-MM`.

#### Scenario: Consulta mensual con gastos
- **WHEN** una persona autenticada solicita `/api/expenses/summary?month=2026-09` y tiene gastos dentro de septiembre de 2026
- **THEN** el sistema responde correctamente con el mes solicitado, los límites del periodo, el total gastado, la cantidad de gastos y la distribución por categoría

#### Scenario: Consulta mensual sin gastos
- **WHEN** una persona autenticada solicita un mes válido sin gastos propios
- **THEN** el sistema responde correctamente con `totalAmount` igual a cero, `expenseCount` igual a cero y una distribución por categoría vacía

#### Scenario: Mes ausente o inválido
- **WHEN** una persona autenticada solicita el resumen sin `month` o con un valor que no cumple `YYYY-MM` o no representa un mes válido
- **THEN** el sistema responde `422 Unprocessable Entity` con un error de validación y no ejecuta una consulta de resumen

#### Scenario: Usuario no autenticado
- **WHEN** una persona sin una sesión válida solicita el resumen mensual
- **THEN** el sistema responde `401 Unauthorized` y no devuelve datos agregados

### Requirement: Aislamiento del resumen por usuario
El sistema SHALL calcular el resumen exclusivamente con gastos cuyo propietario coincida con el `usuarioId` derivado del token autenticado.

#### Scenario: Gastos ajenos excluidos
- **WHEN** existen gastos del usuario autenticado y de otra cuenta dentro del mismo periodo
- **THEN** el total, la cantidad y la distribución del resumen solo incluyen los gastos del usuario autenticado

#### Scenario: Identidad enviada por el cliente ignorada
- **WHEN** una solicitud intenta incluir un identificador de usuario distinto al `sub` del token mediante query, body o cualquier otro valor controlable por el cliente
- **THEN** el sistema ignora ese identificador y calcula el resumen usando exclusivamente el usuario autenticado

### Requirement: Agregación por categoría
El sistema SHALL devolver la distribución de los gastos del periodo agrupada por categoría, ordenada por importe descendente y luego por nombre.

#### Scenario: Categorías con importes
- **WHEN** el usuario tiene gastos de varias categorías en el mes seleccionado
- **THEN** cada categoría aparece una sola vez con su importe acumulado, cantidad de gastos y porcentaje del total

#### Scenario: Categoría sin gastos
- **WHEN** una categoría del catálogo no tiene gastos del usuario en el periodo seleccionado
- **THEN** esa categoría no aparece en la distribución del resumen

#### Scenario: Total positivo
- **WHEN** el total del periodo es mayor que cero
- **THEN** la suma de los importes por categoría coincide con el total y la suma de sus porcentajes representa el total completo con una precisión de dos decimales

### Requirement: Selector mensual del dashboard
El frontend SHALL permitir seleccionar el mes del resumen y cargar sus datos dentro de la ruta protegida del dashboard.

#### Scenario: Carga inicial
- **WHEN** una persona autenticada abre el dashboard
- **THEN** el selector se inicializa con un mes válido y la interfaz solicita el resumen correspondiente

#### Scenario: Cambio de mes
- **WHEN** la persona selecciona otro mes válido
- **THEN** la interfaz solicita y muestra el resumen del nuevo mes sin cambiar la lista de gastos existente

#### Scenario: Error de consulta
- **WHEN** la consulta del resumen falla
- **THEN** la interfaz muestra un mensaje de error específico para el resumen y no presenta valores parciales como definitivos

### Requirement: Visualización de métricas y distribución
El frontend SHALL mostrar el total del periodo, la cantidad de gastos y la distribución por categoría con estados de carga y vacío.

#### Scenario: Resumen con datos
- **WHEN** la consulta del resumen termina correctamente con gastos
- **THEN** la interfaz muestra las métricas del periodo y cada categoría con nombre, importe, porcentaje y una representación visual accesible

#### Scenario: Resumen vacío
- **WHEN** la consulta del resumen termina correctamente sin gastos
- **THEN** la interfaz muestra métricas en cero y un mensaje claro indicando que no existen gastos en el periodo seleccionado

#### Scenario: Carga del resumen
- **WHEN** la consulta del resumen está en curso
- **THEN** la interfaz muestra un estado de carga en la sección del resumen sin ocultar ni reemplazar incorrectamente la lista de gastos

#### Scenario: Actualización tras mutación
- **WHEN** la persona crea, edita o elimina correctamente un gasto que pertenece al periodo seleccionado
- **THEN** la interfaz vuelve a cargar el resumen y muestra los valores actualizados
