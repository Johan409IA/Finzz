# Checkup de Finzz: Login, Register, Dashboard e Historial

Fecha: 2026-10-09  
Referencias contrastadas: `login.png`, `register.png`, `dashboard_resumen-mensual.png`, `dashboard_resumen-semanal.png`, `Historial de gastos en Finzz.png`  
Alcance: auditoría solamente; no se modificó la interfaz ni se guardaron/eliminaron gastos.

## Diagnóstico

La dirección navy/menta, marca y jerarquías coinciden con las referencias. Login y Register comparten el sistema de formulario; Dashboard e Historial comparten shell, encabezado, botón primario y superficies. La sesión autenticada permitió probar datos reales del backend, cambio de periodo, búsqueda, paginación y diálogos sin confirmar mutaciones. En viewports móviles no hay overflow horizontal, aunque el encabezado fijo y el título se solapan 2 px y el selector mensual computa 14 px.

**Puntuación: 35/60 — BLOCK**

| Vital | Estado | Puntos | Evidencia |
|---|---:|---:|---|
| Intencionalidad | Healthy | 10/10 | Las referencias y la implementación comparten navy/menta, superficies elevadas, iconografía de categorías y composiciones propias de cada tarea. |
| Legibilidad | Watch | 5/10 | Jerarquía y datos escaneables; selector mensual a 14 px en móvil y pie auth a unos 9,6 px. |
| Usabilidad | Healthy | 10/10 | Se verificaron métricas/gráficos mensuales y semanales, búsqueda, rango, navegación de página, abrir/cerrar edición y abrir/cerrar registro. |
| Responsividad | Watch | 5/10 | Dashboard e Historial sin overflow de página a 320/375/768/1440 px; en móvil título y navegación fija se solapan 2 px. Tabla de Historial en 768 px usa scroll dentro de su propio wrapper. |
| Velocidad | Watch | 5/10 | Apps locales y APIs respondieron; no se midieron métricas de rendimiento, layout shift o latencia percibida bajo carga. |
| Accesibilidad | Critical | 0/10 | El spinner de autenticación usa `animate-spin` sin `prefers-reduced-motion`, disparador HIGH. |

## Hallazgos

| # | Severity | Discipline | Location | Before | After | Why |
|---|---|---|---|---|---|---|
| 1 | HIGH | Accessibility | `apps/frontend/src/components/AuthScreen.tsx:152` | `class="animate-spin"` en el indicador de envío | Cambiar a `motion-safe:animate-spin` | Login/Register ignoran `prefers-reduced-motion` durante el envío del formulario. |
| 2 | MEDIUM | Responsive | `apps/frontend/src/components/ExpenseSummary.tsx:150` | El selector `type="month"` usa `text-sm` en móvil; Edge computa 14 px | Usar `text-base sm:text-sm` | El texto sub-16 px puede disparar autozoom de iOS Safari al enfocar el mes y alterar el encuadre. |
| 3 | MEDIUM | Responsive | `apps/frontend/src/components/AuthenticatedLayout.tsx:21` | A 320/375 px la navegación fija termina en y=122 y el `h1` empieza en y=120 | Aumentar el padding superior móvil para que el título empiece después del límite inferior del header con separación visible | El límite de navegación se cruza con la caja superior del título, creando una unión apretada y riesgo de recorte visual en el primer contenido. |

## Considerados y descartados

| Location | Candidate | Rejected because |
|---|---|---|
| `apps/frontend/src/pages/HistoryPage.tsx:39,250-264` | Las acciones de fila no cumplen el objetivo táctil de 44 px | Aunque `rowActionClass` declara `min-h-10`, el componente `ghostButtonClass` aporta `min-h-11`; medición real en Edge a 1440 px dio 44 px. No se reporta como defecto. |
| `apps/frontend/src/components/ExpenseSummary.tsx:220-307` | La vista mensual y la semanal presentan tipos de gráfico distintos | La línea mensual y las barras semanales corresponden a escalas temporales distintas; títulos, superficie, categorías y resumen accesible conservan la misma gramática. |
| `apps/frontend/src/components/AuthScreen.tsx:48` | El SVG decorativo tiene ancho mínimo de 900 px | Su contenedor recorta overflow; Register a 320 px midió `scrollWidth=320`. |

## Verificación

**Comprobado en Microsoft Edge con sesión autenticada**

- Login aceptó las credenciales suministradas y abrió Dashboard. La API local entregó 200 para gastos, categorías y resúmenes; la sesión autenticada mostró datos reales. Una solicitud inicial de refresh devolvió 401, pero un refresh posterior devolvió 200 y las rutas autenticadas siguieron operativas.
- Dashboard mensual: render de dos KPIs, gráfico temporal, distribución por categorías y gastos recientes. Se cambió a semanal; el selector, rango semanal, totales, categorías, gráfico y tabla accesible se actualizaron.
- Dashboard a 320, 375, 768 y 1440 px: `documentElement.scrollWidth` coincide con el viewport; dos figuras presentes. A 320/375 px el header fijo termina en y=122 y el título empieza en y=120. El selector mensual computa 14 px también en escritorio; su tamaño móvil es la preocupación reportada.
- Historial: carga de registros reales; búsqueda tras debounce produjo una coincidencia y actualizó total/rango; al limpiar el filtro regresaron los resultados; página 2 mostró el rango 11–20 de 27.
- Modal Editar: nombre accesible, primer campo enfocado, Escape cierra y devuelve foco al botón Editar. Modal Registrar: categorías disponibles y foco en Importe; se cerró con Escape sin guardar. No se realizaron cambios de datos.
- Historial a 320, 375, 768 y 1440 px: ancho de documento coincide con el viewport. En móvil aparecen tarjetas; a 768 px la tabla supera el ancho del contenedor y se desplaza dentro del wrapper, sin overflow de documento; en escritorio aparece sidebar y las acciones de fila miden 44 px.
- Login y Register: estructura accesible observada en el árbol, toggle de contraseña probado, y Register a 320 px con campos de 16 px y sin overflow horizontal.

**No verificado**

- Flujo de guardado y eliminación, incluyendo confirmación y persistencia; se evitó modificar datos reales.
- Recorrido completo de teclado de toda la aplicación, cálculo de contraste, zoom 200 %, `prefers-reduced-motion` en un dispositivo compatible y Safari iOS (el autozoom se infiere del tamaño CSS y requiere verificar en Safari).
- Medición de Core Web Vitals, carga lenta o jank.

## Veredicto

**Block** — persiste el hallazgo HIGH de movimiento que no respeta `prefers-reduced-motion`; también quedan dos hallazgos MEDIUM de responsive. Se verificaron las rutas autenticadas con backend y datos reales, sin mutar registros.
