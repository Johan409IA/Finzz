# Proposal: Auth integrada con InsForge

## Why

Finzz será una aplicación pública multiusuario. Antes de habilitar cualquier funcionalidad financiera, el backend y el frontend necesitan un flujo de autenticación basado en InsForge que identifique de forma fiable al usuario autenticado y aísle sus datos mediante `usuario_id`.

## What Changes

- Añadir registro, inicio de sesión, cierre de sesión y recuperación del estado de sesión en el frontend mediante el SDK de auth de InsForge.
- Proteger las rutas del backend con validación del JWT emitido por InsForge.
- Extraer `usuario_id` desde el claim `sub` y exponerlo al contexto de cada request autenticado.
- Rechazar tokens ausentes, inválidos, expirados o emitidos para otra audiencia/emisor.
- Añadir protección de rutas de frontend para mostrar la aplicación solo con una sesión válida.
- Definir el contrato común de autenticación que usarán las capabilities posteriores.

## Out of Scope

- No se implementa autenticación propia en Fastify.
- No se crea una tabla de usuarios de negocio.
- No se implementan roles o permisos de negocio adicionales más allá de validar el claim `role` del JWT según lo requiera InsForge.
- No se implementan todavía categorías, transacciones ni otras funcionalidades financieras.

## Dependencies

- Módulo de autenticación de InsForge y su SDK frontend.
- Configuración de issuer, audience y claves necesarias para verificar JWT.
- Backend Fastify y frontend SolidJS existentes.

## Success Criteria

- Una persona puede registrarse, iniciar sesión, cerrar sesión y recuperar una sesión existente desde el frontend.
- Una request con JWT válido llega al handler de Fastify con `usuario_id = claims.sub`.
- Las requests sin JWT o con JWT inválido reciben `401` y no ejecutan handlers protegidos.
- Los claims `sub`, `email`, `role`, `exp`, `iss` y `aud` se validan conforme a la configuración de InsForge.
- Las capabilities posteriores pueden obtener el usuario autenticado desde un contexto común sin duplicar la validación.
