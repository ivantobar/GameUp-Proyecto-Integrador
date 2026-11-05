-- Quita el rol PSICOLOGO (2026-11-05).
--
-- La API de seguridad no tiene ese rol y la fundación no lo usará en el MVP.
-- Quedan DIRECTORA, TALLERISTA, ACUDIENTE y ESTUDIANTE. No hay usuarios con
-- ese rol ni filas en psicologo_estudiante, así que no se pierde información.
 
drop table public.psicologo_estudiante;
 
delete from public.rol where nombre = 'PSICOLOGO';
alter table public.rol drop constraint ck_rol_nombre;
alter table public.rol add constraint ck_rol_nombre
  check (nombre = any (array['DIRECTORA', 'TALLERISTA', 'ACUDIENTE', 'ESTUDIANTE']));
 
drop trigger trg_rol_asignacion on public.asignacion;
create trigger trg_rol_asignacion before insert or update of asignado_por on public.asignacion
  for each row execute function fn_exigir_rol('asignado_por', 'DIRECTORA,TALLERISTA');
 
drop trigger trg_rol_modulo on public.modulo;
create trigger trg_rol_modulo before insert or update of creado_por on public.modulo
  for each row execute function fn_exigir_rol('creado_por', 'DIRECTORA,TALLERISTA');
 
drop trigger trg_rol_observacion on public.observacion;
create trigger trg_rol_observacion before insert or update of autor_id on public.observacion
  for each row execute function fn_exigir_rol('autor_id', 'DIRECTORA,TALLERISTA');
 
drop trigger trg_rol_validacion on public.validacion;
create trigger trg_rol_validacion before insert or update of validador_id on public.validacion
  for each row execute function fn_exigir_rol('validador_id', 'DIRECTORA,TALLERISTA');
 
-- La directora puede con todos; el tallerista, solo con sus estudiantes activos.
create or replace function public.fn_exigir_vinculo()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare
  v_col text := tg_argv[0];
  v_uid bigint;
  v_est bigint;
  v_rol text;
begin
  v_uid := nullif(to_jsonb(new) ->> v_col, '')::bigint;
  if v_uid is null then
    return new;
  end if;
 
  if tg_table_name = 'validacion' then
    select a.estudiante_id into v_est
      from public.intento i join public.asignacion a on a.id = i.asignacion_id
     where i.id = new.intento_id;
  else
    v_est := (to_jsonb(new) ->> 'estudiante_id')::bigint;
  end if;
 
  select r.nombre into v_rol
    from public.usuario u join public.rol r on r.id = u.rol_id
   where u.id = v_uid;
 
  if v_rol = 'DIRECTORA'
     or (v_rol = 'TALLERISTA' and exists (
           select 1 from public.tallerista_estudiante
            where tallerista_id = v_uid and estudiante_id = v_est and activo)) then
    return new;
  end if;
 
  raise exception 'El usuario % no tiene asignado al estudiante % (%.%)',
    v_uid, v_est, tg_table_name, v_col using errcode = '42501';
end $function$;
 
revoke execute on all functions in schema public from public, anon, authenticated;
 