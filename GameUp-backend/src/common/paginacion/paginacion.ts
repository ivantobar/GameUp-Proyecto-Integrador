import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const LIMITE_MAXIMO = 50;
export const LIMITE_POR_DEFECTO = 20;

/** Query de los listados que pueden crecer: ?page=1&limit=20 (máximo 50). */
export class PaginacionQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: LIMITE_POR_DEFECTO,
    minimum: 1,
    maximum: LIMITE_MAXIMO,
    default: LIMITE_POR_DEFECTO,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO)
  limit: number = LIMITE_POR_DEFECTO;
}

/** Paginación que reciben los servicios y repositorios (sin HTTP). */
export interface Paginacion {
  page: number;
  limit: number;
}

/** Una página de resultados. */
export interface Pagina<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Filas a saltar para Prisma (`skip`). */
export function saltar({ page, limit }: Paginacion): number {
  return (page - 1) * limit;
}

/** Convierte los ítems de una página conservando los datos de paginación. */
export function mapearPagina<T, R>(
  pagina: Pagina<T>,
  fn: (item: T) => R,
): Pagina<R> {
  return { ...pagina, items: pagina.items.map(fn) };
}
