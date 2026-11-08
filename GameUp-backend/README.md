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

> Estado actual: fase 7. Base común (autenticación global con la API de
> seguridad, roles, errores uniformes), login/sesión, cuentas de GameUP,
> estudiantes con sus vínculos, nivel y consentimiento de voz, y el catálogo
> de contenido (módulos, archivos en Storage y actividades) y las
> asignaciones con su avance, los intentos con las grabaciones de voz, y la
> validación con el progreso oficial.
> Los demás
> módulos de negocio se agregan por fases. El
> esquema de la base (20 tablas) está en `prisma/schema.prisma` y sus reglas
> (triggers, CHECK, RLS) en `prisma/migrations/`.
>
> El avance por fase (rama y commit), las decisiones aprobadas y lo pendiente
> están en [docs/AVANCE.md](docs/AVANCE.md).

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
| `ASISCO_API_URL` | No | — | URL base de ASISCO UP, sin `/api` (ej. `https://proyecto-asiscoup-g1-jvaz.onrender.com`). Activa la integración: consentimiento de voz (`autorizaGrabacionVoz`) y copia de los vínculos de acudientes al iniciar sesión. Sin ella, no se graba voz (falla cerrado) y la directora vincula acudientes a mano |
| `ASISCO_API_TIMEOUT_MS` | No | `5000` | Espera máxima por llamada a ASISCO UP (500 a 30000) |
| `LIMPIEZA_GRABACIONES_MIN` | No | `30` | Cada cuántos minutos se borran de Storage las grabaciones validadas pendientes y las vencidas (30 días). `0` la desactiva |
| `CONSENTIMIENTO_SIMULADO` | No | `false` | **Solo desarrollo**: todos los estudiantes figuran con consentimiento de voz. Prohibido en producción |

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

### Estudiantes y vínculos (fase 3)

| Método y ruta | Quién | Regla de relación |
|---|---|---|
| `GET /estudiantes?estado&nivelId&page&limit` | D, T, A | D: todos · T: a cargo (activo) · A: los suyos |
| `GET /estudiantes/me` | E | El propio |
| `GET /estudiantes/:id` | D, T, A | Si no le corresponde → **404** |
| `GET /estudiantes/:id/historial-nivel` | D, T, A | Igual que arriba |
| `PUT /estudiantes/:id/nivel` | D | `{ nivelId, motivo? }` → función `cambiar_nivel` (historial + aviso a acudientes) |
| `GET/POST /estudiantes/:id/talleristas`, `DELETE …/:talleristaId` | D | El DELETE desactiva el vínculo (se conserva el historial) |
| `GET/POST /estudiantes/:id/acudientes`, `PATCH/DELETE …/:acudienteId` | D | Un solo principal; `PATCH { esPrincipal: true }` lo cambia |
| `GET /estudiantes/me/consentimiento-voz` | E | El propio |
| `GET /estudiantes/:id/consentimiento-voz` | D, T, A | `{ concedido, motivo }`; sin la API del núcleo familiar → `concedido: false` |

La regla de relación vive en un solo lugar
(`src/modules/estudiantes/domain/alcance.ts`) y la aplica
`AccesoEstudianteService`, que también usan los módulos siguientes.

Los mensajes de validación (400) salen en español
(`src/common/validacion/mensajes-validacion.ts`).

### Escalera de niveles por juego (fase 9)

Emparejar, Clasificar, Secuenciar y Memoria tienen **5 niveles** cada uno, por
estudiante y por juego (no son BAJO/MEDIO/ALTO). Se sube un nivel cuando la
tallerista a cargo o la directora **aprueba** un intento del nivel actual.

| Método y ruta | Quién | Notas |
|---|---|---|
| `GET /estudiantes/me/niveles-juego` | E | Nivel (1-5), `completado` y `pendientesValidacion` de cada juego |
| `GET /estudiantes/me/niveles-juego/:juego/actividad` | E | `{ nivel, actividad }` del nivel actual (`:juego` = `EMPAREJAR`, `CLASIFICAR`, `SECUENCIAR` o `MEMORIA`) |
| `GET /estudiantes/:id/niveles-juego` | D, T a cargo, A | Ajeno → 404 |
| `PUT /estudiantes/:id/niveles-juego/:juego` | D, T a cargo | `{ nivel, motivo }` (motivo obligatorio). Queda en el historial; no avisa |

| Nivel | Memoria | Emparejar | Clasificar | Secuenciar |
|---|---|---|---|---|
| 1 | 2 parejas | 2 opciones | 2 grupos, 4 elementos | 2 pasos |
| 2 | 3 parejas | 3 opciones | 2 grupos, 6 elementos | 3 pasos |
| 3 | 4 parejas | 4 opciones | 2 grupos, 8 elementos | 4 pasos |
| 4 | 5 parejas | 3 opciones, arriba palabra o cantidad | 3 grupos, 6 elementos | 5 pasos |
| 5 | 6 parejas | 4 opciones, arriba palabra o cantidad | 3 grupos, 9 elementos | 6 pasos |

- Las actividades viven en el módulo de la escalera (`modulo.es_escalera`): no
  se publica ni se asigna, pero estudiantes y acudientes lo pueden ver. Se
  siembra con `prisma/scripts/sembrar_escalera.sql` (id de una directora).
- `POST /intentos` acepta esas actividades **sin asignación** y solo del nivel
  actual (si no, 422). No suman al progreso oficial de los módulos.
- `POST /intentos/:id/validacion` devuelve `subidaNivel`, y `POST
  /validaciones/lote` devuelve `subidas`. Todo va en la misma transacción que
  la validación; en el 5 se marca `completado`, y nunca se salta ni se baja
  un nivel solo.
- La bandeja muestra, de cada nivel, el intento más reciente con
  `pendientesMismaActividad`. Los de niveles superados no aparecen.
- Al subir, los acudientes reciben un aviso `NIVEL_JUEGO`.

### Validación y progreso (fase 7)

| Método y ruta | Quién | Notas |
|---|---|---|
| `GET /revisiones/pendientes?estudianteId&page&limit` | T (sus estudiantes), D | Bandeja «Por escuchar», del más antiguo al más reciente |
| `GET /intentos/:id/grabacion` | T a cargo, D | URL firmada del audio, **10 minutos**. 404 si no hay audio, venció o ya se validó |
| `POST /intentos/:id/validacion` | T a cargo, D | `{ resultado: APROBADO \| RECHAZADO, retroalimentacion? }`. RECHAZADO exige retroalimentación. 409 si ya está validado. Si el intento de voz tiene audio, antes hay que pedir su URL firmada (si no, 422) |
| `POST /validaciones/lote` | T a cargo, D | `{ intentoIds: [...] }` (1-50): aprueba juegos **sin voz**, todos o ninguno |
| `GET /estudiantes/:id/progreso`, `GET /estudiantes/me/progreso` | D, T, A / E | Por módulo: `validadas` de `total` y `progreso` (de la base); las pendientes, aparte |

- **Borrado del audio:** al validarse el intento (APROBADO o RECHAZADO) se
  borra de Storage y se marca `eliminada_en`. Las nunca validadas se borran a
  los **30 días** (la bandeja muestra `vencido: true`). Si Storage falla, se
  reintenta: al arrancar, cada `LIMPIEZA_GRABACIONES_MIN` minutos y con la
  vista `grabacion_por_eliminar`.
- La base recalcula el progreso con cada validación (solo actividades activas
  con un APROBADO) y avisa a los acudientes al completar un módulo.

### Intentos y grabaciones (fase 6)

| Método y ruta | Quién | Notas |
|---|---|---|
| `POST /intentos` | E | `{ actividadId, resultado }` para los juegos sin voz. El resultado se valida con la estrategia del juego; `total`/`pairs` deben coincidir con la actividad |
| `POST /intentos/habla-conmigo` | E | Multipart: `actividadId`, `duracionSeg?`, `audio?` (M4A/MP4, AAC o WebM; máx. 10 MB) |
| `GET /intentos/:id` | E, T a cargo, A, D | Nunca incluye el audio |
| `GET /estudiantes/me/practica-vocales`, `GET /estudiantes/me/punto-retorno` | E | Estrellas por vocal (0-3) y «Sigue donde ibas» |

- El número de intento lo pone la base (trigger). Nada se aprueba solo: todo
  queda pendiente de la tallerista. La app no califica la pronunciación.
- **Voz:** antes de guardar se verifica el consentimiento vigente (falla
  cerrado). Sin él, el intento se guarda **sin audio**. El audio va al bucket
  privado `grabaciones` en `estudiante/<id>/intento/<id>.<ext>`, con
  `codigo_version_terminos` y `consentimiento_verificado_en`. El estado queda en
  `resultado.estadoGrabacion`: `ADJUNTA`, `NO_ENVIADA`, `SIN_CONSENTIMIENTO`,
  `NO_VERIFICABLE` o `NO_GUARDADA` (falló Storage; el intento no se pierde).

### Configuración de los juegos (`actividad.configuracion`)

Una **cara** es lo que se ve en una tarjeta:
`{ "etiqueta", "imagenContenidoId"?, "texto"?, "cantidad"?, "audioContenidoId"? }`
(imagen o texto obligatorio; cantidad y audio exigen imagen).

| Juego | Configuración | Resultado del intento |
|---|---|---|
| HABLA_CONMIGO | `{ "vocal": "a" }` | `{}` (el backend agrega `estadoGrabacion`) |
| BUSCA_LA_BOCA | `{ "vocales": ["a","e","i"] }` | `{ firstTryCorrect, total }`, total = vocales |
| EMPAREJAR | `{ "rondas": [{ pregunta, estimulo: Cara, opciones: [Cara ×2–4], respuesta }] }` | `{ firstTryCorrect, total }`, total = rondas |
| CLASIFICAR | `{ "conjuntos": [{ pregunta, grupos: [Cara ×2–3], elementos: [{ cara, grupo }] ×2–9 }] }` | total = elementos |
| SECUENCIAR | `{ "rutinas": [{ titulo, pasos: [Cara ×2–6] }] }` (en orden) | total = pasos |
| MEMORIA | `{ "tableros": [{ parejas: [Cara ×2–6] }] }` | `{ pairs, mismatches }`, pairs = parejas |

- **Regla 11:** ninguna configuración ni resultado admite tiempo límite,
  vidas o penalizaciones (cualquier campo así responde 422).
- En EMPAREJAR, CLASIFICAR, SECUENCIAR y MEMORIA, `actividad_contenido` se
  llena solo con las caras que tienen imagen (no se edita a mano): así esos
  contenidos quedan protegidos y salen en las URLs del módulo.

### Asignaciones (fase 5)

| Método y ruta | Quién | Notas |
|---|---|---|
| `POST /asignaciones` | D, T a cargo | `{ moduloId, estudianteId, fechaSugerida? }`. Solo módulos publicados y estudiantes ACTIVO; 409 si ya lo tiene sin completar; estudiante ajeno → 404. La base avisa a los acudientes |
| `GET /asignaciones?estudianteId&moduloId&estado` | todos | Las de los estudiantes que puede ver |
| `GET /asignaciones/:id` | todos (con relación) | Avance: estado de cada actividad activa (`SIN_INTENTOS`, `PENDIENTE_VALIDACION`, `RECHAZADA`, `APROBADA`) y resumen |
| `DELETE /asignaciones/:id` | D, T a cargo | Solo sin intentos (409) |
| `GET /estudiantes/me/actividades-pendientes` | E | Lo que tiene por hacer: sin intentos o rechazadas |

El progreso oficial (`progreso`, 0-100) lo calcula la base: solo actividades
activas con un intento APROBADO. Las pendientes de validación se informan
aparte (`resumen.pendientesValidacion`) y no suman.

### Catálogo, módulos, contenidos y actividades (fase 4)

| Método y ruta | Quién | Notas |
|---|---|---|
| `GET /niveles`, `/categorias`, `/tipos-juego`, `/musica` | todos | Solo lectura |
| `GET /modulos?categoriaId&nivelId&publicado` | D, T | T ve los publicados y los suyos |
| `GET /modulos/:id` | todos | E y A: solo si el módulo está asignado (a él o a su estudiante); si no, 404 |
| `POST /modulos`, `PATCH/DELETE /modulos/:id` | D, T (autora) | DELETE solo sin asignaciones (409) |
| `POST/DELETE /modulos/:id/publicacion` | D | Publicar exige al menos una actividad activa |
| `GET/POST /modulos/:id/contenidos` | ver / D, T (autora) | POST multipart: `archivo`, `tipo`, `titulo`, `orden`. Máx. 50 MB |
| `GET /modulos/:id/contenidos/urls`, `GET /contenidos/:id/url` | quien ve el módulo | URLs firmadas de 60 min |
| `PATCH/DELETE /contenidos/:id` | D, T (autora) | DELETE: 409 si una actividad lo usa o es la portada |
| `GET/POST /modulos/:id/actividades`, `GET/PATCH/DELETE /actividades/:id` | ver / D, T (autora) | E y A ven solo las activas |
| `PUT /actividades/:id/contenidos` | D, T (autora) | Reemplaza los contenidos; todos del mismo módulo |

- **Archivos:** bucket privado `contenidos`, ruta
  `modulo/<id>/contenido/<uuid>.<ext>`. El formato se comprueba por los
  bytes del archivo, no por el Content-Type. La API nunca devuelve rutas:
  solo URLs firmadas. Puerto `AlmacenArchivos` (`src/common/almacenamiento/`).
- **Subidas a disco, no a memoria:** `@SubidaDeArchivo(campo, máximo)` escribe
  el archivo en una carpeta temporal del servidor (`<tmp>/gameup-subidas-<pid>`),
  lo envía a Storage como stream y lo **borra siempre** al terminar, también
  si la petición falla (413, 422, 403, 503...).
- **Configuración por juego:** una estrategia por tipo de juego
  (`src/modules/catalogo/domain/juegos/`). Ver «Configuración de los juegos».

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
│   ├── almacenamiento/      # Puerto AlmacenArchivos (Supabase Storage) y tipos de archivo
│   ├── errors/              # Errores de dominio y filtro global
│   ├── ids/                 # bigint ⇄ string, @IsIdNumerico()
│   ├── paginacion/          # ?page&limit (máx. 50)
│   ├── pipes/               # ParseBigIntPipe
│   └── reloj/               # Puerto Reloj (hora inyectable)
├── modules/                 # Un módulo por agregado del dominio
│   ├── auth/                # Login, /auth/me, logout; MapeadorRoles; guards globales
│   ├── usuarios/            # Cuentas de GameUP (directora)
│   ├── estudiantes/         # Estudiantes, vínculos, nivel; regla de relación
│   ├── consentimiento/      # Consentimiento de voz (API del núcleo familiar)
│   ├── catalogo/            # Niveles, categorías, tipos de juego, música; estrategias por juego
│   ├── modulos/             # Módulos, contenidos (Storage) y actividades
│   ├── asignaciones/        # Módulos asignados a estudiantes y su avance
│   ├── intentos/            # Intentos, grabaciones de voz y práctica de vocales
│   └── validaciones/        # Bandeja, validación, audio (URL firmada y borrado)
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
