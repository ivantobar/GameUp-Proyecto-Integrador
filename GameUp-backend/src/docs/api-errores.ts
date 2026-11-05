import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiServiceUnavailableResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErrorRespuestaDto } from '../common/errors/error-respuesta.dto.js';

/** Códigos de error que puede documentar un endpoint. */
export type CodigoError = 400 | 401 | 403 | 404 | 409 | 422 | 503;

const DECORADOR: Record<
  CodigoError,
  (opciones: {
    description: string;
    type: typeof ErrorRespuestaDto;
  }) => MethodDecorator & ClassDecorator
> = {
  400: ApiBadRequestResponse,
  401: ApiUnauthorizedResponse,
  403: ApiForbiddenResponse,
  404: ApiNotFoundResponse,
  409: ApiConflictResponse,
  422: ApiUnprocessableEntityResponse,
  503: ApiServiceUnavailableResponse,
};

const DESCRIPCION_POR_DEFECTO: Record<CodigoError, string> = {
  400: 'Datos de entrada inválidos',
  401: 'Falta el token, es inválido o venció',
  403: 'Tu rol o tu cuenta no tienen acceso',
  404: 'El recurso no existe (o no te corresponde)',
  409: 'Choca con el estado actual',
  422: 'Rompe una regla de negocio',
  503: 'Una API externa no está disponible',
};

/**
 * Documenta en Swagger las respuestas de error de un endpoint, todas con la
 * forma { statusCode, error, message }.
 *   @ApiErrores(400, 401, 403)
 *   @ApiErrores({ 401: 'Correo o contraseña incorrectos' }, 503)
 */
export function ApiErrores(
  ...codigos: Array<CodigoError | Partial<Record<CodigoError, string>>>
): MethodDecorator & ClassDecorator {
  const descripciones = new Map<CodigoError, string>();
  for (const item of codigos) {
    if (typeof item === 'number') {
      descripciones.set(item, DESCRIPCION_POR_DEFECTO[item]);
    } else {
      for (const [codigo, texto] of Object.entries(item)) {
        descripciones.set(Number(codigo) as CodigoError, texto);
      }
    }
  }
  return applyDecorators(
    ...[...descripciones].map(([codigo, description]) =>
      DECORADOR[codigo]({ description, type: ErrorRespuestaDto }),
    ),
  );
}
