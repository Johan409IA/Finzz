# Prompt para implementar la sección Historial de Finzz

Implementa la sección **Historial** tomando como referencia visual la interfaz proporcionada.

El objetivo es separar el dashboard de la gestión completa de gastos y dejar en Historial la consulta, búsqueda, edición, eliminación y paginación de todos los gastos registrados.

## Navbar lateral

Crea un navbar lateral fijo con la misma estructura visual de la referencia.

Debe contener:

- Logo de **Finzz** en la parte superior.
- Opción `Dashboard`.
- Opción `Historial`.
- `Historial` debe mostrarse como la opción activa cuando el usuario esté en esta vista.
- En la parte inferior:
  - avatar con iniciales;
  - nombre de la persona autenticada;
  - botón `Cerrar sesión`.

No añadas secciones adicionales como Perfil, Presupuestos, Categorías u otras.

El estado activo debe ser claramente visible mediante fondo/acento verde menta, icono y contraste suficiente.

En responsive, adapta el navbar de forma adecuada sin romper la navegación.

---

## Página Historial

Encabezado:

```text
Historial
Consulta, busca y administra todos tus gastos registrados.
```

En la zona superior derecha conserva:

- fecha actual;
- botón `+ Registrar gasto`.

El botón debe reutilizar el mismo flujo/formulario de registro de gastos existente en la aplicación.

---

## Búsqueda

Añade un buscador con placeholder:

```text
Buscar por nombre del gasto...
```

Debe:

- buscar por el nombre/descripción principal del gasto;
- actualizar los resultados sin recargar la página;
- ignorar diferencias de mayúsculas/minúsculas;
- manejar correctamente búsquedas sin resultados;
- conservar la paginación de forma coherente al cambiar la búsqueda.

Si la búsqueda requiere peticiones al backend, usa debounce para evitar solicitudes innecesarias.

---

## Total de gastos

Muestra un indicador discreto con el total de gastos disponibles.

Ejemplo:

```text
58 gastos registrados en total
```

Si hay una búsqueda activa, puede mostrarse también la cantidad encontrada si resulta útil, sin añadir ruido visual.

---

## Tabla de gastos

Muestra todos los gastos mediante una tabla con estas columnas:

```text
Descripción
Categoría
Fecha
Importe
Acciones
```

Cada fila debe incluir:

- icono visual según la categoría;
- nombre/descripción del gasto;
- descripción secundaria si existe;
- categoría mediante badge/chip;
- fecha;
- importe en soles;
- acciones `Editar` y `Eliminar`.

Usa las categorías existentes de Finzz:

- Alimentación
- Transporte
- Vivienda
- Servicios
- Salud
- Ocio
- Educación
- Otros

Formato monetario:

```text
S/ 28.00
S/ 1,100.00
```

Formato de fecha visible:

```text
16 sep. 2026
```

---

## Editar

El botón `Editar` debe reutilizar el flujo actual de edición.

Después de editar un gasto:

- actualizar la tabla;
- evitar recargar toda la página;
- refrescar cualquier dato dependiente que ya utilice la aplicación.

---

## Eliminar

El botón `Eliminar` debe:

- pedir confirmación antes de borrar;
- reutilizar el flujo actual de eliminación;
- actualizar la lista después de eliminar;
- corregir la página actual si al eliminar el último registro de una página esta queda vacía.

Ejemplo: si se elimina el único registro de la página 6, regresar a la página 5 si corresponde.

---

## Paginación

Mostrar **10 gastos por página**.

En la parte inferior de la tabla mostrar información similar a:

```text
Mostrando 1–10 de 58 gastos
```

Añadir controles:

```text
Anterior   1  2  3  4  5  6   Siguiente
```

Reglas:

- página actual claramente resaltada;
- `Anterior` deshabilitado en la primera página;
- `Siguiente` deshabilitado en la última;
- mantener la búsqueda activa al cambiar de página;
- preferir paginación desde backend si la cantidad de datos puede crecer.

Si se implementa selector de cantidad por página, dejar `10` como valor por defecto. No es obligatorio añadir otras cantidades si todavía no existen.

---

## Estados de interfaz

Implementa correctamente:

- loading;
- error;
- lista vacía;
- búsqueda sin resultados;
- eliminación en progreso;
- edición en progreso;
- cambio de página.

Estado vacío:

```text
No tienes gastos registrados.
```

Búsqueda sin resultados:

```text
No se encontraron gastos con ese nombre.
```

---

## Backend / API

Antes de modificar, inspecciona los endpoints actuales.

Reutiliza la API existente siempre que sea posible.

Si hace falta ampliar el endpoint de gastos, añade soporte para:

- `page`
- `limit`
- `search`

Ejemplo conceptual:

```text
GET /api/expenses?page=1&limit=10&search=mercado
```

La respuesta debería permitir conocer:

- registros de la página actual;
- total de registros;
- página actual;
- total de páginas.

No cambies contratos existentes innecesariamente.

---

## Diseño

Mantén la estructura visual de la referencia:

- tema oscuro azul/navy;
- acento verde menta;
- cards con bordes sutiles;
- tabla limpia;
- badges de categoría con colores diferenciados;
- botones `Editar` discretos;
- `Eliminar` con acento rojo;
- jerarquía visual clara;
- buen espaciado;
- responsive.

No añadas gráficos ni KPIs en Historial.

---

## Validación

Comprueba al menos:

1. Se muestran 10 registros por página.
2. La búsqueda filtra por nombre correctamente.
3. La paginación funciona con y sin búsqueda.
4. `Anterior` y `Siguiente` se deshabilitan cuando corresponde.
5. Editar actualiza el registro visible.
6. Eliminar actualiza la tabla y el total.
7. Eliminar el último elemento de una página no deja una página vacía inválida.
8. El navbar resalta correctamente `Historial`.
9. El nombre del usuario autenticado aparece en el navbar.
10. `Cerrar sesión` sigue funcionando.


