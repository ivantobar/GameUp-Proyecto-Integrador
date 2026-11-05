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
```

Si todo está bien, termina con `TODAS LAS PRUEBAS PASARON`.
