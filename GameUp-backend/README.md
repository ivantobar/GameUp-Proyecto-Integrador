# GameUP — Backend

API de **GameUP**, la aplicación móvil de aula virtual inclusiva de la
Fundación ASISCO-UP.

- **Node.js + NestJS 12** (TypeScript, módulos ES).
- **Prisma 7 + `@prisma/adapter-pg`** para PostgreSQL, con la misma
  configuración que `proyecto-integrador-backend` (`prisma.config.ts`,
  `DATABASE_URL`, `dotenv`).
- **Supabase**: PostgreSQL en la nube y, más adelante, Auth y Storage
  (grabaciones de voz).
- Pensada para una **app móvil** (React Native + Expo Go): sin CORS por
  defecto y escuchando en la red local para que el celular pueda llegar.

> Estado actual: configuración inicial. Solo existe `GET /api/v1/health`.
> El esquema de Prisma aún no tiene modelos; se agregarán al definir el
> modelo de datos.

---

## 1. Requisitos

| Herramienta | Versión | Comprobar con |
|---|---|---|
| Node.js | **22.18+** o **24.11+** (lo exigen Prisma 7 y Supabase) | `node -v` |
| npm | 10 o superior (en clase: 12) | `npm -v` |
| PostgreSQL | Local (como en clase) **o** un proyecto de Supabase | — |

Todos los comandos se ejecutan en una terminal **bash** (en Windows: Git Bash),
desde la carpeta `GameUp-backend`.

## 2. Instalación (primera vez)

```bash
npm install            # instala dependencias y ejecuta `prisma generate`
cp .env.example .env   # crea tu archivo de variables
```

Edita `.env` y pon tu `DATABASE_URL`:

- **PostgreSQL local:** `postgresql://postgres:TU_CLAVE@localhost:5432/gameup?schema=public`
  (crea antes la base `gameup`, por ejemplo con pgAdmin).
- **Supabase:** en el proyecto, botón **Connect** → cadena **Session pooler**
  (puerto 5432). Reemplaza `[YOUR-PASSWORD]` por la clave de la base de datos.

## 3. Ejecutar

```bash
npm run start:dev
```

Abre <http://localhost:3000/api/v1/health>. Respuesta esperada:

```json
{ "status": "ok", "service": "gameup-backend", "timestamp": "...", "database": "conectada", "supabase": "no_configurado" }
```

Si `database` dice `"error"`, revisa `DATABASE_URL` y que PostgreSQL esté
encendido. La consola también lo indica al arrancar.

### Conectar la app móvil (Expo Go)

El celular no entiende `localhost` (para él, `localhost` es el propio celular).
Debe usar la **IP local del computador**, y ambos deben estar en la
**misma red Wi-Fi**:

1. Busca la IP del PC: `ipconfig` → "Dirección IPv4" (ej. `192.168.1.20`).
2. Desde el navegador del celular abre `http://192.168.1.20:3000/api/v1/health`.
3. Si no responde, permite Node.js en el Firewall de Windows (redes privadas).
4. En el frontend, la URL base de la API será `http://192.168.1.20:3000/api/v1`
   (se configura en el `.env` del frontend, no en este).

## 4. Prisma

| Comando | Para qué |
|---|---|
| `npm run db:migrate -- --name nombre` | Crea una migración a partir de `schema.prisma` y la aplica (desarrollo) |
| `npm run db:generate` | Regenera el cliente de Prisma (`src/generated/prisma`) |
| `npm run db:deploy` | Aplica migraciones pendientes (producción) |
| `npm run db:studio` | Abre Prisma Studio para ver los datos |

- El esquema está en `prisma/schema.prisma`; las migraciones, en `prisma/migrations/`.
- El cliente se genera en `src/generated/prisma` (no se sube a Git; se
  regenera con `npm install`).
- Para usarlo en un servicio: `constructor(private readonly prisma: PrismaService) {}`.
- Prisma se conecta como dueño de la base de datos (salta RLS), así que **los
  permisos por rol se verifican siempre en NestJS** antes de consultar.

### `allowScripts` (npm 12)

npm 12 solo ejecuta los scripts de instalación de dependencias aprobadas.
`package.json` ya aprueba `prisma` y `@prisma/engines`, igual que en clase.
Si al actualizar Prisma npm avisa de scripts bloqueados:
`npm approve-scripts prisma @prisma/engines`.

## 5. Scripts

| Comando | Para qué |
|---|---|
| `npm run start:dev` | Desarrollo con recarga automática |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada (`node dist/main`) |
| `npm test` | Pruebas unitarias (Vitest, `*.spec.ts`) |
| `npm run test:e2e` | Pruebas de extremo a extremo (`test/*.e2e-spec.ts`) |
| `npm run lint` | Revisión de código (oxlint) |
| `npm run format` | Formatea el código (Prettier) |

## 6. Variables de entorno

| Variable | Obligatoria | Por defecto | Descripción |
|---|---|---|---|
| `DATABASE_URL` | **Sí** | — | Conexión a PostgreSQL usada por Prisma |
| `NODE_ENV` | No | `development` | `development`, `production` o `test` |
| `PORT` | No | `3000` | Puerto de la API |
| `CORS_ORIGINS` | No | — | Solo para probar en navegador (Expo web). La app móvil no lo usa |
| `SUPABASE_URL` | No | — | URL del proyecto de Supabase (Auth/Storage) |
| `SUPABASE_SECRET_KEY` | No | — | Clave secreta de Supabase (**solo backend**) |

Se validan al arrancar (`src/config/env.validation.ts`). Si falta
`DATABASE_URL` o algo es inválido, la app no inicia y muestra el error.

## 7. Diferencias con `proyecto-integrador-backend`

| Clase | GameUP | Motivo |
|---|---|---|
| TypeScript 7 | TypeScript 6 | El compilador de NestJS todavía no funciona con TS 7 (se espera en 7.1) |
| `tsx` para ejecutar | `npm run start:dev` | NestJS ya trae su propio modo de desarrollo |
| `output = "../generated/prisma"` | `../src/generated/prisma` | Para que `nest build` lo compile junto con la app |
| `"target": "esnext"` | `"ES2023"` | Garantiza que Node 22 entienda todo el código compilado |
| `"jsx": "react-jsx"` | (no se usa) | El backend no tiene JSX; eso va en la app móvil |

Igual que en clase: módulos ES, `strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `verbatimModuleSyntax`, Prisma 7 con
`adapter-pg`, `prisma.config.ts` con `dotenv` y `allowScripts`.

## 8. Estructura

```
prisma/
└── schema.prisma            # Modelos de la base de datos
prisma.config.ts             # Configuración de la CLI de Prisma
src/
├── main.ts                  # Punto de entrada: escucha en 0.0.0.0:PORT
├── app.module.ts            # Módulo raíz
├── app.setup.ts             # Prefijo /api/v1, helmet, CORS opcional, validación
├── config/
│   └── env.validation.ts    # Validación de variables de entorno
├── prisma/
│   ├── prisma.module.ts     # Módulo global
│   └── prisma.service.ts    # Cliente de Prisma (adapter-pg)
├── supabase/
│   ├── supabase.module.ts
│   └── supabase.service.ts  # Cliente de Supabase (Auth/Storage)
├── health/
│   └── health.controller.ts # GET /api/v1/health
└── generated/prisma/        # Generado por Prisma (no se sube a Git)
test/
└── health.e2e-spec.ts
```

### Convenciones

- **Un módulo por dominio** (`auth`, `users`, `students`, `activities`,
  `submissions`, `progress`, …): `npx nest g resource nombre`.
- **Módulos ES:** los imports locales terminan en `.js`
  (`import { X } from './x.service.js'`), aunque el archivo sea `.ts`.
- **Tipos con `import type`** (lo exige `verbatimModuleSyntax`):
  `import type { INestApplication } from '@nestjs/common'`.
- Los DTO se validan con `class-validator`; el `ValidationPipe` global
  rechaza campos no declarados.
