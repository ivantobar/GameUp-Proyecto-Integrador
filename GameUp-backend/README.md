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

> Estado actual: fase 2. Base común (autenticación global con la API de
> seguridad, roles, errores uniformes), login/sesión y cuentas de GameUP.
> Los demás módulos de negocio se agregan por fases. El
> esquema de la base (20 tablas) está en `prisma/schema.prisma` y sus reglas
> (triggers, CHECK, RLS) en `prisma/migrations/`.

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
| `npm run db:generate` | Regenera el cliente de Prisma (`src/generated/prisma`) |
| `npm run db:deploy` | Aplica las migraciones pendientes |
| `npm run db:studio` | Abre Prisma Studio para ver los datos |

- El esquema está en `prisma/schema.prisma`; las migraciones, en `prisma/migrations/`
  (ver `prisma/MIGRACIONES.md`).
- **Nunca** ejecutes `prisma migrate dev`, `migrate reset` ni `db push` contra
  Supabase: compararía el historial y ofrecería borrar la base. Un cambio de
  esquema es una migración nueva escrita a mano, probada en PostgreSQL local
  (`prisma/pruebas/README.md`); después `npx prisma db pull` contra esa base
  local y `npm run db:generate`. No edites migraciones ya aplicadas.
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
| `PUBLIC_URL` | No | — | URL pública del backend desplegado (servidor "Producción" en Swagger) |
| `TRUST_PROXY_HOPS` | No | `0` | Proxies delante del backend (`1` en Render) |
| `SUPABASE_URL` | No | — | URL del proyecto de Supabase (Auth/Storage) |
| `SUPABASE_SECRET_KEY` | No | — | Clave secreta de Supabase (**solo backend**) |
| `SEGURIDAD_API_URL` | No* | — | URL base de la API de seguridad (login y perfil). *Sin ella, el login y las rutas protegidas responden 503 |
| `SEGURIDAD_API_TIMEOUT_MS` | No | `5000` | Espera máxima por llamada a la API de seguridad |
| `AUTH_CACHE_TTL_SEG` | No | `300` | Segundos que se recuerda un token verificado (máx. 300 y nunca más que su `exp`) |

Se validan al arrancar (`src/config/env.validation.ts`). Si falta
`DATABASE_URL` o algo es inválido, la app no inicia y muestra el error.

## 7. Documentación con Swagger

Con el backend encendido:

- Página interactiva: http://localhost:3000/api-docs
- Especificación OpenAPI (JSON): http://localhost:3000/api-docs.json

Se configura en `src/docs/swagger.ts` con `@nestjs/swagger`. Para documentar
un módulo nuevo, en su controlador:

```ts
@ApiTags('actividades')          // sección en la página
@ApiBearerAuth(BEARER_AUTH)      // si pide token (botón "Authorize")
@ApiOkResponse({ type: ActividadDto })
```

y en los DTO, `@ApiProperty({ example: ... })` en cada campo.

## 8. Autenticación, permisos y errores

- **Toda ruta exige token** (`Authorization: Bearer <token>`) salvo las
  marcadas con `@Public()` (`health` y, desde la fase 2, `auth/login`).
- El token es el JWT de la **API de seguridad** (otro grupo). `AuthGuard`
  (global) lo verifica llamando a `GET <SEGURIDAD_API_URL>/api/auth/perfil`
  y guarda el resultado en memoria hasta 5 minutos (la clave es el SHA-256
  del token, nunca el token). Luego busca la cuenta en la tabla `usuario`
  por `id_usuario_auth`:
  - sin cuenta en GameUP, cuenta inactiva, rol DONANTE/desconocido, o rol
    externo que no coincide con el local → **403** con un mensaje claro;
  - el mapeo de roles (ADMIN → DIRECTORA, TALLERISTA, ACUDIENTE, ESTUDIANTE)
    vive solo en `src/modules/auth/domain/mapeador-roles.ts`.
- **Dos niveles de autorización:** `@Roles('DIRECTORA', ...)` en la ruta
  (`RolesGuard`) y, en el servicio, la relación con el estudiante
  (tallerista a cargo, acudiente vinculado, el propio estudiante). Si el
  estudiante no le corresponde, la respuesta es **404**.
- En el controlador: `@UsuarioActual() usuario: UsuarioAutenticado`
  (`{ id, idUsuarioAuth, rol }`) y `@Param('id', ParseBigIntPipe) id: bigint`.
- **Errores:** los servicios lanzan errores de dominio
  (`src/common/errors/dominio.errors.ts`) y el filtro global responde siempre
  `{ statusCode, error, message }`:

| Error | HTTP |
|---|---|
| `RecursoNoEncontradoError` | 404 |
| `AccesoDenegadoError` | 403 |
| `ReglaNegocioError` | 422 |
| `ConflictoError` | 409 |
| `NoAutenticadoError` | 401 |
| `ServicioExternoNoDisponibleError` | 503 |
| Base: único (23505) / FK (23503) / CHECK o trigger (23514) / vínculo (42501) | 409 / 422 / 422 / 403 |
| Cualquier otro | 500 genérico (sin traza ni SQL) |

### Endpoints de sesión y cuentas (fase 2)

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `POST /auth/login` | público | `{ correo, contrasena }` → reenvía a la API de seguridad y devuelve `{ token, expiraEn, usuario: { userId, role, displayName } }`. Sincroniza nombres, apellidos y correo en `usuario` |
| `GET /auth/me` | cualquier sesión | `{ userId, role, displayName }` |
| `POST /auth/logout` | cualquier sesión | 204. GameUP olvida el token de su caché; la app debe descartarlo |
| `POST /usuarios` | directora | Alta de la copia mínima (para ESTUDIANTE crea también `estudiante`) |
| `GET /usuarios?rol&activo&page&limit` | directora | Listado paginado |
| `GET /usuarios/:id` | directora | Una cuenta |
| `PATCH /usuarios/:id/estado` | directora | `{ activo }`. Una cuenta inactiva recibe 403 |

`role` usa los nombres de la app: `director`, `teacher`, `guardian`, `student`.

### Primera directora

`POST /usuarios` solo lo puede usar una directora, así que la primera se crea
una sola vez con `prisma/scripts/alta_primera_directora.sql` (instrucciones
dentro del archivo). La persona debe existir antes en la API de seguridad con
rol ADMIN. El script se niega a correr si ya hay una directora o si falta
reemplazar algún valor.

```bash
# Probar (con el backend encendido y SEGURIDAD_API_URL configurada):
curl -s -X POST localhost:3000/api/v1/auth/login   -H 'Content-Type: application/json'   -d '{"correo":"directora@ejemplo.com","contrasena":"..."}'
curl -s localhost:3000/api/v1/auth/me -H "Authorization: Bearer $TOKEN"
curl -s localhost:3000/api/v1/usuarios -H "Authorization: Bearer $TOKEN"
```

## 9. Despliegue en Render

El archivo `render.yaml` (en la raíz del repositorio) define el servicio.
En Render: **New > Blueprint**, elegir el repositorio y completar
`DATABASE_URL` (Supabase, *Session pooler*), `PUBLIC_URL` y, si se usan,
`SUPABASE_URL` y `SUPABASE_SECRET_KEY`. Los secretos solo se guardan en Render.

- API: `https://<servicio>.onrender.com/api/v1/health`
- Swagger: `https://<servicio>.onrender.com/api-docs`

En el plan gratuito el servicio se duerme tras 15 minutos sin uso; la primera
petición después tarda cerca de un minuto.

## 10. Diferencias con `proyecto-integrador-backend`

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

## 11. Estructura

```
prisma/
└── schema.prisma            # Modelos de la base de datos
prisma/scripts/
└── alta_primera_directora.sql  # Se ejecuta una sola vez, a mano
prisma.config.ts             # Configuración de la CLI de Prisma
src/
├── main.ts                  # Punto de entrada: escucha en 0.0.0.0:PORT
├── app.module.ts            # Módulo raíz
├── app.setup.ts             # Prefijo /api/v1, helmet, CORS opcional, validación
├── config/
│   └── env.validation.ts    # Validación de variables de entorno
├── common/                  # Lo transversal
│   ├── auth/                # AuthGuard, RolesGuard, @Public, @Roles, @UsuarioActual,
│   │   │                    # puertos VerificadorToken y ResolutorUsuario
│   │   └── seguridad-api/   # Adaptador: GET /api/auth/perfil con caché
│   ├── errors/              # Errores de dominio y filtro global
│   ├── ids/                 # bigint ⇄ string, @IsIdNumerico()
│   ├── paginacion/          # ?page&limit (máx. 50)
│   ├── pipes/               # ParseBigIntPipe
│   └── reloj/               # Puerto Reloj (hora inyectable)
├── modules/                 # Un módulo por agregado del dominio
│   ├── auth/                # Login, /auth/me, logout; MapeadorRoles; guards globales
│   └── usuarios/            # Cuentas de GameUP (directora)
├── docs/
│   └── swagger.ts           # /api-docs
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
├── dobles/                  # Repositorios en memoria y APIs externas simuladas
├── auth.e2e-spec.ts
├── health.e2e-spec.ts
└── swagger.e2e-spec.ts
```

### Convenciones

- **Un módulo por agregado** en `src/modules/<modulo>/` con capas
  `domain/` (entidad + puerto del repositorio), `application/` (servicio),
  `infrastructure/` (repositorio Prisma + mapper) y `presentation/`
  (controlador + DTO). Los servicios dependen de interfaces + tokens
  (`@Inject(TOKEN)`), nunca de Prisma.
- **Ids:** `bigint` en las entidades; `string` en los DTO (entrada y salida).
- **Módulos ES:** los imports locales terminan en `.js`
  (`import { X } from './x.service.js'`), aunque el archivo sea `.ts`.
- **Tipos con `import type`** (lo exige `verbatimModuleSyntax`):
  `import type { INestApplication } from '@nestjs/common'`.
- Los DTO se validan con `class-validator`; el `ValidationPipe` global
  rechaza campos no declarados.
