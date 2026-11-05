import {
  BadRequestException,
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import { esIdValido } from '../ids/ids.js';

/**
 * Convierte un parámetro de ruta en `bigint`:
 *   @Param('id', ParseBigIntPipe) id: bigint
 * Si no es un entero positivo válido, responde 400.
 */
@Injectable()
export class ParseBigIntPipe implements PipeTransform<unknown, bigint> {
  transform(value: unknown, metadata: ArgumentMetadata): bigint {
    if (!esIdValido(value)) {
      const nombre = metadata.data ?? 'id';
      throw new BadRequestException(
        `${nombre} debe ser un id numérico (entero positivo).`,
      );
    }
    return BigInt(value);
  }
}
