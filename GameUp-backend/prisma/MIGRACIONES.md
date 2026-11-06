# Migraciones de la base de datos

La base de Supabase se creó a mano en el SQL Editor. `0_esquema_inicial`
reproduce ese estado exacto y `20261105000000_ajustes_revision` aplica los
ajustes de la revisión (ids externos, rol TALLERISTA, voz del estudiante,
buckets de Storage, tipos de juego del MVP y verificación de vínculos).

**Primera vez contra Supabase** (solo una persona del equipo, una sola vez):

```bash
npx prisma migrate resolve --applied 0_esquema_inicial   # ya existe: no se ejecuta
npm run db:deploy                                        # aplica los ajustes
```

**`20261105120000_practica_casa` (fase 8): aplicada en Supabase el 2026-11-05.**
Crea la tabla `practica_casa` («Lo practicamos hoy» del acudiente), con un trigger
de rol (ACUDIENTE), otro de vínculo con el estudiante, RLS sin políticas y sin
permisos para `anon`/`authenticated`. Antes de aplicarla se hizo esto:

1. Se aplicó en PostgreSQL real y pasaron `prisma/pruebas/practica_casa.sql` y
   `prisma/pruebas/ajustes_revision.sql`.
2. `npx prisma db pull` dio el mismo modelo `practica_casa` que `schema.prisma`.
3. Con confirmación, `npx prisma migrate status` (3 aplicadas, 1 pendiente) y
   `npm run db:deploy` contra Supabase. Después se comprobaron en Supabase las
   columnas, la PK, RLS, los dos triggers y que `anon`/`authenticated` no tengan permisos.

**`20261106000000_niveles_por_juego` (fase 9): SIN APLICAR en Supabase.**
Escalera de 5 niveles por juego (Emparejar, Clasificar, Secuenciar y Memoria).
No toca BAJO/MEDIO/ALTO (tabla `nivel`). No borra datos. Hace esto:

- `modulo.es_escalera`: como máximo un módulo; no cambia después de creado y
  no se puede asignar (se reemplaza `fn_asignacion_antes`).
- `actividad.nivel_juego` (1 a 5): obligatorio en el módulo de la escalera y
  prohibido fuera de él; una sola actividad activa por juego y nivel.
- Tabla `nivel_juego_estudiante` (nivel actual y `completado`, por estudiante y
  juego). Los estudiantes que ya existen quedan en el nivel 1 de los 4 juegos, y
  un trigger hace lo mismo con los nuevos.
- Tabla `historial_nivel_juego` (cada subida por validación o ajuste manual,
  este con motivo obligatorio). Solo DIRECTORA o la TALLERISTA a cargo; un
  intento sube una sola vez.
- `intento.estudiante_id` (nuevo, se copia de la asignación) y
  `intento.asignacion_id` opcional: los intentos de la escalera no tienen
  asignación. Se reemplazan `fn_intento_antes` (sin asignación, solo el nivel
  ACTUAL del estudiante en ese juego) y `fn_exigir_vinculo` (la validación
  busca al estudiante en el intento). Un intento ya no cambia de estudiante,
  actividad ni asignación.
- Tipo de aviso nuevo `NIVEL_JUEGO`; RLS sin políticas y sin permisos para
  `anon`/`authenticated` en las tablas nuevas.

Probada en PostgreSQL 17 local (2026-11-05): `db:deploy` de las 5 migraciones;
`prisma/pruebas/niveles_por_juego.sql`, `ajustes_revision.sql` y
`practica_casa.sql` pasan; aplicada sobre datos previos, conserva intentos,
validaciones y progreso; `npx prisma db pull` da los mismos modelos que
`schema.prisma`.

Para aplicarla (con confirmación): `npx prisma migrate status`,
`npm run db:deploy` y después `prisma/scripts/sembrar_escalera.sql`, con el id de una
directora, en el SQL Editor de Supabase. El script crea la categoría `JUEGOS`, el
módulo «Escalera de juegos» (sin publicar) y los 20 niveles con dibujos genéricos
(emojis). Se puede repetir: solo crea lo que falta.

**En una base local nueva**: `npm run db:deploy` aplica todas. La base local
necesita el esquema `storage` con la tabla `buckets`, que Supabase trae por defecto
(ver `prisma/pruebas/README.md`).

- Los triggers, las restricciones CHECK, RLS, la vista `grabacion_por_eliminar` y
  los buckets solo existen en las migraciones: Prisma no los modela.
- No cambies tablas desde el SQL Editor de Supabase: crea una migración. Si no,
  el historial deja de coincidir con la base.
- `prisma/scripts/` tiene scripts que se ejecutan a mano y **no** son
  migraciones (no cambian el esquema): `alta_primera_directora.sql` crea la
  primera cuenta de directora.
- `prisma/pruebas/ajustes_revision.sql` prueba las reglas de la base
  (vínculos, progreso, grabaciones). Se ejecuta dentro de una transacción y
  deshace todo al final. `prisma/pruebas/niveles_por_juego.sql` hace lo mismo con
  la escalera de niveles.
- `prisma/scripts/sembrar_escalera.sql` siembra los 5 niveles de cada juego
  (necesita el id de una directora).

### `allowScripts` (npm 12)

npm 12 solo ejecuta los scripts de instalación de dependencias aprobadas.
`package.json` ya aprueba `prisma` y `@prisma/engines`, igual que en clase.
Si al actualizar Prisma npm avisa de scripts bloqueados:
`npm approve-scripts prisma @prisma/engines`.

