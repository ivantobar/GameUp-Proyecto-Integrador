import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import {
  applyDecorators,
  Injectable,
  Logger,
  UseInterceptors,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { catchError, from, mergeMap, throwError, type Observable } from 'rxjs';
import type { ArchivoSubido } from './almacen-archivos.js';

/**
 * Carpeta de archivos temporales de subida (se vacía al terminar cada
 * petición). Una por proceso: dos procesos (o dos archivos de prueba en
 * paralelo) nunca comparten temporales.
 */
export const DIRECTORIO_SUBIDAS = join(
  tmpdir(),
  `gameup-subidas-${process.pid}`,
);

/** Bytes que se guardan del inicio del archivo para reconocer su formato. */
export const BYTES_CABECERA = 64;

interface ArchivoMulter {
  stream: Readable;
}

type Retorno = (error: Error | null, info?: Partial<ArchivoSubido>) => void;

/**
 * Motor de almacenamiento de multer (interfaz _handleFile/_removeFile) que
 * escribe cada archivo en DIRECTORIO_SUBIDAS con un nombre aleatorio y
 * permisos solo para el proceso. Mientras escribe guarda los primeros bytes
 * (`cabecera`) para comprobar el formato sin volver a leer el archivo.
 *
 * No se usa multer.diskStorage para no agregar @types/multer; el contrato es
 * el mismo. Si multer aborta (p. ej., archivo de más de 50 MB), llama a
 * _removeFile y el archivo parcial se borra.
 */
export class AlmacenamientoTemporalEnDisco {
  _handleFile(_req: Request, archivo: ArchivoMulter, cb: Retorno): void {
    const ruta = join(DIRECTORIO_SUBIDAS, randomUUID());
    mkdir(DIRECTORIO_SUBIDAS, { recursive: true, mode: 0o700 })
      .then(() => {
        const salida = createWriteStream(ruta, { flags: 'wx', mode: 0o600 });
        const trozos: Buffer[] = [];
        let guardados = 0;
        archivo.stream.on('data', (trozo: Buffer) => {
          if (guardados < BYTES_CABECERA) {
            trozos.push(trozo.subarray(0, BYTES_CABECERA - guardados));
            guardados += Math.min(trozo.length, BYTES_CABECERA - guardados);
          }
        });
        archivo.stream.on('error', (error: Error) => salida.destroy(error));
        salida.on('error', (error) => {
          void rm(ruta, { force: true });
          cb(error);
        });
        salida.on('finish', () =>
          cb(null, {
            path: ruta,
            size: salida.bytesWritten,
            cabecera: Buffer.concat(trozos),
          }),
        );
        archivo.stream.pipe(salida);
      })
      .catch((error: Error) => cb(error));
  }

  _removeFile(
    _req: Request,
    archivo: Partial<ArchivoSubido>,
    cb: (error: Error | null) => void,
  ): void {
    if (!archivo.path) return cb(null);
    rm(archivo.path, { force: true }).then(
      () => cb(null),
      (error: Error) => cb(error),
    );
  }
}

/**
 * Borra el archivo temporal al terminar la petición, haya ido bien o mal, y
 * ESPERA a que se borre antes de responder (o de propagar el error).
 */
@Injectable()
export class BorrarArchivoTemporalInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Subidas');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const solicitud = ctx
      .switchToHttp()
      .getRequest<Request & { file?: ArchivoSubido }>();
    const borrar = async (): Promise<void> => {
      const ruta = solicitud.file?.path;
      if (!ruta) return;
      await rm(ruta, { force: true }).catch(() => {
        // Sin la ruta en el log; el directorio temporal es privado.
        this.logger.warn('No se pudo borrar un archivo temporal de subida');
      });
    };
    return next.handle().pipe(
      mergeMap(async (valor: unknown) => {
        await borrar();
        return valor;
      }),
      catchError((error: unknown) =>
        from(borrar()).pipe(mergeMap(() => throwError(() => error))),
      ),
    );
  }
}

/**
 * Subida de UN archivo a disco temporal (nunca en memoria), con límite de
 * tamaño (413 si se pasa) y borrado garantizado del temporal:
 *   @SubidaDeArchivo('archivo', 50 * 1024 * 1024)
 * El primer interceptor envuelve al de multer, así el borrado corre
 * también cuando multer o el controlador fallan.
 */
export function SubidaDeArchivo(campo: string, maximoBytes: number) {
  return applyDecorators(
    UseInterceptors(
      BorrarArchivoTemporalInterceptor,
      FileInterceptor(campo, {
        storage: new AlmacenamientoTemporalEnDisco(),
        limits: { fileSize: maximoBytes, files: 1 },
      }),
    ),
  );
}
