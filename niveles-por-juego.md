# Prompt: escalera de niveles por juego (Emparejar, Clasificar, Memoria, Secuenciar)

Versión 2 (2026-11-06): cada juego tiene su propia escalera de 5 niveles de dificultad, y el niño sube un escalón cuando una tallerista o la directora aprueba su intento.

Copia todo lo que está debajo de la línea y pégalo en Claude Code, abierto en la raíz del repositorio `GameUp-Proyecto-Integrador`.

---

Vas a implementar en GameUP una **escalera de niveles de dificultad para cada juego**: Emparejar, Clasificar, Memoria y Secuenciar. Trabaja **por fases**. Al terminar cada fase te detienes, me muestras un resumen (archivos tocados, comandos ejecutados y su resultado real) y esperas a que yo diga «sigue». No avances de fase sin mi confirmación. Responde siempre en español.

## 1. Lo que quiere el equipo (decidido)

- Cada juego tiene **su propia escalera de 5 niveles**. Es el mismo juego, cada nivel un poco más difícil que el anterior.
- El nivel va **por estudiante y por juego**: un niño puede ir en Memoria nivel 3 y en Emparejar nivel 1.
- **Basta una validación**: cuando una tallerista (de ese estudiante) o la directora **APRUEBA** el intento del nivel actual, el niño pasa al siguiente nivel **de ese juego**. Si le piden «Practicar más», se queda en el mismo nivel y lo repite.
- Todo niño empieza en el nivel 1 de cada juego. En el nivel 5, al aprobar, el juego queda «completado» y se celebra; puede seguir jugando el nivel 5.
- **Estos niveles NO son** los niveles BAJO/MEDIO/ALTO de la tabla `nivel`. Esos se quedan como están (nivel general del niño y de los módulos). No los mezcles.
- Los juegos de habla (Habla conmigo y Busca la boca) no cambian.

### Escalera propuesta (qué cambia en cada nivel)

| Nivel | Memoria | Emparejar | Clasificar | Secuenciar |
|---|---|---|---|---|
| 1 | 2 parejas (4 cartas), dibujos muy distintos | 2 opciones, imagen igual a imagen | 2 grupos, 4 elementos, diferencia muy obvia (p. ej. color) | 2 pasos |
| 2 | 3 parejas (6 cartas) | 3 opciones, imagen igual a imagen | 2 grupos, 6 elementos | 3 pasos |
| 3 | 4 parejas (8 cartas) | 4 opciones, imagen igual a imagen | 2 grupos, 8 elementos | 4 pasos |
| 4 | 5 parejas (10 cartas) | 3 opciones, imagen con palabra o cantidad | 3 grupos, 6 elementos | 5 pasos |
| 5 | 6 parejas (12 cartas), dibujos parecidos | 4 opciones, imagen con palabra o cantidad | 3 grupos, 9 elementos, categorías más cercanas | 6 pasos |

Hoy `GameUp-backend/src/modules/catalogo/domain/juegos/estrategias.ts` permite: Memoria 2–6 parejas, Emparejar 2–4 opciones, Clasificar exactamente 2 grupos y 2–8 elementos por conjunto, Secuenciar 2–4 pasos. Para esta escalera hay que **ampliar**: Clasificar a 2–3 grupos y hasta 9 elementos, Secuenciar hasta 6 pasos. Revisa que el frontend (`RoundGameScreen`, tarjetas, tablero de Memoria) quepa bien en un celular con esos tamaños: botones grandes, sin scroll innecesario. Si algo no cabe, dímelo y propón el ajuste.

## 2. Reglas del proyecto que no puedes romper

- Solo cuentan las validaciones APROBADAS. Un intento pendiente o rechazado nunca sube de nivel. Mientras un intento espera validación, el niño puede volver a jugar el mismo nivel, pero no se le abre el siguiente.
- Los permisos se verifican en el backend (tallerista solo con sus estudiantes vía `tallerista_estudiante`; si no le corresponde, **404**, como ya hace el resto de la API).
- Los juegos no tienen límites de tiempo, vidas ni sonidos de error. Subir de nivel no puede introducir nada de eso. No hay bajada de nivel automática.
- Cambios de base de datos **solo con una migración Prisma nueva** en `GameUp-backend/prisma/migrations/`. Nunca edites migraciones aplicadas (`0_esquema_inicial`, `20261105000000_ajustes_revision`, `20261105030000_quitar_psicologo`, `20261105120000_practica_casa`). Nunca ejecutes `prisma migrate dev`, `migrate reset` ni `db push` contra Supabase. La migración la aplico yo con `npm run db:deploy` cuando la revise.
- Respeta las reglas permanentes de `GameUp-backend/docs/AVANCE.md` (capas `domain/application/infrastructure/presentation`, tokens `Symbol`, imports `.js`, ids `bigint` en entidades y `string` en DTO, errores `{ statusCode, error, message }`, Swagger en cada endpoint, `test/swagger.e2e-spec.ts` debe seguir pasando).
- No agregues dependencias nuevas ni inventes tablas, campos o endpoints como si ya existieran: verifica en el código.
- No pongas secretos ni datos reales de menores en pruebas o ejemplos.

## 3. Lo que ya existe (verifícalo, no lo des por hecho)

Backend (`GameUp-backend`, rama `main`, ya tiene las fases 1 a 8):
- `prisma/schema.prisma`: `actividad` (modulo_id, tipo_juego_id, `configuracion` Json, orden, activa), `modulo` (nivel_id BAJO/MEDIO/ALTO, publicado), `asignacion` (un **módulo** asignado a un estudiante; único por módulo+estudiante mientras no esté COMPLETADO), `intento` (**`asignacion_id` obligatorio**), `validacion` (intento_id único, resultado, validador_id), `tipo_juego` (codigo `EMPAREJAR`, `CLASIFICAR`, `SECUENCIAR`, `MEMORIA`…), `historial_nivel`.
- `src/modules/catalogo/domain/juegos/estrategias.ts`: valida la `configuracion` de cada juego y el `resultado` de cada intento.
- `src/modules/validaciones/application/validacion.service.ts`: `validar()` (uno por uno) y `aprobarLote()` (varios intentos sin voz), que escriben en `infrastructure/prisma-validacion.repository.ts` con `$transaction`.
- `src/modules/asignaciones/application/avance-asignacion.service.ts`: progreso oficial y `pendientesDelEstudiante()`.
- `src/modules/intentos`: registro de intentos; `src/modules/notificaciones`: avisos a acudientes.

Frontend (`GameUp-frontend`, rama `frontend/conexion-api`, **aún no unida a `main`**):
- Lista de juegos: `src/features/games/useGameList.ts` y `catalog.ts` (`nextAssignment`), pantalla `src/app/student/(tabs)/games.tsx`. Hoy un juego se abre desde una tarea asignada o «libre» con contenido de ejemplo (`src/data/http/freePlay.ts`).
- Contenido del juego: `src/features/games/useActivityContent.ts`; juegos en `src/app/student/{match,classify,memory,sequence}/`.
- API: `src/data/http/` (repositorios, `dto/`, `mappers/`) y `src/data/types`.
- Tallerista: `src/app/teacher/index.tsx`; progreso del estudiante: `src/app/student/(tabs)/progress.tsx`; acudiente: `src/app/guardian/index.tsx`.

## 4. Fase 0 — Análisis y propuesta (sin escribir código)

Lee el código real y entrégame un plan corto que responda esto. Donde haya varias opciones, **recomienda una y explica por qué**; donde sea ambiguo, **pregúntame** antes de seguir.

1. **Contenido de cada nivel.** ¿Cada nivel es una `actividad` creada por la directora en el catálogo (con un campo nuevo, por ejemplo `actividad.nivel_juego` 1–5), o el backend arma el nivel solo a partir de un banco de imágenes (por ejemplo, Memoria nivel N toma N+1 parejas al azar)? Recomienda una para el MVP. Si es por actividades, propón cómo se valida que la `configuracion` de una actividad corresponde a su nivel (por ejemplo, Memoria nivel 3 = exactamente 4 parejas), usando la tabla de la sección 1, y cómo se crean los 5 niveles iniciales de cada juego (seed en la migración o script) con pictogramas genéricos, sin datos reales.
2. **Dónde guardar el nivel del niño.** Propón la tabla nueva (por ejemplo `nivel_juego_estudiante`: `estudiante_id`, `tipo_juego_id`, `nivel_actual` 1–5, `completado`, `actualizado_en`; PK compuesta; check 1–5; RLS activo sin políticas como el resto) y si guardamos historial de subidas.
3. **Cómo se juega un nivel sin romper las asignaciones.** Hoy `intento.asignacion_id` es obligatorio y las asignaciones son de módulos completos. Compara opciones, por ejemplo: a) un módulo especial «Escalera» por juego que se asigna automáticamente a cada estudiante; b) que la escalera viva fuera de las asignaciones (y qué cambia en `intento`, el progreso oficial y `pendientesDelEstudiante()`); c) otra que veas mejor. Dime cuál recomiendas y qué pasa con el progreso oficial de los módulos actuales.
4. **Qué intento sube.** Solo el aprobado del nivel actual del niño en ese juego. Aprobar un intento de un nivel ya superado no sube. Confírmalo o mejora la regla.
5. **Validación en lote.** En `aprobarLote()`, si hay varios intentos del mismo juego y estudiante, sube como máximo un nivel por intento elegible y nunca salta niveles. Todo dentro de la misma transacción que crea las validaciones.
6. **Ampliar los límites** de Clasificar (3 grupos, hasta 9 elementos) y Secuenciar (hasta 6 pasos) en `estrategias.ts` y en el frontend, sin romper las actividades que ya existen.
7. **Ajuste manual.** ¿La directora (y la tallerista a cargo) puede poner a mano el nivel de un juego, por ejemplo si el niño ya domina Memoria? Recomiéndame si entra en el MVP.
8. **Avisos.** ¿Se avisa al acudiente cuando el niño sube de nivel? Propón el texto.
9. **Lo que verá cada rol**: estudiante (en cada tarjeta de juego su nivel como estrellas o escalones, celebración al subir, sin presión; la pantalla del juego abre directamente su nivel actual), tallerista (nivel de cada juego de sus estudiantes y el nivel del intento que está revisando), acudiente (nivel de cada juego).
10. Lista de fases con las ramas que vas a crear y qué pruebas correrás en cada una.

Detente aquí y espera mi respuesta.

## 5. Fases de implementación (ajústalas según lo que aprobemos en la fase 0)

**Fase 1 — Migración.** Rama `backend/fase-9-niveles-por-juego` desde `main` actualizado. Migración nueva (por ejemplo `20261106000000_niveles_por_juego`) con la tabla del nivel del niño, el campo de nivel en la actividad si lo aprobamos, restricciones, índices, RLS y los datos iniciales acordados (5 niveles por juego). Inicializa en nivel 1 a los estudiantes existentes sin borrar datos. Actualiza `schema.prisma` y `prisma/MIGRACIONES.md`. Pruébala contra un PostgreSQL local (aplica las cuatro migraciones previas y luego esta), incluyendo que no rompe los triggers existentes de `validacion` e `intento`. No la apliques en Supabase.

**Fase 2 — Backend: reglas de cada nivel.** Amplía `estrategias.ts` (Clasificar 2–3 grupos y hasta 9 elementos; Secuenciar hasta 6 pasos) y agrega la comprobación de que la configuración de una actividad corresponde a su nivel. Pruebas unitarias de cada juego y nivel, y de que las actividades existentes siguen siendo válidas.

**Fase 3 — Backend: subir de nivel al aprobar.** Lógica de dominio pura (con pruebas) que decide si un intento aprobado sube de nivel, conectada en `validar()` y `aprobarLote()` dentro de la **misma transacción** que la validación. Endpoints: niveles de un estudiante (por ejemplo `GET /estudiantes/:id/niveles-juego`, mismo control de acceso que el progreso: directora, tallerista a cargo, acudiente vinculado o el propio estudiante), la actividad del nivel actual de un juego para el estudiante con sesión, y el ajuste manual si lo aprobamos. Swagger en todo. Pruebas e2e: aprobar sube 1→2; aprobar en 5 lo marca completado y se queda en 5; rechazar no cambia; aprobar un nivel ya superado no sube; el lote no salta niveles; un juego de habla no cambia; una tallerista ajena recibe 404. Corre `npm run build && npm run lint && npm test && npm run test:e2e`.

**Fase 4 — Frontend.** Rama `frontend/niveles-por-juego` desde `frontend/conexion-api`. DTO, mapper y repositorio en `src/data/http/`, tipos en `src/data/types`, y las pantallas acordadas: nivel en cada tarjeta de juego, el juego abre el nivel actual, celebración visual al subir (sin sonidos de error ni presión), tableros más grandes que quepan en el celular, y nivel por juego para tallerista y acudiente. Botones grandes, textos breves, iconos reconocibles. Corre `npx tsc --noEmit`, `npm run lint` y `npm test`.

**Fase 5 — Verificación y documentación.** Actualiza `GameUp-backend/docs/AVANCE.md` (fase 9: rama, commit, decisiones) y los README si cambian rutas. Dame los pasos para probar en el celular con las cuentas de prueba (el niño juega Memoria nivel 1 → la tallerista aprueba → el niño ve Memoria en nivel 2 con 3 parejas, y Emparejar sigue en nivel 1). No digas que algo funciona si no ejecutaste la comprobación.

Haz commit al final de cada fase con mensajes claros en español. No hagas push ni abras PR hasta que yo lo pida.
