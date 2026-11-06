-- ============================================================
-- Siembra de la ESCALERA DE JUEGOS: 5 niveles de Emparejar, Clasificar,
-- Secuenciar y Memoria (20 actividades), con dibujos genéricos (emojis).
--
-- Por qué existe: el módulo de la escalera necesita una directora como autora
-- (trigger trg_rol_modulo), y una migración no puede suponer que ya exista.
--
-- Antes de ejecutarlo:
--   1. Debe estar aplicada la migración 20261106000000_niveles_por_juego
--      (npm run db:deploy).
--   2. Reemplaza <<ID_DIRECTORA>> por el id (tabla usuario) de una directora.
--   3. Ejecútalo en Supabase > SQL Editor (o con psql). No es una migración:
--      no cambia el esquema ni el historial de Prisma.
--
-- Se puede ejecutar varias veces: crea solo lo que falta (la categoría, el
-- módulo y cada nivel que aún no tenga una actividad activa). No cambia un
-- nivel que ya exista, aunque la directora lo haya editado.
--
-- Cada carta es { "etiqueta", "texto" }: la app dibuja un `texto` de uno o dos
-- caracteres (un emoji) como dibujo grande. La directora puede cambiar luego
-- las cartas por pictogramas de la fundación (PATCH /actividades/:id).
-- Las configuraciones siguen la tabla de niveles de la fase 9 (una prueba
-- unitaria las valida con las reglas de cada juego y nivel).
-- ============================================================

do $$
declare
  v_directora bigint := <<ID_DIRECTORA>>;
  v_categoria bigint;
  v_modulo    bigint;
  v_creadas   integer := 0;
  nivel       record;
begin
  if not exists (
    select 1 from public.usuario u join public.rol r on r.id = u.rol_id
     where u.id = v_directora and r.nombre = 'DIRECTORA' and u.activo
  ) then
    raise exception 'El usuario % no es una directora activa.', v_directora;
  end if;

  insert into public.categoria (nombre, descripcion)
  values ('JUEGOS', 'Juegos para pensar y recordar')
  on conflict (nombre) do nothing;
  select id into v_categoria from public.categoria where nombre = 'JUEGOS';

  select id into v_modulo from public.modulo where es_escalera;
  if v_modulo is null then
    -- Sin publicar: no aparece en el catálogo de las talleristas ni se asigna.
    insert into public.modulo (categoria_id, nivel_id, creado_por, nombre, descripcion, publicado, es_escalera)
    select v_categoria, n.id, v_directora, 'Escalera de juegos',
           'Los 5 niveles de Emparejar, Clasificar, Secuenciar y Memoria', false, true
      from public.nivel n
     order by n.orden
     limit 1
    returning id into v_modulo;
  end if;

  for nivel in
    select * from (values
      -- ─── Memoria: 2, 3, 4, 5 y 6 parejas ─────────────────────────────────
      ('MEMORIA', 1, 'Memoria · nivel 1', $j${"tableros":[{"parejas":[
        {"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"perro","texto":"🐶"}]}]}$j$),
      ('MEMORIA', 2, 'Memoria · nivel 2', $j${"tableros":[{"parejas":[
        {"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"perro","texto":"🐶"},
        {"etiqueta":"sol","texto":"☀️"}]}]}$j$),
      ('MEMORIA', 3, 'Memoria · nivel 3', $j${"tableros":[{"parejas":[
        {"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"perro","texto":"🐶"},
        {"etiqueta":"sol","texto":"☀️"},{"etiqueta":"carro","texto":"🚗"}]}]}$j$),
      ('MEMORIA', 4, 'Memoria · nivel 4', $j${"tableros":[{"parejas":[
        {"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"perro","texto":"🐶"},
        {"etiqueta":"sol","texto":"☀️"},{"etiqueta":"carro","texto":"🚗"},
        {"etiqueta":"pelota","texto":"⚽"}]}]}$j$),
      -- Nivel 5: dibujos parecidos (todos animales).
      ('MEMORIA', 5, 'Memoria · nivel 5', $j${"tableros":[{"parejas":[
        {"etiqueta":"perro","texto":"🐶"},{"etiqueta":"gato","texto":"🐱"},
        {"etiqueta":"ratón","texto":"🐭"},{"etiqueta":"conejo","texto":"🐰"},
        {"etiqueta":"oso","texto":"🐻"},{"etiqueta":"panda","texto":"🐼"}]}]}$j$),

      -- ─── Emparejar: 2, 3 y 4 opciones (igual a igual); 3 y 4 (palabra) ───
      ('EMPAREJAR', 1, 'Emparejar · nivel 1', $j${"rondas":[
        {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"manzana","texto":"🍎"},
         "opciones":[{"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"carro","texto":"🚗"}],"respuesta":0},
        {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"perro","texto":"🐶"},
         "opciones":[{"etiqueta":"estrella","texto":"⭐"},{"etiqueta":"perro","texto":"🐶"}],"respuesta":1},
        {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"sol","texto":"☀️"},
         "opciones":[{"etiqueta":"sol","texto":"☀️"},{"etiqueta":"pez","texto":"🐟"}],"respuesta":0}]}$j$),
      ('EMPAREJAR', 2, 'Emparejar · nivel 2', $j${"rondas":[
        {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"gato","texto":"🐱"},
         "opciones":[{"etiqueta":"gato","texto":"🐱"},{"etiqueta":"carro","texto":"🚗"},{"etiqueta":"plátano","texto":"🍌"}],"respuesta":0},
        {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"luna","texto":"🌙"},
         "opciones":[{"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"luna","texto":"🌙"},{"etiqueta":"pez","texto":"🐟"}],"respuesta":1},
        {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"globo","texto":"🎈"},
         "opciones":[{"etiqueta":"pelota","texto":"⚽"},{"etiqueta":"perro","texto":"🐶"},{"etiqueta":"globo","texto":"🎈"}],"respuesta":2}]}$j$),
      ('EMPAREJAR', 3, 'Emparejar · nivel 3', $j${"rondas":[
        {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"conejo","texto":"🐰"},
         "opciones":[{"etiqueta":"conejo","texto":"🐰"},{"etiqueta":"oso","texto":"🐻"},{"etiqueta":"fresa","texto":"🍓"},{"etiqueta":"carro","texto":"🚗"}],"respuesta":0},
        {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"flor","texto":"🌸"},
         "opciones":[{"etiqueta":"sol","texto":"☀️"},{"etiqueta":"hoja","texto":"🍃"},{"etiqueta":"flor","texto":"🌸"},{"etiqueta":"globo","texto":"🎈"}],"respuesta":2},
        {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"tren","texto":"🚂"},
         "opciones":[{"etiqueta":"carro","texto":"🚗"},{"etiqueta":"barco","texto":"⛵"},{"etiqueta":"avión","texto":"✈️"},{"etiqueta":"tren","texto":"🚂"}],"respuesta":3}]}$j$),
      -- Niveles 4 y 5: la tarjeta de arriba es la palabra.
      ('EMPAREJAR', 4, 'Emparejar · nivel 4', $j${"rondas":[
        {"pregunta":"¿Cuál es?","estimulo":{"etiqueta":"perro","texto":"perro"},
         "opciones":[{"etiqueta":"perro","texto":"🐶"},{"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"sol","texto":"☀️"}],"respuesta":0},
        {"pregunta":"¿Cuál es?","estimulo":{"etiqueta":"carro","texto":"carro"},
         "opciones":[{"etiqueta":"pez","texto":"🐟"},{"etiqueta":"carro","texto":"🚗"},{"etiqueta":"flor","texto":"🌸"}],"respuesta":1},
        {"pregunta":"¿Cuál es?","estimulo":{"etiqueta":"luna","texto":"luna"},
         "opciones":[{"etiqueta":"pelota","texto":"⚽"},{"etiqueta":"gato","texto":"🐱"},{"etiqueta":"luna","texto":"🌙"}],"respuesta":2}]}$j$),
      ('EMPAREJAR', 5, 'Emparejar · nivel 5', $j${"rondas":[
        {"pregunta":"¿Cuál es?","estimulo":{"etiqueta":"gato","texto":"gato"},
         "opciones":[{"etiqueta":"perro","texto":"🐶"},{"etiqueta":"gato","texto":"🐱"},{"etiqueta":"conejo","texto":"🐰"},{"etiqueta":"ratón","texto":"🐭"}],"respuesta":1},
        {"pregunta":"¿Cuál es?","estimulo":{"etiqueta":"fresa","texto":"fresa"},
         "opciones":[{"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"cereza","texto":"🍒"},{"etiqueta":"tomate","texto":"🍅"},{"etiqueta":"fresa","texto":"🍓"}],"respuesta":3},
        {"pregunta":"¿Cuál es?","estimulo":{"etiqueta":"barco","texto":"barco"},
         "opciones":[{"etiqueta":"barco","texto":"⛵"},{"etiqueta":"avión","texto":"✈️"},{"etiqueta":"tren","texto":"🚂"},{"etiqueta":"carro","texto":"🚗"}],"respuesta":0}]}$j$),

      -- ─── Clasificar: 2 grupos (4, 6 y 8 elementos); 3 grupos (6 y 9) ─────
      -- Nivel 1: la diferencia es el color.
      ('CLASIFICAR', 1, 'Clasificar · nivel 1', $j${"conjuntos":[{"pregunta":"¿Es rojo o azul?",
        "grupos":[{"etiqueta":"rojo","texto":"🔴"},{"etiqueta":"azul","texto":"🔵"}],
        "elementos":[
          {"cara":{"etiqueta":"manzana","texto":"🍎"},"grupo":0},
          {"cara":{"etiqueta":"gota","texto":"💧"},"grupo":1},
          {"cara":{"etiqueta":"fresa","texto":"🍓"},"grupo":0},
          {"cara":{"etiqueta":"ballena","texto":"🐳"},"grupo":1}]}]}$j$),
      ('CLASIFICAR', 2, 'Clasificar · nivel 2', $j${"conjuntos":[{"pregunta":"¿Es fruta o animal?",
        "grupos":[{"etiqueta":"frutas","texto":"🍉"},{"etiqueta":"animales","texto":"🐾"}],
        "elementos":[
          {"cara":{"etiqueta":"plátano","texto":"🍌"},"grupo":0},
          {"cara":{"etiqueta":"gato","texto":"🐱"},"grupo":1},
          {"cara":{"etiqueta":"uvas","texto":"🍇"},"grupo":0},
          {"cara":{"etiqueta":"conejo","texto":"🐰"},"grupo":1},
          {"cara":{"etiqueta":"pera","texto":"🍐"},"grupo":0},
          {"cara":{"etiqueta":"caballo","texto":"🐴"},"grupo":1}]}]}$j$),
      ('CLASIFICAR', 3, 'Clasificar · nivel 3', $j${"conjuntos":[{"pregunta":"¿Vive en el mar o vuela en el cielo?",
        "grupos":[{"etiqueta":"mar","texto":"🌊"},{"etiqueta":"cielo","texto":"☁️"}],
        "elementos":[
          {"cara":{"etiqueta":"pez","texto":"🐟"},"grupo":0},
          {"cara":{"etiqueta":"pájaro","texto":"🐦"},"grupo":1},
          {"cara":{"etiqueta":"pulpo","texto":"🐙"},"grupo":0},
          {"cara":{"etiqueta":"avión","texto":"✈️"},"grupo":1},
          {"cara":{"etiqueta":"cangrejo","texto":"🦀"},"grupo":0},
          {"cara":{"etiqueta":"mariposa","texto":"🦋"},"grupo":1},
          {"cara":{"etiqueta":"delfín","texto":"🐬"},"grupo":0},
          {"cara":{"etiqueta":"globo","texto":"🎈"},"grupo":1}]}]}$j$),
      ('CLASIFICAR', 4, 'Clasificar · nivel 4', $j${"conjuntos":[{"pregunta":"¿Es animal, fruta o juguete?",
        "grupos":[{"etiqueta":"animales","texto":"🐾"},{"etiqueta":"frutas","texto":"🍉"},{"etiqueta":"juguetes","texto":"🧸"}],
        "elementos":[
          {"cara":{"etiqueta":"perro","texto":"🐶"},"grupo":0},
          {"cara":{"etiqueta":"plátano","texto":"🍌"},"grupo":1},
          {"cara":{"etiqueta":"pelota","texto":"⚽"},"grupo":2},
          {"cara":{"etiqueta":"vaca","texto":"🐮"},"grupo":0},
          {"cara":{"etiqueta":"uvas","texto":"🍇"},"grupo":1},
          {"cara":{"etiqueta":"cometa","texto":"🪁"},"grupo":2}]}]}$j$),
      -- Nivel 5: categorías más cercanas (todos son animales).
      ('CLASIFICAR', 5, 'Clasificar · nivel 5', $j${"conjuntos":[{"pregunta":"¿Vive en la granja, la selva o el mar?",
        "grupos":[{"etiqueta":"granja","texto":"🐄"},{"etiqueta":"selva","texto":"🌴"},{"etiqueta":"mar","texto":"🌊"}],
        "elementos":[
          {"cara":{"etiqueta":"cerdo","texto":"🐷"},"grupo":0},
          {"cara":{"etiqueta":"mono","texto":"🐒"},"grupo":1},
          {"cara":{"etiqueta":"pez","texto":"🐟"},"grupo":2},
          {"cara":{"etiqueta":"gallina","texto":"🐔"},"grupo":0},
          {"cara":{"etiqueta":"león","texto":"🦁"},"grupo":1},
          {"cara":{"etiqueta":"pulpo","texto":"🐙"},"grupo":2},
          {"cara":{"etiqueta":"oveja","texto":"🐑"},"grupo":0},
          {"cara":{"etiqueta":"serpiente","texto":"🐍"},"grupo":1},
          {"cara":{"etiqueta":"tiburón","texto":"🦈"},"grupo":2}]}]}$j$),

      -- ─── Secuenciar: 2 a 6 pasos, en orden ───────────────────────────────
      ('SECUENCIAR', 1, 'Secuenciar · nivel 1', $j${"rutinas":[{"titulo":"Lavarse las manos","pasos":[
        {"etiqueta":"lavar con jabón","texto":"🧼"},{"etiqueta":"secar las manos","texto":"🧻"}]}]}$j$),
      ('SECUENCIAR', 2, 'Secuenciar · nivel 2', $j${"rutinas":[{"titulo":"Cepillarse los dientes","pasos":[
        {"etiqueta":"tomar el cepillo","texto":"🪥"},{"etiqueta":"cepillar los dientes","texto":"😁"},
        {"etiqueta":"enjuagar la boca","texto":"🚰"}]}]}$j$),
      ('SECUENCIAR', 3, 'Secuenciar · nivel 3', $j${"rutinas":[{"titulo":"Sembrar una semilla","pasos":[
        {"etiqueta":"poner la semilla","texto":"🌰"},{"etiqueta":"regar","texto":"💧"},
        {"etiqueta":"darle sol","texto":"☀️"},{"etiqueta":"crece la planta","texto":"🌱"}]}]}$j$),
      ('SECUENCIAR', 4, 'Secuenciar · nivel 4', $j${"rutinas":[{"titulo":"Vestirse","pasos":[
        {"etiqueta":"ropa interior","texto":"🩲"},{"etiqueta":"camiseta","texto":"👕"},
        {"etiqueta":"pantalón","texto":"👖"},{"etiqueta":"medias","texto":"🧦"},
        {"etiqueta":"zapatos","texto":"👟"}]}]}$j$),
      ('SECUENCIAR', 5, 'Secuenciar · nivel 5', $j${"rutinas":[{"titulo":"Hacer un sándwich","pasos":[
        {"etiqueta":"tomar el pan","texto":"🍞"},{"etiqueta":"untar mantequilla","texto":"🧈"},
        {"etiqueta":"poner queso","texto":"🧀"},{"etiqueta":"poner tomate","texto":"🍅"},
        {"etiqueta":"cerrar el sándwich","texto":"🥪"},{"etiqueta":"¡a comer!","texto":"😋"}]}]}$j$)
    ) as t(codigo, nivel, titulo, configuracion)
  loop
    if not exists (
      select 1 from public.actividad a join public.tipo_juego tj on tj.id = a.tipo_juego_id
       where a.modulo_id = v_modulo and tj.codigo = nivel.codigo and a.nivel_juego = nivel.nivel and a.activa
    ) then
      insert into public.actividad (modulo_id, tipo_juego_id, titulo, configuracion, orden, activa, nivel_juego)
      select v_modulo, tj.id, nivel.titulo, nivel.configuracion::jsonb, nivel.nivel, true, nivel.nivel
        from public.tipo_juego tj
       where tj.codigo = nivel.codigo;
      v_creadas := v_creadas + 1;
    end if;
  end loop;

  raise notice 'Escalera de juegos: módulo %, % actividades nuevas.', v_modulo, v_creadas;
end $$;
