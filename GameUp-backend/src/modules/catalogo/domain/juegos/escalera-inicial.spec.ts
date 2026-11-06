import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RegistroJuegosService } from '../../application/registro-juegos.service.js';
import type { Configuracion } from './estrategia-juego.js';
import { estrategiasDelMvp } from './estrategias.js';
import { JUEGOS_CON_ESCALERA } from './niveles-juego.js';

/**
 * Las 20 actividades de prisma/scripts/sembrar_escalera.sql (se ejecuta a
 * mano en Supabase) cumplen las reglas de su juego y de su nivel. Si alguien
 * edita el script, esta prueba lo vigila.
 */
const SCRIPT = readFileSync(
  join(process.cwd(), 'prisma', 'scripts', 'sembrar_escalera.sql'),
  'utf-8',
);

interface NivelSembrado {
  codigo: string;
  nivel: number;
  titulo: string;
  configuracion: Configuracion;
}

/** ('MEMORIA', 1, 'Memoria · nivel 1', $j${...}$j$) */
const PATRON = /\('([A-Z_]+)', (\d), '([^']+)', \$j\$([\s\S]*?)\$j\$\)/g;

const sembrados: NivelSembrado[] = [...SCRIPT.matchAll(PATRON)].map((m) => ({
  codigo: m[1]!,
  nivel: Number(m[2]),
  titulo: m[3]!,
  configuracion: JSON.parse(m[4]!) as Configuracion,
}));

const registro = new RegistroJuegosService(estrategiasDelMvp());

/** Todas las caras de una configuración (cualquier objeto con etiqueta). */
function caras(
  valor: unknown,
  ruta = '',
): Array<{ ruta: string; cara: Configuracion }> {
  if (Array.isArray(valor))
    return valor.flatMap((v, i) => caras(v, `${ruta}[${i}]`));
  if (typeof valor !== 'object' || valor === null) return [];
  const obj = valor as Configuracion;
  if (typeof obj['etiqueta'] === 'string') return [{ ruta, cara: obj }];
  return Object.entries(obj).flatMap(([k, v]) => caras(v, `${ruta}.${k}`));
}

describe('siembra inicial de la escalera (sembrar_escalera.sql)', () => {
  it('trae los 5 niveles de cada juego con escalera, sin repetir', () => {
    expect(sembrados).toHaveLength(20);
    for (const codigo of JUEGOS_CON_ESCALERA) {
      expect(
        sembrados.filter((s) => s.codigo === codigo).map((s) => s.nivel),
      ).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it.each(sembrados.map((s) => [s.titulo, s] as const))(
    '%s cumple su juego y su nivel',
    (_titulo, s) => {
      const estrategia = registro.estrategia(s.codigo);
      const validada = estrategia.validarConfiguracion(s.configuracion);
      expect(() =>
        estrategia.validarNivel(validada.configuracion, s.nivel),
      ).not.toThrow();
      // Sin imágenes del bucket: no cita contenidos.
      expect(validada.elementos).toEqual([]);
    },
  );

  it('cada dibujo es un emoji (la app dibuja un texto de 1 o 2 caracteres)', () => {
    for (const s of sembrados) {
      for (const { ruta, cara } of caras(s.configuracion)) {
        // La palabra de arriba de Emparejar 4 y 5 es texto a propósito.
        const esPalabra =
          s.codigo === 'EMPAREJAR' &&
          s.nivel >= 4 &&
          ruta.endsWith('.estimulo');
        const texto = cara['texto'] as string;
        if (esPalabra) {
          expect(texto, `${s.titulo} ${ruta}`).toBe(cara['etiqueta']);
        } else {
          expect(
            texto.length,
            `${s.titulo} ${ruta}: «${texto}»`,
          ).toBeLessThanOrEqual(2);
          expect(cara['imagenContenidoId']).toBeUndefined();
        }
      }
    }
  });
});
