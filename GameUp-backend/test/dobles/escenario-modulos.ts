import { randomUUID } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ArchivoSubido } from '../../src/common/almacenamiento/almacen-archivos.js';
import { BYTES_CABECERA } from '../../src/common/almacenamiento/subidas.js';
import { escenarioEstudiantes } from './escenario-estudiantes.js';
import {
  AlmacenEnMemoria,
  CatalogoEnMemoria,
  ModulosEnMemoria,
} from './modulos-en-memoria.js';

/** Bytes mínimos con la firma real de cada formato (archivos ficticios). */
export const ARCHIVOS = {
  png: Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(16),
  ]),
  jpeg: Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.alloc(16),
  ]),
  webp: Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.alloc(4),
    Buffer.from('WEBP'),
    Buffer.alloc(8),
  ]),
  mp4: Buffer.concat([
    Buffer.from([0, 0, 0, 0x18]),
    Buffer.from('ftypisom'),
    Buffer.alloc(16),
  ]),
  m4a: Buffer.concat([
    Buffer.from([0, 0, 0, 0x18]),
    Buffer.from('ftypM4A '),
    Buffer.alloc(16),
  ]),
  mp3: Buffer.concat([Buffer.from('ID3'), Buffer.alloc(16)]),
  /** Un "ejecutable" que dice ser un video. */
  falso: Buffer.from('MZ\x90\x00 esto no es un video'),
};

/**
 * Escenario de la fase 4 sobre el de estudiantes (ver escenario-estudiantes):
 *   Módulo 1 «Vocal A»: de la tallerista 2, PUBLICADO, asignado al estudiante 10.
 *       Actividad HABLA_CONMIGO activa y una MEMORIA inactiva.
 *       Contenidos: una IMAGEN y un VIDEO (con archivo en Storage).
 *   Módulo 2: borrador de la tallerista 3.
 *   Módulo 3: borrador de la directora (sin actividades).
 */
export function escenarioModulos() {
  const { usuarios, estudiantes } = escenarioEstudiantes();
  const catalogo = new CatalogoEnMemoria();
  const almacen = new AlmacenEnMemoria();
  const modulos = new ModulosEnMemoria(usuarios, estudiantes, catalogo, [
    { id: 1, creadoPor: 2, publicado: true, nombre: 'Vocal A' },
    { id: 2, creadoPor: 3, nombre: 'Borrador de Tomás' },
    { id: 3, creadoPor: 1, nombre: 'Borrador de la directora' },
  ]);
  modulos.asignar(1, 10);
  const habla = modulos.agregarActividad(1, 'HABLA_CONMIGO');
  const inactiva = modulos.agregarActividad(1, 'MEMORIA', false);
  const imagen = modulos.agregarContenido(1, 'IMAGEN', 'Avión');
  const video = modulos.agregarContenido(1, 'VIDEO', 'Mira la a');
  for (const c of [imagen, video]) {
    almacen.guardar('contenidos', c.ruta, ARCHIVOS.png, 'image/png');
  }
  return {
    usuarios,
    estudiantes,
    catalogo,
    almacen,
    modulos,
    ids: {
      habla: habla.id,
      inactiva: inactiva.id,
      imagen: imagen.id,
      video: video.id,
    },
  };
}

/**
 * Crea un archivo temporal como el que deja multer y devuelve el
 * ArchivoSubido (con su cabecera). Bórralo con `borrarTemporales()`.
 */
const temporales: string[] = [];

export async function archivoTemporal(
  bytes: Buffer,
  mimetype: string,
): Promise<ArchivoSubido> {
  const path = join(tmpdir(), `gameup-prueba-${randomUUID()}`);
  await writeFile(path, bytes);
  temporales.push(path);
  return {
    path,
    cabecera: bytes.subarray(0, BYTES_CABECERA),
    mimetype,
    size: bytes.length,
    originalname: 'archivo',
  };
}

export async function borrarTemporales(): Promise<void> {
  await Promise.all(temporales.splice(0).map((p) => rm(p, { force: true })));
}
