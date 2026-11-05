-- ============================================================
-- Alta de la PRIMERA directora de GameUP (se ejecuta una sola vez).
--
-- Por qué existe: POST /api/v1/usuarios solo lo puede usar una directora,
-- así que la primera cuenta se crea a mano. Las demás, con ese endpoint.
--
-- Antes de ejecutarlo:
--   1. La persona ya debe existir en la API de seguridad con rol ADMIN.
--   2. Reemplaza los cuatro valores marcados con << >> en el bloque de abajo.
--      ID_USUARIO_AUTH es su id_usuario en la API de seguridad (número).
--      Si no quieres guardar el correo, déjalo como ''.
--   3. Ejecútalo en Supabase > SQL Editor (o con psql). No es una migración:
--      no cambia el esquema ni el historial de Prisma.
--
-- El script se detiene sin cambiar nada si falta reemplazar un valor o si ya
-- existe una directora. No subas este archivo con datos reales al repositorio.
-- ============================================================

do $$
declare
  v_nombres   text   := btrim('<<NOMBRES>>');
  v_apellidos text   := btrim('<<APELLIDOS>>');
  v_correo    text   := nullif(lower(btrim('<<CORREO>>')), '');
  v_id_auth   bigint := <<ID_USUARIO_AUTH>>;
begin
  if concat(v_nombres, v_apellidos, v_correo) like '%<<%' then
    raise exception 'Reemplaza todos los valores marcados con << >> antes de ejecutar.';
  end if;

  if exists (
    select 1
      from public.usuario u
      join public.rol r on r.id = u.rol_id
     where r.nombre = 'DIRECTORA'
  ) then
    raise exception 'Ya existe una directora. Usa POST /api/v1/usuarios para las demás cuentas.';
  end if;

  insert into public.usuario (rol_id, nombres, apellidos, correo, id_usuario_auth)
  select r.id, v_nombres, v_apellidos, v_correo, v_id_auth
    from public.rol r
   where r.nombre = 'DIRECTORA';

  raise notice 'Directora creada (id_usuario_auth %). Ya puede iniciar sesión en la app.', v_id_auth;
end $$;
