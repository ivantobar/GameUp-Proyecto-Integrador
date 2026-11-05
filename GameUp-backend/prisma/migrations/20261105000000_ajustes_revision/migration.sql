-- Ajustes de la revisión de la base de datos (2026-11-05).
--
-- Contexto: la API de seguridad (login, usuarios, roles) y la API del núcleo
-- familiar (estudiantes, acudientes, vínculo y consentimiento) son la fuente
-- oficial. GameUp guarda una copia mínima de cada persona enlazada por sus ids
-- externos, y conserva lo propio del juego: módulos, actividades, asignaciones,
-- intentos, validaciones, progreso y la voz del estudiante.
--
-- Las tablas afectadas no tienen datos, así que ningún cambio pierde información.

-- ─── 1. Rol DOCENTE → TALLERISTA (como en la API de seguridad) ───────────────

alter table public.rol drop constraint ck_rol_nombre;
update public.rol
   set nombre = 'TALLERISTA',
       descripcion = 'Tallerista: asigna módulos y valida los intentos de sus estudiantes'
 where nombre = 'DOCENTE';
alter table public.rol add constraint ck_rol_nombre
  check (nombre = any (array['DIRECTORA', 'TALLERISTA', 'PSICOLOGO', 'ACUDIENTE', 'ESTUDIANTE']));

alter table public.docente_estudiante rename to tallerista_estudiante;
alter table public.tallerista_estudiante rename column docente_id to tallerista_id;
alter table public.tallerista_estudiante rename constraint docente_estudiante_pkey to tallerista_estudiante_pkey;
alter table public.tallerista_estudiante rename constraint docente_estudiante_docente_id_fkey to tallerista_estudiante_tallerista_id_fkey;
alter table public.tallerista_estudiante rename constraint docente_estudiante_estudiante_id_fkey to tallerista_estudiante_estudiante_id_fkey;
alter index public.ix_doc_est_estudiante rename to ix_tall_est_estudiante;

drop trigger trg_rol_docente on public.tallerista_estudiante;
create trigger trg_rol_tallerista before insert or update of tallerista_id on public.tallerista_estudiante
  for each row execute function fn_exigir_rol('tallerista_id', 'TALLERISTA');

drop trigger trg_rol_asignacion on public.asignacion;
create trigger trg_rol_asignacion before insert or update of asignado_por on public.asignacion
  for each row execute function fn_exigir_rol('asignado_por', 'DIRECTORA,TALLERISTA,PSICOLOGO');

drop trigger trg_rol_modulo on public.modulo;
create trigger trg_rol_modulo before insert or update of creado_por on public.modulo
  for each row execute function fn_exigir_rol('creado_por', 'DIRECTORA,TALLERISTA,PSICOLOGO');

drop trigger trg_rol_observacion on public.observacion;
create trigger trg_rol_observacion before insert or update of autor_id on public.observacion
  for each row execute function fn_exigir_rol('autor_id', 'DIRECTORA,TALLERISTA,PSICOLOGO');

drop trigger trg_rol_validacion on public.validacion;
create trigger trg_rol_validacion before insert or update of validador_id on public.validacion
  for each row execute function fn_exigir_rol('validador_id', 'DIRECTORA,TALLERISTA,PSICOLOGO');

-- ─── 2. Personas enlazadas por ids externos, sin datos que no usamos ────────

-- Las contraseñas, el documento y el teléfono viven en las APIs externas.
alter table public.usuario
  drop column contrasena_hash,
  drop column documento,
  drop column telefono;

alter table public.usuario
  -- id_usuario del JWT de la API de seguridad (todos los usuarios inician sesión allí).
  add column id_usuario_auth bigint not null,
  -- idAcudiente de la API del núcleo familiar (solo para acudientes).
  add column id_acudiente_externo bigint,
  -- Última vez que se copiaron nombre, rol y estado desde las APIs externas.
  add column sincronizado_en timestamp with time zone,
  add constraint uq_usuario_id_usuario_auth unique (id_usuario_auth),
  add constraint uq_usuario_id_acudiente_externo unique (id_acudiente_externo);

comment on column public.usuario.id_usuario_auth is 'id_usuario en la API de seguridad (fuente oficial)';
comment on column public.usuario.id_acudiente_externo is 'idAcudiente en la API del núcleo familiar';

-- La fecha de nacimiento se consulta en la API del núcleo familiar.
alter table public.estudiante
  drop column fecha_nacimiento,
  add column id_estudiante_externo bigint not null,
  add constraint uq_estudiante_id_estudiante_externo unique (id_estudiante_externo);

comment on column public.estudiante.id_estudiante_externo is 'idEstudiante en la API del núcleo familiar (fuente oficial)';
comment on table public.acudiente_estudiante is 'GameUp · copia del vínculo acudiente-estudiante de la API del núcleo familiar';

-- ─── 3. Consentimiento: se usa el de la API del núcleo familiar ─────────────
-- Su textoLegal incluirá la grabación de voz. GameUp no guarda una copia; cada
-- grabación registra qué versión de términos se verificó (ver punto 5).

drop table public.consentimiento;

-- ─── 4. Audio modelo del docente → reemplazado por videos de la directora ───
-- Los videos de "Mira" se guardan como filas de `contenido` (tipo VIDEO).

alter table public.actividad drop column grabacion_voz_id;
drop table public.grabacion_voz;

-- ─── 5. Voz del estudiante para revisión del tallerista ─────────────────────

create table public.grabacion_estudiante (
  id bigint generated by default as identity not null,
  intento_id bigint not null,
  -- Ruta del archivo en el bucket privado `grabaciones`.
  ruta_audio text not null,
  duracion_seg integer,
  -- Versión de términos vigente en la API del núcleo familiar cuando el
  -- backend verificó que el acudiente aceptó el tratamiento.
  codigo_version_terminos text not null,
  consentimiento_verificado_en timestamp with time zone not null,
  creada_en timestamp with time zone not null default now(),
  -- Se marca cuando el backend borra el archivo tras la validación.
  eliminada_en timestamp with time zone,
  constraint grabacion_estudiante_pkey primary key (id),
  constraint uq_grabacion_estudiante_intento unique (intento_id),
  constraint grabacion_estudiante_intento_id_fkey foreign key (intento_id)
    references public.intento(id) on delete cascade,
  constraint grabacion_estudiante_ruta_check check (btrim(ruta_audio) <> ''),
  constraint grabacion_estudiante_duracion_check check (duracion_seg > 0),
  constraint grabacion_estudiante_eliminada_check check (eliminada_en is null or eliminada_en >= creada_en)
);

comment on table public.grabacion_estudiante is 'GameUp · voz del estudiante en Habla conmigo, pendiente de revisión; se elimina tras validarse';

create function public.fn_grabacion_solo_habla()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare v_codigo text;
begin
  select tj.codigo into v_codigo
    from public.intento i
    join public.actividad a   on a.id = i.actividad_id
    join public.tipo_juego tj on tj.id = a.tipo_juego_id
   where i.id = new.intento_id;
  if v_codigo is distinct from 'HABLA_CONMIGO' then
    raise exception 'Solo los intentos de Habla conmigo pueden tener grabación (intento %)', new.intento_id
      using errcode = '23514';
  end if;
  return new;
end $function$;

create trigger trg_grabacion_solo_habla before insert or update of intento_id on public.grabacion_estudiante
  for each row execute function fn_grabacion_solo_habla();

-- Grabaciones ya validadas cuyo archivo falta borrar. El backend las recorre,
-- borra el archivo de Storage y marca `eliminada_en`.
create view public.grabacion_por_eliminar as
  select g.id, g.ruta_audio, v.fecha as validada_en
    from public.grabacion_estudiante g
    join public.validacion v on v.intento_id = g.intento_id
   where g.eliminada_en is null;

alter table public.grabacion_estudiante enable row level security;

-- ─── 6. Buckets privados de Storage ─────────────────────────────────────────
-- Los dos son privados: la app recibe del backend URLs firmadas temporales.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('contenidos', 'contenidos', false, 52428800,
   array['video/mp4', 'image/png', 'image/jpeg', 'image/webp', 'audio/mpeg', 'audio/mp4']),
  ('grabaciones', 'grabaciones', false, 10485760,
   array['audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/webm'])
on conflict (id) do nothing;

-- ─── 7. Tipos de juego del MVP ───────────────────────────────────────────────
-- No hay actividades creadas, así que se reemplazan los cuatro anteriores.

update public.tipo_juego set codigo = 'EMPAREJAR',  nombre = 'Emparejar',  descripcion = 'Relacionar imágenes, palabras o cantidades' where id = 1;
update public.tipo_juego set codigo = 'CLASIFICAR', nombre = 'Clasificar', descripcion = 'Organizar elementos en categorías' where id = 2;
update public.tipo_juego set codigo = 'SECUENCIAR', nombre = 'Secuenciar', descripcion = 'Ordenar los pasos de rutinas o actividades' where id = 3;
update public.tipo_juego set codigo = 'MEMORIA',    nombre = 'Memoria',    descripcion = 'Encontrar parejas de cartas' where id = 4;
insert into public.tipo_juego (codigo, nombre, descripcion) values
  ('HABLA_CONMIGO', 'Habla conmigo', 'Practicar vocales con los pasos Mira, Dilo y Listo'),
  ('BUSCA_LA_BOCA', 'Busca la boca', 'Escuchar un sonido y reconocer la boca que lo produce');

-- ─── 8. Solo se trabaja con los estudiantes asignados ───────────────────────
-- La directora puede con todos; tallerista y psicólogo, solo con los
-- estudiantes que tengan asignados y activos. El backend lo verifica primero;
-- esto es el respaldo en la base.

create function public.fn_exigir_vinculo()
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
            where tallerista_id = v_uid and estudiante_id = v_est and activo))
     or (v_rol = 'PSICOLOGO' and exists (
           select 1 from public.psicologo_estudiante
            where psicologo_id = v_uid and estudiante_id = v_est and activo)) then
    return new;
  end if;

  raise exception 'El usuario % no tiene asignado al estudiante % (%.%)',
    v_uid, v_est, tg_table_name, v_col using errcode = '42501';
end $function$;

create trigger trg_vinculo_asignacion before insert or update of asignado_por, estudiante_id on public.asignacion
  for each row execute function fn_exigir_vinculo('asignado_por');
create trigger trg_vinculo_validacion before insert or update of validador_id, intento_id on public.validacion
  for each row execute function fn_exigir_vinculo('validador_id');
create trigger trg_vinculo_observacion before insert or update of autor_id, estudiante_id on public.observacion
  for each row execute function fn_exigir_vinculo('autor_id');

-- ─── 9. Intentos y progreso ─────────────────────────────────────────────────

-- No se registran intentos en una asignación ya completada.
create or replace function public.fn_intento_antes()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare v_mod_asig bigint; v_mod_act bigint; v_estado text;
begin
  select modulo_id, estado into v_mod_asig, v_estado from public.asignacion where id = new.asignacion_id;
  select modulo_id into v_mod_act from public.actividad where id = new.actividad_id;
  if v_mod_asig is distinct from v_mod_act then
    raise exception 'La actividad % no pertenece al módulo de la asignación %', new.actividad_id, new.asignacion_id
      using errcode = '23514';
  end if;
  if v_estado = 'COMPLETADO' then
    raise exception 'La asignación % ya está completada', new.asignacion_id using errcode = '23514';
  end if;
  if new.numero_intento is null then
    select coalesce(max(numero_intento), 0) + 1 into new.numero_intento
      from public.intento
     where asignacion_id = new.asignacion_id and actividad_id = new.actividad_id;
  end if;
  return new;
end $function$;

-- Si se agrega, activa, desactiva o borra una actividad, el progreso de las
-- asignaciones de su módulo se recalcula.
create function public.fn_actividad_recalcular()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare v_asig bigint;
begin
  for v_asig in
    select id from public.asignacion
     where modulo_id in (
       case when tg_op = 'INSERT' then null else old.modulo_id end,
       case when tg_op = 'DELETE' then null else new.modulo_id end)
  loop
    perform public.fn_recalcular_progreso(v_asig);
  end loop;
  return null;
end $function$;

create trigger trg_actividad_recalcular after insert or delete or update of activa, modulo_id on public.actividad
  for each row execute function fn_actividad_recalcular();

-- ─── 10. Seguridad: la API pública de Supabase no ve nada ───────────────────

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
