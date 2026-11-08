-- ============================================================
-- Siembra del CATÁLOGO INICIAL DE MÓDULOS: 16 módulos publicados para que la
-- tallerista y la directora tengan qué asignar desde el primer día.
--
--   VOCALES (Habla conmigo y Busca la boca solo con vocales, como el MVP):
--     La A, La E, La I, La O, La U, A y E juntas, Todas las vocales,
--     Repaso de vocales.
--   JUEGOS (pensar y recordar):
--     Los colores, Las frutas, Los animales, Los medios de transporte,
--     Mi cuerpo y mi higiene, Me visto solo, En la cocina, Mi casa.
--
-- Antes de ejecutarlo:
--   1. Deben estar aplicadas las migraciones (npm run db:deploy).
--   2. Revisa v_directora: es el id (tabla usuario) de una directora activa.
--   3. Ejecútalo en Supabase > SQL Editor (o con psql). No es una migración:
--      no cambia el esquema ni el historial de Prisma.
--
-- Solo agrega: no borra ni cambia nada. Se puede ejecutar varias veces: un
-- módulo se busca por su nombre y una actividad por su título dentro del
-- módulo; si ya existen, no se tocan (aunque la directora los haya editado).
--
-- Cada carta es { "etiqueta", "texto" }: la app dibuja un `texto` de uno o dos
-- caracteres (un emoji o una vocal) como dibujo grande. La directora puede
-- cambiar luego las cartas por pictogramas de la fundación
-- (PATCH /actividades/:id). Contenido pendiente de visto bueno pedagógico.
-- Las configuraciones cumplen las reglas de cada juego: lo vigila la prueba
-- src/modules/catalogo/domain/juegos/modulos-iniciales.spec.ts.
-- ============================================================

do $$
declare
  v_directora bigint := 1;
  v_modulo    bigint;
  v_mod_nuevos integer := 0;
  v_act_nuevas integer := 0;
  m record;
  a record;
begin
  if not exists (
    select 1 from public.usuario u join public.rol r on r.id = u.rol_id
     where u.id = v_directora and r.nombre = 'DIRECTORA' and u.activo
  ) then
    raise exception 'El usuario % no es una directora activa.', v_directora;
  end if;

  insert into public.categoria (nombre, descripcion)
  values ('VOCALES', 'Vocales con el Método Ventura'),
         ('JUEGOS', 'Juegos para pensar y recordar')
  on conflict (nombre) do nothing;

  -- ─── Módulos: (clave, categoría, nivel, nombre, descripción, orden) ──────
  create temp table _modulos (clave text, categoria text, nivel text, nombre text, descripcion text, orden int) on commit drop;
  insert into _modulos values
    ('A',       'VOCALES', 'BAJO',  'La A',                      'Decir, reconocer y encontrar la A', 10),
    ('E',       'VOCALES', 'BAJO',  'La E',                      'Decir, reconocer y encontrar la E', 11),
    ('I',       'VOCALES', 'BAJO',  'La I',                      'Decir, reconocer y encontrar la I', 12),
    ('O',       'VOCALES', 'BAJO',  'La O',                      'Decir, reconocer y encontrar la O', 13),
    ('U',       'VOCALES', 'BAJO',  'La U',                      'Decir, reconocer y encontrar la U', 14),
    ('AE',      'VOCALES', 'MEDIO', 'A y E juntas',              'Diferenciar la A de la E', 15),
    ('TODAS',   'VOCALES', 'MEDIO', 'Todas las vocales',         'Las cinco vocales en orden', 16),
    ('REPASO',  'VOCALES', 'ALTO',  'Repaso de vocales',         'Repasar y reconocer las cinco vocales', 17),
    ('COLORES', 'JUEGOS',  'BAJO',  'Los colores',               'Reconocer y agrupar colores', 20),
    ('FRUTAS',  'JUEGOS',  'BAJO',  'Las frutas',                'Reconocer frutas', 21),
    ('ANIMAL',  'JUEGOS',  'MEDIO', 'Los animales',              'Reconocer animales y dónde viven', 22),
    ('TRANSP',  'JUEGOS',  'MEDIO', 'Los medios de transporte',  'Reconocer transportes de tierra, agua y aire', 23),
    ('HIGIENE', 'JUEGOS',  'BAJO',  'Mi cuerpo y mi higiene',    'Rutinas de aseo', 24),
    ('VESTIR',  'JUEGOS',  'MEDIO', 'Me visto solo',             'Vestirse en orden y elegir la ropa', 25),
    ('COCINA',  'JUEGOS',  'ALTO',  'En la cocina',              'Rutinas sencillas en la cocina', 26),
    ('CASA',    'JUEGOS',  'ALTO',  'Mi casa',                   'Objetos de cada lugar de la casa', 27);

  -- ─── Actividades: (clave del módulo, juego, título, configuración) ──────
  create temp table _actividades (orden serial, clave text, codigo text, titulo text, configuracion text) on commit drop;
  insert into _actividades (clave, codigo, titulo, configuracion) values
    -- La A
    ('A', 'HABLA_CONMIGO', 'Di la A', $j${"vocal":"a"}$j$),
    ('A', 'BUSCA_LA_BOCA', 'Busca la boca de la A', $j${"vocales":["a"]}$j$),
    ('A', 'EMPAREJAR', '¿Cuál empieza con A?', $j${"rondas":[
      {"pregunta":"¿Cuál empieza con A?","estimulo":{"etiqueta":"a","texto":"a"},
       "opciones":[{"etiqueta":"abeja","texto":"🐝"},{"etiqueta":"perro","texto":"🐶"}],"respuesta":0},
      {"pregunta":"¿Cuál empieza con A?","estimulo":{"etiqueta":"a","texto":"a"},
       "opciones":[{"etiqueta":"sol","texto":"☀️"},{"etiqueta":"avión","texto":"✈️"}],"respuesta":1},
      {"pregunta":"¿Cuál empieza con A?","estimulo":{"etiqueta":"a","texto":"a"},
       "opciones":[{"etiqueta":"árbol","texto":"🌳"},{"etiqueta":"gato","texto":"🐱"}],"respuesta":0}]}$j$),
    ('A', 'MEMORIA', 'Parejas con A', $j${"tableros":[{"parejas":[
      {"etiqueta":"abeja","texto":"🐝"},{"etiqueta":"avión","texto":"✈️"},{"etiqueta":"árbol","texto":"🌳"}]}]}$j$),
    -- La E
    ('E', 'HABLA_CONMIGO', 'Di la E', $j${"vocal":"e"}$j$),
    ('E', 'BUSCA_LA_BOCA', 'Busca la boca de la E', $j${"vocales":["e"]}$j$),
    ('E', 'EMPAREJAR', '¿Cuál empieza con E?', $j${"rondas":[
      {"pregunta":"¿Cuál empieza con E?","estimulo":{"etiqueta":"e","texto":"e"},
       "opciones":[{"etiqueta":"elefante","texto":"🐘"},{"etiqueta":"pez","texto":"🐟"}],"respuesta":0},
      {"pregunta":"¿Cuál empieza con E?","estimulo":{"etiqueta":"e","texto":"e"},
       "opciones":[{"etiqueta":"carro","texto":"🚗"},{"etiqueta":"estrella","texto":"⭐"}],"respuesta":1},
      {"pregunta":"¿Cuál empieza con E?","estimulo":{"etiqueta":"e","texto":"e"},
       "opciones":[{"etiqueta":"escoba","texto":"🧹"},{"etiqueta":"luna","texto":"🌙"}],"respuesta":0}]}$j$),
    ('E', 'MEMORIA', 'Parejas con E', $j${"tableros":[{"parejas":[
      {"etiqueta":"elefante","texto":"🐘"},{"etiqueta":"estrella","texto":"⭐"},{"etiqueta":"escoba","texto":"🧹"}]}]}$j$),
    -- La I
    ('I', 'HABLA_CONMIGO', 'Di la I', $j${"vocal":"i"}$j$),
    ('I', 'BUSCA_LA_BOCA', 'Busca la boca de la I', $j${"vocales":["i"]}$j$),
    ('I', 'EMPAREJAR', '¿Cuál empieza con I?', $j${"rondas":[
      {"pregunta":"¿Cuál empieza con I?","estimulo":{"etiqueta":"i","texto":"i"},
       "opciones":[{"etiqueta":"iguana","texto":"🦎"},{"etiqueta":"pato","texto":"🦆"}],"respuesta":0},
      {"pregunta":"¿Cuál empieza con I?","estimulo":{"etiqueta":"i","texto":"i"},
       "opciones":[{"etiqueta":"flor","texto":"🌸"},{"etiqueta":"imán","texto":"🧲"}],"respuesta":1},
      {"pregunta":"¿Cuál empieza con I?","estimulo":{"etiqueta":"i","texto":"i"},
       "opciones":[{"etiqueta":"iglesia","texto":"⛪"},{"etiqueta":"pelota","texto":"⚽"}],"respuesta":0}]}$j$),
    ('I', 'MEMORIA', 'Parejas con I', $j${"tableros":[{"parejas":[
      {"etiqueta":"iguana","texto":"🦎"},{"etiqueta":"imán","texto":"🧲"},{"etiqueta":"iglesia","texto":"⛪"}]}]}$j$),
    -- La O
    ('O', 'HABLA_CONMIGO', 'Di la O', $j${"vocal":"o"}$j$),
    ('O', 'BUSCA_LA_BOCA', 'Busca la boca de la O', $j${"vocales":["o"]}$j$),
    ('O', 'EMPAREJAR', '¿Cuál empieza con O?', $j${"rondas":[
      {"pregunta":"¿Cuál empieza con O?","estimulo":{"etiqueta":"o","texto":"o"},
       "opciones":[{"etiqueta":"oso","texto":"🐻"},{"etiqueta":"casa","texto":"🏠"}],"respuesta":0},
      {"pregunta":"¿Cuál empieza con O?","estimulo":{"etiqueta":"o","texto":"o"},
       "opciones":[{"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"oveja","texto":"🐑"}],"respuesta":1},
      {"pregunta":"¿Cuál empieza con O?","estimulo":{"etiqueta":"o","texto":"o"},
       "opciones":[{"etiqueta":"oreja","texto":"👂"},{"etiqueta":"tren","texto":"🚂"}],"respuesta":0}]}$j$),
    ('O', 'MEMORIA', 'Parejas con O', $j${"tableros":[{"parejas":[
      {"etiqueta":"oso","texto":"🐻"},{"etiqueta":"oveja","texto":"🐑"},{"etiqueta":"oreja","texto":"👂"}]}]}$j$),
    -- La U
    ('U', 'HABLA_CONMIGO', 'Di la U', $j${"vocal":"u"}$j$),
    ('U', 'BUSCA_LA_BOCA', 'Busca la boca de la U', $j${"vocales":["u"]}$j$),
    ('U', 'EMPAREJAR', '¿Cuál empieza con U?', $j${"rondas":[
      {"pregunta":"¿Cuál empieza con U?","estimulo":{"etiqueta":"u","texto":"u"},
       "opciones":[{"etiqueta":"uvas","texto":"🍇"},{"etiqueta":"barco","texto":"⛵"}],"respuesta":0},
      {"pregunta":"¿Cuál empieza con U?","estimulo":{"etiqueta":"u","texto":"u"},
       "opciones":[{"etiqueta":"mesa","texto":"🪑"},{"etiqueta":"unicornio","texto":"🦄"}],"respuesta":1},
      {"pregunta":"¿Cuál empieza con U?","estimulo":{"etiqueta":"u","texto":"u"},
       "opciones":[{"etiqueta":"uña","texto":"💅"},{"etiqueta":"sol","texto":"☀️"}],"respuesta":0}]}$j$),
    ('U', 'MEMORIA', 'Parejas con U', $j${"tableros":[{"parejas":[
      {"etiqueta":"uvas","texto":"🍇"},{"etiqueta":"unicornio","texto":"🦄"},{"etiqueta":"uña","texto":"💅"}]}]}$j$),
    -- A y E juntas
    ('AE', 'HABLA_CONMIGO', 'Di la A', $j${"vocal":"a"}$j$),
    ('AE', 'HABLA_CONMIGO', 'Di la E', $j${"vocal":"e"}$j$),
    ('AE', 'BUSCA_LA_BOCA', 'Busca la boca: A o E', $j${"vocales":["a","e"]}$j$),
    ('AE', 'EMPAREJAR', '¿Es la A o la E?', $j${"rondas":[
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"a","texto":"a"},
       "opciones":[{"etiqueta":"a","texto":"a"},{"etiqueta":"e","texto":"e"}],"respuesta":0},
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"e","texto":"e"},
       "opciones":[{"etiqueta":"a","texto":"a"},{"etiqueta":"e","texto":"e"}],"respuesta":1},
      {"pregunta":"¿Cuál empieza con A?","estimulo":{"etiqueta":"a","texto":"a"},
       "opciones":[{"etiqueta":"elefante","texto":"🐘"},{"etiqueta":"abeja","texto":"🐝"}],"respuesta":1},
      {"pregunta":"¿Cuál empieza con E?","estimulo":{"etiqueta":"e","texto":"e"},
       "opciones":[{"etiqueta":"estrella","texto":"⭐"},{"etiqueta":"avión","texto":"✈️"}],"respuesta":0}]}$j$),
    -- Todas las vocales
    ('TODAS', 'HABLA_CONMIGO', 'Di la A', $j${"vocal":"a"}$j$),
    ('TODAS', 'HABLA_CONMIGO', 'Di la E', $j${"vocal":"e"}$j$),
    ('TODAS', 'HABLA_CONMIGO', 'Di la I', $j${"vocal":"i"}$j$),
    ('TODAS', 'HABLA_CONMIGO', 'Di la O', $j${"vocal":"o"}$j$),
    ('TODAS', 'HABLA_CONMIGO', 'Di la U', $j${"vocal":"u"}$j$),
    ('TODAS', 'BUSCA_LA_BOCA', 'Busca la boca de las vocales', $j${"vocales":["a","e","i","o","u"]}$j$),
    ('TODAS', 'SECUENCIAR', 'Las vocales en orden', $j${"rutinas":[{"titulo":"Las vocales en orden","pasos":[
      {"etiqueta":"a","texto":"a"},{"etiqueta":"e","texto":"e"},{"etiqueta":"i","texto":"i"},
      {"etiqueta":"o","texto":"o"},{"etiqueta":"u","texto":"u"}]}]}$j$),
    -- Repaso de vocales
    ('REPASO', 'BUSCA_LA_BOCA', 'Busca la boca de las vocales', $j${"vocales":["a","e","i","o","u"]}$j$),
    ('REPASO', 'MEMORIA', 'Parejas de vocales', $j${"tableros":[{"parejas":[
      {"etiqueta":"a","texto":"a"},{"etiqueta":"e","texto":"e"},{"etiqueta":"i","texto":"i"},
      {"etiqueta":"o","texto":"o"},{"etiqueta":"u","texto":"u"}]}]}$j$),
    ('REPASO', 'CLASIFICAR', '¿Vocal o número?', $j${"conjuntos":[{"pregunta":"¿Es vocal o número?",
      "grupos":[{"etiqueta":"vocales","texto":"a"},{"etiqueta":"números","texto":"1"}],
      "elementos":[
        {"cara":{"etiqueta":"e","texto":"e"},"grupo":0},
        {"cara":{"etiqueta":"dos","texto":"2"},"grupo":1},
        {"cara":{"etiqueta":"o","texto":"o"},"grupo":0},
        {"cara":{"etiqueta":"tres","texto":"3"},"grupo":1},
        {"cara":{"etiqueta":"u","texto":"u"},"grupo":0},
        {"cara":{"etiqueta":"cinco","texto":"5"},"grupo":1}]}]}$j$),
    -- Los colores
    ('COLORES', 'CLASIFICAR', '¿Rojo o azul?', $j${"conjuntos":[{"pregunta":"¿Es rojo o azul?",
      "grupos":[{"etiqueta":"rojo","texto":"🔴"},{"etiqueta":"azul","texto":"🔵"}],
      "elementos":[
        {"cara":{"etiqueta":"fresa","texto":"🍓"},"grupo":0},
        {"cara":{"etiqueta":"ballena","texto":"🐳"},"grupo":1},
        {"cara":{"etiqueta":"tomate","texto":"🍅"},"grupo":0},
        {"cara":{"etiqueta":"gota","texto":"💧"},"grupo":1}]}]}$j$),
    ('COLORES', 'EMPAREJAR', 'El mismo color', $j${"rondas":[
      {"pregunta":"¿Cuál es del mismo color?","estimulo":{"etiqueta":"rojo","texto":"🔴"},
       "opciones":[{"etiqueta":"manzana roja","texto":"🍎"},{"etiqueta":"hoja verde","texto":"🍃"}],"respuesta":0},
      {"pregunta":"¿Cuál es del mismo color?","estimulo":{"etiqueta":"amarillo","texto":"🟡"},
       "opciones":[{"etiqueta":"uvas moradas","texto":"🍇"},{"etiqueta":"plátano amarillo","texto":"🍌"}],"respuesta":1},
      {"pregunta":"¿Cuál es del mismo color?","estimulo":{"etiqueta":"verde","texto":"🟢"},
       "opciones":[{"etiqueta":"rana verde","texto":"🐸"},{"etiqueta":"fresa roja","texto":"🍓"}],"respuesta":0}]}$j$),
    -- Las frutas
    ('FRUTAS', 'EMPAREJAR', '¿Cuál es igual?', $j${"rondas":[
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"manzana","texto":"🍎"},
       "opciones":[{"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"pera","texto":"🍐"}],"respuesta":0},
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"plátano","texto":"🍌"},
       "opciones":[{"etiqueta":"uvas","texto":"🍇"},{"etiqueta":"plátano","texto":"🍌"},{"etiqueta":"fresa","texto":"🍓"}],"respuesta":1},
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"sandía","texto":"🍉"},
       "opciones":[{"etiqueta":"sandía","texto":"🍉"},{"etiqueta":"naranja","texto":"🍊"},{"etiqueta":"piña","texto":"🍍"}],"respuesta":0}]}$j$),
    ('FRUTAS', 'MEMORIA', 'Parejas de frutas', $j${"tableros":[{"parejas":[
      {"etiqueta":"manzana","texto":"🍎"},{"etiqueta":"plátano","texto":"🍌"},
      {"etiqueta":"uvas","texto":"🍇"},{"etiqueta":"fresa","texto":"🍓"}]}]}$j$),
    ('FRUTAS', 'CLASIFICAR', '¿Es fruta?', $j${"conjuntos":[{"pregunta":"¿Es fruta o no es fruta?",
      "grupos":[{"etiqueta":"frutas","texto":"🍉"},{"etiqueta":"no son frutas","texto":"🧸"}],
      "elementos":[
        {"cara":{"etiqueta":"pera","texto":"🍐"},"grupo":0},
        {"cara":{"etiqueta":"pelota","texto":"⚽"},"grupo":1},
        {"cara":{"etiqueta":"naranja","texto":"🍊"},"grupo":0},
        {"cara":{"etiqueta":"zapato","texto":"👟"},"grupo":1},
        {"cara":{"etiqueta":"piña","texto":"🍍"},"grupo":0},
        {"cara":{"etiqueta":"carro","texto":"🚗"},"grupo":1}]}]}$j$),
    -- Los animales
    ('ANIMAL', 'EMPAREJAR', '¿Cuál es igual?', $j${"rondas":[
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"vaca","texto":"🐮"},
       "opciones":[{"etiqueta":"cerdo","texto":"🐷"},{"etiqueta":"vaca","texto":"🐮"},{"etiqueta":"oveja","texto":"🐑"}],"respuesta":1},
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"león","texto":"🦁"},
       "opciones":[{"etiqueta":"león","texto":"🦁"},{"etiqueta":"tigre","texto":"🐯"},{"etiqueta":"mono","texto":"🐒"}],"respuesta":0},
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"pez","texto":"🐟"},
       "opciones":[{"etiqueta":"pulpo","texto":"🐙"},{"etiqueta":"delfín","texto":"🐬"},{"etiqueta":"pez","texto":"🐟"}],"respuesta":2}]}$j$),
    ('ANIMAL', 'MEMORIA', 'Parejas de animales', $j${"tableros":[{"parejas":[
      {"etiqueta":"perro","texto":"🐶"},{"etiqueta":"gato","texto":"🐱"},
      {"etiqueta":"vaca","texto":"🐮"},{"etiqueta":"pollito","texto":"🐤"}]}]}$j$),
    ('ANIMAL', 'CLASIFICAR', '¿Dónde vive?', $j${"conjuntos":[{"pregunta":"¿Vive en la granja, la selva o el mar?",
      "grupos":[{"etiqueta":"granja","texto":"🐄"},{"etiqueta":"selva","texto":"🌴"},{"etiqueta":"mar","texto":"🌊"}],
      "elementos":[
        {"cara":{"etiqueta":"cerdo","texto":"🐷"},"grupo":0},
        {"cara":{"etiqueta":"mono","texto":"🐒"},"grupo":1},
        {"cara":{"etiqueta":"pez","texto":"🐟"},"grupo":2},
        {"cara":{"etiqueta":"gallina","texto":"🐔"},"grupo":0},
        {"cara":{"etiqueta":"león","texto":"🦁"},"grupo":1},
        {"cara":{"etiqueta":"pulpo","texto":"🐙"},"grupo":2}]}]}$j$),
    -- Los medios de transporte
    ('TRANSP', 'EMPAREJAR', '¿Cuál es igual?', $j${"rondas":[
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"bus","texto":"🚌"},
       "opciones":[{"etiqueta":"bus","texto":"🚌"},{"etiqueta":"carro","texto":"🚗"},{"etiqueta":"moto","texto":"🏍"}],"respuesta":0},
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"barco","texto":"⛵"},
       "opciones":[{"etiqueta":"avión","texto":"✈️"},{"etiqueta":"barco","texto":"⛵"},{"etiqueta":"tren","texto":"🚂"}],"respuesta":1},
      {"pregunta":"¿Cuál es igual?","estimulo":{"etiqueta":"bicicleta","texto":"🚲"},
       "opciones":[{"etiqueta":"carro","texto":"🚗"},{"etiqueta":"bus","texto":"🚌"},{"etiqueta":"bicicleta","texto":"🚲"}],"respuesta":2}]}$j$),
    ('TRANSP', 'CLASIFICAR', '¿Por dónde va?', $j${"conjuntos":[{"pregunta":"¿Va por tierra, por agua o por aire?",
      "grupos":[{"etiqueta":"tierra","texto":"🛣"},{"etiqueta":"agua","texto":"🌊"},{"etiqueta":"aire","texto":"☁️"}],
      "elementos":[
        {"cara":{"etiqueta":"carro","texto":"🚗"},"grupo":0},
        {"cara":{"etiqueta":"barco","texto":"⛵"},"grupo":1},
        {"cara":{"etiqueta":"avión","texto":"✈️"},"grupo":2},
        {"cara":{"etiqueta":"tren","texto":"🚂"},"grupo":0},
        {"cara":{"etiqueta":"canoa","texto":"🛶"},"grupo":1},
        {"cara":{"etiqueta":"helicóptero","texto":"🚁"},"grupo":2}]}]}$j$),
    ('TRANSP', 'MEMORIA', 'Parejas de transportes', $j${"tableros":[{"parejas":[
      {"etiqueta":"carro","texto":"🚗"},{"etiqueta":"avión","texto":"✈️"},
      {"etiqueta":"barco","texto":"⛵"},{"etiqueta":"bicicleta","texto":"🚲"}]}]}$j$),
    -- Mi cuerpo y mi higiene
    ('HIGIENE', 'SECUENCIAR', 'Lavarse las manos', $j${"rutinas":[{"titulo":"Lavarse las manos","pasos":[
      {"etiqueta":"abrir la llave","texto":"🚰"},{"etiqueta":"lavar con jabón","texto":"🧼"},
      {"etiqueta":"secar las manos","texto":"🧻"}]}]}$j$),
    ('HIGIENE', 'SECUENCIAR', 'Cepillarse los dientes', $j${"rutinas":[{"titulo":"Cepillarse los dientes","pasos":[
      {"etiqueta":"tomar el cepillo","texto":"🪥"},{"etiqueta":"cepillar los dientes","texto":"😁"},
      {"etiqueta":"enjuagar la boca","texto":"🚰"}]}]}$j$),
    ('HIGIENE', 'EMPAREJAR', '¿Para qué sirve?', $j${"rondas":[
      {"pregunta":"¿Con qué te lavas las manos?","estimulo":{"etiqueta":"manos","texto":"🙌"},
       "opciones":[{"etiqueta":"jabón","texto":"🧼"},{"etiqueta":"pelota","texto":"⚽"}],"respuesta":0},
      {"pregunta":"¿Con qué te cepillas los dientes?","estimulo":{"etiqueta":"dientes","texto":"😁"},
       "opciones":[{"etiqueta":"cuchara","texto":"🥄"},{"etiqueta":"cepillo","texto":"🪥"}],"respuesta":1},
      {"pregunta":"¿Con qué te bañas?","estimulo":{"etiqueta":"baño","texto":"🛁"},
       "opciones":[{"etiqueta":"ducha","texto":"🚿"},{"etiqueta":"libro","texto":"📖"}],"respuesta":0}]}$j$),
    -- Me visto solo
    ('VESTIR', 'SECUENCIAR', 'Vestirse', $j${"rutinas":[{"titulo":"Vestirse","pasos":[
      {"etiqueta":"ropa interior","texto":"🩲"},{"etiqueta":"camiseta","texto":"👕"},
      {"etiqueta":"pantalón","texto":"👖"},{"etiqueta":"medias","texto":"🧦"},
      {"etiqueta":"zapatos","texto":"👟"}]}]}$j$),
    ('VESTIR', 'CLASIFICAR', '¿Para el frío o para el calor?', $j${"conjuntos":[{"pregunta":"¿Es para el frío o para el calor?",
      "grupos":[{"etiqueta":"frío","texto":"❄️"},{"etiqueta":"calor","texto":"☀️"}],
      "elementos":[
        {"cara":{"etiqueta":"bufanda","texto":"🧣"},"grupo":0},
        {"cara":{"etiqueta":"pantaloneta","texto":"🩳"},"grupo":1},
        {"cara":{"etiqueta":"guantes","texto":"🧤"},"grupo":0},
        {"cara":{"etiqueta":"gafas de sol","texto":"🕶"},"grupo":1},
        {"cara":{"etiqueta":"abrigo","texto":"🧥"},"grupo":0},
        {"cara":{"etiqueta":"chanclas","texto":"🩴"},"grupo":1}]}]}$j$),
    -- En la cocina
    ('COCINA', 'SECUENCIAR', 'Hacer un sándwich', $j${"rutinas":[{"titulo":"Hacer un sándwich","pasos":[
      {"etiqueta":"tomar el pan","texto":"🍞"},{"etiqueta":"untar mantequilla","texto":"🧈"},
      {"etiqueta":"poner queso","texto":"🧀"},{"etiqueta":"cerrar el sándwich","texto":"🥪"},
      {"etiqueta":"¡a comer!","texto":"😋"}]}]}$j$),
    ('COCINA', 'SECUENCIAR', 'Servir el cereal', $j${"rutinas":[{"titulo":"Servir el cereal","pasos":[
      {"etiqueta":"tomar el plato","texto":"🥣"},{"etiqueta":"echar el cereal","texto":"🌾"},
      {"etiqueta":"echar la leche","texto":"🥛"},{"etiqueta":"comer con la cuchara","texto":"🥄"}]}]}$j$),
    ('COCINA', 'CLASIFICAR', '¿Se come o no se come?', $j${"conjuntos":[{"pregunta":"¿Se come o no se come?",
      "grupos":[{"etiqueta":"se come","texto":"😋"},{"etiqueta":"no se come","texto":"🚫"}],
      "elementos":[
        {"cara":{"etiqueta":"pan","texto":"🍞"},"grupo":0},
        {"cara":{"etiqueta":"llave","texto":"🔑"},"grupo":1},
        {"cara":{"etiqueta":"huevo","texto":"🥚"},"grupo":0},
        {"cara":{"etiqueta":"lápiz","texto":"✏️"},"grupo":1},
        {"cara":{"etiqueta":"queso","texto":"🧀"},"grupo":0},
        {"cara":{"etiqueta":"tijeras","texto":"✂️"},"grupo":1}]}]}$j$),
    -- Mi casa
    ('CASA', 'CLASIFICAR', '¿En qué lugar de la casa va?', $j${"conjuntos":[{"pregunta":"¿Va en la cocina, el baño o la habitación?",
      "grupos":[{"etiqueta":"cocina","texto":"🍳"},{"etiqueta":"baño","texto":"🚽"},{"etiqueta":"habitación","texto":"🛏"}],
      "elementos":[
        {"cara":{"etiqueta":"olla","texto":"🍲"},"grupo":0},
        {"cara":{"etiqueta":"ducha","texto":"🚿"},"grupo":1},
        {"cara":{"etiqueta":"oso de peluche","texto":"🧸"},"grupo":2},
        {"cara":{"etiqueta":"cuchara","texto":"🥄"},"grupo":0},
        {"cara":{"etiqueta":"jabón","texto":"🧼"},"grupo":1},
        {"cara":{"etiqueta":"lámpara","texto":"💡"},"grupo":2}]}]}$j$),
    ('CASA', 'MEMORIA', 'Parejas de la casa', $j${"tableros":[{"parejas":[
      {"etiqueta":"casa","texto":"🏠"},{"etiqueta":"puerta","texto":"🚪"},
      {"etiqueta":"silla","texto":"🪑"},{"etiqueta":"llave","texto":"🔑"},
      {"etiqueta":"reloj","texto":"⏰"}]}]}$j$);

  for m in select * from _modulos order by orden loop
    select id into v_modulo from public.modulo
     where nombre = m.nombre and not es_escalera
     order by id limit 1;
    if v_modulo is null then
      insert into public.modulo (categoria_id, nivel_id, creado_por, nombre, descripcion, publicado, orden)
      select c.id, n.id, v_directora, m.nombre, m.descripcion, true, m.orden
        from public.categoria c, public.nivel n
       where c.nombre = m.categoria and n.nombre = m.nivel
      returning id into v_modulo;
      v_mod_nuevos := v_mod_nuevos + 1;
    end if;

    for a in select * from _actividades where clave = m.clave order by orden loop
      if not exists (
        select 1 from public.actividad
         where modulo_id = v_modulo and titulo = a.titulo and activa
      ) then
        insert into public.actividad (modulo_id, tipo_juego_id, titulo, configuracion, orden, activa)
        select v_modulo, tj.id, a.titulo, a.configuracion::jsonb,
               (select count(*) from public.actividad x where x.modulo_id = v_modulo) + 1, true
          from public.tipo_juego tj
         where tj.codigo = a.codigo;
        v_act_nuevas := v_act_nuevas + 1;
      end if;
    end loop;
  end loop;

  raise notice 'Catálogo de módulos: % módulos nuevos, % actividades nuevas.', v_mod_nuevos, v_act_nuevas;
end $$;
