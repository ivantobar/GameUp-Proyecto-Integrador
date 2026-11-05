import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AccesoDenegadoError,
  ConflictoError,
  ErrorDominio,
  NoAutenticadoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
  ServicioExternoNoDisponibleError,
} from './dominio.errors.js';
import {
  esErrorPrismaConocido,
  traducirErrorBaseDatos,
} from './errores-base-datos.js';

/** Forma única de todas las respuestas de error de la API. */
export interface RespuestaError {
  statusCode: number;
  error: string;
  /** Texto para la persona. Los errores de validación (400) traen una lista. */
  message: string | string[];
}

const NOMBRE_ESTADO: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

function respuesta(
  statusCode: number,
  message: string | string[],
): RespuestaError {
  return {
    statusCode,
    error: NOMBRE_ESTADO[statusCode] ?? 'Error',
    message,
  };
}

/** Orden importa: clase de error de dominio → código HTTP. */
const ESTADO_POR_ERROR_DOMINIO: ReadonlyArray<
  [abstract new (...args: never[]) => ErrorDominio, number]
> = [
  [RecursoNoEncontradoError, 404],
  [AccesoDenegadoError, 403],
  [ReglaNegocioError, 422],
  [ConflictoError, 409],
  [NoAutenticadoError, 401],
  [ServicioExternoNoDisponibleError, 503],
];

const MENSAJE_INESPERADO = 'Ocurrió un error inesperado. Intenta de nuevo.';

/**
 * Filtro global de errores. Traduce:
 *  - errores de dominio (`common/errors/dominio.errors.ts`) → 404/403/422/409/401/503;
 *  - errores de la base (Prisma/PostgreSQL) → 409/422/403/404, sin reenviar
 *    el texto de la base (trae ids internos);
 *  - HttpException de Nest (ValidationPipe, rutas inexistentes...) → su código;
 *  - cualquier otro → 500 con un mensaje genérico.
 *
 * Nunca devuelve trazas, SQL ni datos de otros estudiantes.
 */
@Catch()
export class FiltroErroresGlobal implements ExceptionFilter {
  private readonly logger = new Logger('Errores');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const cuerpo = this.traducir(exception);
    res.status(cuerpo.statusCode).json(cuerpo);
  }

  traducir(exception: unknown): RespuestaError {
    if (exception instanceof ErrorDominio) {
      const estado =
        ESTADO_POR_ERROR_DOMINIO.find(
          ([clase]) => exception instanceof clase,
        )?.[1] ?? 500;
      if (estado === 500) this.registrar(exception);
      return respuesta(
        estado,
        estado === 500 ? MENSAJE_INESPERADO : exception.message,
      );
    }

    if (exception instanceof HttpException) {
      const estado = exception.getStatus();
      const cuerpo = exception.getResponse();
      const mensaje =
        typeof cuerpo === 'string'
          ? cuerpo
          : ((cuerpo as { message?: string | string[] }).message ??
            exception.message);
      if (estado >= 500) this.registrar(exception);
      return respuesta(estado, estado >= 500 ? MENSAJE_INESPERADO : mensaje);
    }

    const deBaseDatos = traducirErrorBaseDatos(exception);
    if (deBaseDatos) {
      // Solo el código: el mensaje de la base puede traer ids o valores.
      this.logger.warn(`Error de base de datos ${deBaseDatos.codigo}`);
      return respuesta(deBaseDatos.status, deBaseDatos.message);
    }

    if (esBaseDatosNoDisponible(exception)) {
      this.logger.error('La base de datos no responde');
      return respuesta(
        503,
        'La base de datos no está disponible en este momento.',
      );
    }

    if (esErrorPrismaConocido(exception)) {
      this.logger.error(
        `Error de base de datos sin traducir ${exception.code}`,
      );
      return respuesta(500, MENSAJE_INESPERADO);
    }

    this.registrar(exception);
    return respuesta(500, MENSAJE_INESPERADO);
  }

  private registrar(exception: unknown): void {
    if (exception instanceof Error) {
      this.logger.error(
        `${exception.name}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Error desconocido (no es una instancia de Error)');
    }
  }
}

function esBaseDatosNoDisponible(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === 'PrismaClientInitializationError') return true;
  // P1xxx: errores de conexión de Prisma.
  return esErrorPrismaConocido(err) && err.code.startsWith('P1');
}
