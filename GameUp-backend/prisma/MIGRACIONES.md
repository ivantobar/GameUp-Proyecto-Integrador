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

**`20261105120000_practica_casa` (fase 8): PENDIENTE de aplicar en Supabase.**
Crea la tabla `practica_casa` («Lo practicamos hoy» del acudiente), con un trigger
de rol (ACUDIENTE), otro de vínculo con el estudiante, RLS sin políticas y sin
permisos para `anon`/`authenticated`. Antes de aplicarla en Supabase:

1. Aplicarla en una base local y correr `prisma/pruebas/practica_casa.sql`.
2. Comparar el modelo `practica_casa` de `schema.prisma` (escrito a mano) con
   el que genere `npx prisma db pull` contra esa base local.
3. **Pedir confirmación** y solo entonces ejecutar `npm run db:deploy` contra Supabase.

Mientras no esté aplicada, las rutas de práctica en casa
(`/estudiantes/:id/practica-semanal` y `/estudiantes/:id/practica-casa/hoy`)
fallan porque la tabla no existe; el resto de la API no se ve afectado.

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
  deshace todo al final.

### `allowScripts` (npm 12)

npm 12 solo ejecuta los scripts de instalación de dependencias aprobadas.
`package.json` ya aprueba `prisma` y `@prisma/engines`, igual que en clase.
Si al actualizar Prisma npm avisa de scripts bloqueados:
`npm approve-scripts prisma @prisma/engines`.

