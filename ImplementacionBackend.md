# Superprompt: implementar el backend de GameUP

---

Vas a implementar el backend de **GameUP**, una app móvil de aula virtual inclusiva para la Fundación ASISCO-UP, que acompaña a niños con síndrome de Down. Trabaja en `GameUp-backend/`. Responde y documenta en **español**.

Antes de escribir código, **lee** estos archivos y respeta lo que ya existe:

- `GameUp-backend/package.json`, `tsconfig.json`, `oxlint.json`, `vitest.config.ts`, `vitest.config.e2e.ts`, `nest-cli.json`, `.env.example`, `README.md`
- `GameUp-backend/src/` completo (`main.ts`, `app.module.ts`, `app.setup.ts`, `config/`, `prisma/`, `supabase/`, `health/`)
- `GameUp-backend/prisma/schema.prisma`, `prisma/MIGRACIONES.md` y **todas** las migraciones en `prisma/migrations/` (los triggers, CHECK y reglas de la base solo están ahí)
- `GameUp-frontend/src/data/repositories.ts` y `GameUp-frontend/src/data/types.ts` (el contrato que espera la app)

## 1. Estado real del proyecto (no lo asumas distinto; verifícalo)

- **Stack:** Node 22/24, **NestJS 12**, TypeScript 6 en modo estricto, **ESM** (`"type": "module"`), **Prisma 7** con `@prisma/adapter-pg`, Supabase (PostgreSQL + Storage), `class-validator`/`class-transformer`, Vitest, oxlint, Prettier.
- **Ya existe:** prefijo global `api/v1`, `helmet`, `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`), validación de variables de entorno, `PrismaService` (se conecta como dueño: **salta RLS**), `SupabaseService` (clave secreta, solo backend), `GET /api/v1/health`.
- **Base de datos (ya aplicada en Supabase, 3 migraciones):** 20 tablas en `public`. Las principales: `usuario`, `rol` (DIRECTORA, TALLERISTA, ACUDIENTE, ESTUDIANTE), `estudiante`, `acudiente_estudiante`, `tallerista_estudiante`, `nivel`, `historial_nivel`, `categoria`, `modulo`, `contenido`, `tipo_juego` (EMPAREJAR, CLASIFICAR, SECUENCIAR, MEMORIA, HABLA_CONMIGO, BUSCA_LA_BOCA), `actividad`, `actividad_contenido`, `asignacion`, `intento`, `validacion`, `grabacion_estudiante`, `observacion`, `notificacion`, `musica`. Vista `grabacion_por_eliminar`. Buckets privados de Storage: `contenidos` y `grabaciones`.
- **La base ya hace cumplir** (con triggers): rol correcto en cada relación; que solo la directora o el tallerista **a cargo** asigne, valide u observe a un estudiante; que solo se asignen módulos publicados; que una actividad y su contenido sean del mismo módulo; que solo los intentos de HABLA_CONMIGO tengan grabación; que no haya intentos en asignaciones COMPLETADO; el cálculo del progreso (solo actividades activas con validación APROBADO) y su recálculo; notificaciones a acudientes. **El backend igual valida todo antes de escribir** (regla 7): los triggers son el respaldo, no la primera línea.
- **Identidad y datos de las personas viven fuera de GameUP:**
  - **API de seguridad** (otro grupo): login, usuarios, roles. Endpoints usados: `POST /api/auth/login` (`correo_usuario`, `contraseña_usuario`), `GET /api/auth/perfil`. Roles externos (tabla de roles de esa API, campos `id_rol` y `nombre_rol`): 1 ESTUDIANTE, 2 ADMIN, 3 DONANTE, 4 TALLERISTA, 5 ACUDIENTE. No existe un rol DIRECTORA allá. `id_usuario` es numérico. Compara siempre por `nombre_rol`, nunca por `id_rol`.
  - **API del núcleo familiar** (otro grupo): estudiantes (`idEstudiante`), acudientes (`idAcudiente`, `idUsuarioAuth`), vínculo con parentesco, **consentimiento** (`aceptaTratamiento`, `codigoVersion`, `textoLegal` que incluye la grabación de voz).
  - GameUP guarda una **copia mínima** enlazada por `usuario.id_usuario_auth`, `usuario.id_acudiente_externo` y `estudiante.id_estudiante_externo`. Nunca guarda contraseñas, documento, teléfono ni fecha de nacimiento.

## 2. Reglas permanentes

### Arquitectura por capas (obligatoria en cada módulo de negocio)

Un módulo Nest por agregado del dominio. Estructura de carpetas:

```
src/modules/<modulo>/
├── domain/
│   ├── <nombre>.entity.ts            # Entidad de dominio (clase TS pura, sin Prisma ni Nest)
│   └── <nombre>.repository.ts        # Puerto: interfaz + token de inyección
├── application/
│   └── <nombre>.service.ts           # Casos de uso y reglas de negocio
├── infrastructure/
│   ├── prisma-<nombre>.repository.ts # Adaptador: implementa el puerto con PrismaService
│   └── <nombre>.mapper.ts            # Fila de Prisma ⇄ Entidad ⇄ DTO de respuesta
├── presentation/
│   ├── dto/                          # DTO de entrada (class-validator) y de salida
│   └── <nombre>.controller.ts        # Solo HTTP
└── <modulo>.module.ts
src/common/                           # Lo transversal: auth, guards, decoradores, filtros, errores, utilidades
```

Responsabilidades **estrictas** de cada capa:

| Capa | Hace | Nunca hace |
|---|---|---|
| **Entity** | Representa el concepto del dominio con tipos propios (ids como `bigint`), invariantes y métodos de dominio (por ejemplo, `asignacion.estaCompletada()`). | Importar Prisma, Nest o DTO. |
| **DTO** | Entrada: valida forma y tipos con `class-validator`. Salida: define exactamente lo que ve la app. | Contener lógica de negocio. Exponer modelos de Prisma. |
| **Mapper** | Convierte Prisma → Entidad y Entidad → DTO de salida. Funciones puras y probadas. | Consultar la base ni decidir permisos. |
| **Repository** | Puerto en `domain/` (interfaz pequeña) + implementación Prisma en `infrastructure/`. Devuelve **entidades**, nunca filas de Prisma. | Reglas de negocio ni chequeos de rol. |
| **Service** | Casos de uso: verifica permisos por relación (regla 5 y 6), aplica reglas, orquesta repositorios y puertos externos, usa transacciones cuando hay varias escrituras. | Conocer HTTP (`Request`, códigos de estado) ni Prisma directamente. |
| **Controller** | Rutas, guards, decoradores, recibe DTO, llama un método del servicio, devuelve un DTO. | Lógica de negocio ni acceso a datos. |

### Principios SOLID, aplicados así

- **S:** una razón de cambio por clase. Si un servicio pasa de ~200 líneas o mezcla casos de uso de actores distintos, divídelo (por ejemplo, `ValidacionService` separado de `IntentoService`).
- **O:** comportamientos que varían por tipo se resuelven con **estrategias registradas**, no con `switch` crecientes. Ejemplo: un `ResultadoJuegoStrategy` por `tipo_juego` que valida el JSON de `intento.resultado`; agregar un juego = agregar una estrategia.
- **L:** toda implementación de un puerto (Prisma, en memoria para pruebas, HTTP real o simulado) se puede intercambiar sin cambiar el servicio ni sus pruebas.
- **I:** puertos pequeños y específicos (`AsignacionLecturaRepository` y `AsignacionEscrituraRepository` si los usan clientes distintos), igual que los repositorios del frontend.
- **D:** los servicios dependen de **interfaces + tokens** (`export const ASIGNACION_REPOSITORY = Symbol('ASIGNACION_REPOSITORY')`) inyectados con `@Inject(...)`. Las integraciones externas (API de seguridad, API del núcleo familiar, Storage, reloj) también son puertos con adaptadores.

### Convenciones técnicas del proyecto (incumplirlas rompe el build)

- **ESM:** todos los imports relativos terminan en `.js` (`import { X } from './x.js'`).
- `verbatimModuleSyntax`: usa `import type` para lo que solo es tipo. Ojo: las clases que Nest inyecta por tipo (servicios, `ConfigService`) deben importarse como **valor**, no con `import type`.
- `exactOptionalPropertyTypes` y `noUncheckedIndexedAccess` están activos: no asignes `undefined` a opcionales sin declararlo, y comprueba los accesos por índice.
- **BigInt:** los ids de la base son `BigInt`. En la entidad se manejan como `bigint`; en los DTO de salida van como **`string`** (JSON no serializa `bigint`, y la app usa ids `string`). En los DTO de entrada, recíbelos como string numérico validado y conviértelos en el mapper o en un pipe `ParseBigIntPipe` en `common/`.
- El cliente de Prisma se importa de `src/generated/prisma/client.js`. Los modelos están en minúscula y en español (`this.prisma.asignacion`). No edites `src/generated/`.
- Nombres: el dominio en español como la base (`Asignacion`, `Intento`, `Validacion`); los sufijos técnicos en inglés como el código existente (`AsignacionService`, `AsignacionController`, `PrismaAsignacionRepository`). Rutas REST en español, en plural y kebab-case: `/api/v1/asignaciones`, `/api/v1/intentos/:id/validacion`.
- Fechas: `timestamptz` → `Date` en la entidad → string ISO 8601 en el DTO.
- Errores: crea errores de dominio en `common/errors/` (`RecursoNoEncontradoError`, `AccesoDenegadoError`, `ReglaNegocioError`) y un **filtro global** que los traduce a HTTP (404, 403, 422). El mismo filtro traduce los errores de la base: violación de único → 409; FK → 422; `23514` (CHECK o trigger de regla) → 422; `42501` (trigger de vínculo) → 403. Respuesta uniforme: `{ statusCode, error, message }`. **Nunca** devuelvas trazas, SQL ni datos de otros estudiantes en un error.
- Listados con paginación (`page`, `limit`, máximo 50) cuando puedan crecer.
- **No agregues dependencias** sin decir cuál, para qué y pedir confirmación. No cambies tecnologías.

### Seguridad y datos de menores (no negociable)

- Toda ruta, salvo `health` y `auth/login`, exige autenticación (guard global + decorador `@Public()` para las excepciones).
- Autorización en **dos niveles**: por **rol** (`@Roles(...)` + `RolesGuard`) y por **relación** en el servicio: el tallerista solo accede a estudiantes con `tallerista_estudiante.activo = true`; el acudiente solo a los de `acudiente_estudiante`; el estudiante solo a lo suyo; la directora a todo. Ocultar botones en la app **no** cuenta.
- Si alguien pide un recurso de un estudiante que no le corresponde, responde **404** (no confirmes que existe).
- **Grabaciones de voz:** antes de aceptar una, consulta el consentimiento vigente en la API del núcleo familiar. Si no hay, el intento se guarda **sin audio**. Guarda `codigo_version_terminos` y `consentimiento_verificado_en`. El audio va al bucket privado `grabaciones` con ruta `estudiante/<id>/intento/<id>.<ext>`. Solo se entrega con **URL firmada** de corta duración (máximo 10 minutos) al tallerista a cargo o a la directora. Al validarse el intento, se borra el archivo de Storage y se marca `eliminada_en` (usa la vista `grabacion_por_eliminar` para reintentar los que fallen).
- La app **no califica la pronunciación**: ningún endpoint calcula aprobación automática de voz.
- La cámara es solo un espejo: **no existe** ningún endpoint para subir imágenes del niño.
- Nada de datos reales de menores en pruebas, seeds, logs ni ejemplos. Los logs no incluyen nombres, tokens ni rutas de audio.
- Secretos solo en `.env` del backend (documentados con valores de ejemplo en `.env.example` y validados en `config/env.validation.ts`). Nunca en el código ni en la app.

### Base de datos

- **No edites migraciones ya aplicadas** (ni un espacio: Prisma compara el checksum y ofrecería borrar la base).
- **Nunca** ejecutes `prisma migrate dev`, `migrate reset` ni `db push` contra Supabase. Si necesitas un cambio de esquema: escribe una migración nueva en `prisma/migrations/<timestamp>_<nombre>/migration.sql`, pruébala en una base PostgreSQL local (`prisma/pruebas/README.md`), regenera con `npx prisma db pull` contra esa base local y `npm run db:generate`, y **pide confirmación** antes de que se aplique en Supabase.
- Las tablas nuevas llevan RLS activado, sin políticas, y `revoke all ... from anon, authenticated`.

### Calidad y verificación (cada fase termina así)

1. `npm run build`, `npm run lint` y `npm test` pasan sin errores ni advertencias nuevas.
2. **Pruebas unitarias** de cada servicio con repositorios **en memoria** (implementan el mismo puerto) y de cada mapper.
3. **Pruebas e2e** (`test/*.e2e-spec.ts`, supertest) de cada controlador: caso feliz, validación de DTO (400), sin token (401), rol incorrecto (403) y **estudiante ajeno (404)**. Los puertos externos se reemplazan por simulados.
4. Resumen corto: qué se hizo, archivos creados o modificados, cómo probarlo (con `curl` o el cliente que uses), y qué quedó pendiente.
5. **Detente y espera mi confirmación** antes de pasar a la siguiente fase.

No afirmes que algo funciona si no ejecutaste la comprobación. Si algo falla, muestra el error real.

## 3. Lo que NO está definido: pregunta antes de inventar

Estos puntos tienen huecos. **No crees tablas, endpoints ni integraciones para ellos por tu cuenta.** En la fase 0, presenta cómo propones resolver cada uno y espera mi decisión:

1. **Cómo se valida el token de la API de seguridad.** Opciones: llamar a `GET /api/auth/perfil` con el token (y guardar en caché 5 minutos), verificar la firma con secreto compartido o con clave pública (JWKS). Diseña un puerto `VerificadorToken` para que cambiar de opción sea cambiar el adaptador.
2. **Credencial de servicio** para que el backend consulte la API del núcleo familiar (está pedida al otro grupo; aún no existe). Variables de entorno opcionales; si faltan, ese adaptador responde 503 con un mensaje claro.
3. **Endpoint para leer el consentimiento** en la API del núcleo familiar (la documentación solo muestra `POST /consentimientos` y `GET /estudiantes/{id}`).
4. **Mapeo de roles (decidido):** ADMIN → DIRECTORA, TALLERISTA → TALLERISTA, ACUDIENTE → ACUDIENTE, ESTUDIANTE → ESTUDIANTE. DONANTE no tiene acceso a GameUP (403). Cualquier rol desconocido también da 403. Implementa el mapeo en un solo lugar (un `MapeadorRoles` en el módulo de auth), no repartido por el código.
5. **Contrato con la app.** `GameUp-frontend/src/data/repositories.ts` espera cosas que la base aún no guarda: estrellas de práctica por vocal y «sigue donde ibas» (`getVowelPractice`, `getResumePoint`, `recordPracticeCycle`); nota de voz del tallerista para la familia (`saveFamilyVoiceNote`); «lo practicamos hoy» del acudiente (`markPracticedToday`, `getWeeklyPractice`). Además, la app muestra módulos `colors | numbers | letters | stories`, y la base tiene las categorías `VOCALES` y `PRAXIAS`. Propón qué sale de tablas existentes (por ejemplo, estrellas desde `intento.estrellas`) y qué necesita migración nueva.
6. **Formato de `intento.resultado` (JSON) por tipo de juego** (por ejemplo, para BUSCA_LA_BOCA: `firstTryCorrect` y `total`, como en el frontend). Propón un esquema por juego.
7. **Retención de grabaciones** si el intento se rechaza (¿se borra igual al validar o se conserva hasta el siguiente intento?).

## 4. Fases

**Fase 0: análisis y plan (sin código).** Revisa todo lo indicado arriba y entrega: (a) lista de endpoints por módulo, con rol permitido y regla de relación de cada uno; (b) tu propuesta para cada punto de la sección 3; (c) migraciones nuevas que harían falta. Espera mi confirmación.

**Fase 1: base común (`src/common/`).** Errores de dominio y filtro global; `ParseBigIntPipe`; tipo `UsuarioAutenticado` (id interno, `idUsuarioAuth`, rol); puerto `VerificadorToken` y su adaptador; `AuthGuard` global, `@Public()`, `@Roles()`, `RolesGuard`, `@UsuarioActual()`; puerto `Reloj`. Mueve `PrismaModule` y `SupabaseModule` a donde corresponda si hace falta, sin romper `health`.

**Fase 2: auth y usuarios.** `POST /auth/login` reenvía a la API de seguridad y devuelve token + `{ userId, role, displayName }` con los roles de la app (`student | teacher | guardian | director`). Sincroniza la copia mínima en `usuario` (y `estudiante` si aplica) por `id_usuario_auth`, actualizando `sincronizado_en`. `GET /auth/me`. Un usuario autenticado afuera pero sin fila en GameUP recibe 403 con un mensaje claro.

**Fase 3: estudiantes y relaciones.** Listar los estudiantes visibles para el usuario, ver uno, y (directora) gestionar `tallerista_estudiante`, `acudiente_estudiante` y el cambio de nivel (usa la función `cambiar_nivel` de la base).

**Fase 4: catálogo de contenido.** Niveles, categorías y tipos de juego (lectura); módulos, contenidos y actividades (CRUD para directora y tallerista; publicar módulo). Subida de videos e imágenes al bucket `contenidos` (MP4 de hasta 50 MB) y entrega con URL firmada.

**Fase 5: asignaciones.** Asignar módulo a estudiante (solo módulos publicados y estudiantes a cargo), listar pendientes del estudiante, ver progreso de una asignación.

**Fase 6: intentos y grabaciones.** Registrar intento (`numero_intento` lo pone la base), validar `resultado` con la estrategia del juego, subir audio de HABLA_CONMIGO con verificación de consentimiento (multipart, solo `audio/*` de la lista del bucket, máximo 10 MB).

**Fase 7: validación y progreso.** Bandeja «por revisar» del tallerista (solo sus estudiantes; URL firmada del audio), validar (APROBADO) o rechazar con retroalimentación **obligatoria** (RECHAZADO), borrado del audio tras validar, progreso oficial por módulo (solo validadas; las pendientes se informan aparte y no suman).

**Fase 8: acudiente, observaciones y notificaciones.** Lo que ve el acudiente de sus estudiantes (actividades, progreso, retroalimentación, observaciones con `visible_acudiente`), notificaciones (listar, marcar leída), y lo que se haya decidido en el punto 5 de la sección 3.

Empieza por la **fase 0**.

## 5. Swagger y despliegue (ya implementado, no romper)
- Swagger usa @nestjs/swagger. Configuración en src/docs/swagger.ts, montada desde configureApp() en src/app.setup.ts con setupSwagger(app, PUBLIC_URL), después de setGlobalPrefix. Rutas: /api-docs y /api-docs.json.
- Cada controlador nuevo lleva @ApiTags('<modulo>') y @ApiOperation en cada endpoint. Los endpoints protegidos llevan @ApiBearerAuth(BEARER_AUTH).
- Cada DTO lleva @ApiProperty({ example }) en cada campo; no se usa el plugin del CLI. Las respuestas se documentan con @ApiOkResponse / @ApiCreatedResponse y los errores con @ApiBadRequestResponse, @ApiUnauthorizedResponse, @ApiForbiddenResponse y @ApiNotFoundResponse.
- No usar swagger-jsdoc ni comentarios YAML.
- El despliegue es en Render con render.yaml en la raíz (rootDir GameUp-backend, health check /api/v1/health). Toda variable de entorno nueva se agrega a env.validation.ts, .env.example y render.yaml (sync: false si es secreta).
- test/swagger.e2e-spec.ts debe seguir pasando.
