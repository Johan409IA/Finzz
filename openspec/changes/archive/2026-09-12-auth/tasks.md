# Tasks: Auth integrada con InsForge

## 1. Confirmar integración de InsForge

- [x] Confirmar el paquete y la versión del SDK de auth de InsForge para frontend.
- [x] Confirmar la API de `auth.getCurrentUser()`, registro, login, logout y refresco automático.
- [x] Confirmar el formato y el transporte de sesión entre Vercel y Render.
- [x] Confirmar issuer, audience y mecanismo de verificación JWT: JWKS, clave pública o endpoint oficial.
- [x] Documentar las variables de entorno necesarias sin incluir secretos en el repositorio.

## 2. Preparar el cliente de auth en SolidJS

- [x] Configurar el cliente InsForge con variables de entorno del frontend.
- [x] Implementar registro y login usando el SDK oficial.
- [x] Implementar registro con `redirectTo` dinámico hacia `/login` para verificación por enlace.
- [x] Implementar logout y recuperación inicial mediante `auth.getCurrentUser()`.
- [x] Modelar los estados de sesión: cargando, autenticado y no autenticado.
- [x] Resolver sesiones ausentes o errores de refresh como estado `anonymous`, sin dejar la aplicación en carga indefinida.
- [x] Configurar requests cross-origin con credentials según el mecanismo confirmado.
- [x] Mostrar errores de credenciales, sesión expirada y red de forma segura.

## 3. Implementar protección de rutas frontend

- [x] Añadir una guardia o layout para rutas protegidas.
- [x] Esperar a la resolución de la sesión antes de redirigir.
- [x] Redirigir a login cuando no existe una sesión válida.
- [x] Evitar que el contenido protegido se renderice durante una sesión no resuelta.
- [x] Mantener accesibles las rutas de login y registro para una persona no autenticada.

## 4. Implementar validación JWT en Fastify

- [x] Configurar el verificador JWT con el mecanismo oficial de InsForge: los tokens nativos de acceso son RS256 con `kid`, verificados contra el JWKS público del proyecto (`/.well-known/jwks.json`); HS256 con `JWT_SECRET` queda como fallback para tokens internos/legacy.
- [x] Registrar un plugin/hook reutilizable para proteger endpoints.
- [x] Validar firma RS256 vía JWKS, algoritmo permitido, `kid` y `exp`. Los tokens nativos de InsForge no incluyen `iss` ni `aud`, así que el backend no los exige.
- [x] Exigir los claims `sub`, `role` y `exp`; `email` se expone si viene en el token.
- [x] Crear el contexto autenticado con `usuarioId` derivado exclusivamente de `sub`.
- [x] Rechazar tokens ausentes o inválidos con `401` antes de ejecutar el handler.
- [x] No aceptar `usuario_id` del body, query o params como identidad autenticada.
- [x] Configurar CORS y cookies/headers de acuerdo con los dominios de Vercel y Render.

## 5. Exponer contrato para capabilities posteriores

- [x] Definir el tipo/contexto común de usuario autenticado.
- [x] Documentar cómo una ruta protegida obtiene `usuarioId`.
- [x] Establecer que todas las queries de negocio filtran por `usuarioId`.
- [x] Reservar `403` para futuras reglas de rol sin implementar autorización adicional ahora.

## 6. Probar la capability

- [x] Probar tokens RS256 reales de InsForge y extracción correcta de `sub` (login E2E con Playwright en Edge).
- [x] Probar token ausente, expirado, con firma inválida, `kid` desconocido o claims obligatorios ausentes.
- [x] Probar que un request no autenticado no ejecuta el handler.
- [x] Probar que un `usuario_id` enviado por request no puede sustituir al `sub` del token.
- [x] Probar registro, login, recuperación de sesión, logout y redirecciones del frontend con Playwright en Edge.
- [x] Verificar que el registro envía un `redirectTo` autorizado y que InsForge acepta la solicitud.
- [x] Ejecutar typecheck, lint, tests y build del backend y frontend.
