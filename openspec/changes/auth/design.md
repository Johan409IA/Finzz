# Design: Auth integrada con InsForge

## Context

Todas las capabilities de negocio dependen de identificar al usuario autenticado. InsForge es la autoridad de identidad: gestiona usuarios, sesiones y credenciales. Finzz no replica usuarios ni implementa autenticación propia.

## Architecture

```text
┌──────────────┐     sesión/cookie      ┌──────────────┐
│ SolidJS      │ ◀────────────────────▶ │ InsForge     │
│ auth client  │                         │ Auth         │
└──────┬───────┘                         └──────────────┘
       │ request con JWT/sesión válida
       ▼
┌──────────────┐
│ Fastify      │
│ auth hook    │
└──────┬───────┘
       │ request.user = { usuarioId, email, role }
       ▼
┌──────────────┐
│ Rutas negocio│── filtran siempre por usuarioId
└──────────────┘
```

## Frontend Flow

- El cliente SolidJS usa el SDK de auth de InsForge para registro, login y logout.
- La recuperación de sesión usa `auth.getCurrentUser()` al iniciar la aplicación.
- El SDK refresca automáticamente la sesión mediante la cookie `httpOnly` en navegador.
- La aplicación mantiene tres estados explícitos: cargando sesión, autenticado y no autenticado.
- Las rutas protegidas esperan a que termine la recuperación de sesión; si no hay usuario, redirigen a login.
- Los errores de credenciales, sesión expirada y errores de red se muestran como estados de UI diferenciados.
- El frontend no interpreta el JWT para autorizar operaciones: la autorización de datos la hace el backend.

## Backend Flow

- Fastify registra un hook/plugin de autenticación reutilizable para rutas protegidas.
- **Decisión confirmada en implementación:** los tokens nativos de acceso de InsForge son **RS256** con `kid`, firmados con un par de claves RSA por proyecto, y **no incluyen `iss` ni `aud`**. El backend los verifica contra el JWKS público (`/.well-known/jwks.json`) con `jose` (`createRemoteJWKSet` + `jwtVerify`, algoritmo RS256).
- HS256 con `JWT_SECRET` queda como fallback opcional para tokens internos/legacy (PostgREST), no para tokens de usuario.
- Se validan firma, `kid`, algoritmo y `exp`. Los claims requeridos son `sub`, `role` y `exp`; `email` se expone cuando viene en el token.
- `sub` es obligatorio y se convierte en `usuarioId` del contexto autenticado.
- Si el token falta, no puede verificarse o está expirado, el hook responde `401` sin ejecutar el handler.
- El contexto autenticado se expone con una forma común, por ejemplo `{ usuarioId, email, role }`, para que cada ruta filtre sus queries por `usuarioId`.
- No se acepta `usuario_id` desde params, query strings ni bodies como sustituto del usuario del token.

## Token Transport Decision

La implementación debe seguir el mecanismo soportado por el SDK y el despliegue de InsForge. La sesión se mantiene mediante cookie `httpOnly` en navegador; si la API requiere un header Bearer para las requests al backend, el cliente debe obtener el access token mediante el SDK y enviarlo sin que el backend confíe en valores enviados por el cliente para identificar a otra persona. La tarea de implementación debe confirmar el mecanismo exacto y configurar CORS, credentials y flags `Secure`/`SameSite` de acuerdo con los dominios de Vercel y Render.

## Configuration

Las credenciales y parámetros de entorno se mantienen fuera del repositorio:

- URL/proyecto de InsForge.
- `INSFORGE_JWKS_URL` — JWKS público del proyecto para verificar tokens RS256.
- `INSFORGE_JWT_SECRET` (opcional) — fallback HS256 para tokens internos/legacy.
- Configuración de origen frontend y credenciales CORS.

La aplicación debe fallar de forma explícita al arrancar si falta una configuración necesaria para verificar tokens en producción.

## Error Contract

- `401 Unauthorized`: falta autenticación o el token no es válido.
- `403 Forbidden`: reservado para futuras restricciones de rol; no es necesario para el alcance inicial.
- Los errores no deben incluir tokens, claims completos ni detalles criptográficos sensibles.

## Testing Strategy

- Unit tests para tokens RS256 válidos, expirados, con firma de otra clave, `kid` desconocido y claims obligatorios ausentes.
- Unit tests para el fallback HS256 (aceptado con secreto configurado, rechazado sin él).
- Integration tests para asegurar que el hook bloquea requests no autenticadas y que un handler recibe el `usuarioId` correcto.
- Frontend tests para los estados de carga, sesión válida, sesión inexistente, login exitoso, credenciales inválidas, logout y redirección.
- Tests de aislamiento que demuestren que el contexto autenticado procede del JWT y no de un `usuario_id` enviado en la request.
- Prueba E2E con Playwright en Edge: registro, login con usuario confirmado y verificación de identidad en el backend.

## Open Questions for Implementation

- Confirmar el mecanismo exacto de transporte entre el frontend desplegado en Vercel y el backend desplegado en Render.
