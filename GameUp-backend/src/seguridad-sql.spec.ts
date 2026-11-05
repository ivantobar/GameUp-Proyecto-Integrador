import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Guardia de seguridad: el SQL crudo solo se escribe con plantillas
 * etiquetadas ($queryRaw`...${valor}...` / $executeRaw`...`), que Prisma envía
 * con parámetros ($1, $2...). Las variantes *Unsafe aceptan texto armado a
 * mano y abren la puerta a inyección SQL: están prohibidas.
 */
const RAIZ = join(import.meta.dirname, '..');
const CARPETAS = ['src', 'test'];
const IGNORAR = [join('src', 'generated')];

function archivosTs(carpeta: string): string[] {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(carpeta, e.name);
    if (IGNORAR.some((i) => relative(RAIZ, ruta).startsWith(i))) return [];
    if (e.isDirectory()) return archivosTs(ruta);
    return e.name.endsWith('.ts') && ruta !== import.meta.filename
      ? [ruta]
      : [];
  });
}

describe('SQL crudo seguro', () => {
  it('nadie usa $queryRawUnsafe ni $executeRawUnsafe', () => {
    const usos = CARPETAS.flatMap((c) => archivosTs(join(RAIZ, c))).filter(
      (ruta) => /\$(query|execute)RawUnsafe/.test(readFileSync(ruta, 'utf8')),
    );
    expect(usos.map((r) => relative(RAIZ, r))).toEqual([]);
  });

  it('las consultas crudas son plantillas etiquetadas, no llamadas con texto', () => {
    const llamadas = CARPETAS.flatMap((c) => archivosTs(join(RAIZ, c))).filter(
      (ruta) =>
        /\$(query|execute)Raw(<[^`(]*>)?\(/.test(readFileSync(ruta, 'utf8')),
    );
    expect(llamadas.map((r) => relative(RAIZ, r))).toEqual([]);
  });
});
