# Expenses

## Purpose

Esta capability cubre la gestión de gastos personales de Finzz: crear, consultar, editar y eliminar gastos asociados a la cuenta autenticada, el catálogo inicial de categorías, la interfaz de gestión dentro de una ruta protegida y el aislamiento de datos por usuario.

## Requirements

### Requirement: Crear gasto personal
El sistema SHALL permitir a una persona autenticada crear un gasto asociado a su propia cuenta con importe positivo, fecha, categoría y descripción opcional.

#### Scenario: Creación exitosa
- **WHEN** una persona autenticada envía un importe positivo, una fecha válida, una categoría disponible y una descripción válida o vacía
- **THEN** el sistema guarda el gasto asociado al `sub` del token autenticado y devuelve el gasto creado

#### Scenario: Importe inválido
- **WHEN** una persona autenticada intenta crear un gasto con importe cero, negativo, ausente o con formato no numérico
- **THEN** el sistema rechaza la operación con un error de validación y no guarda el gasto

#### Scenario: Categoría no disponible
- **WHEN** una persona autenticada intenta crear un gasto con una categoría que no pertenece al catálogo disponible
- **THEN** el sistema rechaza la operación con un error de validación y no guarda el gasto

#### Scenario: Usuario no autenticado
- **WHEN** una persona sin una sesión válida intenta crear un gasto
- **THEN** el sistema responde `401 Unauthorized` y no guarda ningún dato

### Requirement: Consultar gastos propios
El sistema SHALL permitir a una persona autenticada consultar únicamente sus gastos, ordenados por fecha descendente y, en caso de empate, por fecha de creación descendente.

#### Scenario: Consulta con gastos
- **WHEN** una persona autenticada solicita su lista de gastos
- **THEN** el sistema devuelve sus gastos ordenados según la regla definida y no incluye gastos de otras cuentas

#### Scenario: Consulta sin gastos
- **WHEN** una persona autenticada solicita su lista y todavía no tiene gastos
- **THEN** el sistema devuelve una lista vacía sin error

#### Scenario: Usuario no autenticado
- **WHEN** una persona sin una sesión válida solicita la lista de gastos
- **THEN** el sistema responde `401 Unauthorized`

### Requirement: Editar gasto propio
El sistema SHALL permitir a una persona autenticada modificar un gasto propio manteniendo la asociación con su cuenta autenticada.

#### Scenario: Edición exitosa
- **WHEN** una persona autenticada envía cambios válidos para un gasto que le pertenece
- **THEN** el sistema actualiza el gasto y devuelve sus valores actualizados

#### Scenario: Intento de editar gasto ajeno
- **WHEN** una persona autenticada intenta modificar un gasto asociado a otra cuenta
- **THEN** el sistema rechaza la operación como no encontrada o no autorizada y no modifica el gasto

#### Scenario: Edición con datos inválidos
- **WHEN** una persona autenticada intenta modificar un gasto con un importe, fecha o categoría inválidos
- **THEN** el sistema rechaza la operación con un error de validación y conserva los valores anteriores

### Requirement: Eliminar gasto propio
El sistema SHALL permitir a una persona autenticada eliminar un gasto propio.

#### Scenario: Eliminación exitosa
- **WHEN** una persona autenticada solicita eliminar un gasto que le pertenece
- **THEN** el sistema elimina el gasto y deja de incluirlo en consultas posteriores

#### Scenario: Intento de eliminar gasto ajeno
- **WHEN** una persona autenticada intenta eliminar un gasto asociado a otra cuenta
- **THEN** el sistema rechaza la operación como no encontrada o no autorizada y conserva el gasto

### Requirement: Catálogo inicial de categorías
El sistema SHALL ofrecer un catálogo inicial de categorías para clasificar gastos: alimentación, transporte, vivienda, servicios, salud, ocio, educación y otros.

#### Scenario: Categorías disponibles
- **WHEN** una persona autenticada abre el formulario de gasto o solicita el catálogo
- **THEN** el sistema muestra las categorías iniciales disponibles para selección

#### Scenario: Categoría persistida
- **WHEN** una persona crea o edita un gasto seleccionando una categoría disponible
- **THEN** el sistema persiste la categoría y la devuelve al consultar el gasto

### Requirement: Formulario de gestión de gastos
El frontend SHALL mostrar dentro de una ruta protegida un formulario para crear gastos y una lista de los gastos del usuario autenticado con acciones de edición y eliminación.

#### Scenario: Estado con gastos
- **WHEN** la carga de gastos termina correctamente y existen gastos
- **THEN** la interfaz muestra importe, fecha, categoría, descripción y acciones para editar o eliminar cada gasto

#### Scenario: Estado vacío
- **WHEN** la carga de gastos termina correctamente y no existen gastos
- **THEN** la interfaz muestra un mensaje de lista vacía y una acción clara para registrar el primer gasto

#### Scenario: Carga o error
- **WHEN** la interfaz está cargando gastos o la consulta falla
- **THEN** la interfaz muestra un estado de carga o un mensaje de error sin presentar datos incompletos como si fueran definitivos

#### Scenario: Guardado exitoso
- **WHEN** una persona completa el formulario con datos válidos y guarda el gasto
- **THEN** la interfaz confirma la operación, limpia o actualiza el formulario y refleja el gasto en la lista

### Requirement: Aislamiento de datos por usuario
El sistema SHALL obtener la identidad del propietario exclusivamente de la sesión autenticada y SHALL impedir que los valores enviados por el cliente permitan consultar o modificar gastos de otra cuenta.

#### Scenario: Propietario derivado de la sesión
- **WHEN** una request autenticada incluye un identificador de usuario distinto al `sub` del token o intenta omitirlo
- **THEN** el sistema ignora ese valor y asocia la operación al `sub` validado

#### Scenario: Acceso cruzado bloqueado
- **WHEN** una persona autenticada intenta leer, editar o eliminar un gasto de otra cuenta
- **THEN** el sistema no revela sus datos ni permite la modificación o eliminación
