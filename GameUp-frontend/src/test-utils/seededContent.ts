/**
 * Contenido que siembra el backend (prisma/scripts/sembrar_escalera.sql y
 * sembrar_modulos.sql), copiado tal cual: código de juego y configuración.
 * Sirve para probar las pantallas con el contenido REAL de la API (emojis
 * en `texto`, etiquetas largas…), no solo con los datos simulados.
 * Generado el 2026-11-19; si cambia la siembra, se vuelve a generar.
 */
export interface SeededActivity {
  origen: string;
  codigo: string;
  configuracion: unknown;
}

export const seededActivities: readonly SeededActivity[] = [
  {
    origen: 'sembrar_escalera.sql#1',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#2',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
            {
              etiqueta: 'sol',
              texto: '☀️',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#3',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
            {
              etiqueta: 'sol',
              texto: '☀️',
            },
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#4',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
            {
              etiqueta: 'sol',
              texto: '☀️',
            },
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
            {
              etiqueta: 'pelota',
              texto: '⚽',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#5',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
            {
              etiqueta: 'gato',
              texto: '🐱',
            },
            {
              etiqueta: 'ratón',
              texto: '🐭',
            },
            {
              etiqueta: 'conejo',
              texto: '🐰',
            },
            {
              etiqueta: 'oso',
              texto: '🐻',
            },
            {
              etiqueta: 'panda',
              texto: '🐼',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#6',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'manzana',
            texto: '🍎',
          },
          opciones: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'perro',
            texto: '🐶',
          },
          opciones: [
            {
              etiqueta: 'estrella',
              texto: '⭐',
            },
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'sol',
            texto: '☀️',
          },
          opciones: [
            {
              etiqueta: 'sol',
              texto: '☀️',
            },
            {
              etiqueta: 'pez',
              texto: '🐟',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#7',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'gato',
            texto: '🐱',
          },
          opciones: [
            {
              etiqueta: 'gato',
              texto: '🐱',
            },
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
            {
              etiqueta: 'plátano',
              texto: '🍌',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'luna',
            texto: '🌙',
          },
          opciones: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'luna',
              texto: '🌙',
            },
            {
              etiqueta: 'pez',
              texto: '🐟',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'globo',
            texto: '🎈',
          },
          opciones: [
            {
              etiqueta: 'pelota',
              texto: '⚽',
            },
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
            {
              etiqueta: 'globo',
              texto: '🎈',
            },
          ],
          respuesta: 2,
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#8',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'conejo',
            texto: '🐰',
          },
          opciones: [
            {
              etiqueta: 'conejo',
              texto: '🐰',
            },
            {
              etiqueta: 'oso',
              texto: '🐻',
            },
            {
              etiqueta: 'fresa',
              texto: '🍓',
            },
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'flor',
            texto: '🌸',
          },
          opciones: [
            {
              etiqueta: 'sol',
              texto: '☀️',
            },
            {
              etiqueta: 'hoja',
              texto: '🍃',
            },
            {
              etiqueta: 'flor',
              texto: '🌸',
            },
            {
              etiqueta: 'globo',
              texto: '🎈',
            },
          ],
          respuesta: 2,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'tren',
            texto: '🚂',
          },
          opciones: [
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
            {
              etiqueta: 'barco',
              texto: '⛵',
            },
            {
              etiqueta: 'avión',
              texto: '✈️',
            },
            {
              etiqueta: 'tren',
              texto: '🚂',
            },
          ],
          respuesta: 3,
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#9',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es?',
          estimulo: {
            etiqueta: 'perro',
            texto: 'perro',
          },
          opciones: [
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'sol',
              texto: '☀️',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál es?',
          estimulo: {
            etiqueta: 'carro',
            texto: 'carro',
          },
          opciones: [
            {
              etiqueta: 'pez',
              texto: '🐟',
            },
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
            {
              etiqueta: 'flor',
              texto: '🌸',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál es?',
          estimulo: {
            etiqueta: 'luna',
            texto: 'luna',
          },
          opciones: [
            {
              etiqueta: 'pelota',
              texto: '⚽',
            },
            {
              etiqueta: 'gato',
              texto: '🐱',
            },
            {
              etiqueta: 'luna',
              texto: '🌙',
            },
          ],
          respuesta: 2,
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#10',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es?',
          estimulo: {
            etiqueta: 'gato',
            texto: 'gato',
          },
          opciones: [
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
            {
              etiqueta: 'gato',
              texto: '🐱',
            },
            {
              etiqueta: 'conejo',
              texto: '🐰',
            },
            {
              etiqueta: 'ratón',
              texto: '🐭',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál es?',
          estimulo: {
            etiqueta: 'fresa',
            texto: 'fresa',
          },
          opciones: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'cereza',
              texto: '🍒',
            },
            {
              etiqueta: 'tomate',
              texto: '🍅',
            },
            {
              etiqueta: 'fresa',
              texto: '🍓',
            },
          ],
          respuesta: 3,
        },
        {
          pregunta: '¿Cuál es?',
          estimulo: {
            etiqueta: 'barco',
            texto: 'barco',
          },
          opciones: [
            {
              etiqueta: 'barco',
              texto: '⛵',
            },
            {
              etiqueta: 'avión',
              texto: '✈️',
            },
            {
              etiqueta: 'tren',
              texto: '🚂',
            },
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#11',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Es rojo o azul?',
          grupos: [
            {
              etiqueta: 'rojo',
              texto: '🔴',
            },
            {
              etiqueta: 'azul',
              texto: '🔵',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'manzana',
                texto: '🍎',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'gota',
                texto: '💧',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'fresa',
                texto: '🍓',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'ballena',
                texto: '🐳',
              },
              grupo: 1,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#12',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Es fruta o animal?',
          grupos: [
            {
              etiqueta: 'frutas',
              texto: '🍉',
            },
            {
              etiqueta: 'animales',
              texto: '🐾',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'plátano',
                texto: '🍌',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'gato',
                texto: '🐱',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'uvas',
                texto: '🍇',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'conejo',
                texto: '🐰',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'pera',
                texto: '🍐',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'caballo',
                texto: '🐴',
              },
              grupo: 1,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#13',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Vive en el mar o vuela en el cielo?',
          grupos: [
            {
              etiqueta: 'mar',
              texto: '🌊',
            },
            {
              etiqueta: 'cielo',
              texto: '☁️',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'pez',
                texto: '🐟',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'pájaro',
                texto: '🐦',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'pulpo',
                texto: '🐙',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'avión',
                texto: '✈️',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'cangrejo',
                texto: '🦀',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'mariposa',
                texto: '🦋',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'delfín',
                texto: '🐬',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'globo',
                texto: '🎈',
              },
              grupo: 1,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#14',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Es animal, fruta o juguete?',
          grupos: [
            {
              etiqueta: 'animales',
              texto: '🐾',
            },
            {
              etiqueta: 'frutas',
              texto: '🍉',
            },
            {
              etiqueta: 'juguetes',
              texto: '🧸',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'perro',
                texto: '🐶',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'plátano',
                texto: '🍌',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'pelota',
                texto: '⚽',
              },
              grupo: 2,
            },
            {
              cara: {
                etiqueta: 'vaca',
                texto: '🐮',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'uvas',
                texto: '🍇',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'cometa',
                texto: '🪁',
              },
              grupo: 2,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#15',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Vive en la granja, la selva o el mar?',
          grupos: [
            {
              etiqueta: 'granja',
              texto: '🐄',
            },
            {
              etiqueta: 'selva',
              texto: '🌴',
            },
            {
              etiqueta: 'mar',
              texto: '🌊',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'cerdo',
                texto: '🐷',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'mono',
                texto: '🐒',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'pez',
                texto: '🐟',
              },
              grupo: 2,
            },
            {
              cara: {
                etiqueta: 'gallina',
                texto: '🐔',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'león',
                texto: '🦁',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'pulpo',
                texto: '🐙',
              },
              grupo: 2,
            },
            {
              cara: {
                etiqueta: 'oveja',
                texto: '🐑',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'serpiente',
                texto: '🐍',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'tiburón',
                texto: '🦈',
              },
              grupo: 2,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#16',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Lavarse las manos',
          pasos: [
            {
              etiqueta: 'lavar con jabón',
              texto: '🧼',
            },
            {
              etiqueta: 'secar las manos',
              texto: '🧻',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#17',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Cepillarse los dientes',
          pasos: [
            {
              etiqueta: 'tomar el cepillo',
              texto: '🪥',
            },
            {
              etiqueta: 'cepillar los dientes',
              texto: '😁',
            },
            {
              etiqueta: 'enjuagar la boca',
              texto: '🚰',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#18',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Sembrar una semilla',
          pasos: [
            {
              etiqueta: 'poner la semilla',
              texto: '🌰',
            },
            {
              etiqueta: 'regar',
              texto: '💧',
            },
            {
              etiqueta: 'darle sol',
              texto: '☀️',
            },
            {
              etiqueta: 'crece la planta',
              texto: '🌱',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#19',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Vestirse',
          pasos: [
            {
              etiqueta: 'ropa interior',
              texto: '🩲',
            },
            {
              etiqueta: 'camiseta',
              texto: '👕',
            },
            {
              etiqueta: 'pantalón',
              texto: '👖',
            },
            {
              etiqueta: 'medias',
              texto: '🧦',
            },
            {
              etiqueta: 'zapatos',
              texto: '👟',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_escalera.sql#20',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Hacer un sándwich',
          pasos: [
            {
              etiqueta: 'tomar el pan',
              texto: '🍞',
            },
            {
              etiqueta: 'untar mantequilla',
              texto: '🧈',
            },
            {
              etiqueta: 'poner queso',
              texto: '🧀',
            },
            {
              etiqueta: 'poner tomate',
              texto: '🍅',
            },
            {
              etiqueta: 'cerrar el sándwich',
              texto: '🥪',
            },
            {
              etiqueta: '¡a comer!',
              texto: '😋',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#1',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'a',
    },
  },
  {
    origen: 'sembrar_modulos.sql#2',
    codigo: 'BUSCA_LA_BOCA',
    configuracion: {
      vocales: ['a'],
    },
  },
  {
    origen: 'sembrar_modulos.sql#3',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál empieza con A?',
          estimulo: {
            etiqueta: 'a',
            texto: 'a',
          },
          opciones: [
            {
              etiqueta: 'abeja',
              texto: '🐝',
            },
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál empieza con A?',
          estimulo: {
            etiqueta: 'a',
            texto: 'a',
          },
          opciones: [
            {
              etiqueta: 'sol',
              texto: '☀️',
            },
            {
              etiqueta: 'avión',
              texto: '✈️',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál empieza con A?',
          estimulo: {
            etiqueta: 'a',
            texto: 'a',
          },
          opciones: [
            {
              etiqueta: 'árbol',
              texto: '🌳',
            },
            {
              etiqueta: 'gato',
              texto: '🐱',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#4',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'abeja',
              texto: '🐝',
            },
            {
              etiqueta: 'avión',
              texto: '✈️',
            },
            {
              etiqueta: 'árbol',
              texto: '🌳',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#5',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'e',
    },
  },
  {
    origen: 'sembrar_modulos.sql#6',
    codigo: 'BUSCA_LA_BOCA',
    configuracion: {
      vocales: ['e'],
    },
  },
  {
    origen: 'sembrar_modulos.sql#7',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál empieza con E?',
          estimulo: {
            etiqueta: 'e',
            texto: 'e',
          },
          opciones: [
            {
              etiqueta: 'elefante',
              texto: '🐘',
            },
            {
              etiqueta: 'pez',
              texto: '🐟',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál empieza con E?',
          estimulo: {
            etiqueta: 'e',
            texto: 'e',
          },
          opciones: [
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
            {
              etiqueta: 'estrella',
              texto: '⭐',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál empieza con E?',
          estimulo: {
            etiqueta: 'e',
            texto: 'e',
          },
          opciones: [
            {
              etiqueta: 'escoba',
              texto: '🧹',
            },
            {
              etiqueta: 'luna',
              texto: '🌙',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#8',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'elefante',
              texto: '🐘',
            },
            {
              etiqueta: 'estrella',
              texto: '⭐',
            },
            {
              etiqueta: 'escoba',
              texto: '🧹',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#9',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'i',
    },
  },
  {
    origen: 'sembrar_modulos.sql#10',
    codigo: 'BUSCA_LA_BOCA',
    configuracion: {
      vocales: ['i'],
    },
  },
  {
    origen: 'sembrar_modulos.sql#11',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál empieza con I?',
          estimulo: {
            etiqueta: 'i',
            texto: 'i',
          },
          opciones: [
            {
              etiqueta: 'iguana',
              texto: '🦎',
            },
            {
              etiqueta: 'pato',
              texto: '🦆',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál empieza con I?',
          estimulo: {
            etiqueta: 'i',
            texto: 'i',
          },
          opciones: [
            {
              etiqueta: 'flor',
              texto: '🌸',
            },
            {
              etiqueta: 'imán',
              texto: '🧲',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál empieza con I?',
          estimulo: {
            etiqueta: 'i',
            texto: 'i',
          },
          opciones: [
            {
              etiqueta: 'iglesia',
              texto: '⛪',
            },
            {
              etiqueta: 'pelota',
              texto: '⚽',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#12',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'iguana',
              texto: '🦎',
            },
            {
              etiqueta: 'imán',
              texto: '🧲',
            },
            {
              etiqueta: 'iglesia',
              texto: '⛪',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#13',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'o',
    },
  },
  {
    origen: 'sembrar_modulos.sql#14',
    codigo: 'BUSCA_LA_BOCA',
    configuracion: {
      vocales: ['o'],
    },
  },
  {
    origen: 'sembrar_modulos.sql#15',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál empieza con O?',
          estimulo: {
            etiqueta: 'o',
            texto: 'o',
          },
          opciones: [
            {
              etiqueta: 'oso',
              texto: '🐻',
            },
            {
              etiqueta: 'casa',
              texto: '🏠',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál empieza con O?',
          estimulo: {
            etiqueta: 'o',
            texto: 'o',
          },
          opciones: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'oveja',
              texto: '🐑',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál empieza con O?',
          estimulo: {
            etiqueta: 'o',
            texto: 'o',
          },
          opciones: [
            {
              etiqueta: 'oreja',
              texto: '👂',
            },
            {
              etiqueta: 'tren',
              texto: '🚂',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#16',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'oso',
              texto: '🐻',
            },
            {
              etiqueta: 'oveja',
              texto: '🐑',
            },
            {
              etiqueta: 'oreja',
              texto: '👂',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#17',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'u',
    },
  },
  {
    origen: 'sembrar_modulos.sql#18',
    codigo: 'BUSCA_LA_BOCA',
    configuracion: {
      vocales: ['u'],
    },
  },
  {
    origen: 'sembrar_modulos.sql#19',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál empieza con U?',
          estimulo: {
            etiqueta: 'u',
            texto: 'u',
          },
          opciones: [
            {
              etiqueta: 'uvas',
              texto: '🍇',
            },
            {
              etiqueta: 'barco',
              texto: '⛵',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál empieza con U?',
          estimulo: {
            etiqueta: 'u',
            texto: 'u',
          },
          opciones: [
            {
              etiqueta: 'mesa',
              texto: '🪑',
            },
            {
              etiqueta: 'unicornio',
              texto: '🦄',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál empieza con U?',
          estimulo: {
            etiqueta: 'u',
            texto: 'u',
          },
          opciones: [
            {
              etiqueta: 'uña',
              texto: '💅',
            },
            {
              etiqueta: 'sol',
              texto: '☀️',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#20',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'uvas',
              texto: '🍇',
            },
            {
              etiqueta: 'unicornio',
              texto: '🦄',
            },
            {
              etiqueta: 'uña',
              texto: '💅',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#21',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'a',
    },
  },
  {
    origen: 'sembrar_modulos.sql#22',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'e',
    },
  },
  {
    origen: 'sembrar_modulos.sql#23',
    codigo: 'BUSCA_LA_BOCA',
    configuracion: {
      vocales: ['a', 'e'],
    },
  },
  {
    origen: 'sembrar_modulos.sql#24',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'a',
            texto: 'a',
          },
          opciones: [
            {
              etiqueta: 'a',
              texto: 'a',
            },
            {
              etiqueta: 'e',
              texto: 'e',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'e',
            texto: 'e',
          },
          opciones: [
            {
              etiqueta: 'a',
              texto: 'a',
            },
            {
              etiqueta: 'e',
              texto: 'e',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál empieza con A?',
          estimulo: {
            etiqueta: 'a',
            texto: 'a',
          },
          opciones: [
            {
              etiqueta: 'elefante',
              texto: '🐘',
            },
            {
              etiqueta: 'abeja',
              texto: '🐝',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál empieza con E?',
          estimulo: {
            etiqueta: 'e',
            texto: 'e',
          },
          opciones: [
            {
              etiqueta: 'estrella',
              texto: '⭐',
            },
            {
              etiqueta: 'avión',
              texto: '✈️',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#25',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'a',
    },
  },
  {
    origen: 'sembrar_modulos.sql#26',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'e',
    },
  },
  {
    origen: 'sembrar_modulos.sql#27',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'i',
    },
  },
  {
    origen: 'sembrar_modulos.sql#28',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'o',
    },
  },
  {
    origen: 'sembrar_modulos.sql#29',
    codigo: 'HABLA_CONMIGO',
    configuracion: {
      vocal: 'u',
    },
  },
  {
    origen: 'sembrar_modulos.sql#30',
    codigo: 'BUSCA_LA_BOCA',
    configuracion: {
      vocales: ['a', 'e', 'i', 'o', 'u'],
    },
  },
  {
    origen: 'sembrar_modulos.sql#31',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Las vocales en orden',
          pasos: [
            {
              etiqueta: 'a',
              texto: 'a',
            },
            {
              etiqueta: 'e',
              texto: 'e',
            },
            {
              etiqueta: 'i',
              texto: 'i',
            },
            {
              etiqueta: 'o',
              texto: 'o',
            },
            {
              etiqueta: 'u',
              texto: 'u',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#32',
    codigo: 'BUSCA_LA_BOCA',
    configuracion: {
      vocales: ['a', 'e', 'i', 'o', 'u'],
    },
  },
  {
    origen: 'sembrar_modulos.sql#33',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'a',
              texto: 'a',
            },
            {
              etiqueta: 'e',
              texto: 'e',
            },
            {
              etiqueta: 'i',
              texto: 'i',
            },
            {
              etiqueta: 'o',
              texto: 'o',
            },
            {
              etiqueta: 'u',
              texto: 'u',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#34',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Es vocal o número?',
          grupos: [
            {
              etiqueta: 'vocales',
              texto: 'a',
            },
            {
              etiqueta: 'números',
              texto: '1',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'e',
                texto: 'e',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'dos',
                texto: '2',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'o',
                texto: 'o',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'tres',
                texto: '3',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'u',
                texto: 'u',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'cinco',
                texto: '5',
              },
              grupo: 1,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#35',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Es rojo o azul?',
          grupos: [
            {
              etiqueta: 'rojo',
              texto: '🔴',
            },
            {
              etiqueta: 'azul',
              texto: '🔵',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'fresa',
                texto: '🍓',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'ballena',
                texto: '🐳',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'tomate',
                texto: '🍅',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'gota',
                texto: '💧',
              },
              grupo: 1,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#36',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es del mismo color?',
          estimulo: {
            etiqueta: 'rojo',
            texto: '🔴',
          },
          opciones: [
            {
              etiqueta: 'manzana roja',
              texto: '🍎',
            },
            {
              etiqueta: 'hoja verde',
              texto: '🍃',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál es del mismo color?',
          estimulo: {
            etiqueta: 'amarillo',
            texto: '🟡',
          },
          opciones: [
            {
              etiqueta: 'uvas moradas',
              texto: '🍇',
            },
            {
              etiqueta: 'plátano amarillo',
              texto: '🍌',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál es del mismo color?',
          estimulo: {
            etiqueta: 'verde',
            texto: '🟢',
          },
          opciones: [
            {
              etiqueta: 'rana verde',
              texto: '🐸',
            },
            {
              etiqueta: 'fresa roja',
              texto: '🍓',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#37',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'manzana',
            texto: '🍎',
          },
          opciones: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'pera',
              texto: '🍐',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'plátano',
            texto: '🍌',
          },
          opciones: [
            {
              etiqueta: 'uvas',
              texto: '🍇',
            },
            {
              etiqueta: 'plátano',
              texto: '🍌',
            },
            {
              etiqueta: 'fresa',
              texto: '🍓',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'sandía',
            texto: '🍉',
          },
          opciones: [
            {
              etiqueta: 'sandía',
              texto: '🍉',
            },
            {
              etiqueta: 'naranja',
              texto: '🍊',
            },
            {
              etiqueta: 'piña',
              texto: '🍍',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#38',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'manzana',
              texto: '🍎',
            },
            {
              etiqueta: 'plátano',
              texto: '🍌',
            },
            {
              etiqueta: 'uvas',
              texto: '🍇',
            },
            {
              etiqueta: 'fresa',
              texto: '🍓',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#39',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Es fruta o no es fruta?',
          grupos: [
            {
              etiqueta: 'frutas',
              texto: '🍉',
            },
            {
              etiqueta: 'no son frutas',
              texto: '🧸',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'pera',
                texto: '🍐',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'pelota',
                texto: '⚽',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'naranja',
                texto: '🍊',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'zapato',
                texto: '👟',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'piña',
                texto: '🍍',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'carro',
                texto: '🚗',
              },
              grupo: 1,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#40',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'vaca',
            texto: '🐮',
          },
          opciones: [
            {
              etiqueta: 'cerdo',
              texto: '🐷',
            },
            {
              etiqueta: 'vaca',
              texto: '🐮',
            },
            {
              etiqueta: 'oveja',
              texto: '🐑',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'león',
            texto: '🦁',
          },
          opciones: [
            {
              etiqueta: 'león',
              texto: '🦁',
            },
            {
              etiqueta: 'tigre',
              texto: '🐯',
            },
            {
              etiqueta: 'mono',
              texto: '🐒',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'pez',
            texto: '🐟',
          },
          opciones: [
            {
              etiqueta: 'pulpo',
              texto: '🐙',
            },
            {
              etiqueta: 'delfín',
              texto: '🐬',
            },
            {
              etiqueta: 'pez',
              texto: '🐟',
            },
          ],
          respuesta: 2,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#41',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'perro',
              texto: '🐶',
            },
            {
              etiqueta: 'gato',
              texto: '🐱',
            },
            {
              etiqueta: 'vaca',
              texto: '🐮',
            },
            {
              etiqueta: 'pollito',
              texto: '🐤',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#42',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Vive en la granja, la selva o el mar?',
          grupos: [
            {
              etiqueta: 'granja',
              texto: '🐄',
            },
            {
              etiqueta: 'selva',
              texto: '🌴',
            },
            {
              etiqueta: 'mar',
              texto: '🌊',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'cerdo',
                texto: '🐷',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'mono',
                texto: '🐒',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'pez',
                texto: '🐟',
              },
              grupo: 2,
            },
            {
              cara: {
                etiqueta: 'gallina',
                texto: '🐔',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'león',
                texto: '🦁',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'pulpo',
                texto: '🐙',
              },
              grupo: 2,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#43',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'bus',
            texto: '🚌',
          },
          opciones: [
            {
              etiqueta: 'bus',
              texto: '🚌',
            },
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
            {
              etiqueta: 'moto',
              texto: '🏍',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'barco',
            texto: '⛵',
          },
          opciones: [
            {
              etiqueta: 'avión',
              texto: '✈️',
            },
            {
              etiqueta: 'barco',
              texto: '⛵',
            },
            {
              etiqueta: 'tren',
              texto: '🚂',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Cuál es igual?',
          estimulo: {
            etiqueta: 'bicicleta',
            texto: '🚲',
          },
          opciones: [
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
            {
              etiqueta: 'bus',
              texto: '🚌',
            },
            {
              etiqueta: 'bicicleta',
              texto: '🚲',
            },
          ],
          respuesta: 2,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#44',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Va por tierra, por agua o por aire?',
          grupos: [
            {
              etiqueta: 'tierra',
              texto: '🛣',
            },
            {
              etiqueta: 'agua',
              texto: '🌊',
            },
            {
              etiqueta: 'aire',
              texto: '☁️',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'carro',
                texto: '🚗',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'barco',
                texto: '⛵',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'avión',
                texto: '✈️',
              },
              grupo: 2,
            },
            {
              cara: {
                etiqueta: 'tren',
                texto: '🚂',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'canoa',
                texto: '🛶',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'helicóptero',
                texto: '🚁',
              },
              grupo: 2,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#45',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'carro',
              texto: '🚗',
            },
            {
              etiqueta: 'avión',
              texto: '✈️',
            },
            {
              etiqueta: 'barco',
              texto: '⛵',
            },
            {
              etiqueta: 'bicicleta',
              texto: '🚲',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#46',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Lavarse las manos',
          pasos: [
            {
              etiqueta: 'abrir la llave',
              texto: '🚰',
            },
            {
              etiqueta: 'lavar con jabón',
              texto: '🧼',
            },
            {
              etiqueta: 'secar las manos',
              texto: '🧻',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#47',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Cepillarse los dientes',
          pasos: [
            {
              etiqueta: 'tomar el cepillo',
              texto: '🪥',
            },
            {
              etiqueta: 'cepillar los dientes',
              texto: '😁',
            },
            {
              etiqueta: 'enjuagar la boca',
              texto: '🚰',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#48',
    codigo: 'EMPAREJAR',
    configuracion: {
      rondas: [
        {
          pregunta: '¿Con qué te lavas las manos?',
          estimulo: {
            etiqueta: 'manos',
            texto: '🙌',
          },
          opciones: [
            {
              etiqueta: 'jabón',
              texto: '🧼',
            },
            {
              etiqueta: 'pelota',
              texto: '⚽',
            },
          ],
          respuesta: 0,
        },
        {
          pregunta: '¿Con qué te cepillas los dientes?',
          estimulo: {
            etiqueta: 'dientes',
            texto: '😁',
          },
          opciones: [
            {
              etiqueta: 'cuchara',
              texto: '🥄',
            },
            {
              etiqueta: 'cepillo',
              texto: '🪥',
            },
          ],
          respuesta: 1,
        },
        {
          pregunta: '¿Con qué te bañas?',
          estimulo: {
            etiqueta: 'baño',
            texto: '🛁',
          },
          opciones: [
            {
              etiqueta: 'ducha',
              texto: '🚿',
            },
            {
              etiqueta: 'libro',
              texto: '📖',
            },
          ],
          respuesta: 0,
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#49',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Vestirse',
          pasos: [
            {
              etiqueta: 'ropa interior',
              texto: '🩲',
            },
            {
              etiqueta: 'camiseta',
              texto: '👕',
            },
            {
              etiqueta: 'pantalón',
              texto: '👖',
            },
            {
              etiqueta: 'medias',
              texto: '🧦',
            },
            {
              etiqueta: 'zapatos',
              texto: '👟',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#50',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Es para el frío o para el calor?',
          grupos: [
            {
              etiqueta: 'frío',
              texto: '❄️',
            },
            {
              etiqueta: 'calor',
              texto: '☀️',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'bufanda',
                texto: '🧣',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'pantaloneta',
                texto: '🩳',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'guantes',
                texto: '🧤',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'gafas de sol',
                texto: '🕶',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'abrigo',
                texto: '🧥',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'chanclas',
                texto: '🩴',
              },
              grupo: 1,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#51',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Hacer un sándwich',
          pasos: [
            {
              etiqueta: 'tomar el pan',
              texto: '🍞',
            },
            {
              etiqueta: 'untar mantequilla',
              texto: '🧈',
            },
            {
              etiqueta: 'poner queso',
              texto: '🧀',
            },
            {
              etiqueta: 'cerrar el sándwich',
              texto: '🥪',
            },
            {
              etiqueta: '¡a comer!',
              texto: '😋',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#52',
    codigo: 'SECUENCIAR',
    configuracion: {
      rutinas: [
        {
          titulo: 'Servir el cereal',
          pasos: [
            {
              etiqueta: 'tomar el plato',
              texto: '🥣',
            },
            {
              etiqueta: 'echar el cereal',
              texto: '🌾',
            },
            {
              etiqueta: 'echar la leche',
              texto: '🥛',
            },
            {
              etiqueta: 'comer con la cuchara',
              texto: '🥄',
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#53',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Se come o no se come?',
          grupos: [
            {
              etiqueta: 'se come',
              texto: '😋',
            },
            {
              etiqueta: 'no se come',
              texto: '🚫',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'pan',
                texto: '🍞',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'llave',
                texto: '🔑',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'huevo',
                texto: '🥚',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'lápiz',
                texto: '✏️',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'queso',
                texto: '🧀',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'tijeras',
                texto: '✂️',
              },
              grupo: 1,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#54',
    codigo: 'CLASIFICAR',
    configuracion: {
      conjuntos: [
        {
          pregunta: '¿Va en la cocina, el baño o la habitación?',
          grupos: [
            {
              etiqueta: 'cocina',
              texto: '🍳',
            },
            {
              etiqueta: 'baño',
              texto: '🚽',
            },
            {
              etiqueta: 'habitación',
              texto: '🛏',
            },
          ],
          elementos: [
            {
              cara: {
                etiqueta: 'olla',
                texto: '🍲',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'ducha',
                texto: '🚿',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'oso de peluche',
                texto: '🧸',
              },
              grupo: 2,
            },
            {
              cara: {
                etiqueta: 'cuchara',
                texto: '🥄',
              },
              grupo: 0,
            },
            {
              cara: {
                etiqueta: 'jabón',
                texto: '🧼',
              },
              grupo: 1,
            },
            {
              cara: {
                etiqueta: 'lámpara',
                texto: '💡',
              },
              grupo: 2,
            },
          ],
        },
      ],
    },
  },
  {
    origen: 'sembrar_modulos.sql#55',
    codigo: 'MEMORIA',
    configuracion: {
      tableros: [
        {
          parejas: [
            {
              etiqueta: 'casa',
              texto: '🏠',
            },
            {
              etiqueta: 'puerta',
              texto: '🚪',
            },
            {
              etiqueta: 'silla',
              texto: '🪑',
            },
            {
              etiqueta: 'llave',
              texto: '🔑',
            },
            {
              etiqueta: 'reloj',
              texto: '⏰',
            },
          ],
        },
      ],
    },
  },
];
