# Avance del backend de GameUP

Estado de la implementación por fases, según `ImplementacionBackend.md`, con las decisiones aprobadas y lo que falta.

Cada fase vive en su rama, creada desde la rama de la fase anterior. Todas están subidas a `origin`.

## 1. Estado por fase

| Fase | Contenido | Rama | Commit | Sale de |
|---|---|---|---|---|
| 0 | Análisis y plan, sin código | — | — | — |
| 1 | Base común: errores, autenticación, utilidades y limpieza | `backend/fase-1-base-comun` | `3e127a0` | `main` |
| 2 | Login, sesión y cuentas de GameUP | `backend/fase-2-auth-usuarios` | `ee601be` | `3e127a0` |
| 3 | Estudiantes, vínculos, nivel y consentimiento de voz | `backend/fase-3-estudiantes` | `d0efc03` | `ee601be` |
| 4 | Catálogo, módulos, contenidos (Storage) y actividades | `backend/fase-4-catalogo` | `e6357d3` | `d0efc03` |
| 5 | Asignaciones y su avance | `backend/fase-5-asignaciones` | `de234e6` | `e6357d3` |
| 6 | Configuración de los juegos, intentos y grabaciones de voz | `backend/fase-6-intentos` | `f29ed42` | `de234e6` |
| 7 | Validación, audio y progreso oficial | `backend/fase-7-validacion` | `2372684` | `f29ed42` |
| 8 | Acudiente, observaciones, notificaciones y práctica en casa | `backend/fase-8-acudiente` | `1aa768c` | `3cff8c9` |

**Estado al cerrar la fase 8:**
- `build`, `lint` (0 advertencias) y Prettier pasan.
- Pasan las 475 pruebas unitarias (41 archivos) y las 152 e2e (11 archivos).
- Swagger documenta 54 rutas (70 operaciones).
- No se agregaron dependencias en ninguna fase.
- La migración `20261105120000_practica_casa` se probó contra PostgreSQL real y está **aplicada en Supabase** (2026-11-05).
- Falta la prueba HTTP de `PUT /estudiantes/:id/practica-casa/hoy` contra Supabase: aún no hay cuenta de prueba de acudiente.
- En una máquina cargada, la e2e «no se elimina un contenido en uso (409)» de `modulos.e2e-spec.ts` puede fallar por tiempo (tardó 38 s una vez). Pasa al repetirla: no es un fallo de lógica.

Nota para Windows: Git convierte los archivos a CRLF al descargarlos, y
`prettier --check` los marca a todos. Para revisar el formato real:
`npx prettier --check --end-of-line auto "src/**/*.ts" "test/**/*.ts"`.

Para verificar una rama:

```bash
cd GameUp-backend
npm ci
npm run build && npm run lint && npm test && npm run test:e2e
```

## 2. Reglas permanentes

Valen en todas las fases.

**Arquitectura**
- Cada módulo se divide en capas (`domain`, `application`, `infrastructure`, `presentation`). Los puertos se inyectan con tokens `Symbol`.
- Los imports ESM terminan en `.js`, y los imports de solo tipos usan `import type`.
- Los ids son `bigint` en las entidades y `string` en los DTO.
- Los errores siempre responden `{ statusCode, error, message }`, nunca con trazas ni SQL.
- La paginación devuelve como máximo 50 elementos.
- Cada endpoint lleva sus decoradores de Swagger, y `test/swagger.e2e-spec.ts` debe seguir pasando.
- Cada variable de entorno nueva se agrega a `env.validation.ts`, `.env.example` y `render.yaml`.

**Acceso**
- Un estudiante que no le corresponde a quien lo pide responde **404**, igual que uno inexistente.

**Base de datos**
- Nunca se ejecutan `prisma migrate dev`, `migrate reset` ni `db push` contra Supabase.
- No se editan migraciones ya aplicadas.
- Cada migración nueva se prueba en local y espera confirmación antes de aplicarse en Supabase.
- El SQL crudo solo se escribe con plantillas etiquetadas (`$queryRaw`/`$executeRaw`), nunca con `…RawUnsafe`. Lo vigila `src/seguridad-sql.spec.ts`.

**Datos de menores**
- No se usan datos reales de menores en pruebas, seeds, logs ni ejemplos.
- Los logs no incluyen nombres, tokens ni rutas de audio.
- El audio solo se entrega con una URL firmada de 10 minutos como máximo, y solo a la tallerista a cargo o a la directora.
- La app no califica la pronunciación.
- No existe ningún endpoint para subir imágenes del niño.

**Secretos**
- Los secretos van solo en el `.env` del backend.
- No se agregan dependencias sin preguntar.

## 3. Decisiones aprobadas

### Fase 0: plan

1. **Limpieza:** se borran `src/crud/`, `gen_crud.*`, `src/app.ts`, `.chk-tmp.mjs` y el script `db:migrate`, y se quita al psicólogo de la documentación. Los conflictos de merge del frontend no se tocan.
2. **Token:**
   - se verifica con `GET /api/auth/perfil` de la API de seguridad;
   - en caché queda el SHA-256 del token, nunca el token;
   - la caché dura lo menor entre 5 minutos y el `exp` del JWT, que se lee sin verificar la firma, solo para calcular esa duración;
   - el login devuelve `token` y el perfil se pide con Bearer;
   - los campos del perfil pasan por un mapper;
   - se admite una lista de roles externos, que debe coincidir con el `rol_id` local; si no coincide, 403.
3. **Consentimiento de voz:**
   - falla cerrado: si no se puede verificar, el intento se guarda sin audio;
   - el texto legal cubre la voz;
   - siempre se guarda `codigo_version_terminos`.
4. **Rol:** si el rol externo no coincide con el local, responde 403 y no se cambia el rol.
5. **Cuentas:** se agrega `POST /usuarios`, solo para la directora, más un script SQL para la primera directora. GameUP no usa `/api/auth/registro/*`.
6. **Estrellas:** opción A, solo dentro de asignaciones y sin migración. El punto de retorno se deriva del último intento.
7. **`practica_casa`:** va en una migración nueva, probada en local, y se pide confirmación antes de aplicarla en Supabase.
8. **Nota de voz para la familia:** se pospone. En el MVP, la retroalimentación a la familia es texto en `observacion`.
9. **Módulos:** son dinámicos en la app, sin categorías fijas.
10. **Bandeja de revisión:** los 6 juegos pasan por ella. Los intentos de voz siempre se validan uno por uno, y los demás también se pueden aprobar en lote (`POST /validaciones/lote`).
11. **`intento.resultado`:**
    - EMPAREJAR, CLASIFICAR, SECUENCIAR y BUSCA_LA_BOCA envían `{ firstTryCorrect, total }`;
    - MEMORIA envía `{ pairs, mismatches }`;
    - HABLA_CONMIGO envía `{}`, y el backend agrega `estadoGrabacion`.
12. **Audio:** se borra con cualquier validación, APROBADO o RECHAZADO.
13. **Audio nunca validado:** se guarda 30 días como máximo. Después se borra el archivo, se marca `eliminada_en` y la bandeja lo muestra como vencido.
14. **Publicar módulos:** solo la directora.

### Fase 1: base común

1. Las ramas de cada fase salen de la anterior. No hay base PostgreSQL local, y las pruebas contra PostgreSQL real las corre otra persona sobre las ramas subidas.
2. El mapper del perfil queda **provisional** hasta tener un ejemplo real de la respuesta.

### Fase 2: auth y cuentas

1. **Logout:** `POST /auth/logout` borra el token de la caché. GameUP no puede revocarlo, porque lo emite la API de seguridad.
2. Nadie puede desactivar su propia cuenta (422).
3. **Última directora activa:** desactivarla responde 422. Es atómico, con `FOR UPDATE` dentro de una transacción.
4. **Estudiante EGRESADO o RETIRADO:** recibe 403 al iniciar sesión y en cualquier petición. Su historial sigue visible para la directora y el acudiente.
5. Los mensajes de validación (400) se traducen al español.

### Fase 3: estudiantes

1. El acudiente también ve el historial de nivel.
2. Se agrega `PATCH /estudiantes/:id/acudientes/:acudienteId`, para cambiar el acudiente principal.
3. Si la API del núcleo familiar no está, el consentimiento responde 200 con `concedido: false`, no 503.
4. Solo se vinculan cuentas activas del rol correcto; si no, 422.
5. `idEstudianteExterno` solo lo ve la directora, en `/usuarios`.

### Fase 4: catálogo

1. Las imágenes, kinemas, audios y portadas se referencian por id de un contenido del mismo módulo, nunca con URLs libres.
2. Publicar un módulo exige al menos una actividad activa.
3. Un contenido en uso no se borra (409).
4. Un módulo con asignaciones no se borra (409); la salida es despublicarlo.
5. El tipo de juego de una actividad no cambia.
6. ANIMACION acepta MP4 o WEBP, sin GIF.
7. `musica.urlAudio` se devuelve tal cual, sin firmar.
8. **Subidas a disco:** van a un temporal del servidor, con un motor propio de multer, y suben a Storage por *stream*. El temporal se borra siempre, antes de responder.

### Fase 5: asignaciones

1. Solo se asigna a estudiantes ACTIVO, con una fecha sugerida que no sea anterior a hoy (hora de Bogotá).
2. Estado de cada actividad: `SIN_INTENTOS`, `PENDIENTE_VALIDACION`, `APROBADA` (basta un intento aprobado) o `RECHAZADA`. La app los traduce a sus códigos.
3. Las pendientes del estudiante son las no hechas y las rechazadas.
4. «Nueva» significa que la actividad no tiene intentos.
5. Se aprueba el esquema de `configuracion` de EMPAREJAR, CLASIFICAR, SECUENCIAR, MEMORIA y BUSCA_LA_BOCA.
6. `actividad_contenido` se llena automáticamente, y se verifica que `total` y `pairs` coincidan con la configuración.
7. **Regla 11:** la configuración y el resultado rechazan cualquier campo de tiempo límite, vidas o penalización, a cualquier profundidad.

### Fase 6: intentos

1. Hay dos estados de grabación más: `NO_VERIFICABLE` (la API de consentimiento no respondió) y `NO_GUARDADA` (falló Storage).
2. Si Storage falla, el intento se guarda sin audio, no responde 503.
3. Un audio inválido responde 422 y no crea el intento.
4. Formatos de voz aceptados: M4A/MP4, AAC y WebM. MP3 no se acepta.
5. Cada intento de una vocal suma una estrella, hasta 3, contando todas las asignaciones. Los demás juegos guardan 0.
6. En una cara, el audio exige imagen.
7. El consentimiento se consulta en cada intento de voz, aunque no venga audio.
8. El `INSERT … RETURNING` del intento usa `$queryRaw` parametrizado.

### Fase 7: validación y progreso

1. «Pendientes de validación» cuenta actividades, no intentos sueltos, igual que la base.
2. El lote solo aprueba, y es todo o nada.
   - Si falla, el 422 explica qué pasó con cada intento.
   - Ids repetidos o una lista vacía dan 400.
3. La bandeja incluye intentos de actividades que se desactivaron después.
4. El progreso incluye todas las asignaciones del estudiante, también las completadas, hasta 50.
5. APROBADO admite una retroalimentación opcional.
6. **Escuchar antes de validar:** si el intento de voz tiene audio disponible, quien valida debe haber pedido antes la URL firmada (`GET /intentos/:id/grabacion`).
   - Si no la pidió, la validación responde 422: «Antes de validar, escucha la grabación de este intento.»
   - Sin audio (no se grabó o venció a los 30 días), se valida normal.
   - Cuenta quién pidió el audio: si lo pidió la directora, la tallerista no puede validar sin pedirlo ella también.
   - La marca vale 12 horas y se olvida al validar.
   - Se guarda en memoria del proceso, detrás del puerto `RegistroEscucha` (`RegistroEscuchaEnMemoria`). Si el servidor se reinicia, basta con volver a pedir el audio. Si Render pasa a varias instancias, hay que cambiarlo por un adaptador en la base, lo que requiere una migración.

### Fase 8: acudiente

1. **Actividades del estudiante:** todas las asignaciones (también las completadas, hasta 50), la más reciente primero.
   - Retroalimentación de una actividad RECHAZADA: la del último intento.
   - Retroalimentación de una actividad APROBADA: la del último intento aprobado, si la tallerista dejó una (es opcional). La familia la ve.
   - En los demás estados no hay retroalimentación.
   - La regla vive en `avanceDe`, así que vale igual en `GET /asignaciones/:id`.
2. **Observaciones:**
   - texto de hasta 1000 caracteres; se recortan los extremos y se conservan los saltos de línea; vacío → 422;
   - `visibleAcudiente` es `false` por defecto;
   - editar: la autora (mientras tenga al estudiante a cargo) o la directora; otra tallerista a cargo → 403; sin el estudiante a cargo → 404;
   - ocultar una observación ya visible está permitido; el aviso solo sale la primera vez que se hace visible (lo decide el trigger de la base);
   - no hay borrado.
3. **Notificaciones:** cualquier rol consulta las suyas (hoy solo los acudientes reciben avisos). La respuesta trae `noLeidas` para el globo del ícono. Marcar una ajena → 404.
4. **Práctica en casa:**
   - solo el acudiente la marca, con sus propios estudiantes;
   - la leen el acudiente, la tallerista a cargo y la directora (queda en el seguimiento); el estudiante no (403);
   - la semana va de lunes a domingo, en hora de Bogotá;
   - cuenta la práctica de cualquier acudiente del estudiante;
   - solo se marca con estudiantes ACTIVO (si no, 422);
   - `PUT …/hoy` es idempotente y devuelve la semana;
   - no se puede desmarcar.
5. **`WeeklyPractice` de la app** sale de tres rutas existentes, sin campos nuevos:
   - `practicedToday` y los días: `GET /estudiantes/:id/practica-semanal`;
   - `teacherNote` (texto): la observación visible más reciente, `GET /estudiantes/:id/observaciones?limit=1` (decisión 8 de la fase 0);
   - `vowel`: la vocal de la actividad de Habla conmigo pendiente, `GET /estudiantes/:id/actividades`.

## 4. Fase 8: lo implementado

Todas las rutas van bajo `/api/v1`.

| Ruta | Roles | Regla |
|---|---|---|
| `GET /estudiantes/:id/actividades` | directora, tallerista a cargo, acudiente | Estado de cada actividad y su retroalimentación. |
| `GET /estudiantes/:id/observaciones` | directora, tallerista a cargo, acudiente | El acudiente solo ve las de `visible_acudiente = true`. |
| `POST /estudiantes/:id/observaciones` | directora, tallerista a cargo | Si es visible, la base avisa a los acudientes. |
| `PATCH /observaciones/:id` | autora o directora | Editar el texto o la visibilidad. |
| `GET /notificaciones?leida&page&limit` | todos | Solo las propias, con `noLeidas`. |
| `PATCH /notificaciones/:id/lectura` | todos | Marcar una como leída (idempotente). |
| `POST /notificaciones/lectura` | todos | Marcar todas como leídas. |
| `GET /estudiantes/:id/practica-semanal` | acudiente (propio), tallerista a cargo, directora | Días practicados de la semana, en hora de Bogotá. |
| `PUT /estudiantes/:id/practica-casa/hoy` | acudiente (propio) | «Lo practicamos hoy». |

Módulos nuevos: `observaciones`, `notificaciones` y `practica-casa`. Las
actividades del estudiante viven en `asignaciones` (reutilizan el cálculo del progreso).

**Migración `20261105120000_practica_casa`**
- Columnas: `estudiante_id`, `acudiente_id`, `fecha` y `registrada_en`, con la PK sobre las tres primeras.
- Triggers de rol ACUDIENTE (`fn_exigir_rol`) y de vínculo (`fn_practica_casa_vinculo`, código `42501` → 403).
- RLS sin políticas, `revoke all` para `anon`/`authenticated` y `revoke execute` en la función nueva.
- El modelo de `schema.prisma` se escribió a mano: hay que compararlo con `prisma db pull` al aplicarla en local.
- Prueba SQL: `prisma/pruebas/practica_casa.sql`.
- Probada contra PostgreSQL real (`practica_casa.sql` y `ajustes_revision.sql` pasan; `prisma db pull` coincide con el modelo escrito a mano) y **aplicada en Supabase** el 2026-11-05 con `npm run db:deploy`.

**Fuera de la fase 8:** la nota de voz para la familia (`nota-voz`), que quedó pospuesta.

## 5. Pruebas contra PostgreSQL real

Las corre otra persona sobre las ramas subidas. Con la base en memoria no se puede comprobar lo siguiente:

**Fase 2**
- El bloqueo `FOR UPDATE` de la última directora.
- El script `prisma/scripts/alta_primera_directora.sql`.

**Fase 3**
- `cambiar_nivel`.
- El `upsert` de talleristas con sus triggers.
- El cambio de acudiente principal frente al índice parcial `uq_acudiente_principal`.

**Fase 4**
- Los triggers de rol del módulo.
- `trg_act_cont_modulo`.
- El borrado en cascada.

**Fase 5**
- El aviso `NUEVO_MODULO`.
- Los triggers de rol y vínculo al asignar.
- El índice parcial `uq_asignacion_activa` al repetir un módulo ya completado.

**Fase 6**
- El `INSERT` crudo con el trigger de `numero_intento`.
- `fn_grabacion_solo_habla`.
- El paso de la asignación a EN_CURSO.
- El rechazo de intentos en asignaciones completadas.

**Fase 7**
- La vista `grabacion_por_eliminar`.
- Los triggers de rol y vínculo de la validación.
- El recálculo del progreso y el aviso `AVANCE`.
- El lote como una sola transacción.
- El `groupBy` de pendientes por actividad.

**Fase 8**
- La migración `practica_casa` completa (`prisma/pruebas/practica_casa.sql`).
- El `upsert` de `practica_casa` y el `distinct` por fecha.
- `trg_observacion_notificar` al crear y al editar una observación.
- Los triggers de rol y vínculo de `observacion`.

**Supabase Storage real**
- La subida por *stream*.
- Las URLs firmadas y el borrado en los buckets `contenidos` y `grabaciones`.

## 6. Otros pendientes abiertos

- **Mapper del perfil:** sigue provisional. Falta un ejemplo, con datos ficticios, de la respuesta de `POST /api/auth/login` y `GET /api/auth/perfil`. Ajustarlo solo toca `src/common/auth/seguridad-api/perfil.mapper.ts` y su prueba.
- **Consentimiento vigente:** falta el endpoint del núcleo familiar. Mientras no exista, nunca se guarda audio; `CONSENTIMIENTO_SIMULADO` solo se permite fuera de producción.
- **Revocación de tokens:** un token revocado en la API de seguridad puede seguir sirviendo hasta 5 minutos, por la caché.
- **Frontend:** los conflictos de merge ya se resolvieron (commit `bab0cb3`, Expo SDK 58). La conexión con la API avanza en la rama `frontend/conexion-api`. Debe hacer estos cambios de contrato:
  - enviar `actividadId` en los intentos;
  - mostrar los módulos de forma dinámica;
  - traducir los códigos de juego y de estado;
  - agregar la revisión de los juegos sin voz;
  - pedir el audio antes de validar un intento de voz;
  - armar `WeeklyPractice` con las tres rutas de la fase 8 (ver la decisión 5 de la fase 8);
  - mostrar la retroalimentación de las actividades aprobadas.
