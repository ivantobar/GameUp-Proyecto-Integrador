-- Prueba de la migración 20261106000000_niveles_por_juego (escalera de niveles).
-- Datos ficticios, dentro de una transacción con rollback al final.
-- Ejecútalo en una base LOCAL con todas las migraciones aplicadas:
--   psql -d gameup_test -f prisma/pruebas/niveles_por_juego.sql
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

create function pg_temp.tipo(p_codigo text) returns bigint language sql as $$
  select id from tipo_juego where codigo = p_codigo $$;

-- Personas (ids ficticios)
insert into usuario (id, rol_id, nombres, apellidos, id_usuario_auth) values
  (1, (select id from rol where nombre='DIRECTORA'),  'Dir',  'Prueba', 901),
  (2, (select id from rol where nombre='TALLERISTA'), 'Tall', 'Uno',    902),
  (3, (select id from rol where nombre='TALLERISTA'), 'Tall', 'Ajena',  903),
  (4, (select id from rol where nombre='ESTUDIANTE'), 'Est',  'Uno',    904),
  (5, (select id from rol where nombre='ACUDIENTE'),  'Acu',  'Uno',    905),
  (6, (select id from rol where nombre='ESTUDIANTE'), 'Est',  'Dos',    906);
insert into estudiante (usuario_id, id_estudiante_externo) values (4, 8004), (6, 8006);
insert into tallerista_estudiante (tallerista_id, estudiante_id) values (2, 4);
insert into acudiente_estudiante values (5, 4, 'Madre', true);

-- ─── Nivel del estudiante ───────────────────────────────────────────────────
do $$ begin
  assert (select count(*) from nivel_juego_estudiante where estudiante_id = 4) = 4,
    'un estudiante nuevo tiene los 4 juegos';
  assert (select bool_and(nivel_actual = 1 and not completado) from nivel_juego_estudiante where estudiante_id = 4),
    'empieza en el nivel 1, sin completar';
  assert not exists (select 1 from nivel_juego_estudiante n join tipo_juego tj on tj.id = n.tipo_juego_id
                      where tj.codigo in ('HABLA_CONMIGO', 'BUSCA_LA_BOCA')),
    'los juegos de habla no tienen nivel';
end $$;

select pg_temp.debe_fallar($$insert into nivel_juego_estudiante (estudiante_id, tipo_juego_id) values (6, pg_temp.tipo('HABLA_CONMIGO'))$$,
  'nivel de un juego de habla', '23514');
select pg_temp.debe_fallar($$update nivel_juego_estudiante set nivel_actual = 6 where estudiante_id = 4$$,
  'nivel 6', '23514');
select pg_temp.debe_fallar($$update nivel_juego_estudiante set nivel_actual = 0 where estudiante_id = 4$$,
  'nivel 0', '23514');
select pg_temp.debe_fallar($$update nivel_juego_estudiante set completado = true
                              where estudiante_id = 4 and tipo_juego_id = pg_temp.tipo('MEMORIA')$$,
  'completado sin estar en el nivel 5', '23514');
select pg_temp.debe_fallar($$insert into nivel_juego_estudiante (estudiante_id, tipo_juego_id) values (4, pg_temp.tipo('MEMORIA'))$$,
  'el mismo juego dos veces', '23505');

-- ─── Módulo y actividades de la escalera ────────────────────────────────────
insert into categoria (id, nombre) values (90, 'PRUEBA_ESCALERA');
insert into modulo (id, categoria_id, nivel_id, creado_por, nombre, publicado, es_escalera) values
  (90, 90, 1, 1, 'Escalera', false, true),
  (91, 90, 1, 2, 'Módulo normal', false, false);

select pg_temp.debe_fallar($$insert into modulo (categoria_id, nivel_id, creado_por, nombre, es_escalera) values (90, 1, 1, 'Otra escalera', true)$$,
  'dos módulos de escalera', '23505');
select pg_temp.debe_fallar($$update modulo set es_escalera = true where id = 91$$,
  'un módulo normal se vuelve escalera', '23514');
select pg_temp.debe_fallar($$update modulo set es_escalera = false where id = 90$$,
  'la escalera deja de serlo', '23514');

insert into actividad (id, modulo_id, tipo_juego_id, titulo, nivel_juego) values
  (901, 90, pg_temp.tipo('MEMORIA'), 'Memoria 1', 1),
  (902, 90, pg_temp.tipo('MEMORIA'), 'Memoria 2', 2),
  (903, 90, pg_temp.tipo('EMPAREJAR'), 'Emparejar 1', 1),
  (911, 91, pg_temp.tipo('MEMORIA'), 'Memoria del módulo', null);

select pg_temp.debe_fallar($$insert into actividad (modulo_id, tipo_juego_id, titulo) values (90, pg_temp.tipo('MEMORIA'), 'Sin nivel')$$,
  'actividad de la escalera sin nivel', '23514');
select pg_temp.debe_fallar($$insert into actividad (modulo_id, tipo_juego_id, titulo, nivel_juego) values (90, pg_temp.tipo('HABLA_CONMIGO'), 'Habla', 1)$$,
  'juego de habla en la escalera', '23514');
select pg_temp.debe_fallar($$insert into actividad (modulo_id, tipo_juego_id, titulo, nivel_juego) values (91, pg_temp.tipo('MEMORIA'), 'Con nivel', 2)$$,
  'nivel_juego fuera de la escalera', '23514');
select pg_temp.debe_fallar($$insert into actividad (modulo_id, tipo_juego_id, titulo, nivel_juego) values (90, pg_temp.tipo('MEMORIA'), 'Otra 1', 1)$$,
  'dos actividades activas del mismo nivel', '23505');
select pg_temp.debe_fallar($$insert into actividad (modulo_id, tipo_juego_id, titulo, nivel_juego) values (90, pg_temp.tipo('MEMORIA'), 'Nivel 6', 6)$$,
  'nivel 6 en una actividad', '23514');
select pg_temp.debe_fallar($$update actividad set modulo_id = 91 where id = 902$$,
  'sacar una actividad con nivel de la escalera', '23514');
-- Una inactiva del mismo nivel sí se puede (la directora la reemplaza).
insert into actividad (id, modulo_id, tipo_juego_id, titulo, nivel_juego, activa) values
  (904, 90, pg_temp.tipo('MEMORIA'), 'Memoria 1 (vieja)', 1, false);

-- La escalera no se asigna, ni siquiera publicada.
update modulo set publicado = true where id = 90;
select pg_temp.debe_fallar($$insert into asignacion (modulo_id, estudiante_id, asignado_por) values (90, 4, 1)$$,
  'asignar la escalera', '23514');
update modulo set publicado = false where id = 90;

-- ─── Intentos con asignación: como antes ────────────────────────────────────
update modulo set publicado = true where id = 91;
insert into asignacion (id, modulo_id, estudiante_id, asignado_por) values (91, 91, 4, 2);
insert into intento (id, asignacion_id, actividad_id) values (9101, 91, 911), (9102, 91, 911);

do $$ begin
  assert (select estudiante_id from intento where id = 9101) = 4, 'el estudiante sale de la asignación';
  assert (select array_agg(numero_intento order by id) from intento where id in (9101, 9102)) = array[1, 2],
    'numeración por asignación y actividad';
  assert (select estado from asignacion where id = 91) = 'EN_CURSO', 'fn_intento_despues sigue pasando a EN_CURSO';
end $$;

select pg_temp.debe_fallar($$insert into intento (asignacion_id, actividad_id, estudiante_id) values (91, 911, 6)$$,
  'intento con asignación de otro estudiante', '23514');
select pg_temp.debe_fallar($$insert into intento (asignacion_id, actividad_id) values (91, 901)$$,
  'actividad de la escalera dentro de una asignación', '23514');

-- ─── Intentos de la escalera (sin asignación) ───────────────────────────────
insert into intento (id, estudiante_id, actividad_id) values (9001, 4, 901), (9002, 4, 901);
insert into intento (id, estudiante_id, actividad_id) values (9003, 4, 903);

do $$ begin
  assert (select array_agg(numero_intento order by id) from intento where id in (9001, 9002)) = array[1, 2],
    'numeración por estudiante y actividad';
  assert (select asignacion_id from intento where id = 9001) is null, 'sin asignación';
end $$;

select pg_temp.debe_fallar($$insert into intento (estudiante_id, actividad_id) values (4, 902)$$,
  'intento de un nivel que aún no tiene', '23514');
select pg_temp.debe_fallar($$insert into intento (estudiante_id, actividad_id) values (4, 911)$$,
  'actividad normal sin asignación', '23514');
select pg_temp.debe_fallar($$insert into intento (actividad_id) values (901)$$,
  'intento de la escalera sin estudiante', '23514');
select pg_temp.debe_fallar($$update intento set estudiante_id = 6 where id = 9001$$,
  'mover un intento a otro estudiante', '23514');
select pg_temp.debe_fallar($$update intento set asignacion_id = 91 where id = 9001$$,
  'mover un intento a una asignación', '23514');
select pg_temp.debe_fallar($$insert into intento (estudiante_id, actividad_id, numero_intento) values (4, 901, 1)$$,
  'número de intento repetido en la escalera', '23505');
-- Cambiar el resultado sigue permitido (Habla conmigo lo hace).
update intento set resultado = '{"total": 1}' where id = 9001;

-- Solo Habla conmigo tiene grabaciones.
select pg_temp.debe_fallar($$insert into grabacion_estudiante (intento_id, ruta_audio, codigo_version_terminos, consentimiento_verificado_en)
                              values (9001, 'x/y.m4a', 'v1', now())$$,
  'grabación en un intento de la escalera', '23514');

-- ─── Validación de intentos sin asignación ──────────────────────────────────
select pg_temp.debe_fallar($$insert into validacion (intento_id, validador_id, resultado) values (9001, 3, 'APROBADO')$$,
  'tallerista sin vínculo valida un intento de la escalera', '42501');
select pg_temp.debe_fallar($$insert into validacion (intento_id, validador_id, resultado) values (9001, 5, 'APROBADO')$$,
  'acudiente valida', '23514');
insert into validacion (intento_id, validador_id, resultado) values (9001, 2, 'APROBADO');
insert into validacion (intento_id, validador_id, resultado, retroalimentacion) values (9003, 1, 'RECHAZADO', 'Otra vez');

do $$ begin
  assert (select progreso from asignacion where id = 91) = 0, 'validar en la escalera no toca el progreso de los módulos';
  assert not exists (select 1 from notificacion where tipo = 'AVANCE'), 'ni avisa AVANCE';
end $$;

-- El progreso de los módulos sigue igual: 1 de 1 aprobada → COMPLETADO y AVANCE.
insert into validacion (intento_id, validador_id, resultado) values (9101, 2, 'APROBADO');
do $$ begin
  assert (select (progreso, estado) = (100, 'COMPLETADO') from asignacion where id = 91), 'progreso de módulo';
  assert (select count(*) from notificacion where tipo = 'AVANCE' and usuario_id = 5) = 1, 'aviso AVANCE';
end $$;
select pg_temp.debe_fallar($$insert into intento (asignacion_id, actividad_id) values (91, 911)$$,
  'intento en una asignación completada', '23514');

-- Al subir de nivel (lo hace el backend), el nivel anterior ya no se acepta.
update nivel_juego_estudiante set nivel_actual = 2, actualizado_en = now()
 where estudiante_id = 4 and tipo_juego_id = pg_temp.tipo('MEMORIA');
insert into intento (estudiante_id, actividad_id) values (4, 902);
select pg_temp.debe_fallar($$insert into intento (estudiante_id, actividad_id) values (4, 901)$$,
  'intento de un nivel ya superado', '23514');

-- ─── Historial ──────────────────────────────────────────────────────────────
insert into historial_nivel_juego (estudiante_id, tipo_juego_id, nivel_anterior, nivel_nuevo, completado, origen, intento_id, cambiado_por)
values (4, pg_temp.tipo('MEMORIA'), 1, 2, false, 'VALIDACION', 9001, 2);
insert into historial_nivel_juego (estudiante_id, tipo_juego_id, nivel_anterior, nivel_nuevo, completado, origen, cambiado_por, motivo)
values (4, pg_temp.tipo('EMPAREJAR'), 1, 5, true, 'AJUSTE', 1, 'Ya domina el juego');

select pg_temp.debe_fallar($$insert into historial_nivel_juego (estudiante_id, tipo_juego_id, nivel_anterior, nivel_nuevo, completado, origen, intento_id, cambiado_por)
                              values (4, pg_temp.tipo('MEMORIA'), 2, 3, false, 'VALIDACION', 9001, 2)$$,
  'el mismo intento sube dos veces', '23505');
select pg_temp.debe_fallar($$insert into historial_nivel_juego (estudiante_id, tipo_juego_id, nivel_anterior, nivel_nuevo, completado, origen, cambiado_por)
                              values (4, pg_temp.tipo('MEMORIA'), 2, 1, false, 'AJUSTE', 2)$$,
  'ajuste sin motivo', '23514');
select pg_temp.debe_fallar($$insert into historial_nivel_juego (estudiante_id, tipo_juego_id, nivel_anterior, nivel_nuevo, completado, origen, cambiado_por, motivo)
                              values (4, pg_temp.tipo('MEMORIA'), 2, 1, false, 'AJUSTE', 2, '   ')$$,
  'ajuste con motivo en blanco', '23514');
select pg_temp.debe_fallar($$insert into historial_nivel_juego (estudiante_id, tipo_juego_id, nivel_anterior, nivel_nuevo, completado, origen, cambiado_por, motivo)
                              values (4, pg_temp.tipo('MEMORIA'), 2, 1, false, 'AJUSTE', 3, 'Ajena')$$,
  'tallerista sin vínculo ajusta', '42501');
select pg_temp.debe_fallar($$insert into historial_nivel_juego (estudiante_id, tipo_juego_id, nivel_anterior, nivel_nuevo, completado, origen, cambiado_por, motivo)
                              values (4, pg_temp.tipo('MEMORIA'), 2, 1, false, 'AJUSTE', 5, 'Acudiente')$$,
  'acudiente ajusta', '23514');
select pg_temp.debe_fallar($$insert into historial_nivel_juego (estudiante_id, tipo_juego_id, nivel_anterior, nivel_nuevo, completado, origen, cambiado_por)
                              values (4, pg_temp.tipo('MEMORIA'), 2, 3, true, 'VALIDACION', 2)$$,
  'completado sin llegar al 5', '23514');
select pg_temp.debe_fallar($$insert into historial_nivel_juego (estudiante_id, tipo_juego_id, nivel_anterior, nivel_nuevo, completado, origen, cambiado_por, motivo)
                              values (4, pg_temp.tipo('MEMORIA'), 2, 3, false, 'OTRO', 2, 'x')$$,
  'origen desconocido', '23514');

-- ─── Aviso NIVEL_JUEGO ──────────────────────────────────────────────────────
select fn_notificar_acudientes(4, 'NIVEL_JUEGO', 'Est subió al nivel 2 de Memoria. ¡Celébrenlo juntos!');
do $$ begin
  assert (select count(*) from notificacion where tipo = 'NIVEL_JUEGO' and usuario_id = 5) = 1, 'aviso NIVEL_JUEGO';
end $$;
select pg_temp.debe_fallar($$insert into notificacion (usuario_id, tipo, mensaje) values (5, 'OTRO', 'x')$$,
  'tipo de aviso desconocido', '23514');

-- ─── Seguridad ──────────────────────────────────────────────────────────────
do $$ begin
  assert (select relrowsecurity from pg_class where oid = 'public.nivel_juego_estudiante'::regclass), 'RLS nivel_juego_estudiante';
  assert (select relrowsecurity from pg_class where oid = 'public.historial_nivel_juego'::regclass), 'RLS historial_nivel_juego';
  assert not exists (select 1 from information_schema.role_table_grants
                      where table_schema='public'
                        and table_name in ('nivel_juego_estudiante', 'historial_nivel_juego')
                        and grantee in ('anon','authenticated')), 'sin permisos de tabla';
  assert not exists (select 1 from information_schema.role_routine_grants
                      where routine_schema='public'
                        and routine_name in ('fn_juego_con_escalera', 'fn_modulo_escalera_fija', 'fn_actividad_nivel_juego',
                                             'fn_nivel_juego_tipo', 'fn_estudiante_niveles_juego', 'fn_intento_origen_fijo')
                        and grantee in ('anon','authenticated','PUBLIC')), 'sin permisos de las funciones';
end $$;

-- ─── Borrado en cascada del estudiante ──────────────────────────────────────
delete from usuario where id = 4;
do $$ begin
  assert not exists (select 1 from nivel_juego_estudiante where estudiante_id = 4), 'niveles borrados';
  assert not exists (select 1 from historial_nivel_juego where estudiante_id = 4), 'historial borrado';
  assert not exists (select 1 from intento where estudiante_id = 4), 'intentos de la escalera borrados';
end $$;

\echo 'TODAS LAS PRUEBAS DE NIVELES_POR_JUEGO PASARON'
rollback;
