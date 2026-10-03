# Finzz — constitución de diseño

## Registro

Finzz es un **producto** web autenticado para registrar, consultar y entender gastos personales. La interfaz debe comportarse como un instrumento diario: clara, rápida de escanear y confiable, no como una landing de marketing.

## Usuarios y contexto

- Personas que quieren registrar gastos cotidianos sin fricción.
- Personas autenticadas que necesitan revisar su actividad y entender cuánto gastaron en un mes o una semana.
- La sesión puede comenzar desde login, registro o verificación de email.
- El usuario trabaja únicamente con sus propios gastos.
- El contenido está en español y los importes se muestran en soles peruanos (`S/`).

## Propósito y trabajos principales

El producto debe ayudar a:

1. **Operar**: registrar, editar y eliminar un gasto con importe, fecha, categoría y descripción opcional.
2. **Monitorizar**: leer rápidamente el total y la cantidad de gastos del periodo seleccionado.
3. **Comparar**: entender la distribución por categoría y la evolución diaria del gasto.
4. **Explorar**: buscar y recorrer el historial completo con paginación.

### Composición por superficie

- **Dashboard**: composición de monitor, con controles de periodo arriba, KPIs visibles, gráficos como evidencia central y actividad reciente debajo.
- **Historial**: composición de operar/comparar, con búsqueda, tabla estable, acciones por fila y paginación.
- **Login y registro**: composición de configurar, con un formulario enfocado y una sola acción primaria.
- No añadir paneles, secciones o KPIs que no estén respaldados por el MVP actual.

## Voz

- Serena, directa y útil.
- Clara sin sonar técnica ni promocional.
- Los textos deben explicar el estado y el siguiente paso: registrar, guardar, editar, eliminar, reintentar.
- Usar sentence case en español, verbos concretos y mensajes breves.
- Evitar exclamaciones, frases de marketing, adornos y lenguaje culpabilizador en errores.

## Anti-referencias

Finzz no debe parecer:

- una plantilla SaaS genérica con gradientes violeta/azul;
- una app de trading llena de cifras y señales urgentes;
- una hoja de cálculo fría y sin jerarquía;
- una landing centrada en un hero, tarjetas repetidas o llamadas de venta;
- un dashboard oscuro sobrecargado de neón, brillos o efectos decorativos;
- una interfaz con navegación inventada para Perfil, Presupuestos, Categorías u otras áreas fuera del MVP.

## Principios de diseño

- **Claridad antes que densidad**: la primera lectura debe revelar periodo, total y actividad sin buscar.
- **El dato es el material visual**: gráficos y tablas deben explicar gastos reales, no servir como decoración.
- **Una acción primaria por contexto**: guardar gasto, registrar gasto, iniciar sesión o crear cuenta.
- **Profundidad contenida**: usar superficies, bordes y contraste para separar módulos; evitar sombras pesadas y tarjetas anidadas.
- **Ritmo de producto**: usar espaciado consistente en múltiplos de 4px, con separaciones mayores cercanas a 36px para cambios de sección.
- **Estados completos**: cada superficie debe contemplar carga, vacío, error, éxito, deshabilitado, foco y overflow.
- **Responsive real**: el dashboard conserva sus funciones en 320px; la navegación se adapta sin ocultar el historial ni las acciones principales.
- **Evidencia sobre promesas**: un resumen debe mostrar total, cantidad, periodo, categorías y escala temporal cuando esos datos existan.

## Dirección visual

### Fundación objetivo

Las referencias de Finzz establecen una dirección de producto **navy oscuro + verde menta**, con acentos cromáticos controlados para categorías:

- Canvas profundo azul navy, no negro puro.
- Superficies ligeramente elevadas mediante azul translúcido y bordes azulados sutiles.
- Verde menta/turquesa como acción primaria, selección activa, progreso y datos positivos.
- Azul, violeta, coral, naranja y tonos claros solo para diferenciar categorías en gráficos y badges.
- Texto principal claro, texto secundario azul grisáceo y estados con texto además de color.
- El acento menta debe ser escaso y significativo, no inundar la pantalla.

El código actual contiene una base marfil/blanca con acento terracota (`apps/frontend/src/index.css`). Esa base es un estado implementado existente, no la dirección de referencia final. Cualquier cambio visual debe decidir explícitamente si mantiene esa base o avanza la interfaz hacia navy/menta; no mezclar ambas paletas sin una regla de migración coherente.

### Tipografía

- Priorizar una sans-serif legible y sobria, con números claros para importes y métricas.
- Mantener contraste evidente entre título, subtítulo, etiqueta y detalle.
- Los importes, fechas y porcentajes deben ser escaneables; alinear cifras en tablas y leyendas.
- Mantener una medida de lectura cómoda, evitando párrafos largos en el dashboard.

### Forma y profundidad

- Bordes sutiles y radios moderados, coherentes entre sidebar, superficies, formularios y tablas.
- Nada de tarjetas dentro de tarjetas salvo que exista una relación funcional clara.
- Los gráficos deben tener fondo transparente, grid discreto, tooltips oscuros y animación contenida.
- El logo de Finzz es un activo existente y debe conservar su presencia en autenticación y navegación.

## Reglas de componentes

- **Shell autenticado**: sidebar de escritorio con logo, Dashboard, Historial y usuario/salida; en móvil, navegación superior compacta con las mismas opciones.
- **Dashboard**: toggle Mensual/Semanal mutuamente excluyente; selector del mes o semana; dos KPIs; gráfico temporal; donut por categoría; actividad reciente.
- **Historial**: buscador visible, total discreto, tabla con Descripción, Categoría, Fecha, Importe y Acciones; diez registros por página; paginación coherente con búsqueda.
- **Formulario de gasto**: etiquetas siempre visibles para importe, fecha, categoría y descripción; botón de guardar con estado de progreso; cancelación clara en edición.
- **Acciones destructivas**: eliminar requiere confirmación y debe comunicar el progreso y el resultado; usar rojo solo para esa intención.
- **Badges y categorías**: diferenciar por color, texto y/o icono; nunca depender únicamente del color.
- **Feedback**: mensajes de éxito con `role="status"`, errores con `role="alert"`, y estados vacíos que expliquen qué falta y cómo llenarlo.
- **Botones**: verbos concretos, áreas táctiles de al menos 44px y estados hover, active, focus-visible, loading y disabled.

## Accesibilidad y responsive

- HTML semántico y controles nativos antes que roles ARIA innecesarios.
- Foco visible con `:focus-visible`, contraste suficiente y orden de teclado lógico.
- Formularios con labels persistentes; placeholders solo como ejemplo.
- Tablas con encabezados y acciones comprensibles fuera de contexto.
- Gráficos acompañados por títulos, labels accesibles y datos legibles en texto cuando sea necesario.
- Dialogs de edición deben gestionar foco, cierre y retorno al control que los abrió.
- Soportar zoom al 200%, reflow a 320px y campos de al menos 16px en móvil para evitar zoom automático en iOS.
- Respetar `prefers-reduced-motion`; animar principalmente transform y opacity.

## Alcance visual respaldado por el MVP

Implementado o previsto dentro del alcance actual:

- autenticación, verificación de email y protección de rutas;
- CRUD de gastos personales;
- ocho categorías globales de solo lectura;
- resumen mensual y semanal con totales, cantidades, distribución por categoría y series diarias;
- historial con búsqueda, edición, eliminación y paginación;
- estados de carga, error, éxito y lista vacía.

No diseñar como si existieran presupuestos, ingresos, balances, gastos recurrentes, importación bancaria, exportación, multi-moneda, categorías personalizadas, cuentas compartidas o comparativas históricas entre meses.
