import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { lastValueFrom, of, throwError } from 'rxjs';
import type { ArchivoSubido } from './almacen-archivos.js';
import {
  AlmacenamientoTemporalEnDisco,
  BorrarArchivoTemporalInterceptor,
  BYTES_CABECERA,
  DIRECTORIO_SUBIDAS,
} from './subidas.js';

const solicitud = {} as Request;

/** Corre _handleFile con un stream que llega en varios trozos. */
function guardar(trozos: Buffer[]): Promise<Partial<ArchivoSubido>> {
  const motor = new AlmacenamientoTemporalEnDisco();
  return new Promise((resolve, reject) => {
    motor._handleFile(
      solicitud,
      { stream: Readable.from(trozos) },
      (error, info) => (error ? reject(error) : resolve(info ?? {})),
    );
  });
}

function borrar(info: Partial<ArchivoSubido>): Promise<void> {
  const motor = new AlmacenamientoTemporalEnDisco();
  return new Promise((resolve, reject) =>
    motor._removeFile(solicitud, info, (e) => (e ? reject(e) : resolve())),
  );
}

describe('AlmacenamientoTemporalEnDisco', () => {
  it('escribe el archivo completo en la carpeta temporal, con nombre aleatorio', async () => {
    const info = await guardar([Buffer.from('hola '), Buffer.from('mundo')]);
    expect(info.path?.startsWith(DIRECTORIO_SUBIDAS)).toBe(true);
    expect(info.size).toBe(10);
    expect(await readFile(info.path!, 'utf8')).toBe('hola mundo');
    await borrar(info);
    expect(existsSync(info.path!)).toBe(false);
  });

  it('guarda solo los primeros bytes como cabecera, aunque lleguen en trozos', async () => {
    const trozos = [
      Buffer.alloc(10, 1),
      Buffer.alloc(100, 2),
      Buffer.alloc(1000, 3),
    ];
    const info = await guardar(trozos);
    expect(info.cabecera).toHaveLength(BYTES_CABECERA);
    expect(info.cabecera?.subarray(0, 10)).toEqual(Buffer.alloc(10, 1));
    expect(info.cabecera?.subarray(10)).toEqual(
      Buffer.alloc(BYTES_CABECERA - 10, 2),
    );
    expect((await stat(info.path!)).size).toBe(1110);
    await borrar(info);
  });

  it('_removeFile sin ruta no falla', async () => {
    await expect(borrar({})).resolves.toBeUndefined();
  });
});

describe('BorrarArchivoTemporalInterceptor', () => {
  const interceptor = new BorrarArchivoTemporalInterceptor();

  function contexto(file?: Partial<ArchivoSubido>): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ file }) }),
    } as unknown as ExecutionContext;
  }

  it('borra el temporal cuando la petición sale bien', async () => {
    const info = await guardar([Buffer.from('x')]);
    const siguiente: CallHandler = { handle: () => of('ok') };
    await lastValueFrom(interceptor.intercept(contexto(info), siguiente));
    // Sin esperar: el interceptor ya terminó de borrar al responder.
    expect(existsSync(info.path!)).toBe(false);
  });

  it('borra el temporal también cuando el controlador falla', async () => {
    const info = await guardar([Buffer.from('x')]);
    const siguiente: CallHandler = {
      handle: () => throwError(() => new Error('falló')),
    };
    await expect(
      lastValueFrom(interceptor.intercept(contexto(info), siguiente)),
    ).rejects.toThrow('falló');
    // Sin esperar: el interceptor ya terminó de borrar al responder.
    expect(existsSync(info.path!)).toBe(false);
  });

  it('sin archivo no hace nada', async () => {
    const siguiente: CallHandler = { handle: () => of('ok') };
    await expect(
      lastValueFrom(interceptor.intercept(contexto(), siguiente)),
    ).resolves.toBe('ok');
  });
});
