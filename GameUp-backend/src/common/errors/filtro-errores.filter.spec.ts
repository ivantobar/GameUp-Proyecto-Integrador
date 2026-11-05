import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import {
  AccesoDenegadoError,
  ConflictoError,
  NoAutenticadoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
  ServicioExternoNoDisponibleError,
} from './dominio.errors.js';
import { FiltroErroresGlobal } from './filtro-errores.filter.js';

/** Error como lo lanza Prisma 7 + adapter-pg (SQLSTATE en meta.driverAdapterError). */
function errorPrisma(
  code: string,
  sqlState?: string,
  mensajeBase = 'detalle interno id 42',
) {
  return new Prisma.PrismaClientKnownRequestError(mensajeBase, {
    code,
    clientVersion: '7.10.1',
    meta: sqlState
      ? {
          driverAdapterError: {
            name: 'DriverAdapterError',
            cause: {
              kind: 'postgres',
              code: sqlState,
              originalCode: sqlState,
              message: mensajeBase,
            },
          },
        }
      : {},
  });
}

describe('FiltroErroresGlobal', () => {
  const filtro = new FiltroErroresGlobal();
  // Silencia los logs esperados en estas pruebas.
  beforeAll(() => {
    vi.spyOn(filtro['logger'], 'error').mockImplementation(() => undefined);
    vi.spyOn(filtro['logger'], 'warn').mockImplementation(() => undefined);
  });

  it.each([
    [
      new RecursoNoEncontradoError('El estudiante no existe.'),
      404,
      'Not Found',
    ],
    [new AccesoDenegadoError('No puedes.'), 403, 'Forbidden'],
    [
      new ReglaNegocioError('El módulo no está publicado.'),
      422,
      'Unprocessable Entity',
    ],
    [new ConflictoError('Ya se validó.'), 409, 'Conflict'],
    [new NoAutenticadoError(), 401, 'Unauthorized'],
    [
      new ServicioExternoNoDisponibleError('API caída.'),
      503,
      'Service Unavailable',
    ],
  ])('traduce %s', (error, statusCode, nombre) => {
    expect(filtro.traducir(error)).toEqual({
      statusCode,
      error: nombre,
      message: error.message,
    });
  });

  it('conserva la lista de mensajes del ValidationPipe (400)', () => {
    const error = new BadRequestException(['nombre must be a string']);
    expect(filtro.traducir(error)).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: ['nombre must be a string'],
    });
  });

  it('traduce un HttpException de Nest (404)', () => {
    expect(
      filtro.traducir(new NotFoundException('Cannot GET /x')),
    ).toMatchObject({
      statusCode: 404,
      message: 'Cannot GET /x',
    });
  });

  it.each([
    ['P2002', '23505', 409],
    ['P2003', '23503', 422],
    ['P2039', '23514', 422], // CHECK o trigger de regla de negocio
    ['P2010', '23514', 422], // lo mismo desde $queryRaw (ej.: cambiar_nivel)
    ['P2039', '42501', 403], // trigger de vínculo
    ['P2011', '23502', 422],
  ])(
    'traduce el error de base %s/%s → %d sin reenviar el texto de la base',
    (code, sqlState, status) => {
      const respuesta = filtro.traducir(errorPrisma(code, sqlState));
      expect(respuesta.statusCode).toBe(status);
      expect(String(respuesta.message)).not.toContain('42');
      expect(String(respuesta.message)).not.toContain('detalle');
    },
  );

  it('usa el código de Prisma si no viene el SQLSTATE', () => {
    expect(filtro.traducir(errorPrisma('P2002')).statusCode).toBe(409);
  });

  it('P2025 (registro inexistente) → 404', () => {
    expect(filtro.traducir(errorPrisma('P2025')).statusCode).toBe(404);
  });

  it('un error de conexión de Prisma (P1xxx) → 503', () => {
    expect(filtro.traducir(errorPrisma('P1001')).statusCode).toBe(503);
  });

  it('un error de base sin traducción → 500 genérico', () => {
    const respuesta = filtro.traducir(errorPrisma('P2039', '99999'));
    expect(respuesta.statusCode).toBe(500);
    expect(respuesta.message).not.toContain('detalle');
  });

  it('un error cualquiera → 500 sin traza ni mensaje interno', () => {
    const respuesta = filtro.traducir(
      new Error('select * from usuario where ...'),
    );
    expect(respuesta).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ocurrió un error inesperado. Intenta de nuevo.',
    });
  });

  it('algo que no es un Error → 500', () => {
    expect(filtro.traducir('texto').statusCode).toBe(500);
  });
});
