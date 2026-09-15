# Auth

## Purpose

Esta capability cubre la autenticación de la aplicación con InsForge: registro, inicio y cierre de sesión, recuperación y refresco de sesión, protección de rutas del frontend, y la validación de tokens JWT emitidos por InsForge en el backend.

## Requirements

### Requirement: Registro de usuario
El sistema SHALL permitir a una persona registrarse en la aplicación mediante el flujo de autenticación de InsForge.

#### Scenario: Registro exitoso
- **WHEN** una persona no autenticada completa el registro con credenciales válidas a través del SDK de InsForge
- **THEN** el sistema crea la cuenta y envía un enlace de verificación al email, sin iniciar sesión todavía

#### Scenario: Registro con credenciales inválidas
- **WHEN** una persona intenta registrarse con datos inválidos o no permitidos por InsForge
- **THEN** el sistema muestra un error de UI y no crea una sesión autenticada

#### Scenario: Verificación de email por enlace
- **WHEN** la persona abre el enlace de verificación enviado a su email
- **THEN** InsForge confirma el email y redirige a la página de login, que muestra un mensaje para iniciar sesión; si la verificación falla, el login muestra el error correspondiente

### Requirement: Inicio de sesión
El sistema SHALL permitir a un usuario autenticarse en la aplicación mediante el flujo de autenticación de InsForge.

#### Scenario: Login exitoso
- **WHEN** un usuario registrado inicia sesión con credenciales válidas
- **THEN** la sesión se inicia y el usuario queda autenticado en la aplicación

#### Scenario: Login con credenciales incorrectas
- **WHEN** un usuario intenta iniciar sesión con credenciales incorrectas
- **THEN** el sistema muestra un error de credenciales y el usuario no queda autenticado

### Requirement: Cierre de sesión
El sistema SHALL permitir a un usuario autenticado cerrar su sesión mediante el flujo de autenticación de InsForge.

#### Scenario: Logout exitoso
- **WHEN** un usuario autenticado cierra sesión
- **THEN** la sesión termina, el usuario deja de estar autenticado y las rutas protegidas lo redirigen a login

### Requirement: Recuperación de sesión existente
El sistema SHALL recuperar la sesión existente de un usuario al iniciar la aplicación mediante `auth.getCurrentUser()` del SDK de InsForge.

#### Scenario: Sesión existente válida
- **WHEN** la aplicación inicia con una sesión válida gestionada por InsForge
- **THEN** el usuario queda autenticado y puede acceder a las rutas protegidas

#### Scenario: Sesión expirada o inexistente
- **WHEN** la aplicación inicia sin una sesión válida o con una sesión expirada
- **THEN** el usuario no queda autenticado y es redirigido a la pantalla de login

#### Scenario: Recuperación en curso
- **WHEN** la aplicación está recuperando la sesión de un usuario
- **THEN** las rutas protegidas no renderizan contenido privado hasta que termine la recuperación

### Requirement: Refresco automático de sesión
El sistema SHALL refrescar automáticamente la sesión del usuario mediante la cookie httpOnly en navegador según el mecanismo del SDK de InsForge.

#### Scenario: Refresco de sesión
- **WHEN** la sesión de un usuario autenticado puede renovarse mediante el mecanismo de InsForge
- **THEN** la aplicación mantiene al usuario autenticado sin requerir un nuevo login

### Requirement: Validación de JWT en el backend
El backend SHALL validar el JWT emitido por InsForge en cada request protegido antes de ejecutar el handler. Los tokens nativos de InsForge son RS256 con `kid` y se verifican contra el JWKS público del proyecto.

#### Scenario: Token válido
- **WHEN** una request protegida incluye un JWT RS256 válido emitido por InsForge
- **THEN** el handler se ejecuta y el contexto de la request expone `usuarioId`, `email` y `role` derivados del token

#### Scenario: Token ausente
- **WHEN** una request protegida no incluye un token
- **THEN** el backend responde `401 Unauthorized` y el handler no se ejecuta

#### Scenario: Token inválido
- **WHEN** una request protegida incluye un token con firma inválida, `kid` desconocido, expirado, o con claims obligatorios ausentes
- **THEN** el backend responde `401 Unauthorized` y el handler no se ejecuta

### Requirement: Identidad del usuario desde el token
El backend SHALL derivar el `usuarioId` exclusivamente del claim `sub` del JWT validado y nunca de valores enviados por el cliente.

#### Scenario: usuario_id del cliente ignorado
- **WHEN** una request protegida incluye un `usuario_id` en el body, query o params distinto del `sub` del token válido
- **THEN** el backend usa el `sub` del token como identidad autenticada e ignora el valor enviado por el cliente

### Requirement: Claims obligatorios
El backend SHALL exigir los claims `sub`, `role` y `exp` al validar un JWT. Los tokens nativos de InsForge no incluyen `iss` ni `aud`; `email` se expone cuando viene en el token.

#### Scenario: Claims obligatorios presentes
- **WHEN** una request protegida incluye un JWT con `sub`, `role` y `exp` válidos
- **THEN** el backend considera el token válido y ejecuta el handler

#### Scenario: Claims obligatorios ausentes
- **WHEN** una request protegida incluye un JWT al que le falta `sub`, `role` o `exp`
- **THEN** el backend responde `401 Unauthorized` y el handler no se ejecuta

### Requirement: Protección de rutas del frontend
El sistema SHALL proteger las rutas de la aplicación para que una persona no autenticada no acceda a contenido privado.

#### Scenario: Acceso autenticado a ruta protegida
- **WHEN** un usuario autenticado navega a una ruta protegida
- **THEN** la ruta se renderiza normalmente

#### Scenario: Acceso no autenticado a ruta protegida
- **WHEN** una persona no autenticada intenta acceder a una ruta protegida
- **THEN** el sistema la redirige a la pantalla de login

#### Scenario: Rutas de login y registro accesibles
- **WHEN** una persona no autenticada navega a login o registro
- **THEN** las rutas se renderizan y no se exige una sesión válida

### Requirement: Configuración fuera del repositorio
El sistema SHALL leer la configuración de InsForge (URL del proyecto, JWKS público y fallback HS256 opcional) desde variables de entorno, sin incluir secretos en el repositorio. Las URLs de redirección autorizadas SHALL gestionarse en la configuración del proyecto InsForge.

#### Scenario: Configuración completa
- **WHEN** la aplicación arranca con la configuración de InsForge completa en el entorno
- **THEN** la verificación de tokens funciona y las requests autenticadas se procesan

#### Scenario: Configuración incompleta
- **WHEN** la aplicación arranca sin la configuración necesaria para verificar tokens en producción
- **THEN** la aplicación falla de forma explícita al arrancar en lugar de aceptar tokens sin validar
