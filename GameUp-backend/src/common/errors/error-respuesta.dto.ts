import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Forma de toda respuesta de error (para Swagger). La produce
 * `FiltroErroresGlobal`.
 */
export class ErrorRespuestaDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({
    example: 'El recurso no existe.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    description:
      'Texto para la persona. En los 400 de validación es una lista.',
  })
  message: string | string[];

  @ApiPropertyOptional({
    example: 'CONSENTIMIENTO_RETIRADO',
    description:
      'Solo en algunos errores: identificador fijo para que la app reconozca el caso sin leer el texto. ' +
      'Hoy: CONSENTIMIENTO_RETIRADO (403 de GET /intentos/{id}/grabacion).',
  })
  codigo?: string;
}
