# Pruebas SQL de la base de datos

`ajustes_revision.sql` comprueba las reglas que viven en la base: que solo el
tallerista a cargo (o la directora) asigne, valide u observe a un estudiante; que el progreso cuente solo actividades aprobadas y se recalcule al
cambiar las actividades; que solo Habla conmigo tenga grabaciones; y que las
grabaciones validadas queden listas para borrarse.

Usa datos ficticios, corre dentro de una transacción y hace `rollback` al
final, así que no deja nada en la base. Aun así, **ejecútalo en una base local,
no en Supabase**.

## Base local

```bash
createdb gameup_test
psql -d gameup_test <<'SQL'
create role anon nologin;
create role authenticated nologin;
-- Supabase ya trae este esquema; en local se simula:
create schema storage;
create table storage.buckets (id text primary key, name text not null,
  public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
SQL

DATABASE_URL="postgresql://postgres:TU_CLAVE@localhost:5432/gameup_test" npm run db:deploy
psql -d gameup_test -f prisma/pruebas/ajustes_revision.sql
psql -d gameup_test -f prisma/pruebas/practica_casa.sql
```

Si todo está bien, terminan con `TODAS LAS PRUEBAS PASARON` y
`TODAS LAS PRUEBAS DE PRACTICA_CASA PASARON`.

`practica_casa.sql` prueba la migración `20261105120000_practica_casa`: que solo
un acudiente vinculado marque la práctica, que el mismo día no se repita, que
tenga RLS sin permisos y que se borre en cascada con el estudiante.

Después de aplicarla en local, compara `prisma/schema.prisma` con lo que genere
`npx prisma db pull` (el modelo `practica_casa` se escribió a mano).
