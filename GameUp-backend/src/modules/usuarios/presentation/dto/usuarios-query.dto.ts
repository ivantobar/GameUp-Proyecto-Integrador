import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import {
  ROLES_GAMEUP,
  type RolGameUp,
} from '../../../../common/auth/usuario-autenticado.js';
import { PaginacionQueryDto } from '../../../../common/paginacion/paginacion.js';

/** "true"/"false" de la query → boolean (cualquier otro valor lo rechaza IsBoolean). */
const aBooleano = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

/** GET /usuarios?rol=TALLERISTA&activo=true&page=1&limit=20 */
export class ListarUsuariosQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ enum: ROLES_GAMEUP, example: 'TALLERISTA' })
  @IsOptional()
  @IsIn(ROLES_GAMEUP)
  rol?: RolGameUp;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean()
  activo?: boolean;
}

export class CambiarEstadoUsuarioDto {
  @ApiProperty({
    example: false,
    description: 'false desactiva la cuenta (403 al entrar)',
  })
  @IsBoolean()
  activo: boolean;
}
