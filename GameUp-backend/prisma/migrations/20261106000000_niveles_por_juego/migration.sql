-- Escalera de niveles por juego (2026-11-06, fase 9).
--
-- Emparejar, Clasificar, Secuenciar y Memoria tienen cada uno una escalera de
-- 5 niveles. El nivel va por estudiante y por juego. Cuando la tallerista a
-- cargo (o la directora) APRUEBA un intento del nivel actual, el niño sube un
-- nivel en ese juego (eso lo hace el backend, en la misma transacción que la
-- validación). Estos niveles NO son BAJO/MEDIO/ALTO (tabla `nivel`), que no
-- cambian.
--
-- La escalera vive FUERA de las asignaciones:
--   - sus actividades están en un módulo especial (`modulo.es_escalera`), que
--     no se asigna, y llevan `actividad.nivel_juego` (1 a 5);
--   - sus intentos no tienen asignación: `intento.asignacion_id` pasa a ser
--     opcional y `intento.estudiante_id` (nuevo) siempre dice de quién es;
--   - el progreso oficial de los módulos no cambia (solo lee asignaciones).
--
-- Las actividades de la escalera se siembran aparte, a mano, con
-- prisma/scripts/sembrar_escalera.sql (necesita el id de una directora).
-- Ningún cambio borra datos.

-- ─── 1. Juegos con escalera ─────────────────────────────────────────────────

create function public.fn_juego_con_escalera(p_tipo_juego bigint)
 returns boolean
 language sql
 stable
 set search_path to 'public'
as $function$
  select coalesce(
    (select codigo in ('EMPAREJAR', 'CLASIFICAR', 'SECUENCIAR', 'MEMORIA')
       from public.tipo_juego where id = p_tipo_juego),
    false);
$function$;

-- ─── 2. Módulo de la escalera ───────────────────────────────────────────────

alter table public.modulo add column es_escalera boolean not null default false;
comment on column public.modulo.es_escalera is 'Módulo con las actividades de la escalera de niveles por juego: no se asigna';

-- Hay como máximo un módulo de escalera.
create unique index uq_modulo_escalera on public.modulo using btree (es_escalera) where es_escalera;

-- Un módulo no se vuelve de escalera (ni deja de serlo) después de creado.
create function public.fn_modulo_escalera_fija()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if new.es_escalera is distinct from old.es_escalera then
    raise exception 'El módulo % no puede cambiar es_escalera después de creado', old.id
      using errcode = '23514';
  end if;
  return new;
end $function$;

create trigger trg_modulo_escalera_fija before update of es_escalera on public.modulo
  for each row execute function fn_modulo_escalera_fija();

-- El módulo de la escalera no se asigna (además de exigir que esté publicado).
create or replace function public.fn_asignacion_antes()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare v_publicado boolean; v_escalera boolean;
begin
  select publicado, es_escalera into v_publicado, v_escalera
    from public.modulo where id = new.modulo_id;
  if coalesce(v_escalera, false) then
    raise exception 'El módulo % es la escalera de juegos y no se asigna', new.modulo_id using errcode = '23514';
  end if;
  if not coalesce(v_publicado, false) then
    raise exception 'El módulo % no está publicado y no puede asignarse', new.modulo_id using errcode = '23514';
  end if;
  return new;
end $function$;

-- ─── 3. Nivel de cada actividad de la escalera ──────────────────────────────

alter table public.actividad add column nivel_juego smallint;
alter table public.actividad add constraint actividad_nivel_juego_check
  check (nivel_juego is null or nivel_juego between 1 and 5);
comment on column public.actividad.nivel_juego is 'Nivel (1-5) de la escalera del juego; solo en el módulo de la escalera';

-- Una sola actividad activa por juego y nivel.
create unique index uq_actividad_nivel_juego on public.actividad using btree (tipo_juego_id, nivel_juego)
  where nivel_juego is not null and activa;

-- En el módulo de la escalera toda actividad tiene nivel y es de un juego con
-- escalera; fuera de él, ninguna tiene nivel.
create function public.fn_actividad_nivel_juego()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare v_escalera boolean;
begin
  select es_escalera into v_escalera from public.modulo where id = new.modulo_id;
  if coalesce(v_escalera, false) then
    if new.nivel_juego is null then
      raise exception 'Las actividades de la escalera necesitan nivel_juego (1 a 5)' using errcode = '23514';
    end if;
    if not public.fn_juego_con_escalera(new.tipo_juego_id) then
      raise exception 'La escalera solo tiene Emparejar, Clasificar, Secuenciar y Memoria' using errcode = '23514';
    end if;
  elsif new.nivel_juego is not null then
    raise exception 'nivel_juego solo va en las actividades del módulo de la escalera' using errcode = '23514';
  end if;
  return new;
end $function$;

create trigger trg_actividad_nivel_juego before insert or update of modulo_id, tipo_juego_id, nivel_juego on public.actividad
  for each row execute function fn_actividad_nivel_juego();

-- ─── 4. Nivel del estudiante en cada juego ──────────────────────────────────

create table public.nivel_juego_estudiante (
  estudiante_id  bigint not null,
  tipo_juego_id  bigint not null,
  nivel_actual   smallint not null default 1,
  -- Aprobó el nivel 5: el juego queda completado y sigue en el nivel 5.
  completado     boolean not null default false,
  actualizado_en timestamp with time zone not null default now(),
  constraint nivel_juego_estudiante_pkey primary key (estudiante_id, tipo_juego_id),
  constraint nivel_juego_estudiante_estudiante_id_fkey foreign key (estudiante_id)
    references public.estudiante (usuario_id) on delete cascade,
  constraint nivel_juego_estudiante_tipo_juego_id_fkey foreign key (tipo_juego_id)
    references public.tipo_juego (id),
  constraint nivel_juego_estudiante_nivel_check check (nivel_actual between 1 and 5),
  constraint nivel_juego_estudiante_completado_check check (not completado or nivel_actual = 5)
);

create index ix_nivel_juego_est_tipo on public.nivel_juego_estudiante using btree (tipo_juego_id);

comment on table public.nivel_juego_estudiante is 'Nivel actual (1-5) de cada estudiante en cada juego con escalera';

create function public.fn_nivel_juego_tipo()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if not public.fn_juego_con_escalera(new.tipo_juego_id) then
    raise exception 'El tipo de juego % no tiene escalera de niveles', new.tipo_juego_id using errcode = '23514';
  end if;
  return new;
end $function$;

create trigger trg_nivel_juego_tipo before insert or update of tipo_juego_id on public.nivel_juego_estudiante
  for each row execute function fn_nivel_juego_tipo();

-- Todo estudiante nuevo empieza en el nivel 1 de cada juego.
create function public.fn_estudiante_niveles_juego()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  insert into public.nivel_juego_estudiante (estudiante_id, tipo_juego_id)
  select new.usuario_id, tj.id
    from public.tipo_juego tj
   where public.fn_juego_con_escalera(tj.id)
  on conflict do nothing;
  return null;
end $function$;

create trigger trg_estudiante_niveles_juego after insert on public.estudiante
  for each row execute function fn_estudiante_niveles_juego();

-- Los estudiantes que ya existen empiezan en el nivel 1 de cada juego.
insert into public.nivel_juego_estudiante (estudiante_id, tipo_juego_id)
select e.usuario_id, tj.id
  from public.estudiante e
 cross join public.tipo_juego tj
 where public.fn_juego_con_escalera(tj.id)
on conflict do nothing;

-- ─── 5. Historial de cambios de nivel ───────────────────────────────────────

create table public.historial_nivel_juego (
  id             bigint generated by default as identity not null,
  estudiante_id  bigint not null,
  tipo_juego_id  bigint not null,
  nivel_anterior smallint not null,
  nivel_nuevo    smallint not null,
  -- Estado después del cambio (true: aprobó el nivel 5).
  completado     boolean not null,
  -- VALIDACION: un intento aprobado lo subió. AJUSTE: una persona lo puso a mano.
  origen         text not null,
  intento_id     bigint,
  cambiado_por   bigint not null,
  motivo         text,
  fecha          timestamp with time zone not null default now(),
  constraint historial_nivel_juego_pkey primary key (id),
  constraint historial_nivel_juego_estudiante_id_fkey foreign key (estudiante_id)
    references public.estudiante (usuario_id) on delete cascade,
  constraint historial_nivel_juego_tipo_juego_id_fkey foreign key (tipo_juego_id)
    references public.tipo_juego (id),
  constraint historial_nivel_juego_intento_id_fkey foreign key (intento_id)
    references public.intento (id) on delete set null,
  constraint historial_nivel_juego_cambiado_por_fkey foreign key (cambiado_por)
    references public.usuario (id),
  constraint historial_nivel_juego_niveles_check
    check (nivel_anterior between 1 and 5 and nivel_nuevo between 1 and 5),
  constraint historial_nivel_juego_completado_check check (not completado or nivel_nuevo = 5),
  constraint historial_nivel_juego_origen_check check (origen = any (array['VALIDACION', 'AJUSTE'])),
  -- El ajuste manual siempre explica por qué.
  constraint historial_nivel_juego_motivo_check
    check (origen <> 'AJUSTE' or (motivo is not null and btrim(motivo) <> ''))
);

create index ix_histnivjuego_estudiante on public.historial_nivel_juego
  using btree (estudiante_id, tipo_juego_id, fecha desc);
create index ix_histnivjuego_tipo on public.historial_nivel_juego using btree (tipo_juego_id);
create index ix_histnivjuego_cambiado_por on public.historial_nivel_juego using btree (cambiado_por);
-- Un intento sube de nivel una sola vez.
create unique index uq_histnivjuego_intento on public.historial_nivel_juego using btree (intento_id)
  where intento_id is not null;

comment on table public.historial_nivel_juego is 'Cada subida (validación) o ajuste manual del nivel de un estudiante en un juego';

-- Solo la directora o la tallerista a cargo del estudiante cambian el nivel.
create trigger trg_rol_hist_nivel_juego before insert or update of cambiado_por on public.historial_nivel_juego
  for each row execute function fn_exigir_rol('cambiado_por', 'DIRECTORA,TALLERISTA');
create trigger trg_vinculo_hist_nivel_juego before insert or update of cambiado_por, estudiante_id on public.historial_nivel_juego
  for each row execute function fn_exigir_vinculo('cambiado_por');

-- ─── 6. Intentos sin asignación (los de la escalera) ────────────────────────

alter table public.intento add column estudiante_id bigint;
update public.intento i
   set estudiante_id = a.estudiante_id
  from public.asignacion a
 where a.id = i.asignacion_id;
alter table public.intento alter column estudiante_id set not null;
alter table public.intento add constraint intento_estudiante_id_fkey foreign key (estudiante_id)
  references public.estudiante (usuario_id) on delete cascade;
alter table public.intento alter column asignacion_id drop not null;

comment on column public.intento.estudiante_id is 'De quién es el intento. Con asignación, es el estudiante de la asignación';

create index ix_intento_estudiante on public.intento using btree (estudiante_id, actividad_id);
-- uq_intento (asignacion_id, actividad_id, numero_intento) sigue para los que
-- tienen asignación; los de la escalera se numeran por estudiante y actividad.
create unique index uq_intento_escalera on public.intento using btree (estudiante_id, actividad_id, numero_intento)
  where asignacion_id is null;

-- Con asignación: como antes (mismo módulo, asignación sin completar) y el
-- estudiante sale de la asignación. Sin asignación: solo actividades de la
-- escalera, y solo del nivel ACTUAL del estudiante en ese juego.
create or replace function public.fn_intento_antes()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare
  v_mod_asig bigint; v_est_asig bigint; v_estado text;
  v_mod_act bigint; v_tipo bigint; v_nivel_act smallint;
  v_nivel_est smallint;
begin
  select modulo_id, tipo_juego_id, nivel_juego into v_mod_act, v_tipo, v_nivel_act
    from public.actividad where id = new.actividad_id;

  if new.asignacion_id is not null then
    select modulo_id, estudiante_id, estado into v_mod_asig, v_est_asig, v_estado
      from public.asignacion where id = new.asignacion_id;
    if v_mod_asig is distinct from v_mod_act then
      raise exception 'La actividad % no pertenece al módulo de la asignación %', new.actividad_id, new.asignacion_id
        using errcode = '23514';
    end if;
    if v_estado = 'COMPLETADO' then
      raise exception 'La asignación % ya está completada', new.asignacion_id using errcode = '23514';
    end if;
    if new.estudiante_id is null then
      new.estudiante_id := v_est_asig;
    elsif new.estudiante_id <> v_est_asig then
      raise exception 'El intento es del estudiante %, pero la asignación % es del estudiante %',
        new.estudiante_id, new.asignacion_id, v_est_asig using errcode = '23514';
    end if;
    if new.numero_intento is null then
      select coalesce(max(numero_intento), 0) + 1 into new.numero_intento
        from public.intento
       where asignacion_id = new.asignacion_id and actividad_id = new.actividad_id;
    end if;
  else
    if v_nivel_act is null then
      raise exception 'La actividad % no es de la escalera: el intento necesita una asignación', new.actividad_id
        using errcode = '23514';
    end if;
    if new.estudiante_id is null then
      raise exception 'Un intento de la escalera necesita el estudiante' using errcode = '23514';
    end if;
    select nivel_actual into v_nivel_est
      from public.nivel_juego_estudiante
     where estudiante_id = new.estudiante_id and tipo_juego_id = v_tipo;
    if v_nivel_act <> coalesce(v_nivel_est, 1) then
      raise exception 'La actividad es del nivel %, pero el estudiante % va en el nivel % de ese juego',
        v_nivel_act, new.estudiante_id, coalesce(v_nivel_est, 1) using errcode = '23514';
    end if;
    if new.numero_intento is null then
      select coalesce(max(numero_intento), 0) + 1 into new.numero_intento
        from public.intento
       where estudiante_id = new.estudiante_id and actividad_id = new.actividad_id and asignacion_id is null;
    end if;
  end if;
  return new;
end $function$;

-- De quién es un intento y dónde cae no cambian después de registrarlo.
create function public.fn_intento_origen_fijo()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if (new.estudiante_id, new.actividad_id) is distinct from (old.estudiante_id, old.actividad_id)
     or new.asignacion_id is distinct from old.asignacion_id then
    raise exception 'El intento % no puede cambiar de estudiante, actividad ni asignación', old.id
      using errcode = '23514';
  end if;
  return new;
end $function$;

create trigger trg_intento_origen_fijo before update of estudiante_id, actividad_id, asignacion_id on public.intento
  for each row execute function fn_intento_origen_fijo();

-- La validación busca al estudiante en el intento (con o sin asignación).
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
    select i.estudiante_id into v_est from public.intento i where i.id = new.intento_id;
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

-- fn_validacion_progreso y fn_intento_despues no cambian: con asignacion_id
-- vacío no recalculan ni tocan ninguna asignación.

-- ─── 7. Aviso al acudiente al subir de nivel ────────────────────────────────

alter table public.notificacion drop constraint notificacion_tipo_check;
alter table public.notificacion add constraint notificacion_tipo_check
  check (tipo = any (array['AVANCE', 'NIVEL', 'NIVEL_JUEGO', 'OBSERVACION', 'NUEVO_MODULO']));

-- ─── 8. Seguridad: la API pública de Supabase no ve nada ───────────────────

alter table public.nivel_juego_estudiante enable row level security;
alter table public.historial_nivel_juego enable row level security;
revoke all on table public.nivel_juego_estudiante from anon, authenticated;
revoke all on table public.historial_nivel_juego from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
