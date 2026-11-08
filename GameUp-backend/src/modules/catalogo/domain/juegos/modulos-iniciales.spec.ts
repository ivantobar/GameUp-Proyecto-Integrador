import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RegistroJuegosService } from '../../application/registro-juegos.service.js';
import type { Configuracion } from './estrategia-juego.js';
import { estrategiasDelMvp } from './estrategias.js';

/**
 * Las actividades de prisma/scripts/sembrar_modulos.sql (se ejecuta a mano en
 * Supabase) cumplen las reglas de su juego. Si alguien edita el script, esta
 * prueba lo vigila.
 */
const SCRIPT = readFileSync(
  join(process.cwd(), 'prisma', 'scripts', 'sembrar_modulos.sql'),
  'utf-8',
);

/** ('A', 'VOCALES', 'BAJO', 'La A', ...) */
const PATRON_MODULO =
  /\('([A-Z]+)',\s+'(VOCALES|JUEGOS)',\s+'(BAJO|MEDIO|ALTO)',\s+'([^']+)'/g;
/** ('A', 'HABLA_CONMIGO', 'Di la A', $j${...}$j$) */
const PATRON_ACTIVIDAD =
  /\('([A-Z]+)', '([A-Z_]+)', '([^']+)', \$j\$([\s\S]*?)\$j\$\)/g;

const modulos = [...SCRIPT.matchAll(PATRON_MODULO)].map((m) => ({
  clave: m[1]!,
  categoria: m[2]!,
  nombre: m[4]!,
}));

const actividades = [...SCRIPT.matchAll(PATRON_ACTIVIDAD)].map((m) => ({
  clave: m[1]!,
  codigo: m[2]!,
  titulo: m[3]!,
  configuracion: JSON.parse(m[4]!) as Configuracion,
}));

const registro = new RegistroJuegosService(estrategiasDelMvp());

/** Todas las caras de una configuración (cualquier objeto con etiqueta). */
function caras(valor: unknown): Configuracion[] {
  if (Array.isArray(valor)) return valor.flatMap(caras);
  if (typeof valor !== 'object' || valor === null) return [];
  const obj = valor as Configuracion;
  if (typeof obj['etiqueta'] === 'string') return [obj];
  return Object.values(obj).flatMap(caras);
}

describe('catálogo inicial de módulos (sembrar_modulos.sql)', () => {
  it('trae 16 módulos con nombre único', () => {
    expect(modulos).toHaveLength(16);
    expect(new Set(modulos.map((m) => m.nombre)).size).toBe(16);
    expect(new Set(modulos.map((m) => m.clave)).size).toBe(16);
  });

  it('cada módulo tiene al menos 2 actividades, sin títulos repetidos', () => {
    for (const m of modulos) {
      const propias = actividades.filter((a) => a.clave === m.clave);
      expect(propias.length, m.nombre).toBeGreaterThanOrEqual(2);
      expect(new Set(propias.map((a) => a.titulo)).size, m.nombre).toBe(
        propias.length,
      );
    }
    // Ninguna actividad apunta a un módulo que no existe.
    const claves = new Set(modulos.map((m) => m.clave));
    for (const a of actividades)
      expect(claves.has(a.clave), a.titulo).toBe(true);
  });

  it('los juegos de habla solo están en módulos de vocales (MVP)', () => {
    const vocales = new Set(
      modulos.filter((m) => m.categoria === 'VOCALES').map((m) => m.clave),
    );
    for (const a of actividades) {
      if (a.codigo === 'HABLA_CONMIGO' || a.codigo === 'BUSCA_LA_BOCA') {
        expect(vocales.has(a.clave), a.titulo).toBe(true);
      }
    }
  });

  it.each(actividades.map((a) => [`${a.clave} · ${a.titulo}`, a] as const))(
    '%s cumple las reglas de su juego',
    (_nombre, a) => {
      const validada = registro
        .estrategia(a.codigo)
        .validarConfiguracion(a.configuracion);
      // Sin imágenes del bucket: no cita contenidos.
      expect(validada.elementos ?? []).toEqual([]);
    },
  );

  it('cada dibujo es un emoji o una letra (1 o 2 caracteres)', () => {
    for (const a of actividades) {
      for (const cara of caras(a.configuracion)) {
        const texto = cara['texto'] as string;
        expect(texto.length, `${a.titulo}: «${texto}»`).toBeLessThanOrEqual(2);
        expect(cara['imagenContenidoId']).toBeUndefined();
      }
    }
  });
});
