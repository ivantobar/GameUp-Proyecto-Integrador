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
| 9 | Escalera de 5 niveles por juego (backend: 9.1 migración `79f69ef`, 9.2 reglas `5d5b109`, 9.3 subida y endpoints `8733ef8`) | `backend/fase-9-niveles-por-juego` | `8733ef8` | `main` (`fb4f0de`) |
| 9 | Escalera en la app (frontend, 9.4) y esta documentación (9.5) | `frontend/niveles-por-juego` | ver `git log` | `8733ef8` |
| — | Integración ASISCO UP: Swagger, consentimiento de voz y vínculos de acudientes (ver la sección 7) | `backend/integracion-asiscoup` | ver `git log` | `main` (`e0d160c`) |

**Estado al cerrar la fase 9 (2026-11-06):**
- Backend: `build` y `lint` pasan; 554 pruebas unitarias (44 archivos) y 171 e2e (12 archivos), incluida la de Swagger.
- Swagger documenta 58 rutas (74 operaciones): 4 nuevas de `niveles-juego`.
- Frontend: `npx tsc --noEmit` y `npm run lint` sin errores; 427 pruebas (56 archivos).
- No se agregaron dependencias (la app guarda el último nivel visto con `expo-secure-store`, que ya estaba).
- La migración `20261106000000_niveles_por_juego` se probó contra PostgreSQL 17 local y **no está aplicada en Supabase** (ver la sección 4, «Cómo probarla en el celular»).

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

### Fase 9: escalera de niveles por juego

Guía: `niveles-por-juego.md` (raíz del repositorio, sin commit).

1. **Qué es:** Emparejar, Clasificar, Secuenciar y Memoria tienen 5 niveles cada uno; el nivel va por estudiante y por juego y empieza en 1. NO son los niveles BAJO/MEDIO/ALTO (tabla `nivel`), que no cambian. Los juegos de habla no tienen escalera.
2. **Contenido:** cada nivel es una `actividad` con `nivel_juego` (1-5) dentro de un módulo especial (`modulo.es_escalera`, uno solo, sin publicar y que no se asigna). La siembra va en un script manual, `prisma/scripts/sembrar_escalera.sql`, que recibe el id de la directora (porque `modulo.creado_por` exige una DIRECTORA). Usa dibujos genéricos (emojis en `texto`).
3. **Fuera de las asignaciones (opción b):** `intento.asignacion_id` es opcional e `intento.estudiante_id` siempre dice de quién es. El progreso oficial, las tareas pendientes y la vista del acudiente siguen leyendo solo asignaciones.
4. **Solo el nivel ACTUAL:** el estudiante solo envía intentos de su nivel actual en cada juego (si completó el 5, del 5). Un nivel superado o uno al que aún no llega → 422. La base también lo exige.
5. **Subir:** basta una validación APROBADA del nivel actual (tallerista a cargo o directora). Sube un nivel; en el 5 marca `completado` y sigue en el 5. Rechazar no cambia nada y nunca baja sola. Todo va en la misma transacción que la validación, con una actualización condicional: dos aprobaciones a la vez suben uno solo.
6. **Lote:** en `aprobarLote()` se sube en orden (fecha, id), como máximo un nivel por intento elegible y sin saltar niveles.
7. **Bandeja:** de la escalera muestra solo el nivel actual y, de cada actividad, el intento más reciente con `pendientesMismaActividad` (aprobar uno basta). Los intentos de niveles ya superados quedan sin validar y no se muestran.
8. **Límites ampliados:** Clasificar admite 2 o 3 grupos y hasta 9 elementos; Secuenciar, hasta 6 pasos. Cada nivel exige su tamaño exacto (tabla en el README, «Escalera de niveles por juego»). En Emparejar 4 y 5, la tarjeta de arriba lleva `texto` o `cantidad`.
9. **Ajuste manual:** directora o tallerista a cargo, con motivo obligatorio; puede subir o bajar el nivel y deja el juego sin completar. No avisa al acudiente.
10. **Aviso al acudiente:** tipo nuevo `NIVEL_JUEGO`: «{nombre} subió al nivel N de {juego}. ¡Celébrenlo juntos!» o «{nombre} completó los 5 niveles de {juego}. ¡Qué gran logro!».
11. **Acceso:** el módulo de la escalera lo ven todos aunque no esté publicado (su contenido es genérico), así el estudiante carga su actividad y sus imágenes con las rutas de siempre. Solo lo edita la directora. Sus actividades no se desactivan ni se eliminan: se edita su configuración.
12. **App del niño:** el nivel se ve con estrellas (solo las ganadas, sin números ni «te falta»). Sin tarea, la tarjeta abre el nivel actual. Al subir, una celebración solo visual y breve (sin sonido ni cuenta regresiva) que sale una vez por subida.

## 4. Fases 8 y 9: lo implementado

### Fase 8

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

### Fase 9

| Ruta | Roles | Regla |
|---|---|---|
| `GET /estudiantes/me/niveles-juego` | estudiante | Su nivel en los 4 juegos, si completó el 5 y cuántos intentos del nivel esperan validación. |
| `GET /estudiantes/me/niveles-juego/:juego/actividad` | estudiante | `{ nivel, actividad }` del nivel actual. Las imágenes: `GET /modulos/:moduloId/contenidos/urls`. |
| `GET /estudiantes/:id/niveles-juego` | directora, tallerista a cargo, acudiente | Estudiante ajeno → 404. |
| `PUT /estudiantes/:id/niveles-juego/:juego` | directora, tallerista a cargo | `{ nivel, motivo }`. Ajeno → 404; el nivel cambió entre tanto → 409. |

Cambios en rutas existentes:
- `POST /intentos` acepta las actividades de la escalera: sin asignación y solo del nivel actual.
- `POST /intentos/:id/validacion` devuelve también `subidaNivel` (o `null`).
- `POST /validaciones/lote` devuelve `{ aprobados, subidas }`.
- `IntentoDto` trae `nivelJuego`, y su `asignacionId` puede ser `null`. La bandeja trae `actividad.nivelJuego`.
- `ActividadDto` trae `nivelJuego`.

Módulo nuevo: `niveles-juego`. La subida vive en `subirSiCorresponde` (infraestructura), que llama la regla pura `subidaPorAprobacion` (dominio) dentro de la transacción de la validación.

**Migración `20261106000000_niveles_por_juego`:** `modulo.es_escalera`, `actividad.nivel_juego`, tablas `nivel_juego_estudiante` e `historial_nivel_juego`, `intento.estudiante_id` y `asignacion_id` opcional, y el tipo de aviso `NIVEL_JUEGO`. El detalle está en `prisma/MIGRACIONES.md`. Prueba SQL: `prisma/pruebas/niveles_por_juego.sql`.

**App (`frontend/niveles-por-juego`):**
- repositorio `levels` (HTTP y simulado, mismo contrato);
- estrellas en las tarjetas y celebración al subir;
- tableros más grandes que caben en el celular: Memoria en 3 columnas desde 8 cartas; Secuenciar con 5 o 6 pasos en filas de 3; Clasificar compacto con 3 grupos;
- tallerista: nivel del intento, niveles del estudiante y aviso «¡… subió al nivel N de …!»;
- acudiente: «Juegos de …».

### Cómo probarla en el celular

Usa las cuentas de prueba (ficticias) que ya existen en Supabase. Estas son las que tienen datos de prueba:
- estudiante: `usuario.id` 5;
- tallerista a cargo: `usuario.id` 3;
- acudiente: `usuario.id` 4;
- directora: `usuario.id` 1.

1. **Revisa qué falta aplicar.** En `GameUp-backend`, con el `.env` apuntando a Supabase, ejecuta `npx prisma migrate status`. Debe decir 4 migraciones aplicadas y 1 pendiente: `20261106000000_niveles_por_juego`.
2. **Aplica la migración:** `npm run db:deploy`. Luego, otra vez `npx prisma migrate status`: debe decir que todo está al día.
3. **Siembra la escalera.** En Supabase → SQL Editor, pega `prisma/scripts/sembrar_escalera.sql`, reemplaza `<<ID_DIRECTORA>>` por `1` y ejecútalo. Debe terminar con «Escalera de juegos: módulo N, 20 actividades nuevas.». Si lo ejecutas otra vez, dirá «0 actividades nuevas».
4. **Reinicia el backend.** Detén `npm run start:dev`, ejecuta `npm run db:generate` (el cliente de Prisma cambió) y vuelve a iniciarlo con `npm run start:dev`. Comprueba `http://TU_IP:3000/api/v1/health` desde el celular.
5. **Reinicia Expo** en `GameUp-frontend` con `npx expo start --clear`, y abre la app en Expo Go con `EXPO_PUBLIC_DATA_SOURCE=api`.
6. **Estudiante:**
   - entra y abre **Juegos**: Emparejar, Clasificar, Secuenciar y Memoria muestran 1 estrella, sin números;
   - toca **Memoria**: abre el nivel 1, con 2 parejas (4 cartas con dibujos). Si la tarjeta dice «Tarea», primero abre esa tarea del módulo; termínala y, al volver, la tarjeta ya abre el nivel;
   - termínalo: sale «Tu profe va a revisar tu juego…»;
   - opcional: juégalo otra vez, para ver el aviso de varios intentos en la bandeja.
7. **Tallerista:**
   - entra a **Por escuchar** y abre la tarjeta «Memoria · nivel 1»;
   - debe decir «Escalera: nivel 1…» (o «Jugó 2 veces este nivel; aprobar una lo sube») y mostrar «Juegos de …» con los 4 niveles;
   - toca **Lo logró**: aparece «¡… subió al nivel 2 de Memoria!»;
   - si había otro intento del nivel 1, ya no aparece en la bandeja.
8. **Estudiante otra vez:**
   - vuelve a **Juegos** (cambia de pestaña o cierra y abre la app);
   - sale una celebración corta «¡Subiste de nivel en Memoria!», sin sonido, que se cierra sola o con «¡Sí!»;
   - Memoria tiene 2 estrellas y Emparejar sigue con 1;
   - toca Memoria: ahora son 3 parejas (6 cartas);
   - al volver a Juegos, la celebración no se repite.
9. **Acudiente:** en **Practicar en casa** aparece «Juegos de …», con Memoria en nivel 2 y los demás en nivel 1. El aviso `NIVEL_JUEGO` queda en la tabla `notificacion`, pero la app todavía no muestra los avisos (pendiente).
10. **Opcional, para ver los tableros grandes:** como tallerista, en Swagger (`/api-docs`, botón Authorize), `PUT /estudiantes/5/niveles-juego/MEMORIA` con `{ "nivel": 5, "motivo": "Prueba de tablero" }`. El niño ve 12 cartas en 4 filas de 3. Luego devuélvelo con otro `PUT` (por ejemplo, `{ "nivel": 2, "motivo": "Fin de la prueba" }`).

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

**Fase 9** (probado el 2026-11-05 contra PostgreSQL 17 local, en una base desechable):
- Las 5 migraciones con `db:deploy`; `niveles_por_juego.sql`, `ajustes_revision.sql` y `practica_casa.sql` pasan.
- La migración aplicada sobre datos previos: relleno inicial en nivel 1, `estudiante_id` copiado de la asignación, sin cambiar intentos, validaciones ni progreso.
- `sembrar_escalera.sql` ejecutado dos veces (20 actividades y luego 0).
- `prisma db pull` coincide con `schema.prisma`.
- Los repositorios compilados contra la base:
  - intentos sin asignación;
  - bandeja agrupada y sin niveles superados;
  - subida con historial y aviso en la misma transacción;
  - lote atómico y en orden;
  - dos aprobaciones simultáneas suben una sola vez;
  - ajuste manual (con conflicto y tallerista ajena);
  - completar el nivel 5.
- Falta: aplicarla en Supabase y el recorrido en el celular (ver «Cómo probarla en el celular»).

**Supabase Storage real**
- La subida por *stream*.
- Las URLs firmadas y el borrado en los buckets `contenidos` y `grabaciones`.

## 6. Otros pendientes abiertos

- **Mapper del perfil:** confirmado el 2026-11-05 con una cuenta de prueba: `GET /api/auth/perfil` devuelve un objeto plano con `id_usuario` (número), `nombres`, `apellidos`, `correo_usuario` y `roles: [{ id_rol, nombre_rol }]`. El mapper ya lo leía bien y no cambió; se agregó una prueba con esa forma (valores ficticios) que comprueba que documento, teléfono, dirección y fecha de nacimiento no pasan a GameUP.
- **Consentimiento vigente:** resuelto con la integración ASISCO UP (sección 7): se lee `autorizaGrabacionVoz` cuando hay `ASISCO_API_URL`. Sin ella, nunca se guarda audio; `CONSENTIMIENTO_SIMULADO` solo se permite fuera de producción.
- **Revocación de tokens:** un token revocado en la API de seguridad puede seguir sirviendo hasta 5 minutos, por la caché.
- **Escalera de niveles (fase 9):**
  - **Pantalla de ajuste manual en la app:** el endpoint `PUT /estudiantes/:id/niveles-juego/:juego` existe y está probado, pero la app no tiene pantalla. Por ahora se usa Swagger.
  - **Mostrar el aviso `NIVEL_JUEGO` en la app:** el backend lo crea al subir de nivel, pero la app todavía no muestra ninguna notificación (de ningún tipo).
  - **Aplicar en Supabase** la migración `20261106000000_niveles_por_juego`, ejecutar `sembrar_escalera.sql` y hacer el recorrido en el celular.
  - **Crear actividades nuevas de la escalera por la API** no está disponible: el script siembra las 20 y la directora las edita con `PATCH /actividades/:id` (por ejemplo, para cambiar los emojis por pictogramas de la fundación).
- **Frontend:** la conexión con la API (rama `frontend/conexion-api`) ya está unida a `main` (`fb4f0de`). La lista que sigue fue el contrato de esa conexión:
  - enviar `actividadId` en los intentos;
  - mostrar los módulos de forma dinámica;
  - traducir los códigos de juego y de estado;
  - agregar la revisión de los juegos sin voz;
  - pedir el audio antes de validar un intento de voz;
  - armar `WeeklyPractice` con las tres rutas de la fase 8 (ver la decisión 5 de la fase 8);
  - mostrar la retroalimentación de las actividades aprobadas.

## 7. Integración ASISCO UP

Rama `backend/integracion-asiscoup`, desde `main` (`e0d160c`). Sin migraciones y sin cambios en la app.

**Reparto de responsabilidades (pedido por la profesora: no duplicar):**
- **API de seguridad:** login, cuentas y JWT. GameUP reenvía el login y no emite tokens.
- **ASISCO UP** (`https://proyecto-asiscoup-g1-jvaz.onrender.com`): datos personales de estudiantes y acudientes, vínculos familiares y consentimiento.
- **GameUP:** módulos, juegos, asignaciones, intentos, validaciones, progreso y práctica en casa. `estudiante` es el *perfil de aprendizaje*, enlazado por `id_estudiante_externo` = `idEstudiante` de ASISCO UP.

**Commits**

| Commit | Qué cambia |
|---|---|
| `c291f74` | Swagger (solo textos): de quién es cada dato; sección «Perfil de aprendizaje del estudiante». |
| `b373980` | Adaptador HTTP de consentimiento (primera versión, sin conectar). |
| `603b469` | Permiso de voz: `autorizaGrabacionVoz`; `ConsentimientoModule` usa ASISCO UP si hay `ASISCO_API_URL`; variables nuevas en `env.validation.ts`, `.env.example` y `render.yaml`. |
| `c7f6c6a` | Vínculos de acudientes: copia desde ASISCO UP al iniciar sesión; 409 al editarlos a mano. |
| ver `git log` | Pruebas de los factories de los módulos, 409 en Swagger y esta documentación. |

**Interruptor único: `ASISCO_API_URL`.** Todo lo de ASISCO UP se activa solo si existe. Sin ella, GameUP funciona exactamente como antes: no se graba voz (falla cerrado) y la directora vincula acudientes a mano. Para «apagar» la integración en Render basta con quitar la variable. `ASISCO_API_TIMEOUT_MS` (5000 por defecto) limita cada llamada.

**Consentimiento de voz** (`GET /api/estudiantes/{idEstudianteExterno}/consentimiento`). Se graba solo si, a la vez: `tieneConsentimientoVigente === true`, `autorizaGrabacionVoz === true`, `requiereAceptarTerminos !== true` y el `idEstudiante` de la respuesta es el pedido (la ruta de ASISCO UP acepta varios tipos de id). Si falta el campo, el formato es raro, responde por otro niño o no responde → no se graba. 404 → sin consentimiento.

**Vínculos de acudientes: `acudiente_estudiante` ahora es una copia de solo lectura.**
- Cuando un ACUDIENTE inicia sesión, GameUP llama `GET /api/acudientes/me/estudiantes` con **el token de ese acudiente** y deja su copia igual a lo que dice ASISCO UP (en una transacción: borra lo que ya no está, mueve la marca de principal respetando `uq_acudiente_principal` y hace `upsert` del resto). Solo toma `idUsuarioAuth`, `idEstudiante`, `parentesco.nombre` y `esPrincipal`.
- Si ASISCO UP responde por otro `idUsuarioAuth`, no se toca nada. Los estudiantes que no están en GameUP se ignoran. Si ASISCO UP falla, se registra un aviso (solo el código de estado), la copia queda como estaba y el login sigue.
- Con `ASISCO_API_URL`, `POST`, `PATCH` y `DELETE /estudiantes/{id}/acudientes` responden **409** («Los acudientes se vinculan en ASISCO UP…»). `GET` sigue leyendo la copia.
- **Por qué no se borra la tabla:** la usan los permisos del acudiente (`alcance.ts` y los repositorios de estudiantes, asignaciones y módulos), la función SQL `fn_notificar_acudientes` (avisos de nivel, observaciones y módulos nuevos) y el trigger `fn_practica_casa_vinculo`. Borrarla rompería todo eso.

**Datos de prueba que conectan los tres sistemas** (cuentas ficticias):

| Quién | API de seguridad (`id_usuario`) | ASISCO UP | GameUP |
|---|---|---|---|
| Estudiante GameUP | 13 | `idEstudiante` 12 | `id_estudiante_externo` = 12 (ajustado a mano en Supabase el 2026-11-08) |
| Acudiente GameUP | 15 | `idAcudiente` 7, vinculado al 12 como Madre (principal) | cuenta ACUDIENTE |
| Directora GameUp | 16 | — | cuenta DIRECTORA |

**Pendientes de la integración**
1. **Render:** tras unir a `main`, revisar que `ASISCO_API_URL` esté puesta (`render.yaml` ya la trae con valor).
2. **Cambiar el `idEstudianteExterno` desde la app:** hoy solo se pone al crear el usuario. Falta un endpoint para la directora que lo cambie validando contra ASISCO UP.
3. **Validar el `idEstudianteExterno` al crear el estudiante** (`POST /usuarios`) con `GET /api/estudiantes/:id` de ASISCO UP, comprobando que el `idEstudiante` de la respuesta sea el mismo.
4. **Los vínculos se refrescan solo cuando el acudiente inicia sesión.** Si ASISCO UP quita un vínculo, GameUP lo nota en el siguiente login de ese acudiente.
5. **Pantalla para aceptar los términos en GameUP (decisión pendiente).** ASISCO UP ofrece el texto legal (`GET /api/catalogos/versiones-terminos`) y `POST /api/consentimientos`.
6. **Avisar a ASISCO UP:**
   - (a) `/api/estudiantes/:id` con tres tipos de id puede confundir niños (ya hay choques reales: su estudiante 12 frente al usuario 12 de seguridad).
   - (b) «Mis estudiantes vinculados» con una cuenta ADMIN creó un acudiente: debería aceptar solo cuentas ACUDIENTE y no crear registros al consultar.
   - (c) Una cuenta de tallerista tiene rol ESTUDIANTE en seguridad y quedó como estudiante en ASISCO UP.
   - (d) Varios endpoints con datos de menores responden sin token, y `POST /api/consentimientos` debería exigir el token del acudiente.
