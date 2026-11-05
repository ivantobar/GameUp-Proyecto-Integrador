import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from '../../../../common/paginacion/paginacion.js';
import {
  TIPOS_NOTIFICACION,
  type TipoNotificacion,
} from '../../domain/notificacion.entity.js';

/** "true"/"false" de la query → boolean (cualquier otro valor lo rechaza IsBoolean). */
const aBooleano = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

// ─── Entrada ────────────────────────────────────────────────────────────────

/** GET /notificaciones?leida=false&page=1&limit=20 */
export class ListarNotificacionesQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({
    example: false,
    description: 'false: solo las no leídas. Sin el filtro: todas.',
  })
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean()
  leida?: boolean;
}

// ─── Salida ─────────────────────────────────────────────────────────────────

export class NotificacionDto {
  @ApiProperty({ example: '15' }) id: string;
  @ApiProperty({ enum: TIPOS_NOTIFICACION, example: 'OBSERVACION' })
  tipo: TipoNotificacion;
  @ApiProperty({ example: 'Hay una nueva observación sobre Martín José.' })
  mensaje: string;
  @ApiProperty({ example: false }) leida: boolean;
  @ApiProperty({ example: '2026-11-05T15:00:00.000Z' }) fecha: string;
}

export class PaginaNotificacionesDto {
  @ApiProperty({ type: [NotificacionDto] }) items: NotificacionDto[];
  @ApiProperty({ example: 3 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
  @ApiProperty({
    example: 2,
    description: 'No leídas en total (sin importar el filtro)',
  })
  noLeidas: number;
}

export class NotificacionesMarcadasDto {
  @ApiProperty({ example: 2, description: 'Cuántas pasaron a leídas' })
  marcadas: number;
}
