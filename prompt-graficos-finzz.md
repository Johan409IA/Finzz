# GRAFICOS PARA RESUMENES

Implementa los gráficos de los resúmenes **Mensual** y **Semanal** usando **Apache ECharts**.

## Comportamiento general

Debe existir un toggle:

```text
[ Mensual ] [ Semanal ]
```

Solo se muestra la información correspondiente al período activo.

- **Mensual**: KPIs mensuales + gráfico mensual + gastos por categoría.
- **Semanal**: KPIs semanales + gráfico semanal + gastos por categoría.
- No mostrar ambos resúmenes al mismo tiempo.
- El cambio debe ser reactivo, sin recargar la página.

## Resumen mensual

Mantén los KPIs actuales:

- **Total del mes**
- **Gastos registrados**

Añade:

### Evolución del gasto del mes

Usa un **line chart con área inferior suave**.

Debe representar el gasto total por día del mes seleccionado.

Reglas:

- Incluir todos los días del mes, aunque algunos tengan `0`.
- Los días sin gastos deben seguir formando parte de la serie.
- El eje X puede mostrar solo algunas etiquetas para evitar saturación.
- Tooltip con fecha y monto en soles.

Ejemplo:

```text
15 sep. 2026
S/ 600.00
```

### Gastos por categoría

Usa un **donut chart**.

Debe mostrar únicamente las categorías con gastos en el período seleccionado.

Para cada categoría mostrar:

- nombre;
- monto;
- porcentaje.

Mostrar en el centro del donut el total del período.

## Resumen semanal

La semana de Finzz es siempre:

```text
Lunes → Domingo
```

Puede cruzar entre meses o años.

Mantén los KPIs actuales:

- **Total semanal**
- **Gastos registrados**

### Gasto de la semana

Usa un **bar chart**.

El eje X debe mostrar siempre:

```text
LU  MA  MI  JU  VI  SA  DO
```

aunque algunos días tengan gasto `0`.

Ejemplo:

```text
LU  S/ 1450
MA  S/ 820
MI  S/ 0
JU  S/ 610
VI  S/ 530
SA  S/ 420
DO  S/ 1150
```

No ocultes los días sin movimientos.

En tooltip:

```text
Miércoles, 16 sep. 2026
S/ 0.00
Sin gastos registrados
```

### Gastos por categoría

Reutiliza el mismo componente de donut del resumen mensual, pero con los datos de la semana seleccionada.

## Integración con ECharts

Usa imports modulares desde:

```ts
echarts/core
echarts/charts
echarts/components
echarts/renderers
```

Crea una integración reutilizable para SolidJS.

El componente base debe:

- inicializar ECharts al montar;
- actualizar con `setOption()` cuando cambien los datos;
- adaptarse al tamaño del contenedor;
- usar `ResizeObserver` si es necesario;
- ejecutar `dispose()` al desmontarse;
- evitar recrear la instancia innecesariamente.

## Diseño de los gráficos

Prepáralos para el futuro dashboard oscuro de Finzz.

Características:

- fondo transparente;
- verde/menta como color principal;
- grid sutil;
- tooltips oscuros;
- animaciones suaves;
- sin estilos exagerados.

### Line chart mensual

- línea suave;
- 2–3 px;
- área inferior con degradado;
- puntos discretos;
- tooltip al hover.

### Bar chart semanal

- barras verdes;
- esquinas superiores redondeadas;
- siete posiciones fijas de lunes a domingo;
- valores `0` correctamente representados.

### Donut

- total del período en el centro;
- segmentos por categoría;
- leyenda con nombre, monto y porcentaje.

## Datos

No hardcodees datos mock en producción.

Reutiliza o amplía los endpoints existentes para que entreguen los datos necesarios.

El resumen mensual debe poder devolver:

- total;
- cantidad de gastos;
- total por día;
- distribución por categoría.

El resumen semanal debe devolver:

- rango lunes-domingo;
- total;
- cantidad de gastos;
- total por cada uno de los 7 días;
- distribución por categoría.

Los días sin gastos deben aparecer con valor `0`.

## Estados

Maneja correctamente:

- loading;
- error;
- período sin gastos;
- cambio Mensual ↔ Semanal;
- cambio de mes;
- cambio de semana;
- actualización después de crear, editar o eliminar un gasto.

## Validación

Comprueba especialmente:

1. El gráfico mensual incluye todos los días del mes.
2. El gráfico semanal incluye siempre 7 días.
3. El orden semanal es `LU, MA, MI, JU, VI, SA, DO`.
4. Los días sin gastos tienen valor `0`.
5. Una semana puede cruzar entre meses o años.
6. Los gráficos cambian correctamente al alternar Mensual/Semanal.
7. Crear, editar o eliminar un gasto refresca el resumen activo.


