\set ON_ERROR_STOP 1
begin;

create function pg_temp.debe_fallar(p_sql text, p_msg text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'OK (rechazado): % -> %', p_msg, sqlerrm;
    return;
  end;
  raise exception 'FALLO: se esperaba un error en: %', p_msg;
end $$;

-- Personas (ids ficticios)
insert into usuario (id, rol_id, nombres, apellidos, id_usuario_auth) values
  (1, 1, 'Dir', 'Prueba', 101),
  (2, (select id from rol where nombre='TALLERISTA'), 'Tall', 'Uno', 102),
  (3, (select id from rol where nombre='TALLERISTA'), 'Tall', 'Dos', 103),
  (4, 5, 'Est', 'Prueba', 104),
  (5, 4, 'Acu', 'Prueba', 105),
  (6, 5, 'Est', 'Dos', 106);
update usuario set id_acudiente_externo = 9005 where id = 5;
insert into estudiante (usuario_id, id_estudiante_externo) values (4, 7004), (6, 7006);
insert into acudiente_estudiante values (5, 4, 'Madre', true);
insert into tallerista_estudiante (tallerista_id, estudiante_id) values (2, 4);

select pg_temp.debe_fallar($$insert into usuario (rol_id, nombres, apellidos, id_usuario_auth) values (5,'X','Y',101)$$, 'id_usuario_auth duplicado');
select pg_temp.debe_fallar($$insert into estudiante (usuario_id, id_estudiante_externo) values (1, 1)$$, 'estudiante con rol que no es ESTUDIANTE');
select pg_temp.debe_fallar($$insert into tallerista_estudiante (tallerista_id, estudiante_id) values (5, 4)$$, 'acudiente como tallerista');

-- Módulo y actividades
insert into modulo (id, categoria_id, nivel_id, creado_por, nombre, publicado) values (1, 1, 1, 1, 'Vocales', true);
insert into contenido (id, modulo_id, tipo, titulo, url_recurso) values (1, 1, 'VIDEO', 'Vocal A con doña Consuelo', 'contenidos/vocales/a.mp4');
insert into actividad (id, modulo_id, tipo_juego_id, titulo) values
  (1, 1, (select id from tipo_juego where codigo='HABLA_CONMIGO'), 'Habla conmigo A'),
  (2, 1, (select id from tipo_juego where codigo='BUSCA_LA_BOCA'), 'Busca la boca A');
insert into actividad_contenido (actividad_id, contenido_id, url_imagen) values (1, 1, 'contenidos/vocales/a.png');

-- Asignación: solo quien tiene el estudiante a cargo
select pg_temp.debe_fallar($$insert into asignacion (modulo_id, estudiante_id, asignado_por) values (1, 4, 3)$$, 'tallerista sin el estudiante asigna');
insert into asignacion (id, modulo_id, estudiante_id, asignado_por) values (1, 1, 4, 2);
insert into asignacion (id, modulo_id, estudiante_id, asignado_por) values (2, 1, 6, 1);  -- la directora puede con todos

-- Intentos y grabación
insert into intento (id, asignacion_id, actividad_id) values (1, 1, 1), (2, 1, 2);
select pg_temp.debe_fallar($$insert into grabacion_estudiante (intento_id, ruta_audio, codigo_version_terminos, consentimiento_verificado_en) values (2, 'grabaciones/x.m4a', 'v1', now())$$, 'grabación en Busca la boca');
insert into grabacion_estudiante (intento_id, ruta_audio, codigo_version_terminos, consentimiento_verificado_en)
  values (1, 'grabaciones/4/1.m4a', 'v1', now());

-- Validación: el tallerista sin el estudiante no puede
select pg_temp.debe_fallar($$insert into validacion (intento_id, validador_id, resultado) values (1, 3, 'APROBADO')$$, 'tallerista sin el estudiante valida');
select pg_temp.debe_fallar($$insert into validacion (intento_id, validador_id, resultado) values (1, 5, 'APROBADO')$$, 'acudiente valida');

do $$ begin
  assert (select count(*) from grabacion_por_eliminar) = 0, 'sin validar no debe estar por eliminar';
end $$;

insert into validacion (intento_id, validador_id, resultado) values (1, 2, 'APROBADO');
do $$ begin
  assert (select progreso from asignacion where id = 1) = 50, 'progreso debe ser 50';
  assert (select count(*) from grabacion_por_eliminar) = 1, 'tras validar debe quedar por eliminar';
end $$;

-- Desactivar la otra actividad recalcula: 1 de 1 aprobada -> 100 y COMPLETADO
update actividad set activa = false where id = 2;
do $$ begin
  assert (select progreso from asignacion where id = 1) = 100, 'progreso debe ser 100';
  assert (select estado from asignacion where id = 1) = 'COMPLETADO', 'debe quedar COMPLETADO';
end $$;
select pg_temp.debe_fallar($$insert into intento (asignacion_id, actividad_id) values (1, 1)$$, 'intento en asignación completada');

-- Agregar una actividad nueva la reabre
insert into actividad (id, modulo_id, tipo_juego_id, titulo) values (3, 1, (select id from tipo_juego where codigo='MEMORIA'), 'Memoria');
do $$ begin
  assert (select progreso from asignacion where id = 1) = 50, 'progreso debe volver a 50';
  assert (select estado from asignacion where id = 1) = 'EN_CURSO', 'debe volver a EN_CURSO';
end $$;

-- Observación del tallerista a cargo notifica al acudiente
insert into observacion (estudiante_id, autor_id, texto, visible_acudiente) values (4, 2, 'Muy bien', true);
select pg_temp.debe_fallar($$insert into observacion (estudiante_id, autor_id, texto) values (4, 3, 'x')$$, 'observación de tallerista sin el estudiante');
do $$ begin
  assert (select count(*) from notificacion where usuario_id = 5 and tipo = 'OBSERVACION') = 1, 'debe notificar al acudiente';
end $$;

-- Catálogo y seguridad
do $$ begin
  assert (select string_agg(codigo, ',' order by id) from tipo_juego) = 'EMPAREJAR,CLASIFICAR,SECUENCIAR,MEMORIA,HABLA_CONMIGO,BUSCA_LA_BOCA', 'tipos de juego';
  assert (select count(*) from storage.buckets where id in ('contenidos','grabaciones') and not public) = 2, 'buckets privados';
  assert not exists (select 1 from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated')), 'sin permisos de tabla';
  assert not exists (select 1 from information_schema.role_routine_grants where routine_schema='public' and grantee in ('anon','authenticated','PUBLIC')), 'sin permisos de funciones';
  assert to_regclass('public.consentimiento') is null and to_regclass('public.grabacion_voz') is null, 'tablas eliminadas';
end $$;

\echo TODAS LAS PRUEBAS PASARON
rollback;
