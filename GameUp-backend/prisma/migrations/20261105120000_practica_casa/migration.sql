-- «Lo practicamos hoy» (2026-11-05, fase 8).
--
-- El acudiente marca los días en que practicó en casa con el estudiante. Una
-- fila por estudiante, acudiente y día (fecha en hora de Bogotá, la pone el
-- backend). Marcar dos veces el mismo día no duplica: lo impide la PK.
--
-- Reglas en la base (el backend las verifica antes; esto es el respaldo):
--   - acudiente_id debe tener el rol ACUDIENTE (fn_exigir_rol);
--   - y estar vinculado al estudiante en acudiente_estudiante.

create table public.practica_casa (
  estudiante_id bigint not null,
  acudiente_id  bigint not null,
  fecha         date not null,
  registrada_en timestamp with time zone not null default now(),
  constraint practica_casa_pkey primary key (estudiante_id, acudiente_id, fecha),
  constraint practica_casa_estudiante_id_fkey foreign key (estudiante_id)
    references public.estudiante (usuario_id) on delete cascade,
  constraint practica_casa_acudiente_id_fkey foreign key (acudiente_id)
    references public.usuario (id) on delete cascade
);

-- Semana de un estudiante: la PK ya empieza por estudiante_id. Para borrar o
-- buscar por acudiente:
create index ix_practica_casa_acudiente on public.practica_casa using btree (acudiente_id);

comment on table public.practica_casa is 'Días en que el acudiente practicó en casa con el estudiante («Lo practicamos hoy»)';
comment on column public.practica_casa.fecha is 'Día en hora de America/Bogota';

create trigger trg_rol_practica_casa before insert or update of acudiente_id on public.practica_casa
  for each row execute function fn_exigir_rol('acudiente_id', 'ACUDIENTE');

-- Solo un acudiente vinculado al estudiante.
create function public.fn_practica_casa_vinculo()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if not exists (
    select 1 from public.acudiente_estudiante
     where acudiente_id = new.acudiente_id and estudiante_id = new.estudiante_id) then
    raise exception 'El acudiente % no está vinculado al estudiante % (practica_casa)',
      new.acudiente_id, new.estudiante_id using errcode = '42501';
  end if;
  return new;
end $function$;

create trigger trg_vinculo_practica_casa before insert or update of acudiente_id, estudiante_id on public.practica_casa
  for each row execute function fn_practica_casa_vinculo();

-- La API pública de Supabase no ve nada: RLS sin políticas y sin permisos.
alter table public.practica_casa enable row level security;
revoke all on table public.practica_casa from anon, authenticated;
revoke execute on function public.fn_practica_casa_vinculo() from public, anon, authenticated;
