-- Prueba de la migración 20261105120000_practica_casa («Lo practicamos hoy»).
-- Datos ficticios, dentro de una transacción con rollback al final.
-- Ejecútalo en una base LOCAL con todas las migraciones aplicadas:
--   psql -d gameup_test -f prisma/pruebas/practica_casa.sql
\set ON_ERROR_STOP 1
begin;

create function pg_temp.debe_fallar(p_sql text, p_msg text, p_codigo text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_codigo then
      raise exception 'FALLO: % -> se esperaba el código %, llegó % (%)', p_msg, p_codigo, sqlstate, sqlerrm;
    end if;
    raise notice 'OK (rechazado, %): % -> %', sqlstate, p_msg, sqlerrm;
    return;
  end;
  raise exception 'FALLO: se esperaba un error en: %', p_msg;
end $$;

-- Personas (ids ficticios)
insert into usuario (id, rol_id, nombres, apellidos, id_usuario_auth) values
  (1, (select id from rol where nombre='DIRECTORA'),  'Dir',  'Prueba', 101),
  (2, (select id from rol where nombre='TALLERISTA'), 'Tall', 'Uno',    102),
  (4, (select id from rol where nombre='ESTUDIANTE'), 'Est',  'Uno',    104),
  (5, (select id from rol where nombre='ACUDIENTE'),  'Acu',  'Uno',    105),
  (6, (select id from rol where nombre='ESTUDIANTE'), 'Est',  'Dos',    106),
  (7, (select id from rol where nombre='ACUDIENTE'),  'Acu',  'Dos',    107);
insert into estudiante (usuario_id, id_estudiante_externo) values (4, 7004), (6, 7006);
insert into acudiente_estudiante values (5, 4, 'Madre', true), (7, 6, 'Padre', true);

-- El acudiente vinculado marca el día; el mismo día dos veces choca con la PK.
insert into practica_casa (estudiante_id, acudiente_id, fecha) values (4, 5, date '2026-11-05');
select pg_temp.debe_fallar($$insert into practica_casa (estudiante_id, acudiente_id, fecha) values (4, 5, date '2026-11-05')$$,
  'mismo día dos veces', '23505');
insert into practica_casa (estudiante_id, acudiente_id, fecha) values (4, 5, date '2026-11-04')
  on conflict do nothing;

-- Rol y vínculo
select pg_temp.debe_fallar($$insert into practica_casa (estudiante_id, acudiente_id, fecha) values (4, 2, current_date)$$,
  'tallerista marca práctica en casa', '23514');
select pg_temp.debe_fallar($$insert into practica_casa (estudiante_id, acudiente_id, fecha) values (4, 1, current_date)$$,
  'directora marca práctica en casa', '23514');
select pg_temp.debe_fallar($$insert into practica_casa (estudiante_id, acudiente_id, fecha) values (6, 5, current_date)$$,
  'acudiente sin vínculo con el estudiante', '42501');
select pg_temp.debe_fallar($$update practica_casa set estudiante_id = 6 where acudiente_id = 5 and fecha = date '2026-11-04'$$,
  'mover la práctica a un estudiante ajeno', '42501');

do $$ begin
  assert (select count(*) from practica_casa where estudiante_id = 4) = 2, 'dos días para el estudiante 4';
  assert (select relrowsecurity from pg_class where oid = 'public.practica_casa'::regclass), 'RLS activado';
  assert not exists (select 1 from information_schema.role_table_grants
                      where table_schema='public' and table_name='practica_casa'
                        and grantee in ('anon','authenticated')), 'sin permisos de tabla';
  assert not exists (select 1 from information_schema.role_routine_grants
                      where routine_schema='public' and routine_name='fn_practica_casa_vinculo'
                        and grantee in ('anon','authenticated','PUBLIC')), 'sin permisos de la función';
end $$;

-- Borrar al estudiante borra su práctica (on delete cascade).
delete from usuario where id = 4;
do $$ begin
  assert (select count(*) from practica_casa where estudiante_id = 4) = 0, 'cascada al borrar el estudiante';
end $$;

\echo TODAS LAS PRUEBAS DE PRACTICA_CASA PASARON
rollback;
