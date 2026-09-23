# Finzz

Finzz es una aplicación web para registrar, organizar y consultar gastos personales de forma rápida y sencilla. Cada persona trabaja con su propia cuenta y solo puede acceder a sus gastos.

El alcance actual se centra en:

- Registrar gastos con importe, fecha, categoría y descripción.
- Clasificar los gastos mediante categorías predefinidas.
- Consultar, editar y eliminar gastos propios.
- Consultar un resumen mensual y semanal con el importe total, la cantidad de gastos y la distribución por categoría.

> Nota: el código actual implementa el resumen mensual y semanal.

## Funcionalidades

### Autenticación

- Registro con nombre, email y contraseña.
- Inicio y cierre de sesión.
- Verificación de email mediante InsForge.
- Protección de las rutas privadas del frontend.
- Validación de tokens JWT en el backend.

### Gestión de gastos

- Alta, consulta, edición y eliminación de gastos.
- Validación de datos en frontend y backend.
- Importe positivo con hasta dos decimales.
- Fecha del gasto.
- Descripción opcional de hasta 500 caracteres.
- Categoría obligatoria.
- Confirmación antes de eliminar un gasto.
- Estados de carga, error, éxito y lista vacía.

### Categorías disponibles

Las categorías iniciales se crean mediante la migración de base de datos:

- Alimentación
- Transporte
- Vivienda
- Servicios
- Salud
- Ocio
- Educación
- Otros

Las categorías son un catálogo global de solo lectura en la aplicación actual; no se pueden crear ni modificar desde la interfaz.

### Resumen mensual

El dashboard permite seleccionar un mes y muestra:

- Importe total gastado durante el mes.
- Número de gastos registrados.
- Importe y porcentaje de cada categoría utilizada.
- Barras visuales accesibles para comparar el peso de cada categoría.
- Estado vacío cuando no hay gastos en el periodo seleccionado.
- Actualización después de crear, editar o eliminar un gasto.

## Arquitectura

El proyecto está organizado como un workspace de Bun con dos aplicaciones:

```text
apps/
├── backend/    API Fastify y acceso a datos mediante InsForge
└── frontend/   Aplicación SolidJS con Vite
migrations/     Migraciones SQL de la base de datos
```

El backend deriva el propietario del gasto del `sub` del token autenticado y filtra las consultas por ese usuario. La base de datos también utiliza Row Level Security (RLS) para reforzar el aislamiento entre cuentas.

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| **Runtime y package manager** | Bun |
| **Frontend** | SolidJS + Vite |
| **Backend** | Fastify |
| **Base de datos y backend gestionado** | InsForge sobre PostgreSQL |
| **Cliente de datos y autenticación** | `@insforge/sdk` |
| **Validación** | Zod |
| **Verificación JWT** | `jose` mediante JWKS |
| **Estilos** | CSS propio |
| **Tests backend** | Bun test |
| **Tests frontend** | Vitest + Solid Testing Library |

## Estructura relevante

```text
apps/backend/src/
├── auth/                    Autenticación y validación JWT
├── expenses/                Rutas, esquemas y repositorio de gastos
└── routes/                  Rutas de salud y usuario actual

apps/frontend/src/
├── components/              Formulario, lista y resumen de gastos
├── lib/                     Clientes de autenticación y API
├── pages/                   Login, registro y dashboard
└── App.tsx                  Rutas principales de la aplicación

migrations/
└── 20260912160502_create-expenses.sql
```

## Requisitos

- Bun instalado.
- Un proyecto de InsForge configurado.
- Una base de datos de InsForge con la migración de `migrations/` aplicada.

## Configuración local

### Backend

Crea `apps/backend/.env` con las variables necesarias:

```env
INSFORGE_JWKS_URL=https://<tu-proyecto>.insforge.app/.well-known/jwks.json
INSFORGE_JWT_SECRET=<opcional>
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

`INSFORGE_JWT_SECRET` solo es necesario si se habilita la validación alternativa HS256. El backend requiere `INSFORGE_JWKS_URL` para validar los tokens.

### Frontend

Crea `apps/frontend/.env` con:

```env
VITE_INSFORGE_URL=https://<tu-proyecto>.insforge.app
VITE_INSFORGE_ANON_KEY=<clave-anonima-de-insforge>
VITE_API_URL=http://localhost:3000
```

No incluyas claves, secretos ni archivos `.env` en el control de versiones.

## Ejecución en desarrollo

Desde la raíz del proyecto, puedes iniciar frontend y backend en paralelo:

```bash
bun dev
```

También puedes iniciarlos por separado:

```bash
cd apps/backend
bun run dev
```

```bash
cd apps/frontend
bun run dev
```

Por defecto, el backend escucha en `http://localhost:3000` y Vite sirve el frontend en `http://localhost:5173`.

## API principal

Todas las rutas de gastos y categorías requieren autenticación mediante un token Bearer.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/health` | Comprueba que la API está disponible. |
| `GET` | `/api/auth/me` | Devuelve el usuario autenticado. |
| `GET` | `/api/expense-categories` | Lista las categorías disponibles. |
| `GET` | `/api/expenses` | Lista los gastos del usuario autenticado. |
| `GET` | `/api/expenses/summary?month=YYYY-MM` | Devuelve el resumen mensual del usuario. |
| `POST` | `/api/expenses` | Crea un gasto. |
| `PATCH` | `/api/expenses/:id` | Actualiza un gasto propio. |
| `DELETE` | `/api/expenses/:id` | Elimina un gasto propio. |

Las respuestas de datos siguen la forma `{ "data": ... }`. Los errores usan la forma `{ "error": { "code", "message", "details" } }` cuando hay información adicional.

## Tests y validación

Backend:

```bash
cd apps/backend
bun test
bun run typecheck
```

Frontend:

```bash
cd apps/frontend
bun run test
bun run typecheck
bun run build
```

Los tests cubren autenticación, protección de rutas, CRUD de gastos, validación del resumen mensual, aislamiento por usuario y estados principales de la interfaz.

## Alcance fuera del MVP actual

Estas funciones no forman parte de la aplicación actual:


- Presupuestos y límites por categoría.
- Registro de ingresos y cálculo de balance.
- Gastos recurrentes y notificaciones.
- Importación bancaria.
- Exportación a CSV o PDF.
- Categorías personalizadas.
- Multi-moneda.
- Compartición de cuentas o gastos.
- Comparativas y tendencias históricas entre meses.
