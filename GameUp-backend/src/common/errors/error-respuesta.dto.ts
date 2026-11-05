import { ApiProperty } from '@nestjs/swagger';

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
}
